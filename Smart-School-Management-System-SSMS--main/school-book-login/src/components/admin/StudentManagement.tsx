import React, { useState, useRef } from 'react';
import { Search, LayoutGrid, List, Upload, Plus, Trash2, Eye, FileText, ChevronUp, ChevronDown, ArrowUpDown, User as UserIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Skeleton } from '../shared/Skeleton';
import { Student } from '../../types';

export const StudentManagement = () => {
  const {
    students,
    isStudentsLoading,
    teachers,
    loggedInUser,
    setShowAddModal,
    setViewingStudent,
    setViewingIDCard,
    setEditingStudent,
    removeStudent,
    handleBulkImport
  } = useApp();

  const isTeacher = loggedInUser?.role === 'Teacher';
  const teacher = teachers.find(t => t.email === loggedInUser?.email);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Student | 'fullName'; direction: 'asc' | 'desc' }>({ key: 'student_id', direction: 'asc' });
  const bulkImportInputRef = useRef<HTMLInputElement>(null);

  const filteredStudents = (isTeacher && teacher
    ? students.filter(s => teacher.assigned_classes?.includes(`${s.class}-${s.section}`))
    : students
  ).filter(s => 
    (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.student_id && s.student_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (s.class || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    let aValue: any = a[sortConfig.key as keyof Student];
    let bValue: any = b[sortConfig.key as keyof Student];

    if (sortConfig.key === 'fullName') {
      aValue = a.name;
      bValue = b.name;
    }

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (key: keyof Student | 'fullName') => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400">
            {isTeacher ? 'Students in Your Classes' : 'Manage Students'}
          </h3>
          <p className="text-xs text-stone-500">
            {isTeacher ? 'View and manage students in your assigned class' : 'Manage student enrollment and fee records'}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
            <input 
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-64 pl-10 pr-4 py-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-stone-100"
            />
          </div>
          <div className="flex bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-1">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-stone-100 dark:bg-stone-800 text-blue-600' : 'text-stone-500 hover:text-stone-600'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-stone-100 dark:bg-stone-800 text-blue-600' : 'text-stone-500 hover:text-stone-600'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          {!isTeacher && (
            <>
              <input 
                type="file" 
                accept=".csv" 
                ref={bulkImportInputRef} 
                onChange={handleBulkImport} 
                className="hidden" 
              />
              <button 
                onClick={() => bulkImportInputRef.current?.click()}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 dark:shadow-none"
              >
                <Upload className="w-4 h-4" /> Bulk Import
              </button>
            </>
          )}
          <button 
            onClick={() => setShowAddModal('student')}
            className="bg-green-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-green-700 transition-all shadow-lg shadow-green-100 dark:shadow-none whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Add Student
          </button>
        </div>
      </div>

      {isStudentsLoading ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
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
                </div>
                <Skeleton className="w-full h-10 rounded-lg" />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-xl border border-stone-100 dark:border-stone-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 dark:bg-stone-800/50 border-b border-stone-100 dark:border-stone-800">
                    {['ID', 'Name', 'Class', 'Section', 'Contact', 'Actions'].map(header => (
                      <th key={header} className="p-4"><Skeleton className="h-4 w-16" /></th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-stone-50 dark:border-stone-800/50">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="p-4"><Skeleton className="h-4 w-full" /></td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedStudents.map(student => (
            <div key={student.student_id} className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800 space-y-4 relative group hover:border-green-200 dark:hover:border-green-900 transition-all">
              {!isTeacher && (
                <button 
                  onClick={() => removeStudent(student.student_id)}
                  className="absolute top-4 right-4 p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-2xl flex items-center justify-center text-green-600 dark:text-green-400 overflow-hidden border border-green-100 dark:border-green-900/30">
                  {student.photo ? <img src={student.photo} className="w-full h-full object-cover" /> : <UserIcon className="w-8 h-8" />}
                </div>
                <div>
                  <h4 className="font-bold text-stone-800 dark:text-stone-100">{student.name}</h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400">Class {student.class}-{student.section}</p>
                  <p className="text-[10px] text-stone-500 dark:text-stone-500 font-bold uppercase tracking-widest mt-1">ID: {student.student_id}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-stone-50 dark:bg-stone-800 rounded-lg">
                  <p className="text-stone-500 dark:text-stone-500">Father</p>
                  <p className="font-medium dark:text-stone-300">{student.fatherName}</p>
                </div>
                <div className="p-2 bg-stone-50 dark:bg-stone-800 rounded-lg">
                  <p className="text-stone-500 dark:text-stone-500">Fees Status</p>
                  <p className={`font-bold ${student.fees?.status === 'Paid' ? 'text-emerald-600' : 'text-red-600'}`}>{student.fees?.status || 'Pending'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setViewingStudent(student)}
                  className="py-2 text-xs font-bold text-stone-600 dark:text-stone-400 bg-stone-50 dark:bg-stone-800 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                >
                  View Details
                </button>
                <button 
                  onClick={() => setViewingIDCard(student)}
                  className="py-2 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                >
                  ID Card
                </button>
              </div>
              <button 
                onClick={() => setEditingStudent(student)}
                className="w-full py-2 text-xs font-bold text-stone-600 dark:text-stone-400 bg-stone-50 dark:bg-stone-800 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
              >
                Edit Profile
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-xl border border-stone-100 dark:border-stone-800 overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-stone-50 dark:bg-stone-800/50 border-b border-stone-100 dark:border-stone-800 font-bold text-stone-500 text-xs uppercase tracking-widest">
                <th className="p-4 cursor-pointer hover:text-stone-600 dark:hover:text-stone-300" onClick={() => handleSort('student_id')}>
                  <div className="flex items-center gap-2">
                    Student ID {sortConfig.key === 'student_id' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-500" /> : <ChevronDown className="w-3 h-3 text-blue-500" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                  </div>
                </th>
                <th className="p-4 cursor-pointer hover:text-stone-600 dark:hover:text-stone-300" onClick={() => handleSort('fullName')}>
                  <div className="flex items-center gap-2">
                    Name {sortConfig.key === 'fullName' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-500" /> : <ChevronDown className="w-3 h-3 text-blue-500" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                  </div>
                </th>
                <th className="p-4 cursor-pointer hover:text-stone-600 dark:hover:text-stone-300" onClick={() => handleSort('class')}>
                  <div className="flex items-center gap-2">
                    Class {sortConfig.key === 'class' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-500" /> : <ChevronDown className="w-3 h-3 text-blue-500" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                  </div>
                </th>
                <th className="p-4 cursor-pointer hover:text-stone-600 dark:hover:text-stone-300" onClick={() => handleSort('section')}>
                  <div className="flex items-center gap-2">
                    Section {sortConfig.key === 'section' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-500" /> : <ChevronDown className="w-3 h-3 text-blue-500" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                  </div>
                </th>
                <th className="p-4 cursor-pointer hover:text-stone-600 dark:hover:text-stone-300" onClick={() => handleSort('phone')}>
                  <div className="flex items-center gap-2">
                    Contact {sortConfig.key === 'phone' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-500" /> : <ChevronDown className="w-3 h-3 text-blue-500" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                  </div>
                </th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedStudents.map(student => (
                <tr key={student.student_id} className="border-b border-stone-50 dark:border-stone-800/50 hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-colors">
                  <td className="p-4 text-sm font-mono font-bold text-stone-800 dark:text-stone-100">{student.student_id}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-stone-100 dark:bg-stone-800 rounded-lg overflow-hidden flex items-center justify-center">
                        {student.photo ? <img src={student.photo} className="w-full h-full object-cover" /> : <UserIcon className="w-4 h-4 text-stone-500" />}
                      </div>
                      <span className="text-sm font-bold text-stone-800 dark:text-stone-100">{student.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-stone-600 dark:text-stone-400">{student.class}</td>
                  <td className="p-4 text-sm text-stone-600 dark:text-stone-400">{student.section}</td>
                  <td className="p-4 text-sm text-stone-600 dark:text-stone-400">{student.phone}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setViewingStudent(student)} className="p-2 text-stone-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all" title="View Profile">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditingStudent(student)} className="p-2 text-stone-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all" title="Edit">
                        <FileText className="w-4 h-4" />
                      </button>
                      {!isTeacher && (
                        <button onClick={() => removeStudent(student.student_id)} className="p-2 text-stone-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
