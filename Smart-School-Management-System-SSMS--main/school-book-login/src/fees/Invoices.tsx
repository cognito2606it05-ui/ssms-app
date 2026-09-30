import { useCallback, useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import { ArrowLeft, Send, AlarmClock, Smartphone, Receipt, Plus, FileText, Printer, X, CreditCard, Banknote, Building2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../rbac/auth';
import { fApi, money, payInvoice } from './api';
import { DataTable } from '../admin/DataTable';

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  paid: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  partial: { bg: 'bg-amber-500/10', text: 'text-amber-400' },
  overdue: { bg: 'bg-red-500/10', text: 'text-red-400' },
  sent: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
  draft: { bg: 'bg-slate-500/10', text: 'text-slate-400' },
};

const METHOD_ICONS: Record<string, any> = { cash: Banknote, cheque: FileText, upi: Smartphone, card: CreditCard, gateway: Building2 };

export default function Invoices() {
  const { token, can } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [status, setStatus] = useState('');
  const [open, setOpen] = useState<number | null>(null);
  const [gen, setGen] = useState({ class: '10', due_date: '' });
  const [showCreate, setShowCreate] = useState(false);
  const [adHoc, setAdHoc] = useState({ student_id: '', description: '', amount: '', due_date: '' });

  const load = useCallback(async () => setRows(await fApi(`/invoices${status ? '?status=' + status : ''}`, {}, token)), [status, token]);
  useEffect(() => { load(); }, [load]);

  const generate = async () => {
    const r = await fApi<any>('/invoices/generate', { method: 'POST', body: gen }, token);
    toast.success(`Generated ${r.generated} invoices`); load();
  };

  const createAdHoc = async () => {
    if (!adHoc.student_id || !adHoc.amount) return toast.error('Student ID and amount required');
    await fApi<any>('/invoices', { method: 'POST', body: {
      student_id: Number(adHoc.student_id),
      items: [{ fee_type_id: 7, description: adHoc.description || 'Miscellaneous', amount: Number(adHoc.amount) }],
      due_date: adHoc.due_date || undefined,
    }}, token);
    toast.success('Invoice created'); setShowCreate(false); load();
  };

  if (open != null) return <InvoiceDetail id={open} onBack={() => { setOpen(null); load(); }} />;

  const stats = {
    total: rows.length,
    paid: rows.filter((r) => r.status === 'paid').length,
    partial: rows.filter((r) => r.status === 'partial').length,
    overdue: rows.filter((r) => r.status === 'overdue').length,
  };

  return (
    <div className="space-y-5">
      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-white' },
          { label: 'Paid', value: stats.paid, color: 'text-emerald-400' },
          { label: 'Partial', value: stats.partial, color: 'text-amber-400' },
          { label: 'Overdue', value: stats.overdue, color: 'text-red-400' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-white/5 bg-slate-900 p-3 text-center">
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-slate-500 uppercase">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Actions */}
      {can('fees', 'write') && (
        <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-slate-900 to-slate-800 p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">Bulk generate — class</label>
              <select value={gen.class} onChange={(e) => setGen({ ...gen, class: e.target.value })} className="px-3 py-2 rounded-lg border border-white/10 bg-slate-800 text-white text-sm">
                {['8', '9', '10', '11', '12'].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">Due date</label>
              <input type="date" value={gen.due_date} onChange={(e) => setGen({ ...gen, due_date: e.target.value })} className="px-3 py-2 rounded-lg border border-white/10 bg-slate-800 text-white text-sm" />
            </div>
            <button onClick={generate} className="px-4 py-2 rounded-lg font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:shadow-lg transition-all text-sm">Generate Invoices</button>
            <div className="ml-auto flex gap-2">
              <button onClick={() => setShowCreate(true)} className="px-4 py-2 rounded-lg font-bold text-white bg-gradient-to-r from-violet-500 to-purple-600 inline-flex items-center gap-2 text-sm"><Plus className="w-4 h-4" /> Ad-hoc Invoice</button>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2 rounded-lg border border-white/10 bg-slate-800 text-white text-sm">
                <option value="">All status</option>
                {['sent', 'partial', 'paid', 'overdue'].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Ad-hoc create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h3 className="text-lg font-bold text-white">Create Ad-hoc Invoice</h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div><label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Student ID</label><input type="number" value={adHoc.student_id} onChange={(e) => setAdHoc({ ...adHoc, student_id: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-sm" /></div>
              <div><label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Description</label><input value={adHoc.description} onChange={(e) => setAdHoc({ ...adHoc, description: e.target.value })} placeholder="Miscellaneous charge" className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-sm" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Amount ₹</label><input type="number" value={adHoc.amount} onChange={(e) => setAdHoc({ ...adHoc, amount: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-sm" /></div>
                <div><label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Due Date</label><input type="date" value={adHoc.due_date} onChange={(e) => setAdHoc({ ...adHoc, due_date: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-sm" /></div>
              </div>
              <button onClick={createAdHoc} className="w-full py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-violet-500 to-purple-600">Create Invoice</button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice table */}
      <DataTable csvName="invoices" rows={rows} columns={[
        { key: 'invoice_no', label: 'Invoice', render: (r) => <button onClick={() => setOpen(r.id)} className="font-bold text-blue-400 hover:text-blue-300 transition-colors">{r.invoice_no}</button> },
        { key: 'name', label: 'Student', render: (r) => <span className="text-white font-medium">{r.name}</span> },
        { key: 'class', label: 'Class', render: (r) => `${r.class}${r.section || ''}` },
        { key: 'total', label: 'Total', value: (r) => Number(r.total), render: (r) => money(r.total) },
        { key: 'paid', label: 'Paid', render: (r) => <span className="text-emerald-400">{money(r.paid)}</span> },
        { key: 'balance', label: 'Balance', value: (r) => Number(r.balance), render: (r) => Number(r.balance) > 0 ? <span className="font-bold text-red-400">{money(r.balance)}</span> : <span className="text-slate-500">—</span> },
        { key: 'due_date', label: 'Due', render: (r) => <span className="text-slate-400 text-xs">{new Date(r.due_date).toLocaleDateString()}</span> },
        { key: 'status', label: 'Status', render: (r) => { const s = STATUS_STYLES[r.status] || STATUS_STYLES.draft; return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>{r.status}</span>; }},
      ]} />
    </div>
  );
}

function InvoiceDetail({ id, onBack }: { id: number; onBack: () => void }) {
  const { token, can } = useAuth();
  const [inv, setInv] = useState<any>(null);
  const [upi, setUpi] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [idemKey] = useState(() => 'pay-' + Math.random().toString(36).slice(2) + Date.now());
  const [receipt, setReceipt] = useState<any>(null);

  const load = useCallback(async () => { const d = await fApi(`/invoices/${id}`, {}, token); setInv(d); setAmount(String(Math.max(0, Number(d.total) - Number(d.paid)))); }, [id, token]);
  useEffect(() => { load(); fApi(`/invoices/${id}/upi`, {}, token).then(setUpi); }, [id, token, load]);

  const pay = async () => {
    try { const r = await payInvoice({ invoice_id: id, amount: Number(amount), method }, idemKey, token); setReceipt(r); toast.success(`Paid · receipt ${r.receipt_no}${r.idempotentReplay ? ' (idempotent replay)' : ''}`); load(); }
    catch (e: any) { toast.error(e.message); }
  };
  const send = async () => { await fApi<any>(`/invoices/${id}/send`, { method: 'POST' }, token); toast.success('Invoice sent (email+SMS simulated)'); };
  const lateFee = async () => { const r = await fApi<any>(`/invoices/${id}/late-fee`, { method: 'POST' }, token); toast(r.late_fee > 0 ? `Late fee ₹${r.late_fee} applied` : r.message, { icon: '⏰' }); load(); };

  if (!inv) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" /></div>;
  const balance = Number(inv.total) - Number(inv.paid);
  const st = STATUS_STYLES[inv.status] || STATUS_STYLES.draft;

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="text-sm text-slate-400 hover:text-white inline-flex items-center gap-1.5 transition-colors"><ArrowLeft className="w-4 h-4" /> All invoices</button>

      <div className="grid lg:grid-cols-[1fr_340px] gap-5">
        {/* Invoice preview */}
        <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-slate-900 to-slate-800 overflow-hidden">
          {/* Header bar */}
          <div className="bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border-b border-white/5 p-5">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2"><FileText className="w-5 h-5 text-emerald-400" /> Tax Invoice</h2>
                <p className="text-sm text-slate-400 mt-1">{inv.invoice_no} · {inv.name} · Class {inv.class}{inv.section}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">GSTIN {inv.gstin} · Due {new Date(inv.due_date).toLocaleDateString()}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${st.bg} ${st.text}`}>{inv.status}</span>
            </div>
          </div>

          {/* Line items */}
          <div className="p-5">
            <table className="w-full text-sm mb-4">
              <thead><tr className="text-slate-500 text-[11px] uppercase border-b border-white/5">
                <th className="text-left py-2">Description</th><th className="text-center">HSN</th><th className="text-right">Amount</th><th className="text-right">GST</th><th className="text-right">Tax</th>
              </tr></thead>
              <tbody>
                {inv.items.map((it: any) => (
                  <tr key={it.id} className="border-b border-white/5">
                    <td className="py-2.5 text-white">{it.description}</td>
                    <td className="text-center text-xs text-slate-500 font-mono">{it.hsn_code}</td>
                    <td className="text-right">{money(it.amount)}</td>
                    <td className="text-right text-xs text-slate-500">{it.gst_rate}%</td>
                    <td className="text-right">{money(it.tax_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="text-sm space-y-1.5 max-w-xs ml-auto">
              <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{money(inv.base)}</span></div>
              {Number(inv.discount) > 0 && <div className="flex justify-between text-emerald-400"><span>Concession</span><span>-{money(inv.discount)}</span></div>}
              <div className="flex justify-between"><span className="text-slate-500">CGST</span><span>{money(inv.gst.cgst)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">SGST</span><span>{money(inv.gst.sgst)}</span></div>
              {Number(inv.late_fee) > 0 && <div className="flex justify-between text-red-400"><span>Late fee</span><span>{money(inv.late_fee)}</span></div>}
              <div className="flex justify-between font-bold border-t border-white/10 pt-2 text-white"><span>Total</span><span>{money(inv.total)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Paid</span><span className="text-emerald-400">{money(inv.paid)}</span></div>
              <div className="flex justify-between font-bold text-lg"><span className="text-blue-400">Balance</span><span className="text-blue-400">{money(balance)}</span></div>
            </div>

            {/* Payment history */}
            {inv.payments?.length > 0 && (
              <div className="mt-6 border-t border-white/5 pt-4">
                <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Payment History</h4>
                <div className="space-y-2">
                  {inv.payments.map((p: any) => {
                    const Icon = METHOD_ICONS[p.method] || Receipt;
                    return (
                      <div key={p.id} className="flex items-center gap-3 text-sm bg-white/5 rounded-lg p-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center"><Icon className="w-4 h-4 text-emerald-400" /></div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white">{p.receipt_no}</div>
                          <div className="text-[10px] text-slate-500">{new Date(p.created_at).toLocaleString()} · {p.method}{p.gateway_txn_id ? ` · ${p.gateway_txn_id}` : ''}</div>
                        </div>
                        <span className="font-bold text-emerald-400">{money(p.amount)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 mt-5 pt-4 border-t border-white/5">
              {can('fees', 'write') && <button onClick={send} className="px-3 py-2 rounded-lg text-sm font-medium border border-white/10 text-slate-300 hover:bg-white/5 inline-flex items-center gap-1.5 transition-all"><Send className="w-4 h-4" /> Send</button>}
              {can('fees', 'write') && <button onClick={lateFee} className="px-3 py-2 rounded-lg text-sm font-medium border border-white/10 text-slate-300 hover:bg-white/5 inline-flex items-center gap-1.5 transition-all"><AlarmClock className="w-4 h-4" /> Apply late fee</button>}
              <button onClick={() => window.print()} className="px-3 py-2 rounded-lg text-sm font-medium border border-white/10 text-slate-300 hover:bg-white/5 inline-flex items-center gap-1.5 transition-all"><Printer className="w-4 h-4" /> Print</button>
            </div>
          </div>
        </div>

        {/* Sidebar: Pay + UPI */}
        <div className="space-y-4">
          {balance > 0 && can('fees', 'write') && (
            <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-slate-900 to-slate-800 p-5">
              <div className="text-sm font-bold text-white mb-3 flex items-center gap-2"><CreditCard className="w-4 h-4 text-emerald-400" /> Record Payment</div>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase">Amount</label>
                  <input value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase">Method</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {['cash', 'cheque', 'upi', 'card'].map((m) => {
                      const Icon = METHOD_ICONS[m] || Receipt;
                      return <button key={m} onClick={() => setMethod(m)} className={`flex flex-col items-center gap-1 py-2 rounded-lg text-[10px] font-medium border transition-all ${method === m ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' : 'border-white/5 text-slate-500 hover:text-white'}`}><Icon className="w-4 h-4" />{m}</button>;
                    })}
                  </div>
                </div>
                <button onClick={pay} className="w-full py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-lg hover:shadow-emerald-500/20 transition-all">Pay {money(amount)}</button>
                <p className="text-[10px] text-slate-600 text-center">Idempotency-Key set — safe to retry</p>
              </div>
            </div>
          )}

          {upi && balance > 0 && (
            <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-center">
              <div className="text-sm font-bold text-white mb-3 flex items-center justify-center gap-2"><Smartphone className="w-4 h-4 text-indigo-400" /> UPI QR Code</div>
              <div className="bg-white inline-block p-3 rounded-xl"><QRCodeSVG value={upi.upi} size={160} /></div>
              <p className="text-[10px] text-slate-600 mt-2 break-all max-w-[240px] mx-auto">{upi.upi}</p>
            </div>
          )}

          {receipt && (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
              <div className="flex items-center gap-2 font-bold text-emerald-400 mb-1"><CheckCircle2 className="w-5 h-5" /> Payment Successful</div>
              <div className="text-sm text-slate-300 font-mono">{receipt.receipt_no}</div>
              <div className="text-xs text-slate-400 mt-1">Balance: {money(receipt.balance)} · {receipt.status}{receipt.reconciled ? ' · reconciled' : ''}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
