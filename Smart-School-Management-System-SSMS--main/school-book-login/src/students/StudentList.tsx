import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Search, UserPlus, Upload, ArrowUpCircle, FileText, Send, Save, Filter, X, Bookmark, Users,
} from 'lucide-react';
import { useAuth } from '../rbac/auth';
import { DataTable, Column } from '../admin/DataTable';
import { StatusBadge } from '../admin/Gauge';
import { sApi } from './api';
import BulkImport from './BulkImport';

const EMPTY = { qy: '', class: '', section: '', gender: '', blood_group: '', transport_route: '', fee_status: '', status: '', min_attendance: '' };
const riskColor = (r: number) => (r >= 65 ? 'red' : r >= 35 ? 'amber' : 'green') as 'red' | 'amber' | 'green';

export default function StudentList({ onOpen, onRegister }: { onOpen: (id: number) => void; onRegister: () => void }) {
  const { token, can } = useAuth();
  const [filters, setFilters] = useState({ ...EMPTY });
  const [rows, setRows] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [presets, setPresets] = useState<any[]>([]);
  const [showImport, setShowImport] = useState(false);
  const [modal, setModal] = useState<null | 'promote' | 'notify'>(null);

  const load = useCallback(async () => {
    const qs = new URLSearchParams(Object.entries(filters).filter(([, v]) => v) as any).toString();
    setRows(await sApi<any[]>(`?${qs}`, {}, token));
  }, [filters, token]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);
  useEffect(() => { sApi('/stats', {}, token).then(setStats); sApi('/filters', {}, token).then(setPresets); }, [token]);

  const savePreset = async () => {
    const name = prompt('Save current filters as preset — name?');
    if (!name) return;
    await sApi('/filters', { method: 'POST', body: { name, filter: filters } }, token);
    setPresets(await sApi('/filters', {}, token));
    toast.success('Preset saved');
  };
  const applyPreset = (p: any) => setFilters({ ...EMPTY, ...p.filter });

  const ids = rows.map((r) => r.id);
  const genTc = async () => {
    if (!ids.length) return toast.error('No students in current filter');
    const r = await sApi<any>('/bulk/tc', { method: 'POST', body: { ids } }, token);
    toast.success(`Generated ${r.count} transfer certificates`);
    const w = window.open('', '_blank');
    if (!w) return;
    const cards = r.certificates.map((c: any) => {
      const cls = `${c.class || '-'}${c.section || ''}`;
      return `<div style="border:1px solid #ccc;margin:8px;padding:12px;font-family:sans-serif"><b>${c.name}</b> &middot; ${c.tc_number}<br/>Adm ${c.admission_number} &middot; Class ${cls} &middot; Issued ${c.issued}</div>`;
    }).join('');
    w.document.write(`<h2>Transfer Certificates (${r.count})</h2>${cards}`);
    w.print();
  };

  const cols: Column<any>[] = [
    { key: 'name', label: 'Student', value: (r) => r.name, render: (r) => (
      <button onClick={() => onOpen(r.id)} className="flex items-center gap-2 text-left">
        <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-700 overflow-hidden flex items-center justify-center text-xs font-bold">{r.photo_url ? <img src={r.photo_url} className="w-full h-full object-cover" /> : r.name[0]}</div>
        <div><div className="font-bold text-blue-600 dark:text-blue-400">{r.name}</div><div className="text-[10px] text-stone-400">{r.admission_number}</div></div>
      </button>
    ) },
    { key: 'class', label: 'Class', value: (r) => `${r.class || ''}${r.section || ''}`, render: (r) => `${r.class || '-'}${r.section || ''}` },
    { key: 'roll_number', label: 'Roll' },
    { key: 'fee_status', label: 'Fee', render: (r) => <span className={`text-xs font-bold ${r.fee_status === 'Paid' ? 'text-emerald-500' : r.fee_status === 'Overdue' ? 'text-red-500' : 'text-amber-500'}`}>{r.fee_status}</span> },
    { key: 'attendance_pct', label: 'Attend %', value: (r) => Number(r.attendance_pct), render: (r) => `${r.attendance_pct}%` },
    { key: 'dropout_risk', label: 'Risk', value: (r) => Number(r.dropout_risk ?? 0), render: (r) => <span className="inline-flex items-center gap-1.5"><StatusBadge status={riskColor(r.dropout_risk ?? 0)} /> {r.dropout_risk ?? '–'}</span> },
    { key: 'card_status', label: 'ID Card', render: (r) => <span className="text-xs">{r.card_status || '—'}{r.wallet_balance != null ? ` · ₹${Number(r.wallet_balance).toFixed(0)}` : ''}</span> },
    { key: 'status', label: 'Status', render: (r) => <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : r.status === 'Transferred' ? 'bg-blue-100 text-blue-700' : 'bg-stone-200 text-stone-600'}`}>{r.status}</span> },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><Users className="w-6 h-6 text-blue-600" /><h1 className="text-2xl font-bold">Students</h1>{stats && <span className="text-sm text-stone-400">{stats.total} total · <span className="text-red-500">{stats.atRisk} at-risk</span></span>}</div>
        <div className="flex gap-2">
          {can('students', 'write') && <button onClick={onRegister} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700"><UserPlus className="w-4 h-4" /> Register</button>}
          {can('students', 'write') && <button onClick={() => setShowImport(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold border border-stone-300 dark:border-stone-700"><Upload className="w-4 h-4" /> Import</button>}
        </div>
      </div>

      {/* search + advanced filters */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input value={filters.qy} onChange={(e) => setFilters({ ...filters, qy: e.target.value })} placeholder="Global search: name, roll, admission no, parent phone…" className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800" />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Filter className="w-4 h-4 text-stone-400" />
          {[
            ['class', ['8', '9', '10', '11', '12']], ['section', ['A', 'B', 'C']], ['gender', ['Male', 'Female']],
            ['blood_group', ['A+', 'B+', 'O+', 'AB+', 'A-', 'O-']], ['fee_status', ['Paid', 'Partial', 'Overdue']],
            ['transport_route', ['Route 1 - North', 'Route 2 - East', 'Route 3 - South', 'Day Scholar']], ['status', ['Active', 'Inactive', 'Transferred']],
          ].map(([k, opts]) => (
            <select key={k as string} value={(filters as any)[k as string]} onChange={(e) => setFilters({ ...filters, [k as string]: e.target.value })} className="px-2 py-1.5 rounded-lg text-xs border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800">
              <option value="">{(k as string).replace('_', ' ')}: all</option>
              {(opts as string[]).map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          ))}
          <input type="number" placeholder="min attend %" value={filters.min_attendance} onChange={(e) => setFilters({ ...filters, min_attendance: e.target.value })} className="w-28 px-2 py-1.5 rounded-lg text-xs border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800" />
          <button onClick={() => setFilters({ ...EMPTY })} className="px-2 py-1.5 rounded-lg text-xs font-bold text-stone-500 inline-flex items-center gap-1"><X className="w-3.5 h-3.5" /> Clear</button>
          <button onClick={savePreset} className="px-2 py-1.5 rounded-lg text-xs font-bold text-blue-600 inline-flex items-center gap-1"><Save className="w-3.5 h-3.5" /> Save preset</button>
        </div>
        {presets.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center pt-1">
            <Bookmark className="w-3.5 h-3.5 text-stone-400" />
            {presets.map((p) => <button key={p.id} onClick={() => applyPreset(p)} className="px-2.5 py-1 rounded-full text-xs bg-stone-100 dark:bg-stone-800 hover:bg-blue-100 dark:hover:bg-blue-900/30">{p.name}</button>)}
          </div>
        )}
      </div>

      {/* bulk toolbar */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-stone-400">Bulk ({rows.length} in view):</span>
        {can('students', 'edit') && <button onClick={() => setModal('promote')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 font-bold"><ArrowUpCircle className="w-4 h-4" /> Promote</button>}
        {can('students', 'export') && <button onClick={genTc} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 font-bold"><FileText className="w-4 h-4" /> Generate TC</button>}
        {can('students', 'write') && <button onClick={() => setModal('notify')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 font-bold"><Send className="w-4 h-4" /> Notify</button>}
      </div>

      <DataTable columns={cols} rows={rows} csvName="students" onExport={(n) => sApi('/../admin/export-log', { method: 'POST', body: { dataset: 'students', rows: n } }, token).catch(() => {})} />

      {showImport && <BulkImport onClose={() => { setShowImport(false); load(); }} />}
      {modal === 'promote' && <PromoteModal onClose={() => setModal(null)} onDone={load} />}
      {modal === 'notify' && <NotifyModal ids={ids} onClose={() => setModal(null)} />}
    </div>
  );
}

function PromoteModal({ onClose, onDone }: any) {
  const { token } = useAuth();
  const [from, setFrom] = useState('10'); const [to, setTo] = useState('11'); const [exc, setExc] = useState('');
  const run = async () => {
    const exceptions = exc.split(',').map((s) => Number(s.trim())).filter(Boolean);
    const r = await sApi<any>('/bulk/promote', { method: 'POST', body: { fromClass: from, toClass: to, exceptions } }, token);
    toast.success(`Promoted ${r.promoted} students (${r.detained} detained)`); onDone(); onClose();
  };
  return (
    <Modal title="Bulk class promotion" onClose={onClose}>
      <div className="flex items-center gap-2">
        <input value={from} onChange={(e) => setFrom(e.target.value)} className="w-20 px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800" placeholder="from" />
        <span>→</span>
        <input value={to} onChange={(e) => setTo(e.target.value)} className="w-20 px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800" placeholder="to" />
      </div>
      <input value={exc} onChange={(e) => setExc(e.target.value)} placeholder="Detained student IDs (comma-separated)" className="w-full mt-3 px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800" />
      <button onClick={run} className="mt-4 w-full py-2.5 rounded-xl font-bold text-white bg-blue-600">Promote class {from} → {to}</button>
    </Modal>
  );
}
function NotifyModal({ ids, onClose }: any) {
  const { token } = useAuth();
  const [channel, setChannel] = useState('email'); const [msg, setMsg] = useState('');
  const run = async () => { const r = await sApi<any>('/bulk/notify', { method: 'POST', body: { ids, channel, message: msg } }, token); toast.success(`${r.note} (${r.sent} recipients)`); onClose(); };
  return (
    <Modal title={`Bulk notify (${ids.length} students)`} onClose={onClose}>
      <select value={channel} onChange={(e) => setChannel(e.target.value)} className="w-full mb-2 px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800">{['email', 'sms', 'whatsapp'].map((c) => <option key={c}>{c}</option>)}</select>
      <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={4} placeholder="Message…" className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800" />
      <button onClick={run} className="mt-3 w-full py-2.5 rounded-xl font-bold text-white bg-blue-600">Send</button>
    </Modal>
  );
}
export function Modal({ title, children, onClose }: any) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold text-lg mb-4">{title}</h3>
        {children}
      </div>
    </div>
  );
}
