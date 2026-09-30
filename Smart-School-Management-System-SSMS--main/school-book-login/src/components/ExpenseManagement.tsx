import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Search, X, FileText, Calendar, CheckCircle2, Download, Filter,
  Wallet, TrendingDown, Layers, Eye
} from 'lucide-react';
import { ExpenseHead, ExpenseEntry } from '../types';

type ExpenseTab = 'add-expense' | 'search-expense' | 'expense-head';

const TABS: { id: ExpenseTab; label: string; icon: any; color: string }[] = [
  { id: 'add-expense', label: 'Add Expense', icon: Plus, color: 'rose' },
  { id: 'search-expense', label: 'Search Expense', icon: Search, color: 'violet' },
  { id: 'expense-head', label: 'Expense Head', icon: Layers, color: 'indigo' },
];

const genId = () => Math.random().toString(36).substring(2, 10);
const today = () => new Date().toISOString().split('T')[0];

// Shared UI Components
const Modal = ({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-stone-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-stone-200 dark:border-stone-700" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between p-6 border-b border-stone-100 dark:border-stone-800 sticky top-0 bg-white dark:bg-stone-900 z-10 rounded-t-3xl">
        <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100">{title}</h3>
        <button onClick={onClose} className="p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500"><X className="w-5 h-5" /></button>
      </div>
      <div className="p-6">{children}</div>
    </motion.div>
  </div>
);
const Inp = ({ label, ...p }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div><label className="block text-xs font-bold text-stone-500 dark:text-stone-400 mb-1.5 uppercase tracking-wider">{label}</label>
    <input {...p} className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" /></div>
);
const Sel = ({ label, options, ...p }: { label: string; options: string[] } & React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <div><label className="block text-xs font-bold text-stone-500 dark:text-stone-400 mb-1.5 uppercase tracking-wider">{label}</label>
    <select {...p} className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all">
      <option value="">Select...</option>{options.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
);
const Txt = ({ label, ...p }: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <div><label className="block text-xs font-bold text-stone-500 dark:text-stone-400 mb-1.5 uppercase tracking-wider">{label}</label>
    <textarea {...p} className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none" rows={3} /></div>
);
const Stat = ({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: any; color: string }) => (
  <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl shadow-lg border border-stone-100 dark:border-stone-800">
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl bg-${color}-50 dark:bg-${color}-900/20 flex items-center justify-center`}><Icon className={`w-5 h-5 text-${color}-600 dark:text-${color}-400`} /></div>
      <div><p className="text-xs font-bold text-stone-500 uppercase tracking-wider">{label}</p><p className={`text-2xl font-bold text-${color}-600 dark:text-${color}-400`}>{value}</p></div>
    </div></div>
);
const TH = ({ children }: { children?: React.ReactNode }) => <th className="px-4 py-3 text-left text-[10px] font-bold text-stone-500 uppercase tracking-wider">{children}</th>;
const TD = ({ children }: { children?: React.ReactNode }) => <td className="px-4 py-3.5 text-sm text-stone-700 dark:text-stone-300">{children}</td>;
const Del = ({ onClick }: { onClick: () => void }) => <button onClick={onClick} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 hover:text-red-600"><X className="w-3.5 h-3.5" /></button>;

export function ExpenseManagement() {
  const [activeTab, setActiveTab] = useState<ExpenseTab>('add-expense');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Expense Heads
  const [expenseHeads, setExpenseHeads] = useState<ExpenseHead[]>([
    { id: genId(), name: 'Salary', description: 'Staff and teacher salary payments' },
    { id: genId(), name: 'Maintenance', description: 'Building and infrastructure maintenance' },
    { id: genId(), name: 'Supplies', description: 'Office and classroom supplies' },
    { id: genId(), name: 'Utilities', description: 'Electricity, water, and internet bills' },
    { id: genId(), name: 'Transport', description: 'Vehicle fuel and maintenance costs' },
    { id: genId(), name: 'Events', description: 'School events and functions expenses' },
  ]);

  // Expense Entries
  const [expenseEntries, setExpenseEntries] = useState<ExpenseEntry[]>([
    { id: genId(), expenseHead: 'Salary', name: 'March Staff Salary', invoiceNumber: 'EXP-001', amount: 850000, date: '2026-03-31', description: 'Monthly salary disbursement for all staff' },
    { id: genId(), expenseHead: 'Maintenance', name: 'Plumbing Repair', invoiceNumber: 'EXP-002', amount: 15000, date: '2026-04-02', description: 'Washroom plumbing repair in Block B' },
    { id: genId(), expenseHead: 'Supplies', name: 'Stationery Purchase', invoiceNumber: 'EXP-003', amount: 8500, date: '2026-04-03', description: 'Chalk, markers, registers for Q2' },
    { id: genId(), expenseHead: 'Utilities', name: 'Electricity Bill - March', invoiceNumber: 'EXP-004', amount: 42000, date: '2026-04-01', description: 'March electricity bill for entire campus' },
    { id: genId(), expenseHead: 'Transport', name: 'Diesel Purchase', invoiceNumber: 'EXP-005', amount: 35000, date: '2026-04-04', description: 'Diesel for school buses - April batch' },
    { id: genId(), expenseHead: 'Events', name: 'Annual Day Setup', invoiceNumber: 'EXP-006', amount: 65000, date: '2026-04-06', description: 'Stage decoration and sound system rental' },
  ]);

  // Forms
  const [formExpense, setFormExpense] = useState<any>({});
  const [formHead, setFormHead] = useState({ name: '', description: '' });

  // Search Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [headFilter, setHeadFilter] = useState('');

  const totalExpense = expenseEntries.reduce((s, e) => s + e.amount, 0);

  // Filtered expenses for search tab
  const filteredExpenses = expenseEntries.filter(e => {
    const mHead = !headFilter || e.expenseHead === headFilter;
    const mSearch = !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.invoiceNumber.toLowerCase().includes(search.toLowerCase()) || e.description.toLowerCase().includes(search.toLowerCase());
    const mFrom = !dateFrom || e.date >= dateFrom;
    const mTo = !dateTo || e.date <= dateTo;
    return mHead && mSearch && mFrom && mTo;
  });

  return (
    <div className="space-y-6">
      {/* Tab Bar */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-lg border border-stone-100 dark:border-stone-800 p-2 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSearch(''); setHeadFilter(''); setDateFrom(''); setDateTo(''); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? `bg-${tab.color}-600 text-white shadow-lg` : 'text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800'}`}>
              <tab.icon className="w-3.5 h-3.5" />{tab.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>

          {/* ADD EXPENSE */}
          {activeTab === 'add-expense' && (
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Stat label="Total Expenses" value={`₹${totalExpense.toLocaleString()}`} icon={Wallet} color="rose" />
                <Stat label="Entries" value={expenseEntries.length} icon={FileText} color="blue" />
                <Stat label="Expense Heads" value={expenseHeads.length} icon={Layers} color="indigo" />
                <Stat label="This Month" value={`₹${expenseEntries.filter(e => e.date.startsWith('2026-04')).reduce((s, e) => s + e.amount, 0).toLocaleString()}`} icon={TrendingDown} color="amber" />
              </div>

              {/* Add Button */}
              <div className="flex justify-end">
                <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white rounded-xl font-bold text-sm hover:opacity-90 shadow-lg">
                  <Plus className="w-4 h-4" />Add Expense
                </button>
              </div>

              {/* Expense Table */}
              <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-lg border border-stone-100 dark:border-stone-800 overflow-hidden">
                <div className="overflow-x-auto">
                  {expenseEntries.length === 0 ? <p className="p-8 text-center text-stone-500 text-sm">No expense entries yet. Click "Add Expense" to get started.</p> : (
                    <table className="w-full"><thead className="bg-stone-50 dark:bg-stone-800/50"><tr><TH>Invoice</TH><TH>Expense Head</TH><TH>Name</TH><TH>Amount</TH><TH>Date</TH><TH>Description</TH><TH></TH></tr></thead>
                      <tbody className="divide-y divide-stone-100 dark:divide-stone-800">{expenseEntries.map(e => (
                        <tr key={e.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30">
                          <TD><span className="font-bold text-stone-800 dark:text-stone-100">{e.invoiceNumber}</span></TD>
                          <TD><span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400">{e.expenseHead}</span></TD>
                          <TD><span className="font-bold text-stone-800 dark:text-stone-100">{e.name}</span></TD>
                          <TD><span className="font-bold text-rose-600">₹{e.amount.toLocaleString()}</span></TD>
                          <TD>{e.date}</TD>
                          <TD><span className="text-xs text-stone-500 dark:text-stone-400 line-clamp-1">{e.description}</span></TD>
                          <TD><Del onClick={() => setExpenseEntries(pr => pr.filter(x => x.id !== e.id))} /></TD>
                        </tr>
                      ))}</tbody></table>
                  )}
                </div>
              </div>

              {/* Add Expense Modal */}
              {showModal && activeTab === 'add-expense' && <Modal title="Add Expense Entry" onClose={() => setShowModal(false)}>
                <div className="space-y-4">
                  <Sel label="Expense Head *" options={expenseHeads.map(h => h.name)} value={formExpense.expenseHead || ''} onChange={e => setFormExpense((p: any) => ({ ...p, expenseHead: e.target.value }))} />
                  <div className="grid grid-cols-2 gap-4">
                    <Inp label="Name *" value={formExpense.name || ''} onChange={e => setFormExpense((p: any) => ({ ...p, name: e.target.value }))} placeholder="e.g. Office Supplies" />
                    <Inp label="Invoice Number *" value={formExpense.invoiceNumber || ''} onChange={e => setFormExpense((p: any) => ({ ...p, invoiceNumber: e.target.value }))} placeholder="e.g. EXP-007" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Inp label="Amount *" type="number" value={formExpense.amount || ''} onChange={e => setFormExpense((p: any) => ({ ...p, amount: e.target.value }))} placeholder="Enter amount" />
                    <Inp label="Date *" type="date" value={formExpense.date || today()} onChange={e => setFormExpense((p: any) => ({ ...p, date: e.target.value }))} />
                  </div>
                  <Txt label="Description" value={formExpense.description || ''} onChange={e => setFormExpense((p: any) => ({ ...p, description: e.target.value }))} placeholder="Brief description of the expense..." />
                  <button onClick={() => {
                    if (!formExpense.expenseHead || !formExpense.name || !formExpense.amount || !formExpense.invoiceNumber) return;
                    setExpenseEntries(pr => [...pr, {
                      id: genId(),
                      expenseHead: formExpense.expenseHead,
                      name: formExpense.name,
                      invoiceNumber: formExpense.invoiceNumber,
                      amount: Number(formExpense.amount),
                      date: formExpense.date || today(),
                      description: formExpense.description || ''
                    }]);
                    setShowModal(false);
                    setFormExpense({});
                  }} className="w-full py-3.5 bg-rose-600 text-white rounded-xl font-bold hover:opacity-90 shadow-lg">
                    Save Expense Entry
                  </button>
                </div>
              </Modal>}
            </div>
          )}

          {/* SEARCH EXPENSE */}
          {activeTab === 'search-expense' && (
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Stat label="Results Found" value={filteredExpenses.length} icon={Search} color="violet" />
                <Stat label="Filtered Total" value={`₹${filteredExpenses.reduce((s, e) => s + e.amount, 0).toLocaleString()}`} icon={Wallet} color="rose" />
                <Stat label="All Entries" value={expenseEntries.length} icon={FileText} color="blue" />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-3 items-end">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, invoice, or description..." className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-sm text-stone-800 dark:text-stone-100 focus:ring-2 focus:ring-violet-500 outline-none" />
                </div>
                <select value={headFilter} onChange={e => setHeadFilter(e.target.value)} className="px-3 py-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-sm text-stone-700 dark:text-stone-300">
                  <option value="">All Expense Heads</option>{expenseHeads.map(h => <option key={h.id} value={h.name}>{h.name}</option>)}
                </select>
                <div>
                  <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 mb-1.5 uppercase tracking-wider">From</label>
                  <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-3 py-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-sm text-stone-700 dark:text-stone-300" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 mb-1.5 uppercase tracking-wider">To</label>
                  <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-3 py-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-sm text-stone-700 dark:text-stone-300" />
                </div>
                <button onClick={() => { setSearch(''); setHeadFilter(''); setDateFrom(''); setDateTo(''); }} className="flex items-center gap-2 px-4 py-2.5 bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl font-bold text-sm hover:opacity-90">
                  <X className="w-4 h-4" />Clear
                </button>
              </div>

              {/* Results Table */}
              <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-lg border border-stone-100 dark:border-stone-800 overflow-hidden">
                <div className="overflow-x-auto">
                  {filteredExpenses.length === 0 ? <p className="p-8 text-center text-stone-500 text-sm">No expense entries match your filters.</p> : (
                    <table className="w-full"><thead className="bg-stone-50 dark:bg-stone-800/50"><tr><TH>Invoice</TH><TH>Expense Head</TH><TH>Name</TH><TH>Amount</TH><TH>Date</TH><TH>Description</TH></tr></thead>
                      <tbody className="divide-y divide-stone-100 dark:divide-stone-800">{filteredExpenses.map(e => (
                        <tr key={e.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30">
                          <TD><span className="font-bold text-stone-800 dark:text-stone-100">{e.invoiceNumber}</span></TD>
                          <TD><span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400">{e.expenseHead}</span></TD>
                          <TD><span className="font-bold text-stone-800 dark:text-stone-100">{e.name}</span></TD>
                          <TD><span className="font-bold text-rose-600">₹{e.amount.toLocaleString()}</span></TD>
                          <TD>{e.date}</TD>
                          <TD><span className="text-xs text-stone-500 dark:text-stone-400 line-clamp-1">{e.description}</span></TD>
                        </tr>
                      ))}</tbody></table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* EXPENSE HEAD */}
          {activeTab === 'expense-head' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Add Form */}
              <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-lg border border-stone-100 dark:border-stone-800 p-6 md:col-span-1">
                <h3 className="text-sm font-bold text-stone-800 dark:text-stone-100 mb-4">Add Expense Head</h3>
                <div className="space-y-3">
                  <Inp label="Head Name *" value={formHead.name} onChange={e => setFormHead(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Insurance" />
                  <Inp label="Description" value={formHead.description} onChange={e => setFormHead(p => ({ ...p, description: e.target.value }))} placeholder="Brief description..." />
                  <button onClick={() => {
                    if (!formHead.name) return;
                    setExpenseHeads(p => [...p, { id: genId(), name: formHead.name, description: formHead.description }]);
                    setFormHead({ name: '', description: '' });
                  }} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:opacity-90 shadow-lg">
                    <Plus className="w-4 h-4 inline mr-2" />Add Head
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-lg border border-stone-100 dark:border-stone-800 p-6 md:col-span-2">
                <h3 className="text-sm font-bold text-stone-800 dark:text-stone-100 mb-4">Expense Heads ({expenseHeads.length})</h3>
                <div className="space-y-2">
                  {expenseHeads.map(item => (
                    <div key={item.id} className="flex items-center justify-between px-4 py-3 bg-stone-50 dark:bg-stone-800 rounded-xl">
                      <div>
                        <p className="font-bold text-sm text-stone-800 dark:text-stone-100">{item.name}</p>
                        <p className="text-xs text-stone-500">{item.description}</p>
                      </div>
                      <button onClick={() => setExpenseHeads(p => p.filter(h => h.id !== item.id))} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 hover:text-red-600"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                  {expenseHeads.length === 0 && <p className="text-center text-stone-500 text-sm py-6">No expense heads. Add one using the form.</p>}
                </div>
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}
