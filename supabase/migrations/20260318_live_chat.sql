-- Live chat: sessions + messages with Supabase Realtime
-- Run this in the Supabase SQL Editor or via supabase db push

-- ============================================================
-- 1. Chat sessions
-- ============================================================
create table if not exists chat_sessions (
  id            uuid primary key default gen_random_uuid(),
  -- Authenticated patients get linked; anonymous visitors use visitor_id
  patient_id    uuid references auth.users(id) on delete set null,
  visitor_id    text,              -- random ID stored in sessionStorage for anonymous users
  visitor_name  text,              -- name the visitor provided
  status        text not null default 'active'
                  check (status in ('active', 'closed')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- Last message preview for the admin list
  last_message  text,
  unread_count  int not null default 0
);

-- Index for admin: list active sessions sorted by recency
create index if not exists idx_chat_sessions_status_updated
  on chat_sessions (status, updated_at desc);

-- ============================================================
-- 2. Chat messages
-- ============================================================
create table if not exists chat_messages (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references chat_sessions(id) on delete cascade,
  sender      text not null check (sender in ('patient', 'admin', 'system')),
  -- For admin messages, store who sent it
  admin_id    uuid references auth.users(id) on delete set null,
  content     text not null,
  created_at  timestamptz not null default now()
);

-- Index for fetching messages by session
create index if not exists idx_chat_messages_session
  on chat_messages (session_id, created_at asc);

-- ============================================================
-- 3. Enable Realtime on both tables
-- ============================================================
alter publication supabase_realtime add table chat_sessions;
alter publication supabase_realtime add table chat_messages;

-- ============================================================
-- 4. RLS policies
-- ============================================================
alter table chat_sessions enable row level security;
alter table chat_messages enable row level security;

-- Replace permissive policies from initial prototype.
drop policy if exists "Patients can view own sessions" on chat_sessions;
drop policy if exists "Anyone can create a session" on chat_sessions;
drop policy if exists "Anyone can update own session" on chat_sessions;
drop policy if exists "Anyone can read messages" on chat_messages;
drop policy if exists "Anyone can send messages" on chat_messages;

-- Patients can only work with their own sessions.
-- Admins can read/update all sessions.
create policy "chat_sessions_select_scope"
  on chat_sessions for select
  using (
    patient_id = auth.uid()
    or coalesce((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false)
  );

create policy "chat_sessions_insert_patient_only"
  on chat_sessions for insert
  with check (patient_id = auth.uid());

create policy "chat_sessions_update_scope"
  on chat_sessions for update
  using (
    patient_id = auth.uid()
    or coalesce((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false)
  )
  with check (
    patient_id = auth.uid()
    or coalesce((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false)
  );

-- Messages are visible only inside sessions accessible to the current actor.
create policy "chat_messages_select_scope"
  on chat_messages for select
  using (
    exists (
      select 1
      from chat_sessions cs
      where cs.id = chat_messages.session_id
        and (
          cs.patient_id = auth.uid()
          or coalesce((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false)
        )
    )
  );

-- Patients can send patient messages to their sessions.
-- Admins can send admin/system messages.
create policy "chat_messages_insert_scope"
  on chat_messages for insert
  with check (
    exists (
      select 1
      from chat_sessions cs
      where cs.id = chat_messages.session_id
        and (
          (
            chat_messages.sender = 'patient'
            and cs.patient_id = auth.uid()
          )
          or (
            chat_messages.sender in ('admin', 'system')
            and coalesce((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false)
          )
        )
    )
  );

-- ============================================================
-- 5. Auto-update updated_at + last_message on new message
-- ============================================================
create or replace function update_chat_session_on_message()
returns trigger as $$
begin
  update chat_sessions
  set
    updated_at = now(),
    last_message = NEW.content,
    unread_count = case
      when NEW.sender = 'patient' then unread_count + 1
      else unread_count
    end
  where id = NEW.session_id;
  return NEW;
end;
$$ language plpgsql;

create trigger trg_chat_message_insert
  after insert on chat_messages
  for each row
  execute function update_chat_session_on_message();

-- ============================================================
-- 6. Newsletter subscribers table (referenced by /api/newsletter)
-- ============================================================
create table if not exists newsletter_subscribers (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  is_active     boolean not null default true,
  subscribed_at timestamptz not null default now()
);

alter table newsletter_subscribers enable row level security;

-- Only server (service role) can manage subscribers
create policy "Service role manages subscribers"
  on newsletter_subscribers for all
  using (true);

-- ============================================================
-- 7. Reviews table (referenced by /api/reviews)
-- ============================================================
create table if not exists reviews (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  email            text,
  rating           int not null check (rating between 1 and 5),
  service          text not null,
  doctor           text,
  comment          text not null,
  visit_date       date,
  would_recommend  boolean not null default true,
  status           text not null default 'pending'
                     check (status in ('pending', 'approved', 'rejected')),
  created_at       timestamptz not null default now()
);

create index if not exists idx_reviews_status on reviews (status, created_at desc);

alter table reviews enable row level security;

create policy "Anyone can read approved reviews"
  on reviews for select
  using (status = 'approved');

create policy "Anyone can submit a review"
  on reviews for insert
  with check (true);
