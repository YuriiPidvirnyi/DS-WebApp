-- ============================================================
-- Dental Story — Full Database Schema (idempotent)
-- Safe to run multiple times — drops old policies/triggers first
-- Run in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 0. CLEAN UP — Drop all existing policies, triggers, functions
-- ============================================================

-- Drop triggers (only on tables that always exist; other triggers
-- are removed automatically by DROP TABLE ... CASCADE below)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_chat_session_on_message() CASCADE;

-- Drop all existing RLS policies (safe even if they don't exist)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- Drop tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.chat_sessions CASCADE;
DROP TABLE IF EXISTS public.newsletter_subscribers CASCADE;
DROP TABLE IF EXISTS public.contact_submissions CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.working_hours CASCADE;
DROP TABLE IF EXISTS public.patients CASCADE;
DROP TABLE IF EXISTS public.services CASCADE;
DROP TABLE IF EXISTS public.doctors CASCADE;

-- Drop old enum types if they exist (from init_database.sql)
DROP TYPE IF EXISTS appointment_status CASCADE;
DROP TYPE IF EXISTS service_category CASCADE;

-- ============================================================
-- 1. DOCTORS
-- ============================================================
CREATE TABLE public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  patronymic TEXT,
  specialization TEXT NOT NULL,
  experience_years INTEGER DEFAULT 0,
  education TEXT,
  photo_url TEXT,
  bio TEXT,
  rating DECIMAL(2,1) DEFAULT 0,
  reviews_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "doctors_public_read" ON public.doctors
  FOR SELECT USING (is_active = true);

CREATE POLICY "doctors_admin_all" ON public.doctors
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

-- ============================================================
-- 2. SERVICES
-- ============================================================
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_uk TEXT NOT NULL,
  name_en TEXT,
  name_pl TEXT,
  description_uk TEXT,
  description_en TEXT,
  description_pl TEXT,
  category TEXT NOT NULL,
  price_uah DECIMAL(10,2) NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "services_public_read" ON public.services
  FOR SELECT USING (is_active = true);

CREATE POLICY "services_admin_all" ON public.services
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

-- ============================================================
-- 3. PATIENTS (extends auth.users)
-- ============================================================
CREATE TABLE public.patients (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  patronymic TEXT,
  phone TEXT,
  email TEXT,
  date_of_birth DATE,
  gender TEXT,
  address TEXT,
  medical_notes TEXT,
  total_visits INT DEFAULT 0,
  total_spent_uah INT DEFAULT 0,
  preferred_doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_patients_phone ON public.patients(phone);

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "patients_own_read" ON public.patients
  FOR SELECT USING (
    auth.uid() = id
    OR (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

CREATE POLICY "patients_own_update" ON public.patients
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "patients_own_insert" ON public.patients
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create patient profile on user signup
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.patients (id, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 4. WORKING HOURS
-- ============================================================
CREATE TABLE public.working_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  open_time TIME,
  close_time TIME,
  is_closed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_working_hours_doctor ON public.working_hours(doctor_id);

ALTER TABLE public.working_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "working_hours_public_read" ON public.working_hours
  FOR SELECT USING (true);

CREATE POLICY "working_hours_admin_all" ON public.working_hours
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

-- ============================================================
-- 5. APPOINTMENTS
-- ============================================================
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  patient_name TEXT,
  guest_name TEXT,
  guest_phone TEXT,
  guest_email TEXT,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  end_time TIME,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  notes TEXT,
  source TEXT DEFAULT 'website',
  price_uah DECIMAL(10,2),
  is_paid BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON public.appointments(doctor_id);
CREATE INDEX idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX idx_appointments_status ON public.appointments(status);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "appointments_own_read" ON public.appointments
  FOR SELECT USING (
    auth.uid() = patient_id
    OR (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

CREATE POLICY "appointments_insert_public" ON public.appointments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "appointments_own_update" ON public.appointments
  FOR UPDATE USING (
    auth.uid() = patient_id
    OR (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

-- ============================================================
-- 6. REVIEWS
-- ============================================================
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  service TEXT NOT NULL,
  doctor TEXT,
  comment TEXT NOT NULL,
  visit_date DATE,
  would_recommend BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  is_verified BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reviews_status ON public.reviews(status, created_at DESC);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_public_read" ON public.reviews
  FOR SELECT USING (status = 'approved');

CREATE POLICY "reviews_insert_public" ON public.reviews
  FOR INSERT WITH CHECK (true);

CREATE POLICY "reviews_admin_all" ON public.reviews
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

-- ============================================================
-- 7. CONTACT SUBMISSIONS
-- ============================================================
CREATE TABLE public.contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  subject TEXT,
  message TEXT,
  status TEXT DEFAULT 'new',
  is_read BOOLEAN DEFAULT false,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contact_email ON public.contact_submissions(email);

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contact_insert_public" ON public.contact_submissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "contact_admin_all" ON public.contact_submissions
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

-- ============================================================
-- 8. CHAT SESSIONS (Supabase Realtime)
-- ============================================================
CREATE TABLE public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  visitor_id TEXT,
  visitor_name TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message TEXT,
  unread_count INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_chat_sessions_status_updated
  ON public.chat_sessions(status, updated_at DESC);

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_sessions_read" ON public.chat_sessions
  FOR SELECT USING (
    patient_id = auth.uid()
    OR COALESCE((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false)
  );

CREATE POLICY "chat_sessions_insert" ON public.chat_sessions
  FOR INSERT WITH CHECK (patient_id = auth.uid());

CREATE POLICY "chat_sessions_update" ON public.chat_sessions
  FOR UPDATE
  USING (
    patient_id = auth.uid()
    OR COALESCE((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false)
  )
  WITH CHECK (
    patient_id = auth.uid()
    OR COALESCE((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false)
  );

-- ============================================================
-- 9. CHAT MESSAGES
-- ============================================================
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('patient', 'admin', 'system')),
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_session
  ON public.chat_messages(session_id, created_at ASC);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_messages_read" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.chat_sessions cs
      WHERE cs.id = chat_messages.session_id
        AND (
          cs.patient_id = auth.uid()
          OR COALESCE((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false)
        )
    )
  );

CREATE POLICY "chat_messages_insert" ON public.chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.chat_sessions cs
      WHERE cs.id = chat_messages.session_id
        AND (
          (
            chat_messages.sender = 'patient'
            AND cs.patient_id = auth.uid()
          )
          OR (
            chat_messages.sender IN ('admin', 'system')
            AND COALESCE((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false)
          )
        )
    )
  );

-- Auto-update session on new message
CREATE FUNCTION public.update_chat_session_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chat_sessions
  SET
    updated_at = NOW(),
    last_message = NEW.content,
    unread_count = CASE
      WHEN NEW.sender = 'patient' THEN unread_count + 1
      ELSE unread_count
    END
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_chat_message_insert
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_chat_session_on_message();

-- ============================================================
-- 10. NEWSLETTER SUBSCRIBERS
-- ============================================================
CREATE TABLE public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "newsletter_admin_all" ON public.newsletter_subscribers
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

CREATE POLICY "newsletter_insert_public" ON public.newsletter_subscribers
  FOR INSERT WITH CHECK (true);

-- Allow upsert (re-subscribe) — update only own email row
CREATE POLICY "newsletter_update_public" ON public.newsletter_subscribers
  FOR UPDATE USING (true) WITH CHECK (true);

-- ============================================================
-- 11. ENABLE SUPABASE REALTIME
-- ============================================================
DO $$
BEGIN
  -- Remove first in case they're already added (avoids duplicate error)
  BEGIN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.chat_sessions';
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.chat_messages';
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_sessions';
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages';
END $$;

-- ============================================================
-- 12. SEED DATA — Doctors
-- ============================================================
INSERT INTO public.doctors (first_name, last_name, patronymic, specialization, experience_years, education, bio, rating, reviews_count) VALUES
  ('Олена', 'Коваленко', 'Петрівна', 'Терапевт-стоматолог', 12, 'НМУ ім. О.О. Богомольця, 2012', 'Спеціалізується на лікуванні карієсу, пульпіту та естетичній реставрації зубів.', 4.8, 45),
  ('Андрій', 'Мельник', 'Васильович', 'Хірург-стоматолог', 15, 'НМАПО ім. П.Л. Шупика, 2009', 'Експерт з імплантації та складних хірургічних втручань.', 4.9, 32),
  ('Марія', 'Шевченко', 'Олександрівна', 'Ортодонт', 8, 'УМСА, 2016', 'Спеціаліст з виправлення прикусу, працює з брекетами та елайнерами.', 4.7, 28),
  ('Дмитро', 'Бондаренко', 'Ігорович', 'Ортопед-стоматолог', 10, 'НМУ ім. О.О. Богомольця, 2014', 'Майстер протезування, виготовлення коронок та вінірів.', 4.6, 19);

-- ============================================================
-- 13. SEED DATA — Services (UAH pricing)
-- ============================================================
INSERT INTO public.services (name_uk, name_en, description_uk, description_en, category, price_uah, duration_minutes) VALUES
  ('Консультація стоматолога', 'Dental Consultation', 'Огляд, діагностика, план лікування', 'Examination, diagnosis, treatment plan', 'Консультація', 0, 30),
  ('Лікування карієсу (1 поверхня)', 'Cavity Treatment (1 surface)', 'Лікування початкового карієсу', 'Initial cavity treatment', 'Терапія', 850, 45),
  ('Лікування карієсу (2+ поверхні)', 'Cavity Treatment (2+ surfaces)', 'Лікування середнього та глибокого карієсу', 'Medium and deep cavity treatment', 'Терапія', 1200, 60),
  ('Лікування пульпіту', 'Pulpitis Treatment', 'Ендодонтичне лікування каналів', 'Root canal treatment', 'Терапія', 2500, 90),
  ('Професійна чистка зубів', 'Professional Cleaning', 'Ультразвукова чистка + Air Flow + полірування', 'Ultrasonic cleaning + Air Flow + polishing', 'Гігієна', 1500, 60),
  ('Видалення зуба (просте)', 'Simple Extraction', 'Видалення рухомого зуба', 'Mobile tooth extraction', 'Хірургія', 800, 30),
  ('Видалення зуба (складне)', 'Complex Extraction', 'Видалення зуба мудрості або ретинованого', 'Wisdom or impacted tooth extraction', 'Хірургія', 2000, 60),
  ('Імплантація (Straumann)', 'Dental Implant (Straumann)', 'Встановлення імпланту Straumann (Швейцарія)', 'Straumann implant installation (Switzerland)', 'Імплантація', 25000, 90),
  ('Імплантація (MIS)', 'Dental Implant (MIS)', 'Встановлення імпланту MIS (Ізраїль)', 'MIS implant installation (Israel)', 'Імплантація', 18000, 90),
  ('Металокерамічна коронка', 'Metal-Ceramic Crown', 'Коронка на металевому каркасі', 'Crown on metal frame', 'Ортопедія', 4500, 60),
  ('Цирконієва коронка', 'Zirconia Crown', 'Безметалева коронка з діоксиду цирконію', 'Metal-free zirconia crown', 'Ортопедія', 8000, 60),
  ('Вінір керамічний', 'Ceramic Veneer', 'Керамічна накладка на передній зуб', 'Ceramic overlay for front tooth', 'Ортопедія', 12000, 60),
  ('Брекет-система (металева)', 'Metal Braces', 'Встановлення металевих брекетів на 1 щелепу', 'Metal braces installation (1 jaw)', 'Ортодонтія', 15000, 90),
  ('Брекет-система (керамічна)', 'Ceramic Braces', 'Встановлення керамічних брекетів на 1 щелепу', 'Ceramic braces installation (1 jaw)', 'Ортодонтія', 22000, 90),
  ('Елайнери (курс)', 'Clear Aligners', 'Повний курс лікування елайнерами', 'Full aligner treatment course', 'Ортодонтія', 45000, 60);

-- ============================================================
-- 14. SEED DATA — Working hours
-- ============================================================
INSERT INTO public.working_hours (day_of_week, open_time, close_time, is_closed) VALUES
  (0, NULL, NULL, true),           -- Неділя — вихідний
  (1, '09:00', '20:00', false),    -- Понеділок
  (2, '09:00', '20:00', false),    -- Вівторок
  (3, '09:00', '20:00', false),    -- Середа
  (4, '09:00', '20:00', false),    -- Четвер
  (5, '09:00', '20:00', false),    -- П'ятниця
  (6, '10:00', '16:00', false);    -- Субота

-- ============================================================
-- 15. SEED DATA — Sample reviews
-- ============================================================
INSERT INTO public.reviews (name, rating, service, comment, status, is_featured) VALUES
  ('Оксана К.', 5, 'Терапія', 'Чудова клініка! Лікар Олена Петрівна дуже професійна та уважна. Лікування пройшло безболісно.', 'approved', true),
  ('Михайло Т.', 5, 'Імплантація', 'Нарешті знайшов свого стоматолога. Андрій Васильович майстерно провів імплантацію. Рекомендую!', 'approved', true),
  ('Ірина Л.', 4, 'Гігієна', 'Гарний сервіс, привітний персонал. Трохи довго чекав на прийом, але результатом задоволений.', 'approved', false),
  ('Наталія С.', 5, 'Терапія', 'Донька боялася стоматологів, але тут їй дуже сподобалось. Тепер ходимо всією сім''єю.', 'approved', true),
  ('Віктор М.', 5, 'Гігієна', 'Професійна чистка зубів — найкраща в місті! Зуби як нові.', 'approved', false);
