import { useMemo } from 'react';
import { Wallet, TrendingUp, AlertCircle, Calendar, DollarSign, PieChart } from 'lucide-react';
import type { Appointment, ClinicSettings } from '@/lib/supabase';
import { formatDate, dateToISO, getWeekDays } from '@/lib/helpers';
import type { Language } from '@/lib/i18n';

export function FinancesView({
  t, language, appointments, settings,
}: {
  t: Record<string, string>;
  language: Language;
  appointments: Appointment[];
  settings: ClinicSettings | null;
}) {
  const isArabic = language === 'ar';
  const todayStr = new Date().toISOString().split('T')[0];
  const now = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const stats = useMemo(() => {
    const todayRevenue = appointments
      .filter((a) => a.appointment_date === todayStr && a.payment_status === 'payé')
      .reduce((sum, a) => sum + (a.fee || 0), 0);

    const monthRevenue = appointments
      .filter((a) => a.appointment_date.startsWith(monthStr) && a.payment_status === 'payé')
      .reduce((sum, a) => sum + (a.fee || 0), 0);

    const totalRevenue = appointments
      .filter((a) => a.payment_status === 'payé')
      .reduce((sum, a) => sum + (a.fee || 0), 0);

    const outstanding = appointments
      .filter((a) => a.status === 'Terminé' && a.payment_status !== 'payé')
      .reduce((sum, a) => sum + (a.fee || 0), 0);

    const paidCount = appointments.filter((a) => a.payment_status === 'payé').length;
    const unpaidCount = appointments.filter((a) => a.payment_status === 'non_payé').length;
    const avgFee = appointments.length > 0 ? totalRevenue / Math.max(paidCount, 1) : 0;

    return { todayRevenue, monthRevenue, totalRevenue, outstanding, paidCount, unpaidCount, avgFee };
  }, [appointments, todayStr, monthStr]);

  // Weekly revenue chart data
  const weekDays = useMemo(() => getWeekDays(0), []);
  const weeklyData = useMemo(() => {
    return weekDays.map((day) => {
      const dateStr = dateToISO(day);
      const revenue = appointments
        .filter((a) => a.appointment_date === dateStr && a.payment_status === 'payé')
        .reduce((sum, a) => sum + (a.fee || 0), 0);
      return { date: dateStr, revenue, label: formatDate(dateStr, language).split(' ').slice(0, 2).join(' ') };
    });
  }, [weekDays, appointments, language]);

  const maxRevenue = Math.max(...weeklyData.map((d) => d.revenue), 1);

  const paymentStats = useMemo(() => {
    const paid = appointments.filter((a) => a.payment_status === 'payé').length;
    const unpaid = appointments.filter((a) => a.payment_status === 'non_payé').length;
    const total = paid + unpaid;
    return {
      paidPct: total > 0 ? Math.round((paid / total) * 100) : 0,
      unpaidPct: total > 0 ? Math.round((unpaid / total) * 100) : 0,
      paid,
      unpaid,
    };
  }, [appointments]);

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-8 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-800 tracking-tight mb-1">{t.financesTitle}</h1>
        <p className="text-sm text-neutral-400">{t.revenueOverview}</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        <FinanceCard icon={<Wallet size={20} />} label={t.totalRevenue} value={`${stats.totalRevenue} DT`} tone="primary" />
        <FinanceCard icon={<Calendar size={20} />} label={t.todayRevenue} value={`${stats.todayRevenue} DT`} tone="success" />
        <FinanceCard icon={<TrendingUp size={20} />} label={t.monthRevenue} value={`${stats.monthRevenue} DT`} tone="secondary" />
        <FinanceCard icon={<AlertCircle size={20} />} label={t.outstanding} value={`${stats.outstanding} DT`} tone="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
        {/* Weekly chart */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
          <h2 className="text-sm font-bold text-neutral-700 mb-5">{t.weeklyTrend}</h2>
          <div className="flex items-end justify-between gap-2 h-48">
            {weeklyData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-semibold text-neutral-600">{d.revenue > 0 ? `${d.revenue}` : ''}</span>
                <div className="w-full flex-1 flex items-end">
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-primary-500 to-primary-400 hover:from-primary-600 hover:to-primary-500 transition-smooth min-h-[4px]"
                    style={{ height: `${(d.revenue / maxRevenue) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-neutral-400 text-center truncate w-full">{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment breakdown */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
          <h2 className="text-sm font-bold text-neutral-700 mb-5">{t.paymentBreakdown}</h2>

          {/* Donut-style */}
          <div className="flex items-center justify-center mb-5">
            <div className="relative w-36 h-36">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                <circle
                  cx="50" cy="50" r="40" fill="none"
                  stroke="#2a9d83" strokeWidth="12"
                  strokeDasharray={`${(paymentStats.paidPct / 100) * 251.2} 251.2`}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 grid place-items-center">
                <div className="text-center">
                  <strong className="block text-2xl font-bold text-neutral-800">{paymentStats.paidPct}%</strong>
                  <span className="text-xs text-neutral-400">{t.collected}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-success-50">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-success-500" />
                <span className="text-sm font-medium text-success-700">{t.paid}</span>
              </div>
              <strong className="text-sm text-success-700">{paymentStats.paid}</strong>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-warning-50">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-warning-500" />
                <span className="text-sm font-medium text-warning-700">{t.unpaid}</span>
              </div>
              <strong className="text-sm text-warning-700">{paymentStats.unpaid}</strong>
            </div>
          </div>

          <div className="mt-5 pt-5 border-t border-neutral-100 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-400">{t.appointments}</span>
              <strong className="text-neutral-700">{appointments.length}</strong>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-400">{t.avgFee}</span>
              <strong className="text-neutral-700">{Math.round(stats.avgFee)} DT</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Outstanding appointments */}
      {stats.outstanding > 0 && (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 mt-6">
          <h2 className="text-sm font-bold text-neutral-700 mb-4">{t.outstanding}</h2>
          <div className="space-y-2">
            {appointments
              .filter((a) => a.status === 'Terminé' && a.payment_status !== 'payé')
              .map((appt) => (
                <div key={appt.id} className="flex items-center gap-3 p-3 rounded-lg bg-warning-50/50">
                  <DollarSign size={18} className="text-warning-600" />
                  <div className="flex-1">
                    <strong className="block text-sm font-medium text-neutral-700">{appt.patient_name}</strong>
                    <span className="block text-xs text-neutral-400">{formatDate(appt.appointment_date, language)} · {appt.start_time}</span>
                  </div>
                  <strong className="text-sm text-warning-700">{appt.fee ?? 0} DT</strong>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FinanceCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: string }) {
  const toneClasses: Record<string, string> = {
    primary: 'bg-primary-100 text-primary-700',
    success: 'bg-success-100 text-success-700',
    secondary: 'bg-secondary-100 text-secondary-700',
    warning: 'bg-warning-100 text-warning-700',
  };
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm hover:shadow-md transition-smooth">
      <div className={`w-10 h-10 rounded-xl grid place-items-center mb-3 ${toneClasses[tone] ?? toneClasses.primary}`}>
        {icon}
      </div>
      <span className="block text-xs text-neutral-400 mb-1">{label}</span>
      <strong className="block text-2xl font-bold text-neutral-800 tracking-tight">{value}</strong>
    </div>
  );
}
