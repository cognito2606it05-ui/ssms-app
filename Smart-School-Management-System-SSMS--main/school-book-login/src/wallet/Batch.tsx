import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Printer, CheckSquare, Square } from 'lucide-react';
import { useAuth } from '../rbac/auth';
import { wApi } from './api';

const PXW = 340; // layout coordinate space -> CR80 85.6mm
const toMm = (px: number) => (px / PXW * 85.6).toFixed(2) + 'mm';

export default function Batch() {
  const { token } = useAuth();
  const [cards, setCards] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [tpl, setTpl] = useState<number | null>(null);
  const [sel, setSel] = useState<Set<number>>(new Set());

  const load = useCallback(async () => {
    setCards(await wApi('/cards', {}, token));
    const t = await wApi<any[]>('/card-templates', {}, token);
    setTemplates(t); setTpl(t[0]?.id ?? null);
  }, [token]);
  useEffect(() => { load(); }, [load]);

  const toggle = (id: number) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const print = async () => {
    if (!sel.size) return toast.error('Select at least one student');
    const data = await wApi<any>('/cards/batch/print', { method: 'POST', body: { ids: [...sel], templateId: tpl } }, token);
    const layout: any[] = data.layout;
    const f = (l: any[], k: string) => l.find((x) => x.field === k);
    const cardHtml = (c: any) => {
      const fld = (k: string, val: string, cls = '') => { const l = f(layout, k); return l ? `<div class="${cls}" style="position:absolute;left:${toMm(l.x)};top:${toMm(l.y)};font-size:9pt">${val}</div>` : ''; };
      const box = (k: string, inner: string, bg: string) => { const l = f(layout, k); return l ? `<div style="position:absolute;left:${toMm(l.x)};top:${toMm(l.y)};width:${toMm(l.w || 60)};height:${toMm(l.h || 18)};background:${bg};border-radius:2mm;display:flex;align-items:center;justify-content:center;font-size:7pt;color:#fff">${inner}</div>` : '';
      };
      return `<div class="card">
        ${box('logo', '🎓', 'rgba(255,255,255,.15)')}
        ${box('photo', (c.name||'?')[0], 'rgba(255,255,255,.2)')}
        ${fld('name', `<b>${c.name}</b>`)}
        ${fld('class', 'Class ' + (c.class||'') + (c.section||''))}
        ${fld('roll', 'Roll ' + (c.roll_number||'—'))}
        ${fld('emergency', 'SOS ' + (c.emergency1_phone||'—'))}
        ${box('nfc', 'NFC', 'linear-gradient(135deg,#fcd34d,#eab308)')}
        ${box('qr', c.card_no, '#fff')}
        <div style="position:absolute;bottom:2mm;left:3mm;font-size:6pt;font-family:monospace;opacity:.8">${c.card_no}</div>
      </div>`;
    };
    const w = window.open('', '_blank'); if (!w) return;
    w.document.write(`<html><head><title>ID Cards (CR80 · 300DPI)</title><style>
      @page{size:85.6mm 54mm;margin:0}
      body{margin:0;font-family:sans-serif;color:#fff}
      .card{position:relative;width:85.6mm;height:54mm;background:linear-gradient(135deg,#1e3a8a,#0f172a);page-break-after:always;overflow:hidden}
    </style></head><body>${data.cards.map(cardHtml).join('')}</body></html>`);
    w.document.close(); setTimeout(() => w.print(), 300);
    toast.success(`Print sheet for ${data.count} cards (CR80, 300 DPI)`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <select value={tpl ?? ''} onChange={(e) => setTpl(Number(e.target.value))} className="px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800">{templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
        <button onClick={() => setSel(new Set(cards.map((c) => c.student_id)))} className="px-3 py-2 rounded-lg text-sm font-bold border border-stone-300 dark:border-stone-700">Select all</button>
        <button onClick={() => setSel(new Set())} className="px-3 py-2 rounded-lg text-sm font-bold border border-stone-300 dark:border-stone-700">Clear</button>
        <span className="text-sm text-stone-400">{sel.size} selected</span>
        <button onClick={print} className="ml-auto px-4 py-2 rounded-lg font-bold text-white bg-blue-600 inline-flex items-center gap-2"><Printer className="w-4 h-4" /> Generate print-ready PDF</button>
      </div>
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 max-h-[60vh] overflow-auto divide-y divide-stone-100 dark:divide-stone-800">
        {cards.map((c) => (
          <button key={c.student_id} onClick={() => toggle(c.student_id)} className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-stone-50 dark:hover:bg-stone-800/50">
            {sel.has(c.student_id) ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-stone-300" />}
            <span className="text-sm font-medium flex-1">{c.name}</span>
            <span className="text-xs text-stone-400">{c.class}{c.section} · {c.card_no}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
