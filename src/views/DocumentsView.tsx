import { useState, useMemo } from 'react';
import { Search, Plus, X, FileText, FlaskConical, Award, ClipboardList } from 'lucide-react';
import { supabase, type Document, type Patient } from '@/lib/supabase';
import { formatDate, getAvatarTone } from '@/lib/helpers';
import type { Language } from '@/lib/i18n';

const DOC_TYPE_ICONS: Record<string, typeof FileText> = {
  prescription: FileText,
  labResult: FlaskConical,
  certificate: Award,
  report: ClipboardList,
};

const DOC_TYPE_COLORS: Record<string, string> = {
  prescription: 'bg-primary-100 text-primary-700',
  labResult: 'bg-secondary-100 text-secondary-700',
  certificate: 'bg-accent-100 text-accent-700',
  report: 'bg-success-100 text-success-700',
};

export function DocumentsView({
  t, language, documents, patients, userId, onRefresh,
}: {
  t: Record<string, string>;
  language: Language;
  documents: Document[];
  patients: Patient[];
  userId: string;
  onRefresh: () => void;
}) {
  const isArabic = language === 'ar';
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const filtered = useMemo(() => {
    if (!search) return documents;
    const q = search.toLowerCase();
    return documents.filter((d) =>
      d.title.toLowerCase().includes(q) || d.patient_name.toLowerCase().includes(q)
    );
  }, [documents, search]);

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800 tracking-tight mb-1">{t.documentsTitle}</h1>
          <p className="text-sm text-neutral-400">{documents.length} {isArabic ? 'وثيقة' : 'documents'}</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-smooth shadow-lg shadow-primary-600/20"
        >
          <Plus size={18} /> {t.addDocument}
        </button>
      </div>

      <div className="relative mb-6">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.searchDocs}
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-smooth"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="py-20 text-center text-neutral-400 text-sm">{t.noDocs}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((doc) => {
            const Icon = DOC_TYPE_ICONS[doc.type] ?? FileText;
            const colorClass = DOC_TYPE_COLORS[doc.type] ?? DOC_TYPE_COLORS.prescription;
            return (
              <div key={doc.id} className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md transition-smooth">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-11 h-11 rounded-xl grid place-items-center flex-shrink-0 ${colorClass}`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <strong className="block text-sm font-semibold text-neutral-700 truncate">{doc.title}</strong>
                    <span className="block text-xs text-neutral-400 mt-0.5">{doc.patient_name}</span>
                  </div>
                </div>
                {doc.content && (
                  <p className="text-xs text-neutral-500 leading-relaxed mb-3 line-clamp-2">{doc.content}</p>
                )}
                <div className="flex items-center justify-between text-xs text-neutral-400 pt-3 border-t border-neutral-50">
                  <span>{formatDate(doc.created_at.split('T')[0], language)}</span>
                  <span className="capitalize">{t[doc.type as keyof typeof t] ?? doc.type}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAdd && (
        <AddDocumentModal
          t={t}
          patients={patients}
          userId={userId}
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); onRefresh(); }}
        />
      )}
    </div>
  );
}

function AddDocumentModal({
  t, patients, userId, onClose, onSaved,
}: {
  t: Record<string, string>;
  patients: Patient[];
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [patientId, setPatientId] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState('prescription');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!patientId || !title) return;
    setSaving(true);
    const patient = patients.find((p) => p.id === patientId);
    await supabase.from('documents').insert({
      user_id: userId,
      patient_id: patientId,
      patient_name: patient ? `${patient.first_name} ${patient.last_name}` : '',
      title,
      type,
      content,
    });
    setSaving(false);
    onSaved();
  };

  const types = [
    { key: 'prescription', label: t.prescription },
    { key: 'labResult', label: t.labResult },
    { key: 'certificate', label: t.certificate },
    { key: 'report', label: t.report },
  ];

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-neutral-900/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 animate-scale-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-neutral-800">{t.addDocument}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-400 transition-smooth">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t.patient}</label>
            <select value={patientId} onChange={(e) => setPatientId(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-smooth">
              <option value="">{t.selectPatient}</option>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t.docTitle}</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-smooth" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t.docType}</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-smooth">
              {types.map((tp) => <option key={tp.key} value={tp.key}>{tp.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t.content}</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-smooth resize-none" />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-smooth">{t.cancel}</button>
          <button onClick={handleSave} disabled={!patientId || !title || saving} className="flex-1 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-smooth disabled:opacity-50">{t.save}</button>
        </div>
      </div>
    </div>
  );
}
