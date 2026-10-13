import { useState } from 'react';
import { Save, Check, LogOut, Building2, Clock4, DollarSign, Link2, Copy } from 'lucide-react';
import { supabase, type ClinicSettings } from '@/lib/supabase';
import type { Language } from '@/lib/i18n';

export function SettingsView({
  t, language, settings, userId, onRefresh, onSignOut,
}: {
  t: Record<string, string>;
  language: Language;
  settings: ClinicSettings | null;
  userId: string;
  onRefresh: () => void;
  onSignOut: () => void;
}) {
  const isArabic = language === 'ar';
  const [form, setForm] = useState({
    clinic_name: settings?.clinic_name ?? '',
    specialty: settings?.specialty ?? '',
    address: settings?.address ?? '',
    phone: settings?.phone ?? '',
    email: settings?.email ?? '',
    booking_slug: settings?.booking_slug ?? '',
    start_time: settings?.start_time ?? '08:30',
    end_time: settings?.end_time ?? '17:30',
    slot_duration: settings?.slot_duration ?? 30,
    consultation_fee: settings?.consultation_fee ?? 80,
  });
  const [workingDays, setWorkingDays] = useState<string[]>(settings?.working_days ?? ['mon', 'tue', 'wed', 'thu', 'fri']);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const dayLabels = isArabic
    ? [t.monday, t.tuesday, t.wednesday, t.thursday, t.friday, t.saturday, t.sunday]
    : [t.monday, t.tuesday, t.wednesday, t.thursday, t.friday, t.saturday, t.sunday];

  const handleSave = async () => {
    setSaving(true);
    await supabase.from('clinic_settings').update({
      clinic_name: form.clinic_name,
      specialty: form.specialty,
      address: form.address,
      phone: form.phone,
      email: form.email,
      booking_slug: form.booking_slug,
      start_time: form.start_time,
      end_time: form.end_time,
      slot_duration: Number(form.slot_duration),
      consultation_fee: Number(form.consultation_fee),
      working_days: workingDays,
    }).eq('user_id', userId);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    onRefresh();
  };

  const toggleDay = (day: string) => {
    setWorkingDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);
  };

  const bookingLink = `tabibi.tn/r/${form.booking_slug || 'tabibi'}`;

  const handleCopyLink = async () => {
    try { await navigator.clipboard.writeText(`https://${bookingLink}`); } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 lg:p-8 animate-fade-in">
      <h1 className="text-2xl font-bold text-neutral-800 tracking-tight mb-1">{t.settings}</h1>
      <p className="text-sm text-neutral-400 mb-6">{t.clinicProfile}</p>

      {saved && (
        <div className="mb-5 px-4 py-3 rounded-xl bg-success-50 border border-success-200 text-success-700 text-sm font-medium flex items-center gap-2 animate-slide-up">
          <Check size={18} /> {t.settingsSaved}
        </div>
      )}

      {/* Clinic profile */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <Building2 size={18} className="text-primary-600" />
          <h2 className="text-sm font-bold text-neutral-700">{t.clinicProfile}</h2>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t.clinicName}>
              <input value={form.clinic_name} onChange={(e) => setForm({ ...form, clinic_name: e.target.value })} className="settings-input" />
            </Field>
            <Field label={t.specialty}>
              <input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} className="settings-input" />
            </Field>
          </div>
          <Field label={t.address}>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="settings-input" />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t.phone}>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="settings-input" />
            </Field>
            <Field label={t.email}>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="settings-input" />
            </Field>
          </div>
        </div>
      </div>

      {/* Booking link */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <Link2 size={18} className="text-primary-600" />
          <h2 className="text-sm font-bold text-neutral-700">{t.bookingSlug}</h2>
        </div>
        <Field label={t.bookingSlug}>
          <div className="flex items-center gap-0">
            <span className="px-3 py-2.5 rounded-l-xl border border-r-0 border-neutral-200 bg-neutral-50 text-sm text-neutral-400">tabibi.tn/r/</span>
            <input value={form.booking_slug} onChange={(e) => setForm({ ...form, booking_slug: e.target.value.toLowerCase().replace(/\s/g, '-') })} className="flex-1 px-3 py-2.5 rounded-r-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-smooth" />
          </div>
        </Field>
        <div className="flex items-center gap-2 mt-3 px-3 py-2.5 rounded-xl bg-neutral-50 border border-neutral-100">
          <span className="text-sm text-neutral-500 flex-1 truncate">{bookingLink}</span>
          <button onClick={handleCopyLink} className="p-1.5 text-neutral-400 hover:text-primary-600 transition-smooth">
            {copied ? <Check size={16} className="text-success-600" /> : <Copy size={16} />}
          </button>
        </div>
      </div>

      {/* Working hours */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <Clock4 size={18} className="text-primary-600" />
          <h2 className="text-sm font-bold text-neutral-700">{t.workingHours}</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <Field label={isArabic ? 'من' : 'Début'}>
            <input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className="settings-input" />
          </Field>
          <Field label={isArabic ? 'إلى' : 'Fin'}>
            <input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className="settings-input" />
          </Field>
        </div>

        <span className="block text-sm font-medium text-neutral-700 mb-2">{t.workingDays}</span>
        <div className="flex flex-wrap gap-2">
          {dayKeys.map((day, i) => (
            <button
              key={day}
              onClick={() => toggleDay(day)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-smooth ${
                workingDays.includes(day)
                  ? 'bg-primary-600 text-white'
                  : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200'
              }`}
            >
              {dayLabels[i]}
            </button>
          ))}
        </div>
      </div>

      {/* Appointment defaults */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <DollarSign size={18} className="text-primary-600" />
          <h2 className="text-sm font-bold text-neutral-700">{isArabic ? 'إعدادات المواعيد' : 'Paramètres rendez-vous'}</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={`${t.slotDuration} (${t.minutes})`}>
            <select value={form.slot_duration} onChange={(e) => setForm({ ...form, slot_duration: Number(e.target.value) })} className="settings-input bg-white">
              <option value={15}>15</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
              <option value={45}>45</option>
              <option value={60}>60</option>
            </select>
          </Field>
          <Field label={`${t.consultationFee} (DT)`}>
            <input type="number" value={form.consultation_fee} onChange={(e) => setForm({ ...form, consultation_fee: Number(e.target.value) })} className="settings-input" />
          </Field>
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 rounded-xl bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 transition-smooth shadow-lg shadow-primary-600/20 disabled:opacity-60 flex items-center justify-center gap-2 mb-6"
      >
        {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
        {t.saveSettings}
      </button>

      {/* Account */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
        <h2 className="text-sm font-bold text-neutral-700 mb-4">{t.accountSettings}</h2>
        <button
          onClick={onSignOut}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-error-200 text-error-600 text-sm font-semibold hover:bg-error-50 transition-smooth"
        >
          <LogOut size={18} className="ltr-flip" /> {t.signOutBtn}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
