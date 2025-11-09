# Database Schema Documentation

**DS-WebApp Database Architecture** - PostgreSQL schema for Dental Story clinic management system.

## Table of Contents

- [Overview](#overview)
- [Database Design Principles](#database-design-principles)
- [Entity Relationship Diagram](#entity-relationship-diagram)
- [Schema Definition](#schema-definition)
- [Migrations](#migrations)
- [Seed Data](#seed-data)
- [Indexes and Performance](#indexes-and-performance)
- [Backup Strategy](#backup-strategy)
- [Security Considerations](#security-considerations)

---

## Overview

**Database**: PostgreSQL 14+  
**ORM**: Prisma (recommended) or raw SQL  
**Migrations**: Sequential versioned migrations  
**Backup**: Daily automated backups with 30-day retention

### Key Features

- ✅ ACID compliance for transactions
- ✅ Row-level security for multi-tenant support
- ✅ Soft deletes for audit trails
- ✅ Automatic timestamps (created_at, updated_at)
- ✅ UUID primary keys for security
- ✅ JSON fields for flexible metadata
- ✅ Full-text search capabilities
- ✅ Audit logging for sensitive operations

---

## Database Design Principles

1. **Normalization**: 3NF (Third Normal Form) with denormalization where performance requires
2. **Security**: Row-level security, encrypted sensitive fields
3. **Scalability**: Partitioning for large tables (appointments, analytics)
4. **Audit Trail**: All mutations logged in `audit_log` table
5. **Soft Deletes**: `deleted_at` timestamp instead of hard deletes
6. **Timestamps**: `created_at`, `updated_at` on all tables

---

## Entity Relationship Diagram

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Patients  │────┬───→│ Appointments │←───────→│  Services   │
└─────────────┘    │    └──────────────┘         └─────────────┘
       │           │            │
       │           │            ├──────────→ ┌──────────────┐
       │           │            │            │ Medical Notes│
       │           │            │            └──────────────┘
       │           │            │
       │           │            └──────────→ ┌──────────────┐
       │           │                         │  Payments    │
       │           │                         └──────────────┘
       │           │
       │           └────────────────────────→ ┌──────────────┐
       │                                      │   Doctors    │
       │                                      └──────────────┘
       │
       └──────────────────────────────────→ ┌──────────────┐
                                             │   Reviews    │
                                             └──────────────┘

┌─────────────┐         ┌──────────────┐
│  Analytics  │         │ Audit Logs   │
└─────────────┘         └──────────────┘

┌─────────────┐         ┌──────────────┐
│   Contacts  │         │Subscriptions │
└─────────────┘         └──────────────┘
```

---

## Schema Definition

### Core Tables

#### 1. Patients

Stores patient information and medical history.

```sql
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Personal Information
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20) NOT NULL,
  date_of_birth DATE NOT NULL,

  -- Contact Details
  address TEXT,
  city VARCHAR(100),
  postal_code VARCHAR(20),

  -- Medical Information
  medical_history TEXT,
  allergies TEXT,
  current_medications TEXT,
  blood_type VARCHAR(10),

  -- Consent & Preferences
  consent_treatment BOOLEAN DEFAULT FALSE,
  consent_marketing BOOLEAN DEFAULT FALSE,
  reminder_preference VARCHAR(20) DEFAULT 'email',
  preferred_language VARCHAR(5) DEFAULT 'uk',

  -- Metadata
  notes TEXT,
  metadata JSONB DEFAULT '{}',

  -- Audit Fields
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_patients_email ON patients(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_patients_phone ON patients(phone) WHERE deleted_at IS NULL;
CREATE INDEX idx_patients_name ON patients(last_name, first_name);
CREATE INDEX idx_patients_deleted ON patients(deleted_at) WHERE deleted_at IS NOT NULL;
```

---

#### 2. Doctors

Staff members who provide services.

```sql
CREATE TABLE doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Personal Information
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),

  -- Professional Information
  specialization VARCHAR(100) NOT NULL,
  license_number VARCHAR(50) UNIQUE NOT NULL,
  education TEXT,
  experience_years INTEGER DEFAULT 0,

  -- Schedule
  working_hours JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,

  -- Public Profile
  bio TEXT,
  photo_url TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Audit Fields
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_doctors_specialization ON doctors(specialization) WHERE is_active = TRUE;
CREATE INDEX idx_doctors_active ON doctors(is_active) WHERE deleted_at IS NULL;
```

---

#### 3. Services

Dental services offered by the clinic.

```sql
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Service Details
  name VARCHAR(200) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT,

  -- Pricing
  price_from DECIMAL(10, 2) NOT NULL,
  price_to DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'UAH',

  -- Duration
  duration_minutes INTEGER NOT NULL,

  -- Availability
  is_active BOOLEAN DEFAULT TRUE,
  requires_consultation BOOLEAN DEFAULT FALSE,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Audit Fields
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_services_category ON services(category) WHERE is_active = TRUE;
CREATE INDEX idx_services_active ON services(is_active) WHERE deleted_at IS NULL;
```

---

#### 4. Appointments

Patient appointment bookings.

```sql
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  patient_id UUID NOT NULL REFERENCES patients(id),
  doctor_id UUID REFERENCES doctors(id),
  service_id UUID NOT NULL REFERENCES services(id),

  -- Appointment Details
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  -- pending, confirmed, in_progress, completed, cancelled, no_show

  -- Additional Information
  is_first_visit BOOLEAN DEFAULT TRUE,
  symptoms TEXT,
  notes TEXT,

  -- Cancellation
  cancelled_at TIMESTAMP,
  cancelled_by UUID,
  cancellation_reason TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Audit Fields
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,

  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'))
);

-- Indexes
CREATE INDEX idx_appointments_patient ON appointments(patient_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_appointments_date ON appointments(appointment_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_appointments_status ON appointments(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_appointments_datetime ON appointments(appointment_date, appointment_time);

-- Partition by month for performance
-- ALTER TABLE appointments PARTITION BY RANGE (appointment_date);
```

---

#### 5. Medical Notes

Clinical notes and treatment records.

```sql
CREATE TABLE medical_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  appointment_id UUID NOT NULL REFERENCES appointments(id),
  patient_id UUID NOT NULL REFERENCES patients(id),
  doctor_id UUID NOT NULL REFERENCES doctors(id),

  -- Note Content
  diagnosis TEXT NOT NULL,
  treatment_plan TEXT NOT NULL,
  prescriptions TEXT,
  follow_up_date DATE,

  -- Attachments
  xray_urls TEXT[],
  document_urls TEXT[],

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Audit Fields
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_medical_notes_appointment ON medical_notes(appointment_id);
CREATE INDEX idx_medical_notes_patient ON medical_notes(patient_id);
CREATE INDEX idx_medical_notes_follow_up ON medical_notes(follow_up_date) WHERE follow_up_date IS NOT NULL;
```

---

#### 6. Payments

Payment transactions and invoices.

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  appointment_id UUID NOT NULL REFERENCES appointments(id),
  patient_id UUID NOT NULL REFERENCES patients(id),

  -- Payment Details
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'UAH',
  payment_method VARCHAR(50) NOT NULL,
  -- cash, card, bank_transfer, insurance

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  -- pending, completed, refunded, failed

  -- Transaction Information
  transaction_id VARCHAR(100) UNIQUE,
  payment_date TIMESTAMP,

  -- Invoice
  invoice_number VARCHAR(50) UNIQUE,
  invoice_url TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Audit Fields
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_payment_status CHECK (status IN ('pending', 'completed', 'refunded', 'failed')),
  CONSTRAINT positive_amount CHECK (amount > 0)
);

-- Indexes
CREATE INDEX idx_payments_appointment ON payments(appointment_id);
CREATE INDEX idx_payments_patient ON payments(patient_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_date ON payments(payment_date);
```

---

### Supporting Tables

#### 7. Reviews

Patient reviews and ratings.

```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  patient_id UUID REFERENCES patients(id),

  -- Review Content
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT NOT NULL,
  visit_date DATE,
  would_recommend BOOLEAN DEFAULT TRUE,

  -- Moderation
  status VARCHAR(20) DEFAULT 'pending',
  -- pending, approved, rejected
  moderated_by UUID REFERENCES doctors(id),
  moderated_at TIMESTAMP,
  moderation_notes TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Audit Fields
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_reviews_status ON reviews(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_reviews_rating ON reviews(rating) WHERE status = 'approved';
CREATE INDEX idx_reviews_patient ON reviews(patient_id);
```

---

#### 8. Contacts

Contact form submissions.

```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Contact Information
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,

  -- Status
  status VARCHAR(20) DEFAULT 'new',
  -- new, in_progress, resolved, spam

  -- Response
  responded_by UUID REFERENCES doctors(id),
  responded_at TIMESTAMP,
  response_notes TEXT,

  -- Metadata
  source VARCHAR(50) DEFAULT 'website',
  user_agent TEXT,
  ip_address INET,
  metadata JSONB DEFAULT '{}',

  -- Audit Fields
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_contacts_status ON contacts(status);
CREATE INDEX idx_contacts_created ON contacts(created_at DESC);
```

---

#### 9. Subscriptions

Newsletter and marketing subscriptions.

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Subscription Details
  email VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  -- active, unsubscribed, bounced

  -- Preferences
  frequency VARCHAR(20) DEFAULT 'weekly',
  categories TEXT[],

  -- Tracking
  confirmed_at TIMESTAMP,
  unsubscribed_at TIMESTAMP,
  bounce_count INTEGER DEFAULT 0,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Audit Fields
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_subscriptions_email ON subscriptions(email);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

---

#### 10. Analytics Events

User interaction tracking for analytics.

```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Event Details
  event_type VARCHAR(100) NOT NULL,
  event_category VARCHAR(50) NOT NULL,
  event_name VARCHAR(100) NOT NULL,

  -- Context
  user_id UUID,
  session_id VARCHAR(100),
  page_url TEXT,
  referrer TEXT,

  -- Device & Location
  user_agent TEXT,
  ip_address INET,
  country VARCHAR(2),
  city VARCHAR(100),
  device_type VARCHAR(20),

  -- Event Data
  properties JSONB DEFAULT '{}',

  -- Timestamp
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_analytics_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_created ON analytics_events(created_at DESC);
CREATE INDEX idx_analytics_user ON analytics_events(user_id) WHERE user_id IS NOT NULL;

-- Partition by month
-- ALTER TABLE analytics_events PARTITION BY RANGE (created_at);
```

---

#### 11. Audit Log

Audit trail for sensitive operations.

```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Operation Details
  table_name VARCHAR(100) NOT NULL,
  operation VARCHAR(20) NOT NULL,
  -- INSERT, UPDATE, DELETE
  record_id UUID NOT NULL,

  -- User Context
  user_id UUID,
  user_email VARCHAR(255),
  ip_address INET,

  -- Changes
  old_values JSONB,
  new_values JSONB,

  -- Timestamp
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_table ON audit_log(table_name);
CREATE INDEX idx_audit_record ON audit_log(record_id);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);
```

---

## Migrations

### Migration Strategy

1. **Sequential Versioning**: `001_initial.sql`, `002_add_reviews.sql`, etc.
2. **Rollback Scripts**: Each migration has a corresponding `down.sql`
3. **Testing**: Test migrations on staging before production
4. **Backup**: Always backup before running migrations

### Migration Template

```sql
-- Migration: 001_initial.sql
-- Description: Initial database schema
-- Date: 2024-11-09
-- Author: DS-WebApp Team

BEGIN;

-- Your migration SQL here

COMMIT;
```

### Example Migrations

#### Migration 001: Initial Schema

```sql
-- 001_initial_schema.sql
BEGIN;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For full-text search

-- Create enum types
CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'refunded', 'failed');
CREATE TYPE review_status AS ENUM ('pending', 'approved', 'rejected');

-- Create tables (paste table definitions here)

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- (repeat for all tables)

COMMIT;
```

#### Migration 002: Add Full-Text Search

```sql
-- 002_add_full_text_search.sql
BEGIN;

-- Add tsvector columns
ALTER TABLE patients ADD COLUMN search_vector tsvector;
ALTER TABLE doctors ADD COLUMN search_vector tsvector;

-- Create indexes
CREATE INDEX idx_patients_search ON patients USING GIN(search_vector);
CREATE INDEX idx_doctors_search ON doctors USING GIN(search_vector);

-- Update search vectors
UPDATE patients SET search_vector =
  to_tsvector('ukrainian', coalesce(first_name,'') || ' ' || coalesce(last_name,'') || ' ' || coalesce(email,''));

-- Create trigger to auto-update search vector
CREATE FUNCTION patients_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('ukrainian',
    coalesce(NEW.first_name,'') || ' ' ||
    coalesce(NEW.last_name,'') || ' ' ||
    coalesce(NEW.email,'')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER patients_search_update BEFORE INSERT OR UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION patients_search_vector_update();

COMMIT;
```

---

## Seed Data

### Development Seed Data

```sql
-- seed_dev.sql
BEGIN;

-- Insert test doctors
INSERT INTO doctors (id, first_name, last_name, email, specialization, license_number) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Микола', 'Ковальчук', 'kovalchuk@dentalstory.com', 'Стоматолог-терапевт', 'LIC-001'),
  ('22222222-2222-2222-2222-222222222222', 'Олена', 'Бондаренко', 'bondarenko@dentalstory.com', 'Стоматолог-ортодонт', 'LIC-002'),
  ('33333333-3333-3333-3333-333333333333', 'Андрій', 'Мельник', 'melnyk@dentalstory.com', 'Стоматолог-хірург', 'LIC-003');

-- Insert test services
INSERT INTO services (name, category, price_from, price_to, duration_minutes) VALUES
  ('Консультація', 'Діагностика', 300, 500, 30),
  ('Лікування карієсу', 'Терапевтична стоматологія', 800, 1500, 60),
  ('Професійна чистка', 'Гігієна', 600, 900, 45),
  ('Імплантація', 'Хірургічна стоматологія', 15000, 25000, 120),
  ('Встановлення брекетів', 'Ортодонтія', 20000, 35000, 90);

-- Insert test patients
INSERT INTO patients (first_name, last_name, email, phone, date_of_birth) VALUES
  ('Іван', 'Петренко', 'ivan@example.com', '+380501234567', '1990-05-15'),
  ('Марія', 'Коваленко', 'maria@example.com', '+380502345678', '1985-08-22'),
  ('Олександр', 'Сидоренко', 'alex@example.com', '+380503456789', '1995-12-03');

COMMIT;
```

---

## Indexes and Performance

### Indexing Strategy

1. **Primary Keys**: UUID with default index
2. **Foreign Keys**: Indexed for JOIN performance
3. **Search Fields**: GIN indexes for full-text search
4. **Date Ranges**: B-tree indexes on timestamp fields
5. **Status Fields**: Partial indexes on active records only

### Query Optimization

```sql
-- Example: Find available appointments
EXPLAIN ANALYZE
SELECT a.*, d.first_name, d.last_name
FROM appointments a
JOIN doctors d ON a.doctor_id = d.id
WHERE a.appointment_date = '2024-11-15'
  AND a.status = 'confirmed'
  AND a.deleted_at IS NULL;

-- Add covering index if needed
CREATE INDEX idx_appointments_lookup ON appointments(appointment_date, status)
  INCLUDE (doctor_id, appointment_time)
  WHERE deleted_at IS NULL;
```

---

## Backup Strategy

### Automated Backups

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups/dental-story"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="dental_story_prod"

# Full backup
pg_dump -Fc $DB_NAME > "$BACKUP_DIR/full_$TIMESTAMP.dump"

# Compress
gzip "$BACKUP_DIR/full_$TIMESTAMP.dump"

# Delete backups older than 30 days
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete
```

### Restore Process

```bash
# Restore from backup
pg_restore -d dental_story_prod -c backup_file.dump.gz
```

### Point-in-Time Recovery

Enable WAL archiving in `postgresql.conf`:

```
wal_level = replica
archive_mode = on
archive_command = 'cp %p /backups/wal/%f'
```

---

## Security Considerations

### 1. Encryption

```sql
-- Encrypt sensitive fields
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Example: Encrypted medical notes
ALTER TABLE medical_notes ADD COLUMN encrypted_diagnosis BYTEA;

UPDATE medical_notes
SET encrypted_diagnosis = pgp_sym_encrypt(diagnosis, 'encryption_key');
```

### 2. Row-Level Security

```sql
-- Enable RLS
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own records
CREATE POLICY patients_isolation_policy ON patients
  USING (id = current_user_id());
```

### 3. Access Control

```sql
-- Create roles
CREATE ROLE dental_admin;
CREATE ROLE dental_doctor;
CREATE ROLE dental_receptionist;

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO dental_admin;
GRANT SELECT, INSERT, UPDATE ON appointments TO dental_receptionist;
GRANT SELECT ON patients TO dental_doctor;
```

---

## Maintenance Tasks

### Weekly Tasks

```sql
-- Vacuum and analyze
VACUUM ANALYZE;

-- Reindex
REINDEX DATABASE dental_story_prod;
```

### Monthly Tasks

```sql
-- Check table bloat
SELECT
  schemaname, tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Archive old analytics
DELETE FROM analytics_events WHERE created_at < NOW() - INTERVAL '6 months';
```

---

**Last Updated**: 2024-11-09  
**Schema Version**: 1.0.0  
**Database**: PostgreSQL 14+
