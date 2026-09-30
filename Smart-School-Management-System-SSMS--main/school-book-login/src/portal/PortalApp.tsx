import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import {
  School, LayoutDashboard, Brain, GraduationCap, CalendarCheck, CreditCard, IndianRupee,
  ShieldCheck, KeyRound, Clock, Phone, Users, Banknote, TrendingUp, TrendingDown, Library,
  Coffee, BarChart3, LogOut, ExternalLink, Sparkles, ShieldAlert,
} from 'lucide-react';
import { RbacAuthProvider, useAuth } from '../rbac/auth';
import { apiFetch } from '../rbac/api';
import { legacyRoleOf, legacyUserOf, useLegacyStudents } from './legacyBridge';
import { initializeMockDatabase } from '../services/lmsCmsService';
import AiHub from './AiHub';
// Classic modules from the original App.tsx — mounted unchanged (localStorage data layer).
import { TimetableManagement } from '../components/TimetableManagement';
import { FrontOfficeManagement } from '../components/FrontOfficeManagement';
import { StudentInformationManagement } from '../components/StudentInformationManagement';
import { FeesCollectionManagement } from '../components/FeesCollectionManagement';
import { StudentAttendanceManagement } from '../components/StudentAttendanceManagement';
import { IncomeManagement } from '../components/IncomeManagement';
import { ExpenseManagement } from '../components/ExpenseManagement';
import { LmsManagement } from '../components/LmsCms/LmsManagement';
import { CanteenManagement } from '../components/LmsCms/CanteenManagement';
import { LmsCmsReports } from '../components/LmsCms/LmsCmsReports';

const money = (n: any) => '₹' + Number(n || 0).toLocaleString('en-IN');

// Smart (Postgres + AI) portals — hash links; the JWT session is shared so this is SSO.
const SMART = [
  { hash: '#/students', label: 'Students', icon: GraduationCap, perm: 'students', desc: 'Wizard · profiles · bulk ops · AI risk' },
  { hash: '#/attendance', label: 'Attendance', icon: CalendarCheck, perm: 'attendance', desc: 'Manual · QR · Face ID · WebSocket live' },
  { hash: '#/wallet', label: 'ID Card & Wallet', icon: CreditCard, perm: 'fees', desc: 'Card designer · POS · fraud detection' },
  { hash: '#/fees', label: 'Fee Management', icon: IndianRupee, perm: 'fees', desc: 'Invoices · GST · collections · forecasts' },
  { hash: '#/admin', label: 'Master Control', icon: ShieldCheck, perm: null, superOnly: true, desc: 'Health · users · finance · compliance' },
  { hash: '#/rbac', label: 'RBAC Console', icon: KeyRound, perm: 'rbac', desc: '17 roles · permission matrix · audit' },
];

// Classic modules (from App.tsx) gated by the closest RBAC permission.
const CLASSIC = [
  { key: 'timetable', label: 'Timetable', icon: Clock, perm: 'timetable' },
  { key: 'frontoffice', label: 'Front Office', icon: Phone, perm: 'frontoffice' },
  { key: 'studentinfo', label: 'Student Information', icon: Users, perm: 'students' },
  { key: 'feescollection', label: 'Fees Collection', icon: Banknote, perm: 'fees' },
  { key: 'classicattendance', label: 'Attendance Register', icon: CalendarCheck, perm: 'attendance' },
  { key: 'income', label: 'Income', icon: TrendingUp, perm: 'reports' },
  { key: 'expense', label: 'Expense', icon: TrendingDown, perm: 'reports' },
  { key: 'lms', label: 'Library / LMS', icon: Library, perm: 'library' },
  { key: 'canteen', label: 'Canteen', icon: Coffee, perm: 'canteen' },
  { key: 'lmsreports', label: 'LMS Reports', icon: BarChart3, perm: 'reports' },
];

function Overview() {
  const { token, can, session } = useAuth();
  const [stu, setStu] = useState<any>(null);
  const [fees, setFees] = useState<any>(null);
  const [att, setAtt] = useState<any>(null);
  useEffect(() => {
    const g = (p: string) => apiFetch(p, { token }).catch(() => null);
    if (can('students', 'read')) g('/students/stats').then(setStu);
    if (can('fees', 'read')) g('/collections/dashboard').then(setFees);
    if (can('attendance', 'read')) g('/attendance/reports/cumulative?days=30').then(setAtt);
  }, [token, can]);
  const attToday = att?.trend?.length ? att.trend[att.trend.length - 1].present_pct : null;
  const kpis = [
    can('students', 'read') && { label: 'Students', value: stu?.total ?? '…', sub: `${stu?.atRisk ?? '–'} at risk`, color: '#3b82f6' },
    can('attendance', 'read') && { label: 'Attendance (latest)', value: attToday != null ? attToday + '%' : '…', sub: 'last 30-day trend', color: '#10b981' },
    can('fees', 'read') && { label: 'Collected (year)', value: fees ? money(fees.this_year) : '…', sub: `${fees?.collectionRate ?? '–'}% collection rate`, color: '#8b5cf6' },
    can('fees', 'read') && { label: 'Outstanding', value: fees ? money(fees.outstanding) : '…', sub: 'across all invoices', color: '#ef4444' },
  ].filter(Boolean) as any[];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Welcome, {session?.user.name}</h2>
        <p className="text-sm text-stone-500">One login, every module — classic features plus the new AI-powered portals.</p>
      </div>
      {kpis.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5">
              <div className="text-[11px] font-bold uppercase text-stone-400">{k.label}</div>
              <div className="text-2xl font-bold mt-1" style={{ color: k.color }}>{k.value}</div>
              <div className="text-xs text-stone-400 mt-0.5">{k.sub}</div>
            </div>
          ))}
        </div>
      )}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-stone-400 mb-3">Smart portals <span className="normal-case font-medium">(shared sign-in — opens directly)</span></h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SMART.map((s) => <SmartCard key={s.hash} s={s} />)}
        </div>
      </div>
    </div>
  );
}

function SmartCard({ s }: { s: any }) {
  const { can, session } = useAuth();
  const allowed = s.superOnly ? session?.activeRole === 'super_admin' : !s.perm || can(s.perm, 'read');
  if (!allowed) return null;
  return (
    <a href={s.hash} className="group rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 hover:border-blue-400 hover:shadow-lg transition-all">
      <div className="flex items-center justify-between mb-2">
        <s.icon className="w-6 h-6 text-blue-600" />
        <ExternalLink className="w-4 h-4 text-stone-300 group-hover:text-blue-500" />
      </div>
      <div className="font-bold text-stone-800 dark:text-stone-100">{s.label}</div>
      <div className="text-xs text-stone-400 mt-0.5">{s.desc}</div>
    </a>
  );
}

function ClassicView({ view }: { view: string }) {
  const { session } = useAuth();
  const students = useLegacyStudents();
  const legacyUser = legacyUserOf(session);
  const role = legacyRoleOf(session);
  switch (view) {
    case 'timetable': return <TimetableManagement userRole={role} />;
    case 'frontoffice': return <FrontOfficeManagement />;
    case 'studentinfo': return <StudentInformationManagement students={students} />;
    case 'feescollection': return <FeesCollectionManagement students={students} />;
    case 'classicattendance': return <StudentAttendanceManagement students={students} />;
    case 'income': return <IncomeManagement />;
    case 'expense': return <ExpenseManagement />;
    case 'lms': return <LmsManagement loggedInUser={legacyUser} />;
    case 'canteen': return <CanteenManagement loggedInUser={legacyUser} />;
    case 'lmsreports': return <LmsCmsReports loggedInUser={legacyUser} />;
    default: return null;
  }
}

function Shell() {
  const { session, logout, can } = useAuth();
  const [view, setView] = useState('overview');
  useEffect(() => { initializeMockDatabase(); }, []);
  if (!session) return null;

  const classic = CLASSIC.filter((c) => can(c.perm, 'read'));
  const smart = SMART.filter((s) => (s.superOnly ? session.activeRole === 'super_admin' : !s.perm || can(s.perm, 'read')));

  return (
    <div className="min-h-screen flex bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-50">
      <aside className="w-64 shrink-0 bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 flex flex-col">
        <div className="p-5 border-b border-stone-100 dark:border-stone-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg"><School className="w-6 h-6" /></div>
          <div><div className="font-serif font-bold">EduSmart Portal</div><div className="text-[10px] text-stone-400">{session.activeRoleMeta?.name} · unified</div></div>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-4">
          <div className="space-y-1">
            <button onClick={() => setView('overview')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium ${view === 'overview' ? 'bg-blue-600 text-white' : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'}`}><LayoutDashboard className="w-4 h-4" /> Overview</button>
            <button onClick={() => setView('aihub')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium ${view === 'aihub' ? 'bg-indigo-600 text-white' : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'}`}><Brain className="w-4 h-4" /> AI Hub <Sparkles className="w-3 h-3 text-amber-400 ml-auto" /></button>
          </div>
          {smart.length > 0 && (
            <div>
              <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">Smart portals</div>
              <div className="space-y-0.5">
                {smart.map((s) => (
                  <a key={s.hash} href={s.hash} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800">
                    <s.icon className="w-4 h-4" /> {s.label} <ExternalLink className="w-3 h-3 text-stone-300 ml-auto" />
                  </a>
                ))}
              </div>
            </div>
          )}
          {classic.length > 0 && (
            <div>
              <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">Classic modules</div>
              <div className="space-y-0.5">
                {classic.map((c) => (
                  <button key={c.key} onClick={() => setView(c.key)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium ${view === c.key ? 'bg-stone-800 text-white dark:bg-stone-700' : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'}`}>
                    <c.icon className="w-4 h-4" /> {c.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </nav>
        <div className="p-3 border-t border-stone-100 dark:border-stone-800">
          <div className="px-2 pb-2 text-[10px] text-stone-400">{session.user.email}</div>
          <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"><LogOut className="w-4 h-4" /> Sign out</button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">
        {view === 'overview' && <Overview />}
        {view === 'aihub' && <AiHub />}
        {view !== 'overview' && view !== 'aihub' && <ClassicView view={view} />}
      </main>
    </div>
  );
}

function Gate() {
  const { session, login, loading, error } = useAuth();
  const [email, setEmail] = useState('super_admin@ssms.local');
  const [password, setPassword] = useState('Passw0rd!');
  if (session) return <Shell />;
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-950 dark:to-stone-900 p-4">
      <form onSubmit={(e) => { e.preventDefault(); login(email, password); }} className="max-w-sm w-full rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white"><School className="w-7 h-7" /></div>
          <div><h1 className="text-xl font-bold">EduSmart Portal</h1><p className="text-xs text-stone-500">All modules · one sign-in</p></div>
        </div>
        <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mb-3 px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full mb-4 px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800" />
        {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
        <button disabled={loading} className="w-full py-3 rounded-xl font-bold text-white bg-blue-600 disabled:opacity-60">{loading ? 'Signing in…' : 'Sign In'}</button>
        <p className="text-center text-xs text-stone-400 mt-3">Any of the 17 demo roles · Passw0rd!</p>
      </form>
    </div>
  );
}

export default function PortalApp() {
  return (
    <RbacAuthProvider>
      <Toaster position="top-right" />
      <Gate />
    </RbacAuthProvider>
  );
}
