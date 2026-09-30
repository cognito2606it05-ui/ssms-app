import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, X, Calendar, Layers } from 'lucide-react';
import { useAuth } from '../rbac/auth';
import { fApi, money } from './api';
import { DataTable } from '../admin/DataTable';

const TABS = ['types', 'structures', 'concessions', 'late', 'plans'] as const;
const LABELS: Record<string, string> = { types: 'Fee Types', structures: 'Fee Structures', concessions: 'Concessions', late: 'Late Fee Rules', plans: 'Installment Plans' };
const TAB_COLORS: Record<string, string> = { types: 'emerald', structures: 'blue', concessions: 'violet', late: 'amber', plans: 'cyan' };

const Modal = ({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
    <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between p-5 border-b border-white/5">
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
);

const Input = ({ label, ...props }: any) => (
  <div>
    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">{label}</label>
    <input {...props} className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all text-sm" />
  </div>
);

const Select = ({ label, children, ...props }: any) => (
  <div>
    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">{label}</label>
    <select {...props} className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-slate-800 text-white focus:outline-none focus:border-emerald-500/50 text-sm">{children}</select>
  </div>
);

export default function Structure() {
  const [tab, setTab] = useState<string>('types');
  return (
    <div className="space-y-5">
      <div className="flex gap-1 border-b border-white/5 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${tab === t ? `border-${TAB_COLORS[t]}-500 text-${TAB_COLORS[t]}-400` : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
            {LABELS[t]}
          </button>
        ))}
      </div>
      {tab === 'types' && <Types />}
      {tab === 'structures' && <Structures />}
      {tab === 'concessions' && <Concessions />}
      {tab === 'late' && <LateRules />}
      {tab === 'plans' && <InstallmentPlans />}
    </div>
  );
}

function Types() {
  const { token, can } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: '', hsn_code: '', gst_rate: '0', default_amount: '' });
  const load = useCallback(async () => setRows(await fApi('/fee-types', {}, token)), [token]);
  useEffect(() => { load(); }, [load]);

  const add = async () => {
    await fApi('/fee-types', { method: 'POST', body: { ...f, gst_rate: Number(f.gst_rate), default_amount: Number(f.default_amount) } }, token);
    toast.success('Fee type added'); setF({ name: '', hsn_code: '', gst_rate: '0', default_amount: '' }); setOpen(false); load();
  };
  const del = async (id: number) => { if (!confirm('Delete this fee type?')) return; await fApi(`/fee-types/${id}`, { method: 'DELETE' }, token); toast.success('Deleted'); load(); };

  return (
    <div className="space-y-4">
      {can('fees', 'write') && (
        <button onClick={() => setOpen(true)} className="px-4 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 inline-flex items-center gap-2 hover:shadow-lg hover:shadow-emerald-500/20 transition-all">
          <Plus className="w-4 h-4" /> Add Fee Type
        </button>
      )}
      {open && (
        <Modal title="Add Fee Type" onClose={() => setOpen(false)}>
          <div className="space-y-4">
            <Input label="Name" placeholder="e.g. Tuition" value={f.name} onChange={(e: any) => setF({ ...f, name: e.target.value })} />
            <div className="grid grid-cols-3 gap-3">
              <Input label="HSN Code" placeholder="999293" value={f.hsn_code} onChange={(e: any) => setF({ ...f, hsn_code: e.target.value })} />
              <Input label="GST %" type="number" value={f.gst_rate} onChange={(e: any) => setF({ ...f, gst_rate: e.target.value })} />
              <Input label="Default ₹" type="number" value={f.default_amount} onChange={(e: any) => setF({ ...f, default_amount: e.target.value })} />
            </div>
            <button onClick={add} className="w-full py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600">Create Fee Type</button>
          </div>
        </Modal>
      )}
      <DataTable csvName="fee-types" rows={rows} columns={[
        { key: 'name', label: 'Fee Type', render: (r) => <span className="font-medium text-white">{r.name}</span> },
        { key: 'hsn_code', label: 'HSN', render: (r) => <span className="text-slate-400 font-mono text-xs">{r.hsn_code}</span> },
        { key: 'gst_rate', label: 'GST', render: (r) => <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${Number(r.gst_rate) > 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-500/10 text-slate-400'}`}>{r.gst_rate}%</span> },
        { key: 'default_amount', label: 'Default', render: (r) => money(r.default_amount) },
        ...(can('fees', 'write') ? [{ key: '_actions', label: '', sortable: false as const, render: (r: any) => <button onClick={() => del(r.id)} className="text-slate-500 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button> }] : []),
      ]} />
    </div>
  );
}

function Structures() {
  const { token, can } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: '', fee_type_id: '', amount: '', applies_class: '', applies_group: '', frequency: 'annual' });
  const load = useCallback(async () => { setRows(await fApi('/fee-structures', {}, token)); setTypes(await fApi('/fee-types', {}, token)); }, [token]);
  useEffect(() => { load(); }, [load]);

  const add = async () => {
    await fApi('/fee-structures', { method: 'POST', body: { ...f, fee_type_id: Number(f.fee_type_id), amount: Number(f.amount) } }, token);
    toast.success('Structure added'); setOpen(false); load();
  };
  const del = async (id: number) => { if (!confirm('Delete?')) return; await fApi(`/fee-structures/${id}`, { method: 'DELETE' }, token); toast.success('Deleted'); load(); };

  return (
    <div className="space-y-4">
      {can('fees', 'write') && <button onClick={() => setOpen(true)} className="px-4 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-600 inline-flex items-center gap-2 hover:shadow-lg transition-all"><Plus className="w-4 h-4" /> Add Structure</button>}
      {open && (
        <Modal title="Add Fee Structure" onClose={() => setOpen(false)}>
          <div className="space-y-4">
            <Input label="Name" placeholder="e.g. Tuition Class 10" value={f.name} onChange={(e: any) => setF({ ...f, name: e.target.value })} />
            <Select label="Fee Type" value={f.fee_type_id} onChange={(e: any) => setF({ ...f, fee_type_id: e.target.value })}>
              <option value="">Select...</option>
              {types.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Amount ₹" type="number" value={f.amount} onChange={(e: any) => setF({ ...f, amount: e.target.value })} />
              <Select label="Frequency" value={f.frequency} onChange={(e: any) => setF({ ...f, frequency: e.target.value })}>
                {['annual', 'monthly', 'quarterly', 'one-time'].map((v) => <option key={v}>{v}</option>)}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Applies to Class" placeholder="e.g. 10 (empty=all)" value={f.applies_class} onChange={(e: any) => setF({ ...f, applies_class: e.target.value })} />
              <Input label="Applies to Group" placeholder="e.g. Bus Users" value={f.applies_group} onChange={(e: any) => setF({ ...f, applies_group: e.target.value })} />
            </div>
            <button onClick={add} className="w-full py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-600">Create Structure</button>
          </div>
        </Modal>
      )}
      <DataTable csvName="fee-structures" rows={rows} columns={[
        { key: 'name', label: 'Name', render: (r) => <span className="font-medium text-white">{r.name}</span> },
        { key: 'fee_type', label: 'Type', render: (r) => <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">{r.fee_type}</span> },
        { key: 'amount', label: 'Amount', value: (r) => Number(r.amount), render: (r) => <span className="font-bold text-emerald-400">{money(r.amount)}</span> },
        { key: 'applies_class', label: 'Class', render: (r) => r.applies_class || <span className="text-slate-500">all</span> },
        { key: 'applies_group', label: 'Group', render: (r) => r.applies_group || <span className="text-slate-500">—</span> },
        { key: 'frequency', label: 'Freq', render: (r) => <span className="text-xs px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-300">{r.frequency}</span> },
        ...(can('fees', 'write') ? [{ key: '_del', label: '', sortable: false as const, render: (r: any) => <button onClick={() => del(r.id)} className="text-slate-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button> }] : []),
      ]} />
    </div>
  );
}

function Concessions() {
  const { token, can } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ student_id: '', group_name: '', kind: 'scholarship', disc_type: 'pct', value: '', reason: '' });
  const load = useCallback(async () => setRows(await fApi('/concessions', {}, token)), [token]);
  useEffect(() => { load(); }, [load]);

  const add = async () => {
    await fApi('/concessions', { method: 'POST', body: { ...f, student_id: f.student_id ? Number(f.student_id) : null, value: Number(f.value) } }, token);
    toast.success('Concession added'); setOpen(false); load();
  };
  const del = async (id: number) => { if (!confirm('Delete?')) return; await fApi(`/concessions/${id}`, { method: 'DELETE' }, token); toast.success('Deleted'); load(); };

  return (
    <div className="space-y-4">
      {can('fees', 'write') && <button onClick={() => setOpen(true)} className="px-4 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-violet-500 to-purple-600 inline-flex items-center gap-2 hover:shadow-lg transition-all"><Plus className="w-4 h-4" /> Add Concession</button>}
      {open && (
        <Modal title="Add Concession / Discount" onClose={() => setOpen(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Student ID" placeholder="Leave empty for group" value={f.student_id} onChange={(e: any) => setF({ ...f, student_id: e.target.value })} />
              <Input label="Group Name" placeholder="e.g. Staff Ward" value={f.group_name} onChange={(e: any) => setF({ ...f, group_name: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Select label="Kind" value={f.kind} onChange={(e: any) => setF({ ...f, kind: e.target.value })}>
                {['scholarship', 'staff_ward', 'sibling', 'other'].map((v) => <option key={v}>{v}</option>)}
              </Select>
              <Select label="Discount Type" value={f.disc_type} onChange={(e: any) => setF({ ...f, disc_type: e.target.value })}>
                <option value="pct">Percentage</option><option value="flat">Flat Amount</option>
              </Select>
              <Input label={f.disc_type === 'pct' ? 'Value %' : 'Value ₹'} type="number" value={f.value} onChange={(e: any) => setF({ ...f, value: e.target.value })} />
            </div>
            <Input label="Reason" value={f.reason} onChange={(e: any) => setF({ ...f, reason: e.target.value })} />
            <button onClick={add} className="w-full py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-violet-500 to-purple-600">Add Concession</button>
          </div>
        </Modal>
      )}
      <DataTable csvName="concessions" rows={rows} columns={[
        { key: 'student_name', label: 'Student/Group', render: (r) => <span className="font-medium text-white">{r.student_name || r.group_name || 'group'}</span> },
        { key: 'kind', label: 'Kind', render: (r) => <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400">{r.kind}</span> },
        { key: 'disc_type', label: 'Type', render: (r) => r.disc_type === 'pct' ? 'Percentage' : 'Flat' },
        { key: 'value', label: 'Value', render: (r) => <span className="font-bold text-emerald-400">{r.disc_type === 'pct' ? `${r.value}%` : money(r.value)}</span> },
        { key: 'reason', label: 'Reason', render: (r) => <span className="text-slate-400 text-xs">{r.reason || '—'}</span> },
        ...(can('fees', 'write') ? [{ key: '_del', label: '', sortable: false as const, render: (r: any) => <button onClick={() => del(r.id)} className="text-slate-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button> }] : []),
      ]} />
    </div>
  );
}

function LateRules() {
  const { token, can } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ fee_type_id: '', kind: 'flat', value: '', grace_days: '5', max_cap: '' });
  const load = useCallback(async () => { setRows(await fApi('/late-fee-rules', {}, token)); setTypes(await fApi('/fee-types', {}, token)); }, [token]);
  useEffect(() => { load(); }, [load]);

  const add = async () => {
    await fApi('/late-fee-rules', { method: 'POST', body: { fee_type_id: Number(f.fee_type_id), kind: f.kind, value: Number(f.value), grace_days: Number(f.grace_days), max_cap: f.max_cap ? Number(f.max_cap) : null } }, token);
    toast.success('Rule added'); setOpen(false); load();
  };
  const del = async (id: number) => { if (!confirm('Delete?')) return; await fApi(`/late-fee-rules/${id}`, { method: 'DELETE' }, token); toast.success('Deleted'); load(); };

  return (
    <div className="space-y-4">
      {can('fees', 'write') && <button onClick={() => setOpen(true)} className="px-4 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 inline-flex items-center gap-2 hover:shadow-lg transition-all"><Plus className="w-4 h-4" /> Add Late Fee Rule</button>}
      {open && (
        <Modal title="Add Late Fee Rule" onClose={() => setOpen(false)}>
          <div className="space-y-4">
            <Select label="Fee Type" value={f.fee_type_id} onChange={(e: any) => setF({ ...f, fee_type_id: e.target.value })}>
              <option value="">Select...</option>
              {types.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <Select label="Penalty Kind" value={f.kind} onChange={(e: any) => setF({ ...f, kind: e.target.value })}>
                <option value="flat">Flat Amount</option><option value="pct_per_day">% per day</option>
              </Select>
              <Input label={f.kind === 'flat' ? 'Amount ₹' : '% per day'} type="number" value={f.value} onChange={(e: any) => setF({ ...f, value: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Grace Days" type="number" value={f.grace_days} onChange={(e: any) => setF({ ...f, grace_days: e.target.value })} />
              <Input label="Max Cap ₹ (optional)" type="number" value={f.max_cap} onChange={(e: any) => setF({ ...f, max_cap: e.target.value })} />
            </div>
            <button onClick={add} className="w-full py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600">Create Rule</button>
          </div>
        </Modal>
      )}
      <DataTable csvName="late-rules" rows={rows} columns={[
        { key: 'fee_type', label: 'Fee Type', render: (r) => <span className="font-medium text-white">{r.fee_type}</span> },
        { key: 'kind', label: 'Kind', render: (r) => <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">{r.kind}</span> },
        { key: 'value', label: 'Value', render: (r) => <span className="font-bold">{r.kind === 'flat' ? money(r.value) : `${r.value}%/day`}</span> },
        { key: 'grace_days', label: 'Grace', render: (r) => `${r.grace_days}d` },
        { key: 'max_cap', label: 'Cap', render: (r) => r.max_cap ? money(r.max_cap) : <span className="text-slate-500">none</span> },
        ...(can('fees', 'write') ? [{ key: '_del', label: '', sortable: false as const, render: (r: any) => <button onClick={() => del(r.id)} className="text-slate-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button> }] : []),
      ]} />
    </div>
  );
}

function InstallmentPlans() {
  const { token, can } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [structures, setStructures] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: '', structure_id: '', splitCount: 4 });
  const [splits, setSplits] = useState<{ label: string; pct: number; due_date: string }[]>([]);

  const load = useCallback(async () => { setRows(await fApi('/installment-plans', {}, token)); setStructures(await fApi('/fee-structures', {}, token)); }, [token]);
  useEffect(() => { load(); }, [load]);

  const initSplits = (count: number) => {
    const pct = Math.floor(100 / count);
    const labels = count === 12 ? ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'] : count === 4 ? ['Q1','Q2','Q3','Q4'] : Array.from({ length: count }, (_, i) => `Split ${i + 1}`);
    setSplits(labels.slice(0, count).map((l, i) => ({ label: l, pct: i === count - 1 ? 100 - pct * (count - 1) : pct, due_date: '' })));
  };
  useEffect(() => { if (open) initSplits(f.splitCount); }, [open, f.splitCount]);

  const add = async () => {
    await fApi('/installment-plans', { method: 'POST', body: { name: f.name, structure_id: Number(f.structure_id), splits } }, token);
    toast.success('Plan created'); setOpen(false); load();
  };
  const del = async (id: number) => { if (!confirm('Delete?')) return; await fApi(`/installment-plans/${id}`, { method: 'DELETE' }, token); toast.success('Deleted'); load(); };

  return (
    <div className="space-y-4">
      {can('fees', 'write') && <button onClick={() => setOpen(true)} className="px-4 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-500 to-sky-600 inline-flex items-center gap-2 hover:shadow-lg transition-all"><Plus className="w-4 h-4" /> Create Plan</button>}
      {open && (
        <Modal title="Create Installment Plan" onClose={() => setOpen(false)}>
          <div className="space-y-4">
            <Input label="Plan Name" placeholder="e.g. Quarterly 2025-26" value={f.name} onChange={(e: any) => setF({ ...f, name: e.target.value })} />
            <Select label="Fee Structure" value={f.structure_id} onChange={(e: any) => setF({ ...f, structure_id: e.target.value })}>
              <option value="">Select...</option>
              {structures.map((s: any) => <option key={s.id} value={s.id}>{s.name} ({money(s.amount)})</option>)}
            </Select>
            <Select label="Number of Splits" value={f.splitCount} onChange={(e: any) => setF({ ...f, splitCount: Number(e.target.value) })}>
              {[2, 3, 4, 6, 12].map((n) => <option key={n} value={n}>{n} installments</option>)}
            </Select>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {splits.map((s, i) => (
                <div key={i} className="grid grid-cols-3 gap-2 items-end">
                  <Input label={i === 0 ? 'Label' : undefined} value={s.label} onChange={(e: any) => { const ns = [...splits]; ns[i].label = e.target.value; setSplits(ns); }} />
                  <Input label={i === 0 ? '%' : undefined} type="number" value={s.pct} onChange={(e: any) => { const ns = [...splits]; ns[i].pct = Number(e.target.value); setSplits(ns); }} />
                  <Input label={i === 0 ? 'Due Date' : undefined} type="date" value={s.due_date} onChange={(e: any) => { const ns = [...splits]; ns[i].due_date = e.target.value; setSplits(ns); }} />
                </div>
              ))}
            </div>
            <button onClick={add} className="w-full py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-500 to-sky-600">Create Plan</button>
          </div>
        </Modal>
      )}
      <DataTable csvName="installment-plans" rows={rows} columns={[
        { key: 'name', label: 'Plan Name', render: (r) => <span className="font-medium text-white flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-cyan-400" />{r.name}</span> },
        { key: 'structure_name', label: 'Structure', render: (r) => r.structure_name || <span className="text-slate-500">—</span> },
        { key: 'splits', label: 'Splits', render: (r) => {
          const s = typeof r.splits === 'string' ? JSON.parse(r.splits) : r.splits;
          return <div className="flex gap-1 flex-wrap">{(s || []).map((sp: any, i: number) => <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400">{sp.label}: {sp.pct}%</span>)}</div>;
        }},
        ...(can('fees', 'write') ? [{ key: '_del', label: '', sortable: false as const, render: (r: any) => <button onClick={() => del(r.id)} className="text-slate-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button> }] : []),
      ]} />
    </div>
  );
}
