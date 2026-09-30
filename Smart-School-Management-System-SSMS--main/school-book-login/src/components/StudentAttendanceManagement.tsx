import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Search, X, FileText, Calendar, CheckCircle2, Clock,
  UserCheck, UserX, AlertCircle, ClipboardList, Filter,
  ChevronDown, Check, Minus, Users, BarChart3
} from 'lucide-react';
import { Student, StudentAttendanceRecord, AttendanceLeaveRequest } from '../types';

type ATTab = 'mark' | 'leave' | 'by-date';

const TABS: { id: ATTab; label: string; icon: any; color: string }[] = [
  { id: 'mark', label: 'Student Attendance', icon: UserCheck, color: 'emerald' },
  { id: 'leave', label: 'Approve Leave', icon: ClipboardList, color: 'amber' },
  { id: 'by-date', label: 'Attendance By Date', icon: Calendar, color: 'violet' },
];

const CLASSES = Array.from({ length: 10 }, (_, i) => (i + 1).toString());
const SECTIONS = ['A', 'B', 'C', 'D'];
const genId = () => Math.random().toString(36).substring(2, 10);
const today = () => new Date().toISOString().split('T')[0];

type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Half Day';

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; color: string; bg: string; icon: any }> = {
  Present: { label: 'P', color: 'text-emerald-700', bg: 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300', icon: Check },
  Absent: { label: 'A', color: 'text-red-700', bg: 'bg-red-100 dark:bg-red-900/30 border-red-300', icon: X },
  Late: { label: 'L', color: 'text-amber-700', bg: 'bg-amber-100 dark:bg-amber-900/30 border-amber-300', icon: Clock },
  'Half Day': { label: 'H', color: 'text-blue-700', bg: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300', icon: Minus },
};

// Shared UI
const Stat = ({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: any; color: string }) => (
  <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl shadow-lg border border-stone-100 dark:border-stone-800">
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl bg-${color}-50 dark:bg-${color}-900/20 flex items-center justify-center`}><Icon className={`w-5 h-5 text-${color}-600 dark:text-${color}-400`} /></div>
      <div><p className="text-xs font-bold text-stone-500 uppercase tracking-wider">{label}</p><p className={`text-2xl font-bold text-${color}-600 dark:text-${color}-400`}>{value}</p></div>
    </div>
  </div>
);
const TH = ({ children }: { children?: React.ReactNode }) => <th className="px-4 py-3 text-left text-[10px] font-bold text-stone-500 uppercase tracking-wider">{children}</th>;
const TD = ({ children }: { children?: React.ReactNode }) => <td className="px-4 py-3.5 text-sm text-stone-700 dark:text-stone-300">{children}</td>;

// Seed some mock attendance records
const SEED_RECORDS: StudentAttendanceRecord[] = [
  { id: genId(), studentId: 'S-001', studentName: 'Student 1 (Class 1)', class: '1', section: 'A', date: today(), status: 'Present' },
  { id: genId(), studentId: 'S-002', studentName: 'Student 2 (Class 1)', class: '1', section: 'A', date: today(), status: 'Absent', note: 'No information' },
  { id: genId(), studentId: 'S-003', studentName: 'Student 3 (Class 1)', class: '1', section: 'A', date: today(), status: 'Late', note: 'Traffic' },
  { id: genId(), studentId: 'S-006', studentName: 'Student 6 (Class 2)', class: '2', section: 'A', date: today(), status: 'Present' },
  { id: genId(), studentId: 'S-007', studentName: 'Student 7 (Class 2)', class: '2', section: 'A', date: today(), status: 'Half Day' },
];

const SEED_LEAVES: AttendanceLeaveRequest[] = [
  { id: genId(), studentId: 'S-004', studentName: 'Student 4 (Class 1)', class: '1', section: 'A', fromDate: '2026-04-10', toDate: '2026-04-11', reason: 'Family function out of town', status: 'Pending', appliedAt: '2026-04-08' },
  { id: genId(), studentId: 'S-011', studentName: 'Student 11 (Class 3)', class: '3', section: 'A', fromDate: '2026-04-09', toDate: '2026-04-09', reason: 'Medical appointment', status: 'Pending', appliedAt: '2026-04-07' },
  { id: genId(), studentId: 'S-016', studentName: 'Student 16 (Class 4)', class: '4', section: 'A', fromDate: '2026-04-08', toDate: '2026-04-08', reason: 'Fever and cold', status: 'Approved', appliedAt: '2026-04-07', reviewedBy: 'Admin' },
  { id: genId(), studentId: 'S-021', studentName: 'Student 21 (Class 5)', class: '5', section: 'A', fromDate: '2026-04-06', toDate: '2026-04-07', reason: 'Personal emergency', status: 'Rejected', appliedAt: '2026-04-05', reviewedBy: 'Admin' },
];

export function StudentAttendanceManagement({ students }: { students: Student[] }) {
  const [activeTab, setActiveTab] = useState<ATTab>('mark');

  // Mark Attendance state
  const [classFilter, setClassFilter] = useState('1');
  const [sectionFilter, setSectionFilter] = useState('A');
  const [markDate, setMarkDate] = useState(today());
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [records, setRecords] = useState<StudentAttendanceRecord[]>(SEED_RECORDS);
  const [saved, setSaved] = useState(false);

  // Leave state
  const [leaveRequests, setLeaveRequests] = useState<AttendanceLeaveRequest[]>(SEED_LEAVES);
  const [leaveFilter, setLeaveFilter] = useState<'' | 'Pending' | 'Approved' | 'Rejected'>('');

  // Attendance By Date state
  const [reportClass, setReportClass] = useState('');
  const [reportSection, setReportSection] = useState('');
  const [reportDate, setReportDate] = useState(today());

  // Students for the selected class/section
  const classStudents = useMemo(() => {
    const fromStudents = students.filter(s => s.class === classFilter && s.section === sectionFilter);
    if (fromStudents.length > 0) return fromStudents;
    // Fallback mock students if Firestore is empty
    return Array.from({ length: 5 }, (_, i) => ({
      student_id: `S-${classFilter}-${i + 1}`,
      name: `Student ${i + 1} (Class ${classFilter})`,
      class: classFilter,
      section: sectionFilter,
      email: `student@school.com`,
    } as Student));
  }, [students, classFilter, sectionFilter]);

  // Get existing record for today
  const existingRecord = (studentId: string) =>
    records.find(r => r.studentId === studentId && r.date === markDate && r.class === classFilter && r.section === sectionFilter);

  const getStatus = (studentId: string): AttendanceStatus =>
    attendance[studentId] || existingRecord(studentId)?.status || 'Present';

  const cycleStatus = (studentId: string) => {
    const cycle: AttendanceStatus[] = ['Present', 'Absent', 'Late', 'Half Day'];
    const cur = getStatus(studentId);
    const next = cycle[(cycle.indexOf(cur) + 1) % cycle.length];
    setAttendance(p => ({ ...p, [studentId]: next }));
    setSaved(false);
  };

  const setAllStatus = (status: AttendanceStatus) => {
    const map: Record<string, AttendanceStatus> = {};
    classStudents.forEach(s => { map[s.student_id] = status; });
    setAttendance(map);
    setSaved(false);
  };

  const handleSave = () => {
    const newRecords: StudentAttendanceRecord[] = classStudents.map(s => ({
      id: existingRecord(s.student_id)?.id || genId(),
      studentId: s.student_id,
      studentName: s.name,
      class: classFilter,
      section: sectionFilter,
      date: markDate,
      status: getStatus(s.student_id),
      note: notes[s.student_id] || '',
    }));
    setRecords(prev => {
      const filtered = prev.filter(r => !(r.date === markDate && r.class === classFilter && r.section === sectionFilter));
      return [...filtered, ...newRecords];
    });
    setSaved(true);
  };

  // Summary counts for the current class/day
  const counts = useMemo(() => {
    const result = { Present: 0, Absent: 0, Late: 0, 'Half Day': 0 };
    classStudents.forEach(s => { result[getStatus(s.student_id)]++; });
    return result;
  }, [classStudents, attendance, records, markDate, classFilter, sectionFilter]);

  // Report records
  const reportRecords = useMemo(() =>
    records.filter(r =>
      (!reportClass || r.class === reportClass) &&
      (!reportSection || r.section === reportSection) &&
      r.date === reportDate
    ), [records, reportClass, reportSection, reportDate]);

  const reportCounts = useMemo(() => {
    const result = { Present: 0, Absent: 0, Late: 0, 'Half Day': 0 };
    reportRecords.forEach(r => { result[r.status]++; });
    return result;
  }, [reportRecords]);

  return (
    <div className="space-y-6">
      {/* Tab Bar */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-lg border border-stone-100 dark:border-stone-800 p-2 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? `bg-${tab.color}-600 text-white shadow-lg` : 'text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800'}`}>
              <tab.icon className="w-3.5 h-3.5" />{tab.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>

          {/* ─── MARK ATTENDANCE ─── */}
          {activeTab === 'mark' && (
            <div className="space-y-4">
              {/* Filter + Date Bar */}
              <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-lg border border-stone-100 dark:border-stone-800 p-5">
                <div className="flex flex-wrap gap-4 items-end">
                  <div>
                    <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 mb-1.5 uppercase tracking-wider">Class</label>
                    <select value={classFilter} onChange={e => { setClassFilter(e.target.value); setAttendance({}); setSaved(false); }}
                      className="px-4 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm font-bold text-stone-800 dark:text-stone-100 focus:ring-2 focus:ring-emerald-500 outline-none">
                      {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 mb-1.5 uppercase tracking-wider">Section</label>
                    <select value={sectionFilter} onChange={e => { setSectionFilter(e.target.value); setAttendance({}); setSaved(false); }}
                      className="px-4 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm font-bold text-stone-800 dark:text-stone-100 focus:ring-2 focus:ring-emerald-500 outline-none">
                      {SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 mb-1.5 uppercase tracking-wider">Date</label>
                    <input type="date" value={markDate} onChange={e => { setMarkDate(e.target.value); setAttendance({}); setSaved(false); }}
                      className="px-4 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm font-bold text-stone-800 dark:text-stone-100 focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                  <div className="flex gap-2 ml-auto flex-wrap">
                    {(['Present', 'Absent', 'Late', 'Half Day'] as AttendanceStatus[]).map(s => (
                      <button key={s} onClick={() => setAllStatus(s)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${STATUS_CONFIG[s].bg} ${STATUS_CONFIG[s].color}`}>
                        Mark All {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Summary Stat Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Stat label="Present" value={counts.Present} icon={UserCheck} color="emerald" />
                <Stat label="Absent" value={counts.Absent} icon={UserX} color="red" />
                <Stat label="Late" value={counts.Late} icon={Clock} color="amber" />
                <Stat label="Half Day" value={counts['Half Day']} icon={Minus} color="blue" />
              </div>

              {/* Attendance Roster */}
              <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-lg border border-stone-100 dark:border-stone-800 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-stone-800">
                  <h3 className="font-bold text-stone-800 dark:text-stone-100">Class {classFilter}-{sectionFilter} · {markDate} · {classStudents.length} Students</h3>
                  <button onClick={handleSave}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg ${saved ? 'bg-stone-200 dark:bg-stone-700 text-stone-500' : 'bg-emerald-600 text-white hover:opacity-90'}`}>
                    {saved ? <><CheckCircle2 className="w-4 h-4" />Saved</> : <><Check className="w-4 h-4" />Save Attendance</>}
                  </button>
                </div>
                <div className="divide-y divide-stone-100 dark:divide-stone-800">
                  {classStudents.map((student, idx) => {
                    const status = getStatus(student.student_id);
                    const cfg = STATUS_CONFIG[status];
                    return (
                      <div key={student.student_id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
                        <span className="text-xs font-bold text-stone-500 w-6">{idx + 1}</span>
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {student.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-stone-800 dark:text-stone-100 truncate">{student.name}</p>
                          <p className="text-xs text-stone-500">{student.student_id}</p>
                        </div>
                        {/* Status Toggle */}
                        <button onClick={() => cycleStatus(student.student_id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold text-xs transition-all ${cfg.bg} ${cfg.color}`}>
                          <cfg.icon className="w-3 h-3" />{status}
                        </button>
                        {/* Note input shown only for Absent/Late */}
                        {(status === 'Absent' || status === 'Late') && (
                          <input placeholder="Note..." value={notes[student.student_id] || ''}
                            onChange={e => setNotes(p => ({ ...p, [student.student_id]: e.target.value }))}
                            className="w-40 px-3 py-1.5 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-700 dark:text-stone-300 focus:ring-2 focus:ring-blue-500 outline-none" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ─── APPROVE LEAVE ─── */}
          {activeTab === 'leave' && (
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Stat label="Pending" value={leaveRequests.filter(l => l.status === 'Pending').length} icon={Clock} color="amber" />
                <Stat label="Approved" value={leaveRequests.filter(l => l.status === 'Approved').length} icon={CheckCircle2} color="emerald" />
                <Stat label="Rejected" value={leaveRequests.filter(l => l.status === 'Rejected').length} icon={X} color="red" />
              </div>

              {/* Filter */}
              <div className="flex gap-2 flex-wrap">
                {(['', 'Pending', 'Approved', 'Rejected'] as const).map(f => (
                  <button key={f} onClick={() => setLeaveFilter(f)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${leaveFilter === f ? 'bg-amber-600 text-white border-amber-600 shadow-lg' : 'bg-white dark:bg-stone-900 text-stone-500 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:border-amber-300'}`}>
                    {f || 'All Requests'}
                  </button>
                ))}
              </div>

              {/* Leave Queue */}
              <div className="space-y-3">
                {leaveRequests
                  .filter(l => !leaveFilter || l.status === leaveFilter)
                  .map(req => (
                    <motion.div key={req.id} layout
                      className="bg-white dark:bg-stone-900 rounded-2xl shadow-lg border border-stone-100 dark:border-stone-800 p-5">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                            {req.studentName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-stone-800 dark:text-stone-100">{req.studentName}</p>
                            <p className="text-xs text-stone-500">Class {req.class}-{req.section} · Applied: {req.appliedAt}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Calendar className="w-3.5 h-3.5 text-stone-500" />
                              <span className="text-xs font-bold text-stone-600 dark:text-stone-300">
                                {req.fromDate}{req.fromDate !== req.toDate ? ` → ${req.toDate}` : ''}
                              </span>
                            </div>
                            <p className="text-sm text-stone-600 dark:text-stone-400 mt-1.5 italic">"{req.reason}"</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase
                            ${req.status === 'Pending' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700' :
                              req.status === 'Approved' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700' :
                              'bg-red-100 dark:bg-red-900/30 text-red-700'}`}>
                            {req.status}
                          </span>
                          {req.status === 'Pending' && (
                            <div className="flex gap-2">
                              <button onClick={() => setLeaveRequests(p => p.map(l => l.id === req.id ? { ...l, status: 'Approved', reviewedBy: 'Admin' } : l))}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:opacity-90 shadow-md">
                                <Check className="w-3 h-3" />Approve
                              </button>
                              <button onClick={() => setLeaveRequests(p => p.map(l => l.id === req.id ? { ...l, status: 'Rejected', reviewedBy: 'Admin' } : l))}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-xl text-xs font-bold hover:opacity-90 shadow-md">
                                <X className="w-3 h-3" />Reject
                              </button>
                            </div>
                          )}
                          {req.reviewedBy && (
                            <p className="text-[10px] text-stone-500">Reviewed by {req.reviewedBy}</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                {leaveRequests.filter(l => !leaveFilter || l.status === leaveFilter).length === 0 && (
                  <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-lg border border-stone-100 dark:border-stone-800 p-12 text-center">
                    <ClipboardList className="w-12 h-12 text-stone-400 mx-auto mb-3" />
                    <p className="text-stone-500 text-sm font-bold">No leave requests found.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── ATTENDANCE BY DATE ─── */}
          {activeTab === 'by-date' && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-lg border border-stone-100 dark:border-stone-800 p-5">
                <div className="flex flex-wrap gap-4 items-end">
                  <div>
                    <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 mb-1.5 uppercase tracking-wider">Date</label>
                    <input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)}
                      className="px-4 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm font-bold text-stone-800 dark:text-stone-100 focus:ring-2 focus:ring-violet-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 mb-1.5 uppercase tracking-wider">Class</label>
                    <select value={reportClass} onChange={e => setReportClass(e.target.value)}
                      className="px-4 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm font-bold text-stone-800 dark:text-stone-100 focus:ring-2 focus:ring-violet-500 outline-none">
                      <option value="">All Classes</option>
                      {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 mb-1.5 uppercase tracking-wider">Section</label>
                    <select value={reportSection} onChange={e => setReportSection(e.target.value)}
                      className="px-4 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm font-bold text-stone-800 dark:text-stone-100 focus:ring-2 focus:ring-violet-500 outline-none">
                      <option value="">All Sections</option>
                      {SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Stat label="Total Marked" value={reportRecords.length} icon={Users} color="violet" />
                <Stat label="Present" value={reportCounts.Present} icon={UserCheck} color="emerald" />
                <Stat label="Absent" value={reportCounts.Absent} icon={UserX} color="red" />
                <Stat label="Late / Half" value={reportCounts.Late + reportCounts['Half Day']} icon={Clock} color="amber" />
              </div>

              {/* Attendance % bar */}
              {reportRecords.length > 0 && (
                <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-lg border border-stone-100 dark:border-stone-800 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-bold text-stone-700 dark:text-stone-300">Attendance Rate</p>
                    <p className="text-xl font-bold text-emerald-600">{Math.round((reportCounts.Present / reportRecords.length) * 100)}%</p>
                  </div>
                  <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
                    {reportCounts.Present > 0 && <div style={{ flex: reportCounts.Present }} className="bg-emerald-500 rounded-full" />}
                    {reportCounts.Late > 0 && <div style={{ flex: reportCounts.Late }} className="bg-amber-400 rounded-full" />}
                    {reportCounts['Half Day'] > 0 && <div style={{ flex: reportCounts['Half Day'] }} className="bg-blue-400 rounded-full" />}
                    {reportCounts.Absent > 0 && <div style={{ flex: reportCounts.Absent }} className="bg-red-400 rounded-full" />}
                  </div>
                  <div className="flex gap-4 mt-2 text-[10px] font-bold text-stone-500">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Present</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Late</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />Half Day</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />Absent</span>
                  </div>
                </div>
              )}

              {/* Records Table */}
              <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-lg border border-stone-100 dark:border-stone-800 overflow-hidden">
                <div className="overflow-x-auto">
                  {reportRecords.length === 0 ? (
                    <div className="p-12 text-center">
                      <BarChart3 className="w-12 h-12 text-stone-400 mx-auto mb-3" />
                      <p className="text-stone-500 text-sm font-bold">No attendance records for this date/filter.</p>
                      <p className="text-stone-400 text-xs mt-1">Mark attendance in the "Student Attendance" tab first.</p>
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-stone-50 dark:bg-stone-800/50">
                        <tr><TH>Student ID</TH><TH>Name</TH><TH>Class</TH><TH>Section</TH><TH>Date</TH><TH>Status</TH><TH>Note</TH></tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                        {reportRecords.map(r => (
                          <tr key={r.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30">
                            <TD><span className="font-bold text-stone-800 dark:text-stone-100">{r.studentId}</span></TD>
                            <TD><span className="font-bold text-stone-800 dark:text-stone-100">{r.studentName}</span></TD>
                            <TD>Class {r.class}</TD>
                            <TD>{r.section}</TD>
                            <TD>{r.date}</TD>
                            <TD>
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${STATUS_CONFIG[r.status].bg} ${STATUS_CONFIG[r.status].color}`}>
                                {r.status}
                              </span>
                            </TD>
                            <TD><span className="text-xs text-stone-500 italic">{r.note || '—'}</span></TD>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}
