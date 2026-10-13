import { useState, useMemo } from 'react';
import { HeartPulse, Search, Check, ArrowLeft, UserCheck, Clock3, X } from 'lucide-react';
import { supabase, type Appointment } from '@/lib/supabase';
import { getInitials, getAvatarTone } from '@/lib/helpers';
import type { Language } from '@/lib/i18n';

export function CheckInKiosk({
  language,
  onToggleLang,
  onExit,
  appointments,
  userId,
}: {
  language: Language;
  onToggleLang: () => void;
  onExit: () => void;
  appointments: Appointment[];
  userId: string;
}) {
  const isArabic = language === 'ar';
  const t = isArabic
    ? { title: 'مرحباً', subtitle: 'يرجى تأكيد هويتك', search: 'اكتب اسمك...', confirm: 'تأكيد وصولي', success: 'تم تسجيلك!', successMsg: 'سيتم إعلام الطبيب بوصولك.', back: 'العودة للرئيسية', notFound: 'لا يوجد موعد باسمك اليوم', instructions: 'ابحث عن موعدك وأكد وصولك', exit: 'خروج' }
    : { title: 'Bienvenue', subtitle: 'Veuillez confirmer votre identité', search: 'Tapez votre nom...', confirm: 'Confirmer mon arrivée', success: 'Vous êtes enregistré !', successMsg: 'Le médecin sera informé de votre arrivée.', back: "Retour à l'accueil", notFound: 'Aucun rendez-vous trouvé à votre nom aujourd\'hui', instructions: 'Trouvez votre rendez-vous et confirmez votre arrivée', exit: 'Quitter' };

  const [search, setSearch] = useState('');
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [checkedInAppt, setCheckedInAppt] = useState<Appointment | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppts = useMemo(
    () => appointments.filter((a) => a.appointment_date === todayStr && a.status !== 'Annulé' && a.status !== 'Terminé'),
    [appointments, todayStr]
  );

  const filtered = useMemo(() => {
    if (!search) return todayAppts;
    const q = search.toLowerCase();
    return todayAppts.filter((a) => a.patient_name.toLowerCase().includes(q));
  }, [todayAppts, search]);

  const handleCheckIn = async (appt: Appointment) => {
    await supabase.from('appointments').update({ checked_in: true }).eq('id', appt.id);
    await supabase.from('check_ins').insert({
      user_id: userId,
      appointment_id: appt.id,
      patient_name: appt.patient_name,
    });
    setCheckedInAppt(appt);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Top bar */}
      <div className="flex items-center justify-between p-6">
        <div className="flex items-center gap-3 text-white">
          <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm grid place-items-center">
            <HeartPulse size={24} strokeWidth={2.5} />
          </div>
          <strong className="text-lg font-bold">Tabibi</strong>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onToggleLang} className="px-4 py-2 rounded-lg bg-white/10 text-white text-sm font-medium backdrop-blur-sm hover:bg-white/20 transition-smooth">
            {isArabic ? 'Français' : 'العربية'}
          </button>
          <button onClick={onExit} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white text-sm font-medium backdrop-blur-sm hover:bg-white/20 transition-smooth">
            <X size={16} /> {t.exit}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-88px)] px-6 pb-12">
        {checkedInAppt ? (
          /* Success screen */
          <div className="text-center text-white animate-scale-in">
            <div className="w-24 h-24 rounded-3xl bg-white/15 backdrop-blur-sm grid place-items-center mx-auto mb-6">
              <Check size={48} strokeWidth={3} />
            </div>
            <h2 className="text-3xl font-bold mb-3">{t.success}</h2>
            <p className="text-primary-100 text-lg mb-2">{checkedInAppt.patient_name}</p>
            <p className="text-primary-200 mb-8">{t.successMsg}</p>
            <div className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 backdrop-blur-sm text-white">
              <Clock3 size={18} />
              <span>{checkedInAppt.start_time} · {checkedInAppt.type}</span>
            </div>
            <div className="mt-8">
              <button
                onClick={() => { setCheckedInAppt(null); setSelectedAppt(null); setSearch(''); }}
                className="px-6 py-3 rounded-xl bg-white text-primary-700 font-semibold text-sm hover:bg-primary-50 transition-smooth"
              >
                {t.back}
              </button>
            </div>
          </div>
        ) : (
          /* Search & confirm */
          <div className="w-full max-w-2xl">
            <div className="text-center text-white mb-8">
              <h1 className="text-4xl font-bold mb-3">{t.title}</h1>
              <p className="text-primary-100 text-lg">{t.subtitle}</p>
              <p className="text-primary-200 text-sm mt-2">{t.instructions}</p>
            </div>

            {/* Search bar */}
            <div className="relative mb-6">
              <Search size={24} className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.search}
                autoFocus
                className="w-full pl-14 pr-5 py-5 rounded-2xl bg-white text-lg text-neutral-800 focus:outline-none focus:ring-4 focus:ring-white/30 transition-smooth shadow-2xl"
              />
            </div>

            {/* Results */}
            {search && (
              <div className="space-y-3 max-h-[40vh] overflow-y-auto">
                {filtered.length === 0 ? (
                  <div className="text-center text-primary-100 py-8 bg-white/10 backdrop-blur-sm rounded-2xl">
                    {t.notFound}
                  </div>
                ) : (
                  filtered.map((appt) => (
                    <button
                      key={appt.id}
                      onClick={() => handleCheckIn(appt)}
                      className="w-full flex items-center gap-4 p-5 rounded-2xl bg-white text-left hover:bg-primary-50 transition-smooth shadow-lg animate-slide-up"
                    >
                      <div className={`w-14 h-14 rounded-2xl grid place-items-center text-lg font-bold flex-shrink-0 ${getAvatarTone(appt.patient_name)}`}>
                        {appt.patient_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <strong className="block text-lg font-bold text-neutral-800 truncate">{appt.patient_name}</strong>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1.5 text-sm text-neutral-400">
                            <Clock3 size={14} /> {appt.start_time}
                          </span>
                          <span className="text-sm text-neutral-400">· {appt.type}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-primary-600 font-semibold text-sm flex-shrink-0">
                        <UserCheck size={20} />
                        <span className="hidden sm:inline">{t.confirm}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {!search && todayAppts.length > 0 && (
              <div className="text-center text-primary-200 text-sm">
                {isArabic ? `${todayAppts.length} موعد اليوم` : `${todayAppts.length} rendez-vous aujourd'hui`}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
