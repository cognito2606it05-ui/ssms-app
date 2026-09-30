import { useState } from 'react';
import toast from 'react-hot-toast';
import { ScanLine, CreditCard, CheckCircle2, RotateCcw } from 'lucide-react';
import { useAuth } from '../rbac/auth';
import { wApi, money } from './api';

export default function Pos() {
  const { token } = useAuth();
  const [cardNo, setCardNo] = useState('');
  const [scan, setScan] = useState<any>(null);
  const [module, setModule] = useState('canteen');
  const [amount, setAmount] = useState('');
  const [allowCash, setAllowCash] = useState(true);
  const [receipt, setReceipt] = useState<any>(null);

  const doScan = async () => {
    setReceipt(null);
    try { setScan(await wApi(`/pos/scan/${cardNo.trim()}`, {}, token)); }
    catch (e: any) { toast.error(e.message); setScan(null); }
  };
  const charge = async () => {
    if (!scan) return;
    try {
      const r = await wApi<any>('/pos/charge', { method: 'POST', body: { student_id: scan.student.id, module, amount: Number(amount), allow_cash: allowCash, vendor: module, location: module } }, token);
      setReceipt(r.receipt); toast.success(`Charged ${money(amount)} · balance ${money(r.balance)}`);
      setScan({ ...scan, balance: r.balance }); setAmount('');
    } catch (e: any) { toast.error(e.data?.message || e.message); }
  };
  const refund = async () => {
    if (!receipt) return;
    const tx = await wApi<any>(`/wallet/${scan.student.id}`, {}, token).then((w) => w.txns.find((t: any) => t.ref === receipt.ref));
    if (!tx) return;
    const r = await wApi<any>('/refunds', { method: 'POST', body: { txn_id: tx.id, amount: receipt.amount, reason: 'POS refund', module } }, token);
    toast.success(`Refund #${r.id} requested — awaiting admin approval`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5">
        <div className="flex items-center gap-2 text-sm font-bold mb-3"><ScanLine className="w-5 h-5 text-blue-600" /> POS Terminal</div>
        <div className="flex gap-2">
          <input value={cardNo} onChange={(e) => setCardNo(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && doScan()} placeholder="Scan / enter card no (e.g. SSMS-100001)" className="flex-1 px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-mono" />
          <button onClick={doScan} className="px-5 py-3 rounded-xl font-bold text-white bg-blue-600">Scan</button>
        </div>
      </div>

      {scan && (
        <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center font-bold">{scan.student?.name?.[0]}</div>
              <div><div className="font-bold">{scan.student?.name}</div><div className="text-xs text-stone-400">Class {scan.student?.class}{scan.student?.section} · {scan.account_status}</div></div>
            </div>
            <div className="text-right"><div className="text-[10px] uppercase text-stone-400">Balance</div><div className="text-2xl font-bold text-emerald-600">{money(scan.balance)}</div></div>
          </div>
          {scan.account_status === 'frozen' && <div className="mb-3 text-sm text-red-500 font-bold">⚠ Card is frozen — charge will be rejected.</div>}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <select value={module} onChange={(e) => setModule(e.target.value)} className="px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800">{['canteen', 'store', 'library', 'sports'].map((m) => <option key={m}>{m}</option>)}</select>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="amount ₹" className="px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800" />
          </div>
          <label className="flex items-center gap-2 text-sm mb-3"><input type="checkbox" checked={allowCash} onChange={(e) => setAllowCash(e.target.checked)} className="w-4 h-4" /> Allow partial cash if balance is short</label>
          <button onClick={charge} disabled={!amount} className="w-full py-3 rounded-xl font-bold text-white bg-emerald-600 disabled:opacity-50 inline-flex items-center justify-center gap-2"><CreditCard className="w-5 h-5" /> Confirm & debit</button>
        </div>
      )}

      {receipt && (
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/60 dark:bg-emerald-950/20 p-5">
          <div className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-300 mb-2"><CheckCircle2 className="w-5 h-5" /> Receipt {receipt.ref}</div>
          <div className="text-sm space-y-1">
            <div className="flex justify-between"><span className="text-stone-500">Module</span><b>{receipt.module}</b></div>
            <div className="flex justify-between"><span className="text-stone-500">Amount</span><b>{money(receipt.amount)}</b></div>
            <div className="flex justify-between"><span className="text-stone-500">Wallet / Cash</span><b>{money(receipt.walletPart)} / {money(receipt.cashPart)}</b></div>
          </div>
          <button onClick={refund} className="mt-3 text-xs font-bold text-amber-600 inline-flex items-center gap-1"><RotateCcw className="w-3.5 h-3.5" /> Initiate refund (admin approves)</button>
          <p className="text-[10px] text-stone-400 mt-1">Receipt auto-sent via SMS + in-app (sending simulated).</p>
        </div>
      )}
    </div>
  );
}
