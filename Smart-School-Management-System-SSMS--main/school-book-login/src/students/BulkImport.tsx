import { useState } from 'react';
import Papa from 'papaparse';
import toast from 'react-hot-toast';
import { Upload, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../rbac/auth';
import { sApi } from './api';
import { Modal } from './StudentList';

const TARGETS = ['name', 'admission_number', 'roll_number', 'class', 'section', 'gender', 'fee_status', 'attendance_pct'];

export default function BulkImport({ onClose }: { onClose: () => void }) {
  const { token } = useAuth();
  const [step, setStep] = useState(1);
  const [headers, setHeaders] = useState<string[]>([]);
  const [raw, setRaw] = useState<any[]>([]);
  const [map, setMap] = useState<Record<string, string>>({});
  const [report, setReport] = useState<any>(null);

  const parse = (text: string) => {
    const r = Papa.parse(text.trim(), { header: true, skipEmptyLines: true });
    const data = r.data as any[];
    if (!data.length) return toast.error('No rows found');
    const hs = Object.keys(data[0]);
    setHeaders(hs); setRaw(data);
    // auto-map by name match
    const auto: Record<string, string> = {};
    for (const t of TARGETS) { const h = hs.find((x) => x.toLowerCase().replace(/[^a-z]/g, '') === t.replace(/[^a-z]/g, '')); if (h) auto[t] = h; }
    setMap(auto); setStep(2);
  };

  const runImport = async () => {
    const students = raw.map((row) => {
      const o: any = {};
      for (const t of TARGETS) if (map[t]) o[t] = row[map[t]];
      return o;
    });
    const rep = await sApi<any>('/bulk/import', { method: 'POST', body: { students } }, token);
    setReport(rep); setStep(3);
    toast.success(`Imported ${rep.created} / ${rep.total}`);
  };

  return (
    <Modal title="Bulk import students" onClose={onClose}>
      <div className="flex gap-1 mb-4">{[1, 2, 3].map((s) => <div key={s} className={`h-1.5 flex-1 rounded-full ${step >= s ? 'bg-blue-600' : 'bg-stone-200 dark:bg-stone-700'}`} />)}</div>

      {step === 1 && (
        <div>
          <p className="text-sm text-stone-500 mb-3">Upload a CSV/Excel-exported CSV, or paste rows. First row = headers.</p>
          <input type="file" accept=".csv" onChange={(e) => { const f = e.target.files?.[0]; if (f) f.text().then(parse); }} className="text-sm mb-3" />
          <textarea onChange={(e) => e.target.value.includes(',') && setRaw([])} placeholder={'name,class,section,gender\nAarav Sharma,9,A,Male'} rows={5} id="csvpaste" className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-mono text-xs" />
          <button onClick={() => parse((document.getElementById('csvpaste') as HTMLTextAreaElement).value)} className="mt-2 px-4 py-2 rounded-lg font-bold text-white bg-blue-600 inline-flex items-center gap-2"><Upload className="w-4 h-4" /> Parse</button>
        </div>
      )}

      {step === 2 && (
        <div>
          <p className="text-sm text-stone-500 mb-3">Map your columns ({raw.length} rows). Unmapped target fields are skipped.</p>
          <div className="space-y-2 max-h-64 overflow-auto">
            {TARGETS.map((t) => (
              <div key={t} className="flex items-center gap-2 text-sm">
                <span className="w-32 font-mono text-xs">{t}{t === 'name' ? ' *' : ''}</span>
                <ArrowRight className="w-3 h-3 text-stone-400" />
                <select value={map[t] || ''} onChange={(e) => setMap({ ...map, [t]: e.target.value })} className="flex-1 px-2 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs">
                  <option value="">— skip —</option>
                  {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            ))}
          </div>
          <button disabled={!map.name} onClick={runImport} className="mt-4 w-full py-2.5 rounded-xl font-bold text-white bg-blue-600 disabled:opacity-50">Validate & Import</button>
          {!map.name && <p className="text-xs text-red-500 mt-1">Map the required <b>name</b> field to continue.</p>}
        </div>
      )}

      {step === 3 && report && (
        <div>
          <div className="grid grid-cols-3 gap-2 text-center mb-4">
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-3"><div className="text-2xl font-bold text-emerald-600">{report.created}</div><div className="text-xs text-stone-500">created</div></div>
            <div className="rounded-xl bg-red-50 dark:bg-red-950/30 p-3"><div className="text-2xl font-bold text-red-600">{report.failed}</div><div className="text-xs text-stone-500">failed</div></div>
            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 p-3"><div className="text-2xl font-bold text-amber-600">{report.warnings.length}</div><div className="text-xs text-stone-500">warnings</div></div>
          </div>
          <div className="max-h-40 overflow-auto text-xs space-y-1">
            {report.errors.map((e: any, i: number) => <div key={i} className="text-red-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Row {e.row}: {e.error}</div>)}
            {report.warnings.map((w: any, i: number) => <div key={i} className="text-amber-500">Row {w.row}: {w.warning}</div>)}
            {!report.errors.length && <div className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> All valid rows imported.</div>}
          </div>
          <button onClick={onClose} className="mt-4 w-full py-2.5 rounded-xl font-bold bg-stone-200 dark:bg-stone-700">Done</button>
        </div>
      )}
    </Modal>
  );
}
