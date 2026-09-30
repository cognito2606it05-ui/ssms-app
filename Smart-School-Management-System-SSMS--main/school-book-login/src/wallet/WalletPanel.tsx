import { useCallback, useEffect, useState } from 'react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import toast from 'react-hot-toast';
import { Wallet, Lock, Unlock, Plus, ShieldAlert, Sliders } from 'lucide-react';
import { useAuth } from '../rbac/auth';
import { wApi, money } from './api';

const CATS = ['canteen', 'library', 'store', 'sports'];
const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#a855f7'];

export default function WalletPanel() {
  const { token, can } = useAuth();
  const [sid, setSid] = useState('1');
  const [w, setW] = useState<any>(null);
  const [an, setAn] = useState<any>(null);
  const [topup, setTopup] = useState('');
  const [ctrl, setCtrl] = useState<Record<string, any>>({});

  const load = useCallback(async () => {
    const data = await wApi(`/wallet/${sid}`, {}, token); setW(data);
    setAn(await wApi(`/wallet/${sid}/analytics`, {}, token));
    const m: Record<string, any> = {};
    for (const c of CATS) m[c] = data.controls.find((x: any) => x.category === c) || { category: c, blocked: false };
    setCtrl(m);
  }, [sid, token]);
  useEffect(() => { load(); }, [load]);

  const doTopup = async () => { await wApi(`/wallet/${sid}/topup`, { method: 'POST', body: { amount: Number(topup), method: 'upi' } }, token); toast.success('Wallet topped up'); setTopup(''); load(); };
  const freeze = async () => { await wApi(`/wallet/${sid}/freeze`, { method: 'POST', body: { frozen: w.account.status !== 'frozen' } }, token); load(); };
  const saveCtrl = async () => { await wApi(`/wallet/${sid}/controls`, { method: 'PUT', body: { controls: Object.values(ctrl) } }, token); toast.success('Parental controls saved'); load(); };

  if (!w) return <p className="text-stone-400">Loading…</p>;
  const frozen = w.account.status === 'frozen';

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <span className="text-sm text-stone-500">Student ID</span>
        <input value={sid} onChange={(e) => setSid(e.target.value)} className="w-20 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800" />
        <span className="font-bold">{w.student?.name}</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* balance + actions */}
        <div className="rounded-2xl p-5 text-white bg-gradient-to-br from-blue-600 to-indigo-700">
          <div className="flex items-center gap-2 text-sm opacity-80"><Wallet className="w-4 h-4" /> Wallet balance</div>
          <div className="text-4xl font-bold mt-1">{money(w.balance)}</div>
          <div className="text-[11px] opacity-70 mt-1">pgcrypto snapshot {w.snapshotMatches ? '✓ matches ledger' : '⚠ mismatch'}</div>
          {can('fees', 'write') && (
            <div className="mt-4 flex gap-2">
              <input value={topup} onChange={(e) => setTopup(e.target.value)} placeholder="₹ top-up" className="flex-1 px-3 py-2 rounded-lg text-stone-900" />
              <button onClick={doTopup} className="px-3 py-2 rounded-lg bg-white text-blue-700 font-bold"><Plus className="w-4 h-4" /></button>
            </div>
          )}
          {can('fees', 'write') && <button onClick={freeze} className={`mt-2 w-full py-2 rounded-lg font-bold ${frozen ? 'bg-emerald-400 text-emerald-950' : 'bg-white/20'}`}>{frozen ? <><Unlock className="w-4 h-4 inline" /> Unfreeze card</> : <><Lock className="w-4 h-4 inline" /> Freeze card</>}</button>}
          <p className="text-[10px] opacity-60 mt-2">Top-up via Razorpay/UPI (gateway simulated; ledger credit real).</p>
        </div>

        {/* analytics pie */}
        <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4">
          <div className="text-sm font-bold text-stone-500 uppercase mb-2">Spend by category</div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart><Pie data={(an?.byCategory || []).map((c: any) => ({ name: c.category, value: Number(c.total) }))} dataKey="value" nameKey="name" outerRadius={64} label={(e: any) => e.name}>
              {(an?.byCategory || []).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie><Tooltip formatter={(v: any) => money(v)} /></PieChart>
          </ResponsiveContainer>
        </div>

        {/* trend */}
        <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4">
          <div className="text-sm font-bold text-stone-500 uppercase mb-2">30-day spend trend</div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={an?.trend || []}><CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" /><XAxis dataKey="date" tick={{ fontSize: 9 }} interval={5} /><YAxis tick={{ fontSize: 9 }} /><Tooltip formatter={(v: any) => money(v)} /><Line type="monotone" dataKey="spent" stroke="#3b82f6" dot={false} /></LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* parental controls */}
        <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5">
          <div className="flex items-center gap-2 text-sm font-bold mb-3"><Sliders className="w-4 h-4" /> Parental controls <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Premium</span></div>
          <table className="w-full text-sm">
            <thead><tr className="text-stone-400 text-xs"><th className="text-left">Category</th><th>Daily ₹</th><th>Monthly ₹</th><th>Block</th></tr></thead>
            <tbody>{CATS.map((c) => (
              <tr key={c} className="border-t border-stone-100 dark:border-stone-800">
                <td className="py-1.5 capitalize">{c}</td>
                <td><input value={ctrl[c]?.daily_limit ?? ''} onChange={(e) => setCtrl({ ...ctrl, [c]: { ...ctrl[c], daily_limit: e.target.value || null } })} className="w-16 px-2 py-1 rounded border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-center" /></td>
                <td><input value={ctrl[c]?.monthly_budget ?? ''} onChange={(e) => setCtrl({ ...ctrl, [c]: { ...ctrl[c], monthly_budget: e.target.value || null } })} className="w-16 px-2 py-1 rounded border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-center" /></td>
                <td className="text-center"><input type="checkbox" checked={!!ctrl[c]?.blocked} onChange={(e) => setCtrl({ ...ctrl, [c]: { ...ctrl[c], blocked: e.target.checked } })} /></td>
              </tr>
            ))}</tbody>
          </table>
          {can('fees', 'write') && <button onClick={saveCtrl} className="mt-3 px-4 py-2 rounded-lg font-bold text-white bg-blue-600">Save controls</button>}
        </div>

        {/* live feed + alerts */}
        <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5">
          <div className="text-sm font-bold mb-2">Recent spending feed</div>
          {w.alerts?.length > 0 && w.alerts.map((a: any) => <div key={a.id} className="text-xs text-red-500 flex items-center gap-1 mb-1"><ShieldAlert className="w-3.5 h-3.5" /> {a.message}</div>)}
          <div className="space-y-1 max-h-56 overflow-auto">
            {w.txns.map((t: any) => (
              <div key={t.id} className="flex items-center justify-between text-sm border-b border-stone-100 dark:border-stone-800 py-1">
                <span className="text-stone-600 dark:text-stone-300">{t.kind === 'topup' ? '⬆ Top-up' : t.kind === 'refund' ? '↩ Refund' : '🛒 ' + t.module}</span>
                <span className={`font-bold ${t.kind === 'purchase' ? 'text-red-500' : 'text-emerald-600'}`}>{t.kind === 'purchase' ? '-' : '+'}{money(t.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
