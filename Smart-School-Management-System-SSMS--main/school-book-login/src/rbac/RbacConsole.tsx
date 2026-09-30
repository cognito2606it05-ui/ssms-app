import { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard, Users, GraduationCap, UserCog, CalendarCheck, DollarSign, FileText,
  Clock, Library, Bus, BedDouble, Coffee, Package, Trophy, Wrench, Shield, Phone,
  BookOpen, BarChart3, ScrollText, KeyRound, UserPlus, Settings, LogOut, ChevronDown,
  Plus, Trash2, Check, X, ShieldAlert, ShieldCheck, Crown, Sparkles, PlayCircle,
} from 'lucide-react';
import { apiFetch } from './api';
import { Action, RoleMeta, useAuth } from './auth';
import { Protected } from './Protected';
import { UnifiedLoginRedirect } from './UnifiedLogin';

const ICONS: Record<string, any> = {
  dashboard: LayoutDashboard, students: Users, teachers: GraduationCap, staff: UserCog,
  attendance: CalendarCheck, fees: DollarSign, exams: FileText, timetable: Clock,
  library: Library, transport: Bus, hostel: BedDouble, canteen: Coffee, store: Package,
  sports: Trophy, maintenance: Wrench, security: Shield, frontoffice: Phone, lms: BookOpen,
  reports: BarChart3, audit: ScrollText, rbac: KeyRound, users: UserPlus, settings: Settings,
};
const ACTIONS: Action[] = ['read', 'write', 'edit', 'delete', 'approve', 'export'];

const KPIS: Record<string, { label: string; value: string; sub: string }[]> = {
  students: [{ label: 'Total Students', value: '1,248', sub: '+32 this term' }, { label: 'Active Today', value: '1,190', sub: '95.3% present' }],
  teachers: [{ label: 'Teachers', value: '86', sub: '12 departments' }],
  fees: [{ label: 'Collected', value: '$124,500', sub: '78% of target' }, { label: 'Pending', value: '$34,100', sub: '142 invoices' }],
  attendance: [{ label: "Today's Attendance", value: '95.3%', sub: '1,190 / 1,248' }],
  exams: [{ label: 'Avg. Score', value: '76.4%', sub: 'Term 2' }],
  library: [{ label: 'Books Issued', value: '312', sub: '18 overdue' }],
  transport: [{ label: 'Active Routes', value: '24', sub: '31 vehicles' }],
  hostel: [{ label: 'Residents', value: '418', sub: '92% occupancy' }],
  canteen: [{ label: "Today's Sales", value: '$1,840', sub: '320 orders' }],
  store: [{ label: 'SKUs', value: '512', sub: '23 low stock' }],
  sports: [{ label: 'Active Teams', value: '14', sub: '3 events this week' }],
  maintenance: [{ label: 'Open Tickets', value: '9', sub: '2 high priority' }],
  security: [{ label: 'Visitors Today', value: '47', sub: '3 on campus now' }],
  lms: [{ label: 'Courses', value: '64', sub: '1,120 enrolments' }],
  reports: [{ label: 'Reports', value: '38', sub: 'updated hourly' }],
};

function TierBadge({ tier }: { tier: 'basic' | 'premium' }) {
  return tier === 'premium' ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow">
      <Crown className="w-3 h-3" /> Premium
    </span>
  ) : (
    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300">Basic</span>
  );
}

function Flag({ on }: { on: boolean }) {
  return on
    ? <Check className="w-4 h-4 text-emerald-500" />
    : <X className="w-3.5 h-3.5 text-stone-300 dark:text-stone-600" />;
}

/* ----------------------------- Login ----------------------------- */
function LoginView() {
  const { login, loading, error } = useAuth();
  const [roles, setRoles] = useState<RoleMeta[]>([]);
  const [email, setEmail] = useState('super_admin@ssms.local');
  const [password, setPassword] = useState('Passw0rd!');

  useEffect(() => { apiFetch<RoleMeta[]>('/roles').then(setRoles).catch(() => {}); }, []);
  const basic = roles.filter((r) => r.tier === 'basic');
  const premium = roles.filter((r) => r.tier === 'premium');

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-950 dark:to-stone-900">
      <div className="w-full max-w-md rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-stone-900 dark:text-stone-50">RBAC Console</h1>
            <p className="text-xs text-stone-500 dark:text-stone-400">17-role hierarchy · JWT · PostgreSQL</p>
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); login(email, password); }} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase mb-1.5">Quick pick a demo role</label>
            <div className="relative">
              <select
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full appearance-none px-4 py-3 pr-10 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
              >
                <optgroup label="Basic Tier (8)">
                  {basic.map((r) => <option key={r.key} value={`${r.key}@ssms.local`}>{r.name} · L{r.level} · {r.access_pct}%</option>)}
                </optgroup>
                <optgroup label="Premium Tier (9)">
                  {premium.map((r) => <option key={r.key} value={`${r.key}@ssms.local`}>{r.name} · L{r.level} · {r.access_pct}%</option>)}
                </optgroup>
                <optgroup label="Multi-role">
                  <option value="multi@ssms.local">Teacher + Hostel Supervisor</option>
                </optgroup>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase mb-1.5">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100" />
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase mb-1.5">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100" />
          </div>
          {error && <p className="text-red-500 text-xs font-medium bg-red-50 dark:bg-red-900/20 p-2.5 rounded-lg">{error}</p>}
          <button disabled={loading} className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg disabled:opacity-60">
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
          <p className="text-center text-xs text-stone-400">All demo users share password <span className="font-mono font-bold">Passw0rd!</span></p>
        </form>
      </div>
    </div>
  );
}

/* --------------------------- Dashboard --------------------------- */
function Dashboard() {
  const { session } = useAuth();
  if (!session) return null;
  const readable = Object.entries(session.permissions).filter(([, p]) => p.read).map(([m]) => m);
  const cards = readable.flatMap((m) => (KPIS[m] || []).map((k) => ({ ...k, module: m })));
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Welcome, {session.user.name}</h2>
        <p className="text-stone-500 dark:text-stone-400 text-sm">
          Dashboard cards below are rendered conditionally for <span className="font-bold">{session.activeRoleMeta?.name}</span> based on permitted modules.
        </p>
      </div>
      {cards.length === 0 ? (
        <p className="text-stone-500 text-sm">No KPI widgets are available for this role.</p>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((c, i) => {
            const Icon = ICONS[c.module] || LayoutDashboard;
            return (
              <div key={i} className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">{c.label}</span>
                  <Icon className="w-4 h-4 text-blue-500" />
                </div>
                <div className="text-2xl font-bold text-stone-900 dark:text-stone-50">{c.value}</div>
                <div className="text-xs text-stone-500 mt-1">{c.sub}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------ Generic module ------------------------- */
function ModulePanel({ moduleKey, name }: { moduleKey: string; name: string }) {
  const { session, token } = useAuth();
  const perm = session?.permissions[moduleKey];
  const [test, setTest] = useState<string | null>(null);
  const runGuardTest = async () => {
    setTest('…');
    try {
      const r = await apiFetch<any>(`/secure/${moduleKey}`, { token });
      setTest(`✅ ${r.message} (role '${r.role}')`);
    } catch (e: any) {
      setTest(`⛔ ${e.data?.message || e.message}`);
    }
  };
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-50">{name}</h2>
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6">
        <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-4">Your granular permissions on this module</h3>
        <div className="flex flex-wrap gap-2">
          {ACTIONS.map((a) => {
            const on = !!perm?.[a];
            return (
              <span key={a} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${on ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-stone-100 text-stone-400 dark:bg-stone-800 dark:text-stone-600'}`}>
                {on ? <Check className="w-3.5 h-3.5" /> : <X className="w-3 h-3" />} {a}
              </span>
            );
          })}
        </div>
      </div>
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6">
        <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-2">Middleware guard (live)</h3>
        <p className="text-xs text-stone-500 mb-4">Calls <span className="font-mono">GET /api/secure/{moduleKey}</span> — the server enforces <span className="font-mono">read</span> on the active role and logs denials to the audit table.</p>
        <button onClick={runGuardTest} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700">
          <PlayCircle className="w-4 h-4" /> Test guarded endpoint
        </button>
        {test && <p className="mt-3 text-sm font-medium text-stone-700 dark:text-stone-300">{test}</p>}
      </div>
    </div>
  );
}

/* --------------------------- RBAC matrix + custom builder --------------------------- */
function RbacManager() {
  const { token, can, session } = useAuth();
  const [roles, setRoles] = useState<RoleMeta[]>([]);
  const [modules, setModules] = useState<{ key: string; name: string }[]>([]);
  const [matrix, setMatrix] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [cloneFrom, setCloneFrom] = useState('teacher');
  const [editing, setEditing] = useState<{ key: string; perms: any } | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const canBuild = session?.tier === 'premium' && can('rbac', 'write');

  const load = async () => {
    const [r, m, mx] = await Promise.all([
      apiFetch<RoleMeta[]>('/roles'),
      apiFetch<any[]>('/modules'),
      apiFetch<any[]>('/matrix', { token }),
    ]);
    setRoles(r); setModules(m); setMatrix(mx);
  };
  useEffect(() => { load().catch((e) => setMsg(e.message)); /* eslint-disable-next-line */ }, []);

  const cell = (roleKey: string, moduleKey: string) => matrix.find((x) => x.role_key === roleKey && x.module_key === moduleKey);

  const clone = async () => {
    setMsg(null);
    try {
      const created = await apiFetch<any>('/custom-roles', { method: 'POST', token, body: { name, cloneFrom } });
      setName('');
      await load();
      setEditing({ key: created.key, perms: created.permissions });
      setMsg(`Created custom role “${created.name}”. Toggle its permissions below and save.`);
    } catch (e: any) { setMsg(e.message); }
  };

  const toggle = (moduleKey: string, action: Action) => {
    if (!editing) return;
    const cur = editing.perms[moduleKey] || {};
    setEditing({ ...editing, perms: { ...editing.perms, [moduleKey]: { ...cur, [action]: !cur[action] } } });
  };

  const save = async () => {
    if (!editing) return;
    const permissions = Object.entries(editing.perms).map(([module, p]: any) => ({ module, ...p }));
    await apiFetch(`/custom-roles/${editing.key}/permissions`, { method: 'PUT', token, body: { permissions } });
    await load();
    setMsg('Custom role permissions saved.');
  };

  const remove = async (key: string) => {
    await apiFetch(`/custom-roles/${key}`, { method: 'DELETE', token });
    if (editing?.key === key) setEditing(null);
    await load();
    setMsg('Custom role deleted.');
  };

  return (
    <Protected module="rbac" action="read">
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Roles & Permissions Matrix</h2>
          <p className="text-stone-500 dark:text-stone-400 text-sm">Granular read / write / edit / delete / approve / export flags per module per role.</p>
        </div>
        {msg && <p className="text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 p-3 rounded-xl">{msg}</p>}

        {/* Custom role builder (Premium) */}
        <div className="rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/10 p-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-stone-900 dark:text-stone-50">Custom Role Builder</h3>
            <TierBadge tier="premium" />
          </div>
          {!canBuild ? (
            <p className="text-sm text-stone-500">Requires Premium tier and <span className="font-mono">rbac:write</span>. Sign in as Super Admin to use the builder.</p>
          ) : (
            <>
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-stone-500 mb-1">New role name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Exam Controller" className="px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-stone-500 mb-1">Clone from</label>
                  <select value={cloneFrom} onChange={(e) => setCloneFrom(e.target.value)} className="px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100">
                    {roles.filter((r) => !r.is_custom).map((r) => <option key={r.key} value={r.key}>{r.name}</option>)}
                  </select>
                </div>
                <button onClick={clone} disabled={!name.trim()} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50">
                  <Plus className="w-4 h-4" /> Clone & Build
                </button>
              </div>

              {editing && (
                <div className="mt-5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-stone-800 dark:text-stone-100">Editing: {editing.key}</span>
                    <button onClick={save} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700"><Check className="w-4 h-4" /> Save</button>
                  </div>
                  <div className="overflow-auto max-h-72">
                    <table className="text-xs w-full">
                      <thead className="sticky top-0 bg-white dark:bg-stone-900">
                        <tr className="text-stone-400"><th className="text-left p-1.5">Module</th>{ACTIONS.map((a) => <th key={a} className="p-1.5 capitalize">{a}</th>)}</tr>
                      </thead>
                      <tbody>
                        {modules.map((m) => {
                          const p = editing.perms[m.key] || {};
                          return (
                            <tr key={m.key} className="border-t border-stone-100 dark:border-stone-800">
                              <td className="p-1.5 font-medium text-stone-700 dark:text-stone-300">{m.name}</td>
                              {ACTIONS.map((a) => (
                                <td key={a} className="p-1.5 text-center">
                                  <button onClick={() => toggle(m.key, a)} className={`w-5 h-5 rounded ${p[a] ? 'bg-emerald-500' : 'bg-stone-200 dark:bg-stone-700'} flex items-center justify-center mx-auto`}>
                                    {p[a] && <Check className="w-3.5 h-3.5 text-white" />}
                                  </button>
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Full matrix */}
        <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden">
          <div className="overflow-auto max-h-[60vh]">
            <table className="text-xs w-full">
              <thead className="sticky top-0 bg-stone-50 dark:bg-stone-800 z-10">
                <tr className="text-stone-500">
                  <th className="text-left p-2 sticky left-0 bg-stone-50 dark:bg-stone-800">Role</th>
                  {modules.map((m) => <th key={m.key} className="p-2 whitespace-nowrap" title={m.name}>{m.key}</th>)}
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {roles.map((r) => (
                  <tr key={r.key} className="border-t border-stone-100 dark:border-stone-800">
                    <td className="p-2 sticky left-0 bg-white dark:bg-stone-900 whitespace-nowrap">
                      <span className="font-bold text-stone-800 dark:text-stone-100">{r.name}</span>
                      <span className="ml-1 text-[10px] text-stone-400">L{r.level}·{r.access_pct}%</span>
                      {r.is_custom && <span className="ml-1 text-[9px] px-1 rounded bg-amber-100 text-amber-700">custom</span>}
                    </td>
                    {modules.map((m) => {
                      const c = cell(r.key, m.key);
                      const lvl = !c ? 0 : (c.can_delete || c.can_approve ? 3 : c.can_write || c.can_edit ? 2 : c.can_read ? 1 : 0);
                      const bg = ['', 'bg-blue-100 dark:bg-blue-900/30', 'bg-indigo-200 dark:bg-indigo-800/40', 'bg-emerald-200 dark:bg-emerald-800/40'][lvl];
                      return <td key={m.key} className={`p-2 text-center ${bg}`} title={c ? ACTIONS.filter((a) => c[`can_${a}`]).join(', ') : 'no access'}>{lvl ? '●' : ''}</td>;
                    })}
                    <td className="p-2">{r.is_custom && can('rbac', 'delete') && <button onClick={() => remove(r.key)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Protected>
  );
}

/* ---------------------------- Audit ------------------------------ */
function AuditPanel() {
  const { token } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const load = () => apiFetch<any[]>('/audit/denials?limit=200', { token }).then(setRows).catch((e) => setErr(e.message));
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);
  return (
    <Protected module="audit" action="read">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-50 flex items-center gap-2"><ShieldAlert className="w-6 h-6 text-red-500" /> Security & Audit Log</h2>
            <p className="text-stone-500 dark:text-stone-400 text-sm">Every denied permission check, newest first.</p>
          </div>
          <button onClick={load} className="px-3 py-1.5 rounded-lg text-sm font-bold border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300">Refresh</button>
        </div>
        {err && <p className="text-red-500 text-sm">{err}</p>}
        <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 dark:bg-stone-800 text-stone-500 text-xs uppercase">
              <tr><th className="text-left p-3">When</th><th className="text-left p-3">User</th><th className="text-left p-3">Role</th><th className="text-left p-3">Attempted</th><th className="text-left p-3">Route</th></tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={5} className="p-6 text-center text-stone-400">No denials recorded yet. Try the “Test guarded endpoint” on a module your role can’t access.</td></tr>
              ) : rows.map((r) => (
                <tr key={r.id} className="border-t border-stone-100 dark:border-stone-800">
                  <td className="p-3 text-stone-500 whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="p-3 text-stone-700 dark:text-stone-300">{r.email || '—'}</td>
                  <td className="p-3"><span className="font-mono text-xs px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800">{r.active_role}</span></td>
                  <td className="p-3"><span className="text-red-600 dark:text-red-400 font-mono text-xs">{r.action} · {r.module_key}</span></td>
                  <td className="p-3 text-stone-400 font-mono text-xs">{r.method} {r.path}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Protected>
  );
}

/* --------------------------- Shell ------------------------------- */
function Shell() {
  const { session, logout, switchRole, can } = useAuth();
  const [view, setView] = useState('dashboard');
  const [roleMenu, setRoleMenu] = useState(false);
  if (!session) return null;

  // Dynamic sidebar: only modules the active role can read.
  const navModules = Object.entries(session.permissions)
    .filter(([, p]) => p.read)
    .map(([key]) => key);
  const moduleName = (k: string) => ({
    dashboard: 'Dashboard', students: 'Student Information', teachers: 'Teacher Management', staff: 'Staff', attendance: 'Attendance', fees: 'Fees & Collection', exams: 'Exams & Results', timetable: 'Timetable', library: 'Library', transport: 'Transport', hostel: 'Hostel', canteen: 'Canteen', store: 'Store / Inventory', sports: 'Sports', maintenance: 'Maintenance', security: 'Security / Gate', frontoffice: 'Front Office', lms: 'LMS', reports: 'Reports', audit: 'Security & Audit', rbac: 'Roles & Permissions', users: 'User Management', settings: 'Settings',
  } as Record<string, string>)[k] || k;

  return (
    <div className="min-h-screen flex bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-50">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 flex flex-col">
        <div className="p-5 border-b border-stone-100 dark:border-stone-800 flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white"><ShieldCheck className="w-5 h-5" /></div>
          <div><div className="font-bold text-sm">SSMS RBAC</div><div className="text-[10px] text-stone-400">Dynamic navigation</div></div>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navModules.map((m) => {
            const Icon = ICONS[m] || LayoutDashboard;
            return (
              <button key={m} onClick={() => setView(m)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${view === m ? 'bg-blue-600 text-white' : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'}`}>
                <Icon className="w-4 h-4" /> {moduleName(m)}
              </button>
            );
          })}
        </nav>
        <div className="p-3 border-t border-stone-100 dark:border-stone-800 text-[10px] text-stone-400">
          {navModules.length} of 23 modules visible for this role
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 shrink-0 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <span className="font-bold">{session.activeRoleMeta?.name}</span>
            <span className="text-xs text-stone-400">Level {session.activeRoleMeta?.level} · {session.activeRoleMeta?.access_pct}% access</span>
            <TierBadge tier={session.tier} />
          </div>
          <div className="flex items-center gap-3">
            {/* Role switcher for multi-role staff */}
            {session.roles.length > 1 && (
              <div className="relative">
                <button onClick={() => setRoleMenu((v) => !v)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold border border-stone-200 dark:border-stone-700">
                  Switch role <ChevronDown className="w-4 h-4" />
                </button>
                {roleMenu && (
                  <div className="absolute right-0 mt-1 w-52 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-xl z-20 p-1">
                    {session.roles.map((r) => (
                      <button key={r} onClick={async () => { await switchRole(r); setRoleMenu(false); setView('dashboard'); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm ${r === session.activeRole ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold' : 'hover:bg-stone-100 dark:hover:bg-stone-800'}`}>
                        {r === session.activeRole ? '● ' : ''}{r}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <span className="text-sm text-stone-500">{session.user.email}</span>
            <button onClick={logout} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"><LogOut className="w-4 h-4" /> Logout</button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {view === 'dashboard' ? <Dashboard />
            : view === 'rbac' ? <RbacManager />
            : view === 'audit' ? <AuditPanel />
            : can(view, 'read') ? <ModulePanel moduleKey={view} name={moduleName(view)} />
            : <Protected module={view} action="read"><div /></Protected>}
        </main>
      </div>
    </div>
  );
}

export default function RbacConsole() {
  const { session } = useAuth();
  return session ? <Shell /> : <UnifiedLoginRedirect portal="RBAC Console" />;
}
