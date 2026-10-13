import { useState, useMemo } from 'react';
import { Search, Plus, X, Phone, Mail, MapPin, Calendar, FileText, ArrowLeft, MessageCircle, Check } from 'lucide-react';
import { supabase, type Patient, type Appointment } from '@/lib/supabase';
import { getInitials, getAvatarTone, calculateAge, formatDate } from '@/lib/helpers';
import { getWhatsAppLink } from '@/lib/helpers';
import type { Language } from '@/lib/i18n';

export function PatientsView({
  t, language, patients, appointments, userId, onRefresh,
}: {
  t: Record<string, string>;
  language: Language;
  patients: Patient[];
  appointments: Appointment[];
  userId: string;
  onRefresh: () => void;
}) {
  const isArabic = language === 'ar';
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const filtered = useMemo(() => {
    if (!search) return patients;
    const q = search.toLowerCase();
    return patients.filter((p) =>
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(q) ||
      p.phone?.includes(q) ||
      p.email?.toLowerCase().includes(q)
    );
  }, [patients, search]);

  const newThisMonth = useMemo(() => {
    const now = new Date();
    return patients.filter((p) => {
      const d = new Date(p.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }, [patients]);

  if (selectedPatient) {
    return (
      <PatientDetail
        patient={selectedPatient}
        appointments={appointments.filter((a) => a.patient_id === selectedPatient.id)}
        t={t}
        language={language}
        onBack={() => setSelectedPatient(null)}
        onUpdate={async (updates) => {
          await supabase.from('patients').update(updates).eq('id', selectedPatient.id);
          onRefresh();
          setSelectedPatient({ ...selectedPatient, ...updates });
        }}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800 tracking-tight mb-1">{t.patients}</h1>
          <p className="text-sm text-neutral-400">{t.totalPatients}: {patients.length} · {t.newPatients}: {newThisMonth}</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-smooth shadow-lg shadow-primary-600/20"
        >
          <Plus size={18} /> {t.addPatient}
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.searchPatients}
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-smooth"
        />
      </div>

      {/* Patient grid */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center text-neutral-400 text-sm">{t.noPatients}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((patient) => {
            const name = `${patient.first_name} ${patient.last_name}`;
            const age = patient.birthdate ? calculateAge(patient.birthdate) : null;
            return (
              <button
                key={patient.id}
                onClick={() => setSelectedPatient(patient)}
                className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md hover:border-primary-200 transition-smooth text-left"
              >
                <div className={`w-12 h-12 rounded-full grid place-items-center text-sm font-bold flex-shrink-0 ${getAvatarTone(name)}`}>
                  {getInitials(patient.first_name, patient.last_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <strong className="block text-sm font-semibold text-neutral-700 truncate">{name}</strong>
                  <div className="flex items-center gap-2 mt-1">
                    {age && <span className="text-xs text-neutral-400">{age} {t.age.toLowerCase()}</span>}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${patient.status === 'actif' ? 'bg-success-100 text-success-700' : 'bg-neutral-100 text-neutral-500'}`}>
                      {patient.status === 'actif' ? t.active : t.inactive}
                    </span>
                  </div>
                  {patient.phone && <span className="block text-xs text-neutral-400 mt-1 truncate">{patient.phone}</span>}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {showAdd && (
        <AddPatientModal
          t={t}
          userId={userId}
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); onRefresh(); }}
        />
      )}
    </div>
  );
}

function PatientDetail({
  patient, appointments, t, language, onBack, onUpdate,
}: {
  patient: Patient;
  appointments: Appointment[];
  t: Record<string, string>;
  language: Language;
  onBack: () => void;
  onUpdate: (updates: Partial<Patient>) => void;
}) {
  const isArabic = language === 'ar';
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState(patient.medical_notes ?? '');

  const name = `${patient.first_name} ${patient.last_name}`;
  const age = patient.birthdate ? calculateAge(patient.birthdate) : null;

  const statusColors: Record<string, string> = {
    'Confirmé': 'text-primary-600 bg-primary-50',
    'En attente': 'text-warning-600 bg-warning-50',
    'Terminé': 'text-neutral-500 bg-neutral-100',
    'Annulé': 'text-error-600 bg-error-50',
  };

  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-8 animate-fade-in">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 mb-5 transition-smooth">
        <ArrowLeft size={18} className="ltr-flip" /> {isArabic ? 'عودة' : 'Retour'}
      </button>

      {/* Profile header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-6 bg-white rounded-2xl border border-neutral-200 shadow-sm mb-6">
        <div className={`w-16 h-16 rounded-2xl grid place-items-center text-xl font-bold flex-shrink-0 ${getAvatarTone(name)}`}>
          {getInitials(patient.first_name, patient.last_name)}
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-neutral-800">{name}</h1>
          <div className="flex items-center gap-3 mt-2">
            {age && <span className="text-sm text-neutral-400">{age} {t.age.toLowerCase()}</span>}
            <span className="text-sm text-neutral-400">·</span>
            <span className="text-sm text-neutral-400">{patient.gender}</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${patient.status === 'actif' ? 'bg-success-100 text-success-700' : 'bg-neutral-100 text-neutral-500'}`}>
              {patient.status === 'actif' ? t.active : t.inactive}
            </span>
          </div>
        </div>
        {patient.phone && (
          <a
            href={getWhatsAppLink(patient.phone, `${t.greeting} ${name}`)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-success-50 text-success-600 text-sm font-semibold hover:bg-success-100 transition-smooth"
          >
            <MessageCircle size={17} /> WhatsApp
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact info */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
          <h2 className="text-sm font-bold text-neutral-700 mb-4">{isArabic ? 'معلومات الاتصال' : 'Coordonnées'}</h2>
          <div className="space-y-3">
            {patient.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone size={16} className="text-neutral-400" />
                <span className="text-neutral-600">{patient.phone}</span>
              </div>
            )}
            {patient.email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail size={16} className="text-neutral-400" />
                <span className="text-neutral-600 truncate">{patient.email}</span>
              </div>
            )}
            {patient.address && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin size={16} className="text-neutral-400" />
                <span className="text-neutral-600">{patient.address}</span>
              </div>
            )}
            {patient.birthdate && (
              <div className="flex items-center gap-3 text-sm">
                <Calendar size={16} className="text-neutral-400" />
                <span className="text-neutral-600">{formatDate(patient.birthdate, language)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Medical notes */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-neutral-700">{t.medicalNotes}</h2>
            {!editingNotes && (
              <button onClick={() => setEditingNotes(true)} className="text-sm text-primary-600 font-medium hover:text-primary-700 transition-smooth">
                {isArabic ? 'تعديل' : 'Modifier'}
              </button>
            )}
          </div>
          {editingNotes ? (
            <div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={5}
                className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-smooth resize-none"
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => { onUpdate({ medical_notes: notes }); setEditingNotes(false); }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-smooth"
                >
                  <Check size={16} /> {t.save}
                </button>
                <button onClick={() => { setNotes(patient.medical_notes ?? ''); setEditingNotes(false); }} className="px-3 py-2 rounded-lg border border-neutral-200 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-smooth">
                  {t.cancel}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-neutral-600 leading-relaxed">{patient.medical_notes || (isArabic ? 'لا توجد ملاحظات' : 'Aucune note')}</p>
          )}
        </div>
      </div>

      {/* Appointment history */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 mt-6">
        <h2 className="text-sm font-bold text-neutral-700 mb-4">{t.appointmentHistory}</h2>
        {appointments.length === 0 ? (
          <p className="text-sm text-neutral-400 py-6 text-center">{t.noAppointments}</p>
        ) : (
          <div className="space-y-2">
            {appointments.map((appt) => (
              <div key={appt.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 transition-smooth">
                <div className="w-1 h-8 rounded-full bg-primary-400 flex-shrink-0" />
                <div className="flex-1">
                  <strong className="block text-sm font-medium text-neutral-700">{appt.type}</strong>
                  <span className="block text-xs text-neutral-400">{formatDate(appt.appointment_date, language)} · {appt.start_time}</span>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[appt.status] ?? ''}`}>
                  {appt.status === 'Confirmé' ? t.confirmed : appt.status === 'En attente' ? t.pending : appt.status === 'Terminé' ? t.done : t.cancelled}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AddPatientModal({
  t, userId, onClose, onSaved,
}: {
  t: Record<string, string>;
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [gender, setGender] = useState('homme');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!firstName || !lastName) return;
    setSaving(true);
    await supabase.from('patients').insert({
      user_id: userId,
      first_name: firstName,
      last_name: lastName,
      phone,
      email,
      birthdate: birthdate || null,
      gender,
      address,
      status: 'actif',
    });
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-neutral-900/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 animate-scale-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-neutral-800">{t.addPatient}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-400 transition-smooth">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t.firstName}</label>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-smooth" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t.lastName}</label>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-smooth" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t.phone}</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+216 ..." className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-smooth" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t.email}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-smooth" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t.birthdate}</label>
              <input type="date" value={birthdate} onChange={(e) => setBirthdate(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-smooth" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t.gender}</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-smooth">
                <option value="homme">{t.male}</option>
                <option value="femme">{t.female}</option>
                <option value="autre">{t.other}</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t.address}</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-smooth" />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-smooth">{t.cancel}</button>
          <button onClick={handleSave} disabled={!firstName || !lastName || saving} className="flex-1 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-smooth disabled:opacity-50">{t.save}</button>
        </div>
      </div>
    </div>
  );
}
