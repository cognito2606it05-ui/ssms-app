import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, XCircle, ShieldAlert, RotateCcw, Flag } from 'lucide-react';
import { useAuth } from '../rbac/auth';
import { wApi, money } from './api';
import { DataTable } from '../admin/DataTable';

const TABS = ['fraud', 'refunds', 'disputes', 'verify'] as const;
const LABELS: Record<string, string> = { fraud: 'Fraud Alerts', refunds: 'Refund Approvals', disputes: 'Disputes', verify: 'Ledger Integrity' };

export default function Admin() {
  const [tab, setTab] = useState<string>('fraud');
  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-stone-200 dark:border-stone-800">
        {TABS.map((t) => <button key={t} onClick={() => setTab(t)} className={`px-4 py-2.5 text-sm font-bold border-b-2 ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-stone-400'}`}>{LABELS[t]}</button>)}
      </div>
      {tab === 'fraud' && <Fraud />}
      {tab === 'refunds' && <Refunds />}
      {tab === 'disputes' && <Disputes />}
      {tab === 'verify' && <Verify />}
    </div>
  );
}

function Fraud() {
  const { token } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const load = useCallback(async () => setRows(await wApi('/fraud/alerts', {}, token)), [token]);
  useEffect(() => { load(); }, [load]);
  const resolve = async (id: number) => { await wApi(`/fraud/alerts/${id}/resolve`, { method: 'POST' }, token); load(); };
  return (
    <DataTable csvName="fraud-alerts" rows={rows} columns={[
      { key: 'created_at', label: 'When', render: (r) => new Date(r.created_at).toLocaleString() },
      { key: 'name', label: 'Student' },
      { key: 'kind', label: 'Type', render: (r) => <span className="text-xs font-mono">{r.kind}</span> },
      { key: 'severity', label: 'Severity', render: (r) => <span className={`text-xs font-bold ${r.severity === 'high' ? 'text-red-500' : r.severity === 'medium' ? 'text-amber-500' : 'text-stone-400'}`}>{r.severity}</span> },
      { key: 'message', label: 'Detail' },
      { key: 'resolved', label: '', sortable: false, render: (r) => r.resolved ? <span className="text-xs text-stone-400">resolved</span> : <button onClick={() => resolve(r.id)} className="text-xs font-bold text-blue-600">Resolve</button> },
    ]} />
  );
}

function Refunds() {
  const { token, can } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const load = useCallback(async () => setRows(await wApi('/refunds', {}, token)), [token]);
  useEffect(() => { load(); }, [load]);
  const approve = async (id: number) => { try { await wApi(`/refunds/${id}/approve`, { method: 'POST' }, token); toast.success('Refund approved & credited'); load(); } catch (e: any) { toast.error(e.message); } };
  return (
    <DataTable csvName="refunds" rows={rows} columns={[
      { key: 'created_at', label: 'When', render: (r) => new Date(r.created_at).toLocaleString() },
      { key: 'txn_id', label: 'Txn' }, { key: 'module', label: 'Module' },
      { key: 'amount', label: 'Amount', value: (r) => Number(r.amount), render: (r) => money(r.amount) },
      { key: 'requested_by', label: 'By' },
      { key: 'status', label: 'Status', render: (r) => <span className={`text-xs font-bold ${r.status === 'approved' ? 'text-emerald-500' : r.status === 'pending' ? 'text-amber-500' : 'text-stone-400'}`}>{r.status}</span> },
      { key: 'act', label: '', sortable: false, render: (r) => r.status === 'pending' && can('fees', 'approve') ? <button onClick={() => approve(r.id)} className="text-emerald-600 text-xs font-bold inline-flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Approve</button> : null },
    ]} />
  );
}

function Disputes() {
  const { token, can } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const load = useCallback(async () => setRows(await wApi('/disputes', {}, token)), [token]);
  useEffect(() => { load(); }, [load]);
  const resolve = async (id: number, status: string) => { await wApi(`/disputes/${id}/resolve`, { method: 'POST', body: { status, admin_note: 'Reviewed' } }, token); toast.success(`Dispute ${status}`); load(); };
  return (
    <DataTable csvName="disputes" rows={rows} columns={[
      { key: 'created_at', label: 'When', render: (r) => new Date(r.created_at).toLocaleString() },
      { key: 'txn_id', label: 'Txn' }, { key: 'amount', label: 'Amount', render: (r) => money(r.amount) },
      { key: 'reason', label: 'Reason' }, { key: 'cctv_ref', label: 'CCTV ref', render: (r) => <span className="text-[10px] font-mono">{r.cctv_ref}</span> },
      { key: 'status', label: 'Status', render: (r) => <span className="text-xs font-bold">{r.status}</span> },
      { key: 'act', label: '', sortable: false, render: (r) => r.status === 'open' && can('fees', 'approve') ? <span className="flex gap-2"><button onClick={() => resolve(r.id, 'resolved')} className="text-emerald-600"><CheckCircle2 className="w-4 h-4" /></button><button onClick={() => resolve(r.id, 'rejected')} className="text-red-500"><XCircle className="w-4 h-4" /></button></span> : null },
    ]} />
  );
}

function Verify() {
  const { token } = useAuth();
  const [v, setV] = useState<any>(null);
  useEffect(() => { wApi('/wallet/ledger/verify', {}, token).then(setV); }, [token]);
  if (!v) return <p className="text-stone-400">Checking…</p>;
  return (
    <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 max-w-lg">
      <div className={`text-3xl font-bold ${v.balanced ? 'text-emerald-500' : 'text-red-500'}`}>{v.balanced ? '✓ Balanced' : '✗ Unbalanced'}</div>
      <div className="mt-3 text-sm space-y-1">
        <div className="flex justify-between"><span className="text-stone-500">Unbalanced transactions</span><b>{v.unbalancedTxns}</b></div>
        <div className="flex justify-between"><span className="text-stone-500">Global net (must be 0)</span><b>{v.globalNet}</b></div>
        <div className="flex justify-between"><span className="text-stone-500">Total ledger entries</span><b>{v.totalEntries}</b></div>
      </div>
      <p className="text-[11px] text-stone-400 mt-3">{v.note}</p>
    </div>
  );
}
