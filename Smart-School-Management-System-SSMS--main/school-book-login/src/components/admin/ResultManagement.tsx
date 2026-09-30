import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useApp, OperationType, handleFirestoreError } from '../../context/AppContext';
import { db, doc, setDoc } from '../../localDatabase';
import { CLASSES, SECTIONS } from '../../constants';
import { ExamResult } from '../../types';

export const ResultManagement = () => {
  const {
    teachers,
    schoolSubjects,
    students,
    loggedInUser,
    setNotification
  } = useApp();

  const teacher = teachers.find(t => t.email === loggedInUser?.email);
  const isTeacher = loggedInUser?.role === 'Teacher';
  const initialClass = isTeacher && teacher && teacher.assigned_classes && teacher.assigned_classes.length > 0 ? teacher.assigned_classes[0].split('-')[0] : CLASSES[0];
  const initialSection = isTeacher && teacher && teacher.assigned_classes && teacher.assigned_classes.length > 0 ? teacher.assigned_classes[0].split('-')[1] || SECTIONS[0] : SECTIONS[0];
  
  const [selectedClass, setSelectedClass] = useState(initialClass);
  const [selectedSection, setSelectedSection] = useState(initialSection);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [examName, setExamName] = useState('Midterm');
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);
  const [marks, setMarks] = useState<{ [student_id: string]: number }>({});
  const [sortOrder, setSortOrder] = useState('name_asc');

  const availableSubjects = schoolSubjects.filter(s => s.class === selectedClass);
  const baseFilteredStudents = students.filter(s => s.class === selectedClass && s.section === selectedSection);
  const filteredStudents = [...baseFilteredStudents].sort((a, b) => {
    if (sortOrder === 'name_asc') return a.name.localeCompare(b.name);
    if (sortOrder === 'name_desc') return b.name.localeCompare(a.name);
    const markA = marks[a.student_id] || 0;
    const markB = marks[b.student_id] || 0;
    if (sortOrder === 'marks_high') return markB - markA;
    if (sortOrder === 'marks_low') return markA - markB;
    return 0;
  });

  const handleSaveResults = async () => {
    if (!selectedSubject || !examName) {
      setNotification({ message: 'Please select subject and exam', type: 'error' });
      return;
    }

    try {
      for (const student of filteredStudents) {
        const mark = marks[student.student_id] || 0;
        const maxMarks = 100;
        const percentage = (mark / maxMarks) * 100;
        let grade = 'F';
        if (percentage >= 90) grade = 'A+';
        else if (percentage >= 80) grade = 'A';
        else if (percentage >= 70) grade = 'B';
        else if (percentage >= 60) grade = 'C';
        else if (percentage >= 50) grade = 'D';

        const result: ExamResult = {
          id: `RES-${student.student_id}-${examName}-${selectedSubject}`,
          student_id: student.student_id,
          studentName: student.name,
          class: selectedClass,
          section: selectedSection,
          subject: selectedSubject,
          examName,
          marksObtained: mark,
          maxMarks,
          grade,
          date: examDate,
          teacherId: teacher?.teacher_id || 'system'
        };

        await setDoc(doc(db, 'examResults', result.id), result);
      }
      setNotification({ message: 'Results published successfully!', type: 'success' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'examResults');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-stone-950 dark:text-stone-50">Result Management</h3>
          <p className="text-xs text-stone-500">Enter and publish exam results</p>
        </div>
        <button 
          onClick={handleSaveResults}
          className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 dark:shadow-none flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" /> Publish Results
        </button>
      </div>

      <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Class</label>
            <select 
              value={selectedClass} 
              onChange={(e) => {
                setSelectedClass(e.target.value);
                if (isTeacher && teacher?.assigned_classes) {
                  const match = teacher.assigned_classes.find(ac => ac.startsWith(e.target.value + '-'));
                  if (match) setSelectedSection(match.split('-')[1]);
                }
              }}
              disabled={isTeacher && (!teacher?.assigned_classes || teacher.assigned_classes.length <= 1)}
              className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-stone-100 disabled:opacity-50"
            >
              {isTeacher && teacher?.assigned_classes ? 
                Array.from(new Set(teacher.assigned_classes.map(c => c.split('-')[0]))).map((c: string) => (
                  <option key={c} value={c}>Grade {c}</option>
                ))
                : CLASSES.map(c => <option key={c} value={c}>Grade {c}</option>)
              }
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Section</label>
            <select 
              value={selectedSection} 
              onChange={(e) => setSelectedSection(e.target.value)}
              disabled={isTeacher && (!teacher?.assigned_classes || teacher.assigned_classes.length <= 1)}
              className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-stone-100 disabled:opacity-50"
            >
              {isTeacher && teacher?.assigned_classes ?
                Array.from(new Set(
                  teacher.assigned_classes
                    .filter(ac => ac.startsWith(selectedClass + '-'))
                    .map(ac => ac.split('-')[1])
                )).map((s: string) => <option key={s} value={s}>Section {s}</option>)
                : SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)
              }
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Subject</label>
            <select 
              value={selectedSubject} 
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-stone-100"
            >
              <option value="">Select Subject</option>
              {availableSubjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Exam</label>
            <select 
              value={examName} 
              onChange={(e) => setExamName(e.target.value)}
              className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-stone-100"
            >
              <option value="Midterm">Midterm</option>
              <option value="Final">Final</option>
              <option value="Quiz 1">Quiz 1</option>
              <option value="Quiz 2">Quiz 2</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Date</label>
            <input 
              type="date" 
              value={examDate} 
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-stone-100"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Sort By</label>
            <select 
              value={sortOrder} 
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-stone-100"
            >
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
              <option value="marks_high">Marks (High-Low)</option>
              <option value="marks_low">Marks (Low-High)</option>
            </select>
          </div>
        </div>

        <div className="overflow-hidden overflow-x-auto rounded-2xl border border-stone-100 dark:border-stone-800">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-100 dark:border-stone-800">
                <th className="p-4 text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Student ID</th>
                <th className="p-4 text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Student Name</th>
                <th className="p-4 text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Marks (out of 100)</th>
                <th className="p-4 text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50 dark:divide-stone-800">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-stone-500 dark:text-stone-500 italic">No students found in this section.</td>
                </tr>
              ) : (
                filteredStudents.map(student => (
                  <tr key={student.student_id} className="hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                    <td className="p-4 text-xs font-bold text-stone-500 dark:text-stone-400 font-mono">{student.student_id}</td>
                    <td className="p-4 font-bold text-stone-800 dark:text-stone-100">{student.name}</td>
                    <td className="p-4">
                      <input 
                        type="number" 
                        min="0" 
                        max="100"
                        value={marks[student.student_id] || ''}
                        onChange={(e) => setMarks(prev => ({ ...prev, [student.student_id]: Number(e.target.value) }))}
                        className="w-24 p-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-stone-100"
                      />
                    </td>
                    <td className="p-4 text-xs font-bold text-stone-500 dark:text-stone-400">{examDate}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
