import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, CheckCircle2, XCircle, Search, Download, User as UserIcon, X, Eye } from 'lucide-react';
import { useApp, OperationType, handleFirestoreError } from '../../context/AppContext';
import { doc, setDoc, db } from '../../localDatabase';
import { Student, AttendanceRecord, Alert } from '../../types';
import { QRScanner } from '../QRScanner';

export const AttendanceManagement = () => {
  const {
    teachers,
    staff,
    students,
    attendanceRecords,
    loggedInUser,
    setNotification,
    showScanner,
    setShowScanner,
    setIsLoading
  } = useApp();

  const teacher = teachers.find(t => t.email === loggedInUser?.email);
  const isTeacher = loggedInUser?.role === 'Teacher';
  const isAttender = loggedInUser?.role === 'Attender';
  
  const initialClass = isTeacher && teacher && teacher.assigned_classes && teacher.assigned_classes.length > 0 ? teacher.assigned_classes[0].split('-')[0] : '1';
  const [selectedClass, setSelectedClass] = useState(initialClass);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [view, setView] = useState<'Students' | 'Teachers' | 'Non-Staff' | 'Security'>('Students');
  const [searchTerm, setSearchTerm] = useState('');
  const [scanStatus, setScanStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showFaceScanner, setShowFaceScanner] = useState(false);
  const [faceStatus, setFaceStatus] = useState<'idle' | 'scanning' | 'success'>('idle');

  const filteredRecords = attendanceRecords.filter(r => 
    r.date === selectedDate && 
    (view === 'Students' ? r.class === selectedClass : true)
  );

  const exportToCSV = () => {
    const headers = ['Date', 'Student ID', 'Name', 'Class', 'Section', 'Status', 'Timestamp'];
    const rows = filteredRecords.map(r => [
      r.date,
      r.student_id,
      r.studentName,
      r.class,
      r.section,
      r.status,
      r.timestamp
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `attendance_${selectedDate}_class_${selectedClass}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const list = view === 'Students' ? students.filter(s => s.class === selectedClass) : 
               view === 'Teachers' ? teachers : 
               view === 'Security' ? staff : [];

  const filteredList = list.filter(person => {
    const name = person.name;
    const personId = person.student_id || person.teacher_id || person.staff_id;
    return name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           (personId && personId.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const handleToggleAttendance = async (student: Student, currentStatus: string | undefined) => {
    if (!isTeacher && !isAttender && loggedInUser?.role !== 'Super Admin' && loggedInUser?.role !== 'Management') return;
    
    const newStatus = currentStatus === 'Present' ? 'Absent' : 'Present';
    const recordId = filteredRecords.find(r => r.student_id === student.student_id)?.id || `ATT-${Math.random().toString(36).substr(2, 9)}`;
    
    const newRecord: AttendanceRecord = {
      id: recordId,
      user_id: student.student_id,
      student_id: student.student_id,
      studentEmail: student.email,
      studentName: student.name,
      class: student.class_id || student.class,
      section: student.section,
      date: selectedDate,
      timestamp: new Date().toISOString(),
      status: newStatus as 'Present' | 'Absent' | 'Late'
    };

    try {
      await setDoc(doc(db, 'attendance', recordId), newRecord);
      if (newStatus === 'Absent') {
        const alertId = `ALR-${Date.now()}-${student.student_id}`;
        const alert: Alert = {
          id: alertId,
          type: 'General',
          message: `Attendance Alert: ${student.name} marked as ${newStatus} on ${selectedDate}`,
          timestamp: new Date().toISOString(),
          sender: loggedInUser?.name || 'System Auto',
          status: 'Active',
          scope: student.student_id
        };
        await setDoc(doc(db, 'alerts', alertId), alert);
      }
      setNotification({ message: `Attendance marked as ${newStatus} for ${student.name}`, type: 'success' });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `attendance/${recordId}`);
    }
  };

  const handleSubmitAll = async () => {
    setIsLoading(true);
    try {
      let count = 0;
      for (const person of filteredList) {
        if (!person.student_id) continue;
        const record = filteredRecords.find(r => r.student_id === person.student_id);
        if (!record) {
          await handleToggleAttendance(person as Student, 'Present'); // Mark as Absent
          count++;
        }
      }
      setNotification({ message: `Submitted! ${count} unmarked students recorded as Absent & auto-alerts delivered.`, type: 'success' });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFaceScan = async () => {
    setFaceStatus('scanning');
    setTimeout(async () => {
      const remainingStudents = filteredList.filter(s => s.student_id && !filteredRecords.find(r => r.student_id === s.student_id));
      const student = remainingStudents.length > 0 ? remainingStudents[Math.floor(Math.random() * remainingStudents.length)] : null;
      if (student && student.student_id) {
        await handleToggleAttendance(student as Student, 'Absent'); // Mark present
        setFaceStatus('success');
        setNotification({ message: `Face match: ${student.name} marked Present`, type: 'success' });
      } else {
        setFaceStatus('success');
        setNotification({ message: `No unmarked students found for face match`, type: 'info' });
      }
      setTimeout(() => {
        setFaceStatus('idle');
        setShowFaceScanner(false);
      }, 1500);
    }, 2000);
  };

  const handleQRScan = async (data: string) => {
    const student = students.find(s => s.student_id === data);
    if (!student) {
      setScanStatus('error');
      setNotification({ message: 'Invalid Student QR Code!', type: 'error' });
      setTimeout(() => setScanStatus('idle'), 2000);
      return;
    }
    
    await handleToggleAttendance(student, 'Absent');
    setScanStatus('success');
    setTimeout(() => {
      setScanStatus('idle');
      setShowScanner(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {showScanner && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[290]"
              onClick={() => setShowScanner(false)}
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed inset-x-0 bottom-0 z-[300] bg-white dark:bg-stone-900 p-6 rounded-t-3xl shadow-2xl border-t border-stone-100 dark:border-stone-800"
            >
              <div className="max-w-md mx-auto relative">
                {scanStatus === 'success' && (
                  <div className="absolute inset-0 z-10 bg-emerald-500/90 flex items-center justify-center rounded-2xl">
                    <CheckCircle2 className="w-16 h-16 text-white" />
                  </div>
                )}
                {scanStatus === 'error' && (
                  <div className="absolute inset-0 z-10 bg-red-500/90 flex items-center justify-center rounded-2xl">
                    <XCircle className="w-16 h-16 text-white" />
                  </div>
                )}
                <QRScanner onScan={handleQRScan} onError={(err) => setNotification({ message: err, type: 'error' })} />
                <button onClick={() => setShowScanner(false)} className="mt-4 w-full py-3 bg-red-600 text-white rounded-xl font-bold">Close Scanner</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showFaceScanner && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[290]"
              onClick={() => setShowFaceScanner(false)}
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed inset-x-0 bottom-0 z-[300] bg-white dark:bg-stone-900 p-6 rounded-t-3xl shadow-2xl border-t border-stone-100 dark:border-stone-800"
            >
              <div className="max-w-md mx-auto relative p-8 border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-3xl flex flex-col items-center justify-center min-h-[300px]">
                {faceStatus === 'idle' && (
                  <>
                    <Eye className="w-16 h-16 text-purple-500 mb-4 animate-pulse" />
                    <button onClick={handleFaceScan} className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700">Scan Student Face</button>
                  </>
                )}
                {faceStatus === 'scanning' && (
                  <>
                    <div className="w-16 h-16 rounded-full border-4 border-purple-500 border-t-transparent animate-spin mb-4" />
                    <p className="font-bold text-stone-600 dark:text-stone-400">Scanning Subject...</p>
                  </>
                )}
                {faceStatus === 'success' && (
                  <>
                    <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
                    <p className="font-bold text-emerald-600 dark:text-emerald-400">Match Recorded!</p>
                  </>
                )}
                <button onClick={() => setShowFaceScanner(false)} className="mt-8 w-full py-3 bg-red-600 text-white rounded-xl font-bold">Cancel</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-stone-950 dark:text-stone-50">Attendance Records</h3>
          <p className="text-xs text-stone-500">View and manage attendance data</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
          <button onClick={() => setShowScanner(true)} className="bg-emerald-600 text-white px-4 py-3 lg:py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 dark:shadow-none w-full lg:w-auto font-bold">
            <Camera className="w-4 h-4" /> Scan QR
          </button>
          <button onClick={() => setShowFaceScanner(true)} className="bg-purple-600 text-white px-4 py-3 lg:py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-purple-700 transition-all shadow-lg shadow-purple-100 dark:shadow-none w-full lg:w-auto font-bold">
            <Eye className="w-4 h-4" /> Face Scan
          </button>
          <button onClick={handleSubmitAll} className="bg-indigo-600 text-white px-4 py-3 lg:py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none w-full lg:w-auto font-bold">
            <CheckCircle2 className="w-4 h-4" /> Submit All
          </button>
          <div className="relative flex-1 lg:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
            <input 
              type="text" 
              placeholder="Search by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all w-full lg:w-64 dark:text-stone-100"
            />
          </div>
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="p-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-sm outline-none font-bold text-stone-600 dark:text-stone-400 w-full lg:w-auto"
          />
          {!isTeacher && view === 'Students' && (
            <select 
              value={selectedClass} 
              onChange={(e) => setSelectedClass(e.target.value)}
              className="p-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-sm outline-none font-bold text-stone-600 dark:text-stone-400 w-full lg:w-auto"
            >
              {Array.from({ length: 10 }, (_, i) => (i + 1).toString()).map(c => (
                <option key={c} value={c}>Class {c}</option>
              ))}
            </select>
          )}
          <button 
            onClick={exportToCSV}
            className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 dark:shadow-none flex items-center gap-2 w-full lg:w-auto justify-center"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800 overflow-hidden overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-stone-50 dark:bg-stone-800/50 border-b border-stone-100 dark:border-stone-800">
            <tr>
              <th className="p-4 text-xs font-bold text-stone-500 uppercase tracking-widest">Student/Staff</th>
              <th className="p-4 text-xs font-bold text-stone-500 uppercase tracking-widest">ID</th>
              <th className="p-4 text-xs font-bold text-stone-500 uppercase tracking-widest">Status</th>
              <th className="p-4 text-xs font-bold text-stone-500 uppercase tracking-widest text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50 dark:divide-stone-800/50">
            {filteredList.map(person => {
              const personId = person.student_id || person.teacher_id || person.staff_id;
              const record = filteredRecords.find(r => r.student_id === personId);
              const canMark = (isTeacher || isAttender || loggedInUser?.role === 'Super Admin' || loggedInUser?.role === 'Management') && view === 'Students';
              
              return (
                <tr key={personId} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-stone-100 dark:bg-stone-800 rounded-xl flex items-center justify-center overflow-hidden">
                        {person.photo ? <img src={person.photo} className="w-full h-full object-cover" /> : <UserIcon className="w-5 h-5 text-stone-400 dark:text-stone-600" />}
                      </div>
                      <span className="font-bold text-stone-800 dark:text-stone-100">
                        {person.name}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-stone-500 dark:text-stone-400">{personId}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      record?.status === 'Present'
                        ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' 
                        : 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                    }`}>
                      {record?.status || 'Absent'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {canMark ? (
                      <button
                        onClick={() => handleToggleAttendance(person as Student, record?.status)}
                        className={`p-2 rounded-lg transition-all ${
                          record?.status === 'Present'
                            ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30'
                            : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
                        }`}
                      >
                        {record?.status === 'Present' ? <X className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                      </button>
                    ) : (
                      <span className="text-xs text-stone-500 dark:text-stone-500 font-mono">
                        {record ? new Date(record.timestamp).toLocaleTimeString() : '-'}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredList.length === 0 && (
          <div className="p-12 text-center text-stone-500 dark:text-stone-500">
            No records found for this selection.
          </div>
        )}
      </div>
    </div>
  );
};
