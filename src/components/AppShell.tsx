import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase, type ClinicSettings, type Patient, type Appointment, type Document, type CheckIn } from '@/lib/supabase';
import { translations, type Language } from '@/lib/i18n';
import { seedDemoData } from '@/lib/helpers';
import { AuthPage } from '@/components/AuthPage';
import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';
import { Dashboard } from '@/views/Dashboard';
import { CalendarView } from '@/views/CalendarView';
import { PatientsView } from '@/views/PatientsView';
import { DocumentsView } from '@/views/DocumentsView';
import { FinancesView } from '@/views/FinancesView';
import { SettingsView } from '@/views/SettingsView';
import { CheckInKiosk } from '@/views/CheckInKiosk';

type View = 'dashboard' | 'calendar' | 'patients' | 'documents' | 'finances' | 'settings' | 'kiosk';

export function AppShell() {
  const { user, loading, signOut } = useAuth();
  const [language, setLanguage] = useState<Language>('fr');
  const [view, setView] = useState<View>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settings, setSettings] = useState<ClinicSettings | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const isArabic = language === 'ar';
  const t = translations[language];

  const loadData = useCallback(async () => {
    if (!user) return;
    setDataLoading(true);

    const [settingsRes, patientsRes, apptsRes, docsRes, checkInsRes] = await Promise.all([
      supabase.from('clinic_settings').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('patients').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('appointments').select('*').eq('user_id', user.id).order('appointment_date', { ascending: true }),
      supabase.from('documents').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('check_ins').select('*').eq('user_id', user.id).order('checked_in_at', { ascending: false }),
    ]);

    if (settingsRes.data) {
      setSettings(settingsRes.data as ClinicSettings);
    } else {
      await seedDemoData(user.id);
      const { data: newSettings } = await supabase.from('clinic_settings').select('*').eq('user_id', user.id).maybeSingle();
      setSettings(newSettings as ClinicSettings | null);
      const { data: newPatients } = await supabase.from('patients').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      setPatients((newPatients ?? []) as Patient[]);
      const { data: newAppts } = await supabase.from('appointments').select('*').eq('user_id', user.id).order('appointment_date', { ascending: true });
      setAppointments((newAppts ?? []) as Appointment[]);
      const { data: newDocs } = await supabase.from('documents').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      setDocuments((newDocs ?? []) as Document[]);
      const { data: newCheckIns } = await supabase.from('check_ins').select('*').eq('user_id', user.id).order('checked_in_at', { ascending: false });
      setCheckIns((newCheckIns ?? []) as CheckIn[]);
      setDataLoading(false);
      return;
    }

    setPatients((patientsRes.data ?? []) as Patient[]);
    setAppointments((apptsRes.data ?? []) as Appointment[]);
    setDocuments((docsRes.data ?? []) as Document[]);
    setCheckIns((checkInsRes.data ?? []) as CheckIn[]);
    setDataLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  // Realtime subscription for check-ins
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('check_ins_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'check_ins', filter: `user_id=eq.${user.id}` },
        () => { loadData(); }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments', filter: `user_id=eq.${user.id}` },
        () => { loadData(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, loadData]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-neutral-50">
        <div className="w-12 h-12 rounded-xl bg-primary-600 grid place-items-center text-white animate-pulse-soft">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 12h4l3-9 4 18 3-9h4" /></svg>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage language={language} onToggleLang={() => setLanguage(isArabic ? 'fr' : 'ar')} />;
  }

  // Kiosk is a fullscreen view outside the shell
  if (view === 'kiosk') {
    return (
      <CheckInKiosk
        language={language}
        onToggleLang={() => setLanguage(isArabic ? 'fr' : 'ar')}
        onExit={() => setView('dashboard')}
        appointments={appointments}
        userId={user.id}
      />
    );
  }

  const navItems: { key: View; label: string }[] = [
    { key: 'dashboard', label: t.dashboard },
    { key: 'calendar', label: t.calendar },
    { key: 'patients', label: t.patients },
    { key: 'documents', label: t.documents },
    { key: 'finances', label: t.finances },
    { key: 'settings', label: t.settings },
  ];

  return (
    <div className={`flex min-h-screen bg-neutral-50 ${isArabic ? 'rtl font-arabic' : ''}`} dir={isArabic ? 'rtl' : 'ltr'}>
      <Sidebar
        items={navItems}
        activeView={view}
        onViewChange={setView}
        settings={settings}
        language={language}
        mobileMenuOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onSignOut={signOut}
      />

      <main className="flex-1 min-w-0 flex flex-col">
        <Topbar
          title={navItems.find((n) => n.key === view)?.label ?? ''}
          language={language}
          onToggleLang={() => setLanguage(isArabic ? 'fr' : 'ar')}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenKiosk={() => setView('kiosk')}
          t={t}
        />

        <div className="flex-1 overflow-y-auto">
          {dataLoading ? (
            <div className="h-full grid place-items-center">
              <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
          ) : view === 'dashboard' ? (
            <Dashboard t={t} language={language} appointments={appointments} patients={patients} checkIns={checkIns} settings={settings} onViewChange={setView} />
          ) : view === 'calendar' ? (
            <CalendarView t={t} language={language} appointments={appointments} patients={patients} settings={settings} userId={user.id} onRefresh={loadData} />
          ) : view === 'patients' ? (
            <PatientsView t={t} language={language} patients={patients} appointments={appointments} userId={user.id} onRefresh={loadData} />
          ) : view === 'documents' ? (
            <DocumentsView t={t} language={language} documents={documents} patients={patients} userId={user.id} onRefresh={loadData} />
          ) : view === 'finances' ? (
            <FinancesView t={t} language={language} appointments={appointments} settings={settings} />
          ) : view === 'settings' ? (
            <SettingsView t={t} language={language} settings={settings} userId={user.id} onRefresh={loadData} onSignOut={signOut} />
          ) : null}
        </div>
      </main>
    </div>
  );
}
