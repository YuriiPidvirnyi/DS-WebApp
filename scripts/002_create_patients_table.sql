-- Add patients table that extends Supabase auth.users

-- Patients table
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  date_of_birth DATE,
  gender TEXT,
  address TEXT,
  medical_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- RLS Policies for patients
CREATE POLICY "patients_own_read" ON public.patients 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "patients_own_update" ON public.patients 
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "patients_own_insert" ON public.patients 
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Add foreign key to appointments if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'appointments_patient_id_fkey'
  ) THEN
    ALTER TABLE public.appointments 
    ADD CONSTRAINT appointments_patient_id_fkey 
    FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add foreign key to reviews if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'reviews_patient_id_fkey'
  ) THEN
    ALTER TABLE public.reviews 
    ADD CONSTRAINT reviews_patient_id_fkey 
    FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Function to auto-create patient profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
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

-- Trigger for auto-creating patient profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_patients_phone ON public.patients(phone);
