import { useEffect, useMemo, useState } from 'react';
import {
  Activity, Users, DollarSign, Settings as Cog, ShieldAlert, Database, BarChart3,
  ChevronDown, ChevronRight, LogOut, ShieldCheck, Circle,
} from 'lucide-react';
import { apiFetch } from '../rbac/api';
import { useAuth } from '../rbac/auth';
import { StatusBadge } from './Gauge';
import { SystemHealth, UserManagement, Financial, Configuration, Compliance, DataManagement, Analytics } from './sections';

type SectionKey = 'health' | 'users' | 'finance' | 'config' | 'compliance' | 'data' | 'analytics';
type Status = 'green' | 'amber' | 'red';

const GROUPS: { group: string; items: { key: SectionKey; label: string; icon: any }[] }[] = [
  { group: 'Operations', items: [
    { key: 'health', label: 'System Health', icon: Activity },
    { key: 'users', label: 'User & Roles', icon: Users },
    { key: 'finance', label: 'Financial', icon: DollarSign },
  ] },
  { group: 'Governance', items: [
    { key: 'config', label: 'Configuration', icon: Cog },
    { key: 'compliance', label: 'Compliance & Audit', icon: ShieldAlert },
    { key: 'data', label: 'Data Management', icon: Database },
  ] },
  { group: 'Insights', items: [
    { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  ] },
];

const TITLES: Record<SectionKey, string> = {
  health: 'System Health Monitor', users: 'User & Role Management', finance: 'Financial Oversight',
  config: 'Configuration Center', compliance: 'Compliance & Audit', data: 'Data Management', analytics: 'Analytics',
};

export default function AdminPanel() {
  const { session, logout, token } = useAuth();
  const [active, setActive] = useState<SectionKey>('health');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<Record<SectionKey, Status>>({
    health: 'green', users: 'green', finance: 'green', config: 'green', compliance: 'green', data: 'green', analytics: 'green',
  });

  // Compute the header status badges from live data.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [sys, risk, db] = await Promise.all([
          apiFetch<any>('/admin/health/system', { token }),
          apiFetch<any>('/admin/risk', { token }),
          apiFetch<any>('/admin/health/db', { token }),
        ]);
        if (!alive) return;
        const healthStatus: Status = sys.memory.pct >= 90 || sys.cpu.pct >= 90 || (sys.disk?.pct ?? 0) >= 90
          ? 'red' : (sys.memory.pct >= 75 || db.status !== 'healthy' ? 'amber' : 'green');
        const compStatus: Status = risk.flags.some((f: any) => f.severity === 'high') ? 'red'
          : risk.flags.some((f: any) => f.severity === 'medium') ? 'amber' : 'green';
        setStatus((s) => ({ ...s, health: healthStatus, compliance: compStatus }));
      } catch { /* ignore */ }
    })();
    const t = setInterval(() => {}, 0); clearInterval(t);
    return () => { alive = false; };
  }, [token]);

  const SectionComp = useMemo(() => ({
    health: SystemHealth, users: UserManagement, finance: Financial, config: Configuration,
    compliance: Compliance, data: DataManagement, analytics: Analytics,
  }[active]), [active]);

  return (
    <div className="min-h-screen flex bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-50">
      {/* Dark sidebar */}
      <aside className="w-64 shrink-0 bg-stone-950 text-stone-300 flex flex-col">
        <div className="p-5 border-b border-stone-800 flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white"><ShieldCheck className="w-5 h-5" /></div>
          <div><div className="font-bold text-sm text-white">Master Control</div><div className="text-[10px] text-stone-500">Super Admin</div></div>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-3">
          {GROUPS.map((g) => {
            const isOpen = !collapsed[g.group];
            return (
              <div key={g.group}>
                <button onClick={() => setCollapsed((c) => ({ ...c, [g.group]: !c[g.group] }))} className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-500 hover:text-stone-300">
                  {g.group}{isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
                {isOpen && (
                  <div className="mt-1 space-y-0.5">
                    {g.items.map((it) => (
                      <button key={it.key} onClick={() => setActive(it.key)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${active === it.key ? 'bg-stone-800 text-white' : 'text-stone-400 hover:bg-stone-900 hover:text-stone-200'}`}>
                        <it.icon className="w-4 h-4" />
                        <span className="flex-1 text-left">{it.label}</span>
                        <StatusBadge status={status[it.key]} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        <div className="p-3 border-t border-stone-800">
          <div className="text-xs text-stone-400 px-2 mb-2">{session?.user.email}</div>
          <button onClick={logout} className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-bold text-red-400 hover:bg-stone-900"><LogOut className="w-4 h-4" /> Sign out</button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 shrink-0 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <StatusBadge status={status[active]} />
            <h1 className="text-lg font-bold">{TITLES[active]}</h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-stone-400">
            <Circle className="w-2.5 h-2.5 fill-emerald-500 text-emerald-500 animate-pulse" /> Live · {session?.activeRoleMeta?.name}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{SectionComp && <SectionComp />}</main>
      </div>
    </div>
  );
}
