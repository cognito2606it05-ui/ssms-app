import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, X, Users, FileText, Calendar, CheckCircle2, XCircle, Clock, Trash2, Download, Upload, Filter, GraduationCap, UserCog, AlertTriangle, Eye, ChevronRight, ChevronDown, Award, Settings } from 'lucide-react';
import { Student, StudentCategory, StudentHouse, DisableReason, OnlineAdmissionApplication, DisabledStudentRecord, MultiClassAssignment } from '../types';

type SITab = 'details' | 'admission' | 'online' | 'disabled' | 'multi-class' | 'bulk-delete' | 'categories' | 'houses' | 'disable-reason';

const TABS: { id: SITab; label: string; icon: any; color: string }[] = [
  { id: 'details', label: 'Student Details', icon: Users, color: 'blue' },
  { id: 'admission', label: 'Admission', icon: GraduationCap, color: 'emerald' },
  { id: 'online', label: 'Online Admission', icon: Upload, color: 'violet' },
  { id: 'disabled', label: 'Disabled Students', icon: XCircle, color: 'amber' },
  { id: 'multi-class', label: 'Multi Class', icon: Award, color: 'indigo' },
  { id: 'bulk-delete', label: 'Bulk Delete', icon: Trash2, color: 'red' },
  { id: 'categories', label: 'Categories', icon: Filter, color: 'teal' },
  { id: 'houses', label: 'Houses', icon: Award, color: 'orange' },
  { id: 'disable-reason', label: 'Disable Reason', icon: AlertTriangle, color: 'stone' },
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
const Txa = ({ label, ...p }: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <div><label className="block text-xs font-bold text-stone-500 dark:text-stone-400 mb-1.5 uppercase tracking-wider">{label}</label>
    <textarea {...p} rows={3} className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" /></div>
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

export function StudentInformationManagement({ students }: { students: Student[] }) {
  const [activeTab, setActiveTab] = useState<SITab>('details');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [classFilter, setClassFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');

  // Data States
  const [categories, setCategories] = useState<StudentCategory[]>([
    { id: genId(), name: 'General', description: 'General category' },
    { id: genId(), name: 'OBC', description: 'Other Backward Classes' },
    { id: genId(), name: 'SC', description: 'Scheduled Castes' },
    { id: genId(), name: 'ST', description: 'Scheduled Tribes' },
    { id: genId(), name: 'EWS', description: 'Economically Weaker Section' },
  ]);
  const [houses, setHouses] = useState<StudentHouse[]>([
    { id: genId(), name: 'Red House', description: 'Fire & Passion', color: 'red' },
    { id: genId(), name: 'Blue House', description: 'Ocean & Wisdom', color: 'blue' },
    { id: genId(), name: 'Green House', description: 'Nature & Growth', color: 'green' },
    { id: genId(), name: 'Yellow House', description: 'Sun & Energy', color: 'yellow' },
  ]);
  const [disableReasons, setDisableReasons] = useState<DisableReason[]>([
    { id: genId(), reason: 'Transfer Certificate (TC)', description: 'Student transferred to another school' },
    { id: genId(), reason: 'Left School', description: 'Student left without formal transfer' },
    { id: genId(), reason: 'Expelled', description: 'Student expelled due to disciplinary action' },
    { id: genId(), reason: 'Passed Out', description: 'Student completed final year' },
  ]);
  const [onlineApps, setOnlineApps] = useState<OnlineAdmissionApplication[]>([
    { id: genId(), studentName: 'Rahul Verma', fatherName: 'Suresh Verma', motherName: 'Sunita Verma', dob: '2015-05-10', gender: 'Male', email: 'suresh@email.com', phone: '9876543250', address: '45 MG Road', city: 'Hyderabad', state: 'Telangana', pincode: '500001', classApplied: '5', previousSchool: 'Delhi Public School', previousClass: '4', percentage: '88', category: 'General', status: 'Submitted', appliedDate: '2026-04-01', remarks: '' },
    { id: genId(), studentName: 'Ananya Reddy', fatherName: 'Kiran Reddy', motherName: 'Lakshmi Reddy', dob: '2013-08-22', gender: 'Female', email: 'kiran@email.com', phone: '9876543251', address: '12 Jubilee Hills', city: 'Hyderabad', state: 'Telangana', pincode: '500033', classApplied: '7', previousSchool: 'Kendriya Vidyalaya', previousClass: '6', percentage: '92', category: 'OBC', status: 'Under Review', appliedDate: '2026-03-28', remarks: 'Excellent academic record' },
  ]);
  const [disabledStudents, setDisabledStudents] = useState<DisabledStudentRecord[]>([
    { id: genId(), studentId: 'S-001', studentName: 'Amit Prasad', class: '8', section: 'A', disableReason: 'Transfer Certificate (TC)', disableDate: '2026-03-15', isActive: false },
  ]);
  const [multiClass, setMultiClass] = useState<MultiClassAssignment[]>([
    { id: genId(), studentId: 'S-010', studentName: 'Kavya Sharma', primaryClass: '9', primarySection: 'A', additionalClasses: [{ class: '9', section: 'B' }] },
  ]);

  // Form states
  const [formCat, setFormCat] = useState({ name: '', description: '' });
  const [formHouse, setFormHouse] = useState({ name: '', description: '', color: 'blue' });
  const [formReason, setFormReason] = useState({ reason: '', description: '' });
  const [admStep, setAdmStep] = useState(0);
  const [admForm, setAdmForm] = useState<Partial<OnlineAdmissionApplication>>({});
  const [selectedForDelete, setSelectedForDelete] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [formMulti, setFormMulti] = useState({ studentId: '', class: '', section: '' });
  const [formDisable, setFormDisable] = useState({ studentId: '', reason: '' });

  const filtered = students.filter(s => {
    const matchClass = !classFilter || s.class === classFilter;
    const matchSection = !sectionFilter || s.section === sectionFilter;
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.student_id.toLowerCase().includes(search.toLowerCase());
    return matchClass && matchSection && matchSearch;
  });

  const exportCSV = () => {
    const headers = ['ID', 'Name', 'Class', 'Section', 'Email', 'Phone', 'Father Name'];
    const rows = filtered.map(s => [s.student_id, s.name, s.class, s.section, s.email, s.phone || '', s.fatherName || '']);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'students.csv'; a.click();
  };

  const currentTab = TABS.find(t => t.id === activeTab)!;

  return (
    <div className="space-y-6">
      {/* Tab Bar */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-lg border border-stone-100 dark:border-stone-800 p-2 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSearch(''); }}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? `bg-${tab.color}-600 text-white shadow-lg` : 'text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800'}`}>
              <tab.icon className="w-3.5 h-3.5" />{tab.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>

          {/* ===== STUDENT DETAILS ===== */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Stat label="Total Students" value={students.length} icon={Users} color="blue" />
                <Stat label="Classes" value={CLASSES.length} icon={GraduationCap} color="emerald" />
                <Stat label="Filtered" value={filtered.length} icon={Filter} color="violet" />
                <Stat label="Active" value={students.length} icon={CheckCircle2} color="amber" />
              </div>
              <div className="flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or admission no..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-sm text-stone-800 dark:text-stone-100 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="px-3 py-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-sm text-stone-700 dark:text-stone-300">
                  <option value="">All Classes</option>{CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}</select>
                <select value={sectionFilter} onChange={e => setSectionFilter(e.target.value)} className="px-3 py-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-sm text-stone-700 dark:text-stone-300">
                  <option value="">All Sections</option>{SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}</select>
                <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:opacity-90 shadow-lg"><Download className="w-4 h-4" />Export CSV</button>
              </div>
              <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-lg border border-stone-100 dark:border-stone-800 overflow-hidden">
                <div className="overflow-x-auto">
                  {filtered.length === 0 ? <p className="p-8 text-center text-stone-500 text-sm">No students found.</p> : (
                    <table className="w-full"><thead className="bg-stone-50 dark:bg-stone-800/50"><tr><TH>Adm. No</TH><TH>Name</TH><TH>Class</TH><TH>Section</TH><TH>Email</TH><TH>Phone</TH><TH>Father</TH><TH>Fee Status</TH></tr></thead>
                      <tbody className="divide-y divide-stone-100 dark:divide-stone-800">{filtered.map(s => (
                        <tr key={s.student_id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
                          <TD><span className="font-bold text-stone-800 dark:text-stone-100">{s.student_id}</span></TD>
                          <TD><span className="font-bold text-stone-800 dark:text-stone-100">{s.name}</span></TD>
                          <TD>{s.class}</TD><TD>{s.section}</TD><TD><span className="text-xs">{s.email}</span></TD><TD>{s.phone}</TD><TD>{s.fatherName}</TD>
                          <TD><span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${s.fees?.status === 'Paid' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700'}`}>{s.fees?.status || 'N/A'}</span></TD>
                        </tr>))}</tbody></table>)}
                </div>
              </div>
            </div>
          )}

          {/* ===== STUDENT ADMISSION ===== */}
          {activeTab === 'admission' && (
            <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-lg border border-stone-100 dark:border-stone-800 p-6">
              <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100 mb-2">New Student Admission</h3>
              <p className="text-xs text-stone-500 mb-6">Complete all steps to register a new student</p>
              <div className="flex gap-2 mb-8">{['Personal Info', 'Guardian Details', 'Previous School', 'Documents'].map((s, i) => (
                <div key={i} className="flex-1"><div className={`h-2 rounded-full mb-2 ${i <= admStep ? 'bg-blue-600' : 'bg-stone-200 dark:bg-stone-700'}`} />
                  <p className={`text-[10px] font-bold uppercase ${i <= admStep ? 'text-blue-600' : 'text-stone-500'}`}>{s}</p></div>
              ))}</div>
              <div className="space-y-4">
                {admStep === 0 && <><div className="grid grid-cols-2 gap-4"><Inp label="Student Name *" value={admForm.studentName || ''} onChange={e => setAdmForm(p => ({ ...p, studentName: e.target.value }))} /><Inp label="Date of Birth" type="date" value={admForm.dob || ''} onChange={e => setAdmForm(p => ({ ...p, dob: e.target.value }))} /></div>
                  <div className="grid grid-cols-2 gap-4"><Sel label="Gender" options={['Male', 'Female', 'Other']} value={admForm.gender || ''} onChange={e => setAdmForm(p => ({ ...p, gender: e.target.value }))} /><Sel label="Class" options={CLASSES} value={admForm.classApplied || ''} onChange={e => setAdmForm(p => ({ ...p, classApplied: e.target.value }))} /></div>
                  <div className="grid grid-cols-2 gap-4"><Inp label="Email" type="email" value={admForm.email || ''} onChange={e => setAdmForm(p => ({ ...p, email: e.target.value }))} /><Inp label="Phone" value={admForm.phone || ''} onChange={e => setAdmForm(p => ({ ...p, phone: e.target.value }))} /></div>
                  <Sel label="Category" options={categories.map(c => c.name)} value={admForm.category || ''} onChange={e => setAdmForm(p => ({ ...p, category: e.target.value }))} /></>}
                {admStep === 1 && <><div className="grid grid-cols-2 gap-4"><Inp label="Father's Name *" value={admForm.fatherName || ''} onChange={e => setAdmForm(p => ({ ...p, fatherName: e.target.value }))} /><Inp label="Mother's Name" value={admForm.motherName || ''} onChange={e => setAdmForm(p => ({ ...p, motherName: e.target.value }))} /></div>
                  <Txa label="Address" value={admForm.address || ''} onChange={e => setAdmForm(p => ({ ...p, address: e.target.value }))} />
                  <div className="grid grid-cols-3 gap-4"><Inp label="City" value={admForm.city || ''} onChange={e => setAdmForm(p => ({ ...p, city: e.target.value }))} /><Inp label="State" value={admForm.state || ''} onChange={e => setAdmForm(p => ({ ...p, state: e.target.value }))} /><Inp label="Pincode" value={admForm.pincode || ''} onChange={e => setAdmForm(p => ({ ...p, pincode: e.target.value }))} /></div></>}
                {admStep === 2 && <><Inp label="Previous School" value={admForm.previousSchool || ''} onChange={e => setAdmForm(p => ({ ...p, previousSchool: e.target.value }))} />
                  <div className="grid grid-cols-2 gap-4"><Inp label="Previous Class" value={admForm.previousClass || ''} onChange={e => setAdmForm(p => ({ ...p, previousClass: e.target.value }))} /><Inp label="Percentage (%)" value={admForm.percentage || ''} onChange={e => setAdmForm(p => ({ ...p, percentage: e.target.value }))} /></div></>}
                {admStep === 3 && <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto"><Upload className="w-8 h-8 text-blue-600" /></div>
                  <p className="text-stone-600 dark:text-stone-300 font-bold">Upload Documents</p>
                  <p className="text-xs text-stone-500">Upload birth certificate, previous school TC, photographs, etc.</p>
                  <div className="border-2 border-dashed border-stone-300 dark:border-stone-600 rounded-2xl p-8"><p className="text-sm text-stone-500">Drag & drop files or click to browse</p></div></div>}
                <div className="flex justify-between pt-4">
                  <button onClick={() => setAdmStep(Math.max(0, admStep - 1))} disabled={admStep === 0} className="px-6 py-2.5 border border-stone-200 dark:border-stone-700 rounded-xl font-bold text-sm text-stone-600 dark:text-stone-300 disabled:opacity-30">Back</button>
                  {admStep < 3 ? <button onClick={() => setAdmStep(admStep + 1)} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:opacity-90 shadow-lg">Next Step</button>
                    : <button onClick={() => { setAdmStep(0); setAdmForm({}); }} className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:opacity-90 shadow-lg">Submit Admission</button>}
                </div>
              </div>
            </div>
          )}

          {/* ===== ONLINE ADMISSION ===== */}
          {activeTab === 'online' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Stat label="Total" value={onlineApps.length} icon={FileText} color="violet" />
                <Stat label="Submitted" value={onlineApps.filter(a => a.status === 'Submitted').length} icon={Clock} color="blue" />
                <Stat label="Under Review" value={onlineApps.filter(a => a.status === 'Under Review').length} icon={Eye} color="amber" />
                <Stat label="Approved" value={onlineApps.filter(a => a.status === 'Approved').length} icon={CheckCircle2} color="emerald" />
              </div>
              <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-lg border border-stone-100 dark:border-stone-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full"><thead className="bg-stone-50 dark:bg-stone-800/50"><tr><TH>Name</TH><TH>Father</TH><TH>Class</TH><TH>Prev School</TH><TH>%</TH><TH>Applied</TH><TH>Status</TH><TH></TH></tr></thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800">{onlineApps.map(a => (
                      <tr key={a.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30">
                        <TD><span className="font-bold text-stone-800 dark:text-stone-100">{a.studentName}</span><br/><span className="text-xs text-stone-500">{a.email}</span></TD>
                        <TD>{a.fatherName}</TD><TD>{a.classApplied}</TD><TD><span className="text-xs">{a.previousSchool}</span></TD><TD>{a.percentage}%</TD><TD>{a.appliedDate}</TD>
                        <TD><select value={a.status} onChange={e => setOnlineApps(p => p.map(x => x.id === a.id ? { ...x, status: e.target.value as any } : x))} className="text-xs font-bold bg-transparent border border-stone-200 dark:border-stone-700 rounded-lg px-2 py-1 text-stone-700 dark:text-stone-300">
                          {['Submitted', 'Under Review', 'Approved', 'Rejected'].map(s => <option key={s} value={s}>{s}</option>)}</select></TD>
                        <TD><button onClick={() => setOnlineApps(p => p.filter(x => x.id !== a.id))} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 hover:text-red-600"><X className="w-3.5 h-3.5" /></button></TD>
                      </tr>))}</tbody></table>
                </div>
              </div>
            </div>
          )}

          {/* ===== DISABLED STUDENTS ===== */}
          {activeTab === 'disabled' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Stat label="Disabled" value={disabledStudents.filter(d => !d.isActive).length} icon={XCircle} color="red" />
                <Stat label="Re-enabled" value={disabledStudents.filter(d => d.isActive).length} icon={CheckCircle2} color="emerald" />
              </div>
              <div className="flex justify-end"><button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white rounded-xl font-bold text-sm hover:opacity-90 shadow-lg"><Plus className="w-4 h-4" />Disable Student</button></div>
              <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-lg border border-stone-100 dark:border-stone-800 overflow-hidden">
                <div className="overflow-x-auto">
                  {disabledStudents.length === 0 ? <p className="p-8 text-center text-stone-500 text-sm">No disabled students.</p> : (
                    <table className="w-full"><thead className="bg-stone-50 dark:bg-stone-800/50"><tr><TH>Student ID</TH><TH>Name</TH><TH>Class</TH><TH>Reason</TH><TH>Date</TH><TH>Action</TH></tr></thead>
                      <tbody className="divide-y divide-stone-100 dark:divide-stone-800">{disabledStudents.map(d => (
                        <tr key={d.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30">
                          <TD><span className="font-bold">{d.studentId}</span></TD><TD>{d.studentName}</TD><TD>{d.class}-{d.section}</TD><TD><span className="text-xs">{d.disableReason}</span></TD><TD>{d.disableDate}</TD>
                          <TD><button onClick={() => setDisabledStudents(p => p.map(x => x.id === d.id ? { ...x, isActive: !x.isActive } : x))} className={`px-3 py-1 text-[10px] font-bold rounded-full ${d.isActive ? 'bg-emerald-600 text-white' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>{d.isActive ? 'Enabled' : 'Disabled'}</button></TD>
                        </tr>))}</tbody></table>)}
                </div>
              </div>
              {showModal && activeTab === 'disabled' && <Modal title="Disable Student" onClose={() => setShowModal(false)}><div className="space-y-4">
                <Sel label="Student" options={students.map(s => `${s.student_id} - ${s.name}`)} value={formDisable.studentId} onChange={e => setFormDisable(p => ({ ...p, studentId: e.target.value }))} />
                <Sel label="Reason" options={disableReasons.map(r => r.reason)} value={formDisable.reason} onChange={e => setFormDisable(p => ({ ...p, reason: e.target.value }))} />
                <button onClick={() => { if (!formDisable.studentId) return; const parts = formDisable.studentId.split(' - '); const st = students.find(s => s.student_id === parts[0]); if (st) { setDisabledStudents(p => [...p, { id: genId(), studentId: st.student_id, studentName: st.name, class: st.class, section: st.section, disableReason: formDisable.reason, disableDate: today(), isActive: false }]); } setShowModal(false); setFormDisable({ studentId: '', reason: '' }); }} className="w-full py-3.5 bg-amber-600 text-white rounded-xl font-bold hover:opacity-90 shadow-lg">Disable Student</button>
              </div></Modal>}
            </div>
          )}

          {/* ===== MULTI CLASS ===== */}
          {activeTab === 'multi-class' && (
            <div className="space-y-4">
              <Stat label="Multi-Class Assignments" value={multiClass.length} icon={Award} color="indigo" />
              <div className="flex justify-end"><button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:opacity-90 shadow-lg"><Plus className="w-4 h-4" />Add Assignment</button></div>
              <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-lg border border-stone-100 dark:border-stone-800 overflow-hidden">
                <div className="overflow-x-auto">
                  {multiClass.length === 0 ? <p className="p-8 text-center text-stone-500 text-sm">No multi-class assignments.</p> : (
                    <table className="w-full"><thead className="bg-stone-50 dark:bg-stone-800/50"><tr><TH>Student</TH><TH>Primary</TH><TH>Additional Classes</TH><TH></TH></tr></thead>
                      <tbody className="divide-y divide-stone-100 dark:divide-stone-800">{multiClass.map(m => (
                        <tr key={m.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30">
                          <TD><span className="font-bold text-stone-800 dark:text-stone-100">{m.studentName}</span><br/><span className="text-xs text-stone-500">{m.studentId}</span></TD>
                          <TD>{m.primaryClass}-{m.primarySection}</TD>
                          <TD>{m.additionalClasses.map((c, i) => <span key={i} className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-[10px] font-bold rounded-full mr-1">{c.class}-{c.section}</span>)}</TD>
                          <TD><button onClick={() => setMultiClass(p => p.filter(x => x.id !== m.id))} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400"><X className="w-3.5 h-3.5" /></button></TD>
                        </tr>))}</tbody></table>)}
                </div>
              </div>
              {showModal && activeTab === 'multi-class' && <Modal title="Add Multi-Class Assignment" onClose={() => setShowModal(false)}><div className="space-y-4">
                <Sel label="Student" options={students.map(s => `${s.student_id} - ${s.name}`)} value={formMulti.studentId} onChange={e => setFormMulti(p => ({ ...p, studentId: e.target.value }))} />
                <div className="grid grid-cols-2 gap-4"><Sel label="Additional Class" options={CLASSES} value={formMulti.class} onChange={e => setFormMulti(p => ({ ...p, class: e.target.value }))} /><Sel label="Section" options={SECTIONS} value={formMulti.section} onChange={e => setFormMulti(p => ({ ...p, section: e.target.value }))} /></div>
                <button onClick={() => { if (!formMulti.studentId || !formMulti.class) return; const parts = formMulti.studentId.split(' - '); const st = students.find(s => s.student_id === parts[0]); if (st) { setMultiClass(p => [...p, { id: genId(), studentId: st.student_id, studentName: st.name, primaryClass: st.class, primarySection: st.section, additionalClasses: [{ class: formMulti.class, section: formMulti.section }] }]); } setShowModal(false); setFormMulti({ studentId: '', class: '', section: '' }); }} className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold hover:opacity-90 shadow-lg">Add Assignment</button>
              </div></Modal>}
            </div>
          )}

          {/* ===== BULK DELETE ===== */}
          {activeTab === 'bulk-delete' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3 items-center">
                <select value={classFilter} onChange={e => { setClassFilter(e.target.value); setSelectedForDelete(new Set()); }} className="px-3 py-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-sm text-stone-700 dark:text-stone-300">
                  <option value="">All Classes</option>{CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}</select>
                <select value={sectionFilter} onChange={e => { setSectionFilter(e.target.value); setSelectedForDelete(new Set()); }} className="px-3 py-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-sm text-stone-700 dark:text-stone-300">
                  <option value="">All Sections</option>{SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}</select>
                <span className="text-sm text-stone-500 font-bold">{selectedForDelete.size} selected</span>
                {selectedForDelete.size > 0 && <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:opacity-90 shadow-lg"><Trash2 className="w-4 h-4" />Delete Selected</button>}
              </div>
              <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-lg border border-stone-100 dark:border-stone-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full"><thead className="bg-stone-50 dark:bg-stone-800/50"><tr>
                    <th className="px-4 py-3 w-10"><input type="checkbox" checked={filtered.length > 0 && selectedForDelete.size === filtered.length} onChange={e => { if (e.target.checked) setSelectedForDelete(new Set(filtered.map(s => s.student_id))); else setSelectedForDelete(new Set()); }} className="rounded" /></th>
                    <TH>ID</TH><TH>Name</TH><TH>Class</TH><TH>Section</TH><TH>Email</TH></tr></thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800">{filtered.map(s => (
                      <tr key={s.student_id} className={`transition-colors ${selectedForDelete.has(s.student_id) ? 'bg-red-50/50 dark:bg-red-900/10' : 'hover:bg-stone-50/50 dark:hover:bg-stone-800/30'}`}>
                        <td className="px-4 py-3"><input type="checkbox" checked={selectedForDelete.has(s.student_id)} onChange={e => { const n = new Set(selectedForDelete); e.target.checked ? n.add(s.student_id) : n.delete(s.student_id); setSelectedForDelete(n); }} className="rounded" /></td>
                        <TD><span className="font-bold">{s.student_id}</span></TD><TD>{s.name}</TD><TD>{s.class}</TD><TD>{s.section}</TD><TD><span className="text-xs">{s.email}</span></TD>
                      </tr>))}</tbody></table>
                </div>
              </div>
              {confirmDelete && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-2xl p-8 max-w-md w-full text-center space-y-4 border border-stone-200 dark:border-stone-700">
                  <AlertTriangle className="w-16 h-16 text-red-500 mx-auto" />
                  <h3 className="text-xl font-bold text-stone-800 dark:text-stone-100">Confirm Bulk Delete</h3>
                  <p className="text-sm text-stone-500">Are you sure you want to delete <span className="font-bold text-red-600">{selectedForDelete.size}</span> student records? This action cannot be undone.</p>
                  <div className="flex gap-3"><button onClick={() => setConfirmDelete(false)} className="flex-1 py-3 border border-stone-200 dark:border-stone-700 rounded-xl font-bold text-stone-600 dark:text-stone-300">Cancel</button>
                    <button onClick={() => { setSelectedForDelete(new Set()); setConfirmDelete(false); }} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:opacity-90">Delete All</button></div>
                </div></div>}
            </div>
          )}

          {/* ===== CATEGORIES ===== */}
          {activeTab === 'categories' && <MasterList title="Student Categories" items={categories} onAdd={() => { if (!formCat.name) return; setCategories(p => [...p, { id: genId(), ...formCat }]); setFormCat({ name: '', description: '' }); }} onDelete={id => setCategories(p => p.filter(c => c.id !== id))} form={<><Inp label="Category Name *" value={formCat.name} onChange={e => setFormCat(p => ({ ...p, name: e.target.value }))} /><Inp label="Description" value={formCat.description} onChange={e => setFormCat(p => ({ ...p, description: e.target.value }))} /></>} color="teal" />}

          {/* ===== HOUSES ===== */}
          {activeTab === 'houses' && <MasterList title="Student Houses" items={houses.map(h => ({ id: h.id, name: h.name, description: h.description }))} onAdd={() => { if (!formHouse.name) return; setHouses(p => [...p, { id: genId(), ...formHouse }]); setFormHouse({ name: '', description: '', color: 'blue' }); }} onDelete={id => setHouses(p => p.filter(h => h.id !== id))} form={<><Inp label="House Name *" value={formHouse.name} onChange={e => setFormHouse(p => ({ ...p, name: e.target.value }))} /><Inp label="Description" value={formHouse.description} onChange={e => setFormHouse(p => ({ ...p, description: e.target.value }))} /><Sel label="Color" options={['red', 'blue', 'green', 'yellow', 'purple', 'orange']} value={formHouse.color} onChange={e => setFormHouse(p => ({ ...p, color: e.target.value }))} /></>} color="orange" />}

          {/* ===== DISABLE REASON ===== */}
          {activeTab === 'disable-reason' && <MasterList title="Disable Reasons" items={disableReasons.map(r => ({ id: r.id, name: r.reason, description: r.description }))} onAdd={() => { if (!formReason.reason) return; setDisableReasons(p => [...p, { id: genId(), ...formReason }]); setFormReason({ reason: '', description: '' }); }} onDelete={id => setDisableReasons(p => p.filter(r => r.id !== id))} form={<><Inp label="Reason *" value={formReason.reason} onChange={e => setFormReason(p => ({ ...p, reason: e.target.value }))} /><Inp label="Description" value={formReason.description} onChange={e => setFormReason(p => ({ ...p, description: e.target.value }))} /></>} color="stone" />}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Reusable Master List (for Categories, Houses, Disable Reasons)
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
            </div>
          ))}
          {items.length === 0 && <p className="text-center text-stone-500 text-sm py-6">No items. Add one using the form.</p>}
        </div>
      </div>
    </div>
  );
}
