import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Receipt, FileText, CreditCard, BarChart3, BellRing, Brain, FileSpreadsheet, ShieldAlert, ChevronLeft, ChevronRight, Wallet, TrendingUp, IndianRupee, Users, Sparkles } from 'lucide-react';
import { RbacAuthProvider, useAuth } from '../rbac/auth';
import { UnifiedLoginRedirect } from '../rbac/UnifiedLogin';
import Structure from './Structure';
import Invoices from './Invoices';
import Collections from './Collections';
import Followups from './Followups';
import { AI, Reports } from './AIReports';

const NAV = [
  { key: 'collections', label: 'Dashboard', icon: BarChart3, color: 'from-emerald-500 to-teal-600' },
  { key: 'structure', label: 'Fee Structure', icon: FileText, color: 'from-blue-500 to-indigo-600' },
  { key: 'invoices', label: 'Invoices & Payments', icon: Receipt, color: 'from-violet-500 to-purple-600' },
  { key: 'followups', label: 'Follow-ups', icon: BellRing, color: 'from-amber-500 to-orange-600' },
  { key: 'ai', label: 'AI Insights', icon: Brain, color: 'from-pink-500 to-rose-600' },
  { key: 'reports', label: 'Reports', icon: FileSpreadsheet, color: 'from-cyan-500 to-sky-600' },
];

function Gate() {
  const { session, login, loading, error, can } = useAuth();
  const [email, setEmail] = useState('super_admin@ssms.local');
  const [password, setPassword] = useState('Passw0rd!');
  const [view, setView] = useState('collections');
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!session) return <UnifiedLoginRedirect portal="Fee Management" />;

  if (!can('fees', 'read')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-4 text-center">
        <div className="max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-lg font-bold mb-2">Access Restricted</h2>
          <p className="text-slate-400">Role <b className="text-white">{session.activeRoleMeta?.name}</b> does not have <code className="text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">fees:read</code> permission.</p>
        </div>
      </div>
    );
  }

  const activeNav = NAV.find((n) => n.key === view);

  return (
    <div className="h-screen flex bg-slate-950 text-slate-50 overflow-hidden">
      {/* Premium sidebar */}
      <aside className={`${collapsed ? 'w-[68px]' : 'w-60'} shrink-0 bg-gradient-to-b from-slate-900 to-slate-950 border-r border-white/5 flex flex-col transition-all duration-300 ease-in-out`}>
        {/* Brand */}
        <div className={`p-4 border-b border-white/5 flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 shrink-0">
            <IndianRupee className="w-5 h-5" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="font-bold text-sm truncate">Fee Management</div>
              <div className="text-[10px] text-emerald-400/60 truncate">{session.activeRoleMeta?.name}</div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {NAV.map((n) => {
            const active = view === n.key;
            return (
              <button key={n.key} onClick={() => setView(n.key)}
                className={`w-full flex items-center ${collapsed ? 'justify-center px-2' : 'px-3'} py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                  active
                    ? 'bg-gradient-to-r ' + n.color + ' text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}>
                <n.icon className={`w-[18px] h-[18px] shrink-0 ${active ? '' : 'group-hover:scale-110 transition-transform'}`} />
                {!collapsed && <span className="ml-3 truncate">{n.label}</span>}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 rounded-md bg-slate-800 text-xs font-medium text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl">
                    {n.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <button onClick={() => setCollapsed(!collapsed)}
          className="p-3 border-t border-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-colors">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Footer */}
        {!collapsed && (
          <div className="p-3 border-t border-white/5">
            <div className="flex items-center gap-2 text-[10px] text-slate-500">
              <Sparkles className="w-3 h-3 text-emerald-500" />
              <span>Double-entry · Idempotent · GST</span>
            </div>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b border-white/5 bg-slate-900/50 backdrop-blur-sm flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            {activeNav && (
              <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${activeNav.color}`} />
            )}
            <h1 className="text-lg font-bold">{activeNav?.label || 'Fee Management'}</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Users className="w-3.5 h-3.5" />
              <span>{session.user.name || session.user.email}</span>
            </div>
            <div className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase">
              {session.activeRoleMeta?.name}
            </div>
          </div>
        </header>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="max-w-[1400px] mx-auto">
            {view === 'structure' && <Structure />}
            {view === 'invoices' && <Invoices />}
            {view === 'collections' && <Collections />}
            {view === 'followups' && <Followups />}
            {view === 'ai' && <AI />}
            {view === 'reports' && <Reports />}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function FeesApp() {
  return (
    <RbacAuthProvider>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.1)' },
      }} />
      <Gate />
    </RbacAuthProvider>
  );
}
