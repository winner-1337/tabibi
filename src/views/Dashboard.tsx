import { useMemo } from 'react';
import {
  CalendarDays, Clock3, Wallet, TrendingUp, UsersRound,
  Link2, Copy, Check, Sparkles, ChevronRight, Monitor,
  MessageCircle, UserCheck, AlertCircle,
} from 'lucide-react';
import { useState } from 'react';
import type { Appointment, Patient, ClinicSettings, CheckIn } from '@/lib/supabase';
import { getInitials, getAvatarTone, formatDate, isToday, generateAIInsights, getWhatsAppLink } from '@/lib/helpers';
import type { Language } from '@/lib/i18n';

type View = 'dashboard' | 'calendar' | 'patients' | 'documents' | 'finances' | 'settings' | 'kiosk';

export function Dashboard({
  t, language, appointments, patients, checkIns, settings, onViewChange,
}: {
  t: Record<string, string>;
  language: Language;
  appointments: Appointment[];
  patients: Patient[];
  checkIns: CheckIn[];
  settings: ClinicSettings | null;
  onViewChange: (v: View) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  const isArabic = language === 'ar';
  const todayStr = new Date().toISOString().split('T')[0];

  const todayAppointments = useMemo(
    () => appointments.filter((a) => a.appointment_date === todayStr && a.status !== 'Annulé'),
    [appointments, todayStr]
  );

  const filteredAppointments = useMemo(() => {
    if (filter === 'all') return todayAppointments;
    return todayAppointments.filter((a) => a.status === filter);
  }, [todayAppointments, filter]);

  const stats = useMemo(() => {
    const todayRevenue = todayAppointments
      .filter((a) => a.status === 'Terminé' && a.payment_status === 'payé')
      .reduce((sum, a) => sum + (a.fee || 0), 0);
    const waitingCount = checkIns.filter((c) => {
      const appt = appointments.find((a) => a.id === c.appointment_id);
      return appt && appt.status !== 'Terminé';
    }).length;
    const occupancy = settings ? Math.round((todayAppointments.length / (generateSlotsCount(settings.start_time, settings.end_time, settings.slot_duration))) * 100) : 0;
    return {
      patientsToday: todayAppointments.length,
      waiting: waitingCount,
      revenue: todayRevenue,
      occupancy: Math.min(occupancy, 100),
    };
  }, [todayAppointments, checkIns, appointments, settings]);

  const insights = useMemo(() => generateAIInsights(appointments, settings, language), [appointments, settings, language]);

  const bookingLink = settings ? `tabibi.tn/r/${settings.booking_slug}` : 'tabibi.tn/r/tabibi';

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(`https://${bookingLink}`); } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const upcomingAppointments = useMemo(
    () => appointments.filter((a) => a.appointment_date > todayStr && a.status !== 'Annulé').slice(0, 5),
    [appointments, todayStr]
  );

  const insightTones: Record<string, string> = {
    primary: 'bg-primary-50 border-primary-200 text-primary-700',
    warning: 'bg-warning-50 border-warning-200 text-warning-700',
    accent: 'bg-accent-50 border-accent-200 text-accent-700',
    success: 'bg-success-50 border-success-200 text-success-700',
  };
  const insightIcons: Record<string, typeof Sparkles> = {
    primary: Sparkles,
    warning: AlertCircle,
    accent: Wallet,
    success: TrendingUp,
  };

  const statusColors: Record<string, string> = {
    'Confirmé': 'text-primary-600 bg-primary-50',
    'En attente': 'text-warning-600 bg-warning-50',
    'Terminé': 'text-neutral-500 bg-neutral-100',
    'Annulé': 'text-error-600 bg-error-50',
  };

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-8 animate-fade-in">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
            {formatDate(todayStr, language)}
          </p>
          <h1 className="text-2xl lg:text-3xl font-bold text-neutral-800 tracking-tight mb-1">
            {t.greeting}, {isArabic ? 'دكتور' : 'Dr.'}
          </h1>
          <p className="text-neutral-500 text-sm">{t.overview}</p>
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={() => onViewChange('calendar')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-neutral-600 text-sm font-medium hover:border-primary-300 hover:text-primary-600 transition-smooth"
          >
            <CalendarDays size={17} />
            {t.viewCalendar}
          </button>
          <button
            onClick={() => onViewChange('kiosk')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-smooth shadow-lg shadow-primary-600/20"
          >
            <Monitor size={17} />
            {t.checkinKiosk}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        <StatCard icon={<CalendarDays size={20} />} label={t.patientsToday} value={String(stats.patientsToday)} change="+2" helper={t.vsYesterday} tone="primary" />
        <StatCard icon={<UserCheck size={20} />} label={t.waiting} value={String(stats.waiting)} change="-1" helper={t.vsYesterday} tone="warning" />
        <StatCard icon={<Wallet size={20} />} label={t.revenue} value={`${stats.revenue} DT`} change="+12%" helper={t.vsYesterday} tone="success" />
        <StatCard icon={<TrendingUp size={20} />} label={t.occupancy} value={`${stats.occupancy}%`} change="+8%" helper={t.vsYesterday} tone="secondary" />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4 lg:gap-6">
        {/* Appointments panel */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-5 lg:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-neutral-800">{t.appointmentsToday}</h2>
              <p className="text-xs text-neutral-400 mt-0.5">{formatDate(todayStr, language)}</p>
            </div>
            <button onClick={() => onViewChange('calendar')} className="flex items-center gap-1 text-sm text-primary-600 font-medium hover:text-primary-700 transition-smooth">
              {t.viewCalendar} <ChevronRight size={15} className="ltr-flip" />
            </button>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 mb-4 border-b border-neutral-100 pb-3 overflow-x-auto">
            {[
              { key: 'all', label: t.all },
              { key: 'Confirmé', label: t.confirmed },
              { key: 'En attente', label: t.pending },
              { key: 'Terminé', label: t.done },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-smooth ${
                  filter === tab.key ? 'bg-primary-50 text-primary-700' : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Appointment list */}
          <div className="space-y-1">
            {filteredAppointments.length === 0 ? (
              <div className="py-16 text-center text-neutral-400 text-sm">{t.noAppointments}</div>
            ) : (
              filteredAppointments.map((appt) => {
                const patient = patients.find((p) => p.id === appt.patient_id);
                const name = patient ? `${patient.first_name} ${patient.last_name}` : appt.patient_name;
                return (
                  <div key={appt.id} className="flex items-center gap-3 py-3 border-b border-neutral-50 last:border-0 hover:bg-neutral-50/50 rounded-lg px-2 -mx-2 transition-smooth">
                    <time className="text-sm font-semibold text-neutral-400 w-12 flex-shrink-0">{appt.start_time}</time>
                    <div className={`w-10 h-10 rounded-full grid place-items-center text-xs font-bold flex-shrink-0 ${getAvatarTone(name)}`}>
                      {patient ? getInitials(patient.first_name, patient.last_name) : name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <strong className="block text-sm font-semibold text-neutral-700 truncate">{name}</strong>
                      <span className="block text-xs text-neutral-400 truncate">{appt.type}</span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[appt.status] ?? ''}`}>
                      {appt.status === 'Confirmé' ? t.confirmed : appt.status === 'En attente' ? t.pending : appt.status === 'Terminé' ? t.done : t.cancelled}
                    </span>
                    {appt.checked_in && (
                      <span className="hidden sm:flex items-center gap-1 text-xs text-primary-600 font-medium">
                        <UserCheck size={14} /> {t.checkedIn}
                      </span>
                    )}
                    {patient?.phone && (
                      <a
                        href={getWhatsAppLink(patient.phone, `${t.whatsappReminder}: ${appt.start_time} - ${formatDate(appt.appointment_date, language)}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-neutral-300 hover:text-success-600 transition-smooth"
                        title={t.sendWhatsApp}
                      >
                        <MessageCircle size={16} />
                      </a>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Booking link card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 p-6 text-white shadow-lg shadow-primary-600/20">
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full border border-white/10 -translate-y-20 translate-x-12" />
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full border border-white/5 -translate-y-12 translate-x-20" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm grid place-items-center">
                  <Link2 size={18} />
                </div>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-success-400 animate-pulse-soft" /> Online
                </span>
              </div>
              <h3 className="text-lg font-bold mb-2 leading-snug">{t.bookingTitle}</h3>
              <p className="text-primary-100 text-sm leading-relaxed mb-4">{t.bookingText}</p>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 border border-white/15 mb-3">
                <span className="text-xs flex-1 truncate">{bookingLink}</span>
                <button onClick={handleCopy} className="text-primary-100 hover:text-white transition-smooth">
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
              <button
                onClick={handleCopy}
                className="w-full py-2.5 rounded-lg bg-white text-primary-700 text-sm font-bold hover:bg-primary-50 transition-smooth"
              >
                {copied ? t.copied : t.copyLink}
              </button>
            </div>
          </div>

          {/* AI Insights */}
          {insights.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 px-1">
                <Sparkles size={16} className="text-accent-500" />
                <h3 className="text-sm font-bold text-neutral-700">{t.smartTitle}</h3>
              </div>
              {insights.map((insight, i) => {
                const Icon = insightIcons[insight.tone] ?? Sparkles;
                return (
                  <div key={i} className={`p-4 rounded-xl border ${insightTones[insight.tone] ?? insightTones.primary}`}>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/60 grid place-items-center flex-shrink-0">
                        <Icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <strong className="block text-sm font-semibold mb-1">{insight.title}</strong>
                        <p className="text-xs leading-relaxed opacity-80">{insight.text}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Upcoming */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-neutral-700 mb-4">{t.upcoming}</h3>
            {upcomingAppointments.length === 0 ? (
              <p className="text-sm text-neutral-400 py-4 text-center">{t.noAppointments}</p>
            ) : (
              <div className="space-y-2.5">
                {upcomingAppointments.map((appt) => (
                  <div key={appt.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-neutral-50 transition-smooth">
                    <div className="w-1 h-10 rounded-full bg-primary-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <strong className="block text-sm font-medium text-neutral-700 truncate">{appt.patient_name}</strong>
                      <span className="block text-xs text-neutral-400">{formatDate(appt.appointment_date, language)} · {appt.start_time}</span>
                    </div>
                    <ChevronRight size={16} className="text-neutral-300 ltr-flip" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-8 pt-6 border-t border-neutral-100 text-xs text-neutral-400">
        <span>{t.goodDay}</span>
        <span>Tabibi · {t.protected}</span>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, change, helper, tone }: { icon: React.ReactNode; label: string; value: string; change: string; helper: string; tone: string }) {
  const toneClasses: Record<string, string> = {
    primary: 'bg-primary-100 text-primary-700',
    warning: 'bg-warning-100 text-warning-700',
    success: 'bg-success-100 text-success-700',
    secondary: 'bg-secondary-100 text-secondary-700',
  };
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-4 lg:p-5 shadow-sm hover:shadow-md transition-smooth">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl grid place-items-center flex-shrink-0 ${toneClasses[tone] ?? toneClasses.primary}`}>
          {icon}
        </div>
      </div>
      <span className="block text-xs text-neutral-400 mb-1">{label}</span>
      <strong className="block text-2xl font-bold text-neutral-800 tracking-tight">{value}</strong>
      <div className="flex items-center gap-1.5 mt-2">
        <span className="text-xs font-semibold text-success-600">{change}</span>
        <span className="text-xs text-neutral-400">{helper}</span>
      </div>
    </div>
  );
}

function generateSlotsCount(start: string, end: string, duration: number): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return Math.floor(((eh * 60 + em) - (sh * 60 + sm)) / duration);
}
