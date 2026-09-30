import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, BookOpen as BookIcon, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Subject } from '../../types';

export const SubjectManagement = () => {
  const { schoolSubjects, setSchoolSubjects } = useApp();
  const [selectedClass, setSelectedClass] = useState('1');
  
  const subjects = schoolSubjects.filter(s => s.class === selectedClass);

  const handleAddSubject = () => {
    const name = prompt('Enter subject name:');
    if (name) {
      const newSubject: Subject = {
        id: `SUB-${Math.random().toString(36).substr(2, 9)}`,
        name,
        class: selectedClass,
        teacherId: ''
      };
      setSchoolSubjects(prev => [...prev, newSubject]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-stone-950 dark:text-stone-50">Subject Management</h3>
        <div className="flex gap-4">
          <select 
            value={selectedClass} 
            onChange={(e) => setSelectedClass(e.target.value)}
            className="p-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-sm outline-none dark:text-stone-100"
          >
            {Array.from({ length: 10 }, (_, i) => (i + 1).toString()).map(c => (
              <option key={c} value={c}>Class {c}</option>
            ))}
          </select>
          <button 
            onClick={handleAddSubject}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 dark:shadow-none"
          >
            <Plus className="w-4 h-4" /> Add Subject
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {subjects.length > 0 ? subjects.map((subject, i) => (
          <motion.div 
            key={subject.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800 flex items-center justify-between hover:border-blue-200 dark:hover:border-blue-900 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <BookIcon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-stone-800 dark:text-stone-100">{subject.name}</h4>
                <p className="text-[10px] text-stone-500 dark:text-stone-500 uppercase font-bold tracking-widest">Core Subject</p>
              </div>
            </div>
            <button 
              onClick={() => setSchoolSubjects(prev => prev.filter(s => s.id !== subject.id))}
              className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </motion.div>
        )) : (
          <div className="col-span-full py-12 text-center bg-white dark:bg-stone-900 rounded-3xl border border-dashed border-stone-200 dark:border-stone-800">
            <p className="text-stone-500 dark:text-stone-500">No subjects added for Class {selectedClass} yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};
