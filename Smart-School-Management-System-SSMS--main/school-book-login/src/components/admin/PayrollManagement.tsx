import React, { useState } from 'react';
import { useApp, OperationType, handleFirestoreError } from '../../context/AppContext';
import { db, doc, updateDoc } from '../../localDatabase';
import { SalaryRecord } from '../../types';

export const PayrollManagement = () => {
  const { teachers, setIsLoading, setNotification } = useApp();
  const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const handleDisburseSalary = async (teacherId: string) => {
    setIsLoading(true);
    const teacher = teachers.find(t => t.teacher_id === teacherId);
    if (!teacher) {
      setIsLoading(false);
      return;
    }

    const newRecord: SalaryRecord = {
      id: `SAL-${teacherId}-${selectedMonth}-${selectedYear}`,
      month: selectedMonth,
      year: selectedYear,
      basic: teacher.salary.basic,
      allowances: teacher.salary.allowances,
      deductions: 0,
      net: teacher.salary.basic + teacher.salary.allowances,
      paidAt: new Date().toISOString()
    };

    try {
      const teacherRef = doc(db, 'teachers', teacherId);
      await updateDoc(teacherRef, {
        'salary.history': [newRecord, ...(teacher.salary.history || [])]
      });
      setNotification({ message: `Salary disbursed to ${teacher.name}`, type: 'success' });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `teachers/${teacherId}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-stone-950 dark:text-stone-50">Payroll Management</h3>
          <p className="text-xs text-stone-500">Manage staff salaries and disbursements</p>
        </div>
        <div className="flex gap-2">
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="p-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-xs font-bold outline-none dark:text-stone-100"
          >
            {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="p-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-xs font-bold outline-none dark:text-stone-100"
          >
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-xl border border-stone-100 dark:border-stone-800 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-100 dark:border-stone-800 font-bold text-stone-500 text-xs uppercase tracking-widest">
              <th className="p-4">Staff Name</th>
              <th className="p-4">Role</th>
              <th className="p-4">Basic</th>
              <th className="p-4">Net Salary</th>
              <th className="p-4">Status</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map(teacher => {
              const isPaid = teacher.salary.history?.some(h => h.month === selectedMonth && h.year === selectedYear);
              return (
                <tr key={teacher.teacher_id} className="border-b border-stone-50 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                  <td className="p-4 font-bold text-stone-800 dark:text-stone-100">{teacher.name}</td>
                  <td className="p-4 text-stone-600 dark:text-stone-400">Teacher</td>
                  <td className="p-4 text-stone-600 dark:text-stone-400">${teacher.salary.basic}</td>
                  <td className="p-4 font-bold text-stone-800 dark:text-stone-100">${teacher.salary.basic + teacher.salary.allowances}</td>
                  <td className="p-4">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                      isPaid ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                    }`}>
                      {isPaid ? 'Paid' : 'Pending'}
                    </span>
                  </td>
                  <td className="p-4">
                    {!isPaid && (
                      <button 
                        onClick={() => handleDisburseSalary(teacher.teacher_id)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-bold text-xs"
                      >
                        Disburse
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
