import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { AlertTriangle, TrendingDown, Brain, GitMerge, ScanFace } from 'lucide-react';
import { useAuth } from '../rbac/auth';
import { aApi } from './api';

const Card = ({ title, icon: Icon, children, note }: any) => (
  <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5">
    <div className="flex items-center gap-2 text-sm font-bold mb-3">{Icon && <Icon className="w-4 h-4 text-indigo-500" />} {title}</div>
    {children}
    {note && <p className="text-[11px] text-stone-400 mt-3">{note}</p>}
  </div>
);
const sev = (s: string) => ({ high: 'text-red-500', medium: 'text-amber-500', low: 'text-stone-400' }[s] || 'text-stone-400');

export default function Analytics() {
  const { token } = useAuth();
  const [an, setAn] = useState<any[]>([]);
  const [pat, setPat] = useState<any>(null);
  const [pred, setPred] = useState<any>(null);
  const [corr, setCorr] = useState<any>(null);
  const [face, setFace] = useState<any>(null);
  useEffect(() => {
    aApi('/ai/anomalies', {}, token).then(setAn);
    aApi('/ai/patterns', {}, token).then(setPat);
    aApi('/ai/predictions', {}, token).then(setPred);
    aApi('/ai/correlations', {}, token).then(setCorr);
    aApi('/face/analytics', {}, token).then(setFace);
  }, [token]);

  return (
    <div className="space-y-5">
      <div className="grid lg:grid-cols-2 gap-5">
        <Card title="Anomaly detection" icon={AlertTriangle} note="Flags 3+ consecutive absences & sharp drops (heuristic).">
          <div className="space-y-1.5 max-h-72 overflow-auto">
            {an.length === 0 ? <p className="text-sm text-stone-400">No anomalies.</p> : an.map((a) => (
              <div key={a.id} className="flex items-center justify-between text-sm border-b border-stone-100 dark:border-stone-800 py-1.5">
                <span><b>{a.name}</b> <span className="text-xs text-stone-400">{a.class}{a.section}</span></span>
                <span className={`text-xs font-bold ${sev(a.flags[0]?.severity)}`}>{a.flags[0]?.message}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Absence prediction (tomorrow)" icon={Brain} note={pred?.note}>
          <div className="space-y-1.5 max-h-72 overflow-auto">
            {pred?.predictions?.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between text-sm border-b border-stone-100 dark:border-stone-800 py-1.5">
                <span><b>{p.name}</b> <span className="text-xs text-stone-400">{p.class}{p.section}</span></span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.risk === 'high' ? 'bg-red-100 text-red-600' : p.risk === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-stone-100 text-stone-500'}`}>{p.probability}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Pattern recognition" icon={TrendingDown}>
        <div className="grid lg:grid-cols-2 gap-4">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={pat?.byDay || []}><CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" /><XAxis dataKey="day" tick={{ fontSize: 10 }} /><YAxis domain={[0, 100]} tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="present_pct" fill="#22c55e" radius={[4, 4, 0, 0]} name="Present %" /></BarChart>
          </ResponsiveContainer>
          <div>
            <ul className="space-y-1.5 text-sm">{(pat?.insights || []).map((i: string, k: number) => <li key={k} className="flex gap-2"><span className="text-indigo-500">•</span>{i}</li>)}</ul>
            {pat?.chronicallyLate?.length > 0 && <div className="mt-3 text-xs text-stone-500">Chronically late: {pat.chronicallyLate.map((c: any) => `${c.name} (${c.late_days})`).join(', ')}</div>}
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card title="Correlation analysis" icon={GitMerge}>
          <table className="w-full text-sm mb-2"><thead><tr className="text-stone-400 text-xs"><th className="text-left">Fee status</th><th className="text-right">Avg attendance</th><th className="text-right">Students</th></tr></thead>
            <tbody>{corr?.byFeeStatus?.map((r: any) => <tr key={r.fee_status} className="border-t border-stone-100 dark:border-stone-800"><td>{r.fee_status}</td><td className="text-right font-bold">{r.avg_attendance}%</td><td className="text-right text-stone-400">{r.students}</td></tr>)}</tbody></table>
          <ul className="space-y-1 text-xs text-stone-600 dark:text-stone-300">{(corr?.recommendations || []).map((r: string, k: number) => <li key={k}>→ {r}</li>)}</ul>
        </Card>

        <Card title="Face recognition analytics" icon={ScanFace} note={face?.note}>
          <div className="grid grid-cols-2 gap-3 text-center">
            <Stat label="Avg confidence" v={face ? `${face.avgConfidence || 0}%` : '—'} />
            <Stat label="Face marks" v={face?.faceMarks ?? 0} />
            <Stat label="Low-confidence" v={face?.lowConfidence ?? 0} />
            <Stat label="Unknown faces" v={face?.unknownFaces ?? 0} />
          </div>
        </Card>
      </div>
    </div>
  );
}
const Stat = ({ label, v }: any) => <div className="rounded-xl bg-stone-50 dark:bg-stone-800 p-3"><div className="text-xl font-bold">{v}</div><div className="text-[10px] uppercase text-stone-400">{label}</div></div>;
