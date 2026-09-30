import React from 'react';
import { ChevronLeft, ChevronRight, Search, RotateCcw } from 'lucide-react';

export const Card = ({ children, className = '', ...props }: { children: React.ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={`rounded-3xl border border-stone-100 bg-white p-6 shadow-lg dark:border-stone-850 dark:bg-stone-900 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const KPICard = ({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  trend, 
  trendType = 'up', 
  className = '' 
}: { 
  title: string; 
  value: string | number; 
  icon?: any; 
  description?: string; 
  trend?: string; 
  trendType?: 'up' | 'down'; 
  className?: string;
}) => {
  return (
    <Card className={`relative overflow-hidden ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-wider">{title}</p>
          <h3 className="mt-1 text-2xl font-black text-stone-800 dark:text-white tracking-tight">{value}</h3>
        </div>
        {Icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-50 dark:bg-stone-800 text-stone-500 dark:text-stone-400">
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      {(description || trend) && (
        <div className="mt-4 flex items-center gap-2 text-xs">
          {trend && (
            <span className={`font-bold ${trendType === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
              {trend}
            </span>
          )}
          {description && (
            <span className="text-stone-500 dark:text-stone-500">
              {description}
            </span>
          )}
        </div>
      )}
    </Card>
  );
};

export interface TableColumn<T> {
  header: string;
  accessor?: keyof T;
  render?: (row: T) => React.ReactNode;
}

export const Table = <T extends Record<string, any>>({
  columns,
  data,
  total,
  page,
  limit,
  pages,
  onPageChange,
  searchVal,
  onSearchChange,
  filterOptions,
  activeFilter,
  onFilterChange,
  loading,
  title
}: {
  columns: TableColumn<T>[];
  data: T[];
  total?: number;
  page?: number;
  limit?: number;
  pages?: number;
  onPageChange?: (page: number) => void;
  searchVal?: string;
  onSearchChange?: (val: string) => void;
  filterOptions?: { label: string; value: string }[];
  activeFilter?: string;
  onFilterChange?: (val: string) => void;
  loading?: boolean;
  title?: string;
}) => {
  return (
    <div className="rounded-3xl border border-stone-100 bg-white shadow-xl dark:border-stone-850 dark:bg-stone-900 overflow-hidden">
      {/* Table Header Controls */}
      <div className="flex flex-col gap-4 border-b border-stone-50 p-6 dark:border-stone-800 sm:flex-row sm:items-center sm:justify-between">
        {title && (
          <h3 className="text-base font-bold text-stone-800 dark:text-white">{title}</h3>
        )}
        <div className="flex flex-wrap items-center gap-3 ml-auto w-full sm:w-auto">
          {/* Search box */}
          {onSearchChange !== undefined && (
            <div className="relative flex-1 sm:w-64 sm:flex-none">
              <span className="absolute inset-y-0 left-3 flex items-center text-stone-500">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={searchVal || ''}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search..."
                className="w-full rounded-xl border border-stone-200 bg-stone-50 py-1.5 pl-9 pr-4 text-xs text-stone-800 placeholder-stone-455 outline-none focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:border-stone-750 dark:bg-stone-950 dark:text-stone-100"
              />
            </div>
          )}

          {/* Filter dropdown */}
          {filterOptions && onFilterChange && (
            <select
              value={activeFilter || ''}
              onChange={(e) => onFilterChange(e.target.value)}
              className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs text-stone-700 outline-none focus:ring-2 focus:ring-blue-500 dark:border-stone-750 dark:bg-stone-950 dark:text-stone-300"
            >
              {filterOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Main Table Content */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-stone-50 text-[10px] font-bold text-stone-500 uppercase tracking-wider dark:bg-stone-950">
              {columns.map((col, idx) => (
                <th key={idx} className="px-6 py-3.5">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50 dark:divide-stone-800">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  <div className="flex justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                  </div>
                  <span className="mt-2 block text-xs text-stone-500">Loading data...</span>
                </td>
              </tr>
            ) : data && data.length > 0 ? (
              data.map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/10 transition-colors">
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className="px-6 py-4 text-xs text-stone-600 dark:text-stone-300">
                      {col.render ? col.render(row) : col.accessor ? row[col.accessor] : null}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-stone-455">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <RotateCcw className="h-6 w-6 stroke-[1.5]" />
                    <span className="text-xs">No records found</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {onPageChange && pages && pages > 1 && page && (
        <div className="flex items-center justify-between border-t border-stone-100 p-4 dark:border-stone-800 text-xs">
          <p className="text-stone-500">
            Page <span className="font-bold text-stone-700 dark:text-stone-200">{page}</span> of{' '}
            <span className="font-bold text-stone-700 dark:text-stone-200">{pages}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-stone-200 hover:bg-stone-50 disabled:opacity-40 disabled:hover:bg-transparent dark:border-stone-750 dark:hover:bg-stone-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= pages}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-stone-200 hover:bg-stone-50 disabled:opacity-40 disabled:hover:bg-transparent dark:border-stone-750 dark:hover:bg-stone-800"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const SectionHeader = ({ 
  title, 
  subtitle, 
  image, 
  theme = 'primary' 
}: { 
  title: string; 
  subtitle: string; 
  image?: string; 
  theme?: 'primary' | 'accent' | 'canteen';
}) => {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-stone-100 bg-white shadow-xl dark:border-stone-850 dark:bg-stone-900 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl flex flex-col md:flex-row items-center justify-between">
      {/* Text Content */}
      <div className="p-6 md:p-8 space-y-2 md:w-2/3 z-20">
        <span className={`inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${theme === 'primary' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400' : theme === 'accent' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'}`}>
          {theme === 'primary' ? 'Cognito System' : theme === 'accent' ? 'Library Portal' : 'Canteen Portal'}
        </span>
        <h1 className="text-xl md:text-2xl font-black text-stone-850 dark:text-white tracking-tight leading-none group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
          {title}
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-500 max-w-lg font-medium">
          {subtitle}
        </p>
      </div>

      {/* Decorative Image */}
      {image && (
        <div className="h-32 md:h-40 md:w-1/3 w-full overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-white dark:from-stone-900 via-transparent to-transparent z-10 hidden md:block" />
          <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-stone-900 via-transparent to-transparent z-10 md:hidden" />
          <img 
            src={image} 
            alt={title} 
            className="h-full w-full object-cover opacity-75 dark:opacity-60 mix-blend-normal group-hover:scale-110 group-hover:rotate-1 transition-transform duration-700 ease-out" 
          />
        </div>
      )}
    </div>
  );
};
