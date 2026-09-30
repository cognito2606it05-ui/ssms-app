import { QRCodeSVG } from 'qrcode.react';
import { GraduationCap, Wifi } from 'lucide-react';
import { fileUrl } from './api';

export interface CardField { field: string; label?: string; x: number; y: number; w?: number; h?: number }

const STATUS_STYLE: Record<string, string> = {
  active: 'bg-emerald-500', blocked: 'bg-red-500', lost: 'bg-orange-500', expired: 'bg-stone-500', pending: 'bg-amber-500',
};
export function CardStatus({ status }: { status: string }) {
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase text-white ${STATUS_STYLE[status] || 'bg-stone-400'}`}>{status}</span>;
}

// A CR80-proportioned (85.6×54mm ≈ 1.586) card rendered from a layout array.
export function CardPreview({ student, layout, balance, cardNo, accent = '#1e3a8a', scale = 1 }: {
  student: any; layout: CardField[]; balance?: number | null; cardNo?: string; accent?: string; scale?: number;
}) {
  const W = 340, H = 214;
  const f = (name: string) => layout.find((l) => l.field === name);
  const at = (l?: CardField) => (l ? { left: l.x, top: l.y, width: l.w, height: l.h } : { display: 'none' });
  return (
    <div className="relative rounded-2xl overflow-hidden shadow-xl text-white shrink-0"
      style={{ width: W * scale, height: H * scale, background: `linear-gradient(135deg, ${accent}, #0f172a)` }}>
      <div className="absolute inset-0 origin-top-left" style={{ transform: `scale(${scale})`, width: W, height: H }}>
        {/* logo */}
        <div className="absolute flex items-center justify-center rounded-xl bg-white/15" style={at(f('logo'))}>
          <GraduationCap className="w-7 h-7" />
        </div>
        {/* photo */}
        <div className="absolute rounded-lg overflow-hidden bg-white/20 flex items-center justify-center" style={at(f('photo'))}>
          {student?.photo_url ? <img src={fileUrl(student.photo_url)} className="w-full h-full object-cover" /> : <span className="text-2xl font-bold">{student?.name?.[0]}</span>}
        </div>
        {/* text fields */}
        {f('name') && <div className="absolute font-bold text-lg leading-tight" style={at(f('name'))}>{student?.name}</div>}
        {f('class') && <div className="absolute text-xs opacity-80" style={at(f('class'))}>Class {student?.class}{student?.section}</div>}
        {f('roll') && <div className="absolute text-xs opacity-80" style={at(f('roll'))}>Roll {student?.roll_number || '—'}</div>}
        {f('emergency') && <div className="absolute text-[10px] opacity-70" style={at(f('emergency'))}>SOS {student?.emergency1_phone || '—'}</div>}
        {/* nfc */}
        <div className="absolute rounded-md bg-gradient-to-br from-amber-300 to-yellow-500 flex items-center justify-center" style={at(f('nfc'))}>
          <Wifi className="w-4 h-4 text-amber-900 rotate-90" />
        </div>
        {/* qr */}
        {f('qr') && <div className="absolute bg-white rounded p-1" style={at(f('qr'))}><QRCodeSVG value={cardNo || student?.name || 'SSMS'} size={(f('qr')?.w || 74) - 8} /></div>}
        {balance != null && <div className="absolute bottom-2 right-3 text-right"><div className="text-[9px] opacity-70">WALLET</div><div className="font-bold">₹{balance}</div></div>}
        {cardNo && <div className="absolute bottom-2 left-3 font-mono text-[10px] opacity-80">{cardNo}</div>}
      </div>
    </div>
  );
}
