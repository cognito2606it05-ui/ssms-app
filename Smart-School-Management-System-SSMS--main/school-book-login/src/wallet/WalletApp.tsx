import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { CreditCard, LayoutTemplate, Printer, ScanLine, Wallet, ShieldCheck, ShieldAlert } from 'lucide-react';
import { RbacAuthProvider, useAuth } from '../rbac/auth';
import { UnifiedLoginRedirect } from '../rbac/UnifiedLogin';
import Cards from './Cards';
import Designer from './Designer';
import Batch from './Batch';
import Pos from './Pos';
import WalletPanel from './WalletPanel';
import Admin from './Admin';

const NAV = [
  { key: 'cards', label: 'Cards', icon: CreditCard },
  { key: 'designer', label: 'Template Designer', icon: LayoutTemplate },
  { key: 'batch', label: 'Batch Print', icon: Printer },
  { key: 'pos', label: 'POS Terminal', icon: ScanLine },
  { key: 'wallet', label: 'Wallet & Controls', icon: Wallet },
  { key: 'admin', label: 'Fraud / Refunds', icon: ShieldAlert },
];

function Gate() {
  const { session, login, loading, error, can } = useAuth();
  const [email, setEmail] = useState('super_admin@ssms.local');
  const [password, setPassword] = useState('Passw0rd!');
  const [view, setView] = useState('cards');

  if (!session) return <UnifiedLoginRedirect portal="ID Card & Wallet" />;

  // POS-only roles (canteen/store staff) can still use the terminal even without fees:read.
  const posOnly = !can('fees', 'read') && (can('canteen', 'write') || can('store', 'write') || can('library', 'write'));
  if (!can('fees', 'read') && !posOnly) {
    return <div className="min-h-screen flex items-center justify-center bg-stone-950 text-stone-100 p-4 text-center"><div><ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-3" /><p>Role <b>{session.activeRoleMeta?.name}</b> has no wallet access.</p></div></div>;
  }
  const nav = posOnly ? NAV.filter((n) => n.key === 'pos') : NAV;
  const active = posOnly ? 'pos' : view;

  return (
    <div className="min-h-screen flex bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-50">
      <aside className="w-60 shrink-0 bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 flex flex-col">
        <div className="p-5 border-b border-stone-100 dark:border-stone-800 flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-white"><CreditCard className="w-5 h-5" /></div>
          <div><div className="font-bold text-sm">ID & Wallet</div><div className="text-[10px] text-stone-400">{session.activeRoleMeta?.name}</div></div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((n) => <button key={n.key} onClick={() => setView(n.key)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium ${active === n.key ? 'bg-indigo-600 text-white' : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'}`}><n.icon className="w-4 h-4" /> {n.label}</button>)}
        </nav>
        <div className="p-3 text-[10px] text-stone-400 flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Double-entry · row-locked · pgcrypto</div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">
        {active === 'cards' && <Cards />}
        {active === 'designer' && <Designer />}
        {active === 'batch' && <Batch />}
        {active === 'pos' && <Pos />}
        {active === 'wallet' && <WalletPanel />}
        {active === 'admin' && <Admin />}
      </main>
    </div>
  );
}

export default function WalletApp() {
  return (
    <RbacAuthProvider>
      <Toaster position="top-right" />
      <Gate />
    </RbacAuthProvider>
  );
}
