import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, Filter, ChevronDown, Check, FileText } from 'lucide-react';
import { UserRole } from '../types';

interface TimetableProps {
  userRole: UserRole;
  studentClass?: string; // E.g. '5'
}

type PeriodType = 'Class' | 'Break' | 'Lunch' | 'SmallBreak';

interface PeriodMap {
  [day: string]: string[];
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ACADEMIC_YEARS = ['A.Y 2024-25', 'A.Y 2025-26', 'A.Y 2026-27'];
const CLASSES = Array.from({ length: 10 }, (_, i) => String(i + 1));
const MAIN_SUBJECTS = ['English', 'Telugu', 'Hindi', 'Maths', 'Science', 'Social'];
const ACTIVITIES = ['Study Hour', 'Games', 'Yoga', 'Study Hour', 'Karate', 'Library', ...MAIN_SUBJECTS]; 

const PERIOD_TIMES = [
  { label: '1', time: '9:30 - 10:15', type: 'Class' as PeriodType },
  { label: '2', time: '10:15 - 11:00', type: 'Class' as PeriodType },
  { label: 'Short Break', time: '11:00 - 11:15', type: 'Break' as PeriodType },
  { label: '3', time: '11:15 - 12:00', type: 'Class' as PeriodType },
  { label: '4', time: '12:00 - 12:45', type: 'Class' as PeriodType },
  { label: 'Lunch Break', time: '12:45 - 1:45', type: 'Lunch' as PeriodType },
  { label: '5', time: '1:45 - 2:30', type: 'Class' as PeriodType },
  { label: '6', time: '2:30 - 3:15', type: 'Class' as PeriodType },
  { label: 'Small Break', time: '3:15 - 3:30', type: 'SmallBreak' as PeriodType },
  { label: '7', time: '3:30 - 4:15', type: 'Class' as PeriodType },
  { label: '8', time: '4:15 - 5:00', type: 'Class' as PeriodType },
];

export const TimetableManagement: React.FC<TimetableProps> = ({ userRole, studentClass }) => {
  const isTeacherOrAdmin = userRole === 'Management' || userRole === 'Teacher' || userRole === 'Super Admin';
  
  const [selectedYear, setSelectedYear] = useState(ACADEMIC_YEARS[0]);
  const [selectedClass, setSelectedClass] = useState(studentClass ? studentClass.replace(/\D/g, '') || '1' : '1');
  const [subjectTeacherFilter, setSubjectTeacherFilter] = useState('All');

  useEffect(() => {
    if (studentClass && !isTeacherOrAdmin) {
      setSelectedClass(studentClass.replace(/\D/g, '') || '1');
    }
  }, [studentClass, isTeacherOrAdmin]);
  
  const timetable = useMemo(() => {
    const classOffset = parseInt(selectedClass) || 1;
    const yearOffset = ACADEMIC_YEARS.indexOf(selectedYear);
    const tbl: PeriodMap = {};
    
    // Create safe sequence: intertwine Study Hours so no 2 consecutive occur.
    const safeActs = [
      'Study Hour', 'Games', 
      'Yoga', 'English', 
      'Karate', 'Telugu', 
      'Study Hour', 'Hindi', 
      'Library', 'Maths', 
      'Science', 'Social'
    ];
    
    const shiftedActs = [...safeActs.slice((classOffset - 1) % 12), ...safeActs.slice(0, (classOffset - 1) % 12)];
    
    DAYS.forEach((day, dayIndex) => {
      const dailySubjects = [];
      const baseShift = classOffset + dayIndex + yearOffset;
      
      for (let p = 0; p < 6; p++) {
        dailySubjects.push(MAIN_SUBJECTS[(baseShift + p) % 6]);
      }
      
      dailySubjects.push(shiftedActs[dayIndex * 2]);
      dailySubjects.push(shiftedActs[dayIndex * 2 + 1]);
      
      tbl[day] = dailySubjects;
    });
    
    return tbl;
  }, [selectedClass, selectedYear]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800">
        <div>
          <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-100 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-500" />
            Class Timetable
          </h2>
          <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">
            Weekly schedule and activities
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col">
            <span className="text-xs text-stone-500 font-bold mb-1 ml-1 uppercase">Academic Year</span>
            <select 
              className="px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 md:bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm font-medium"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {isTeacherOrAdmin && (
            <div className="flex flex-col">
              <span className="text-xs text-stone-500 font-bold mb-1 ml-1 uppercase">Select Class</span>
              <select 
                className="px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 md:bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm font-medium"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option disabled>Select Class</option>
                {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
              </select>
            </div>
          )}

          {isTeacherOrAdmin && (
            <div className="flex flex-col">
              <span className="text-xs text-stone-500 font-bold mb-1 ml-1 uppercase">Filter / Sort</span>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 md:bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 shadow-sm">
                <Filter className="w-4 h-4 text-stone-500" />
                <select 
                  className="bg-transparent focus:outline-none font-medium"
                  value={subjectTeacherFilter}
                  onChange={(e) => setSubjectTeacherFilter(e.target.value)}
                >
                  <option value="All">All Subjects</option>
                  {MAIN_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  <option value="Study Hour">Study Hour</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-stone-50 dark:bg-stone-800/50">
                <th className="py-4 px-6 font-bold text-stone-600 dark:text-stone-300 border-b border-stone-200 dark:border-stone-700 w-48 text-center sticky left-0 bg-stone-50 dark:bg-stone-800 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Time / Period</th>
                {DAYS.map(day => (
                  <th key={day} className="py-4 px-6 font-bold text-stone-600 dark:text-stone-300 border-b border-stone-200 dark:border-stone-700 min-w-[140px] text-center">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {PERIOD_TIMES.map((period, index) => {
                if (period.type !== 'Class') {
                  const breaksColor = period.type === 'Lunch' ? 'bg-orange-50/50 dark:bg-orange-900/10 text-orange-600 dark:text-orange-400' : 'bg-blue-50/50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400';
                  
                  return (
                    <tr key={index} className={breaksColor}>
                      <td className="py-3 px-6 text-sm font-semibold text-stone-500 dark:text-stone-400 border-r border-stone-100 dark:border-stone-800 text-center sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] bg-white dark:bg-stone-900">
                        {period.time}
                      </td>
                      <td colSpan={6} className="py-3 px-6 text-center font-bold tracking-widest uppercase items-center relative overflow-hidden">
                        <div className="flex items-center justify-center gap-2">
                          {period.type === 'Lunch' ? '🥗 LUNCH BREAK' : '☕ ' + period.label.toUpperCase()}
                        </div>
                        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,1)_25%,rgba(0,0,0,1)_50%,transparent_50%,transparent_75%,rgba(0,0,0,1)_75%,rgba(0,0,0,1)_100%)] bg-[length:20px_20px]"></div>
                      </td>
                    </tr>
                  );
                }

                const periodIndex = parseInt(period.label) - 1;

                return (
                  <tr key={index} className="hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors group">
                    <td className="py-4 px-6 border-r border-stone-100 dark:border-stone-800 text-center sticky left-0 bg-white dark:bg-stone-900 group-hover:bg-stone-50 dark:group-hover:bg-stone-800/50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] transition-colors">
                      <div className="text-sm font-bold text-stone-800 dark:text-stone-200">Period {period.label}</div>
                      <div className="text-xs text-stone-500 dark:text-stone-400">{period.time}</div>
                    </td>
                    
                    {DAYS.map((day) => {
                      const subject = timetable[day][periodIndex];
                      const isHighlighted = subjectTeacherFilter !== 'All' && subject === subjectTeacherFilter;
                      const isFaded = subjectTeacherFilter !== 'All' && subject !== subjectTeacherFilter;
                      
                      return (
                        <td 
                          key={`${day}-${periodIndex}`} 
                          className={`py-4 px-6 text-center transition-all duration-300 ${
                            isHighlighted ? 'bg-blue-50 dark:bg-blue-900/40 ring-2 ring-blue-500 rounded-lg scale-105 z-20 relative shadow-lg' : ''
                          } ${isFaded ? 'opacity-20 scale-95' : ''}`}
                        >
                          <span className={`inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-bold w-full shadow-sm transition-transform hover:scale-105 ${
                             subject === 'Study Hour' || subject === 'Library' 
                               ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                               : subject === 'Games' || subject === 'Yoga' || subject === 'Karate'
                               ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border border-orange-200 dark:border-orange-800'
                               : 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border border-stone-200 dark:border-stone-700'
                          }`}>
                            {subject}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
