import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Send, Snowflake, ShieldAlert, MessageCircle, Mail, Bell, ChevronRight, Zap } from 'lucide-react';
import { useAuth } from '../rbac/auth';
import { fApi } from './api';
import { DataTable } from '../admin/DataTable';

const STAGE_STYLES: Record<string, { color: string; label: string; icon: any }> = {
  pre_7: { color: 'text-blue-400 bg-blue-500/10', label: '7 days before', icon: Bell },
  due: { color: 'text-amber-400 bg-amber-500/10', label: 'On due date', icon: Bell },
  post_3: { color: 'text-orange-400 bg-orange-500/10', label: '3 days after', icon: MessageCircle },
  post_7: { color: 'text-red-400 bg-red-500/10', label: '7 days after', icon: MessageCircle },
  escalation: { color: 'text-red-400 bg-red-500/10', label: 'Escalation (30d+)', icon: ShieldAlert },
};

const CHANNEL_ICONS: Record<string, any> = { sms: MessageCircle, whatsapp: MessageCircle, email: Mail };

export default function Followups() {
  const { token, can } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [hold, setHold] = useState<any>(null);
  const load = useCallback(async () => { setRows(await fApi('/followups', {}, token)); setHold(await fApi('/fees/hold-services', {}, token)); }, [token]);
  useEffect(() => { load(); }, [load]);

  const run = async () => { const r = await fApi<any>('/followups/run', { method: 'POST' }, token); toast.success(`${r.remindersSent} reminders sent · ${r.escalations} escalations`); load(); };
  const applyHold = async () => { const r = await fApi<any>('/fees/hold-services/apply', { method: 'POST' }, token); toast.success(`Froze ${r.frozen} wallets of ${r.defaulters} defaulters`, { duration: 6000 }); };
  const toggleHold = async () => { const next = { ...hold, enabled: !hold.enabled }; await fApi('/fees/hold-services', { method: 'PUT', body: next }, token); setHold(next); };

  const stageCounts = rows.reduce((acc, r) => { acc[r.stage] = (acc[r.stage] || 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <div className="space-y-5">
      {/* Reminder series info */}
      <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-slate-900 to-slate-800 p-5">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2"><Zap className="w-4 h-4 text-amber-400" /> Automated Reminder Series</h3>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {Object.entries(STAGE_STYLES).map(([key, s], i) => (
                <div key={key} className="flex items-center gap-1">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${s.color}`}>{s.label}</span>
                  {i < 4 && <ChevronRight className="w-3 h-3 text-slate-600" />}
                </div>
              ))}
            </div>
          </div>
          {can('fees', 'write') && (
            <button onClick={run} className="px-5 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-600 inline-flex items-center gap-2 hover:shadow-lg hover:shadow-blue-500/20 transition-all shrink-0">
              <Send className="w-4 h-4" /> Run Reminder Series
            </button>
          )}
        </div>
      </div>

      {/* Stage breakdown chips */}
      <div className="grid grid-cols-5 gap-3">
        {Object.entries(STAGE_STYLES).map(([key, s]) => (
          <div key={key} className="rounded-xl border border-white/5 bg-slate-900 p-3 text-center">
            <div className={`text-lg font-bold ${s.color.split(' ')[0]}`}>{stageCounts[key] || 0}</div>
            <div className="text-[10px] text-slate-500 uppercase mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Hold services */}
      {hold && (
        <div className={`rounded-2xl border p-5 ${hold.enabled ? 'border-amber-500/20 bg-amber-500/5' : 'border-white/5 bg-slate-900'}`}>
          <div className="flex items-center gap-4 flex-wrap">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${hold.enabled ? 'bg-amber-500/20' : 'bg-slate-800'}`}>
              <Snowflake className={`w-5 h-5 ${hold.enabled ? 'text-amber-400' : 'text-slate-500'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-white">Hold Services</div>
              <p className="text-xs text-slate-400 mt-0.5">
                Freeze library/canteen wallet for students overdue ≥{hold.block_wallet_after_days || 30} days.
                <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${hold.enabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-500'}`}>{hold.enabled ? 'ENABLED' : 'DISABLED'}</span>
              </p>
            </div>
            {can('fees', 'write') && (
              <div className="flex gap-2">
                <button onClick={toggleHold} className="px-3 py-2 rounded-lg text-sm font-medium border border-white/10 text-slate-300 hover:bg-white/5 transition-all">{hold.enabled ? 'Disable' : 'Enable'}</button>
                <button onClick={applyHold} className="px-3 py-2 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 inline-flex items-center gap-1.5 hover:shadow-lg transition-all">
                  <ShieldAlert className="w-4 h-4" /> Apply Now
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Follow-up history */}
      <DataTable csvName="followups" rows={rows} columns={[
        { key: 'created_at', label: 'When', render: (r) => <span className="text-slate-400 text-xs">{new Date(r.created_at).toLocaleString()}</span> },
        { key: 'name', label: 'Student', render: (r) => <span className="font-medium text-white">{r.name}</span> },
        { key: 'stage', label: 'Stage', render: (r) => {
          const s = STAGE_STYLES[r.stage];
          return s ? <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span> : <span className="text-slate-500 text-xs">{r.stage}</span>;
        }},
        { key: 'channel', label: 'Channel', render: (r) => {
          const Icon = CHANNEL_ICONS[r.channel] || Bell;
          return <span className="inline-flex items-center gap-1.5 text-xs text-slate-400"><Icon className="w-3 h-3" />{r.channel}</span>;
        }},
        { key: 'status', label: 'Status', render: (r) => <span className={`text-xs font-bold ${r.status === 'sent' ? 'text-emerald-400' : 'text-slate-500'}`}>{r.status}</span> },
      ]} />
    </div>
  );
}
