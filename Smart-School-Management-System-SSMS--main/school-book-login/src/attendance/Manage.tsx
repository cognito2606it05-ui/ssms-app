import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Bell, Server, ScanFace, Plus, MoonStar, Send } from 'lucide-react';
import { useAuth } from '../rbac/auth';
import { aApi, uploadForm } from './api';
import { DataTable } from '../admin/DataTable';

const TABS = ['notifications', 'devices', 'faces'] as const;
const LABELS: Record<string, string> = { notifications: 'Parent Notifications', devices: 'Biometric Devices', faces: 'Face Enrollment' };

export default function Manage() {
  const [tab, setTab] = useState<string>('notifications');
  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-stone-200 dark:border-stone-800">
        {TABS.map((t) => <button key={t} onClick={() => setTab(t)} className={`px-4 py-2.5 text-sm font-bold border-b-2 ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-stone-400'}`}>{LABELS[t]}</button>)}
      </div>
      {tab === 'notifications' && <Notifications />}
      {tab === 'devices' && <Devices />}
      {tab === 'faces' && <Faces />}
    </div>
  );
}

function Notifications() {
  const { token } = useAuth();
  const [queue, setQueue] = useState<any[]>([]);
  const [sid, setSid] = useState('1');
  const [prefs, setPrefs] = useState<any>(null);
  const load = useCallback(async () => setQueue(await aApi('/notify/queue', {}, token)), [token]);
  useEffect(() => { load(); }, [load]);
  const loadPrefs = async () => setPrefs(await aApi(`/notify/prefs/${sid}`, {}, token));
  const savePrefs = async () => { await aApi(`/notify/prefs/${sid}`, { method: 'PUT', body: prefs }, token); toast.success('Preferences saved'); };
  const process = async () => { const r = await aApi<any>('/notify/process', { method: 'POST' }, token); toast.success(`${r.delivered} held messages delivered`); load(); };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/10 p-4 flex items-center gap-3">
        <MoonStar className="w-5 h-5 text-amber-500" />
        <div className="flex-1 text-sm"><b>Quiet hours 21:00–07:00</b> — SMS/WhatsApp are queued and delivered next morning. Absent-student alerts fire on session close.</div>
        <button onClick={process} className="px-3 py-2 rounded-lg text-sm font-bold text-white bg-amber-500 inline-flex items-center gap-1"><Send className="w-4 h-4" /> Process held queue</button>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-4">
        <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-1">
          <DataTable csvName="notification-queue" rows={queue} columns={[
            { key: 'created_at', label: 'When', render: (r) => new Date(r.created_at).toLocaleString() },
            { key: 'name', label: 'Student' }, { key: 'channel', label: 'Channel' },
            { key: 'status', label: 'Status', render: (r) => <span className={`text-xs font-bold ${r.status === 'sent' ? 'text-emerald-500' : r.status === 'held' ? 'text-amber-500' : 'text-stone-400'}`}>{r.status}</span> },
            { key: 'message', label: 'Message', render: (r) => <span className="text-xs">{(r.message || '').slice(0, 40)}</span> },
          ]} />
        </div>
        <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4">
          <div className="flex items-center gap-2 text-sm font-bold mb-3"><Bell className="w-4 h-4" /> Notification preferences</div>
          <div className="flex gap-2 mb-3"><input value={sid} onChange={(e) => setSid(e.target.value)} placeholder="student id" className="flex-1 px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800" /><button onClick={loadPrefs} className="px-3 py-2 rounded-lg text-sm font-bold border border-stone-300 dark:border-stone-700">Load</button></div>
          {prefs && <div className="space-y-2">
            {(['sms', 'whatsapp', 'email', 'push'] as const).map((k) => (
              <label key={k} className="flex items-center justify-between text-sm capitalize"><span>{k}</span><input type="checkbox" checked={!!prefs[k]} onChange={(e) => setPrefs({ ...prefs, [k]: e.target.checked })} className="w-4 h-4" /></label>
            ))}
            <button onClick={savePrefs} className="w-full mt-2 py-2 rounded-lg text-sm font-bold text-white bg-blue-600">Save</button>
          </div>}
        </div>
      </div>
    </div>
  );
}

function Devices() {
  const { token } = useAuth();
  const [devices, setDevices] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [f, setF] = useState({ device_id: '', name: '', type: 'fingerprint' });
  const load = useCallback(async () => { setDevices(await aApi('/devices', {}, token)); setLogs(await aApi('/devices/sync-logs', {}, token)); }, [token]);
  useEffect(() => { load(); }, [load]);
  const add = async () => {
    if (!f.device_id) return toast.error('device_id required');
    const r = await aApi<any>('/devices', { method: 'POST', body: f }, token);
    toast.success(`Device added · API key: ${r.api_key}`, { duration: 8000 });
    setF({ device_id: '', name: '', type: 'fingerprint' }); load();
  };
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4">
        <div className="flex items-center gap-2 text-sm font-bold mb-3"><Server className="w-4 h-4" /> Register device</div>
        <div className="flex flex-wrap gap-2">
          <input value={f.device_id} onChange={(e) => setF({ ...f, device_id: e.target.value })} placeholder="device_id (e.g. BIO-003)" className="px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800" />
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="name" className="px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800" />
          <select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} className="px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800">{['fingerprint', 'face', 'rfid'].map((t) => <option key={t}>{t}</option>)}</select>
          <button onClick={add} className="px-4 py-2 rounded-lg font-bold text-white bg-blue-600 inline-flex items-center gap-1"><Plus className="w-4 h-4" /> Add</button>
        </div>
      </div>
      <DataTable csvName="devices" rows={devices} columns={[
        { key: 'device_id', label: 'Device' }, { key: 'name', label: 'Name' }, { key: 'type', label: 'Type' },
        { key: 'active', label: 'Active', render: (r) => r.active ? '✅' : '—' },
      ]} />
      <div>
        <h3 className="text-sm font-bold text-stone-500 uppercase mb-2">Sync logs</h3>
        <DataTable csvName="sync-logs" rows={logs} columns={[
          { key: 'created_at', label: 'When', render: (r) => new Date(r.created_at).toLocaleString() },
          { key: 'device_id', label: 'Device' },
          { key: 'status', label: 'Status', render: (r) => <span className={`text-xs font-bold ${r.status === 'ok' ? 'text-emerald-500' : 'text-red-500'}`}>{r.status}</span> },
          { key: 'error', label: 'Error' }, { key: 'attempts', label: 'Attempts' },
        ]} />
      </div>
    </div>
  );
}

function Faces() {
  const { token } = useAuth();
  const [list, setList] = useState<any[]>([]);
  const [sid, setSid] = useState('');
  const [consent, setConsent] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const load = useCallback(async () => setList(await aApi('/face/enrollments', {}, token)), [token]);
  useEffect(() => { load(); }, [load]);
  const enroll = async () => {
    if (!sid) return toast.error('student id required');
    if (!consent) return toast.error('GDPR: biometric consent is required to enroll');
    try { const r = await uploadForm('/face/enroll', { student_id: sid, consent: String(consent) }, file, token); toast.success(`Enrolled · ${r?.note || ''}`, { duration: 6000 }); setSid(''); setFile(null); load(); } catch (e: any) { toast.error(e.message); }
  };
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4">
        <div className="flex items-center gap-2 text-sm font-bold mb-1"><ScanFace className="w-4 h-4" /> Enroll face (with consent)</div>
        <p className="text-[11px] text-stone-400 mb-3">Template encrypted at rest (AES-256-GCM). Recognition itself is simulated.</p>
        <div className="flex flex-wrap items-center gap-2">
          <input value={sid} onChange={(e) => setSid(e.target.value)} placeholder="student id" className="px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 w-28" />
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-sm" />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="w-4 h-4" /> Biometric consent</label>
          <button onClick={enroll} className="px-4 py-2 rounded-lg font-bold text-white bg-indigo-600">Enroll</button>
        </div>
      </div>
      <DataTable csvName="face-enrollments" rows={list} columns={[
        { key: 'name', label: 'Student' }, { key: 'student_id', label: 'ID' },
        { key: 'consent', label: 'Consent', render: (r) => r.consent ? <span className="text-emerald-500 text-xs font-bold">granted</span> : <span className="text-red-500 text-xs">none</span> },
        { key: 'template_version', label: 'Template' }, { key: 'enrolled_at', label: 'Enrolled', render: (r) => new Date(r.enrolled_at).toLocaleDateString() },
      ]} />
    </div>
  );
}
