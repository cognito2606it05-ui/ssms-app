import React, { useState } from 'react';
import { Filter, Plus, Trash2, User as UserIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Skeleton } from '../shared/Skeleton';

export const TeacherManagement = () => {
  const {
    teachers,
    isTeachersLoading,
    teacherSubjectFilter,
    setTeacherSubjectFilter,
    setShowAddModal,
    setViewingIDCard,
    setNotification,
    setEditingTeacher,
    removeTeacher
  } = useApp();

  const [sortConfig, setSortConfig] = useState<{ key: 'name' | 'salary' | 'joiningDate'; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
  const subjects = ['All', ...Array.from(new Set(teachers.map(t => t.subject || ''))).filter(Boolean)];
  
  const filteredTeachers = teacherSubjectFilter === 'All' 
    ? teachers 
    : teachers.filter(t => t.subject === teacherSubjectFilter);

  const sortedTeachers = [...filteredTeachers].sort((a, b) => {
    let aValue: any = a[sortConfig.key];
    let bValue: any = b[sortConfig.key];
    
    if (sortConfig.key === 'salary') {
      aValue = a.salary?.basic ?? 0;
      bValue = b.salary?.basic ?? 0;
    }

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400">Manage Teachers</h3>
          <p className="text-xs text-stone-500">Manage staff records, salaries, and documents</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
            <select
              value={teacherSubjectFilter}
              onChange={(e) => setTeacherSubjectFilter(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 outline-none appearance-none min-w-[150px] dark:text-stone-100"
            >
              {subjects.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
          <select
            value={`${sortConfig.key}-${sortConfig.direction}`}
            onChange={(e) => {
              const [key, direction] = e.target.value.split('-') as ['name' | 'salary' | 'joiningDate', 'asc' | 'desc'];
              setSortConfig({ key, direction });
            }}
            className="px-4 py-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 outline-none dark:text-stone-100"
          >
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="salary-asc">Salary (Low-High)</option>
            <option value="salary-desc">Salary (High-Low)</option>
            <option value="joiningDate-asc">Joining Date (Oldest)</option>
            <option value="joiningDate-desc">Joining Date (Newest)</option>
          </select>
          <button 
            onClick={() => setShowAddModal('teacher')}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 dark:shadow-none whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Add Teacher
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isTeachersLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800 space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton className="w-16 h-16 rounded-2xl" />
                <div className="space-y-2">
                  <Skeleton className="w-32 h-4" />
                  <Skeleton className="w-24 h-3" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-10 rounded-lg" />
                <Skeleton className="h-10 rounded-lg" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="flex-1 h-8 rounded-lg" />
                <Skeleton className="flex-1 h-8 rounded-lg" />
                <Skeleton className="flex-1 h-8 rounded-lg" />
              </div>
            </div>
          ))
        ) : sortedTeachers.map(teacher => (
          <div key={teacher.teacher_id} className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800 space-y-4 relative group hover:border-blue-200 dark:hover:border-blue-900 transition-all">
            <button 
              onClick={() => removeTeacher(teacher.teacher_id)}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 overflow-hidden border border-blue-100 dark:border-blue-900/30">
                {teacher.photo ? <img src={teacher.photo} className="w-full h-full object-cover" /> : <UserIcon className="w-8 h-8" />}
              </div>
              <div>
                <h4 className="font-bold text-stone-800 dark:text-stone-100">{teacher.name}</h4>
                <p className="text-xs text-stone-500 dark:text-stone-400">{teacher.subject || (teacher.subjects && teacher.subjects[0])} • {teacher.classSection || (teacher.assigned_classes && teacher.assigned_classes[0])}</p>
                <p className="text-[10px] text-stone-500 dark:text-stone-500 font-bold uppercase tracking-widest mt-1">Joined: {teacher.joiningDate || 'N/A'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-stone-50 dark:bg-stone-800 rounded-lg">
                <p className="text-stone-500 dark:text-stone-500">Salary</p>
                <p className="font-bold text-stone-800 dark:text-stone-100">${teacher.salary?.basic ?? 0}</p>
              </div>
              <div className="p-2 bg-stone-50 dark:bg-stone-800 rounded-lg">
                <p className="text-stone-500 dark:text-stone-500">Phone</p>
                <p className="font-medium dark:text-stone-300">{teacher.phone || 'N/A'}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setViewingIDCard(teacher)}
                className="flex-1 py-2 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              >
                ID Card
              </button>
              <button 
                onClick={() => setNotification({ message: `Generating Joining Letter for ${teacher.name}...\nSalary: $${teacher.salary?.basic || 0}\nDate: ${teacher.joiningDate || 'N/A'}`, type: 'info' })}
                className="flex-1 py-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
              >
                Joining Letter
              </button>
              <button 
                onClick={() => setEditingTeacher(teacher)}
                className="flex-1 py-2 text-[10px] font-bold text-stone-600 dark:text-stone-400 bg-stone-50 dark:bg-stone-800 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
              >
                Edit Profile
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
