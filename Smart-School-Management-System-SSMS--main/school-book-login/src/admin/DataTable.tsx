import { useMemo, useState, ReactNode } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Download } from 'lucide-react';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (row: T) => ReactNode;
  value?: (row: T) => string | number; // for sort/CSV when render is custom
}

function toCsv<T>(columns: Column<T>[], rows: T[]): string {
  const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const header = columns.map((c) => esc(c.label)).join(',');
  const body = rows
    .map((r) => columns.map((c) => esc(c.value ? c.value(r) : (r as any)[c.key])).join(','))
    .join('\n');
  return `${header}\n${body}`;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  rows,
  csvName = 'export',
  onExport,
  dense,
}: {
  columns: Column<T>[];
  rows: T[];
  csvName?: string;
  onExport?: (rowCount: number) => void;
  dense?: boolean;
}) {
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null);

  const filtered = useMemo(() => {
    const f = filter.trim().toLowerCase();
    let out = !f ? rows : rows.filter((r) => columns.some((c) => {
      const v = c.value ? c.value(r) : r[c.key];
      return String(v ?? '').toLowerCase().includes(f);
    }));
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      out = [...out].sort((a, b) => {
        const va = col?.value ? col.value(a) : a[sort.key];
        const vb = col?.value ? col.value(b) : b[sort.key];
        const na = Number(va), nb = Number(vb);
        const cmp = !isNaN(na) && !isNaN(nb) ? na - nb : String(va ?? '').localeCompare(String(vb ?? ''));
        return sort.dir === 'asc' ? cmp : -cmp;
      });
    }
    return out;
  }, [rows, columns, filter, sort]);

  const exportCsv = () => {
    const blob = new Blob([toCsv(columns, filtered)], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${csvName}.csv`; a.click();
    URL.revokeObjectURL(url);
    onExport?.(filtered.length);
  };

  const toggleSort = (key: string) =>
    setSort((s) => (s?.key === key ? (s.dir === 'asc' ? { key, dir: 'desc' } : null) : { key, dir: 'asc' }));

  return (
    <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden">
      <div className="flex items-center justify-between gap-3 p-3 border-b border-stone-100 dark:border-stone-800">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter…"
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-100"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-stone-400">{filtered.length} rows</span>
          <button onClick={exportCsv} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700">
            <Download className="w-4 h-4" /> CSV
          </button>
        </div>
      </div>
      <div className="overflow-auto max-h-[60vh]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-stone-50 dark:bg-stone-800 z-10">
            <tr className="text-stone-500 text-xs uppercase">
              {columns.map((c) => (
                <th key={c.key} className="text-left p-3 whitespace-nowrap">
                  {c.sortable === false ? c.label : (
                    <button onClick={() => toggleSort(c.key)} className="inline-flex items-center gap-1 hover:text-stone-700 dark:hover:text-stone-200">
                      {c.label}
                      {sort?.key === c.key ? (sort.dir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={columns.length} className="p-6 text-center text-stone-400">No rows.</td></tr>
            ) : filtered.map((r, i) => (
              <tr key={i} className="border-t border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/50">
                {columns.map((c) => (
                  <td key={c.key} className={`${dense ? 'px-3 py-1.5' : 'p-3'} text-stone-700 dark:text-stone-300 whitespace-nowrap`}>
                    {c.render ? c.render(r) : String(r[c.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
