import { supabase, type ClinicSettings, type Patient, type Appointment, type Document } from '@/lib/supabase';

const TUNISIAN_FIRST_NAMES = ['Amel', 'Yassine', 'Sonia', 'Mohamed', 'Leïla', 'Inès', 'Karim', 'Rania', 'Sami', 'Fatma', 'Nizar', 'Syrine', 'Aymen', 'Mariem', 'Oussema', 'Nour', 'Achraf', 'Sabrine', 'Haithem', 'Yasmine'];
const TUNISIAN_LAST_NAMES = ['Ben Salah', 'Trabelsi', 'Gharbi', 'Khelifi', 'Mansour', 'Ben Ali', 'Hamdi', 'Bouazizi', 'Sassi', 'Cherif', 'Guerfali', 'Ben Amor', 'Marzouki', 'Jouini', 'Khalfaoui', 'Ben Othman', 'Ayari', 'Mhiri', 'Nasri', 'Tlili'];
const APPT_TYPES = ['Consultation générale', 'Suivi', 'Résultats d\'analyses', 'Vaccination', 'Urgence'];
const APPT_STATUSES = ['Confirmé', 'En attente', 'Terminé', 'Annulé'] as const;
const TUNISIAN_PHONES = ['+216 22 XXX XXX', '+216 24 XXX XXX', '+216 50 XXX XXX', '+216 98 XXX XXX', '+216 55 XXX XXX'];
const TUNISIAN_CITIES = ['Tunis', 'Sfax', 'Sousse', 'Kairouan', 'Bizerte', 'Gabès', 'Ariana', 'Gafsa', 'Monastir', 'Nabeul'];

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(startYear: number, endYear: number): string {
  const start = new Date(startYear, 0, 1).getTime();
  const end = new Date(endYear, 11, 31).getTime();
  return new Date(start + Math.random() * (end - start)).toISOString().split('T')[0];
}

function randomTime(): string {
  const hours = 8 + Math.floor(Math.random() * 9);
  const minutes = Math.random() < 0.5 ? '00' : '30';
  return `${String(hours).padStart(2, '0')}:${minutes}`;
}

export async function seedDemoData(userId: string): Promise<void> {
  // Check if clinic_settings exists
  const { data: existingSettings } = await supabase
    .from('clinic_settings')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (existingSettings) return;

  // Insert clinic settings
  await supabase.from('clinic_settings').insert({
    user_id: userId,
    clinic_name: 'Cabinet Dr. Tabibi',
    specialty: 'Médecine générale',
    address: '12 Avenue Habib Bourguiba, Tunis',
    phone: '+216 71 123 456',
    email: 'contact@tabibi.tn',
    booking_slug: 'tabibi',
    working_days: ['mon', 'tue', 'wed', 'thu', 'fri'],
    start_time: '08:30',
    end_time: '17:30',
    slot_duration: 30,
    consultation_fee: 80,
    currency: 'DT',
  });

  // Insert patients
  const patients: Omit<Patient, 'id' | 'created_at' | 'updated_at'>[] = [];
  for (let i = 0; i < 12; i++) {
    const firstName = randomChoice(TUNISIAN_FIRST_NAMES);
    const lastName = randomChoice(TUNISIAN_LAST_NAMES);
    patients.push({
      user_id: userId,
      first_name: firstName,
      last_name: lastName,
      phone: randomChoice(TUNISIAN_PHONES).replace(/XXX/g, () => String(Math.floor(Math.random() * 10))),
      email: `${firstName.toLowerCase().replace(/[ï]/g, 'i')}.${lastName.toLowerCase().replace(/\s/g, '')}@gmail.com`,
      birthdate: randomDate(1960, 2005),
      gender: Math.random() < 0.5 ? 'homme' : 'femme',
      address: `${Math.floor(Math.random() * 50) + 1} Rue ${randomChoice(['de Carthage', 'de Paris', 'Bourguiba', 'Hannibal', 'Ibn Khaldoun'])}, ${randomChoice(TUNISIAN_CITIES)}`,
      medical_notes: '',
      status: Math.random() < 0.85 ? 'actif' : 'inactif',
      last_visit: randomDate(2023, 2025),
    });
  }
  const { data: insertedPatients } = await supabase.from('patients').insert(patients).select();

  if (!insertedPatients) return;

  // Generate appointments for today and surrounding days
  const today = new Date();
  const appointments: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>[] = [];

  for (let dayOffset = -2; dayOffset <= 7; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() + dayOffset);
    const dateStr = date.toISOString().split('T')[0];
    const numAppts = dayOffset === 0 ? 6 : Math.floor(Math.random() * 4) + 1;

    for (let i = 0; i < numAppts; i++) {
      const patient = randomChoice(insertedPatients);
      let status = randomChoice([...APPT_STATUSES]);
      if (dayOffset < 0) status = 'Terminé';
      if (dayOffset > 0 && status === 'Terminé') status = 'Confirmé';

      appointments.push({
        user_id: userId,
        patient_id: patient.id,
        patient_name: `${patient.first_name} ${patient.last_name}`,
        appointment_date: dateStr,
        start_time: randomTime(),
        duration_min: 30,
        type: randomChoice(APPT_TYPES),
        status,
        notes: '',
        fee: 80,
        payment_status: status === 'Terminé' ? (Math.random() < 0.8 ? 'payé' : 'non_payé') : 'non_payé',
        checked_in: false,
      });
    }
  }
  await supabase.from('appointments').insert(appointments);

  // Insert some documents
  const documents: Omit<Document, 'id' | 'created_at'>[] = [];
  const docTypes = ['prescription', 'labResult', 'certificate', 'report'];
  for (let i = 0; i < 8; i++) {
    const patient = randomChoice(insertedPatients);
    documents.push({
      user_id: userId,
      patient_id: patient.id,
      patient_name: `${patient.first_name} ${patient.last_name}`,
      title: `${randomChoice(['Ordonnance', 'Analyse sanguine', 'Certificat', 'Compte rendu'])} - ${patient.first_name} ${patient.last_name}`,
      type: randomChoice(docTypes),
      content: 'Document généré automatiquement.',
    });
  }
  await supabase.from('documents').insert(documents);
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
}

export function getAvatarTone(name: string): string {
  const tones = ['bg-primary-100 text-primary-700', 'bg-secondary-100 text-secondary-700', 'bg-accent-100 text-accent-700', 'bg-success-100 text-success-700', 'bg-warning-100 text-warning-700'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return tones[Math.abs(hash) % tones.length];
}

export function formatDate(dateStr: string, language: 'fr' | 'ar' = 'fr'): string {
  const date = new Date(dateStr + 'T00:00:00');
  if (language === 'ar') {
    return date.toLocaleDateString('ar-TN', { weekday: 'short', day: 'numeric', month: 'short' });
  }
  return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function calculateAge(birthdate: string): number {
  const today = new Date();
  const birth = new Date(birthdate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function generateTimeSlots(startTime: string, endTime: string, durationMin: number): string[] {
  const slots: string[] = [];
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  let current = startH * 60 + startM;
  const end = endH * 60 + endM;
  while (current < end) {
    const h = Math.floor(current / 60);
    const m = current % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    current += durationMin;
  }
  return slots;
}

export function getWeekDays(weekOffset: number = 0): Date[] {
  const today = new Date();
  const dayOfWeek = today.getDay() || 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - dayOfWeek + 1 + weekOffset * 7);
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  return days;
}

export function dateToISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function isToday(dateStr: string): boolean {
  return dateStr === new Date().toISOString().split('T')[0];
}

export function getWhatsAppLink(phone: string, message: string): string {
  const cleanPhone = phone.replace(/[\s+]/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export function generateAIInsights(appointments: Appointment[], settings: ClinicSettings | null, language: 'fr' | 'ar'): { title: string; text: string; tone: string }[] {
  const insights: { title: string; text: string; tone: string }[] = [];
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppts = appointments.filter((a) => a.appointment_date === todayStr);

  // Check for freed slots (gaps in today's schedule)
  if (todayAppts.length > 0 && settings) {
    const slots = generateTimeSlots(settings.start_time, settings.end_time, settings.slot_duration);
    const bookedTimes = todayAppts.filter((a) => a.status !== 'Annulé').map((a) => a.start_time);
    const freeSlots = slots.filter((s) => !bookedTimes.includes(s));
    if (freeSlots.length > 2) {
      insights.push({
        title: language === 'ar' ? 'موعد شاغر جديد' : 'Un créneau vient de se libérer',
        text: language === 'ar'
          ? `يتوفر ${freeSlots.length} موعد شاغر اليوم. يمكنك ملؤها.`
          : `${freeSlots.length} créneaux disponibles aujourd'hui. Vous pourriez les remplir.`,
        tone: 'primary',
      });
    }
  }

  // No-show pattern
  const noShows = appointments.filter((a) => a.status === 'Annulé');
  if (noShows.length > 2) {
    insights.push({
      title: language === 'ar' ? 'نمط الغياب' : 'Modèle d\'absentéisme',
      text: language === 'ar'
        ? `${noShows.length} موعد ملغى. ننصح بتأكيد المواعيد عبر واتساب.`
        : `${noShows.length} rendez-vous annulés. Envisagez d'envoyer des rappels WhatsApp.`,
      tone: 'warning',
    });
  }

  // Revenue insight
  const completedPaid = appointments.filter((a) => a.status === 'Terminé' && a.payment_status === 'payé');
  const unpaid = appointments.filter((a) => a.status === 'Terminé' && a.payment_status !== 'payé');
  if (unpaid.length > 0) {
    const total = unpaid.reduce((sum, a) => sum + (a.fee || 0), 0);
    insights.push({
      title: language === 'ar' ? 'مدفوعات معلقة' : 'Paiements en attente',
      text: language === 'ar'
        ? `${unpaid.length} موعد غير مدفوع بقيمة ${total} د.ت.`
        : `${unpaid.length} rendez-vous non payés pour ${total} DT.`,
      tone: 'accent',
    });
  }

  if (completedPaid.length > 5) {
    insights.push({
      title: language === 'ar' ? 'أداء جيد' : 'Bonne performance',
      text: language === 'ar'
        ? `${completedPaid.length} موعد مكتمل ومدفوع. واصل العمل الممتاز!`
        : `${completedPaid.length} rendez-vous terminés et payés. Continuez !`,
      tone: 'success',
    });
  }

  return insights.slice(0, 4);
}
