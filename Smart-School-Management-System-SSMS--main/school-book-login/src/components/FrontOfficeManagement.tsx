import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Search, X, Phone, Mail, Users, FileText, Calendar,
  CheckCircle2, XCircle, Clock, Filter, ChevronRight, Eye,
  AlertTriangle, Settings, Inbox, PhoneIncoming, ScrollText,
  ClipboardList, Send, Truck, UserCog, GraduationCap, MessageSquare
} from 'lucide-react';
import {
  AdmissionEnquiry, VisitorRecord, PhoneCallRecord,
  PostalDispatchRecord, PostalReceiveRecord, ComplaintRecord, FrontOfficeSettings
} from '../types';

type FrontOfficeTab = 'enquiry' | 'visitors' | 'calls' | 'dispatch' | 'receive' | 'complaints' | 'setup';

const DEFAULT_SETTINGS: FrontOfficeSettings = {
  visitPurposes: ['Parent Meeting', 'Admission Enquiry', 'Vendor Visit', 'Official Visit', 'Delivery', 'Other'],
  complaintTypes: ['Academic', 'Discipline', 'Infrastructure', 'Transport', 'Fees', 'Staff Behavior', 'Other'],
  complaintSources: ['Student', 'Parent', 'Staff', 'Anonymous', 'Online', 'Other'],
  documentTypes: ['Letter', 'Parcel', 'Courier', 'Legal Notice', 'Invoice', 'Report', 'Other'],
  enquirySources: ['Walk-in', 'Phone Call', 'Website', 'Referral', 'Advertisement', 'Social Media', 'Other'],
  idProofTypes: ['Aadhaar Card', 'Driving License', 'Voter ID', 'Passport', 'PAN Card', 'Other'],
};

const TABS: { id: FrontOfficeTab; label: string; icon: any; color: string }[] = [
  { id: 'enquiry', label: 'Admission Enquiry', icon: GraduationCap, color: 'blue' },
  { id: 'visitors', label: 'Visitor Book', icon: Users, color: 'emerald' },
  { id: 'calls', label: 'Phone Call Log', icon: Phone, color: 'violet' },
  { id: 'dispatch', label: 'Postal Dispatch', icon: Send, color: 'amber' },
  { id: 'receive', label: 'Postal Receive', icon: Inbox, color: 'rose' },
  { id: 'complaints', label: 'Complaints', icon: AlertTriangle, color: 'red' },
  { id: 'setup', label: 'Setup', icon: Settings, color: 'stone' },
];

// Reusable modal wrapper
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

// Reusable input
const Input = ({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div><label className="block text-xs font-bold text-stone-500 dark:text-stone-400 mb-1.5 uppercase tracking-wider">{label}</label>
    <input {...props} className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
  </div>
);

const Select = ({ label, options, ...props }: { label: string; options: string[] } & React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <div><label className="block text-xs font-bold text-stone-500 dark:text-stone-400 mb-1.5 uppercase tracking-wider">{label}</label>
    <select {...props} className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all">
      <option value="">Select...</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const Textarea = ({ label, ...props }: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <div><label className="block text-xs font-bold text-stone-500 dark:text-stone-400 mb-1.5 uppercase tracking-wider">{label}</label>
    <textarea {...props} rows={3} className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none" />
  </div>
);

const StatCard = ({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: any; color: string }) => (
  <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl shadow-lg border border-stone-100 dark:border-stone-800">
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl bg-${color}-50 dark:bg-${color}-900/20 flex items-center justify-center`}>
        <Icon className={`w-5 h-5 text-${color}-600 dark:text-${color}-400`} />
      </div>
      <div>
        <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">{label}</p>
        <p className={`text-2xl font-bold text-${color}-600 dark:text-${color}-400`}>{value}</p>
      </div>
    </div>
  </div>
);

const StatusBadge = ({ status, colorMap }: { status: string; colorMap: Record<string, string> }) => {
  const c = colorMap[status] || 'stone';
  return <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-${c}-100 dark:bg-${c}-900/30 text-${c}-700 dark:text-${c}-400`}>{status}</span>;
};

const genId = () => Math.random().toString(36).substring(2, 10);
const today = () => new Date().toISOString().split('T')[0];
const now = () => new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

export function FrontOfficeManagement() {
  const [activeTab, setActiveTab] = useState<FrontOfficeTab>('enquiry');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [settings, setSettings] = useState<FrontOfficeSettings>(DEFAULT_SETTINGS);

  // Data states
  const [enquiries, setEnquiries] = useState<AdmissionEnquiry[]>([
    { id: genId(), studentName: 'Arjun Kumar', guardianName: 'Rajesh Kumar', phone: '9876543210', email: 'rajesh@email.com', class: '5', source: 'Walk-in', followUpDate: '2026-04-10', description: 'Interested in admission for academic year 2026-27', status: 'New', createdAt: '2026-04-05' },
    { id: genId(), studentName: 'Priya Sharma', guardianName: 'Anil Sharma', phone: '9876543211', email: 'anil@email.com', class: '8', source: 'Phone Call', followUpDate: '2026-04-08', description: 'Transfer from another school', status: 'Contacted', createdAt: '2026-04-03' },
  ]);
  const [visitors, setVisitors] = useState<VisitorRecord[]>([
    { id: genId(), name: 'Robert Fox', phone: '9876543220', purpose: 'Parent Meeting', whomToMeet: 'Class Teacher', idProofType: 'Aadhaar Card', idProofNumber: 'XXXX-1234', checkInTime: '10:30 AM', checkOutTime: '', numberOfPersons: 1, note: '', status: 'Checked In' },
    { id: genId(), name: 'Jane Cooper', phone: '9876543221', purpose: 'Vendor Visit', whomToMeet: 'Store Manager', idProofType: 'Driving License', idProofNumber: 'DL-5678', checkInTime: '09:15 AM', checkOutTime: '11:00 AM', numberOfPersons: 2, note: 'Stationery delivery', status: 'Checked Out' },
  ]);
  const [calls, setCalls] = useState<PhoneCallRecord[]>([
    { id: genId(), callerName: 'Mrs. Verma', phone: '9876543230', date: '2026-04-07', callType: 'Incoming', purpose: 'Fee enquiry', followUp: 'Send fee structure via email', note: '', handledBy: 'Ms. Parker' },
  ]);
  const [dispatches, setDispatches] = useState<PostalDispatchRecord[]>([
    { id: genId(), referenceNo: 'DSP-2026-001', toAddress: 'District Education Office, City Center', fromTitle: 'Principal', date: '2026-04-05', documentType: 'Letter', note: 'Annual report submission' },
  ]);
  const [receives, setReceives] = useState<PostalReceiveRecord[]>([
    { id: genId(), referenceNo: 'RCV-2026-001', fromAddress: 'Board of Education, State Capital', toTitle: 'Principal', date: '2026-04-06', documentType: 'Legal Notice', note: 'Affiliation renewal notice' },
  ]);
  const [complaints, setComplaints] = useState<ComplaintRecord[]>([
    { id: genId(), complaintType: 'Infrastructure', source: 'Parent', name: 'Mr. Kapoor', phone: '9876543240', email: 'kapoor@email.com', description: 'Broken bench in class 5-A', actionTaken: 'Reported to maintenance', assignedTo: 'Maintenance Head', status: 'In Progress', date: '2026-04-04' },
  ]);

  // Form states
  const [formEnquiry, setFormEnquiry] = useState<Partial<AdmissionEnquiry>>({});
  const [formVisitor, setFormVisitor] = useState<Partial<VisitorRecord>>({});
  const [formCall, setFormCall] = useState<Partial<PhoneCallRecord>>({});
  const [formDispatch, setFormDispatch] = useState<Partial<PostalDispatchRecord>>({});
  const [formReceive, setFormReceive] = useState<Partial<PostalReceiveRecord>>({});
  const [formComplaint, setFormComplaint] = useState<Partial<ComplaintRecord>>({});
  const [setupCategory, setSetupCategory] = useState<keyof FrontOfficeSettings>('visitPurposes');
  const [newSetupItem, setNewSetupItem] = useState('');

  const resetForms = () => { setFormEnquiry({}); setFormVisitor({}); setFormCall({}); setFormDispatch({}); setFormReceive({}); setFormComplaint({}); };

  const handleAdd = () => {
    switch (activeTab) {
      case 'enquiry':
        if (!formEnquiry.studentName) return;
        setEnquiries(p => [...p, { id: genId(), studentName: formEnquiry.studentName!, guardianName: formEnquiry.guardianName || '', phone: formEnquiry.phone || '', email: formEnquiry.email || '', class: formEnquiry.class || '', source: formEnquiry.source || '', followUpDate: formEnquiry.followUpDate || '', description: formEnquiry.description || '', status: 'New', createdAt: today() }]);
        break;
      case 'visitors':
        if (!formVisitor.name) return;
        setVisitors(p => [...p, { id: genId(), name: formVisitor.name!, phone: formVisitor.phone || '', purpose: formVisitor.purpose || '', whomToMeet: formVisitor.whomToMeet || '', idProofType: formVisitor.idProofType || '', idProofNumber: formVisitor.idProofNumber || '', checkInTime: now(), checkOutTime: '', numberOfPersons: formVisitor.numberOfPersons || 1, note: formVisitor.note || '', status: 'Checked In' }]);
        break;
      case 'calls':
        if (!formCall.callerName) return;
        setCalls(p => [...p, { id: genId(), callerName: formCall.callerName!, phone: formCall.phone || '', date: today(), callType: (formCall.callType as any) || 'Incoming', purpose: formCall.purpose || '', followUp: formCall.followUp || '', note: formCall.note || '', handledBy: formCall.handledBy || 'Reception' }]);
        break;
      case 'dispatch':
        if (!formDispatch.toAddress) return;
        setDispatches(p => [...p, { id: genId(), referenceNo: `DSP-2026-${(p.length + 1).toString().padStart(3, '0')}`, toAddress: formDispatch.toAddress!, fromTitle: formDispatch.fromTitle || '', date: today(), documentType: formDispatch.documentType || '', note: formDispatch.note || '' }]);
        break;
      case 'receive':
        if (!formReceive.fromAddress) return;
        setReceives(p => [...p, { id: genId(), referenceNo: `RCV-2026-${(p.length + 1).toString().padStart(3, '0')}`, fromAddress: formReceive.fromAddress!, toTitle: formReceive.toTitle || '', date: today(), documentType: formReceive.documentType || '', note: formReceive.note || '' }]);
        break;
      case 'complaints':
        if (!formComplaint.description) return;
        setComplaints(p => [...p, { id: genId(), complaintType: formComplaint.complaintType || '', source: formComplaint.source || '', name: formComplaint.name || '', phone: formComplaint.phone || '', email: formComplaint.email || '', description: formComplaint.description!, actionTaken: '', assignedTo: formComplaint.assignedTo || '', status: 'Open', date: today() }]);
        break;
    }
    setShowModal(false);
    resetForms();
  };

  const filter = (text: string) => text.toLowerCase().includes(search.toLowerCase());

  const currentTab = TABS.find(t => t.id === activeTab)!;

  return (
    <div className="space-y-6">
      {/* Tab Bar */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-lg border border-stone-100 dark:border-stone-800 p-2 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSearch(''); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? `bg-${tab.color}-600 text-white shadow-lg` : 'text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800'}`}>
              <tab.icon className="w-4 h-4" />{tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
          {activeTab === 'setup' ? <SetupPanel settings={settings} setSettings={setSettings} category={setupCategory} setCategory={setSetupCategory} newItem={newSetupItem} setNewItem={setNewSetupItem} /> : (
            <>
              {/* Stats */}
              {activeTab === 'enquiry' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="Total" value={enquiries.length} icon={FileText} color="blue" />
                  <StatCard label="New" value={enquiries.filter(e => e.status === 'New').length} icon={Clock} color="amber" />
                  <StatCard label="Follow Up" value={enquiries.filter(e => e.status === 'Follow Up').length} icon={Calendar} color="violet" />
                  <StatCard label="Converted" value={enquiries.filter(e => e.status === 'Converted').length} icon={CheckCircle2} color="emerald" />
                </div>
              )}
              {activeTab === 'visitors' && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <StatCard label="Total Today" value={visitors.length} icon={Users} color="emerald" />
                  <StatCard label="Checked In" value={visitors.filter(v => v.status === 'Checked In').length} icon={CheckCircle2} color="blue" />
                  <StatCard label="Checked Out" value={visitors.filter(v => v.status === 'Checked Out').length} icon={XCircle} color="stone" />
                </div>
              )}
              {activeTab === 'calls' && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <StatCard label="Total Calls" value={calls.length} icon={Phone} color="violet" />
                  <StatCard label="Incoming" value={calls.filter(c => c.callType === 'Incoming').length} icon={PhoneIncoming} color="blue" />
                  <StatCard label="Outgoing" value={calls.filter(c => c.callType === 'Outgoing').length} icon={Phone} color="emerald" />
                </div>
              )}
              {activeTab === 'dispatch' && <div className="grid grid-cols-2 gap-4"><StatCard label="Total Dispatched" value={dispatches.length} icon={Send} color="amber" /><StatCard label="This Month" value={dispatches.filter(d => d.date.startsWith('2026-04')).length} icon={Calendar} color="blue" /></div>}
              {activeTab === 'receive' && <div className="grid grid-cols-2 gap-4"><StatCard label="Total Received" value={receives.length} icon={Inbox} color="rose" /><StatCard label="This Month" value={receives.filter(r => r.date.startsWith('2026-04')).length} icon={Calendar} color="blue" /></div>}
              {activeTab === 'complaints' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="Total" value={complaints.length} icon={AlertTriangle} color="red" />
                  <StatCard label="Open" value={complaints.filter(c => c.status === 'Open').length} icon={Clock} color="amber" />
                  <StatCard label="In Progress" value={complaints.filter(c => c.status === 'In Progress').length} icon={Settings} color="blue" />
                  <StatCard label="Resolved" value={complaints.filter(c => c.status === 'Resolved').length} icon={CheckCircle2} color="emerald" />
                </div>
              )}

              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mt-4">
                <div className="relative flex-1 max-w-md w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${currentTab.label.toLowerCase()}...`}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-sm text-stone-800 dark:text-stone-100 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <button onClick={() => { resetForms(); setShowModal(true); }}
                  className={`flex items-center gap-2 px-5 py-2.5 bg-${currentTab.color}-600 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-lg whitespace-nowrap`}>
                  <Plus className="w-4 h-4" />Add {currentTab.label}
                </button>
              </div>

              {/* Table */}
              <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-lg border border-stone-100 dark:border-stone-800 overflow-hidden mt-4">
                <div className="overflow-x-auto">
                  {activeTab === 'enquiry' && <EnquiryTable data={enquiries.filter(e => filter(e.studentName) || filter(e.guardianName) || filter(e.phone))} onUpdateStatus={(id, status) => setEnquiries(p => p.map(e => e.id === id ? { ...e, status } : e))} onDelete={id => setEnquiries(p => p.filter(e => e.id !== id))} />}
                  {activeTab === 'visitors' && <VisitorTable data={visitors.filter(v => filter(v.name) || filter(v.purpose) || filter(v.whomToMeet))} onCheckOut={id => setVisitors(p => p.map(v => v.id === id ? { ...v, status: 'Checked Out', checkOutTime: now() } : v))} onDelete={id => setVisitors(p => p.filter(v => v.id !== id))} />}
                  {activeTab === 'calls' && <CallTable data={calls.filter(c => filter(c.callerName) || filter(c.phone) || filter(c.purpose))} onDelete={id => setCalls(p => p.filter(c => c.id !== id))} />}
                  {activeTab === 'dispatch' && <PostalTable type="dispatch" data={dispatches.filter(d => filter(d.referenceNo) || filter(d.toAddress) || filter(d.fromTitle))} onDelete={id => setDispatches(p => p.filter(d => d.id !== id))} />}
                  {activeTab === 'receive' && <PostalTable type="receive" data={receives.filter(r => filter(r.referenceNo) || filter((r as any).fromAddress || '') || filter((r as any).toTitle || ''))} onDelete={id => setReceives(p => p.filter(r => r.id !== id))} />}
                  {activeTab === 'complaints' && <ComplaintTable data={complaints.filter(c => filter(c.name) || filter(c.description) || filter(c.complaintType))} onUpdateStatus={(id, status) => setComplaints(p => p.map(c => c.id === id ? { ...c, status } : c))} onDelete={id => setComplaints(p => p.filter(c => c.id !== id))} />}
                </div>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Add Modal */}
      {showModal && (
        <Modal title={`Add ${currentTab.label}`} onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            {activeTab === 'enquiry' && <>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Student Name *" value={formEnquiry.studentName || ''} onChange={e => setFormEnquiry(p => ({ ...p, studentName: e.target.value }))} />
                <Input label="Guardian Name" value={formEnquiry.guardianName || ''} onChange={e => setFormEnquiry(p => ({ ...p, guardianName: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Phone" value={formEnquiry.phone || ''} onChange={e => setFormEnquiry(p => ({ ...p, phone: e.target.value }))} />
                <Input label="Email" type="email" value={formEnquiry.email || ''} onChange={e => setFormEnquiry(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Select label="Class" options={Array.from({ length: 10 }, (_, i) => (i + 1).toString())} value={formEnquiry.class || ''} onChange={e => setFormEnquiry(p => ({ ...p, class: e.target.value }))} />
                <Select label="Source" options={settings.enquirySources} value={formEnquiry.source || ''} onChange={e => setFormEnquiry(p => ({ ...p, source: e.target.value }))} />
              </div>
              <Input label="Follow-up Date" type="date" value={formEnquiry.followUpDate || ''} onChange={e => setFormEnquiry(p => ({ ...p, followUpDate: e.target.value }))} />
              <Textarea label="Description" value={formEnquiry.description || ''} onChange={e => setFormEnquiry(p => ({ ...p, description: e.target.value }))} />
            </>}
            {activeTab === 'visitors' && <>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Visitor Name *" value={formVisitor.name || ''} onChange={e => setFormVisitor(p => ({ ...p, name: e.target.value }))} />
                <Input label="Phone" value={formVisitor.phone || ''} onChange={e => setFormVisitor(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Select label="Purpose" options={settings.visitPurposes} value={formVisitor.purpose || ''} onChange={e => setFormVisitor(p => ({ ...p, purpose: e.target.value }))} />
                <Input label="Whom to Meet" value={formVisitor.whomToMeet || ''} onChange={e => setFormVisitor(p => ({ ...p, whomToMeet: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Select label="ID Proof Type" options={settings.idProofTypes} value={formVisitor.idProofType || ''} onChange={e => setFormVisitor(p => ({ ...p, idProofType: e.target.value }))} />
                <Input label="ID Proof Number" value={formVisitor.idProofNumber || ''} onChange={e => setFormVisitor(p => ({ ...p, idProofNumber: e.target.value }))} />
              </div>
              <Input label="Number of Persons" type="number" min="1" value={formVisitor.numberOfPersons || 1} onChange={e => setFormVisitor(p => ({ ...p, numberOfPersons: parseInt(e.target.value) || 1 }))} />
              <Textarea label="Note" value={formVisitor.note || ''} onChange={e => setFormVisitor(p => ({ ...p, note: e.target.value }))} />
            </>}
            {activeTab === 'calls' && <>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Caller Name *" value={formCall.callerName || ''} onChange={e => setFormCall(p => ({ ...p, callerName: e.target.value }))} />
                <Input label="Phone" value={formCall.phone || ''} onChange={e => setFormCall(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Select label="Call Type" options={['Incoming', 'Outgoing']} value={formCall.callType || ''} onChange={e => setFormCall(p => ({ ...p, callType: e.target.value as any }))} />
                <Input label="Handled By" value={formCall.handledBy || ''} onChange={e => setFormCall(p => ({ ...p, handledBy: e.target.value }))} />
              </div>
              <Input label="Purpose" value={formCall.purpose || ''} onChange={e => setFormCall(p => ({ ...p, purpose: e.target.value }))} />
              <Textarea label="Follow Up" value={formCall.followUp || ''} onChange={e => setFormCall(p => ({ ...p, followUp: e.target.value }))} />
            </>}
            {activeTab === 'dispatch' && <>
              <div className="grid grid-cols-2 gap-4">
                <Input label="From Title *" value={formDispatch.fromTitle || ''} onChange={e => setFormDispatch(p => ({ ...p, fromTitle: e.target.value }))} />
                <Select label="Document Type" options={settings.documentTypes} value={formDispatch.documentType || ''} onChange={e => setFormDispatch(p => ({ ...p, documentType: e.target.value }))} />
              </div>
              <Textarea label="To Address *" value={formDispatch.toAddress || ''} onChange={e => setFormDispatch(p => ({ ...p, toAddress: e.target.value }))} />
              <Textarea label="Note" value={formDispatch.note || ''} onChange={e => setFormDispatch(p => ({ ...p, note: e.target.value }))} />
            </>}
            {activeTab === 'receive' && <>
              <div className="grid grid-cols-2 gap-4">
                <Input label="To Title *" value={formReceive.toTitle || ''} onChange={e => setFormReceive(p => ({ ...p, toTitle: e.target.value }))} />
                <Select label="Document Type" options={settings.documentTypes} value={formReceive.documentType || ''} onChange={e => setFormReceive(p => ({ ...p, documentType: e.target.value }))} />
              </div>
              <Textarea label="From Address *" value={formReceive.fromAddress || ''} onChange={e => setFormReceive(p => ({ ...p, fromAddress: e.target.value }))} />
              <Textarea label="Note" value={formReceive.note || ''} onChange={e => setFormReceive(p => ({ ...p, note: e.target.value }))} />
            </>}
            {activeTab === 'complaints' && <>
              <div className="grid grid-cols-2 gap-4">
                <Select label="Complaint Type" options={settings.complaintTypes} value={formComplaint.complaintType || ''} onChange={e => setFormComplaint(p => ({ ...p, complaintType: e.target.value }))} />
                <Select label="Source" options={settings.complaintSources} value={formComplaint.source || ''} onChange={e => setFormComplaint(p => ({ ...p, source: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Name" value={formComplaint.name || ''} onChange={e => setFormComplaint(p => ({ ...p, name: e.target.value }))} />
                <Input label="Phone" value={formComplaint.phone || ''} onChange={e => setFormComplaint(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <Input label="Email" type="email" value={formComplaint.email || ''} onChange={e => setFormComplaint(p => ({ ...p, email: e.target.value }))} />
              <Textarea label="Description *" value={formComplaint.description || ''} onChange={e => setFormComplaint(p => ({ ...p, description: e.target.value }))} />
              <Input label="Assigned To" value={formComplaint.assignedTo || ''} onChange={e => setFormComplaint(p => ({ ...p, assignedTo: e.target.value }))} />
            </>}
            <button onClick={handleAdd} className={`w-full py-3.5 bg-${currentTab.color}-600 text-white rounded-xl font-bold hover:opacity-90 transition-all shadow-lg mt-2`}>
              <Plus className="w-4 h-4 inline mr-2" />Add {currentTab.label}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// Sub-tables
const TH = ({ children }: { children?: React.ReactNode }) => <th className="px-4 py-3 text-left text-[10px] font-bold text-stone-500 uppercase tracking-wider">{children}</th>;
const TD = ({ children, className = '' }: { children?: React.ReactNode; className?: string }) => <td className={`px-4 py-3.5 text-sm text-stone-700 dark:text-stone-300 ${className}`}>{children}</td>;
const DelBtn = ({ onClick }: { onClick: () => void }) => <button onClick={onClick} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 hover:text-red-600 transition-colors"><X className="w-3.5 h-3.5" /></button>;

const enquiryStatusColors: Record<string, string> = { New: 'blue', Contacted: 'violet', 'Follow Up': 'amber', Converted: 'emerald', Closed: 'stone' };
const complaintStatusColors: Record<string, string> = { Open: 'red', 'In Progress': 'amber', Resolved: 'emerald', Closed: 'stone' };

function EnquiryTable({ data, onUpdateStatus, onDelete }: { data: AdmissionEnquiry[]; onUpdateStatus: (id: string, s: AdmissionEnquiry['status']) => void; onDelete: (id: string) => void }) {
  return data.length === 0 ? <p className="p-8 text-center text-stone-500 text-sm">No enquiries found.</p> : (
    <table className="w-full"><thead className="bg-stone-50 dark:bg-stone-800/50"><tr><TH>Student</TH><TH>Guardian</TH><TH>Class</TH><TH>Contact</TH><TH>Source</TH><TH>Follow Up</TH><TH>Status</TH><TH></TH></tr></thead>
      <tbody className="divide-y divide-stone-100 dark:divide-stone-800">{data.map(e => (
        <tr key={e.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
          <TD><span className="font-bold text-stone-800 dark:text-stone-100">{e.studentName}</span></TD>
          <TD>{e.guardianName}</TD><TD>{e.class}</TD>
          <TD><div className="text-xs">{e.phone}<br/>{e.email}</div></TD>
          <TD>{e.source}</TD><TD>{e.followUpDate}</TD>
          <TD><select value={e.status} onChange={ev => onUpdateStatus(e.id, ev.target.value as any)} className="text-xs font-bold bg-transparent border border-stone-200 dark:border-stone-700 rounded-lg px-2 py-1 text-stone-700 dark:text-stone-300">
            {['New','Contacted','Follow Up','Converted','Closed'].map(s => <option key={s} value={s}>{s}</option>)}
          </select></TD>
          <TD><DelBtn onClick={() => onDelete(e.id)} /></TD>
        </tr>
      ))}</tbody></table>
  );
}

function VisitorTable({ data, onCheckOut, onDelete }: { data: VisitorRecord[]; onCheckOut: (id: string) => void; onDelete: (id: string) => void }) {
  return data.length === 0 ? <p className="p-8 text-center text-stone-500 text-sm">No visitors found.</p> : (
    <table className="w-full"><thead className="bg-stone-50 dark:bg-stone-800/50"><tr><TH>Visitor</TH><TH>Purpose</TH><TH>Meet</TH><TH>ID Proof</TH><TH>In</TH><TH>Out</TH><TH>Status</TH><TH></TH></tr></thead>
      <tbody className="divide-y divide-stone-100 dark:divide-stone-800">{data.map(v => (
        <tr key={v.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
          <TD><span className="font-bold text-stone-800 dark:text-stone-100">{v.name}</span><br/><span className="text-xs text-stone-500">{v.phone}</span></TD>
          <TD>{v.purpose}</TD><TD>{v.whomToMeet}</TD>
          <TD><span className="text-xs">{v.idProofType}<br/>{v.idProofNumber}</span></TD>
          <TD>{v.checkInTime}</TD><TD>{v.checkOutTime || '—'}</TD>
          <TD>{v.status === 'Checked In' ? <button onClick={() => onCheckOut(v.id)} className="px-3 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded-full hover:bg-emerald-700 transition-colors">Check Out</button> : <span className="text-[10px] font-bold text-stone-500 uppercase">Done</span>}</TD>
          <TD><DelBtn onClick={() => onDelete(v.id)} /></TD>
        </tr>
      ))}</tbody></table>
  );
}

function CallTable({ data, onDelete }: { data: PhoneCallRecord[]; onDelete: (id: string) => void }) {
  return data.length === 0 ? <p className="p-8 text-center text-stone-500 text-sm">No calls found.</p> : (
    <table className="w-full"><thead className="bg-stone-50 dark:bg-stone-800/50"><tr><TH>Caller</TH><TH>Phone</TH><TH>Type</TH><TH>Purpose</TH><TH>Follow Up</TH><TH>Date</TH><TH>By</TH><TH></TH></tr></thead>
      <tbody className="divide-y divide-stone-100 dark:divide-stone-800">{data.map(c => (
        <tr key={c.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
          <TD><span className="font-bold text-stone-800 dark:text-stone-100">{c.callerName}</span></TD>
          <TD>{c.phone}</TD>
          <TD><span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${c.callType === 'Incoming' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'}`}>{c.callType}</span></TD>
          <TD>{c.purpose}</TD><TD>{c.followUp}</TD><TD>{c.date}</TD><TD>{c.handledBy}</TD>
          <TD><DelBtn onClick={() => onDelete(c.id)} /></TD>
        </tr>
      ))}</tbody></table>
  );
}

function PostalTable({ type, data, onDelete }: { type: 'dispatch' | 'receive'; data: (PostalDispatchRecord | PostalReceiveRecord)[]; onDelete: (id: string) => void }) {
  return data.length === 0 ? <p className="p-8 text-center text-stone-500 text-sm">No records found.</p> : (
    <table className="w-full"><thead className="bg-stone-50 dark:bg-stone-800/50"><tr><TH>Ref No</TH><TH>{type === 'dispatch' ? 'To' : 'From'}</TH><TH>{type === 'dispatch' ? 'From Title' : 'To Title'}</TH><TH>Type</TH><TH>Date</TH><TH>Note</TH><TH></TH></tr></thead>
      <tbody className="divide-y divide-stone-100 dark:divide-stone-800">{data.map((d: any) => (
        <tr key={d.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
          <TD><span className="font-bold text-stone-800 dark:text-stone-100">{d.referenceNo}</span></TD>
          <TD>{type === 'dispatch' ? d.toAddress : d.fromAddress}</TD>
          <TD>{type === 'dispatch' ? d.fromTitle : d.toTitle}</TD>
          <TD><span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">{d.documentType}</span></TD>
          <TD>{d.date}</TD><TD><span className="text-xs">{d.note}</span></TD>
          <TD><DelBtn onClick={() => onDelete(d.id)} /></TD>
        </tr>
      ))}</tbody></table>
  );
}

function ComplaintTable({ data, onUpdateStatus, onDelete }: { data: ComplaintRecord[]; onUpdateStatus: (id: string, s: ComplaintRecord['status']) => void; onDelete: (id: string) => void }) {
  return data.length === 0 ? <p className="p-8 text-center text-stone-500 text-sm">No complaints found.</p> : (
    <table className="w-full"><thead className="bg-stone-50 dark:bg-stone-800/50"><tr><TH>Type</TH><TH>Source</TH><TH>Name</TH><TH>Description</TH><TH>Assigned</TH><TH>Date</TH><TH>Status</TH><TH></TH></tr></thead>
      <tbody className="divide-y divide-stone-100 dark:divide-stone-800">{data.map(c => (
        <tr key={c.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
          <TD><span className="font-bold">{c.complaintType}</span></TD><TD>{c.source}</TD>
          <TD><span className="font-bold text-stone-800 dark:text-stone-100">{c.name}</span><br/><span className="text-xs text-stone-500">{c.phone}</span></TD>
          <TD><span className="text-xs line-clamp-2">{c.description}</span></TD>
          <TD>{c.assignedTo}</TD><TD>{c.date}</TD>
          <TD><select value={c.status} onChange={ev => onUpdateStatus(c.id, ev.target.value as any)} className="text-xs font-bold bg-transparent border border-stone-200 dark:border-stone-700 rounded-lg px-2 py-1 text-stone-700 dark:text-stone-300">
            {['Open','In Progress','Resolved','Closed'].map(s => <option key={s} value={s}>{s}</option>)}
          </select></TD>
          <TD><DelBtn onClick={() => onDelete(c.id)} /></TD>
        </tr>
      ))}</tbody></table>
  );
}

// Setup Panel
const SETUP_CATEGORIES: { key: keyof FrontOfficeSettings; label: string; icon: any }[] = [
  { key: 'visitPurposes', label: 'Visit Purposes', icon: Users },
  { key: 'complaintTypes', label: 'Complaint Types', icon: AlertTriangle },
  { key: 'complaintSources', label: 'Complaint Sources', icon: MessageSquare },
  { key: 'documentTypes', label: 'Document Types', icon: FileText },
  { key: 'enquirySources', label: 'Enquiry Sources', icon: GraduationCap },
  { key: 'idProofTypes', label: 'ID Proof Types', icon: ClipboardList },
];

function SetupPanel({ settings, setSettings, category, setCategory, newItem, setNewItem }: {
  settings: FrontOfficeSettings; setSettings: React.Dispatch<React.SetStateAction<FrontOfficeSettings>>;
  category: keyof FrontOfficeSettings; setCategory: (c: keyof FrontOfficeSettings) => void;
  newItem: string; setNewItem: (v: string) => void;
}) {
  const addItem = () => {
    if (!newItem.trim()) return;
    setSettings(p => ({ ...p, [category]: [...p[category], newItem.trim()] }));
    setNewItem('');
  };
  const removeItem = (item: string) => {
    setSettings(p => ({ ...p, [category]: p[category].filter(i => i !== item) }));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-lg border border-stone-100 dark:border-stone-800 p-4 space-y-1 md:col-span-1">
        <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3 px-2">Categories</h3>
        {SETUP_CATEGORIES.map(cat => (
          <button key={cat.key} onClick={() => setCategory(cat.key)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${category === cat.key ? 'bg-stone-800 text-white' : 'text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800'}`}>
            <cat.icon className="w-4 h-4" />{cat.label}
          </button>
        ))}
      </div>
      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-lg border border-stone-100 dark:border-stone-800 p-6 md:col-span-3">
        <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100 mb-4">{SETUP_CATEGORIES.find(c => c.key === category)?.label}</h3>
        <div className="flex gap-3 mb-6">
          <input value={newItem} onChange={e => setNewItem(e.target.value)} onKeyDown={e => e.key === 'Enter' && addItem()} placeholder="Add new item..."
            className="flex-1 px-4 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm text-stone-800 dark:text-stone-100 focus:ring-2 focus:ring-blue-500 outline-none" />
          <button onClick={addItem} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all"><Plus className="w-4 h-4 inline mr-1" />Add</button>
        </div>
        <div className="space-y-2">
          {settings[category].map((item, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3 bg-stone-50 dark:bg-stone-800 rounded-xl">
              <span className="text-sm font-medium text-stone-700 dark:text-stone-300">{item}</span>
              <button onClick={() => removeItem(item)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 hover:text-red-600 transition-colors"><X className="w-3.5 h-3.5" /></button>
            </div>
          ))}
          {settings[category].length === 0 && <p className="text-center text-stone-500 text-sm py-6">No items configured. Add one above.</p>}
        </div>
      </div>
    </div>
  );
}
