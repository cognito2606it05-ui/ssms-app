import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Save, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../rbac/auth';
import { wApi } from './api';
import { CardField } from './ui';

const W = 340, H = 214;
const ALL_FIELDS: { field: string; label: string; w?: number; h?: number }[] = [
  { field: 'logo', label: 'Logo', w: 56, h: 56 }, { field: 'photo', label: 'Photo', w: 84, h: 100 },
  { field: 'name', label: 'Name' }, { field: 'class', label: 'Class' }, { field: 'roll', label: 'Roll No' },
  { field: 'qr', label: 'QR Code', w: 74, h: 74 }, { field: 'nfc', label: 'NFC Chip', w: 44, h: 32 },
  { field: 'emergency', label: 'Emergency Contact' },
];

export default function Designer() {
  const { token } = useAuth();
  const [templates, setTemplates] = useState<any[]>([]);
  const [name, setName] = useState('My Template');
  const [kind, setKind] = useState('student');
  const [layout, setLayout] = useState<CardField[]>([]);
  const drag = useRef<{ i: number; dx: number; dy: number } | null>(null);
  const canvas = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const t = await wApi<any[]>('/card-templates', {}, token);
    setTemplates(t);
    if (t[0]) setLayout(t[0].layout);
  }, [token]);
  useEffect(() => { load(); }, [load]);

  const onMove = useCallback((e: MouseEvent) => {
    if (!drag.current || !canvas.current) return;
    const rect = canvas.current.getBoundingClientRect();
    const { i, dx, dy } = drag.current;
    setLayout((prev) => prev.map((f, idx) => idx === i ? {
      ...f,
      x: Math.max(0, Math.min(W - (f.w || 60), e.clientX - rect.left - dx)),
      y: Math.max(0, Math.min(H - (f.h || 20), e.clientY - rect.top - dy)),
    } : f));
  }, []);
  useEffect(() => {
    const up = () => { drag.current = null; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', up); };
  }, [onMove]);

  const startDrag = (e: React.MouseEvent, i: number) => {
    const rect = canvas.current!.getBoundingClientRect();
    drag.current = { i, dx: e.clientX - rect.left - layout[i].x, dy: e.clientY - rect.top - layout[i].y };
  };
  const addField = (def: any) => { if (layout.find((l) => l.field === def.field)) return; setLayout([...layout, { ...def, x: 20, y: 20 }]); };
  const removeField = (i: number) => setLayout(layout.filter((_, idx) => idx !== i));
  const save = async () => { await wApi('/card-templates', { method: 'POST', body: { name, kind, layout } }, token); toast.success('Template saved'); load(); };

  const present = new Set(layout.map((l) => l.field));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} className="px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800" />
        <select value={kind} onChange={(e) => setKind(e.target.value)} className="px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800">{['student', 'staff', 'visitor'].map((k) => <option key={k}>{k}</option>)}</select>
        <button onClick={save} className="px-4 py-2 rounded-lg font-bold text-white bg-blue-600 inline-flex items-center gap-2"><Save className="w-4 h-4" /> Save template</button>
        <select onChange={(e) => { const t = templates.find((x) => x.id === Number(e.target.value)); if (t) { setLayout(t.layout); setName(t.name); } }} className="px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm">
          <option>Load template…</option>{templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      <div className="grid lg:grid-cols-[auto_240px] gap-6">
        <div>
          <p className="text-xs text-stone-400 mb-2">Drag fields to position them. CR80 card (85.6×54mm).</p>
          <div ref={canvas} className="relative rounded-2xl shadow-xl select-none" style={{ width: W, height: H, background: 'linear-gradient(135deg,#1e3a8a,#0f172a)' }}>
            {layout.map((l, i) => (
              <div key={l.field} onMouseDown={(e) => startDrag(e, i)}
                className="absolute rounded border border-dashed border-white/50 bg-white/10 text-white text-[10px] flex items-center justify-center cursor-move hover:bg-white/20"
                style={{ left: l.x, top: l.y, width: l.w || 64, height: l.h || 18 }}>
                {l.label || l.field}
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3">
          <div className="text-xs font-bold uppercase text-stone-400 mb-2">Fields</div>
          {ALL_FIELDS.map((def) => {
            const i = layout.findIndex((l) => l.field === def.field);
            return (
              <div key={def.field} className="flex items-center justify-between py-1.5 text-sm">
                <span>{def.label}</span>
                {present.has(def.field)
                  ? <button onClick={() => removeField(i)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                  : <button onClick={() => addField(def)} className="text-emerald-500"><Plus className="w-4 h-4" /></button>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
