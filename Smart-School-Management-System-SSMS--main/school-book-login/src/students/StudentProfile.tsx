import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  ArrowLeft, User, RefreshCw, FileDown, Brain, AlertTriangle, Sparkles, Activity,
} from 'lucide-react';
import { useAuth } from '../rbac/auth';
import { sApi, fileUrl } from './api';

// Lazy-loaded tab content (separate chunk, fetched when a profile is opened).
const TabContent = lazy(() => import('./tabs'));

const TABS = ['overview', 'academic', 'attendance', 'fees', 'documents', 'activity', 'idcard'] as const;
const TAB_LABELS: Record<string, string> = { overview: 'Overview', academic: 'Academic', attendance: 'Attendance', fees: 'Fees', documents: 'Documents', activity: 'Activity', idcard: 'ID Card' };
const riskColor = (r: number) => (r >= 65 ? '#ef4444' : r >= 35 ? '#f59e0b' : '#22c55e');

export default function StudentProfile({ id, onBack }: { id: number; onBack: () => void }) {
  const { token } = useAuth();
  const [s, setS] = useState<any>(null);
  const [tab, setTab] = useState<string>('overview');

  const load = useCallback(() => { sApi(`/${id}`, {}, token).then(setS).catch((e) => toast.error(e.message)); }, [id, token]);
  useEffect(() => { load(); }, [load]);

  const recompute = async () => { await sApi(`/${id}/ai/recompute`, { method: 'POST' }, token); toast.success('AI scores recomputed'); load(); };
  const exportSummary = () => {
    if (!s) return;
    const w = window.open('', '_blank'); if (!w) return;
    w.document.write(`<html><body style="font-family:sans-serif;padding:24px"><h1>${s.name}</h1><p>${s.admission_number} · Class ${s.class}${s.section} · ${s.status}</p>
      <h3>AI Summary</h3><p>Dropout risk: <b>${s.ai?.dropout_risk}/100</b> · Engagement ${s.ai?.engagement} · Predicted grade ${s.ai?.predicted_grade} · Learning style ${s.ai?.learning_style}</p>
      <ul>${(s.ai?.recommendations || []).map((r: string) => `<li>${r}</li>`).join('')}</ul>
      <p>Attendance ${s.attendance_pct}% · Fees ${s.fee_status} · Wallet ₹${s.card?.wallet_balance || 0}</p>
      <small>Heuristic AI summary — generated ${new Date().toLocaleString()}</small></body></html>`);
    w.print();
  };

  if (!s) return <div className="p-10 text-stone-400">Loading profile…</div>;
  const risk = s.ai?.dropout_risk ?? 0;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <button onClick={onBack} className="text-sm text-stone-500 mb-3 inline-flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Back to list</button>

      {/* header */}
      <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 flex items-center gap-4 mb-5">
        <div className="w-20 h-20 rounded-2xl bg-stone-100 dark:bg-stone-800 overflow-hidden flex items-center justify-center shrink-0">{s.photo_url ? <img src={fileUrl(s.photo_url)} className="w-full h-full object-cover" /> : <User className="w-9 h-9 text-stone-400" />}</div>
        <div className="flex-1">
          <div className="flex items-center gap-3"><h1 className="text-2xl font-bold">{s.name}</h1>
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${s.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : s.status === 'Transferred' ? 'bg-blue-100 text-blue-700' : 'bg-stone-200 text-stone-600'}`}>{s.status}</span>
          </div>
          <p className="text-stone-500 text-sm">Class {s.class}{s.section} · Roll {s.roll_number || '—'} · {s.admission_number}</p>
        </div>
        <div className="text-right"><div className="text-[10px] uppercase font-bold text-stone-400">Dropout risk</div><div className="text-3xl font-bold" style={{ color: riskColor(risk) }}>{risk}</div></div>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-5">
        <div>
          {/* tabs */}
          <div className="flex gap-1 mb-4 overflow-x-auto border-b border-stone-200 dark:border-stone-800">
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`px-4 py-2.5 text-sm font-bold border-b-2 whitespace-nowrap ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-stone-400 hover:text-stone-600'}`}>{TAB_LABELS[t]}</button>
            ))}
          </div>
          <Suspense fallback={<div className="p-10 text-stone-400">Loading tab…</div>}>
            <TabContent tab={tab} student={s} token={token} reload={load} />
          </Suspense>
        </div>

        {/* AI insight sidebar */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5">
            <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2 text-sm font-bold"><Brain className="w-4 h-4 text-indigo-500" /> AI Insights</div>
              <button onClick={recompute} title="Recompute" className="text-stone-400 hover:text-stone-600"><RefreshCw className="w-4 h-4" /></button></div>
            <div className="text-center py-2">
              <div className="text-4xl font-bold" style={{ color: riskColor(risk) }}>{risk}</div>
              <div className="text-[10px] uppercase text-stone-400">dropout risk</div>
            </div>
            <div className="space-y-2 mt-2 text-sm">
              <div><div className="flex justify-between text-xs text-stone-500"><span>Engagement</span><span>{s.ai?.engagement}/100</span></div><div className="h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full"><div className="h-full bg-indigo-500 rounded-full" style={{ width: `${s.ai?.engagement || 0}%` }} /></div></div>
              <div className="flex justify-between"><span className="text-stone-500">Predicted grade</span><b>{s.ai?.predicted_grade}</b></div>
              <div className="flex justify-between"><span className="text-stone-500">Learning style</span><b>{s.ai?.learning_style}</b></div>
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5">
            <div className="flex items-center gap-2 text-sm font-bold mb-2"><Sparkles className="w-4 h-4 text-amber-500" /> Recommendations</div>
            <ul className="space-y-1.5">{(s.ai?.recommendations || []).map((r: string, i: number) => <li key={i} className="text-xs text-stone-600 dark:text-stone-300 flex gap-1.5"><span className="text-amber-500">•</span> {r}</li>)}</ul>
          </div>

          {s.alerts?.length > 0 && (
            <div className="rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 p-5">
              <div className="flex items-center gap-2 text-sm font-bold text-red-600 mb-2"><AlertTriangle className="w-4 h-4" /> Anomaly alerts</div>
              {s.alerts.map((a: any) => <div key={a.id} className="text-xs text-red-600/90 dark:text-red-400 flex items-center gap-1.5 py-0.5"><Activity className="w-3 h-3" /> {a.message}</div>)}
            </div>
          )}

          <button onClick={exportSummary} className="w-full py-2.5 rounded-xl font-bold border border-stone-300 dark:border-stone-700 inline-flex items-center justify-center gap-2"><FileDown className="w-4 h-4" /> Export summary (PDF)</button>
          <p className="text-[10px] text-stone-400 text-center">Heuristic scoring · no ML model connected</p>
        </aside>
      </div>
    </div>
  );
}
