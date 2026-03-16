-- Create enum types
CREATE TYPE appointment_status AS ENUM (
  'pending',
  'confirmed',
  'completed',
  'cancelled',
  'no_show'
);

CREATE TYPE service_category AS ENUM (
  'prophylaxis',
  'treatment',
  'prosthetics',
  'orthodontics',
  'implants',
  'surgery',
  'pediatrics'
);

-- Create doctors table
CREATE TABLE IF NOT EXISTS doctors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  specialization VARCHAR(150) NOT NULL,
  description TEXT,
  image_url VARCHAR(500),
  rating DECIMAL(2,1) DEFAULT 0,
  reviews_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name_uk VARCHAR(150) NOT NULL,
  name_en VARCHAR(150),
  name_pl VARCHAR(150),
  description_uk TEXT,
  description_en TEXT,
  description_pl TEXT,
  category service_category NOT NULL,
  duration_minutes INT DEFAULT 30,
  price_uah INT NOT NULL,
  image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create working_hours table (doctor availability)
CREATE TABLE IF NOT EXISTS working_hours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_start TIME,
  break_end TIME,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(doctor_id, day_of_week)
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE SET NULL,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE SET NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  end_time TIME,
  notes TEXT,
  status appointment_status DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create contact_submissions table
CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(20),
  subject VARCHAR(200),
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'new',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create patients table (extend auth.users profile)
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  date_of_birth DATE,
  gender VARCHAR(10),
  address TEXT,
  city VARCHAR(100),
  postal_code VARCHAR(20),
  notes TEXT,
  total_visits INT DEFAULT 0,
  total_spent_uah INT DEFAULT 0,
  preferred_doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_reviews_patient ON reviews(patient_id);
CREATE INDEX idx_reviews_doctor ON reviews(doctor_id);
CREATE INDEX idx_contact_email ON contact_submissions(email);
CREATE INDEX idx_working_hours_doctor ON working_hours(doctor_id);

-- Enable Row Level Security (RLS)
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- RLS Policies for doctors (public read)
CREATE POLICY "Doctors are publicly readable" ON doctors
  FOR SELECT USING (is_active = true);

-- RLS Policies for services (public read)
CREATE POLICY "Services are publicly readable" ON services
  FOR SELECT USING (is_active = true);

-- RLS Policies for working_hours (public read)
CREATE POLICY "Working hours are publicly readable" ON working_hours
  FOR SELECT USING (is_available = true);

-- RLS Policies for appointments (users see their own, admins see all)
CREATE POLICY "Users can see their own appointments" ON appointments
  FOR SELECT USING (
    auth.uid() = patient_id OR
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "Users can create appointments" ON appointments
  FOR INSERT WITH CHECK (
    auth.uid() = patient_id
  );

CREATE POLICY "Users can update their own appointments" ON appointments
  FOR UPDATE USING (
    auth.uid() = patient_id OR
    auth.jwt() ->> 'role' = 'admin'
  );

-- RLS Policies for reviews (public read, authenticated write)
CREATE POLICY "Reviews are publicly readable" ON reviews
  FOR SELECT USING (is_verified = true OR auth.uid() = patient_id);

CREATE POLICY "Users can create reviews" ON reviews
  FOR INSERT WITH CHECK (
    auth.uid() = patient_id
  );

-- RLS Policies for patients (users see own profile)
CREATE POLICY "Users can see their own profile" ON patients
  FOR SELECT USING (
    auth.uid() = id OR
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "Users can update their own profile" ON patients
  FOR UPDATE USING (
    auth.uid() = id
  );

-- Trigger to create patient profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.patients (id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Insert sample data
INSERT INTO doctors (first_name, last_name, specialization, description, rating, reviews_count)
VALUES
  ('Олександр', 'Петров', 'Терапевт', 'Лікарень стоматолог-терапевт з 10+ років досвідом', 4.8, 45),
  ('Марія', 'Іванівська', 'Ортодонт', 'Спеціаліст у коригуванні прикусу та виправленні зубів', 4.9, 32),
  ('Павло', 'Сідоренко', 'Хірург', 'Вислід хірургічних втручань та видалення зубів', 4.7, 28),
  ('Ірина', 'Ковальчук', 'Протезист', 'Виготовлення та встановлення протезів і коронок', 4.6, 19)
ON CONFLICT DO NOTHING;

INSERT INTO services (name_uk, name_en, category, duration_minutes, price_uah)
VALUES
  ('Консультація лікаря', 'Doctor Consultation', 'prophylaxis', 15, 100),
  ('Профілактика та чищення', 'Professional Cleaning', 'prophylaxis', 45, 350),
  ('Лікування карієсу', 'Cavity Treatment', 'treatment', 60, 400),
  ('Видалення зуба', 'Tooth Extraction', 'surgery', 45, 500),
  ('Встановлення коронки', 'Crown Installation', 'prosthetics', 90, 2000),
  ('Имплантація', 'Implant Installation', 'implants', 120, 5000),
  ('Ортодонтична консультація', 'Orthodontic Consultation', 'orthodontics', 30, 200),
  ('Лікування каналу', 'Root Canal Treatment', 'treatment', 120, 800)
ON CONFLICT DO NOTHING;
