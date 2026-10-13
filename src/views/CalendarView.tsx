import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X, Plus, Check, Clock3 } from 'lucide-react';
import { supabase, type Appointment, type Patient, type ClinicSettings } from '@/lib/supabase';
import { getWeekDays, dateToISO, generateTimeSlots, isToday, formatDate, getInitials, getAvatarTone } from '@/lib/helpers';
import type { Language } from '@/lib/i18n';

const DAY_LABELS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const DAY_LABELS_AR = ['إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت', 'أحد'];
const APPT_TYPES_FR = ['Consultation générale', 'Suivi', 'Résultats d\'analyses', 'Vaccination', 'Urgence'];
const APPT_TYPES_AR = ['استشارة عامة', 'متابعة', 'نتائج التحاليل', 'تطعيم', 'طارئ'];

export function CalendarView({
  t, language, appointments, patients, settings, userId, onRefresh,
}: {
  t: Record<string, string>;
  language: Language;
  appointments: Appointment[];
  patients: Patient[];
  settings: ClinicSettings | null;
  userId: string;
  onRefresh: () => void;
}) {
  const isArabic = language === 'ar';
  const [weekOffset, setWeekOffset] = useState(0);
  const [bookingSlot, setBookingSlot] = useState<{ date: string; time: string } | null>(null);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);

  const weekDays = useMemo(() => getWeekDays(weekOffset), [weekOffset]);
  const dayLabels = isArabic ? DAY_LABELS_AR : DAY_LABELS_FR;
  const apptTypes = isArabic ? APPT_TYPES_AR : APPT_TYPES_FR;

  const slots = useMemo(() => {
    if (!settings) return generateTimeSlots('08:30', '17:30', 30);
    return generateTimeSlots(settings.start_time, settings.end_time, settings.slot_duration);
  }, [settings]);

  const workingDays = settings?.working_days ?? ['mon', 'tue', 'wed', 'thu', 'fri'];
  const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

  const getAppointmentsForSlot = (date: string, time: string) =>
    appointments.filter((a) => a.appointment_date === date && a.start_time === time && a.status !== 'Annulé');

  const statusColors: Record<string, string> = {
    'Confirmé': 'bg-primary-500 text-white border-primary-600',
    'En attente': 'bg-warning-100 text-warning-700 border-warning-300',
    'Terminé': 'bg-neutral-100 text-neutral-500 border-neutral-200',
  };

  const weekLabel = `${formatDate(dateToISO(weekDays[0]), language)} - ${formatDate(dateToISO(weekDays[6]), language)}`;

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800 tracking-tight mb-1">{t.calendar}</h1>
          <p className="text-sm text-neutral-400">{weekLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset(0)}
            className="px-3 py-2 rounded-lg border border-neutral-200 bg-white text-sm font-medium text-neutral-600 hover:border-primary-300 transition-smooth"
          >
            {t.today}
          </button>
          <div className="flex items-center gap-1 bg-white border border-neutral-200 rounded-lg p-1">
            <button onClick={() => setWeekOffset(weekOffset - 1)} className="p-1.5 rounded-md hover:bg-neutral-100 text-neutral-500 transition-smooth">
              <ChevronLeft size={18} className="ltr-flip" />
            </button>
            <button onClick={() => setWeekOffset(weekOffset + 1)} className="p-1.5 rounded-md hover:bg-neutral-100 text-neutral-500 transition-smooth">
              <ChevronRight size={18} className="ltr-flip" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-neutral-200">
          <div className="p-3" />
          {weekDays.map((day, i) => {
            const dateStr = dateToISO(day);
            const isTodayCol = isToday(dateStr);
            const isWorkingDay = workingDays.includes(dayKeys[i]);
            return (
              <div key={i} className={`p-3 text-center border-l border-neutral-100 ${!isWorkingDay ? 'bg-neutral-50/50' : ''}`}>
                <span className="block text-xs text-neutral-400 mb-1">{dayLabels[i]}</span>
                <span className={`inline-block text-sm font-bold ${isTodayCol ? 'w-7 h-7 rounded-full bg-primary-600 text-white grid place-items-center' : 'text-neutral-700'}`}>
                  {day.getDate()}
                </span>
              </div>
            );
          })}
        </div>

        {/* Time slots */}
        <div className="max-h-[70vh] overflow-y-auto">
          {slots.map((time) => (
            <div key={time} className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-neutral-50 min-h-[52px]">
              <div className="p-2 text-xs text-neutral-400 font-medium flex items-start justify-end pr-3 pt-2">
                {time}
              </div>
              {weekDays.map((day, dayIdx) => {
                const dateStr = dateToISO(day);
                const isWorkingDay = workingDays.includes(dayKeys[dayIdx]);
                const slotAppts = getAppointmentsForSlot(dateStr, time);
                return (
                  <div
                    key={dayIdx}
                    className={`border-l border-neutral-50 p-1 relative ${!isWorkingDay ? 'bg-neutral-50/30' : 'hover:bg-primary-50/30'} transition-smooth cursor-pointer`}
                    onClick={() => isWorkingDay && slotAppts.length === 0 && setBookingSlot({ date: dateStr, time })}
                  >
                    {slotAppts.map((appt) => {
                      const patient = patients.find((p) => p.id === appt.patient_id);
                      const name = patient ? `${patient.first_name} ${patient.last_name}` : appt.patient_name;
                      return (
                        <button
                          key={appt.id}
                          onClick={(e) => { e.stopPropagation(); setSelectedAppt(appt); }}
                          className={`w-full text-left px-2 py-1.5 rounded-lg border text-xs font-medium ${statusColors[appt.status] ?? statusColors['Confirmé']} mb-1 transition-smooth hover:scale-[1.02]`}
                        >
                          <div className="flex items-center gap-1.5">
                            <div className={`w-5 h-5 rounded-full grid place-items-center text-[9px] font-bold flex-shrink-0 ${appt.status === 'Confirmé' ? 'bg-white/25' : 'bg-white'} ${appt.status === 'Confirmé' ? 'text-white' : ''}`}>
                              {patient ? getInitials(patient.first_name, patient.last_name) : name.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="truncate">{name}</span>
                          </div>
                        </button>
                      );
                    })}
                    {isWorkingDay && slotAppts.length === 0 && (
                      <div className="opacity-0 hover:opacity-100 absolute inset-1 rounded-lg border-2 border-dashed border-primary-200 grid place-items-center transition-smooth pointer-events-none">
                        <Plus size={14} className="text-primary-400" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Booking modal */}
      {bookingSlot && (
        <BookingModal
          slot={bookingSlot}
          patients={patients}
          apptTypes={apptTypes}
          userId={userId}
          fee={settings?.consultation_fee ?? 80}
          t={t}
          language={language}
          onClose={() => setBookingSlot(null)}
          onSaved={() => { setBookingSlot(null); onRefresh(); }}
        />
      )}

      {/* Appointment detail modal */}
      {selectedAppt && (
        <ApptDetailModal
          appt={selectedAppt}
          patients={patients}
          t={t}
          language={language}
          onClose={() => setSelectedAppt(null)}
          onUpdate={async (status) => {
            await supabase.from('appointments').update({ status }).eq('id', selectedAppt.id);
            setSelectedAppt(null);
            onRefresh();
          }}
          onDelete={async () => {
            await supabase.from('appointments').update({ status: 'Annulé' }).eq('id', selectedAppt.id);
            setSelectedAppt(null);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}

function BookingModal({
  slot, patients, apptTypes, userId, fee, t, language, onClose, onSaved,
}: {
  slot: { date: string; time: string };
  patients: Patient[];
  apptTypes: string[];
  userId: string;
  fee: number;
  t: Record<string, string>;
  language: Language;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [patientId, setPatientId] = useState('');
  const [type, setType] = useState(apptTypes[0]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!patientId) return;
    setSaving(true);
    const patient = patients.find((p) => p.id === patientId);
    await supabase.from('appointments').insert({
      user_id: userId,
      patient_id: patientId,
      patient_name: patient ? `${patient.first_name} ${patient.last_name}` : '',
      appointment_date: slot.date,
      start_time: slot.time,
      duration_min: 30,
      type,
      status: 'En attente',
      notes,
      fee,
      payment_status: 'non_payé',
      checked_in: false,
    });
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-neutral-900/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-xs text-neutral-400 mb-1">{formatDate(slot.date, language)} · {slot.time}</p>
            <h2 className="text-xl font-bold text-neutral-800">{t.bookSlot}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-400 transition-smooth">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">{t.patient}</label>
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-smooth bg-white"
            >
              <option value="">{t.selectPatient}</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">{t.type}</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-smooth bg-white"
            >
              {apptTypes.map((tp) => <option key={tp} value={tp}>{tp}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">{t.notes}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-smooth resize-none"
              placeholder="..."
            />
          </div>

          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-neutral-50 text-sm">
            <Clock3 size={16} className="text-neutral-400" />
            <span className="text-neutral-500">{t.fee}:</span>
            <strong className="text-neutral-700">{fee} DT</strong>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-smooth">
            {t.cancel}
          </button>
          <button
            onClick={handleSave}
            disabled={!patientId || saving}
            className="flex-1 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-smooth disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Check size={17} />
            {t.save}
          </button>
        </div>
      </div>
    </div>
  );
}

function ApptDetailModal({
  appt, patients, t, language, onClose, onUpdate, onDelete,
}: {
  appt: Appointment;
  patients: Patient[];
  t: Record<string, string>;
  language: Language;
  onClose: () => void;
  onUpdate: (status: string) => void;
  onDelete: () => void;
}) {
  const patient = patients.find((p) => p.id === appt.patient_id);
  const name = patient ? `${patient.first_name} ${patient.last_name}` : appt.patient_name;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-neutral-900/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full grid place-items-center text-sm font-bold ${getAvatarTone(name)}`}>
              {patient ? getInitials(patient.first_name, patient.last_name) : name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-800">{name}</h2>
              <p className="text-sm text-neutral-400">{formatDate(appt.appointment_date, language)} · {appt.start_time}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-400 transition-smooth">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3 mb-5">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-400">{t.type}</span>
            <strong className="text-neutral-700">{appt.type}</strong>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-400">{t.duration}</span>
            <strong className="text-neutral-700">{appt.duration_min} {t.minutes}</strong>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-400">{t.fee}</span>
            <strong className="text-neutral-700">{appt.fee ?? 0} DT</strong>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-400">{t.paymentStatus}</span>
            <strong className={appt.payment_status === 'payé' ? 'text-success-600' : 'text-warning-600'}>
              {appt.payment_status === 'payé' ? t.paid : t.unpaid}
            </strong>
          </div>
          {appt.notes && (
            <div className="pt-3 border-t border-neutral-100">
              <span className="text-sm text-neutral-400 block mb-1">{t.notes}</span>
              <p className="text-sm text-neutral-600">{appt.notes}</p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {appt.status !== 'Confirmé' && (
            <button onClick={() => onUpdate('Confirmé')} className="flex-1 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-smooth">
              {t.confirm}
            </button>
          )}
          {appt.status !== 'Terminé' && (
            <button onClick={() => onUpdate('Terminé')} className="flex-1 py-2.5 rounded-xl bg-success-600 text-white text-sm font-semibold hover:bg-success-700 transition-smooth">
              {t.completeAppt}
            </button>
          )}
          {appt.status !== 'Annulé' && (
            <button onClick={onDelete} className="flex-1 py-2.5 rounded-xl border border-error-200 text-error-600 text-sm font-semibold hover:bg-error-50 transition-smooth">
              {t.cancelAppt}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
