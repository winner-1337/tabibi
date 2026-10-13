import { HeartPulse, LayoutDashboard, CalendarDays, UsersRound, FileText, Wallet, Settings2, LogOut, X, Sparkles, Monitor } from 'lucide-react';
import type { ClinicSettings } from '@/lib/supabase';
import type { Language } from '@/lib/i18n';

type View = 'dashboard' | 'calendar' | 'patients' | 'documents' | 'finances' | 'settings' | 'kiosk';

type NavItem = { key: View; label: string };

export function Sidebar({
  items,
  activeView,
  onViewChange,
  settings,
  language,
  mobileMenuOpen,
  onCloseMobile,
  onSignOut,
}: {
  items: NavItem[];
  activeView: View;
  onViewChange: (v: View) => void;
  settings: ClinicSettings | null;
  language: Language;
  mobileMenuOpen: boolean;
  onCloseMobile: () => void;
  onSignOut: () => void;
}) {
  const isArabic = language === 'ar';
  const icons: Record<View, typeof HeartPulse> = {
    dashboard: LayoutDashboard,
    calendar: CalendarDays,
    patients: UsersRound,
    documents: FileText,
    finances: Wallet,
    settings: Settings2,
    kiosk: Monitor,
  };

  const pendingCount = items.find((i) => i.key === 'calendar') ? 0 : 0;

  return (
    <>
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-30 lg:hidden animate-fade-in" onClick={onCloseMobile} />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 ${isArabic ? 'right-0' : 'left-0'} z-40
          w-[260px] bg-white border-${isArabic ? 'l' : 'r'} border-neutral-200
          flex flex-col p-5
          transition-transform duration-300 ease-out
          ${mobileMenuOpen ? 'translate-x-0' : isArabic ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 grid place-items-center text-white shadow-lg shadow-primary-600/25">
            <HeartPulse size={22} strokeWidth={2.5} />
          </div>
          <div>
            <strong className="block text-lg font-bold text-neutral-800 tracking-tight">Tabibi</strong>
            <span className="text-xs text-neutral-400">{isArabic ? 'عيادتك، مبسطة' : 'Votre cabinet, simplifié'}</span>
          </div>
          <button onClick={onCloseMobile} className="ml-auto lg:hidden text-neutral-400 hover:text-neutral-600 transition-smooth">
            <X size={20} />
          </button>
        </div>

        {/* Clinic switcher */}
        <div className="flex items-center gap-3 p-3 rounded-xl border border-neutral-100 bg-neutral-50 mb-6">
          <div className="w-9 h-9 rounded-lg bg-primary-100 text-primary-700 grid place-items-center text-xs font-bold flex-shrink-0">
            {settings?.clinic_name?.slice(0, 2).toUpperCase() ?? 'TA'}
          </div>
          <div className="flex-1 min-w-0">
            <strong className="block text-sm font-semibold text-neutral-700 truncate">{settings?.clinic_name ?? 'Cabinet'}</strong>
            <span className="block text-xs text-neutral-400 truncate">{settings?.specialty ?? 'Médecine générale'}</span>
          </div>
        </div>

        {/* Nav */}
        <div className="flex-1">
          <span className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider px-3 mb-2">
            {isArabic ? 'مساحتك' : 'Votre espace'}
          </span>
          <nav className="flex flex-col gap-1">
            {items.map((item) => {
              const Icon = icons[item.key];
              const isActive = activeView === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => { onViewChange(item.key); onCloseMobile(); }}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-smooth
                    ${isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700'
                    }
                  `}
                >
                  <Icon size={19} strokeWidth={isActive ? 2.4 : 1.8} />
                  <span>{item.label}</span>
                  {item.key === 'calendar' && pendingCount > 0 && (
                    <span className="ml-auto px-2 py-0.5 rounded-md bg-primary-100 text-primary-700 text-xs font-semibold">{pendingCount}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Kiosk button */}
        <button
          onClick={() => onViewChange('kiosk')}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700 transition-smooth mb-2"
        >
          <Monitor size={19} strokeWidth={1.8} />
          <span>{isArabic ? 'كشك تسجيل الوصول' : 'Kiosk check-in'}</span>
        </button>

        {/* Tip card */}
        <div className="flex gap-3 p-3.5 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100/50 mb-3">
          <div className="w-8 h-8 rounded-lg bg-primary-200/60 text-primary-700 grid place-items-center flex-shrink-0">
            <Sparkles size={16} />
          </div>
          <div>
            <strong className="block text-sm font-semibold text-primary-800 mb-1">{isArabic ? 'نصيحة' : 'Le saviez-vous ?'}</strong>
            <p className="text-xs text-primary-600 leading-relaxed">{isArabic ? 'يمكنك مشاركة رابط الحجز عبر واتساب.' : 'Partagez votre lien de réservation sur WhatsApp.'}</p>
          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={onSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-400 hover:bg-error-50 hover:text-error-600 transition-smooth border-t border-neutral-100 pt-3"
        >
          <LogOut size={18} className="ltr-flip" />
          <span>{isArabic ? 'تسجيل الخروج' : 'Se déconnecter'}</span>
        </button>
      </aside>
    </>
  );
}
