import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { CalendarCheck, ClipboardList, BarChart3, Brain, Settings2, ShieldAlert } from 'lucide-react';
import { RbacAuthProvider, useAuth } from '../rbac/auth';
import { UnifiedLoginRedirect } from '../rbac/UnifiedLogin';
import Session from './Session';
import Reports from './Reports';
import Analytics from './Analytics';
import Manage from './Manage';

const NAV = [
  { key: 'take', label: 'Take Attendance', icon: ClipboardList },
  { key: 'reports', label: 'Reports', icon: BarChart3 },
  { key: 'analytics', label: 'AI Analytics', icon: Brain },
  { key: 'manage', label: 'Manage', icon: Settings2 },
];

function Gate() {
  const { session, login, loading, error, can } = useAuth();
  const [email, setEmail] = useState('teacher@ssms.local');
  const [password, setPassword] = useState('Passw0rd!');
  const [view, setView] = useState('take');

  if (!session) return <UnifiedLoginRedirect portal="Attendance" />;

  if (!can('attendance', 'read')) {
    return <div className="min-h-screen flex items-center justify-center bg-stone-950 text-stone-100 p-4 text-center"><div><ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-3" /><p>Role <b>{session.activeRoleMeta?.name}</b> has no <span className="font-mono">attendance:read</span> permission.</p></div></div>;
  }

  return (
    <div className="min-h-screen flex bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-50">
      <aside className="w-56 shrink-0 bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 flex flex-col">
        <div className="p-5 border-b border-stone-100 dark:border-stone-800 flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white"><CalendarCheck className="w-5 h-5" /></div>
          <div><div className="font-bold text-sm">Attendance</div><div className="text-[10px] text-stone-400">{session.activeRoleMeta?.name}</div></div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((n) => <button key={n.key} onClick={() => setView(n.key)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium ${view === n.key ? 'bg-emerald-600 text-white' : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'}`}><n.icon className="w-4 h-4" /> {n.label}</button>)}
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">
        {view === 'take' && <Session />}
        {view === 'reports' && <Reports />}
        {view === 'analytics' && <Analytics />}
        {view === 'manage' && <Manage />}
      </main>
    </div>
  );
}

export default function AttendanceApp() {
  return (
    <RbacAuthProvider>
      <Toaster position="top-right" />
      <Gate />
    </RbacAuthProvider>
  );
}
