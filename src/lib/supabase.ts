import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type Patient = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  birthdate: string | null;
  gender: string;
  address: string | null;
  medical_notes: string | null;
  status: string;
  last_visit: string | null;
  created_at: string;
  updated_at: string;
};

export type Appointment = {
  id: string;
  user_id: string;
  patient_id: string | null;
  patient_name: string;
  appointment_date: string;
  start_time: string;
  duration_min: number;
  type: string;
  status: string;
  notes: string;
  fee: number | null;
  payment_status: string;
  checked_in: boolean;
  created_at: string;
  updated_at: string;
};

export type Document = {
  id: string;
  user_id: string;
  patient_id: string | null;
  patient_name: string;
  title: string;
  type: string;
  content: string;
  created_at: string;
};

export type CheckIn = {
  id: string;
  user_id: string;
  appointment_id: string | null;
  patient_name: string;
  checked_in_at: string;
};

export type ClinicSettings = {
  id: string;
  user_id: string;
  clinic_name: string;
  specialty: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  booking_slug: string;
  working_days: string[];
  start_time: string;
  end_time: string;
  slot_duration: number;
  currency: string;
  consultation_fee: number;
  created_at: string;
  updated_at: string;
};

export type AppointmentStatus = 'Confirmé' | 'En attente' | 'Terminé' | 'Annulé';
export type PaymentStatus = 'payé' | 'non_payé' | 'partiel';
