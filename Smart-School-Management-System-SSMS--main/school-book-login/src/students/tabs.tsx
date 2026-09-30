import { useState } from 'react';
import toast from 'react-hot-toast';
import { Download, FileText, CreditCard, Plus, Wallet, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { API_BASE } from '../rbac/api';
import { sApi } from './api';

const money = (n: any) => '₹' + Number(n || 0).toLocaleString('en-IN');
const Row = ({ k, v }: any) => (<div className="flex justify-between py-1.5 border-b border-stone-100 dark:border-stone-800 text-sm"><span className="text-stone-500">{k}</span><span className="font-medium">{v ?? '—'}</span></div>);
const Block = ({ title, children }: any) => (<div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5"><h3 className="text-sm font-bold uppercase tracking-wider text-stone-500 mb-3">{title}</h3>{children}</div>);

async function downloadDoc(studentId: number, doc: any, token: string | null) {
  try {
    // documents are served at /students/files/:id/:file; we stored filename internally — use the documents list's filename via meta endpoint
    const res = await fetch(`${API_BASE}/students/files/${studentId}/${doc.filename}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!res.ok) throw new Error('not found');
    const b = await res.blob(); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = doc.original_name || 'document'; a.click();
  } catch { toast.error('Download failed'); }
}

export default function TabContent({ tab, student, token, reload }: { tab: string; student: any; token: string | null; reload: () => void }) {
  const [amount, setAmount] = useState('');

  if (tab === 'overview') return (
    <div className="grid md:grid-cols-2 gap-5">
      <Block title="Personal"><Row k="Full name" v={student.name} /><Row k="DOB" v={student.dob} /><Row k="Gender" v={student.gender} /><Row k="Nationality" v={student.nationality} /><Row k="Religion" v={student.religion} /><Row k="Blood group" v={student.blood_group} /></Block>
      <Block title="Contact"><Row k="Phone" v={student.phone} /><Row k="Email" v={student.email} /><Row k="Address" v={student.address} /><Row k="Emergency 1" v={student.emergency1_name && `${student.emergency1_name} · ${student.emergency1_phone}`} /><Row k="Emergency 2" v={student.emergency2_name && `${student.emergency2_name} · ${student.emergency2_phone}`} /></Block>
      <Block title="Guardians">{student.guardians?.length ? student.guardians.map((g: any) => <Row key={g.id} k={`${g.relation}`} v={`${g.name || 'Linked #' + g.parent_user_id} · ${g.phone || ''}`} />) : <p className="text-sm text-stone-400">None linked.</p>}</Block>
      <Block title="Transport"><Row k="Route" v={student.transport_route} /></Block>
    </div>
  );

  if (tab === 'academic') return (
    <div className="grid md:grid-cols-2 gap-5">
      <Block title="Current"><Row k="Class" v={`${student.class || '-'} ${student.section || ''}`} /><Row k="Roll number" v={student.roll_number} /><Row k="Admission no" v={student.admission_number} /><Row k="Admission date" v={student.admission_date} /></Block>
      <Block title="Previous school"><Row k="School" v={student.prev_school} /><Row k="TC number" v={student.prev_tc_number} /><Row k="Last %" v={student.prev_percentage && `${student.prev_percentage}%`} /></Block>
      <Block title="AI predicted performance"><Row k="Predicted grade" v={student.ai?.predicted_grade} /><Row k="Learning style" v={student.ai?.learning_style} /><Row k="Engagement" v={student.ai && `${student.ai.engagement}/100`} /></Block>
    </div>
  );

  if (tab === 'attendance') {
    const a = Number(student.attendance_pct);
    return <Block title="Attendance"><div className="text-4xl font-bold mb-2" style={{ color: a < 70 ? '#ef4444' : a < 85 ? '#f59e0b' : '#22c55e' }}>{a}%</div><div className="h-3 bg-stone-100 dark:bg-stone-800 rounded-full"><div className="h-full rounded-full" style={{ width: `${a}%`, background: a < 70 ? '#ef4444' : a < 85 ? '#f59e0b' : '#22c55e' }} /></div><p className="text-xs text-stone-400 mt-2">{a < 75 ? 'Below the 75% threshold — flagged by the anomaly detector.' : 'Within healthy range.'}</p></Block>;
  }

  if (tab === 'fees') return (
    <Block title="Fees"><Row k="Status" v={student.fee_status} /><Row k="Wallet (ID card)" v={student.card && money(student.card.wallet_balance)} /><p className="text-xs text-stone-400 mt-3">Detailed ledger lives in the Financial module (Master Control Panel).</p></Block>
  );

  if (tab === 'documents') return (
    <Block title="Documents">
      {student.documents?.length ? (
        <div className="space-y-2">{student.documents.map((d: any) => (
          <div key={d.id} className="flex items-center justify-between border border-stone-100 dark:border-stone-800 rounded-xl p-3">
            <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-stone-400" /><span className="text-sm font-medium">{d.original_name}</span><span className="text-[10px] uppercase px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800">{d.kind}</span><span className="text-[10px] text-stone-400">{(d.size_bytes / 1024).toFixed(0)}KB</span></div>
            <button onClick={() => downloadDoc(student.id, d, token)} className="text-blue-500 text-xs font-bold inline-flex items-center gap-1"><Download className="w-3.5 h-3.5" /> Download</button>
          </div>
        ))}</div>
      ) : <p className="text-sm text-stone-400">No documents uploaded.</p>}
    </Block>
  );

  if (tab === 'activity') return (
    <Block title="Recent activity">
      <div className="space-y-2">
        {(student.alerts || []).map((al: any) => <div key={'a' + al.id} className="flex items-center gap-2 text-sm"><AlertTriangle className={`w-4 h-4 ${al.severity === 'high' ? 'text-red-500' : 'text-amber-500'}`} /><span>{al.message}</span><span className="text-[10px] text-stone-400">{new Date(al.created_at).toLocaleDateString()}</span></div>)}
        {(student.cardTxns || []).map((t: any) => <div key={'t' + t.id} className="flex items-center gap-2 text-sm"><Clock className="w-4 h-4 text-stone-400" /><span>Wallet {t.type} {money(t.amount)}</span><span className="text-[10px] text-stone-400">{new Date(t.created_at).toLocaleDateString()}</span></div>)}
        {!student.alerts?.length && !student.cardTxns?.length && <p className="text-sm text-stone-400">No recent activity.</p>}
      </div>
    </Block>
  );

  if (tab === 'idcard') {
    const card = student.card;
    const issue = async () => { await sApi(`/${student.id}/card/issue`, { method: 'POST' }, token); toast.success('ID card issued'); reload(); };
    const topup = async () => { const a = Number(amount); if (!(a > 0)) return toast.error('Enter amount'); await sApi(`/${student.id}/card/topup`, { method: 'POST', body: { amount: a } }, token); toast.success('Wallet topped up'); setAmount(''); reload(); };
    return (
      <div className="grid md:grid-cols-2 gap-5">
        <div className="rounded-2xl p-6 text-white bg-gradient-to-br from-blue-600 to-indigo-700 shadow-xl">
          <div className="flex justify-between items-start"><CreditCard className="w-8 h-8" /><span className={`px-2 py-1 rounded-full text-[10px] font-bold ${card?.status === 'active' ? 'bg-emerald-400 text-emerald-950' : card?.status === 'blocked' ? 'bg-red-400 text-red-950' : 'bg-stone-300 text-stone-700'}`}>{card?.status || 'none'}</span></div>
          <div className="mt-8 text-lg font-bold">{student.name}</div>
          <div className="text-sm opacity-80">Class {student.class}{student.section} · {student.admission_number}</div>
          <div className="mt-2 font-mono tracking-widest">{card?.card_no || '— not issued —'}</div>
          <div className="text-xs opacity-70 mt-1">Expires {card?.expires_at || '—'}</div>
        </div>
        <Block title="Wallet & actions">
          <div className="flex items-center gap-2 mb-4"><Wallet className="w-6 h-6 text-emerald-500" /><span className="text-3xl font-bold">{money(card?.wallet_balance)}</span></div>
          {!card && <button onClick={issue} className="w-full mb-2 py-2.5 rounded-xl font-bold text-white bg-blue-600">Issue ID card</button>}
          {card && <button onClick={issue} className="w-full mb-2 py-2 rounded-xl font-bold border border-stone-300 dark:border-stone-700 text-sm">Re-issue / activate</button>}
          <div className="flex gap-2"><input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="amount" className="flex-1 px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800" /><button onClick={topup} className="px-4 py-2 rounded-lg font-bold text-white bg-emerald-600 inline-flex items-center gap-1"><Plus className="w-4 h-4" /> Top up</button></div>
          <div className="mt-4 space-y-1 max-h-40 overflow-auto">{(student.cardTxns || []).map((t: any) => <div key={t.id} className="flex justify-between text-xs text-stone-500"><span>{t.type}</span><span>{money(t.amount)} → {money(t.balance_after)}</span></div>)}</div>
        </Block>
      </div>
    );
  }

  return null;
}
