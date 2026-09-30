import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Brain, Clock, TrendingUp, HandCoins, AlertTriangle, Sparkles, Calendar, FileText, Receipt, Building2, Download } from 'lucide-react';
import { useAuth } from '../rbac/auth';
import { fApi, money } from './api';
import { DataTable } from '../admin/DataTable';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-white/10 rounded-xl px-3 py-2 shadow-xl text-xs">
      <p className="font-bold text-white mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-slate-300">{p.name}: {typeof p.value === 'number' && p.value > 100 ? money(p.value) : p.value}</p>
      ))}
    </div>
  );
};

const AiCard = ({ title, icon: Icon, children, note, color = 'indigo' }: any) => (
  <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-slate-900 to-slate-800 overflow-hidden">
    <div className={`px-5 pt-5 pb-3 flex items-center gap-2.5`}>
      <div className={`w-8 h-8 rounded-lg bg-${color}-500/10 flex items-center justify-center`}>
        <Icon className={`w-4 h-4 text-${color}-400`} />
      </div>
      <h3 className="text-sm font-bold text-white">{title}</h3>
      <Sparkles className="w-3 h-3 text-amber-400 ml-auto" />
    </div>
    <div className="px-5 pb-5">{children}</div>
    {note && <div className="px-5 py-3 border-t border-white/5 text-[11px] text-slate-500">{note}</div>}
  </div>
);

export function AI() {
  const { token } = useAuth();
  const [def, setDef] = useState<any>(null);
  const [time, setTime] = useState<any>(null);
  const [fc, setFc] = useState<any>(null);
  const [waiver, setWaiver] = useState<any>(null);
  useEffect(() => {
    fApi('/fees/ai/default-prediction', {}, token).then(setDef);
    fApi('/fees/ai/optimal-time', {}, token).then(setTime);
    fApi('/fees/ai/revenue-forecast', {}, token).then(setFc);
    fApi('/fees/ai/waiver-recommendation', {}, token).then(setWaiver);
  }, [token]);

  const riskCounts = def?.predictions?.reduce((a: any, p: any) => { a[p.risk] = (a[p.risk] || 0) + 1; return a; }, {} as Record<string, number>) || {};
  const fcHistory = fc?.history?.map((h: any) => ({ month: h.m, total: Number(h.total) })) || [];

  return (
    <div className="space-y-5">
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Default prediction */}
        <AiCard title="Payment Default Prediction" icon={Brain} note={def?.note} color="rose">
          {/* Risk summary */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: 'High Risk', count: riskCounts.high || 0, color: 'bg-red-500/10 text-red-400' },
              { label: 'Medium', count: riskCounts.medium || 0, color: 'bg-amber-500/10 text-amber-400' },
              { label: 'Low', count: riskCounts.low || 0, color: 'bg-slate-500/10 text-slate-400' },
            ].map((r) => (
              <div key={r.label} className={`rounded-lg p-2 text-center ${r.color.split(' ')[0]}`}>
                <div className={`text-lg font-bold ${r.color.split(' ')[1]}`}>{r.count}</div>
                <div className="text-[10px]">{r.label}</div>
              </div>
            ))}
          </div>
          <div className="space-y-1.5 max-h-56 overflow-auto custom-scrollbar">
            {def?.predictions?.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between text-sm rounded-lg bg-white/5 p-2.5 hover:bg-white/10 transition-colors">
                <div className="min-w-0">
                  <span className="font-medium text-white">{p.name}</span>
                  <span className="text-xs text-slate-500 ml-2">Class {p.class} · {money(p.outstanding)}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${p.risk === 'high' ? 'bg-red-500' : p.risk === 'medium' ? 'bg-amber-500' : 'bg-slate-500'}`} style={{ width: `${p.probability}%` }} />
                  </div>
                  <span className={`text-xs font-bold w-10 text-right ${p.risk === 'high' ? 'text-red-400' : p.risk === 'medium' ? 'text-amber-400' : 'text-slate-400'}`}>{p.probability}%</span>
                </div>
              </div>
            ))}
          </div>
        </AiCard>

        {/* Right column */}
        <div className="space-y-5">
          {/* Optimal time */}
          <AiCard title="Optimal Reminder Time" icon={Clock} note={time?.note} color="blue">
            <div className="flex items-baseline gap-3">
              {time?.bestHours?.map((h: string, i: number) => (
                <div key={h} className="text-center">
                  <div className={`text-2xl font-bold ${i === 0 ? 'text-blue-400' : 'text-slate-400'}`}>{h}</div>
                  <div className="text-[10px] text-slate-500">{i === 0 ? 'Best' : `#${i + 1}`}</div>
                </div>
              ))}
            </div>
            {time?.histogram && (
              <div className="mt-3">
                <ResponsiveContainer width="100%" height={80}>
                  <BarChart data={time.histogram.slice(0, 24)} barSize={8}>
                    <Bar dataKey="n" radius={[4, 4, 0, 0]} fill="#6366f1" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </AiCard>

          {/* Revenue forecast */}
          <AiCard title="Revenue Forecast (Next Month)" icon={TrendingUp} note={fc?.note} color="emerald">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-emerald-400">{money(fc?.forecastNextMonth)}</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              95% CI: {money(fc?.confidenceInterval?.[0])} – {money(fc?.confidenceInterval?.[1])}
            </div>
            {fcHistory.length > 0 && (
              <div className="mt-3">
                <ResponsiveContainer width="100%" height={80}>
                  <AreaChart data={fcHistory}>
                    <defs>
                      <linearGradient id="fcGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="total" stroke="#22c55e" fill="url(#fcGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </AiCard>
        </div>
      </div>

      {/* Fee waiver recommendations */}
      <AiCard title="Fee Waiver Recommendations" icon={HandCoins} note={waiver?.note} color="violet">
        <DataTable csvName="waiver-recs" rows={waiver?.recommendations || []} columns={[
          { key: 'name', label: 'Student', render: (r) => <span className="font-medium text-white">{r.name}</span> },
          { key: 'class', label: 'Class' },
          { key: 'outstanding', label: 'Outstanding', value: (r) => Number(r.outstanding), render: (r) => <span className="font-bold text-red-400">{money(r.outstanding)}</span> },
          { key: 'has_concession', label: 'Has Concession', render: (r) => r.has_concession ? <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">Yes</span> : <span className="text-xs px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-400">No</span> },
        ]} />
      </AiCard>
    </div>
  );
}

export function Reports() {
  const { token } = useAuth();
  const [tab, setTab] = useState('monthly');
  const [data, setData] = useState<any>(null);
  const [dailyDate, setDailyDate] = useState(new Date().toISOString().slice(0, 10));

  const TABS: Record<string, { label: string; icon: any }> = {
    daily: { label: 'Daily Collection', icon: Calendar },
    monthly: { label: 'Monthly Summary', icon: TrendingUp },
    outstanding: { label: 'Outstanding by Class', icon: AlertTriangle },
    register: { label: 'Receipt Register', icon: Receipt },
    gst: { label: 'GST Report', icon: Building2 },
  };

  const path: Record<string, string> = { daily: `/fees/reports/daily?date=${dailyDate}`, monthly: '/fees/reports/monthly', outstanding: '/fees/reports/outstanding-by-class', register: '/fees/reports/receipt-register', gst: '/fees/reports/gst' };
  useEffect(() => { fApi(path[tab], {}, token).then(setData); }, [tab, token, dailyDate]);

  const rows = tab === 'daily' ? data?.payments : data;
  const cols: Record<string, any[]> = {
    daily: [
      { key: 'receipt_no', label: 'Receipt', render: (r: any) => <span className="font-mono text-xs text-blue-400">{r.receipt_no}</span> },
      { key: 'name', label: 'Student', render: (r: any) => <span className="font-medium text-white">{r.name}</span> },
      { key: 'class', label: 'Class' },
      { key: 'amount', label: 'Amount', value: (r: any) => Number(r.amount), render: (r: any) => <span className="font-bold text-emerald-400">{money(r.amount)}</span> },
      { key: 'method', label: 'Method', render: (r: any) => <span className="text-xs px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-300">{r.method}</span> },
    ],
    monthly: [
      { key: 'month', label: 'Month', render: (r: any) => <span className="font-medium text-white">{r.month}</span> },
      { key: 'collected', label: 'Collected', value: (r: any) => Number(r.collected), render: (r: any) => <span className="font-bold text-emerald-400">{money(r.collected)}</span> },
      { key: 'payments', label: 'Payments', render: (r: any) => <span className="text-slate-400">{r.payments}</span> },
    ],
    outstanding: [
      { key: 'class', label: 'Class', render: (r: any) => <span className="font-bold text-white">Class {r.class}</span> },
      { key: 'outstanding', label: 'Outstanding', value: (r: any) => Number(r.outstanding), render: (r: any) => <span className="font-bold text-red-400">{money(r.outstanding)}</span> },
      { key: 'unpaid_invoices', label: 'Unpaid Invoices' },
      { key: 'students', label: 'Students' },
    ],
    register: [
      { key: 'receipt_no', label: 'Receipt', render: (r: any) => <span className="font-mono text-xs text-blue-400">{r.receipt_no}</span> },
      { key: 'created_at', label: 'Date', render: (r: any) => <span className="text-xs text-slate-400">{new Date(r.created_at).toLocaleDateString()}</span> },
      { key: 'name', label: 'Student', render: (r: any) => <span className="font-medium text-white">{r.name}</span> },
      { key: 'class', label: 'Class' },
      { key: 'invoice_no', label: 'Invoice', render: (r: any) => <span className="text-xs text-slate-400">{r.invoice_no}</span> },
      { key: 'amount', label: 'Amount', value: (r: any) => Number(r.amount), render: (r: any) => <span className="font-bold text-emerald-400">{money(r.amount)}</span> },
      { key: 'method', label: 'Method' },
      { key: 'gateway', label: 'Gateway', render: (r: any) => r.gateway || <span className="text-slate-600">—</span> },
    ],
    gst: [
      { key: 'fee_type', label: 'Fee Type', render: (r: any) => <span className="font-medium text-white">{r.fee_type}</span> },
      { key: 'hsn_code', label: 'HSN', render: (r: any) => <span className="font-mono text-xs text-slate-400">{r.hsn_code}</span> },
      { key: 'gst_rate', label: 'Rate', render: (r: any) => <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">{r.gst_rate}%</span> },
      { key: 'taxable', label: 'Taxable', value: (r: any) => Number(r.taxable), render: (r: any) => money(r.taxable) },
      { key: 'cgst', label: 'CGST', value: (r: any) => Number(r.cgst), render: (r: any) => money(r.cgst) },
      { key: 'sgst', label: 'SGST', value: (r: any) => Number(r.sgst), render: (r: any) => money(r.sgst) },
    ],
  };

  return (
    <div className="space-y-5">
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-white/5 overflow-x-auto">
        {Object.entries(TABS).map(([k, t]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${tab === k ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      {/* Daily date picker */}
      {tab === 'daily' && (
        <div className="flex items-center gap-3 flex-wrap">
          <input type="date" value={dailyDate} onChange={(e) => setDailyDate(e.target.value)} className="px-3 py-2 rounded-lg border border-white/10 bg-slate-800 text-white text-sm" />
          {data?.totalCollected !== undefined && (
            <div className="text-sm text-slate-400">
              Total: <span className="font-bold text-emerald-400">{money(data.totalCollected)}</span> ({data.count} payments)
            </div>
          )}
        </div>
      )}

      {/* Monthly chart */}
      {tab === 'monthly' && Array.isArray(data) && data.length > 0 && (
        <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-slate-900 to-slate-800 p-5">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Monthly Collection Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={[...data].reverse()}>
              <defs>
                <linearGradient id="monthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={{ stroke: 'rgba(255,255,255,0.05)' }} />
              <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={{ stroke: 'rgba(255,255,255,0.05)' }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="collected" stroke="#6366f1" fill="url(#monthGrad)" strokeWidth={2} name="Collected" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Outstanding chart */}
      {tab === 'outstanding' && Array.isArray(data) && data.length > 0 && (
        <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-slate-900 to-slate-800 p-5">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Outstanding by Class</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} barSize={35}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="class" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={{ stroke: 'rgba(255,255,255,0.05)' }} />
              <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={{ stroke: 'rgba(255,255,255,0.05)' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="outstanding" radius={[8, 8, 0, 0]} fill="#ef4444" name="Outstanding" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Data table */}
      <DataTable csvName={`fee-report-${tab}`} rows={Array.isArray(rows) ? rows : []} columns={cols[tab]} />
    </div>
  );
}
