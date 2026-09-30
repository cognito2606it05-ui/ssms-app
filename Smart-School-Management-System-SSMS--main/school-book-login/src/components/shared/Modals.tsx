import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { 
  School, 
  User as UserIcon, 
  Users, 
  Upload, 
  FileText, 
  ArrowLeft, 
  XCircle, 
  Plus, 
  Download, 
  ArrowRight, 
  Sparkles 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { QRGenerator } from '../QRGenerator';
import { doc, setDoc, db } from '../../localDatabase';
import { Student, Teacher, User } from '../../types';
import { CLASSES, SUBJECTS, SECTIONS } from '../../constants';

export const AIAssistant = () => {
  const {
    students,
    teachers,
    staff,
    busRoutes,
    schoolSubjects,
    attendanceRecords,
    homeworks,
    examResults,
    storeItems,
    alerts,
    leaveRequests,
    showAIAssistant,
    setShowAIAssistant,
    aiMessages,
    setAiMessages
  } = useApp();

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [aiMessages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input;
    setInput('');
    setAiMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const result = await ai.models.generateContentStream({
        model: "gemini-3-flash-preview",
        contents: userMsg,
        config: {
          systemInstruction: `You are EduSmart AI, a helpful assistant for a school management system. 
          You have access to the following school data:
          - Total Students: ${students.length}
          - Total Teachers: ${teachers.length}
          - Total Staff: ${teachers.length + staff.length}
          - Active Bus Routes: ${busRoutes.length}
          - Subjects Taught: ${schoolSubjects.length}
          - Attendance Records: ${attendanceRecords.length}
          - Homework Assignments: ${homeworks.length}
          - Exam Results: ${examResults.length}
          - Store Items: ${storeItems.length}
          - Active Alerts: ${alerts.length}
          - Pending Leave Requests: ${leaveRequests.filter(r => r.status === 'Pending').length}
          
          Answer queries based on this data. Be concise and professional. If you don't have specific data, say so.`,
        },
      });

      let fullResponse = "";
      setAiMessages(prev => [...prev, { role: 'ai', text: '' }]);

      for await (const chunk of result) {
        fullResponse += chunk.text;
        setAiMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].text = fullResponse;
          return newMessages;
        });
      }
    } catch (err) {
      console.error("AI Error:", err);
      setAiMessages(prev => [...prev, { role: 'ai', text: "I'm sorry, I encountered an error. Please try again later." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[500] flex flex-col items-end gap-4">
      <AnimatePresence>
        {showAIAssistant && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="w-[350px] h-[500px] bg-white dark:bg-stone-900 rounded-[2rem] shadow-2xl border border-stone-100 dark:border-stone-800 flex flex-col overflow-hidden"
          >
            <div className="p-6 bg-blue-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold">EduSmart AI</h4>
                  <p className="text-[10px] opacity-70 uppercase font-bold tracking-widest">Online Assistant</p>
                </div>
              </div>
              <button onClick={() => setShowAIAssistant(false)} className="p-2 hover:bg-white/10 rounded-full">
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>

            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar"
            >
              {aiMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-100 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-stone-100 dark:bg-stone-800 p-4 rounded-2xl rounded-tl-none flex gap-1">
                    <div className="w-1 h-1 bg-stone-400 rounded-full animate-bounce" />
                    <div className="w-1 h-1 bg-stone-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1 h-1 bg-stone-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-stone-100 dark:border-stone-800 flex gap-2">
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask anything..."
                className="flex-1 p-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm outline-none focus:border-blue-400 transition-colors dark:text-stone-100"
              />
              <button 
                onClick={handleSend}
                className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 dark:shadow-none"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={() => setShowAIAssistant(!showAIAssistant)}
        className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all ${
          showAIAssistant ? 'bg-stone-800 text-white' : 'bg-blue-600 text-white hover:scale-110'
        }`}
      >
        {showAIAssistant ? <Plus className="w-8 h-8 rotate-45" /> : <Sparkles className="w-8 h-8" />}
      </button>
    </div>
  );
};

export const SmartIDCardModal = ({ person, onClose }: { person: Student | Teacher; onClose: () => void }) => {
  const isStudent = 'class' in person;
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[300] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0, rotateY: 90 }}
        animate={{ scale: 1, opacity: 1, rotateY: 0 }}
        className="relative w-[350px] h-[550px] preserve-3d"
      >
        <div className="absolute inset-0 bg-white dark:bg-stone-900 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col border-4 border-white dark:border-stone-800">
          <div className={`h-32 ${isStudent ? 'bg-blue-600' : 'bg-emerald-600'} p-6 text-white relative`}>
            <div className="flex items-center gap-2 mb-2">
              <School className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">EduSmart Tech</span>
            </div>
            <p className="text-[10px] opacity-70 uppercase font-bold tracking-widest">
              {isStudent ? 'Student ID' : 'Staff ID'}
            </p>
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full border-4 border-white dark:border-stone-800 bg-stone-100 dark:bg-stone-800 overflow-hidden shadow-lg">
              {person.photo ? (
                <img src={person.photo} alt="User" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-12 h-12 text-stone-400 dark:text-stone-600 m-auto mt-4" />
              )}
            </div>
          </div>

          <div className="mt-16 flex-1 flex flex-col items-center p-6 text-center">
            <h3 className="text-xl font-bold text-stone-950 dark:text-stone-50 mb-1">{person.name}</h3>
            <p className={`text-xs font-bold uppercase tracking-widest ${isStudent ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'} mb-6`}>
              {isStudent ? `Grade ${person.class} - Section ${person.section}` : (person as Teacher).subjects?.join(', ')}
            </p>

            <div className="grid grid-cols-2 gap-8 w-full text-left mb-8">
              <div>
                <p className="text-[8px] text-stone-500 dark:text-stone-500 uppercase font-bold mb-1">ID Number</p>
                <p className="text-xs font-bold text-stone-800 dark:text-stone-100">
                  {isStudent ? (person as Student).student_id : (person as Teacher).teacher_id}
                </p>
              </div>
              <div>
                <p className="text-[8px] text-stone-500 dark:text-stone-500 uppercase font-bold mb-1">Valid Thru</p>
                <p className="text-xs font-bold text-stone-800 dark:text-stone-100">June 2026</p>
              </div>
              <div className="col-span-2 flex justify-center">
                <QRGenerator value={isStudent ? (person as Student).student_id : (person as Teacher).teacher_id} size={80} />
              </div>
            </div>

            <div className="mt-auto w-full flex items-center justify-between pt-6 border-t border-stone-100 dark:border-stone-800">
              <div className="flex flex-col items-start">
                <p className="text-[8px] text-stone-500 dark:text-stone-500 uppercase font-bold mb-1">Library Code</p>
                <div className="h-6 w-24 bg-stone-100 dark:bg-stone-800 rounded flex items-center px-1 gap-1">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className={`h-4 w-[1px] bg-stone-400 dark:bg-stone-600 ${i % 3 === 0 ? 'h-5 w-[2px]' : ''}`} />
                  ))}
                </div>
              </div>
              <div className="w-12 h-12 bg-stone-50 dark:bg-stone-800 rounded-lg p-1 border border-stone-100 dark:border-stone-700">
                <div className="w-full h-full grid grid-cols-3 grid-rows-3 gap-[1px]">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className={`bg-stone-800 dark:bg-stone-200 rounded-[1px] ${i === 4 ? 'bg-transparent' : ''}`} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="absolute -top-12 left-1/2 -translate-x-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition-all"
        >
          <Plus className="w-6 h-6 rotate-45" />
        </button>
      </motion.div>
    </div>
  );
};

export const ViewDetailsModal = ({ student, onClose }: { student: Student; onClose: () => void }) => {
  const { examResults } = useApp();
  const studentResults = examResults.filter(r => r.student_id === student.student_id);
  const gpa = studentResults.length > 0 
    ? (studentResults.reduce((acc, curr) => acc + (['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F'].indexOf(curr.grade) > -1 ? 4.0 - ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F'].indexOf(curr.grade) * 0.3 : 0), 0) / studentResults.length).toFixed(2)
    : "0.00";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-stone-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-stone-100 dark:border-stone-800"
      >
        <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center bg-stone-50 dark:bg-stone-800/50">
          <h3 className="text-xl font-bold text-stone-950 dark:text-stone-50">Student Profile</h3>
          <button onClick={onClose} className="p-2 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-full transition-colors text-stone-500 dark:text-stone-400">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
        <div className="p-8 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-stone-100 dark:bg-stone-800 rounded-2xl flex items-center justify-center overflow-hidden">
              {student.photo ? (
                <img src={student.photo} alt="Student" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-12 h-12 text-stone-400 dark:text-stone-600" />
              )}
            </div>
            <div>
              <h4 className="text-2xl font-bold text-stone-800 dark:text-stone-100">{student.name}</h4>
              <p className="text-stone-500 dark:text-stone-400">ID: {student.student_id}</p>
              <p className="text-stone-500 dark:text-stone-400">Class {student.class_id} - Section {student.section}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <h5 className="text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Personal Details</h5>
              <div className="space-y-2">
                <p className="text-sm dark:text-stone-300"><span className="text-stone-500 dark:text-stone-500">Father:</span> {student.fatherName}</p>
                <p className="text-sm dark:text-stone-300"><span className="text-stone-500 dark:text-stone-500">Mother:</span> {student.motherName}</p>
                <p className="text-sm dark:text-stone-300"><span className="text-stone-500 dark:text-stone-500">DOB:</span> {student.dob}</p>
                <p className="text-sm dark:text-stone-300"><span className="text-stone-500 dark:text-stone-500">Gender:</span> {student.gender}</p>
              </div>
            </div>
            <div className="space-y-4">
              <h5 className="text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Contact Information</h5>
              <div className="space-y-2">
                <p className="text-sm dark:text-stone-300"><span className="text-stone-500 dark:text-stone-500">Phone:</span> {student.phone}</p>
                <p className="text-sm dark:text-stone-300"><span className="text-stone-500 dark:text-stone-500">Email:</span> {student.email}</p>
                <p className="text-sm dark:text-stone-300"><span className="text-stone-500 dark:text-stone-500">Address:</span> {student.address}, {student.city}, {student.state} - {student.pincode}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <h5 className="text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Academic Performance</h5>
              <p className="text-sm dark:text-stone-300"><span className="text-stone-500 dark:text-stone-500">GPA:</span> {gpa}</p>
              <div className="space-y-2">
                {studentResults.map(r => (
                  <p key={r.id} className="text-sm dark:text-stone-300">{r.subject}: {r.grade}</p>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <h5 className="text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Fee Status</h5>
              <p className={`text-sm font-bold ${student.fees.status === 'Paid' ? 'text-emerald-600' : 'text-red-600'}`}>{student.fees.status}</p>
              <p className="text-sm dark:text-stone-300"><span className="text-stone-500 dark:text-stone-500">Total:</span> ${student.fees.total}</p>
              <p className="text-sm dark:text-stone-300"><span className="text-stone-500 dark:text-stone-500">Paid:</span> ${student.fees.paid}</p>
            </div>
          </div>

          <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl space-y-4">
            <h5 className="text-xs font-bold text-blue-400 dark:text-blue-300 uppercase tracking-widest">Guardian Information</h5>
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 bg-white dark:bg-stone-800 rounded-xl flex items-center justify-center overflow-hidden border border-blue-100 dark:border-stone-700 shadow-sm">
                {student.guardian.photo ? (
                  <img src={student.guardian.photo} alt="Guardian" className="w-full h-full object-cover" />
                ) : (
                  <Users className="w-8 h-8 text-blue-200 dark:text-blue-800" />
                )}
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 flex-1">
                <p className="text-sm font-medium dark:text-stone-200"><span className="text-blue-400 dark:text-blue-300 font-normal">Name:</span> {student.guardian.name}</p>
                <p className="text-sm font-medium dark:text-stone-200"><span className="text-blue-400 dark:text-blue-300 font-normal">Relation:</span> {student.guardian.relation}</p>
                <p className="text-sm font-medium dark:text-stone-200"><span className="text-blue-400 dark:text-blue-300 font-normal">Phone:</span> {student.guardian.phone}</p>
                <p className="text-sm font-medium dark:text-stone-200"><span className="text-blue-400 dark:text-blue-300 font-normal">Email:</span> {student.guardian.email}</p>
                <p className="text-sm font-medium col-span-2 dark:text-stone-200"><span className="text-blue-400 dark:text-blue-300 font-normal">Address:</span> {student.guardian.address}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export const AddModal = () => {
  const {
    showAddModal,
    setShowAddModal,
    editingTeacher,
    setEditingTeacher,
    editingStudent,
    setEditingStudent,
    setNotification
  } = useApp();

  const activeEdit = editingTeacher || editingStudent;
  const isTeacher = showAddModal === 'teacher' || !!editingTeacher;
  if (!showAddModal && !activeEdit) return null;

  const [photoPreview, setPhotoPreview] = useState<string | null>(activeEdit?.photo || null);
  const guardianRef = activeEdit && 'guardian' in activeEdit ? activeEdit.guardian : null;
  const [guardianPhotoPreview, setGuardianPhotoPreview] = useState<string | null>(guardianRef?.photo || null);
  const [docName, setDocName] = useState<string | null>(editingTeacher?.qualificationDoc || null);
  const [guardianName, setGuardianName] = useState<string>(guardianRef?.name || '');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'doc' | 'guardianPhoto') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'photo') {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else if (type === 'guardianPhoto') {
      const reader = new FileReader();
      reader.onloadend = () => setGuardianPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setDocName(file.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const id = formData.get('id') as string;
    
    const generatedEmail = activeEdit?.email || `${name.toLowerCase().replace(/\s+/g, '')}@school.com`;
    const guardianRefSubmit = activeEdit && 'guardian' in activeEdit ? activeEdit.guardian : null;
    const generatedGuardianEmail = guardianRefSubmit?.email || `${guardianName.toLowerCase().replace(/\s+/g, '')}@school.com`;

    if (!activeEdit) {
      const newUser: User = {
        user_id: id,
        name: name,
        email: generatedEmail,
        role: isTeacher ? 'Teacher' : 'Student',
        role_type: 'academic',
        phone: formData.get('phone') as string,
        linked_id: id,
        photo: photoPreview || undefined
      };
      
      await setDoc(doc(db, 'users', id), newUser);

      if (!isTeacher) {
        const parentId = `P-${id.split('-')[1] || id}`;
        const newParentUser: User = {
          user_id: parentId,
          name: guardianName,
          email: generatedGuardianEmail,
          role: 'Parent',
          role_type: 'academic',
          phone: formData.get('guardianPhone') as string,
          linked_id: parentId,
          photo: guardianPhotoPreview || undefined
        };
        await setDoc(doc(db, 'users', parentId), newParentUser);

        const parentData = {
          parent_id: parentId,
          name: guardianName,
          linked_students: [id],
          email: generatedGuardianEmail
        };
        await setDoc(doc(db, 'parents', parentId), parentData);
      }
    }

    if (isTeacher) {
      const teacherData: Teacher = {
        teacher_id: id,
        name: name,
        assigned_classes: [formData.get('classSection') as string],
        subjects: [formData.get('subject') as string],
        email: generatedEmail,
        salary: {
          basic: 45000,
          allowances: 5000,
          history: []
        }
      };
      
      await setDoc(doc(db, 'teachers', id), teacherData);
    } else {
      const studentData: Student = {
        student_id: id,
        name: name,
        class_id: formData.get('class') as string,
        class: formData.get('class') as string,
        section: formData.get('section') as string,
        parent_id: `P-${id.split('-')[1] || id}`,
        subjects: [],
        summary: {
          attendance_percentage: 0,
          latest_grade: 'N/A',
          fee_status: 'Pending'
        },
        email: generatedEmail,
        fees: {
          total: Number(formData.get('totalFee')) || 50000,
          paid: Number(formData.get('paidFee')) || 0,
          status: 'Pending',
          history: []
        },
        fatherName: formData.get('fatherName') as string,
        motherName: formData.get('motherName') as string,
        dob: formData.get('dob') as string,
        gender: formData.get('gender') as string,
        phone: formData.get('phone') as string,
        address: formData.get('address') as string,
        city: formData.get('city') as string,
        state: formData.get('state') as string,
        pincode: formData.get('pincode') as string,
        guardian: {
          name: guardianName,
          relation: formData.get('relation') as string,
          phone: formData.get('guardianPhone') as string,
          email: generatedGuardianEmail,
          address: formData.get('guardianAddress') as string,
          photo: guardianPhotoPreview || undefined
        }
      };
      
      await setDoc(doc(db, 'students', id), studentData);
    }

    setShowAddModal(null);
    setEditingTeacher(null);
    setEditingStudent(null);
    if (!activeEdit) {
      let alertMsg = `Account created!\n\n${isTeacher ? 'Teacher' : 'Student'} Login: ${generatedEmail}`;
      if (!isTeacher) {
        alertMsg += `\nParent Login: ${generatedGuardianEmail}`;
      }
      alertMsg += `\nPassword: 123`;
      setNotification({ message: alertMsg, type: 'error' });
    }
  };

  const closeAll = () => {
    setShowAddModal(null);
    setEditingTeacher(null);
    setEditingStudent(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-stone-900 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-stone-100 dark:border-stone-800"
      >
        <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center bg-stone-50 dark:bg-stone-800/50">
          <h3 className="text-xl font-bold text-stone-800 dark:text-stone-100">
            {activeEdit ? 'Edit' : 'Add New'} {isTeacher ? 'Teacher' : 'Student'}
          </h3>
          <button onClick={closeAll} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-full transition-colors text-stone-500 dark:text-stone-400">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Personal Information</h4>
              <input 
                name="id" 
                defaultValue={activeEdit?.student_id || activeEdit?.teacher_id}
                placeholder={isTeacher ? "Teacher ID" : "Student ID"} 
                className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500" 
                required 
                readOnly={!!activeEdit}
              />
              <input name="name" defaultValue={activeEdit?.name} placeholder="Full Name" className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500" required />
              {isTeacher ? (
                <div className="grid grid-cols-2 gap-4">
                  <select name="classSection" defaultValue={editingTeacher?.assigned_classes?.[0]} className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm dark:text-stone-100" required>
                    <option value="">Select Class</option>
                    {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
                  </select>
                  <select name="subject" defaultValue={editingTeacher?.subjects?.[0]} className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm dark:text-stone-100" required>
                    <option value="">Select Subject</option>
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              ) : (
                <>
                  <input name="fatherName" defaultValue={editingStudent?.fatherName} placeholder="Father's Name" className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500" required />
                  <input name="motherName" defaultValue={editingStudent?.motherName} placeholder="Mother's Name" className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500" required />
                  <div className="grid grid-cols-2 gap-4">
                    <select name="class" defaultValue={editingStudent?.class} className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm dark:text-stone-100" required>
                      <option value="">Class</option>
                      {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select name="section" defaultValue={editingStudent?.section} className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm dark:text-stone-100" required>
                      <option value="">Section</option>
                      {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </>
              )}
              <div className="grid grid-cols-2 gap-4">
                <select name="gender" defaultValue={activeEdit?.gender} className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm dark:text-stone-100">
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
                <input name="dob" defaultValue={activeEdit?.dob} type="date" className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm dark:text-stone-100" required />
              </div>
              
              <div className="relative group">
                <input 
                  type="file" 
                  accept="image/jpeg,image/png" 
                  onChange={(e) => handleFileChange(e, 'photo')}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                />
                <div className="flex items-center gap-4 p-4 border-2 border-dashed border-stone-200 rounded-2xl group-hover:border-blue-400 transition-colors">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <Upload className="w-5 h-5 text-stone-500" />
                  )}
                  <span className="text-sm text-stone-500">
                    {photoPreview ? 'Change Photo' : 'Upload Photo (JPG/PNG)'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Contact & Address</h4>
              <input name="email" type="email" defaultValue={activeEdit?.email} placeholder="Email Address (Auto-generated)" className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm dark:text-stone-100 opacity-50" readOnly />
              <input name="phone" defaultValue={activeEdit?.phone} placeholder="Phone Number" className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500" required />
              <textarea name="address" defaultValue={activeEdit?.address} placeholder="Full Address" className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 h-24" required />
              <div className="grid grid-cols-2 gap-4">
                <input name="city" defaultValue={activeEdit?.city} placeholder="City" className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500" required />
                <input name="pincode" defaultValue={activeEdit?.pincode} placeholder="Pincode" className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500" required />
              </div>
              <input name="state" defaultValue={activeEdit?.state} placeholder="State" className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500" required />
              {!isTeacher && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800 space-y-3">
                  <h5 className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Fee Configuration</h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-stone-500 dark:text-stone-400 mb-1 block">Total Annual Fee</label>
                      <input name="totalFee" type="number" defaultValue={editingStudent?.fees?.total || 12000} className="w-full p-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-sm dark:text-stone-100" required />
                    </div>
                    <div>
                      <label className="text-[10px] text-stone-500 dark:text-stone-400 mb-1 block">Initial Payment</label>
                      <input name="paidFee" type="number" defaultValue={editingStudent?.fees?.paid || 0} className="w-full p-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-sm dark:text-stone-100" required />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {!isTeacher && (
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Guardian Details</h4>
                <input 
                  name="guardianName" 
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  placeholder="Guardian Name" 
                  className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500" 
                  required 
                />
                <input 
                  value={guardianName.trim() ? `${guardianName.trim().split(' ')[0].toLowerCase()}${guardianName.trim().split(' ').length > 1 ? guardianName.trim().split(' ')[guardianName.trim().split(' ').length - 1].toLowerCase() : ''}@school.com` : ''} 
                  placeholder="Guardian Email (Auto-generated)" 
                  className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm dark:text-stone-100 opacity-50" 
                  readOnly 
                />
                <input name="guardianPhone" defaultValue={guardianRef?.phone} placeholder="Guardian Phone" className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500" required />
                <input name="relation" defaultValue={guardianRef?.relation} placeholder="Relation to Student" className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500" required />
                <textarea name="guardianAddress" defaultValue={guardianRef?.address} placeholder="Guardian Address" className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 h-20" required />
                
                <div className="relative group">
                  <input 
                    type="file" 
                    accept="image/jpeg,image/png" 
                    onChange={(e) => handleFileChange(e, 'guardianPhoto')}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                  />
                  <div className="flex items-center gap-4 p-4 border-2 border-dashed border-stone-200 dark:border-stone-700 rounded-2xl group-hover:border-blue-400 transition-colors">
                    {guardianPhotoPreview ? (
                      <img src={guardianPhotoPreview} alt="Preview" className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <Upload className="w-5 h-5 text-stone-500 dark:text-stone-500" />
                    )}
                    <span className="text-sm text-stone-500 dark:text-stone-400">
                      {guardianPhotoPreview ? 'Change Guardian Photo' : 'Upload Guardian Photo (JPG/PNG)'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {isTeacher && (
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Qualifications</h4>
                <input name="qualification" defaultValue={editingTeacher?.qualification} placeholder="Highest Qualification" className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500" required />
                <div className="relative group">
                  <input 
                    type="file" 
                    accept="application/pdf" 
                    onChange={(e) => handleFileChange(e, 'doc')}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                  />
                  <div className="flex items-center gap-4 p-4 border-2 border-dashed border-stone-200 rounded-2xl group-hover:border-blue-400 transition-colors">
                    <FileText className="w-5 h-5 text-stone-500" />
                    <span className="text-sm text-stone-500 truncate max-w-[200px]">
                      {docName || 'Upload Qualification (PDF)'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="md:col-span-2 pt-4">
              <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all">
                {activeEdit ? 'Update' : 'Save'} {isTeacher ? 'Teacher' : 'Student'} Record
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export const ReportCardModal = () => {
  const { viewingReportCard, setViewingReportCard, examResults } = useApp();
  if (!viewingReportCard) return null;
  const student = viewingReportCard;
  const results = examResults.filter(r => r.student_id === student.student_id);
  
  const calculateGPA = (results: ExamResult[]) => {
    if (results.length === 0) return "0.0";
    const gradePoints: { [key: string]: number } = {
      'A+': 4.0, 'A': 4.0, 'A-': 3.7,
      'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7,
      'D+': 1.3, 'D': 1.0, 'F': 0.0
    };
    const totalPoints = results.reduce((acc, curr) => acc + (gradePoints[curr.grade] || 0), 0);
    return (totalPoints / results.length).toFixed(1);
  };

  const gpa = calculateGPA(results);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-stone-900 w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden border border-stone-100 dark:border-stone-800"
      >
        <div className="p-8 space-y-8">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <School className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-serif font-bold text-stone-950 dark:text-stone-50">Academic Report Card</h3>
                <p className="text-xs text-stone-500 uppercase tracking-widest">Session 2025-26 • Term 1</p>
              </div>
            </div>
            <button 
              onClick={() => setViewingReportCard(null)}
              className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors text-stone-500"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-6 p-6 bg-stone-50 dark:bg-stone-800/50 rounded-3xl border border-stone-100 dark:border-stone-700">
            <div>
              <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Student Name</p>
              <p className="font-bold text-stone-800 dark:text-stone-200">{student.name}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Student ID</p>
              <p className="font-mono text-stone-600 dark:text-stone-400">{student.student_id}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Class & Section</p>
              <p className="font-bold text-stone-800 dark:text-stone-200">Class {student.class} - {student.section}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Overall GPA</p>
              <p className="text-xl font-black text-indigo-600 dark:text-indigo-400">{gpa}</p>
            </div>
          </div>

          <div className="overflow-hidden overflow-x-auto border border-stone-100 dark:border-stone-800 rounded-2xl">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 dark:bg-stone-800/50 border-b border-stone-100 dark:border-stone-800">
                <tr>
                  <th className="p-4 font-bold text-stone-500">Subject</th>
                  <th className="p-4 font-bold text-stone-500">Marks</th>
                  <th className="p-4 font-bold text-stone-500">Grade</th>
                  <th className="p-4 font-bold text-stone-500 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50 dark:divide-stone-800">
                {results.length > 0 ? results.map((res, i) => (
                  <tr key={i} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
                    <td className="p-4 font-bold text-stone-800 dark:text-stone-200">{res.subject}</td>
                    <td className="p-4 text-stone-600 dark:text-stone-400">{res.marksObtained}/{res.maxMarks}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg font-bold text-xs">
                        {res.grade}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className={`text-[10px] font-bold uppercase ${res.marksObtained >= res.maxMarks * 0.4 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {res.marksObtained >= res.maxMarks * 0.4 ? 'Pass' : 'Fail'}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-stone-500 italic">No exam records found for this term.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={() => window.print()}
              className="flex-1 py-4 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all"
            >
              <Download className="w-5 h-5" /> Download PDF
            </button>
            <button 
              onClick={() => setViewingReportCard(null)}
              className="flex-1 py-4 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded-2xl font-bold hover:bg-stone-200 dark:hover:bg-stone-700 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export const ReceiptModal = () => {
  const { viewingReceipt, setViewingReceipt } = useApp();
  if (!viewingReceipt) return null;
  const record = viewingReceipt;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-stone-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-stone-100 dark:border-stone-800"
      >
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                <School className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg text-stone-800 dark:text-stone-100">EduSmart <span className="text-blue-600">Tech</span></span>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Receipt #</p>
              <p className="text-sm font-bold text-stone-800 dark:text-stone-100">{record.id}</p>
            </div>
          </div>

          <div className="border-y border-stone-100 dark:border-stone-800 py-6 space-y-4">
            <div className="flex justify-between">
              <span className="text-xs text-stone-500 dark:text-stone-400 uppercase font-bold tracking-widest">Student Name</span>
              <span className="text-sm font-bold text-stone-800 dark:text-stone-100">{record.student}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-stone-500 dark:text-stone-400 uppercase font-bold tracking-widest">Class & Section</span>
              <span className="text-sm font-bold text-stone-800 dark:text-stone-100">{record.class}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-stone-500 dark:text-stone-400 uppercase font-bold tracking-widest">Payment Date</span>
              <span className="text-sm font-bold text-stone-800 dark:text-stone-100">{record.date}</span>
            </div>
          </div>

          <div className="bg-stone-50 dark:bg-stone-800 p-4 rounded-2xl flex justify-between items-center">
            <span className="text-sm font-bold text-stone-800 dark:text-stone-100">Total Amount Paid</span>
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">${record.amount}</span>
          </div>

          <div className="text-center space-y-2">
            <p className="text-[10px] text-stone-500 dark:text-stone-500">This is a computer-generated receipt and does not require a signature.</p>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  window.print();
                  setViewingReceipt(null);
                }}
                className="flex-1 py-3 bg-stone-800 dark:bg-stone-700 text-white rounded-xl font-bold text-sm hover:bg-stone-900 dark:hover:bg-stone-600 transition-all"
              >
                Print Receipt
              </button>
              <button 
                onClick={() => setViewingReceipt(null)}
                className="flex-1 py-3 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded-xl font-bold text-sm hover:bg-stone-200 dark:hover:bg-stone-700 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
