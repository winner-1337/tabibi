import { useState, type FormEvent } from 'react';
import { HeartPulse, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { translations, type Language } from '@/lib/i18n';

export function AuthPage({ language, onToggleLang }: { language: Language; onToggleLang: () => void }) {
  const { signIn, signUp } = useAuth();
  const t = translations[language];
  const isArabic = language === 'ar';

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fn = mode === 'signin' ? signIn : signUp;
    const { error: err } = await fn(email, password);
    setLoading(false);
    if (err) setError(err);
  };

  return (
    <div className="min-h-screen flex" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Hero side */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[42%] bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 -right-20 w-96 h-96 rounded-full border border-white/20" />
          <div className="absolute top-20 -right-20 w-96 h-96 rounded-full border border-white/20 translate-x-12 translate-y-12" />
          <div className="absolute bottom-10 -left-10 w-72 h-72 rounded-full border border-white/15" />
          <div className="absolute top-1/3 left-1/2 w-48 h-48 rounded-full border border-white/10" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm grid place-items-center">
              <HeartPulse size={24} strokeWidth={2.5} />
            </div>
            <div>
              <strong className="block text-xl font-bold tracking-tight">Tabibi</strong>
              <span className="text-primary-200 text-xs">{isArabic ? 'عيادتك، مبسطة' : 'Votre cabinet, simplifié'}</span>
            </div>
          </div>

          <div className="max-w-md">
            <h1 className="text-4xl font-bold leading-tight tracking-tight mb-4">
              {t.welcomeBack}
            </h1>
            <p className="text-primary-100 text-lg leading-relaxed">
              {t.welcomeMsg}
            </p>

            <div className="mt-10 space-y-4">
              {[
                isArabic ? 'إدارة المواعيد والمرضى بسهولة' : 'Gérez rendez-vous et patients en toute simplicité',
                isArabic ? 'حجز ذاتي للمرضى عبر رابط واحد' : 'Réservation en ligne par lien partageable',
                isArabic ? 'تتبع الدخل والمستحقات' : 'Suivez vos revenus et impayés',
                isArabic ? 'كشك تسجيل الوصول الذكي' : 'Kiosk de check-in intelligent',
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3 text-primary-100">
                  <div className="w-7 h-7 rounded-lg bg-white/10 grid place-items-center flex-shrink-0">
                    <ArrowRight size={14} className="ltr-flip" />
                  </div>
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-primary-300 text-xs">
            © 2026 Tabibi.tn — {t.protected}
          </div>
        </div>
      </div>

      {/* Form side */}
      <div className="flex-1 flex flex-col bg-neutral-50">
        <div className="flex justify-between items-center p-6">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-9 h-9 rounded-lg bg-primary-600 grid place-items-center text-white">
              <HeartPulse size={18} strokeWidth={2.5} />
            </div>
            <strong className="text-lg font-bold text-neutral-800">Tabibi</strong>
          </div>

          <button
            onClick={onToggleLang}
            className="ml-auto px-4 py-2 rounded-lg bg-white border border-neutral-200 text-sm font-medium text-neutral-600 hover:border-primary-300 hover:text-primary-700 transition-smooth"
          >
            {isArabic ? 'Français' : 'العربية'}
          </button>
        </div>

        <div className="flex-1 grid place-items-center px-6 pb-12">
          <div className="w-full max-w-sm animate-slide-up">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-neutral-800 tracking-tight mb-2">
                {mode === 'signin' ? t.signIn : t.signUp}
              </h2>
              <p className="text-neutral-500 text-sm">
                {mode === 'signin' ? t.signInSubtitle : t.signUpSubtitle}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">{t.email}</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="docteur@tabibi.tn"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-neutral-200 bg-white text-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-smooth"
                    style={isArabic ? { paddingRight: '14px', paddingLeft: '44px' } : undefined}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">{t.password}</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-neutral-200 bg-white text-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-smooth"
                    style={isArabic ? { paddingRight: '14px', paddingLeft: '44px' } : undefined}
                  />
                </div>
              </div>

              {error && (
                <div className="px-4 py-3 rounded-lg bg-error-50 border border-error-200 text-error-700 text-sm animate-fade-in">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 active:scale-[0.98] transition-smooth shadow-lg shadow-primary-600/20 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={18} className="animate-spin" />}
                {mode === 'signin' ? t.signInButton : t.signUpButton}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-neutral-500">
              {mode === 'signin' ? t.noAccount : t.haveAccount}{' '}
              <button
                onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); }}
                className="text-primary-600 font-semibold hover:text-primary-700 transition-smooth"
              >
                {mode === 'signin' ? t.signUp : t.signIn}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
