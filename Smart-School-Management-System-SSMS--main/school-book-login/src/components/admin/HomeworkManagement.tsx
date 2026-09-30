import React, { useState } from 'react';
import { Plus, BookOpen as BookIcon, Trash2 } from 'lucide-react';
import { useApp, OperationType, handleFirestoreError } from '../../context/AppContext';
import { db, doc, setDoc, deleteDoc } from '../../localDatabase';
import { CLASSES, SECTIONS } from '../../constants';
import { Homework } from '../../types';

export const HomeworkManagement = () => {
  const {
    teachers,
    schoolSubjects,
    homeworks,
    loggedInUser,
    setNotification
  } = useApp();

  const [selectedClasses, setSelectedClasses] = useState<string[]>([CLASSES[0]]);
  const [selectedSections, setSelectedSections] = useState<string[]>([SECTIONS[0]]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');

  const teacher = teachers.find(t => t.email === loggedInUser?.email);
  const availableSubjects = schoolSubjects.filter(s => selectedClasses.includes(s.class));

  const handleAddHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject || !title || !dueDate || selectedClasses.length === 0 || selectedSections.length === 0) {
      setNotification({ message: 'Please fill all required fields and select at least one class and section', type: 'error' });
      return;
    }

    const homeworkPromises = selectedClasses.flatMap(cls => 
      selectedSections.map(sec => {
        const newHomework: Homework = {
          id: `HW-${Date.now()}-${cls}-${sec}-${Math.random().toString(36).substr(2, 5)}`,
          class: cls,
          section: sec,
          subject: selectedSubject,
          title,
          description,
          dueDate,
          teacherId: teacher?.teacher_id || 'system',
          teacherName: teacher ? teacher.name : 'System',
          createdAt: new Date().toISOString()
        };
        return setDoc(doc(db, 'homeworks', newHomework.id), newHomework);
      })
    );

    try {
      await Promise.all(homeworkPromises);
      setNotification({ message: 'Homework assigned successfully!', type: 'success' });
      setTitle('');
      setDescription('');
      setDueDate('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'homeworks');
    }
  };

  const deleteHomework = async (id: string) => {
    if (confirm('Are you sure you want to delete this homework?')) {
      try {
        await deleteDoc(doc(db, 'homeworks', id));
        setNotification({ message: 'Homework deleted', type: 'success' });
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `homeworks/${id}`);
      }
    }
  };

  const filteredHomeworks = homeworks.filter(hw => 
    selectedClasses.includes(hw.class) && 
    selectedSections.includes(hw.section) &&
    (loggedInUser?.role !== 'Teacher' || hw.teacherId === teacher?.teacher_id)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-stone-950 dark:text-stone-50">Homework Management</h3>
          <p className="text-xs text-stone-500">Assign and track subject-wise homework</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800">
          <h4 className="text-lg font-bold text-stone-800 dark:text-stone-100 mb-6">Assign New Homework</h4>
          <form onSubmit={handleAddHomework} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Classes</label>
                <div className="h-32 overflow-y-auto bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-xl p-2 space-y-1">
                  {CLASSES.map(c => (
                    <label key={c} className="flex items-center gap-2 text-xs text-stone-700 dark:text-stone-300 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={selectedClasses.includes(c)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedClasses([...selectedClasses, c]);
                          else setSelectedClasses(selectedClasses.filter(cls => cls !== c));
                        }}
                        className="rounded border-stone-300 text-blue-600 focus:ring-blue-500"
                      />
                      Grade {c}
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Sections</label>
                <div className="h-32 overflow-y-auto bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-xl p-2 space-y-1">
                  {SECTIONS.map(s => (
                    <label key={s} className="flex items-center gap-2 text-xs text-stone-700 dark:text-stone-300 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={selectedSections.includes(s)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedSections([...selectedSections, s]);
                          else setSelectedSections(selectedSections.filter(sec => sec !== s));
                        }}
                        className="rounded border-stone-300 text-blue-600 focus:ring-blue-500"
                      />
                      Section {s}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Subject</label>
              <select 
                value={selectedSubject} 
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-stone-100"
                required
              >
                <option value="">Select Subject</option>
                {availableSubjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Title</label>
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Algebra Worksheet"
                className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-stone-100"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Description</label>
              <textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Instructions for students..."
                className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] dark:text-stone-100"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Due Date</label>
              <input 
                type="date" 
                value={dueDate} 
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-stone-100"
                required
              />
            </div>

            <button 
              type="submit"
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-100 dark:shadow-none hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" /> Assign Homework
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-lg font-bold text-stone-800 dark:text-stone-100">Active Assignments</h4>
            <div className="flex gap-2">
              <select 
                value={selectedClasses[0] || CLASSES[0]} 
                onChange={(e) => setSelectedClasses([e.target.value])}
                className="p-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg text-xs font-bold outline-none dark:text-stone-100"
              >
                {CLASSES.map(c => <option key={c} value={c}>Grade {c}</option>)}
              </select>
              <select 
                value={selectedSections[0] || SECTIONS[0]} 
                onChange={(e) => setSelectedSections([e.target.value])}
                className="p-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg text-xs font-bold outline-none dark:text-stone-100"
              >
                {SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}
              </select>
            </div>
          </div>

          {filteredHomeworks.length === 0 ? (
            <div className="bg-white dark:bg-stone-900 p-12 rounded-3xl border border-dashed border-stone-200 dark:border-stone-800 text-center">
              <p className="text-stone-500 dark:text-stone-500">No homework assigned for this class/section.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredHomeworks.map(hw => (
                <div key={hw.id} className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800 group">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
                        <BookIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-stone-800 dark:text-stone-100">{hw.title}</h4>
                        <p className="text-xs text-stone-500 dark:text-stone-500">{hw.subject} • Due: {new Date(hw.dueDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => deleteHomework(hw.id)}
                      className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {hw.description && (
                    <p className="mt-4 text-sm text-stone-600 dark:text-stone-400 bg-stone-50 dark:bg-stone-800 p-3 rounded-xl italic">
                      "{hw.description}"
                    </p>
                  )}
                  <div className="mt-4 pt-4 border-t border-stone-50 dark:border-stone-800 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center text-[10px] font-bold text-stone-500">
                        {hw.teacherName.charAt(0)}
                      </div>
                      <span className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">Assigned by {hw.teacherName}</span>
                    </div>
                    <span className="text-[10px] text-stone-500 dark:text-stone-500 font-mono">{new Date(hw.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
