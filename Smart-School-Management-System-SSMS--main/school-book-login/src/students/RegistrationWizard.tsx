import { useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowLeft, ArrowRight, Check, Upload, User } from 'lucide-react';
import { useAuth } from '../rbac/auth';
import { sApi, uploadFile } from './api';

const STEPS = ['Personal', 'Contact', 'Academic', 'Previous School', 'Documents', 'Guardian', 'Review'];
const DOC_KINDS = [['tc', 'Transfer Certificate'], ['birth', 'Birth Certificate'], ['id_proof', 'ID Proof'], ['medical', 'Medical Records']];

export default function RegistrationWizard({ onDone, onCancel }: { onDone: (id?: number) => void; onCancel: () => void }) {
  const { token } = useAuth();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<any>({ nationality: 'Indian', gender: 'Male', section: 'A', class: '9', guardian: { relation: 'Father' } });
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPrev, setPhotoPrev] = useState('');
  const [docs, setDocs] = useState<Record<string, File>>({});
  const [submitting, setSubmitting] = useState(false);

  const set = (k: string, v: any) => setData((d: any) => ({ ...d, [k]: v }));
  const setG = (k: string, v: any) => setData((d: any) => ({ ...d, guardian: { ...d.guardian, [k]: v } }));

  const canNext = () => (step === 0 ? !!data.name : step === 2 ? !!data.class : true);
  const next = () => { if (!canNext()) return toast.error('Please fill required fields'); setStep((s) => Math.min(s + 1, 6)); };

  const submit = async () => {
    setSubmitting(true);
    try {
      const { id } = await sApi<any>('', { method: 'POST', body: data }, token);
      if (photo) await uploadFile(`/${id}/photo`, photo, {}, token).catch(() => toast.error('Photo upload failed'));
      for (const [kind, file] of Object.entries(docs)) await uploadFile(`/${id}/documents`, file, { kind }, token).catch(() => {});
      toast.success('Student registered');
      onDone(id);
    } catch (e: any) { toast.error(e.message); } finally { setSubmitting(false); }
  };

  const F = ({ k, label, type = 'text', req }: any) => (
    <div>
      <label className="block text-[11px] font-bold uppercase text-stone-400 mb-1">{label}{req && ' *'}</label>
      <input type={type} value={data[k] || ''} onChange={(e) => set(k, e.target.value)} className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto p-6">
      <button onClick={onCancel} className="text-sm text-stone-500 mb-3 inline-flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Back to list</button>
      <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden">
        {/* stepper */}
        <div className="flex border-b border-stone-100 dark:border-stone-800 overflow-x-auto">
          {STEPS.map((s, i) => (
            <button key={s} onClick={() => i < step && setStep(i)} className={`flex-1 min-w-[110px] px-3 py-3 text-xs font-bold border-b-2 ${i === step ? 'border-blue-600 text-blue-600' : i < step ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-stone-400'}`}>
              {i + 1}. {s}{i < step && <Check className="w-3 h-3 inline ml-1" />}
            </button>
          ))}
        </div>

        <div className="p-6 min-h-[340px]">
          {step === 0 && (
            <div className="grid sm:grid-cols-2 gap-4">
              <F k="name" label="Full name" req />
              <F k="dob" label="Date of birth" type="date" />
              <div><label className="block text-[11px] font-bold uppercase text-stone-400 mb-1">Gender</label><select value={data.gender} onChange={(e) => set('gender', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800">{['Male', 'Female', 'Other'].map((g) => <option key={g}>{g}</option>)}</select></div>
              <F k="nationality" label="Nationality" />
              <F k="religion" label="Religion" />
              <div><label className="block text-[11px] font-bold uppercase text-stone-400 mb-1">Blood group</label><select value={data.blood_group || ''} onChange={(e) => set('blood_group', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800"><option value="">—</option>{['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-', 'AB-'].map((b) => <option key={b}>{b}</option>)}</select></div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold uppercase text-stone-400 mb-1">Photo (upload + preview)</label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl bg-stone-100 dark:bg-stone-800 overflow-hidden flex items-center justify-center">{photoPrev ? <img src={photoPrev} className="w-full h-full object-cover" /> : <User className="w-7 h-7 text-stone-400" />}</div>
                  <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setPhoto(f); setPhotoPrev(URL.createObjectURL(f)); } }} className="text-sm" />
                </div>
                <p className="text-[10px] text-stone-400 mt-1">Crop simplified to preview in this build.</p>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2"><F k="address" label="Address" /></div>
              <F k="phone" label="Phone" /><F k="email" label="Email" type="email" />
              <F k="emergency1_name" label="Emergency contact 1 — name" /><F k="emergency1_phone" label="Emergency contact 1 — phone" />
              <F k="emergency2_name" label="Emergency contact 2 — name" /><F k="emergency2_phone" label="Emergency contact 2 — phone" />
            </div>
          )}

          {step === 2 && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className="block text-[11px] font-bold uppercase text-stone-400 mb-1">Class *</label><select value={data.class} onChange={(e) => set('class', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800">{['6', '7', '8', '9', '10', '11', '12'].map((c) => <option key={c}>{c}</option>)}</select></div>
              <div><label className="block text-[11px] font-bold uppercase text-stone-400 mb-1">Section</label><select value={data.section} onChange={(e) => set('section', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800">{['A', 'B', 'C', 'D'].map((c) => <option key={c}>{c}</option>)}</select></div>
              <F k="roll_number" label="Roll number" /><F k="admission_number" label="Admission number (auto if blank)" />
              <F k="admission_date" label="Admission date" type="date" />
            </div>
          )}

          {step === 3 && (
            <div className="grid sm:grid-cols-2 gap-4">
              <F k="prev_school" label="Last school attended" />
              <F k="prev_tc_number" label="Transfer certificate number" />
              <F k="prev_percentage" label="Last exam %" type="number" />
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <p className="text-sm text-stone-500">Upload PDF/image, max 5MB each.</p>
              {DOC_KINDS.map(([k, label]) => (
                <div key={k} className="flex items-center justify-between gap-3 border border-stone-100 dark:border-stone-800 rounded-xl p-3">
                  <span className="text-sm font-medium">{label}</span>
                  <div className="flex items-center gap-2">
                    {docs[k] && <span className="text-xs text-emerald-600 inline-flex items-center gap-1"><Check className="w-3.5 h-3.5" /> {docs[k].name.slice(0, 20)}</span>}
                    <label className="px-3 py-1.5 rounded-lg text-xs font-bold bg-stone-100 dark:bg-stone-800 cursor-pointer inline-flex items-center gap-1"><Upload className="w-3.5 h-3.5" /> Choose<input type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { if (f.size > 5 * 1024 * 1024) return toast.error('Max 5MB'); setDocs((d) => ({ ...d, [k]: f })); } }} /></label>
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === 5 && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 text-sm text-stone-500">Link an existing parent account by ID, or enter new guardian details.</div>
              <div><label className="block text-[11px] font-bold uppercase text-stone-400 mb-1">Existing parent account ID (optional)</label><input value={data.guardian?.parent_user_id || ''} onChange={(e) => setG('parent_user_id', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800" /></div>
              <div><label className="block text-[11px] font-bold uppercase text-stone-400 mb-1">Relation</label><select value={data.guardian?.relation} onChange={(e) => setG('relation', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800">{['Father', 'Mother', 'Guardian'].map((r) => <option key={r}>{r}</option>)}</select></div>
              <div><label className="block text-[11px] font-bold uppercase text-stone-400 mb-1">Guardian name</label><input value={data.guardian?.name || ''} onChange={(e) => setG('name', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800" /></div>
              <div><label className="block text-[11px] font-bold uppercase text-stone-400 mb-1">Guardian phone</label><input value={data.guardian?.phone || ''} onChange={(e) => setG('phone', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800" /></div>
            </div>
          )}

          {step === 6 && (
            <div>
              <h3 className="font-bold mb-3">Review & submit</h3>
              <div className="rounded-2xl border border-stone-200 dark:border-stone-800 p-4 flex gap-4">
                <div className="w-20 h-20 rounded-xl bg-stone-100 dark:bg-stone-800 overflow-hidden flex items-center justify-center shrink-0">{photoPrev ? <img src={photoPrev} className="w-full h-full object-cover" /> : <User className="w-8 h-8 text-stone-400" />}</div>
                <div className="text-sm grid grid-cols-2 gap-x-6 gap-y-1 flex-1">
                  <div><b>{data.name}</b></div><div>Class {data.class}{data.section}</div>
                  <div className="text-stone-500">{data.gender} · {data.blood_group || '—'}</div><div className="text-stone-500">{data.dob || 'DOB —'}</div>
                  <div className="text-stone-500">{data.phone || 'phone —'}</div><div className="text-stone-500">{data.email || 'email —'}</div>
                  <div className="text-stone-500">Guardian: {data.guardian?.name || data.guardian?.parent_user_id || '—'} ({data.guardian?.relation})</div>
                  <div className="text-stone-500">Docs: {Object.keys(docs).length} + {photo ? 'photo' : 'no photo'}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-4 border-t border-stone-100 dark:border-stone-800">
          <button onClick={() => (step === 0 ? onCancel() : setStep(step - 1))} className="px-4 py-2 rounded-xl font-bold border border-stone-300 dark:border-stone-700 inline-flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> {step === 0 ? 'Cancel' : 'Back'}</button>
          {step < 6
            ? <button onClick={next} className="px-5 py-2 rounded-xl font-bold text-white bg-blue-600 inline-flex items-center gap-1">Next <ArrowRight className="w-4 h-4" /></button>
            : <button onClick={submit} disabled={submitting} className="px-5 py-2 rounded-xl font-bold text-white bg-emerald-600 inline-flex items-center gap-1 disabled:opacity-60">{submitting ? 'Submitting…' : 'Submit'} <Check className="w-4 h-4" /></button>}
        </div>
      </div>
    </div>
  );
}
