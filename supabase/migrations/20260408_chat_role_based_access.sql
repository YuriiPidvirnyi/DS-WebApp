-- Implement role-based access control for chat functionality
-- Enforces that doctors only see their patient chats, and other roles have appropriate access levels

BEGIN;

-- Helper function: check if user is superadmin or admin (full access)
CREATE OR REPLACE FUNCTION public.is_admin_full_access()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.id = auth.uid()
      AND au.role IN ('superadmin', 'admin')
  );
$$;

-- Helper function: check if user is a doctor and can access this patient's session
CREATE OR REPLACE FUNCTION public.can_doctor_access_patient_chat(p_patient_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.id = auth.uid()
      AND au.role = 'doctor'
      -- Doctor can access if they have an appointment with this patient
      AND EXISTS (
        SELECT 1
        FROM public.appointments a
        WHERE a.patient_id = p_patient_id
          AND a.doctor_id = au.doctor_id
      )
  );
$$;

-- Helper function: check if user can access chat (any non-patient admin role)
CREATE OR REPLACE FUNCTION public.can_user_access_chat()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE id = auth.uid()
  );
$$;

-- Update chat_sessions RLS policies to enforce role-based access
DROP POLICY IF EXISTS "chat_sessions_read" ON public.chat_sessions;
CREATE POLICY "chat_sessions_read" ON public.chat_sessions
  FOR SELECT
  USING (
    -- Patient: see own sessions
    patient_id = auth.uid()
    -- Superadmin/admin: see all sessions
    OR public.is_admin_full_access()
    -- Doctor: see sessions from their patients
    OR public.can_doctor_access_patient_chat(patient_id)
    -- Other staff (assistant, receptionist, etc): see sessions (RLS already restricts patients)
    OR (
      public.can_user_access_chat()
      AND NOT EXISTS (
        SELECT 1 FROM public.admin_users au
        WHERE au.id = auth.uid() AND au.role = 'doctor'
      )
    )
  );

DROP POLICY IF EXISTS "chat_sessions_update" ON public.chat_sessions;
CREATE POLICY "chat_sessions_update" ON public.chat_sessions
  FOR UPDATE
  USING (
    patient_id = auth.uid()
    OR public.is_admin_full_access()
    OR public.can_doctor_access_patient_chat(patient_id)
    OR (
      public.can_user_access_chat()
      AND NOT EXISTS (
        SELECT 1 FROM public.admin_users au
        WHERE au.id = auth.uid() AND au.role = 'doctor'
      )
    )
  )
  WITH CHECK (
    patient_id = auth.uid()
    OR public.is_admin_full_access()
    OR public.can_doctor_access_patient_chat(patient_id)
    OR (
      public.can_user_access_chat()
      AND NOT EXISTS (
        SELECT 1 FROM public.admin_users au
        WHERE au.id = auth.uid() AND au.role = 'doctor'
      )
    )
  );

-- Update chat_messages RLS policies to match the session access control
DROP POLICY IF EXISTS "chat_messages_read" ON public.chat_messages;
CREATE POLICY "chat_messages_read" ON public.chat_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.chat_sessions cs
      WHERE cs.id = chat_messages.session_id
        AND (
          -- Patient: see messages in own session
          cs.patient_id = auth.uid()
          -- Superadmin/admin: see all messages
          OR public.is_admin_full_access()
          -- Doctor: see messages from their patients
          OR public.can_doctor_access_patient_chat(cs.patient_id)
          -- Other staff: see messages they can access via session
          OR (
            public.can_user_access_chat()
            AND NOT EXISTS (
              SELECT 1 FROM public.admin_users au
              WHERE au.id = auth.uid() AND au.role = 'doctor'
            )
          )
        )
    )
  );

DROP POLICY IF EXISTS "chat_messages_insert" ON public.chat_messages;
CREATE POLICY "chat_messages_insert" ON public.chat_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.chat_sessions cs
      WHERE cs.id = chat_messages.session_id
        AND (
          (
            -- Patients send patient messages to their session
            chat_messages.sender = 'patient'
            AND cs.patient_id = auth.uid()
          )
          OR (
            -- Admin/system messages: any authorized staff
            chat_messages.sender IN ('admin', 'system')
            AND (
              public.is_admin_full_access()
              OR public.can_doctor_access_patient_chat(cs.patient_id)
              OR (
                public.can_user_access_chat()
                AND NOT EXISTS (
                  SELECT 1 FROM public.admin_users au
                  WHERE au.id = auth.uid() AND au.role = 'doctor'
                )
              )
            )
          )
        )
    )
  );

COMMIT;
