import { useCallback, useEffect, useState } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Printer } from 'lucide-react';
import { useAuth } from '../rbac/auth';
import { aApi } from './api';
import { DataTable } from '../admin/DataTable';

const TABS = ['daily', 'monthly', 'subject', 'cumulative', 'staff'] as const;
const LABELS: Record<string, string> = { daily: 'Daily Register', monthly: 'Monthly Summary', subject: 'Subject-wise', cumulative: 'Cumulative Analytics', staff: 'Staff' };
const dot = (c: string) => ({ green: '#22c55e', amber: '#f59e0b', red: '#ef4444' }[c] || '#a8a29e');

export default function Reports() {
  const { token } = useAuth();
  const [tab, setTab] = useState<string>('monthly');
  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-stone-200 dark:border-stone-800 overflow-x-auto">
        {TABS.map((t) => <button key={t} onClick={() => setTab(t)} className={`px-4 py-2.5 text-sm font-bold border-b-2 whitespace-nowrap ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-stone-400'}`}>{LABELS[t]}</button>)}
      </div>
      {tab === 'daily' && <Daily token={token} />}
      {tab === 'monthly' && <Monthly token={token} />}
      {tab === 'subject' && <Subject token={token} />}
      {tab === 'cumulative' && <Cumulative token={token} />}
      {tab === 'staff' && <Staff token={token} />}
    </div>
  );
}

function Daily({ token }: any) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [cls, setCls] = useState('10');
  const [rows, setRows] = useState<any[]>([]);
  const load = useCallback(async () => setRows((await aApi(`/reports/daily?date=${date}&class=${cls}`, {}, token)).rows), [date, cls, token]);
  useEffect(() => { load(); }, [load]);
  const print = () => {
    const w = window.open('', '_blank'); if (!w) return;
    const body = rows.map((r, i) => `<tr><td>${i + 1}</td><td>${r.roll_number || ''}</td><td>${r.name}</td><td>${r.status}</td></tr>`).join('');
    w.document.write(`<html><body style="font-family:sans-serif;padding:24px"><h2>Daily Attendance Register</h2><p>Class ${cls} · ${date}</p><table border="1" cellpadding="6" style="border-collapse:collapse;width:100%"><tr><th>#</th><th>Roll</th><th>Name</th><th>Status</th></tr>${body}</table><br/><br/><p>Teacher signature: ____________________</p></body></html>`);
    w.print();
  };
  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800" />
        <select value={cls} onChange={(e) => setCls(e.target.value)} className="px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800">{['8', '9', '10', '11', '12'].map((c) => <option key={c}>{c}</option>)}</select>
        <button onClick={print} className="px-3 py-2 rounded-lg text-sm font-bold border border-stone-300 dark:border-stone-700 inline-flex items-center gap-1"><Printer className="w-4 h-4" /> Print register (PDF)</button>
      </div>
      <DataTable csvName={`daily-${date}`} rows={rows} columns={[
        { key: 'roll_number', label: 'Roll' }, { key: 'name', label: 'Name' }, { key: 'section', label: 'Sec' },
        { key: 'status', label: 'Status', render: (r) => <span className="font-bold text-xs">{r.status}</span> }, { key: 'marking_method', label: 'Method' },
      ]} />
    </div>
  );
}

function Monthly({ token }: any) {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [cls, setCls] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const load = useCallback(async () => setRows((await aApi(`/reports/monthly?month=${month}${cls ? '&class=' + cls : ''}`, {}, token)).rows), [month, cls, token]);
  useEffect(() => { load(); }, [load]);
  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center">
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800" />
        <select value={cls} onChange={(e) => setCls(e.target.value)} className="px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800"><option value="">All classes</option>{['8', '9', '10', '11', '12'].map((c) => <option key={c}>{c}</option>)}</select>
        <div className="flex gap-3 text-xs ml-2">{[['>85%', 'green'], ['75–85%', 'amber'], ['<75%', 'red']].map(([l, c]) => <span key={c} className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: dot(c) }} />{l}</span>)}</div>
      </div>
      <DataTable csvName={`monthly-${month}`} rows={rows} columns={[
        { key: 'name', label: 'Student' }, { key: 'class', label: 'Class', render: (r) => `${r.class || '-'}${r.section || ''}` },
        { key: 'present_days', label: 'Present' }, { key: 'absent_days', label: 'Absent' }, { key: 'late_days', label: 'Late' }, { key: 'leave_days', label: 'Leave' },
        { key: 'attendance_pct', label: 'Attendance %', value: (r) => Number(r.attendance_pct), render: (r) => <span className="inline-flex items-center gap-1.5 font-bold"><span className="w-2.5 h-2.5 rounded-full" style={{ background: dot(r.color) }} />{r.attendance_pct}%</span> },
      ]} />
    </div>
  );
}

function Subject({ token }: any) {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { aApi('/reports/subjectwise', {}, token).then(setRows); }, [token]);
  return <DataTable csvName="subjectwise" rows={rows} columns={[
    { key: 'subject', label: 'Subject' }, { key: 'faculty', label: 'Faculty' }, { key: 'present', label: 'Present' }, { key: 'total', label: 'Total' },
    { key: 'pct', label: '%', value: (r) => Number(r.pct), render: (r) => `${r.pct}%` },
  ]} />;
}

function Cumulative({ token }: any) {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<any>(null);
  useEffect(() => { aApi(`/reports/cumulative?days=${days}`, {}, token).then(setData); }, [days, token]);
  return (
    <div className="space-y-4">
      <div className="flex gap-2">{[30, 60, 90].map((d) => <button key={d} onClick={() => setDays(d)} className={`px-3 py-1.5 rounded-lg text-sm font-bold ${days === d ? 'bg-blue-600 text-white' : 'border border-stone-300 dark:border-stone-700'}`}>Last {d} days</button>)}</div>
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4">
        <h3 className="text-sm font-bold text-stone-500 uppercase mb-3">Attendance trend</h3>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data?.trend || []}><defs><linearGradient id="at" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22c55e" stopOpacity={0.4} /><stop offset="100%" stopColor="#22c55e" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" /><XAxis dataKey="date" tick={{ fontSize: 10 }} interval={Math.ceil((data?.trend?.length || 1) / 8)} /><YAxis domain={[0, 100]} tick={{ fontSize: 10 }} /><Tooltip /><Area type="monotone" dataKey="present_pct" stroke="#22c55e" fill="url(#at)" name="Present %" /></AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4">
        <h3 className="text-sm font-bold text-stone-500 uppercase mb-3">Distribution</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data?.distribution || []}><CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" /><XAxis dataKey="status" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="n" fill="#3b82f6" radius={[6, 6, 0, 0]} /></BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Staff({ token }: any) {
  const [data, setData] = useState<any>(null);
  useEffect(() => { aApi('/reports/staff', {}, token).then(setData); }, [token]);
  return (
    <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5">
      <h3 className="text-sm font-bold text-stone-500 uppercase mb-3">Staff attendance (Teaching / Non-Teaching)</h3>
      {data?.rows?.length ? <pre className="text-xs">{JSON.stringify(data.rows, null, 2)}</pre> : <p className="text-sm text-stone-400">No staff attendance recorded yet.</p>}
      <p className="text-[11px] text-stone-400 mt-3">{data?.note}</p>
    </div>
  );
}
