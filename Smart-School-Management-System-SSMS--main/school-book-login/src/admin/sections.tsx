import { useCallback, useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import Papa from 'papaparse';
import toast from 'react-hot-toast';
import {
  Cpu, MemoryStick, HardDrive, Database, Activity, AlertTriangle, RefreshCw, LogOut, Lock, Unlock,
  KeyRound, Trash2, UserPlus, Upload, ShieldCheck, DollarSign, FileText, CheckCircle2, Settings as Cog,
  CalendarDays, Mail, Plus, Download, Archive, UserX, TrendingUp, TrendingDown, Sparkles, Brain,
} from 'lucide-react';
import { apiFetch } from '../rbac/api';
import { useAuth } from '../rbac/auth';
import { DataTable, Column } from './DataTable';
import { Gauge } from './Gauge';

function useApi() {
  const { token } = useAuth();
  return useCallback(
    <T = any,>(path: string, opts: { method?: string; body?: any } = {}) =>
      apiFetch<T>('/admin' + path, { ...opts, token }),
    [token],
  );
}

const Card = ({ title, children, right }: any) => (
  <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5">
    {(title || right) && (
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider">{title}</h3>
        {right}
      </div>
    )}
    {children}
  </div>
);

const money = (n: any) => '₹' + Number(n || 0).toLocaleString('en-IN');
const fmtBytes = (b: number) => (b > 1e9 ? (b / 1e9).toFixed(1) + ' GB' : (b / 1e6).toFixed(0) + ' MB');

/* ============================= 1. SYSTEM HEALTH ============================= */
export function SystemHealth() {
  const api = useApi();
  const [sys, setSys] = useState<any>(null);
  const [db, setDb] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [openErr, setOpenErr] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [s, d, m, ss] = await Promise.all([
        api('/health/system'), api('/health/db'), api('/metrics'), api<any[]>('/sessions'),
      ]);
      setSys(s); setDb(d); setMetrics(m); setSessions(ss);
      if (s.memory.pct >= 90 || s.cpu.pct >= 90 || (s.disk?.pct ?? 0) >= 90) {
        toast.error(`Critical: ${s.memory.pct >= 90 ? 'memory' : s.cpu.pct >= 90 ? 'CPU' : 'disk'} usage high`, { id: 'health-crit' });
      }
    } catch (e: any) { toast.error(e.message); }
  }, [api]);

  useEffect(() => { refresh(); const t = setInterval(refresh, 30000); return () => clearInterval(t); }, [refresh]);

  const revoke = async (id: string) => { await api(`/sessions/${id}/revoke`, { method: 'POST', body: { reason: 'Forced logout by Super Admin' } }); toast.success('Session revoked'); refresh(); };
  const revokeAll = async () => { const r = await api<any>('/sessions/revoke-all', { method: 'POST' }); toast.success(`Revoked ${r.revoked} sessions`); refresh(); };

  const sessionCols: Column<any>[] = [
    { key: 'email', label: 'User' },
    { key: 'role', label: 'Role' },
    { key: 'ip', label: 'IP' },
    { key: 'user_agent', label: 'Device', render: (r) => <span className="text-xs">{(r.user_agent || '').slice(0, 28) || '—'}</span> },
    { key: 'last_activity', label: 'Last activity', value: (r) => r.last_activity, render: (r) => new Date(r.last_activity).toLocaleTimeString() },
    { key: 'act', label: '', sortable: false, render: (r) => <button onClick={() => revoke(r.id)} className="inline-flex items-center gap-1 text-red-500 hover:text-red-700 text-xs font-bold"><LogOut className="w-3.5 h-3.5" /> Force logout</button> },
  ];

  if (!sys) return <p className="text-stone-400">Loading system health…</p>;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Gauge value={sys.cpu.pct} label="CPU" sub={`${sys.cpu.cores} cores · load ${sys.cpu.load[0]}`} />
        <Gauge value={sys.memory.pct} label="Memory" sub={`${fmtBytes(sys.memory.used)} / ${fmtBytes(sys.memory.total)}`} />
        <Gauge value={sys.disk?.pct ?? 0} label="Disk" sub={sys.disk ? `${fmtBytes(sys.disk.used)} used` : 'n/a'} />
        <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 flex flex-col justify-center">
          <div className="flex items-center gap-2 text-stone-500 text-xs uppercase font-bold"><Database className="w-4 h-4" /> Database</div>
          <div className={`text-2xl font-bold mt-1 ${db?.status === 'healthy' ? 'text-emerald-500' : 'text-amber-500'}`}>{db?.status}</div>
          <div className="text-[11px] text-stone-400 mt-1">{db?.latencyMs}ms · pool {db?.pool.idle}/{db?.pool.max} idle · {db?.dbSize}</div>
          <div className="text-[11px] text-stone-400">last backup: {db?.lastBackup ? new Date(db.lastBackup.created_at).toLocaleString() : 'never'}</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="API call rate — last 24h" right={<button onClick={refresh} className="text-stone-400 hover:text-stone-600"><RefreshCw className="w-4 h-4" /></button>}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={metrics?.last24h || []}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} /><stop offset="100%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={3} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="calls" stroke="#3b82f6" fill="url(#g1)" name="Calls" />
                <Area type="monotone" dataKey="errors" stroke="#ef4444" fill="#ef444433" name="Errors" />
              </AreaChart>
            </ResponsiveContainer>
            <p className="text-[11px] text-stone-400 mt-1">In-process metrics (reset on server restart). Total calls: {metrics?.totalCalls} · error rate: {metrics?.errorRate}%</p>
          </Card>
        </div>
        <Card title="Error tracker" right={<span className="text-xs text-stone-400">{metrics?.recentErrors?.length || 0}</span>}>
          <div className="space-y-2 max-h-56 overflow-auto">
            {(metrics?.recentErrors || []).length === 0 ? <p className="text-stone-400 text-sm">No errors recorded.</p> :
              metrics.recentErrors.map((e: any) => (
                <div key={e.id} className="rounded-lg border border-red-100 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 p-2">
                  <button onClick={() => setOpenErr(openErr === e.id ? null : e.id)} className="text-left w-full">
                    <div className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> {e.message}</div>
                    <div className="text-[10px] text-stone-400">{e.method} {e.path} · {new Date(e.at).toLocaleTimeString()}</div>
                  </button>
                  {openErr === e.id && e.stack && <pre className="mt-2 text-[10px] text-stone-500 overflow-auto max-h-32 whitespace-pre-wrap">{e.stack}</pre>}
                </div>
              ))}
          </div>
        </Card>
      </div>

      <Card title="Active user sessions" right={<button onClick={revokeAll} className="text-xs font-bold text-red-500 hover:text-red-700">Force logout all</button>}>
        <DataTable columns={sessionCols} rows={sessions} csvName="active-sessions" />
      </Card>
    </div>
  );
}

/* ============================= 2. USER MANAGEMENT ============================= */
export function UserManagement() {
  const api = useApi();
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ email: '', name: '', password: '', primary_role: 'student' });
  const [csv, setCsv] = useState('');

  const load = useCallback(async () => {
    setUsers(await api<any[]>('/users'));
    setRoles(await apiFetch<any[]>('/roles', { token: null }));
  }, [api]);
  useEffect(() => { load(); }, [load]);

  const act = async (fn: Promise<any>, ok: string) => { try { await fn; toast.success(ok); load(); } catch (e: any) { toast.error(e.message); } };
  const lock = (u: any) => { const reason = prompt(`Lock ${u.email} — reason?`); if (reason != null) act(api(`/users/${u.id}/lock`, { method: 'POST', body: { reason } }), 'Account locked'); };
  const reset = (u: any) => { const pw = prompt(`New password for ${u.email} (blank = send reset link)`); act(api(`/users/${u.id}/reset-password`, { method: 'POST', body: pw ? { password: pw } : {} }).then((r: any) => r.resetLink && navigator.clipboard?.writeText(r.resetLink)), pw ? 'Password set' : 'Reset link generated (copied)'); };
  const create = async () => { try { await api('/users', { method: 'POST', body: form }); toast.success('User created'); setShowCreate(false); setForm({ email: '', name: '', password: '', primary_role: 'student' }); load(); } catch (e: any) { toast.error(e.message); } };
  const bulk = () => {
    const parsed = Papa.parse(csv.trim(), { header: true, skipEmptyLines: true });
    const rows = parsed.data as any[];
    if (!rows.length) return toast.error('No rows parsed');
    act(api('/users/import', { method: 'POST', body: { users: rows } }).then((r: any) => toast.success(`Imported ${r.created}, failed ${r.failed} (default pw ${r.defaultPassword})`)), 'Import done');
    setCsv('');
  };
  const toggle2fa = (key: string, enabled: boolean) => act(api(`/roles/${key}/twofa`, { method: 'POST', body: { enabled } }), '2FA updated');

  const cols: Column<any>[] = [
    { key: 'email', label: 'Email' },
    { key: 'name', label: 'Name' },
    { key: 'primary_role', label: 'Primary role' },
    { key: 'roles', label: 'Roles', value: (r) => (r.roles || []).join(' '), render: (r) => <span className="text-xs">{(r.roles || []).join(', ')}</span> },
    { key: 'locked', label: 'Status', value: (r) => (r.locked ? 'locked' : 'active'), render: (r) => r.locked ? <span className="text-xs font-bold text-red-500">🔒 {r.lock_reason}</span> : <span className="text-xs text-emerald-500">active</span> },
    {
      key: 'act', label: 'Actions', sortable: false, render: (u) => (
        <div className="flex items-center gap-2">
          {u.locked
            ? <button title="Unlock" onClick={() => act(api(`/users/${u.id}/unlock`, { method: 'POST' }), 'Unlocked')} className="text-emerald-500"><Unlock className="w-4 h-4" /></button>
            : <button title="Lock" onClick={() => lock(u)} className="text-amber-500"><Lock className="w-4 h-4" /></button>}
          <button title="Reset password" onClick={() => reset(u)} className="text-blue-500"><KeyRound className="w-4 h-4" /></button>
          <button title="Force logout" onClick={() => act(api(`/users/${u.id}/force-logout`, { method: 'POST' }), 'Sessions revoked')} className="text-stone-500"><LogOut className="w-4 h-4" /></button>
          <button title="Delete" onClick={() => confirm(`Delete ${u.email}?`) && act(api(`/users/${u.id}`, { method: 'DELETE' }), 'Deleted')} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => setShowCreate((v) => !v)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700"><UserPlus className="w-4 h-4" /> New user</button>
      </div>

      {showCreate && (
        <Card title="Create user">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <input placeholder="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800" />
            <input placeholder="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800" />
            <input placeholder="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800" />
            <select value={form.primary_role} onChange={(e) => setForm({ ...form, primary_role: e.target.value })} className="px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800">
              {roles.map((r) => <option key={r.key} value={r.key}>{r.name}</option>)}
            </select>
          </div>
          <button onClick={create} className="mt-3 px-4 py-2 rounded-lg font-bold text-white bg-emerald-600">Create</button>
        </Card>
      )}

      <Card title="Users"><DataTable columns={cols} rows={users} csvName="users" onExport={(n) => api('/export-log', { method: 'POST', body: { dataset: 'users', rows: n } })} /></Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="Bulk import (CSV)">
          <p className="text-xs text-stone-400 mb-2">Header row: <span className="font-mono">email,name,primary_role</span>. Paste CSV or load a file.</p>
          <input type="file" accept=".csv" onChange={(e) => { const f = e.target.files?.[0]; if (f) f.text().then(setCsv); }} className="text-xs mb-2" />
          <textarea value={csv} onChange={(e) => setCsv(e.target.value)} rows={5} placeholder={'email,name,primary_role\njane@ssms.local,Jane,teacher'} className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-mono text-xs" />
          <button onClick={bulk} className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-white bg-blue-600"><Upload className="w-4 h-4" /> Import</button>
        </Card>
        <Card title="Two-factor enforcement per role">
          <div className="space-y-2 max-h-64 overflow-auto">
            {roles.map((r) => (
              <label key={r.key} className="flex items-center justify-between py-1.5 border-b border-stone-100 dark:border-stone-800">
                <span className="text-sm">{r.name}</span>
                <input type="checkbox" defaultChecked={r.twofa_required} onChange={(e) => toggle2fa(r.key, e.target.checked)} className="w-4 h-4" />
              </label>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ============================= 3. FINANCIAL ============================= */
export function Financial() {
  const api = useApi();
  const [sum, setSum] = useState<any>(null);
  const [tx, setTx] = useState<any[]>([]);
  const [recon, setRecon] = useState<any>(null);
  const [filters, setFilters] = useState({ status: '', module: '', method: '' });
  const [manual, setManual] = useState({ amount: '', module: 'fees', method: 'cash', description: '' });
  const [invoice, setInvoice] = useState<any>(null);

  const loadTx = useCallback(async () => {
    const qs = new URLSearchParams(Object.entries(filters).filter(([, v]) => v) as any).toString();
    setTx(await api<any[]>(`/transactions${qs ? '?' + qs : ''}`));
  }, [api, filters]);
  useEffect(() => { api('/finance/summary').then(setSum); api('/reconciliation').then(setRecon); }, [api]);
  useEffect(() => { loadTx(); }, [loadTx]);

  const addManual = async () => { try { await api('/transactions', { method: 'POST', body: { ...manual, amount: Number(manual.amount) } }); toast.success('Manual entry created (pending dual approval)'); setManual({ amount: '', module: 'fees', method: 'cash', description: '' }); loadTx(); } catch (e: any) { toast.error(e.message); } };
  const approve = async (id: number) => { try { await api(`/transactions/${id}/approve`, { method: 'POST' }); toast.success('Approved'); loadTx(); } catch (e: any) { toast.error(e.message); } };
  const showInvoice = async (id: number) => setInvoice(await api(`/invoice/${id}`));

  const cols: Column<any>[] = [
    { key: 'ref', label: 'Ref' },
    { key: 'created_at', label: 'Date', render: (r) => new Date(r.created_at).toLocaleDateString() },
    { key: 'module', label: 'Module' },
    { key: 'method', label: 'Method' },
    { key: 'amount', label: 'Amount', value: (r) => Number(r.amount), render: (r) => money(r.amount) },
    { key: 'status', label: 'Status', render: (r) => <span className={`text-xs font-bold ${r.status === 'success' ? 'text-emerald-500' : r.status === 'failed' ? 'text-red-500' : 'text-amber-500'}`}>{r.status}</span> },
    { key: 'act', label: '', sortable: false, render: (r) => (
      <div className="flex gap-2">
        {r.status === 'pending_approval' && <button onClick={() => approve(r.id)} className="text-emerald-500 text-xs font-bold inline-flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Approve</button>}
        <button onClick={() => showInvoice(r.id)} className="text-blue-500 text-xs font-bold inline-flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> GST invoice</button>
      </div>
    ) },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[['Today', sum?.today], ['This Week', sum?.week], ['This Month', sum?.month], ['This Year', sum?.year]].map(([l, v]) => (
          <div key={l as string} className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5">
            <div className="text-[11px] font-bold uppercase text-stone-400">{l as string}</div>
            <div className="text-2xl font-bold text-stone-900 dark:text-stone-50 mt-1">{money(v)}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Revenue — last 6 months">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sum?.monthly || []}><CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" /><XAxis dataKey="label" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip formatter={(v: any) => money(v)} /><Bar dataKey="total" fill="#3b82f6" radius={[6, 6, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
        <Card title="Gateway reconciliation">
          {recon && <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-stone-500">Internal</span><b>{money(recon.internalTotal)}</b></div>
            <div className="flex justify-between"><span className="text-stone-500">Gateway</span><b>{money(recon.gatewayTotal)}</b></div>
            <div className="flex justify-between text-amber-500"><span>Discrepancy</span><b>{money(recon.discrepancy)}</b></div>
            <div className="mt-2 text-xs text-stone-400">{recon.mismatches.length} unmatched · {recon.note}</div>
          </div>}
        </Card>
      </div>

      <Card title="Manual payment entry (dual-approval)">
        <div className="grid sm:grid-cols-4 gap-3">
          <input placeholder="amount" value={manual.amount} onChange={(e) => setManual({ ...manual, amount: e.target.value })} className="px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800" />
          <select value={manual.module} onChange={(e) => setManual({ ...manual, module: e.target.value })} className="px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800">{['fees', 'canteen', 'store', 'transport', 'hostel', 'library'].map((m) => <option key={m}>{m}</option>)}</select>
          <select value={manual.method} onChange={(e) => setManual({ ...manual, method: e.target.value })} className="px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800">{['cash', 'card', 'upi', 'netbanking'].map((m) => <option key={m}>{m}</option>)}</select>
          <input placeholder="description" value={manual.description} onChange={(e) => setManual({ ...manual, description: e.target.value })} className="px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800" />
        </div>
        <button onClick={addManual} className="mt-3 px-4 py-2 rounded-lg font-bold text-white bg-emerald-600">Submit for approval</button>
      </Card>

      <Card title="Transactions" right={
        <div className="flex gap-2">
          {(['status', 'module', 'method'] as const).map((f) => (
            <select key={f} value={(filters as any)[f]} onChange={(e) => setFilters({ ...filters, [f]: e.target.value })} className="px-2 py-1 rounded-lg text-xs border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800">
              <option value="">{f}: all</option>
              {(f === 'status' ? ['success', 'pending', 'failed', 'pending_approval'] : f === 'module' ? ['fees', 'canteen', 'store', 'transport', 'hostel', 'library'] : ['cash', 'card', 'upi', 'netbanking']).map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          ))}
        </div>
      }>
        <DataTable columns={cols} rows={tx} csvName="transactions" onExport={(n) => api('/export-log', { method: 'POST', body: { dataset: 'transactions', rows: n } })} />
      </Card>

      {invoice && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setInvoice(null)}>
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg">Tax Invoice {invoice.invoiceNo}</h3>
            <p className="text-xs text-stone-400 mb-4">{new Date(invoice.date).toLocaleString()} · GST {invoice.gstRate}%</p>
            <table className="w-full text-sm mb-3">
              <tbody>
                {invoice.items.map((it: any, i: number) => <tr key={i}><td>{it.description}</td><td className="text-right">{money(it.base)}</td></tr>)}
                <tr className="text-stone-500"><td>CGST (9%)</td><td className="text-right">{money(invoice.cgst)}</td></tr>
                <tr className="text-stone-500"><td>SGST (9%)</td><td className="text-right">{money(invoice.sgst)}</td></tr>
                <tr className="font-bold border-t border-stone-200"><td>Grand total</td><td className="text-right">{money(invoice.grandTotal)}</td></tr>
              </tbody>
            </table>
            <button onClick={() => setInvoice(null)} className="px-4 py-2 rounded-lg font-bold bg-stone-200 dark:bg-stone-700 w-full">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================= 4. CONFIGURATION ============================= */
export function Configuration() {
  const api = useApi();
  const [settings, setSettings] = useState<any>(null);
  const [fees, setFees] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [inst, setInst] = useState<any>({});

  const load = useCallback(async () => {
    const s = await api<any>('/settings'); setSettings(s); setInst(s.institution || {});
    setFees(await api('/fees')); setHolidays(await api('/holidays'));
    setTemplates(await api('/templates')); setIntegrations(await api('/integrations'));
  }, [api]);
  useEffect(() => { load(); }, [load]);

  const saveInst = async () => { await api('/settings', { method: 'PUT', body: { key: 'institution', value: inst } }); toast.success('Institution settings saved'); };
  const addFee = async (f: any) => { await api('/fees', { method: 'POST', body: f }); toast.success('Fee added'); setFees(await api('/fees')); };
  const addHoliday = async (h: any) => { await api('/holidays', { method: 'POST', body: h }); toast.success('Calendar entry added'); setHolidays(await api('/holidays')); };
  const saveTpl = async (id: number, body: string) => { await api(`/templates/${id}`, { method: 'PUT', body: { body } }); toast.success('Template saved'); };
  const saveCred = async (provider: string, key: string) => { await api('/integrations', { method: 'PUT', body: { provider, key } }); toast.success('Credential encrypted & saved'); load(); };

  if (!settings) return <p className="text-stone-400">Loading configuration…</p>;
  return (
    <div className="space-y-6">
      <Card title="Institution settings">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {['name', 'academic_year', 'timezone', 'currency'].map((k) => (
            <div key={k}><label className="block text-[11px] font-bold uppercase text-stone-400 mb-1">{k.replace('_', ' ')}</label>
              <input value={inst[k] || ''} onChange={(e) => setInst({ ...inst, [k]: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800" /></div>
          ))}
        </div>
        <button onClick={saveInst} className="mt-3 px-4 py-2 rounded-lg font-bold text-white bg-blue-600">Save</button>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="Fee structures">
          <DataTable dense columns={[{ key: 'name', label: 'Name' }, { key: 'amount', label: 'Amount', value: (r) => Number(r.amount), render: (r) => money(r.amount) }, { key: 'applies_to', label: 'Applies to' }, { key: 'frequency', label: 'Freq' }]} rows={fees} csvName="fees" />
          <FeeAdd onAdd={addFee} />
        </Card>
        <Card title="Holiday & academic calendar">
          <DataTable dense columns={[{ key: 'title', label: 'Title' }, { key: 'date', label: 'Date', render: (r) => new Date(r.date).toLocaleDateString() }, { key: 'kind', label: 'Kind' }]} rows={holidays} csvName="calendar" />
          <HolidayAdd onAdd={addHoliday} />
        </Card>
      </div>

      <Card title="Notification templates (variable substitution)">
        <div className="space-y-4">
          {templates.map((t) => (
            <div key={t.id} className="border border-stone-100 dark:border-stone-800 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2"><span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800">{t.channel}</span><b className="text-sm">{t.name}</b></div>
              <textarea defaultValue={t.body} rows={2} onBlur={(e) => saveTpl(t.id, e.target.value)} className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm font-mono" />
              <p className="text-[10px] text-stone-400 mt-1">Use {'{{variable}}'} placeholders. Saved on blur.</p>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Integration credentials vault (AES-256-GCM encrypted)">
        <div className="space-y-2">
          {integrations.map((i) => (
            <div key={i.id} className="flex items-center justify-between gap-3 py-2 border-b border-stone-100 dark:border-stone-800">
              <div><b className="text-sm">{i.provider}</b><div className="text-xs font-mono text-stone-400">{i.masked}</div></div>
              <button onClick={() => { const k = prompt(`New API key for ${i.provider}`); if (k) saveCred(i.provider, k); }} className="text-xs font-bold text-blue-500">Rotate key</button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
const FeeAdd = ({ onAdd }: any) => { const [f, setF] = useState({ name: '', amount: '', applies_to: 'All Students', frequency: 'annual' }); return (
  <div className="flex flex-wrap gap-2 mt-3">
    <input placeholder="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="px-2 py-1.5 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800" />
    <input placeholder="amount" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} className="px-2 py-1.5 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 w-24" />
    <button onClick={() => f.name && onAdd({ ...f, amount: Number(f.amount) })} className="px-3 py-1.5 rounded-lg text-sm font-bold text-white bg-emerald-600"><Plus className="w-4 h-4" /></button>
  </div>
); };
const HolidayAdd = ({ onAdd }: any) => { const [h, setH] = useState({ title: '', date: '', kind: 'holiday' }); return (
  <div className="flex flex-wrap gap-2 mt-3">
    <input placeholder="title" value={h.title} onChange={(e) => setH({ ...h, title: e.target.value })} className="px-2 py-1.5 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800" />
    <input type="date" value={h.date} onChange={(e) => setH({ ...h, date: e.target.value })} className="px-2 py-1.5 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800" />
    <select value={h.kind} onChange={(e) => setH({ ...h, kind: e.target.value })} className="px-2 py-1.5 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800">{['holiday', 'exam', 'event'].map((k) => <option key={k}>{k}</option>)}</select>
    <button onClick={() => h.title && h.date && onAdd(h)} className="px-3 py-1.5 rounded-lg text-sm font-bold text-white bg-emerald-600"><Plus className="w-4 h-4" /></button>
  </div>
); };

/* ============================= 5. COMPLIANCE ============================= */
export function Compliance() {
  const api = useApi();
  const [audit, setAudit] = useState<any[]>([]);
  const [logins, setLogins] = useState<any>({ attempts: [], byCountry: [] });
  const [exports, setExports] = useState<any[]>([]);
  const [risk, setRisk] = useState<any>(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setAudit(await api(`/audit${search ? '?search=' + encodeURIComponent(search) : ''}`));
    setLogins(await api('/login-attempts')); setExports(await api('/export-log')); setRisk(await api('/risk'));
  }, [api, search]);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <Card title="Risk assessment — AI-flagged anomalies">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {risk?.flags.map((f: any, i: number) => (
            <div key={i} className={`rounded-xl p-3 border ${f.severity === 'high' ? 'border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900/40' : f.severity === 'medium' ? 'border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/40' : 'border-stone-200 dark:border-stone-800'}`}>
              <div className="text-[10px] font-bold uppercase text-stone-400">{f.kind} · {f.severity}</div>
              <div className="text-sm font-medium mt-1">{f.message}</div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-stone-400 mt-2">{risk?.note}</p>
      </Card>

      <Card title="Audit trail" right={<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="search who/action/target" className="px-3 py-1.5 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800" />}>
        <DataTable columns={[
          { key: 'created_at', label: 'When', render: (r) => new Date(r.created_at).toLocaleString() },
          { key: 'actor_email', label: 'Who' }, { key: 'actor_role', label: 'Role' },
          { key: 'action', label: 'Action' }, { key: 'target', label: 'Target' }, { key: 'ip', label: 'IP' },
        ]} rows={audit} csvName="audit-trail" />
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Failed login attempts">
            <DataTable dense columns={[
              { key: 'created_at', label: 'When', render: (r) => new Date(r.created_at).toLocaleString() },
              { key: 'email', label: 'Email' }, { key: 'ip', label: 'IP' }, { key: 'country', label: 'Country' },
              { key: 'success', label: 'Result', value: (r) => (r.success ? 'ok' : 'fail'), render: (r) => r.success ? <span className="text-emerald-500 text-xs">ok</span> : <span className="text-red-500 text-xs font-bold">FAIL</span> },
            ]} rows={logins.attempts} csvName="login-attempts" />
          </Card>
        </div>
        <Card title="Geo-IP summary">
          <div className="space-y-2">
            {logins.byCountry.map((c: any) => (
              <div key={c.country} className="text-sm">
                <div className="flex justify-between"><span>{c.country}</span><span className="text-stone-400">{c.failed} failed / {c.n}</span></div>
                <div className="h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full mt-1"><div className="h-full bg-red-500 rounded-full" style={{ width: `${c.n ? (c.failed / c.n) * 100 : 0}%` }} /></div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-stone-400 mt-2">Geo-IP map simulated (country from seed; no live geo lookup).</p>
        </Card>
      </div>

      <Card title="Data export log (GDPR)">
        <DataTable dense columns={[
          { key: 'created_at', label: 'When', render: (r) => new Date(r.created_at).toLocaleString() },
          { key: 'actor_email', label: 'Who' }, { key: 'dataset', label: 'Dataset' }, { key: 'rows', label: 'Rows' }, { key: 'ip', label: 'IP' },
        ]} rows={exports} csvName="export-log" />
      </Card>
    </div>
  );
}

/* ============================= 6. DATA MANAGEMENT ============================= */
export function DataManagement() {
  const api = useApi();
  const [backups, setBackups] = useState<any[]>([]);
  const [erasures, setErasures] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => { setBackups(await api('/backups')); setErasures(await api('/erasure')); }, [api]);
  useEffect(() => { load(); }, [load]);

  const doBackup = async () => { setBusy(true); try { const r = await api<any>('/backup', { method: 'POST' }); toast.success(`Backup created (${(r.size / 1024).toFixed(0)} KB)`); load(); } catch (e: any) { toast.error(e.message); } finally { setBusy(false); } };
  const dryRun = async (filename: string) => { try { const r = await api<any>('/restore', { method: 'POST', body: { filename, dryRun: true } }); toast.success(r.message); } catch (e: any) { toast.error(e.message); } };
  const archive = async () => { const y = prompt('Archive academic data on/before year:', '2024'); if (!y) return; const r = await api<any>('/archive', { method: 'POST', body: { year: Number(y) } }); toast.success(`${r.archivable} records archivable for ≤${r.year}`); };
  const erase = async () => { const email = prompt('Right-to-erasure: subject email'); if (!email) return; await api('/erasure', { method: 'POST', body: { subject_email: email } }); toast.success('Erasure request logged'); load(); };
  const { token } = useAuth();

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button onClick={doBackup} disabled={busy} className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 text-left hover:border-blue-300 disabled:opacity-50">
          <Download className="w-6 h-6 text-blue-500 mb-2" /><div className="font-bold">One-click backup</div><div className="text-xs text-stone-400">Real pg_dump</div>
        </button>
        <button onClick={archive} className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 text-left hover:border-amber-300">
          <Archive className="w-6 h-6 text-amber-500 mb-2" /><div className="font-bold">Archive by year</div><div className="text-xs text-stone-400">Simulated</div>
        </button>
        <button onClick={erase} className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 text-left hover:border-red-300">
          <UserX className="w-6 h-6 text-red-500 mb-2" /><div className="font-bold">GDPR erasure</div><div className="text-xs text-stone-400">Right to be forgotten</div>
        </button>
        <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5">
          <Upload className="w-6 h-6 text-emerald-500 mb-2" /><div className="font-bold">Bulk import</div><div className="text-xs text-stone-400">Students/staff/fees → see User Management</div>
        </div>
      </div>

      <Card title="Backups">
        <DataTable dense columns={[
          { key: 'created_at', label: 'When', render: (r) => new Date(r.created_at).toLocaleString() },
          { key: 'filename', label: 'File' },
          { key: 'size_bytes', label: 'Size', value: (r) => Number(r.size_bytes), render: (r) => `${(r.size_bytes / 1024).toFixed(0)} KB` },
          { key: 'created_by', label: 'By' },
          { key: 'act', label: '', sortable: false, render: (r) => (
            <div className="flex gap-3">
              <a href={`http://localhost:4000/api/admin/backups/${r.filename}/download`} className="text-blue-500 text-xs font-bold" onClick={(e) => { e.preventDefault(); fetch(`http://localhost:4000/api/admin/backups/${r.filename}/download`, { headers: { Authorization: `Bearer ${token}` } }).then((res) => res.blob()).then((b) => { const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = r.filename; a.click(); }); }}>Download</a>
              <button onClick={() => dryRun(r.filename)} className="text-stone-500 text-xs font-bold">Restore (dry-run)</button>
            </div>
          ) },
        ]} rows={backups} csvName="backups" />
      </Card>

      <Card title="GDPR erasure requests">
        <DataTable dense columns={[
          { key: 'created_at', label: 'Requested', render: (r) => new Date(r.created_at).toLocaleString() },
          { key: 'subject_email', label: 'Subject' }, { key: 'status', label: 'Status' }, { key: 'requested_by', label: 'By' },
        ]} rows={erasures} csvName="erasure-requests" />
      </Card>
    </div>
  );
}

/* ============================= 7. ANALYTICS ============================= */
export function Analytics() {
  const api = useApi();
  const [kpis, setKpis] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [pred, setPred] = useState<any>(null);
  useEffect(() => { api('/kpis').then(setKpis); api('/weekly-summary').then(setSummary); api('/predictions').then(setPred); }, [api]);

  const Trend = ({ v }: { v: number }) => v >= 0
    ? <span className="text-emerald-500 text-xs inline-flex items-center"><TrendingUp className="w-3 h-3" />{v}%</span>
    : <span className="text-red-500 text-xs inline-flex items-center"><TrendingDown className="w-3 h-3" />{v}%</span>;

  const kpiCards = kpis ? [
    { label: 'Enrollment', v: kpis.enrollment.value, t: kpis.enrollment.trend, suffix: '' },
    { label: 'Attendance', v: kpis.attendance.value, t: kpis.attendance.trend, suffix: '%' },
    { label: 'Fee Collection', v: kpis.feeCollection.value, t: kpis.feeCollection.trend, suffix: '%' },
    { label: 'Staff Retention', v: kpis.staffRetention.value, t: kpis.staffRetention.trend, suffix: '%' },
  ] : [];

  const riskList = (title: string, items: any[], color: string) => (
    <Card title={title}>
      <div className="space-y-2">
        {items?.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-2 border-b border-stone-100 dark:border-stone-800 py-2">
            <div><b className="text-sm">{p.name}</b> <span className="text-xs text-stone-400">{p.id}</span><div className="text-[10px] text-stone-400">{p.factors.join(' · ')}</div></div>
            <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: color + '22', color }}>{Math.round(p.score * 100)}%</span>
          </div>
        ))}
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((k) => (
          <div key={k.label} className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5">
            <div className="text-[11px] font-bold uppercase text-stone-400">{k.label}</div>
            <div className="text-3xl font-bold text-stone-900 dark:text-stone-50 mt-1">{k.v}{k.suffix}</div>
            <div className="mt-1"><Trend v={k.t} /></div>
          </div>
        ))}
      </div>

      <Card title="AI weekly summary" right={<button onClick={() => toast.success('Simulated: report would be emailed to Super Admin (Mondays 08:00)')} className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-500"><Mail className="w-4 h-4" /> Email now</button>}>
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div><p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">{summary?.summary}</p>
            <p className="text-[11px] text-stone-400 mt-2">{summary?.note}</p></div>
        </div>
      </Card>

      <div className="flex items-center gap-2 text-stone-500"><Brain className="w-5 h-5" /><h3 className="font-bold">Predictive flags</h3><span className="text-xs text-stone-400">{pred?.note}</span></div>
      <div className="grid lg:grid-cols-3 gap-6">
        {riskList('Dropout risk', pred?.dropoutRisk, '#ef4444')}
        {riskList('Fee default risk', pred?.feeDefaultRisk, '#f59e0b')}
        {riskList('Staff attrition risk', pred?.staffAttritionRisk, '#8b5cf6')}
      </div>
    </div>
  );
}
