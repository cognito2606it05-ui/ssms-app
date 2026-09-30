import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, AreaChart, Area, LineChart, Line } from 'recharts';
import { useAuth } from '../rbac/auth';
import { fApi, money } from './api';
import { DataTable } from '../admin/DataTable';
import { TrendingUp, TrendingDown, IndianRupee, AlertTriangle, Clock, CheckCircle2, ChartPie, ListFilter } from 'lucide-react';

const AGING_COLORS = ['#22c55e', '#f59e0b', '#f97316', '#ef4444'];
const PIE_COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e', '#ef4444', '#f97316'];

function KpiCard({ label, value, icon: Icon, color, sub, trend }: any) {
  return (
    <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-slate-900 to-slate-800 p-5 relative overflow-hidden group hover:border-white/10 transition-all duration-300">
      <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full bg-gradient-to-br ${color} opacity-10 group-hover:opacity-20 transition-opacity`} />
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider mb-1">{label}</div>
          <div className="text-2xl font-bold text-white">{value}</div>
          {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
        </div>
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-lg`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(trend)}% vs last period
        </div>
      )}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-white/10 rounded-xl px-3 py-2 shadow-xl text-xs">
      <p className="font-bold text-white mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-slate-300"><span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: p.color }} />{p.name}: {money(p.value)}</p>
      ))}
    </div>
  );
};

export default function Collections() {
  const { token } = useAuth();
  const [d, setD] = useState<any>(null);
  const [aging, setAging] = useState<any>(null);
  const [byClass, setByClass] = useState<any[]>([]);
  const [byFeeType, setByFeeType] = useState<any[]>([]);
  const [defaulters, setDefaulters] = useState<any[]>([]);
  const [dueList, setDueList] = useState<any[]>([]);
  const [tab, setTab] = useState<'overview' | 'defaulters' | 'due'>('overview');

  useEffect(() => {
    fApi('/collections/dashboard', {}, token).then(setD);
    fApi('/collections/aging', {}, token).then(setAging);
    fApi('/collections/by-class', {}, token).then(setByClass);
    fApi('/collections/by-fee-type', {}, token).then(setByFeeType);
    fApi('/collections/defaulters', {}, token).then(setDefaulters);
    fApi('/collections/due-list', {}, token).then(setDueList);
  }, [token]);

  const agingData = aging ? [
    { bucket: 'Not due', amt: Number(aging.not_due), fill: AGING_COLORS[0] },
    { bucket: '0–30d', amt: Number(aging.d0_30), fill: AGING_COLORS[1] },
    { bucket: '31–60d', amt: Number(aging.d31_60), fill: AGING_COLORS[2] },
    { bucket: '60+ d', amt: Number(aging.d60p), fill: AGING_COLORS[3] },
  ] : [];

  const collectionRate = d?.collectionRate || 0;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Today's Collection" value={money(d?.today)} icon={IndianRupee} color="from-emerald-500 to-teal-600" />
        <KpiCard label="This Month" value={money(d?.this_month)} icon={TrendingUp} color="from-blue-500 to-indigo-600" />
        <KpiCard label="This Academic Year" value={money(d?.this_year)} icon={CheckCircle2} color="from-violet-500 to-purple-600" />
        <KpiCard label="Outstanding" value={money(d?.outstanding)} icon={AlertTriangle} color="from-red-500 to-rose-600" sub={`${defaulters.length} defaulters`} />
      </div>

      {/* Collection Rate Progress */}
      <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-slate-900 to-slate-800 p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Overall Collection Rate</h3>
            <p className="text-xs text-slate-500 mt-0.5">Collected {money(d?.collected)} of {money(d?.billed)} billed</p>
          </div>
          <div className="text-right">
            <span className={`text-3xl font-bold ${collectionRate >= 80 ? 'text-emerald-400' : collectionRate >= 50 ? 'text-amber-400' : 'text-red-400'}`}>{collectionRate}%</span>
          </div>
        </div>
        <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-1000 ease-out ${collectionRate >= 80 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : collectionRate >= 50 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' : 'bg-gradient-to-r from-red-500 to-rose-400'}`}
            style={{ width: `${collectionRate}%` }} />
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 border-b border-white/5">
        {[
          { key: 'overview', label: 'Analytics Overview', icon: ChartPie },
          { key: 'defaulters', label: `Top Defaulters (${defaulters.length})`, icon: AlertTriangle },
          { key: 'due', label: `Due List (${dueList.length})`, icon: ListFilter },
        ].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid lg:grid-cols-2 gap-5">
          {/* Aging Analysis */}
          <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-slate-900 to-slate-800 p-5">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" /> Aging Analysis
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={agingData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="bucket" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={{ stroke: 'rgba(255,255,255,0.05)' }} />
                <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={{ stroke: 'rgba(255,255,255,0.05)' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="amt" radius={[8, 8, 0, 0]} name="Amount">
                  {agingData.map((entry, i) => (<Cell key={i} fill={entry.fill} />))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Collection Rate by Class */}
          <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-slate-900 to-slate-800 p-5">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" /> Collection Rate by Class
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byClass} barSize={35}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="class" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={{ stroke: 'rgba(255,255,255,0.05)' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#64748b' }} axisLine={{ stroke: 'rgba(255,255,255,0.05)' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="rate" radius={[8, 8, 0, 0]} fill="#6366f1" name="Rate %" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Collection by Fee Type (Pie) */}
          <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-slate-900 to-slate-800 p-5">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ChartPie className="w-4 h-4 text-purple-500" /> Revenue by Fee Type
            </h3>
            <div className="flex items-center">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie data={byFeeType} dataKey="billed" nameKey="fee_type" cx="50%" cy="50%" outerRadius={80} innerRadius={45} paddingAngle={3} strokeWidth={0}>
                    {byFeeType.map((_, i) => (<Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {byFeeType.slice(0, 6).map((ft, i) => (
                  <div key={ft.fee_type} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-slate-400 truncate flex-1">{ft.fee_type}</span>
                    <span className="text-white font-medium">{money(ft.billed)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Billed vs Collected by Class */}
          <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-slate-900 to-slate-800 p-5">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-emerald-500" /> Billed vs Collected
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byClass} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="class" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={{ stroke: 'rgba(255,255,255,0.05)' }} />
                <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={{ stroke: 'rgba(255,255,255,0.05)' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="billed" radius={[6, 6, 0, 0]} fill="#6366f1" name="Billed" barSize={18} />
                <Bar dataKey="collected" radius={[6, 6, 0, 0]} fill="#22c55e" name="Collected" barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'defaulters' && (
        <DataTable csvName="defaulters" rows={defaulters} columns={[
          { key: 'name', label: 'Student' },
          { key: 'class', label: 'Class', render: (r) => `${r.class}${r.section || ''}` },
          { key: 'phone', label: 'Contact', render: (r) => <span className="text-slate-400">{r.phone || r.email || '—'}</span> },
          { key: 'outstanding', label: 'Outstanding', value: (r) => Number(r.outstanding), render: (r) => <span className="font-bold text-red-400">{money(r.outstanding)}</span> },
          { key: 'max_overdue', label: 'Overdue', value: (r) => Number(r.max_overdue), render: (r) => {
            const d = Number(r.max_overdue);
            return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${d > 60 ? 'bg-red-500/10 text-red-400' : d > 30 ? 'bg-amber-500/10 text-amber-400' : d > 0 ? 'bg-yellow-500/10 text-yellow-400' : 'bg-slate-500/10 text-slate-400'}`}>{d > 0 ? `${d}d` : 'not due'}</span>;
          }},
        ]} />
      )}

      {tab === 'due' && (
        <DataTable csvName="due-list" rows={dueList} columns={[
          { key: 'invoice_no', label: 'Invoice' },
          { key: 'name', label: 'Student' },
          { key: 'class', label: 'Class' },
          { key: 'phone', label: 'Phone' },
          { key: 'balance', label: 'Balance', value: (r) => Number(r.balance), render: (r) => <span className="font-bold text-red-400">{money(r.balance)}</span> },
          { key: 'due_date', label: 'Due Date', render: (r) => new Date(r.due_date).toLocaleDateString() },
          { key: 'overdue_days', label: 'Overdue', value: (r) => Number(r.overdue_days), render: (r) => {
            const d = Number(r.overdue_days);
            return <span className={`text-xs font-bold ${d > 30 ? 'text-red-400' : d > 0 ? 'text-amber-400' : 'text-slate-400'}`}>{d > 0 ? `${d} days` : '—'}</span>;
          }},
        ]} />
      )}
    </div>
  );
}
