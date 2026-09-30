import React, { useState } from 'react';
import { Award, GraduationCap } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { generatePerformanceReport } from '../../services/geminiService';
import { ExamResult } from '../../types';
import { 
  LineChart, 
  Line, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  BarChart, 
  Bar 
} from 'recharts';

export const StudentPortal = () => {
  const { students, loggedInUser, attendanceRecords, examResults, setNotification } = useApp();
  const student = students.find(s => s.email === loggedInUser?.email);
  const [report, setReport] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!student) return <div className="dark:text-stone-100">Student profile not found.</div>;

  const results = examResults.filter(r => r.student_id === student.student_id);
  const attendance = attendanceRecords.filter(r => r.student_id === student.student_id);

  // Prepare Grade Data
  const gradePoints: { [key: string]: number } = {
    'A+': 4.0, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D+': 1.3, 'D': 1.0, 'F': 0.0
  };
  const gradeData = results
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(r => ({
      date: r.date,
      subject: r.subject,
      gpa: gradePoints[r.grade] || 0
    }));

  // Prepare Attendance Data
  const attendanceData = attendance
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(r => ({
      date: r.date,
      status: r.status === 'Present' ? 1 : 0
    }));

  const calculateGPA = (resultsList: ExamResult[]) => {
    if (resultsList.length === 0) return "0.00";
    const totalPoints = resultsList.reduce((acc, curr) => acc + (gradePoints[curr.grade] || 0), 0);
    return (totalPoints / resultsList.length).toFixed(2);
  };

  const gpa = calculateGPA(results);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      const reportText = await generatePerformanceReport(student.name, results);
      setReport(reportText);
    } catch (err) {
      console.error(err);
      setNotification({ message: 'Failed to generate report.', type: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800 relative overflow-hidden">
          <h3 className="text-sm font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest mb-4">Attendance</h3>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">98%</div>
              <p className="text-xs text-stone-500 dark:text-stone-500 mt-1">Present this month</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800">
          <h3 className="text-sm font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest mb-4">GPA</h3>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{gpa}</div>
          <p className="text-xs text-stone-500 dark:text-stone-500 mt-1">Academic performance</p>
        </div>
        <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800">
          <h3 className="text-sm font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest mb-4">Fee Status</h3>
          <div className={`text-3xl font-bold ${student.fees?.status === 'Paid' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            {student.fees?.status || 'Pending'}
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-500 mt-1">Next due: April 1st</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
        <div className="bg-white dark:bg-stone-900 p-8 rounded-3xl shadow-xl border border-stone-100 dark:border-stone-800">
          <h3 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-6">Academic Progress</h3>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={gradeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 4]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="gpa" stroke="#2563eb" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white dark:bg-stone-900 p-8 rounded-3xl shadow-xl border border-stone-100 dark:border-stone-800">
          <h3 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-6">Attendance Trend</h3>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 1]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="status" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-stone-900 p-8 rounded-3xl shadow-xl border border-stone-100 dark:border-stone-800">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-stone-800 dark:text-stone-100">Academic Performance</h3>
          <div className="flex items-center gap-4">
            <button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition-colors"
            >
              {isGenerating ? 'Generating...' : 'Generate AI Report'}
            </button>
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <Award className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">GPA: {gpa}</span>
            </div>
          </div>
        </div>
        {report && (
          <div className="p-4 mb-4 bg-stone-50 dark:bg-stone-800 rounded-2xl text-stone-700 dark:text-stone-300 text-sm whitespace-pre-line">
            {report}
          </div>
        )}
        <div className="space-y-4">
          {results.length > 0 ? (
            results.map((result, idx) => (
              <div key={result.id || idx} className="flex justify-between items-center p-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
                <div>
                  <p className="font-bold text-stone-800 dark:text-stone-200">{result.subject}</p>
                  <p className="text-xs text-stone-500 dark:text-stone-500">{result.examName}</p>
                </div>
                <div className="text-right">
                  <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">{result.grade}</span>
                  <p className="text-[10px] text-stone-500 dark:text-stone-500 font-bold">{result.marksObtained}/{result.maxMarks}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <GraduationCap className="w-12 h-12 text-stone-200 dark:text-stone-700 mx-auto mb-4" />
              <p className="text-stone-500 dark:text-stone-400">No academic records found yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
