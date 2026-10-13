import { Menu, Bell, Monitor } from 'lucide-react';
import type { Language } from '@/lib/i18n';

export function Topbar({
  title,
  language,
  onToggleLang,
  onOpenMobileMenu,
  onOpenKiosk,
  t,
}: {
  title: string;
  language: Language;
  onToggleLang: () => void;
  onOpenMobileMenu: () => void;
  onOpenKiosk: () => void;
  t: Record<string, string>;
}) {
  const isArabic = language === 'ar';

  return (
    <header className="h-16 lg:h-18 px-4 lg:px-8 bg-white border-b border-neutral-200 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button onClick={onOpenMobileMenu} className="lg:hidden p-2 -ml-2 text-neutral-500 hover:text-neutral-700 transition-smooth">
          <Menu size={22} />
        </button>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-neutral-400">{t.dashboard}</span>
          <span className="text-neutral-300">/</span>
          <strong className="text-neutral-700 font-semibold">{title}</strong>
        </div>
      </div>

      <div className="flex items-center gap-3 lg:gap-5">
        <button
          onClick={onToggleLang}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-neutral-500 hover:text-neutral-700 transition-smooth"
        >
          <span className={isArabic ? '' : 'text-primary-600 font-bold'}>FR</span>
          <span className="w-px h-4 bg-neutral-200" />
          <span className={isArabic ? 'text-primary-600 font-bold' : ''}>ع</span>
        </button>

        <button
          onClick={onOpenKiosk}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-neutral-500 hover:text-primary-600 hover:bg-primary-50 transition-smooth"
        >
          <Monitor size={17} />
          <span className="hidden md:inline">{t.checkin}</span>
        </button>

        <button className="relative p-2 text-neutral-400 hover:text-neutral-600 transition-smooth">
          <Bell size={19} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent-500 ring-2 ring-white" />
        </button>

        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-secondary-400 to-secondary-600 grid place-items-center text-white text-sm font-bold flex-shrink-0">
          {t.greeting?.slice(0, 2).toUpperCase() ?? 'DR'}
        </div>
      </div>
    </header>
  );
}
