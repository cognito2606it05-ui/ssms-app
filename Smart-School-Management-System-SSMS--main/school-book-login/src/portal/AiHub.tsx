import { useEffect, useState } from 'react';
import { Brain, AlertTriangle, TrendingUp, Sparkles, CalendarCheck, GraduationCap, IndianRupee, ShieldAlert } from 'lucide-react';
import { apiFetch } from '../rbac/api';
import { useAuth } from '../rbac/auth';

const money = (n: any) => '₹' + Number(n || 0).toLocaleString('en-IN');

const Card = ({ title, icon: Icon, accent, children, note }: any) => (
  <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5">
    <div className="flex items-center gap-2 mb-3">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: accent + '1a' }}>
        <Icon className="w-4 h-4" style={{ color: accent }} />
      </div>
      <h3 className="text-sm font-bold text-stone-800 dark:text-stone-100">{title}</h3>
      <Sparkles className="w-3.5 h-3.5 text-amber-500 ml-auto" />
    </div>
    {children}
    {note && <p className="text-[10px] text-stone-400 mt-3">{note}</p>}
  </div>
);

const Row = ({ left, right, color }: any) => (
  <div className="flex items-center justify-between text-sm py-1.5 border-b border-stone-100 dark:border-stone-800 last:border-0">
    <span className="text-stone-700 dark:text-stone-300 truncate mr-2">{left}</span>
    <span className="text-xs font-bold shrink-0" style={{ color }}>{right}</span>
  </div>
);

/**
 * AI Hub — aggregates every AI capability across the smart modules into one
 * permission-aware panel. Pure add-on: read-only calls to existing endpoints.
 */
export default function AiHub() {
  const { token, can, session } = useAuth();
  const [stu, setStu] = useState<any>(null);
  const [attAnoms, setAttAnoms] = useState<any[]>([]);
  const [attPred, setAttPred] = useState<any>(null);
  const [feeDef, setFeeDef] = useState<any>(null);
  const [feeFc, setFeeFc] = useState<any>(null);
  const [weekly, setWeekly] = useState<any>(null);

  useEffect(() => {
    const g = (p: string) => apiFetch(p, { token }).catch(() => null);
    if (can('students', 'read')) g('/students/stats').then(setStu);
    if (can('attendance', 'read')) {
      g('/attendance/ai/anomalies').then((d) => setAttAnoms(d || []));
      g('/attendance/ai/predictions').then(setAttPred);
    }
    if (can('fees', 'read')) {
      g('/fees/ai/default-prediction').then(setFeeDef);
      g('/fees/ai/revenue-forecast').then(setFeeFc);
    }
    if (session?.activeRole === 'super_admin') g('/admin/weekly-summary').then(setWeekly);
  }, [token, can, session?.activeRole]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-50 flex items-center gap-2"><Brain className="w-6 h-6 text-indigo-500" /> AI Hub</h2>
        <p className="text-sm text-stone-500">All AI insights across modules in one place. Panels appear based on your role's permissions. Heuristic models — no external ML service.</p>
      </div>

      {weekly && (
        <div className="rounded-2xl border border-indigo-200 dark:border-indigo-900/40 bg-indigo-50/60 dark:bg-indigo-950/20 p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-indigo-700 dark:text-indigo-300 mb-1"><Sparkles className="w-4 h-4" /> AI Weekly Summary</div>
          <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">{weekly.summary}</p>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-5">
        {can('students', 'read') && (
          <Card title="Students — risk overview" icon={GraduationCap} accent="#3b82f6">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-xl bg-stone-50 dark:bg-stone-800 p-3"><div className="text-2xl font-bold">{stu?.total ?? '—'}</div><div className="text-[10px] uppercase text-stone-400">students</div></div>
              <div className="rounded-xl bg-red-50 dark:bg-red-950/30 p-3"><div className="text-2xl font-bold text-red-500">{stu?.atRisk ?? '—'}</div><div className="text-[10px] uppercase text-stone-400">dropout risk ≥65</div></div>
            </div>
            <p className="text-xs text-stone-400 mt-2">Full per-student scores, learning styles and recommendations in the <a href="#/students" className="text-blue-500 font-bold">Students portal →</a></p>
          </Card>
        )}

        {can('attendance', 'read') && (
          <Card title="Attendance — anomalies & tomorrow's absences" icon={CalendarCheck} accent="#10b981" note={attPred?.note}>
            <div className="max-h-44 overflow-auto">
              {attAnoms.slice(0, 4).map((a: any) => <Row key={'a' + a.id} left={a.name} right={a.flags?.[0]?.message} color="#ef4444" />)}
              {(attPred?.predictions || []).slice(0, 4).map((p: any) => <Row key={'p' + p.id} left={`${p.name} (${p.class}${p.section || ''})`} right={`${p.probability}% absent risk`} color={p.risk === 'high' ? '#ef4444' : '#f59e0b'} />)}
              {!attAnoms.length && !attPred?.predictions?.length && <p className="text-sm text-stone-400">No flags right now.</p>}
            </div>
            <p className="text-xs text-stone-400 mt-2">Patterns, correlations and face analytics in the <a href="#/attendance" className="text-emerald-600 font-bold">Attendance portal →</a></p>
          </Card>
        )}

        {can('fees', 'read') && (
          <Card title="Fees — default risk" icon={ShieldAlert} accent="#ef4444" note={feeDef?.note}>
            <div className="max-h-44 overflow-auto">
              {(feeDef?.predictions || []).slice(0, 5).map((p: any) => <Row key={p.id} left={`${p.name} · ${money(p.outstanding)}`} right={`${p.probability}%`} color={p.risk === 'high' ? '#ef4444' : '#f59e0b'} />)}
              {!feeDef?.predictions?.length && <p className="text-sm text-stone-400">No high-risk defaulters.</p>}
            </div>
          </Card>
        )}

        {can('fees', 'read') && (
          <Card title="Fees — revenue forecast" icon={TrendingUp} accent="#10b981" note={feeFc?.note}>
            <div className="text-3xl font-bold text-emerald-600">{money(feeFc?.forecastNextMonth)}</div>
            <div className="text-xs text-stone-400">next month · CI {money(feeFc?.confidenceInterval?.[0])} – {money(feeFc?.confidenceInterval?.[1])}</div>
            <p className="text-xs text-stone-400 mt-2">Waiver recommendations and optimal reminder times in the <a href="#/fees" className="text-emerald-600 font-bold">Fees portal →</a></p>
          </Card>
        )}
      </div>

      {!can('students', 'read') && !can('attendance', 'read') && !can('fees', 'read') && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 dark:bg-amber-950/20 p-5 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <p className="text-sm">Your role has no read access to AI-enabled modules. Ask an admin to grant permissions in the <a href="#/rbac" className="font-bold text-blue-600">RBAC console</a>.</p>
        </div>
      )}
    </div>
  );
}
