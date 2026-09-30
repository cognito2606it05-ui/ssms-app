import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Search, X, FileText, Calendar, CheckCircle2, Clock, Download, Filter,
  CreditCard, Banknote, Receipt, AlertTriangle, Bell, Settings, ArrowRightLeft,
  Percent, Users, Eye, Send
} from 'lucide-react';
import {
  Student, FeeType, FeeGroup, FeeMaster, FeeDiscount, FeeCollectionPayment,
  OfflineBankPayment, FeeReminder
} from '../types';

type FCTab = 'collect' | 'offline' | 'search-pay' | 'search-due' | 'master' | 'groups' | 'types' | 'discounts' | 'carry-forward' | 'reminders';

const TABS: { id: FCTab; label: string; icon: any; color: string }[] = [
  { id: 'collect', label: 'Collect Fees', icon: CreditCard, color: 'emerald' },
  { id: 'offline', label: 'Bank Payments', icon: Banknote, color: 'blue' },
  { id: 'search-pay', label: 'Search Payments', icon: Search, color: 'violet' },
  { id: 'search-due', label: 'Due Fees', icon: AlertTriangle, color: 'red' },
  { id: 'master', label: 'Fees Master', icon: Settings, color: 'stone' },
  { id: 'groups', label: 'Fee Groups', icon: Users, color: 'indigo' },
  { id: 'types', label: 'Fee Types', icon: FileText, color: 'teal' },
  { id: 'discounts', label: 'Discounts', icon: Percent, color: 'amber' },
  { id: 'carry-forward', label: 'Carry Forward', icon: ArrowRightLeft, color: 'orange' },
  { id: 'reminders', label: 'Reminders', icon: Bell, color: 'rose' },
];

const CLASSES = Array.from({ length: 10 }, (_, i) => (i + 1).toString());
const SECTIONS = ['A', 'B', 'C', 'D'];
const genId = () => Math.random().toString(36).substring(2, 10);
const today = () => new Date().toISOString().split('T')[0];

// Shared UI
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

export function FeesCollectionManagement({ students }: { students: Student[] }) {
  const [activeTab, setActiveTab] = useState<FCTab>('collect');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [classFilter, setClassFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');

  // Data
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([
    { id: genId(), name: 'Tuition Fee', code: 'TF', description: 'Monthly tuition fee' },
    { id: genId(), name: 'Transport Fee', code: 'TR', description: 'School bus transport fee' },
    { id: genId(), name: 'Lab Fee', code: 'LB', description: 'Science and computer lab fee' },
    { id: genId(), name: 'Library Fee', code: 'LI', description: 'Library maintenance fee' },
    { id: genId(), name: 'Sports Fee', code: 'SP', description: 'Sports and games fee' },
    { id: genId(), name: 'Exam Fee', code: 'EX', description: 'Examination fee' },
  ]);
  const [feeGroups, setFeeGroups] = useState<FeeGroup[]>([
    { id: genId(), name: 'Academic Fees', description: 'All academic related fees', feeTypes: ['Tuition Fee', 'Lab Fee', 'Exam Fee'] },
    { id: genId(), name: 'Facility Fees', description: 'School facility usage', feeTypes: ['Transport Fee', 'Library Fee', 'Sports Fee'] },
  ]);
  const [feeMasters, setFeeMasters] = useState<FeeMaster[]>([
    { id: genId(), feeGroup: 'Academic Fees', feeType: 'Tuition Fee', dueDate: '2026-04-15', amount: 5000, class: '5', finePer: 50, fineType: 'Fixed' },
    { id: genId(), feeGroup: 'Academic Fees', feeType: 'Lab Fee', dueDate: '2026-04-15', amount: 1500, class: '5', finePer: 2, fineType: 'Percentage' },
    { id: genId(), feeGroup: 'Facility Fees', feeType: 'Transport Fee', dueDate: '2026-04-10', amount: 3000, class: '5', finePer: 100, fineType: 'Fixed' },
  ]);
  const [discounts, setDiscounts] = useState<FeeDiscount[]>([
    { id: genId(), name: 'Sibling Discount', discountType: 'Percentage', amount: 10, description: '10% off for siblings', applicableFeeGroups: ['Academic Fees'] },
    { id: genId(), name: 'Merit Scholarship', discountType: 'Fixed', amount: 2000, description: 'For toppers', applicableFeeGroups: ['Academic Fees', 'Facility Fees'] },
  ]);
  const [payments, setPayments] = useState<FeeCollectionPayment[]>([
    { id: genId(), studentId: 'S-001', studentName: 'Student 1 (Class 1)', class: '1', section: 'A', feeType: 'Tuition Fee', amount: 5000, discount: 0, fine: 0, paid: 5000, paymentMode: 'Cash', paymentDate: '2026-04-05', receiptNo: 'RCP-001', status: 'Paid' },
    { id: genId(), studentId: 'S-002', studentName: 'Student 2 (Class 1)', class: '1', section: 'A', feeType: 'Tuition Fee', amount: 5000, discount: 500, fine: 0, paid: 4500, paymentMode: 'Online', paymentDate: '2026-04-03', receiptNo: 'RCP-002', status: 'Paid' },
    { id: genId(), studentId: 'S-006', studentName: 'Student 6 (Class 2)', class: '2', section: 'A', feeType: 'Transport Fee', amount: 3000, discount: 0, fine: 50, paid: 2000, paymentMode: 'UPI', paymentDate: '2026-04-06', receiptNo: 'RCP-003', status: 'Partial' },
  ]);
  const [offlinePayments, setOfflinePayments] = useState<OfflineBankPayment[]>([
    { id: genId(), studentId: 'S-003', studentName: 'Student 3 (Class 1)', class: '1', section: 'A', amount: 5000, bankName: 'SBI', referenceNo: 'TXN-9876543', paymentDate: '2026-04-02', depositDate: '2026-04-03', status: 'Approved', note: 'NEFT transfer' },
    { id: genId(), studentId: 'S-010', studentName: 'Student 10 (Class 2)', class: '2', section: 'A', amount: 8000, bankName: 'HDFC', referenceNo: 'TXN-1234567', paymentDate: '2026-04-05', depositDate: '2026-04-06', status: 'Pending', note: 'Cheque deposit' },
  ]);
  const [reminders, setReminders] = useState<FeeReminder[]>([
    { id: genId(), class: '5', section: 'A', feeType: 'Tuition Fee', reminderDate: '2026-04-10', reminderType: 'Both', status: 'Scheduled', studentCount: 12 },
    { id: genId(), class: '3', section: 'B', feeType: 'Transport Fee', reminderDate: '2026-04-08', reminderType: 'SMS', status: 'Sent', studentCount: 8 },
  ]);

  // Forms
  const [formCollect, setFormCollect] = useState<any>({});
  const [formOffline, setFormOffline] = useState<any>({});
  const [formMaster, setFormMaster] = useState<any>({});
  const [formGroup, setFormGroup] = useState({ name: '', description: '', feeTypes: '' });
  const [formType, setFormType] = useState({ name: '', code: '', description: '' });
  const [formDiscount, setFormDiscount] = useState<any>({});
  const [formReminder, setFormReminder] = useState<any>({});
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [payStatusFilter, setPayStatusFilter] = useState('');

  const totalCollected = payments.reduce((s, p) => s + p.paid, 0);
  const totalDue = students.length * 5000 - totalCollected;

  const filteredPayments = payments.filter(p => {
    const mClass = !classFilter || p.class === classFilter;
    const mSection = !sectionFilter || p.section === sectionFilter;
    const mSearch = !search || p.studentName.toLowerCase().includes(search.toLowerCase()) || p.receiptNo.toLowerCase().includes(search.toLowerCase());
    const mStatus = !payStatusFilter || p.status === payStatusFilter;
    const mFrom = !dateFrom || p.paymentDate >= dateFrom;
    const mTo = !dateTo || p.paymentDate <= dateTo;
    return mClass && mSection && mSearch && mStatus && mFrom && mTo;
  });

  const dueStudents = students.filter(s => {
    const mClass = !classFilter || s.class === classFilter;
    const mSection = !sectionFilter || s.section === sectionFilter;
    const mSearch = !search || s.name.toLowerCase().includes(search.toLowerCase());
    return mClass && mSection && mSearch && (s.fees?.status !== 'Paid');
  });

  const currentTab = TABS.find(t => t.id === activeTab)!;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-lg border border-stone-100 dark:border-stone-800 p-2 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSearch(''); setClassFilter(''); setSectionFilter(''); }}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? `bg-${tab.color}-600 text-white shadow-lg` : 'text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800'}`}>
              <tab.icon className="w-3.5 h-3.5" />{tab.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>

          {/* COLLECT FEES */}
          {activeTab === 'collect' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Stat label="Total Collected" value={`₹${totalCollected.toLocaleString()}`} icon={CreditCard} color="emerald" />
                <Stat label="Payments" value={payments.length} icon={Receipt} color="blue" />
                <Stat label="Full Paid" value={payments.filter(p => p.status === 'Paid').length} icon={CheckCircle2} color="violet" />
                <Stat label="Partial" value={payments.filter(p => p.status === 'Partial').length} icon={Clock} color="amber" />
              </div>
              <div className="flex justify-end"><button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:opacity-90 shadow-lg"><Plus className="w-4 h-4" />Collect Fee</button></div>
              <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-lg border border-stone-100 dark:border-stone-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full"><thead className="bg-stone-50 dark:bg-stone-800/50"><tr><TH>Receipt</TH><TH>Student</TH><TH>Class</TH><TH>Fee Type</TH><TH>Amount</TH><TH>Discount</TH><TH>Paid</TH><TH>Mode</TH><TH>Date</TH><TH>Status</TH><TH></TH></tr></thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800">{payments.map(p => (
                      <tr key={p.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30">
                        <TD><span className="font-bold text-stone-800 dark:text-stone-100">{p.receiptNo}</span></TD>
                        <TD><span className="font-bold text-stone-800 dark:text-stone-100">{p.studentName}</span></TD>
                        <TD>{p.class}-{p.section}</TD><TD>{p.feeType}</TD>
                        <TD>₹{p.amount.toLocaleString()}</TD><TD>₹{p.discount}</TD><TD><span className="font-bold text-emerald-600">₹{p.paid.toLocaleString()}</span></TD>
                        <TD><span className="px-2 py-1 rounded-full text-[10px] font-bold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">{p.paymentMode}</span></TD>
                        <TD>{p.paymentDate}</TD>
                        <TD><span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${p.status === 'Paid' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700' : p.status === 'Partial' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700' : 'bg-red-100 dark:bg-red-900/30 text-red-700'}`}>{p.status}</span></TD>
                        <TD><Del onClick={() => setPayments(pr => pr.filter(x => x.id !== p.id))} /></TD>
                      </tr>))}</tbody></table>
                </div>
              </div>
              {showModal && activeTab === 'collect' && <Modal title="Collect Fee" onClose={() => setShowModal(false)}><div className="space-y-4">
                <Sel label="Student *" options={students.map(s => `${s.student_id} - ${s.name}`)} value={formCollect.student || ''} onChange={e => setFormCollect((p: any) => ({ ...p, student: e.target.value }))} />
                <div className="grid grid-cols-2 gap-4"><Sel label="Fee Type" options={feeTypes.map(f => f.name)} value={formCollect.feeType || ''} onChange={e => setFormCollect((p: any) => ({ ...p, feeType: e.target.value }))} />
                  <Inp label="Amount *" type="number" value={formCollect.amount || ''} onChange={e => setFormCollect((p: any) => ({ ...p, amount: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-4"><Inp label="Discount" type="number" value={formCollect.discount || 0} onChange={e => setFormCollect((p: any) => ({ ...p, discount: e.target.value }))} />
                  <Sel label="Payment Mode" options={['Cash', 'Online', 'Cheque', 'Bank Transfer', 'UPI']} value={formCollect.mode || ''} onChange={e => setFormCollect((p: any) => ({ ...p, mode: e.target.value }))} /></div>
                <button onClick={() => { if (!formCollect.student || !formCollect.amount) return; const parts = formCollect.student.split(' - '); const st = students.find(s => s.student_id === parts[0]); if (st) { setPayments(pr => [...pr, { id: genId(), studentId: st.student_id, studentName: st.name, class: st.class, section: st.section, feeType: formCollect.feeType || '', amount: Number(formCollect.amount), discount: Number(formCollect.discount || 0), fine: 0, paid: Number(formCollect.amount) - Number(formCollect.discount || 0), paymentMode: formCollect.mode || 'Cash', paymentDate: today(), receiptNo: `RCP-${(payments.length + 1).toString().padStart(3, '0')}`, status: 'Paid' }]); } setShowModal(false); setFormCollect({}); }} className="w-full py-3.5 bg-emerald-600 text-white rounded-xl font-bold hover:opacity-90 shadow-lg">Generate Receipt & Collect</button>
              </div></Modal>}
            </div>
          )}

          {/* OFFLINE BANK PAYMENTS */}
          {activeTab === 'offline' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Stat label="Total" value={offlinePayments.length} icon={Banknote} color="blue" />
                <Stat label="Approved" value={offlinePayments.filter(p => p.status === 'Approved').length} icon={CheckCircle2} color="emerald" />
                <Stat label="Pending" value={offlinePayments.filter(p => p.status === 'Pending').length} icon={Clock} color="amber" />
              </div>
              <div className="flex justify-end"><button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:opacity-90 shadow-lg"><Plus className="w-4 h-4" />Add Bank Payment</button></div>
              <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-lg border border-stone-100 dark:border-stone-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full"><thead className="bg-stone-50 dark:bg-stone-800/50"><tr><TH>Student</TH><TH>Class</TH><TH>Amount</TH><TH>Bank</TH><TH>Ref No</TH><TH>Pay Date</TH><TH>Deposit</TH><TH>Status</TH><TH></TH></tr></thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800">{offlinePayments.map(p => (
                      <tr key={p.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30">
                        <TD><span className="font-bold text-stone-800 dark:text-stone-100">{p.studentName}</span></TD>
                        <TD>{p.class}-{p.section}</TD><TD><span className="font-bold">₹{p.amount.toLocaleString()}</span></TD>
                        <TD>{p.bankName}</TD><TD><span className="text-xs font-mono">{p.referenceNo}</span></TD><TD>{p.paymentDate}</TD><TD>{p.depositDate}</TD>
                        <TD><select value={p.status} onChange={e => setOfflinePayments(pr => pr.map(x => x.id === p.id ? { ...x, status: e.target.value as any } : x))} className="text-xs font-bold bg-transparent border border-stone-200 dark:border-stone-700 rounded-lg px-2 py-1 text-stone-700 dark:text-stone-300">
                          {['Pending', 'Approved', 'Rejected'].map(s => <option key={s} value={s}>{s}</option>)}</select></TD>
                        <TD><Del onClick={() => setOfflinePayments(pr => pr.filter(x => x.id !== p.id))} /></TD>
                      </tr>))}</tbody></table>
                </div>
              </div>
              {showModal && activeTab === 'offline' && <Modal title="Add Offline Bank Payment" onClose={() => setShowModal(false)}><div className="space-y-4">
                <Sel label="Student *" options={students.map(s => `${s.student_id} - ${s.name}`)} value={formOffline.student || ''} onChange={e => setFormOffline((p: any) => ({ ...p, student: e.target.value }))} />
                <div className="grid grid-cols-2 gap-4"><Inp label="Amount *" type="number" value={formOffline.amount || ''} onChange={e => setFormOffline((p: any) => ({ ...p, amount: e.target.value }))} />
                  <Inp label="Bank Name" value={formOffline.bank || ''} onChange={e => setFormOffline((p: any) => ({ ...p, bank: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-4"><Inp label="Reference No *" value={formOffline.ref || ''} onChange={e => setFormOffline((p: any) => ({ ...p, ref: e.target.value }))} />
                  <Inp label="Payment Date" type="date" value={formOffline.date || ''} onChange={e => setFormOffline((p: any) => ({ ...p, date: e.target.value }))} /></div>
                <Inp label="Note" value={formOffline.note || ''} onChange={e => setFormOffline((p: any) => ({ ...p, note: e.target.value }))} />
                <button onClick={() => { if (!formOffline.student || !formOffline.amount) return; const parts = formOffline.student.split(' - '); const st = students.find(s => s.student_id === parts[0]); if (st) { setOfflinePayments(pr => [...pr, { id: genId(), studentId: st.student_id, studentName: st.name, class: st.class, section: st.section, amount: Number(formOffline.amount), bankName: formOffline.bank || '', referenceNo: formOffline.ref || '', paymentDate: formOffline.date || today(), depositDate: today(), status: 'Pending', note: formOffline.note || '' }]); } setShowModal(false); setFormOffline({}); }} className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:opacity-90 shadow-lg">Record Payment</button>
              </div></Modal>}
            </div>
          )}

          {/* SEARCH PAYMENTS */}
          {activeTab === 'search-pay' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Stat label="Total Payments" value={filteredPayments.length} icon={Receipt} color="violet" />
                <Stat label="Amount" value={`₹${filteredPayments.reduce((s, p) => s + p.paid, 0).toLocaleString()}`} icon={CreditCard} color="emerald" />
                <Stat label="Paid" value={filteredPayments.filter(p => p.status === 'Paid').length} icon={CheckCircle2} color="blue" />
                <Stat label="Partial" value={filteredPayments.filter(p => p.status === 'Partial').length} icon={Clock} color="amber" />
              </div>
              <div className="flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[200px] max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by student or receipt..." className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-sm text-stone-800 dark:text-stone-100 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="px-3 py-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-sm"><option value="">All Classes</option>{CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}</select>
                <select value={payStatusFilter} onChange={e => setPayStatusFilter(e.target.value)} className="px-3 py-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-sm"><option value="">All Status</option>{['Paid', 'Partial', 'Pending'].map(s => <option key={s} value={s}>{s}</option>)}</select>
                <Inp label="" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} placeholder="From" />
                <Inp label="" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} placeholder="To" />
              </div>
              <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-lg border border-stone-100 dark:border-stone-800 overflow-hidden">
                <div className="overflow-x-auto">
                  {filteredPayments.length === 0 ? <p className="p-8 text-center text-stone-500 text-sm">No payments found.</p> : (
                    <table className="w-full"><thead className="bg-stone-50 dark:bg-stone-800/50"><tr><TH>Receipt</TH><TH>Student</TH><TH>Class</TH><TH>Fee</TH><TH>Amount</TH><TH>Paid</TH><TH>Mode</TH><TH>Date</TH><TH>Status</TH></tr></thead>
                      <tbody className="divide-y divide-stone-100 dark:divide-stone-800">{filteredPayments.map(p => (
                        <tr key={p.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30">
                          <TD><span className="font-bold">{p.receiptNo}</span></TD><TD><span className="font-bold text-stone-800 dark:text-stone-100">{p.studentName}</span></TD>
                          <TD>{p.class}-{p.section}</TD><TD>{p.feeType}</TD><TD>₹{p.amount.toLocaleString()}</TD><TD><span className="font-bold text-emerald-600">₹{p.paid.toLocaleString()}</span></TD>
                          <TD>{p.paymentMode}</TD><TD>{p.paymentDate}</TD>
                          <TD><span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${p.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{p.status}</span></TD>
                        </tr>))}</tbody></table>)}
                </div>
              </div>
            </div>
          )}

          {/* SEARCH DUE FEES */}
          {activeTab === 'search-due' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Stat label="Students with Dues" value={dueStudents.length} icon={AlertTriangle} color="red" />
                <Stat label="Est. Due Amount" value={`₹${(dueStudents.length * 5000).toLocaleString()}`} icon={CreditCard} color="amber" />
                <Stat label="Total Students" value={students.length} icon={Users} color="blue" />
              </div>
              <div className="flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[200px] max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search student..." className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-sm text-stone-800 dark:text-stone-100 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="px-3 py-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-sm"><option value="">All Classes</option>{CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}</select>
                <select value={sectionFilter} onChange={e => setSectionFilter(e.target.value)} className="px-3 py-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-sm"><option value="">All Sections</option>{SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}</select>
                <button onClick={() => {}} className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:opacity-90 shadow-lg"><Download className="w-4 h-4" />Export</button>
              </div>
              <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-lg border border-stone-100 dark:border-stone-800 overflow-hidden">
                <div className="overflow-x-auto">
                  {dueStudents.length === 0 ? <p className="p-8 text-center text-stone-500 text-sm">No due fees found.</p> : (
                    <table className="w-full"><thead className="bg-stone-50 dark:bg-stone-800/50"><tr><TH>ID</TH><TH>Name</TH><TH>Class</TH><TH>Section</TH><TH>Email</TH><TH>Fee Status</TH><TH>Due Amount</TH></tr></thead>
                      <tbody className="divide-y divide-stone-100 dark:divide-stone-800">{dueStudents.map(s => (
                        <tr key={s.student_id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30">
                          <TD><span className="font-bold">{s.student_id}</span></TD><TD><span className="font-bold text-stone-800 dark:text-stone-100">{s.name}</span></TD>
                          <TD>{s.class}</TD><TD>{s.section}</TD><TD><span className="text-xs">{s.email}</span></TD>
                          <TD><span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">{s.fees?.status || 'Pending'}</span></TD>
                          <TD><span className="font-bold text-red-600">₹{((s.fees?.total || 5000) - (s.fees?.paid || 0)).toLocaleString()}</span></TD>
                        </tr>))}</tbody></table>)}
                </div>
              </div>
            </div>
          )}

          {/* FEES MASTER */}
          {activeTab === 'master' && (
            <div className="space-y-4">
              <div className="flex justify-end"><button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-stone-700 text-white rounded-xl font-bold text-sm hover:opacity-90 shadow-lg"><Plus className="w-4 h-4" />Add Fee Master</button></div>
              <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-lg border border-stone-100 dark:border-stone-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full"><thead className="bg-stone-50 dark:bg-stone-800/50"><tr><TH>Fee Group</TH><TH>Fee Type</TH><TH>Class</TH><TH>Amount</TH><TH>Due Date</TH><TH>Fine</TH><TH></TH></tr></thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800">{feeMasters.map(m => (
                      <tr key={m.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30">
                        <TD><span className="font-bold text-stone-800 dark:text-stone-100">{m.feeGroup}</span></TD>
                        <TD>{m.feeType}</TD><TD>Class {m.class}</TD><TD><span className="font-bold text-emerald-600">₹{m.amount.toLocaleString()}</span></TD><TD>{m.dueDate}</TD>
                        <TD><span className="text-xs">{m.fineType === 'Fixed' ? `₹${m.finePer}` : `${m.finePer}%`} late fine</span></TD>
                        <TD><Del onClick={() => setFeeMasters(p => p.filter(x => x.id !== m.id))} /></TD>
                      </tr>))}</tbody></table>
                </div>
              </div>
              {showModal && activeTab === 'master' && <Modal title="Add Fee Master" onClose={() => setShowModal(false)}><div className="space-y-4">
                <div className="grid grid-cols-2 gap-4"><Sel label="Fee Group *" options={feeGroups.map(g => g.name)} value={formMaster.group || ''} onChange={e => setFormMaster((p: any) => ({ ...p, group: e.target.value }))} />
                  <Sel label="Fee Type *" options={feeTypes.map(t => t.name)} value={formMaster.type || ''} onChange={e => setFormMaster((p: any) => ({ ...p, type: e.target.value }))} /></div>
                <div className="grid grid-cols-3 gap-4"><Sel label="Class" options={CLASSES} value={formMaster.class || ''} onChange={e => setFormMaster((p: any) => ({ ...p, class: e.target.value }))} />
                  <Inp label="Amount *" type="number" value={formMaster.amount || ''} onChange={e => setFormMaster((p: any) => ({ ...p, amount: e.target.value }))} />
                  <Inp label="Due Date" type="date" value={formMaster.dueDate || ''} onChange={e => setFormMaster((p: any) => ({ ...p, dueDate: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-4"><Inp label="Fine Amount" type="number" value={formMaster.fine || ''} onChange={e => setFormMaster((p: any) => ({ ...p, fine: e.target.value }))} />
                  <Sel label="Fine Type" options={['Fixed', 'Percentage']} value={formMaster.fineType || ''} onChange={e => setFormMaster((p: any) => ({ ...p, fineType: e.target.value }))} /></div>
                <button onClick={() => { if (!formMaster.group || !formMaster.amount) return; setFeeMasters(p => [...p, { id: genId(), feeGroup: formMaster.group, feeType: formMaster.type || '', dueDate: formMaster.dueDate || '', amount: Number(formMaster.amount), class: formMaster.class || '', finePer: Number(formMaster.fine || 0), fineType: formMaster.fineType || 'Fixed' }]); setShowModal(false); setFormMaster({}); }} className="w-full py-3.5 bg-stone-700 text-white rounded-xl font-bold hover:opacity-90 shadow-lg">Add Fee Master</button>
              </div></Modal>}
            </div>
          )}

          {/* FEE GROUPS */}
          {activeTab === 'groups' && <MasterList title="Fee Groups" items={feeGroups.map(g => ({ id: g.id, name: g.name, description: `${g.description} • ${g.feeTypes.join(', ')}` }))} onAdd={() => { if (!formGroup.name) return; setFeeGroups(p => [...p, { id: genId(), name: formGroup.name, description: formGroup.description, feeTypes: formGroup.feeTypes.split(',').map(s => s.trim()).filter(Boolean) }]); setFormGroup({ name: '', description: '', feeTypes: '' }); }} onDelete={id => setFeeGroups(p => p.filter(g => g.id !== id))} form={<><Inp label="Group Name *" value={formGroup.name} onChange={e => setFormGroup(p => ({ ...p, name: e.target.value }))} /><Inp label="Description" value={formGroup.description} onChange={e => setFormGroup(p => ({ ...p, description: e.target.value }))} /><Inp label="Fee Types (comma separated)" value={formGroup.feeTypes} onChange={e => setFormGroup(p => ({ ...p, feeTypes: e.target.value }))} /></>} color="indigo" />}

          {/* FEE TYPES */}
          {activeTab === 'types' && <MasterList title="Fee Types" items={feeTypes.map(t => ({ id: t.id, name: `${t.name} (${t.code})`, description: t.description }))} onAdd={() => { if (!formType.name) return; setFeeTypes(p => [...p, { id: genId(), ...formType }]); setFormType({ name: '', code: '', description: '' }); }} onDelete={id => setFeeTypes(p => p.filter(t => t.id !== id))} form={<><Inp label="Fee Name *" value={formType.name} onChange={e => setFormType(p => ({ ...p, name: e.target.value }))} /><Inp label="Fee Code" value={formType.code} onChange={e => setFormType(p => ({ ...p, code: e.target.value }))} /><Inp label="Description" value={formType.description} onChange={e => setFormType(p => ({ ...p, description: e.target.value }))} /></>} color="teal" />}

          {/* DISCOUNTS */}
          {activeTab === 'discounts' && (
            <div className="space-y-4">
              <div className="flex justify-end"><button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white rounded-xl font-bold text-sm hover:opacity-90 shadow-lg"><Plus className="w-4 h-4" />Add Discount</button></div>
              <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-lg border border-stone-100 dark:border-stone-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full"><thead className="bg-stone-50 dark:bg-stone-800/50"><tr><TH>Name</TH><TH>Type</TH><TH>Amount</TH><TH>Description</TH><TH>Applicable Groups</TH><TH></TH></tr></thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800">{discounts.map(d => (
                      <tr key={d.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30">
                        <TD><span className="font-bold text-stone-800 dark:text-stone-100">{d.name}</span></TD>
                        <TD><span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700">{d.discountType}</span></TD>
                        <TD><span className="font-bold">{d.discountType === 'Percentage' ? `${d.amount}%` : `₹${d.amount}`}</span></TD>
                        <TD><span className="text-xs">{d.description}</span></TD>
                        <TD>{d.applicableFeeGroups.map(g => <span key={g} className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 text-[10px] font-bold rounded-full mr-1">{g}</span>)}</TD>
                        <TD><Del onClick={() => setDiscounts(p => p.filter(x => x.id !== d.id))} /></TD>
                      </tr>))}</tbody></table>
                </div>
              </div>
              {showModal && activeTab === 'discounts' && <Modal title="Add Discount" onClose={() => setShowModal(false)}><div className="space-y-4">
                <Inp label="Discount Name *" value={formDiscount.name || ''} onChange={e => setFormDiscount((p: any) => ({ ...p, name: e.target.value }))} />
                <div className="grid grid-cols-2 gap-4"><Sel label="Type" options={['Percentage', 'Fixed']} value={formDiscount.type || ''} onChange={e => setFormDiscount((p: any) => ({ ...p, type: e.target.value }))} />
                  <Inp label="Amount *" type="number" value={formDiscount.amount || ''} onChange={e => setFormDiscount((p: any) => ({ ...p, amount: e.target.value }))} /></div>
                <Inp label="Description" value={formDiscount.desc || ''} onChange={e => setFormDiscount((p: any) => ({ ...p, desc: e.target.value }))} />
                <Inp label="Applicable Groups (comma)" value={formDiscount.groups || ''} onChange={e => setFormDiscount((p: any) => ({ ...p, groups: e.target.value }))} />
                <button onClick={() => { if (!formDiscount.name) return; setDiscounts(p => [...p, { id: genId(), name: formDiscount.name, discountType: formDiscount.type || 'Fixed', amount: Number(formDiscount.amount || 0), description: formDiscount.desc || '', applicableFeeGroups: (formDiscount.groups || '').split(',').map((s: string) => s.trim()).filter(Boolean) }]); setShowModal(false); setFormDiscount({}); }} className="w-full py-3.5 bg-amber-600 text-white rounded-xl font-bold hover:opacity-90 shadow-lg">Add Discount</button>
              </div></Modal>}
            </div>
          )}

          {/* CARRY FORWARD */}
          {activeTab === 'carry-forward' && (
            <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-lg border border-stone-100 dark:border-stone-800 p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-orange-50 dark:bg-orange-900/20 rounded-3xl flex items-center justify-center mx-auto"><ArrowRightLeft className="w-10 h-10 text-orange-600" /></div>
              <h3 className="text-2xl font-bold text-stone-800 dark:text-stone-100">Fees Carry Forward</h3>
              <p className="text-sm text-stone-500 max-w-md mx-auto">Transfer pending fee balances from the previous academic session to the current session. This operation will identify students with outstanding dues and carry them forward.</p>
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                <Sel label="From Session" options={['2024-25', '2025-26']} value="" onChange={() => {}} />
                <Sel label="To Session" options={['2025-26', '2026-27']} value="" onChange={() => {}} />
              </div>
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                <Sel label="Class" options={CLASSES} value="" onChange={() => {}} />
                <Sel label="Section" options={SECTIONS} value="" onChange={() => {}} />
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 max-w-md mx-auto">
                <p className="text-xs text-amber-700 dark:text-amber-400 font-bold"><AlertTriangle className="w-4 h-4 inline mr-1" />This action will affect student fee records. Please review carefully before proceeding.</p>
              </div>
              <button className="px-8 py-3.5 bg-orange-600 text-white rounded-xl font-bold hover:opacity-90 shadow-lg">Search & Carry Forward Dues</button>
            </div>
          )}

          {/* REMINDERS */}
          {activeTab === 'reminders' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Stat label="Total Reminders" value={reminders.length} icon={Bell} color="rose" />
                <Stat label="Sent" value={reminders.filter(r => r.status === 'Sent').length} icon={Send} color="emerald" />
                <Stat label="Scheduled" value={reminders.filter(r => r.status === 'Scheduled').length} icon={Clock} color="blue" />
              </div>
              <div className="flex justify-end"><button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white rounded-xl font-bold text-sm hover:opacity-90 shadow-lg"><Plus className="w-4 h-4" />Create Reminder</button></div>
              <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-lg border border-stone-100 dark:border-stone-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full"><thead className="bg-stone-50 dark:bg-stone-800/50"><tr><TH>Class</TH><TH>Section</TH><TH>Fee Type</TH><TH>Date</TH><TH>Type</TH><TH>Students</TH><TH>Status</TH><TH></TH></tr></thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800">{reminders.map(r => (
                      <tr key={r.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30">
                        <TD>Class {r.class}</TD><TD>{r.section}</TD><TD>{r.feeType}</TD><TD>{r.reminderDate}</TD>
                        <TD><span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-900/30 text-rose-700">{r.reminderType}</span></TD>
                        <TD><span className="font-bold">{r.studentCount}</span></TD>
                        <TD><span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${r.status === 'Sent' ? 'bg-emerald-100 text-emerald-700' : r.status === 'Scheduled' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>{r.status}</span></TD>
                        <TD><Del onClick={() => setReminders(p => p.filter(x => x.id !== r.id))} /></TD>
                      </tr>))}</tbody></table>
                </div>
              </div>
              {showModal && activeTab === 'reminders' && <Modal title="Create Fee Reminder" onClose={() => setShowModal(false)}><div className="space-y-4">
                <div className="grid grid-cols-2 gap-4"><Sel label="Class" options={CLASSES} value={formReminder.class || ''} onChange={e => setFormReminder((p: any) => ({ ...p, class: e.target.value }))} />
                  <Sel label="Section" options={SECTIONS} value={formReminder.section || ''} onChange={e => setFormReminder((p: any) => ({ ...p, section: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-4"><Sel label="Fee Type" options={feeTypes.map(f => f.name)} value={formReminder.feeType || ''} onChange={e => setFormReminder((p: any) => ({ ...p, feeType: e.target.value }))} />
                  <Sel label="Reminder Type" options={['SMS', 'Email', 'Both']} value={formReminder.type || ''} onChange={e => setFormReminder((p: any) => ({ ...p, type: e.target.value }))} /></div>
                <Inp label="Reminder Date" type="date" value={formReminder.date || ''} onChange={e => setFormReminder((p: any) => ({ ...p, date: e.target.value }))} />
                <button onClick={() => { if (!formReminder.class) return; setReminders(p => [...p, { id: genId(), class: formReminder.class, section: formReminder.section || 'A', feeType: formReminder.feeType || '', reminderDate: formReminder.date || today(), reminderType: formReminder.type || 'Both', status: 'Scheduled', studentCount: Math.floor(Math.random() * 20) + 5 }]); setShowModal(false); setFormReminder({}); }} className="w-full py-3.5 bg-rose-600 text-white rounded-xl font-bold hover:opacity-90 shadow-lg">Schedule Reminder</button>
              </div></Modal>}
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Reusable Master List
function MasterList({ title, items, onAdd, onDelete, form, color }: { title: string; items: { id: string; name: string; description: string }[]; onAdd: () => void; onDelete: (id: string) => void; form: React.ReactNode; color: string }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-lg border border-stone-100 dark:border-stone-800 p-6 md:col-span-1">
        <h3 className="text-sm font-bold text-stone-800 dark:text-stone-100 mb-4">Add New</h3>
        <div className="space-y-3">{form}
          <button onClick={onAdd} className={`w-full py-3 bg-${color}-600 text-white rounded-xl font-bold text-sm hover:opacity-90 shadow-lg`}><Plus className="w-4 h-4 inline mr-2" />Add</button>
        </div>
      </div>
      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-lg border border-stone-100 dark:border-stone-800 p-6 md:col-span-2">
        <h3 className="text-sm font-bold text-stone-800 dark:text-stone-100 mb-4">{title} ({items.length})</h3>
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="flex items-center justify-between px-4 py-3 bg-stone-50 dark:bg-stone-800 rounded-xl">
              <div><p className="font-bold text-sm text-stone-800 dark:text-stone-100">{item.name}</p><p className="text-xs text-stone-500">{item.description}</p></div>
              <button onClick={() => onDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 hover:text-red-600"><X className="w-3.5 h-3.5" /></button>
            </div>))}
          {items.length === 0 && <p className="text-center text-stone-500 text-sm py-6">No items. Add one using the form.</p>}
        </div>
      </div>
    </div>
  );
}
