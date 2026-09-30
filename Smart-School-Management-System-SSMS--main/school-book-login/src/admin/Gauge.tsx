// Semicircular gauge for CPU / memory / disk. Colour by threshold.
export function Gauge({ value, label, sub }: { value: number; label: string; sub?: string }) {
  const v = Math.max(0, Math.min(100, value));
  const color = v >= 90 ? '#ef4444' : v >= 70 ? '#f59e0b' : '#22c55e';
  const R = 54, C = Math.PI * R; // semicircle circumference
  const dash = (v / 100) * C;

  return (
    <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 flex flex-col items-center">
      <svg width="140" height="84" viewBox="0 0 140 84">
        <path d="M16 76 A54 54 0 0 1 124 76" fill="none" stroke="currentColor" className="text-stone-200 dark:text-stone-700" strokeWidth="12" strokeLinecap="round" />
        <path
          d="M16 76 A54 54 0 0 1 124 76"
          fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={`${dash} ${C}`}
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
        <text x="70" y="66" textAnchor="middle" className="fill-stone-900 dark:fill-stone-50" fontSize="22" fontWeight="700">{v}%</text>
      </svg>
      <div className="text-sm font-bold text-stone-700 dark:text-stone-200 mt-1">{label}</div>
      {sub && <div className="text-[11px] text-stone-400">{sub}</div>}
    </div>
  );
}

export function StatusBadge({ status }: { status: 'green' | 'amber' | 'red' }) {
  const map = {
    green: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
  };
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${map[status]} ${status === 'red' ? 'animate-pulse' : ''}`} />;
}
