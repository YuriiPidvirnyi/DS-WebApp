-- Dental Story Database Schema for Ukrainian Market
-- Includes patients, appointments, services, doctors, reviews

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Patients/Users profile table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  patronymic TEXT, -- По-батькові (Ukrainian middle name)
  phone TEXT NOT NULL,
  email TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  address TEXT,
  city TEXT DEFAULT 'Київ',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Doctors table
CREATE TABLE IF NOT EXISTS public.doctors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  patronymic TEXT,
  specialization TEXT NOT NULL,
  experience_years INTEGER DEFAULT 0,
  education TEXT,
  photo_url TEXT,
  bio TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Services table with Ukrainian pricing (UAH)
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_uk TEXT NOT NULL,
  name_en TEXT,
  description_uk TEXT,
  description_en TEXT,
  category TEXT NOT NULL,
  price_uah DECIMAL(10,2) NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appointments table
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  
  -- For anonymous bookings (before registration)
  guest_name TEXT,
  guest_phone TEXT,
  guest_email TEXT,
  
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  notes TEXT,
  
  -- Ukrainian-specific
  turnstile_token TEXT, -- Cloudflare Turnstile verification
  source TEXT DEFAULT 'website', -- website, phone, walk-in
  
  price_uah DECIMAL(10,2),
  is_paid BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  
  is_approved BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contact form submissions
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  message TEXT,
  
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'resolved')),
  admin_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Working hours for the clinic
CREATE TABLE IF NOT EXISTS public.working_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday
  open_time TIME,
  close_time TIME,
  is_closed BOOLEAN DEFAULT false,
  
  UNIQUE(day_of_week)
);

-- Enable Row Level Security on all tables
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.working_hours ENABLE ROW LEVEL SECURITY;

-- RLS Policies for patients
CREATE POLICY "patients_select_own" ON public.patients FOR SELECT USING (auth.uid() = id);
CREATE POLICY "patients_insert_own" ON public.patients FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "patients_update_own" ON public.patients FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "patients_delete_own" ON public.patients FOR DELETE USING (auth.uid() = id);

-- Admins can see all patients
CREATE POLICY "patients_admin_all" ON public.patients FOR ALL 
  USING ((SELECT (raw_user_meta_data->>'is_admin')::boolean FROM auth.users WHERE id = auth.uid()));

-- RLS Policies for doctors (public read)
CREATE POLICY "doctors_public_read" ON public.doctors FOR SELECT USING (is_active = true);
CREATE POLICY "doctors_admin_all" ON public.doctors FOR ALL 
  USING ((SELECT (raw_user_meta_data->>'is_admin')::boolean FROM auth.users WHERE id = auth.uid()));

-- RLS Policies for services (public read)
CREATE POLICY "services_public_read" ON public.services FOR SELECT USING (is_active = true);
CREATE POLICY "services_admin_all" ON public.services FOR ALL 
  USING ((SELECT (raw_user_meta_data->>'is_admin')::boolean FROM auth.users WHERE id = auth.uid()));

-- RLS Policies for appointments
CREATE POLICY "appointments_select_own" ON public.appointments FOR SELECT 
  USING (patient_id = auth.uid());
CREATE POLICY "appointments_insert_authenticated" ON public.appointments FOR INSERT 
  WITH CHECK (true); -- Allow anonymous bookings
CREATE POLICY "appointments_update_own" ON public.appointments FOR UPDATE 
  USING (patient_id = auth.uid());
CREATE POLICY "appointments_admin_all" ON public.appointments FOR ALL 
  USING ((SELECT (raw_user_meta_data->>'is_admin')::boolean FROM auth.users WHERE id = auth.uid()));

-- RLS Policies for reviews
CREATE POLICY "reviews_public_read" ON public.reviews FOR SELECT USING (is_approved = true);
CREATE POLICY "reviews_insert_authenticated" ON public.reviews FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "reviews_admin_all" ON public.reviews FOR ALL 
  USING ((SELECT (raw_user_meta_data->>'is_admin')::boolean FROM auth.users WHERE id = auth.uid()));

-- RLS Policies for contact submissions
CREATE POLICY "contact_insert_public" ON public.contact_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "contact_admin_all" ON public.contact_submissions FOR ALL 
  USING ((SELECT (raw_user_meta_data->>'is_admin')::boolean FROM auth.users WHERE id = auth.uid()));

-- RLS Policies for working hours (public read)
CREATE POLICY "working_hours_public_read" ON public.working_hours FOR SELECT USING (true);
CREATE POLICY "working_hours_admin_all" ON public.working_hours FOR ALL 
  USING ((SELECT (raw_user_meta_data->>'is_admin')::boolean FROM auth.users WHERE id = auth.uid()));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON public.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_reviews_doctor ON public.reviews(doctor_id);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON public.reviews(is_approved);
