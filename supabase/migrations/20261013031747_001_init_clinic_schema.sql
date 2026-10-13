/*
# Tabibi.tn — Clinic Management Platform Schema

## Overview
Creates the complete database schema for a bilingual (FR/AR) Tunisian clinic management platform
that includes patient management, appointments, documents, finances, self-check-in, and self-booking.

## New Tables
1. `clinic_settings` — Single-row clinic profile (name, address, phone, hours, booking link slug, currency)
2. `patients` — Patient records (name, phone, email, birthdate, gender, address, medical notes, status)
3. `appointments` — Appointments linking patients to time slots (status, type, duration, notes, payment info)
4. `documents` — Patient documents (prescriptions, lab results, etc.)
5. `check_ins` — Self-check-in records for the kiosk mode

## Security
- This app uses Supabase email/password auth — all policies scope TO authenticated with auth.uid() ownership
- All tables have user_id columns defaulting to auth.uid()
- RLS enabled on every table
- 4 separate CRUD policies per table (select/insert/update/delete)
*/

-- ───────────────────────── clinic_settings ─────────────────────────
CREATE TABLE IF NOT EXISTS clinic_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_name text NOT NULL DEFAULT 'Cabinet Tabibi',
  specialty text NOT NULL DEFAULT 'Médecine générale',
  address text,
  phone text,
  email text,
  booking_slug text NOT NULL DEFAULT 'tabibi',
  working_days jsonb NOT NULL DEFAULT '["mon","tue","wed","thu","fri"]'::jsonb,
  start_time text NOT NULL DEFAULT '08:30',
  end_time text NOT NULL DEFAULT '17:30',
  slot_duration int NOT NULL DEFAULT 30,
  currency text NOT NULL DEFAULT 'DT',
  consultation_fee numeric NOT NULL DEFAULT 80,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE clinic_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_clinic_settings" ON clinic_settings;
CREATE POLICY "select_own_clinic_settings" ON clinic_settings FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_clinic_settings" ON clinic_settings;
CREATE POLICY "insert_own_clinic_settings" ON clinic_settings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_clinic_settings" ON clinic_settings;
CREATE POLICY "update_own_clinic_settings" ON clinic_settings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_clinic_settings" ON clinic_settings;
CREATE POLICY "delete_own_clinic_settings" ON clinic_settings FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ───────────────────────── patients ─────────────────────────
CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text,
  email text,
  birthdate date,
  gender text DEFAULT 'autre',
  address text,
  medical_notes text DEFAULT '',
  status text NOT NULL DEFAULT 'actif',
  last_visit date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_patients" ON patients;
CREATE POLICY "select_own_patients" ON patients FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_patients" ON patients;
CREATE POLICY "insert_own_patients" ON patients FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_patients" ON patients;
CREATE POLICY "update_own_patients" ON patients FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_patients" ON patients;
CREATE POLICY "delete_own_patients" ON patients FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(user_id, first_name, last_name);

-- ───────────────────────── appointments ─────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  patient_name text NOT NULL,
  appointment_date date NOT NULL,
  start_time text NOT NULL,
  duration_min int NOT NULL DEFAULT 30,
  type text NOT NULL DEFAULT 'Consultation générale',
  status text NOT NULL DEFAULT 'En attente',
  notes text DEFAULT '',
  fee numeric DEFAULT 80,
  payment_status text NOT NULL DEFAULT 'non_payé',
  checked_in boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_appointments" ON appointments;
CREATE POLICY "select_own_appointments" ON appointments FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_appointments" ON appointments;
CREATE POLICY "insert_own_appointments" ON appointments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_appointments" ON appointments;
CREATE POLICY "update_own_appointments" ON appointments FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_appointments" ON appointments;
CREATE POLICY "delete_own_appointments" ON appointments FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(user_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(user_id, status);

-- ───────────────────────── documents ─────────────────────────
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  patient_name text NOT NULL,
  title text NOT NULL,
  type text NOT NULL DEFAULT 'prescription',
  content text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_documents" ON documents;
CREATE POLICY "select_own_documents" ON documents FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_documents" ON documents;
CREATE POLICY "insert_own_documents" ON documents FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_documents" ON documents;
CREATE POLICY "update_own_documents" ON documents FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_documents" ON documents;
CREATE POLICY "delete_own_documents" ON documents FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_patient ON documents(user_id, patient_id);

-- ───────────────────────── check_ins ─────────────────────────
CREATE TABLE IF NOT EXISTS check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES appointments(id) ON DELETE CASCADE,
  patient_name text NOT NULL,
  checked_in_at timestamptz DEFAULT now()
);

ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_check_ins" ON check_ins;
CREATE POLICY "select_own_check_ins" ON check_ins FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_check_ins" ON check_ins;
CREATE POLICY "insert_own_check_ins" ON check_ins FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_check_ins" ON check_ins;
CREATE POLICY "update_own_check_ins" ON check_ins FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_check_ins" ON check_ins;
CREATE POLICY "delete_own_check_ins" ON check_ins FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_check_ins_user_id ON check_ins(user_id);
