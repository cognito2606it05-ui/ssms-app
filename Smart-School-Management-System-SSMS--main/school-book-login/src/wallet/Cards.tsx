import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowLeft, RefreshCw, Smartphone, Printer, AlertTriangle } from 'lucide-react';
import { useAuth } from '../rbac/auth';
import { DataTable } from '../admin/DataTable';
import { wApi, money } from './api';
import { CardPreview, CardStatus, CardField } from './ui';

const STATUSES = ['active', 'blocked', 'lost', 'expired', 'pending'];

export default function Cards() {
  const { token, can } = useAuth();
  const [cards, setCards] = useState<any[]>([]);
  const [expiring, setExpiring] = useState<any[]>([]);
  const [layout, setLayout] = useState<CardField[]>([]);
  const [open, setOpen] = useState<number | null>(null);

  const load = useCallback(async () => {
    setCards(await wApi('/cards', {}, token));
    setExpiring(await wApi('/cards/expiring', {}, token));
    const tpls = await wApi<any[]>('/card-templates', {}, token);
    setLayout(tpls[0]?.layout || []);
  }, [token]);
  useEffect(() => { load(); }, [load]);

  if (open != null) return <CardDetail studentId={open} layout={layout} onBack={() => { setOpen(null); load(); }} />;

  return (
    <div className="space-y-4">
      {expiring.length > 0 && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-950/20 p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <div className="text-sm"><b>{expiring.length} card(s) expiring within 30 days</b> — {expiring.slice(0, 4).map((e) => e.name).join(', ')}{expiring.length > 4 ? '…' : ''}. Renew from each card.</div>
        </div>
      )}
      <DataTable csvName="cards" rows={cards} columns={[
        { key: 'name', label: 'Student', value: (r) => r.name, render: (r) => <button onClick={() => setOpen(r.student_id)} className="font-bold text-blue-600 dark:text-blue-400">{r.name}</button> },
        { key: 'class', label: 'Class', render: (r) => `${r.class || '-'}${r.section || ''}` },
        { key: 'card_no', label: 'Card No' },
        { key: 'status', label: 'Status', render: (r) => <CardStatus status={r.status} /> },
        { key: 'wallet_balance', label: 'Wallet', value: (r) => Number(r.wallet_balance || 0), render: (r) => money(r.wallet_balance) },
        { key: 'expires_at', label: 'Expires', render: (r) => r.expires_at ? new Date(r.expires_at).toLocaleDateString() : '—' },
      ]} />
    </div>
  );
}

function CardDetail({ studentId, layout, onBack }: { studentId: number; layout: CardField[]; onBack: () => void }) {
  const { token, can } = useAuth();
  const [w, setW] = useState<any>(null);
  const [pass, setPass] = useState<any>(null);
  const load = useCallback(async () => setW(await wApi(`/wallet/${studentId}`, {}, token)), [studentId, token]);
  useEffect(() => { load(); }, [load]);

  const setStatus = async (status: string) => { await wApi(`/cards/${studentId}/status`, { method: 'POST', body: { status } }, token); toast.success(`Card ${status}`); load(); };
  const renew = async () => { const r = await wApi<any>(`/cards/${studentId}/renew`, { method: 'POST' }, token); toast.success(`Renewed to ${r.expires_at}`); load(); };
  const showPass = async () => setPass(await wApi(`/cards/${studentId}/pkpass`, {}, token));
  const print = () => {
    const w2 = window.open('', '_blank'); if (!w2 || !w) return;
    w2.document.write(`<html><head><style>@page{size:85.6mm 54mm;margin:0}body{margin:0}</style></head><body>
      <div id="c"></div><script>document.title='card'<\/script></body></html>`);
    // simplest: print the visible card via the app's print
    w2.close(); window.print();
  };

  if (!w) return <p className="text-stone-400">Loading…</p>;
  const s = w.student;
  return (
    <div className="space-y-5">
      <button onClick={onBack} className="text-sm text-stone-500 inline-flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> All cards</button>
      <div className="grid lg:grid-cols-[auto_1fr] gap-6 items-start">
        <div className="print-card"><CardPreview student={s} layout={layout} balance={w.balance} cardNo={w.card?.card_no} /></div>
        <div className="space-y-4">
          <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4">
            <div className="flex items-center gap-2 mb-3"><h3 className="font-bold">{s.name}</h3><CardStatus status={w.card?.status} /></div>
            <div className="text-sm text-stone-500 mb-3">{w.card?.card_no} · expires {w.card?.expires_at || '—'} · wallet {money(w.balance)}</div>
            {can('fees', 'write') && (
              <>
                <div className="text-[11px] font-bold uppercase text-stone-400 mb-1">Set status</div>
                <div className="flex flex-wrap gap-2 mb-3">{STATUSES.map((st) => <button key={st} onClick={() => setStatus(st)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${w.card?.status === st ? 'border-blue-500 text-blue-600' : 'border-stone-200 dark:border-stone-700'}`}>{st}</button>)}</div>
                <div className="flex gap-2">
                  <button onClick={renew} className="px-3 py-2 rounded-lg text-sm font-bold border border-stone-300 dark:border-stone-700 inline-flex items-center gap-1"><RefreshCw className="w-4 h-4" /> Renew (+2y)</button>
                  <button onClick={showPass} className="px-3 py-2 rounded-lg text-sm font-bold text-white bg-stone-800 dark:bg-stone-700 inline-flex items-center gap-1"><Smartphone className="w-4 h-4" /> Digital pass</button>
                  <button onClick={() => window.print()} className="px-3 py-2 rounded-lg text-sm font-bold border border-stone-300 dark:border-stone-700 inline-flex items-center gap-1"><Printer className="w-4 h-4" /> Print</button>
                </div>
              </>
            )}
          </div>
          {pass && (
            <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4">
              <div className="text-sm font-bold mb-1">Apple/Google Wallet pass</div>
              <p className="text-[11px] text-stone-400 mb-2">{pass.note}</p>
              <pre className="text-[10px] bg-stone-100 dark:bg-stone-800 rounded-lg p-2 overflow-auto max-h-48">{JSON.stringify(pass.passJson, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
