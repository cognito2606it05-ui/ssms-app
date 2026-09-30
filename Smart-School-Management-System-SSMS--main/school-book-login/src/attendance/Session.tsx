import { useCallback, useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import {
  PlayCircle, QrCode, ScanFace, Fingerprint, ClipboardList, RefreshCw, Lock, Search,
  Check, X, Clock, UserCheck, Wifi, WifiOff, Camera, RadioTower,
} from 'lucide-react';
import { useAuth } from '../rbac/auth';
import { aApi, API_BASE } from './api';
import { useWs } from './useWs';

const MODES = [
  { key: 'manual', label: 'Manual', icon: ClipboardList },
  { key: 'qr', label: 'QR Code', icon: QrCode },
  { key: 'face', label: 'Face ID', icon: ScanFace },
  { key: 'biometric', label: 'Biometric', icon: Fingerprint },
];
const STATUS_BTN: Record<string, string> = { present: 'bg-emerald-500', absent: 'bg-red-500', late: 'bg-amber-500', leave: 'bg-blue-500' };
const statusColor = (s: string) => ({ present: 'text-emerald-600', absent: 'text-red-500', late: 'text-amber-500', leave: 'text-blue-500' }[s] || 'text-stone-400');

export default function Session() {
  const { token, can } = useAuth();
  const [session, setSession] = useState<any>(null);
  const [form, setForm] = useState({ academic_year: '2025-2026', class: '10', section: 'A', subject: 'Mathematics', period_id: 'P1', mode: 'manual', grace_min: 10 });

  const start = async () => {
    try { const s = await aApi('/sessions', { method: 'POST', body: form }, token); setSession(s); }
    catch (e: any) { toast.error(e.message); }
  };

  if (!session) return (
    <div className="max-w-2xl mx-auto">
      <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6">
        <h2 className="text-xl font-bold mb-1">Start an attendance session</h2>
        <p className="text-sm text-stone-500 mb-5">Choose the class, subject and marking mode.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {([['academic_year', 'Academic year'], ['subject', 'Subject'], ['period_id', 'Period']] as const).map(([k, l]) => (
            <div key={k}><label className="block text-[11px] font-bold uppercase text-stone-400 mb-1">{l}</label><input value={(form as any)[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800" /></div>
          ))}
          <div><label className="block text-[11px] font-bold uppercase text-stone-400 mb-1">Class</label><select value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800">{['8', '9', '10', '11', '12'].map((c) => <option key={c}>{c}</option>)}</select></div>
          <div><label className="block text-[11px] font-bold uppercase text-stone-400 mb-1">Section</label><select value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800">{['A', 'B', 'C'].map((c) => <option key={c}>{c}</option>)}</select></div>
          <div><label className="block text-[11px] font-bold uppercase text-stone-400 mb-1">Grace period (min)</label><input type="number" value={form.grace_min} onChange={(e) => setForm({ ...form, grace_min: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800" /></div>
        </div>
        <div className="mt-4">
          <label className="block text-[11px] font-bold uppercase text-stone-400 mb-2">Marking mode</label>
          <div className="grid grid-cols-4 gap-2">
            {MODES.map((m) => (
              <button key={m.key} onClick={() => setForm({ ...form, mode: m.key })} className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border ${form.mode === m.key ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'border-stone-200 dark:border-stone-700 text-stone-500'}`}>
                <m.icon className="w-5 h-5" /><span className="text-xs font-bold">{m.label}</span>
              </button>
            ))}
          </div>
        </div>
        <button onClick={start} disabled={!can('attendance', 'write')} className="mt-6 w-full py-3 rounded-xl font-bold text-white bg-blue-600 inline-flex items-center justify-center gap-2 disabled:opacity-50"><PlayCircle className="w-5 h-5" /> Start Session</button>
        {!can('attendance', 'write') && <p className="text-xs text-red-500 mt-2 text-center">Your role can view attendance but not mark it.</p>}
      </div>
    </div>
  );

  return <LiveDashboard session={session} token={token} onClose={() => setSession(null)} />;
}

function LiveDashboard({ session, token, onClose }: { session: any; token: string | null; onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  const [search, setSearch] = useState('');
  const { connected, events, counts: wsCounts, tick } = useWs(session.id);
  const [qr, setQr] = useState({ token: session.qr_token, expires: session.qr_expires_at });

  const refetch = useCallback(async () => setData(await aApi(`/sessions/${session.id}`, {}, token)), [session.id, token]);
  useEffect(() => { refetch(); }, [refetch]);
  useEffect(() => { if (tick) refetch(); }, [tick, refetch]);

  const counts = wsCounts || data?.counts || { present: 0, absent: 0, late: 0, leave: 0, marked: 0 };
  const total = data?.total || 0;
  const roster: any[] = (data?.roster || []).filter((r: any) => !search || r.name.toLowerCase().includes(search.toLowerCase()));

  const mark = async (student_id: number, status: string) => { try { await aApi(`/sessions/${session.id}/mark`, { method: 'POST', body: { student_id, status } }, token); refetch(); } catch (e: any) { toast.error(e.message); } };
  const markAll = async () => { await aApi(`/sessions/${session.id}/mark-all-present`, { method: 'POST' }, token); toast.success('All marked present'); refetch(); };
  const close = async () => { const r = await aApi<any>(`/sessions/${session.id}/close`, { method: 'POST' }, token); toast.success(`Session closed · ${r.notifiedAbsent} parents notified (${r.note})`, { duration: 6000 }); onClose(); };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">Live · {session.subject} <span className="text-sm font-normal text-stone-400">Class {session.class}{session.section} · {session.mode.toUpperCase()}</span></h2>
          <p className="text-xs text-stone-400 flex items-center gap-1">{connected ? <><Wifi className="w-3.5 h-3.5 text-emerald-500" /> WebSocket connected</> : <><WifiOff className="w-3.5 h-3.5 text-red-500" /> reconnecting…</>} · grace {session.grace_min}min</p>
        </div>
        <button onClick={close} className="px-4 py-2 rounded-xl font-bold text-white bg-stone-800 dark:bg-stone-700 inline-flex items-center gap-2"><Lock className="w-4 h-4" /> Close session</button>
      </div>

      {/* counters */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Counter label="Marked" value={`${counts.marked}/${total}`} accent="#3b82f6" icon={UserCheck} />
        <Counter label="Present" value={counts.present} accent="#22c55e" />
        <Counter label="Absent" value={counts.absent} accent="#ef4444" />
        <Counter label="Late" value={counts.late} accent="#f59e0b" />
        <Counter label="On Leave" value={counts.leave} accent="#3b82f6" />
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-5">
        {/* roster (manual override always available) */}
        <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
          <div className="p-3 border-b border-stone-100 dark:border-stone-800 flex items-center gap-2">
            <div className="relative flex-1"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search students…" className="w-full pl-9 pr-3 py-2 rounded-lg text-sm border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800" /></div>
            <button onClick={markAll} className="px-3 py-2 rounded-lg text-sm font-bold text-white bg-emerald-600 whitespace-nowrap">Mark all present</button>
          </div>
          <div className="max-h-[55vh] overflow-auto divide-y divide-stone-100 dark:divide-stone-800">
            {roster.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-xs font-bold shrink-0">{r.name[0]}</div>
                  <div className="min-w-0"><div className="text-sm font-medium truncate">{r.name}</div><div className="text-[10px] text-stone-400">Roll {r.roll_number || '—'} {r.marking_method && `· ${r.marking_method}`}{r.face_match_confidence ? ` · ${r.face_match_confidence}%` : ''}</div></div>
                </div>
                <div className="flex items-center gap-1">
                  {['present', 'absent', 'late', 'leave'].map((st) => (
                    <button key={st} onClick={() => mark(r.id, st)} title={st} className={`w-7 h-7 rounded-lg text-xs font-bold text-white ${r.status === st ? STATUS_BTN[st] : 'bg-stone-200 dark:bg-stone-700 text-stone-400'}`}>{st[0].toUpperCase()}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* mode panel + live feed */}
        <div className="space-y-4">
          {session.mode === 'qr' && <QrPanel session={session} token={token} qr={qr} setQr={setQr} roster={data?.roster || []} onScan={refetch} />}
          {session.mode === 'face' && <FacePanel session={session} token={token} onChange={refetch} />}
          {session.mode === 'biometric' && <BiometricPanel />}
          <LiveFeed events={events} />
        </div>
      </div>
    </div>
  );
}

const Counter = ({ label, value, accent, icon: Icon }: any) => (
  <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4">
    <div className="flex items-center justify-between"><span className="text-[10px] font-bold uppercase text-stone-400">{label}</span>{Icon && <Icon className="w-4 h-4" style={{ color: accent }} />}</div>
    <div className="text-2xl font-bold mt-1" style={{ color: accent }}>{value}</div>
  </div>
);

function QrPanel({ session, token, qr, setQr, roster, onScan }: any) {
  const [left, setLeft] = useState(0);
  useEffect(() => { const t = setInterval(() => setLeft(Math.max(0, Math.round((new Date(qr.expires).getTime() - Date.now()) / 1000))), 500); return () => clearInterval(t); }, [qr.expires]);
  const refresh = async () => { const r = await aApi<any>(`/sessions/${session.id}/qr/refresh`, { method: 'POST' }, token); setQr({ token: r.qr_token, expires: r.qr_expires_at }); toast.success('QR refreshed'); };
  const simulate = async () => {
    const unmarked = roster.filter((r: any) => !r.status);
    if (!unmarked.length) return toast('All students marked');
    const s = unmarked[Math.floor(Math.random() * unmarked.length)];
    try { await aApi('/qr/scan', { method: 'POST', body: { token: qr.token, student_id: s.id, device_info: 'Demo Scanner', location_hash: 'loc_' + Math.random().toString(36).slice(2, 8) } }, token); toast.success(`${s.name} scanned`); onScan(); }
    catch (e: any) { toast.error(e.message); }
  };
  return (
    <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 text-center">
      <div className="flex items-center justify-center gap-2 text-sm font-bold mb-3"><QrCode className="w-4 h-4" /> Dynamic QR</div>
      <div className="bg-white p-3 rounded-xl inline-block"><QRCodeSVG value={JSON.stringify({ s: session.id, t: qr.token })} size={160} /></div>
      <div className={`mt-2 text-sm font-bold flex items-center justify-center gap-1 ${left < 30 ? 'text-red-500' : 'text-stone-500'}`}><Clock className="w-4 h-4" /> {left > 0 ? `expires in ${left}s` : 'expired'}</div>
      <div className="flex gap-2 mt-3">
        <button onClick={refresh} className="flex-1 py-2 rounded-lg text-sm font-bold border border-stone-300 dark:border-stone-700 inline-flex items-center justify-center gap-1"><RefreshCw className="w-4 h-4" /> Refresh</button>
        <button onClick={simulate} className="flex-1 py-2 rounded-lg text-sm font-bold text-white bg-blue-600">Simulate scan</button>
      </div>
      <p className="text-[10px] text-stone-400 mt-2">Students scan with the mobile app / ID card. Duplicate scans are rejected server-side.</p>
    </div>
  );
}

function FacePanel({ session, token, onChange }: any) {
  const [threshold, setThreshold] = useState(90);
  const [queue, setQueue] = useState<any[]>([]);
  const [auto, setAuto] = useState(false);
  const loadQ = useCallback(async () => setQueue(await aApi('/face/review-queue', {}, token)), [token]);
  useEffect(() => { loadQ(); }, [loadQ]);
  const detect = useCallback(async () => {
    try { const r = await aApi<any>(`/sessions/${session.id}/face/detect`, { method: 'POST', body: { threshold, camera: 'CAM-CLASS-01' } }, token); if (r.event === 'matched') toast.success(`${r.student} · ${r.confidence}%`); else if (r.event !== 'none') toast(r.message, { icon: '👁️' }); onChange(); loadQ(); } catch (e: any) { toast.error(e.message); }
  }, [session.id, threshold, token, onChange, loadQ]);
  useEffect(() => { if (!auto) return; const t = setInterval(detect, 1500); return () => clearInterval(t); }, [auto, detect]);
  const resolve = async (id: number, approve: boolean) => { await aApi(`/face/review/${id}/resolve`, { method: 'POST', body: { approve } }, token); loadQ(); onChange(); };

  return (
    <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4">
      <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2 text-sm font-bold"><Camera className="w-4 h-4" /> Face ID</div><span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">recognition simulated</span></div>
      <label className="block text-xs text-stone-500 mb-1">Confidence threshold: <b>{threshold}%</b></label>
      <input type="range" min={70} max={99} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="w-full" />
      <div className="flex gap-2 mt-3">
        <button onClick={detect} className="flex-1 py-2 rounded-lg text-sm font-bold text-white bg-indigo-600">Detect pass</button>
        <button onClick={() => setAuto((v) => !v)} className={`flex-1 py-2 rounded-lg text-sm font-bold ${auto ? 'bg-red-500 text-white' : 'border border-stone-300 dark:border-stone-700'}`}>{auto ? 'Stop auto' : 'Auto-scan'}</button>
      </div>
      <p className="text-[10px] text-stone-400 mt-2">Liveness + multi-face + unknown-face routing modelled; matches generated.</p>
      {queue.length > 0 && (
        <div className="mt-3 border-t border-stone-100 dark:border-stone-800 pt-2">
          <div className="text-xs font-bold text-stone-500 mb-1">Review queue ({queue.length})</div>
          {queue.slice(0, 5).map((q) => (
            <div key={q.id} className="flex items-center justify-between text-xs py-1">
              <span>{q.name || 'Unknown'} · {q.confidence}% · {q.reason}</span>
              <span className="flex gap-1">{q.student_id && <button onClick={() => resolve(q.id, true)} className="text-emerald-500"><Check className="w-4 h-4" /></button>}<button onClick={() => resolve(q.id, false)} className="text-red-500"><X className="w-4 h-4" /></button></span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BiometricPanel() {
  const url = `${API_BASE.replace(/\/api$/, '')}/api/v1/attendance/biometric-webhook`;
  return (
    <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4">
      <div className="flex items-center gap-2 text-sm font-bold mb-2"><RadioTower className="w-4 h-4" /> Biometric webhook</div>
      <p className="text-xs text-stone-500 mb-2">Fingerprint / face / RFID devices POST here with their API key. Marks appear live below.</p>
      <code className="block text-[10px] bg-stone-100 dark:bg-stone-800 rounded-lg p-2 break-all">{url}</code>
      <pre className="text-[10px] text-stone-500 mt-2 overflow-auto">{`x-api-key: <device key>\n{ "student_id":"ADM...", "device_id":"BIO-001", "verification_type":"fingerprint" }`}</pre>
    </div>
  );
}

function LiveFeed({ events }: { events: any[] }) {
  const label = (e: any) => ({
    scan: `📲 QR scan → ${e.status}`, mark: `✍️ marked ${e.status}`, bulk: '✅ mark all present',
    face_match: `😀 face match ${e.student || ''} ${e.confidence}%`, face_review: `🔍 low-confidence ${e.confidence}%`,
    face_unknown: '❓ unknown face', face_spoof: '🚫 liveness failed', biometric: `🔒 biometric ${e.verification_type || ''}`,
    override: '✏️ override', closed: '🔒 session closed', qr_refresh: '🔄 QR refreshed',
  } as Record<string, string>)[e.type] || e.type;
  return (
    <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4">
      <div className="text-sm font-bold mb-2 flex items-center gap-2"><RadioTower className="w-4 h-4 text-emerald-500" /> Live feed</div>
      <div className="space-y-1 max-h-48 overflow-auto text-xs">
        {events.length === 0 ? <p className="text-stone-400">Waiting for events…</p> : events.map((e, i) => <div key={i} className="text-stone-600 dark:text-stone-300">{label(e)}</div>)}
      </div>
    </div>
  );
}
