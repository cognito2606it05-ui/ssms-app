import React, { useState, useEffect } from 'react';
import { 
  Sparkles, BookOpen, Calendar, DollarSign, CreditCard, TrendingUp, MapPin, 
  MessageSquare, Clock, Lock, Unlock, Settings, Phone, ArrowLeft, User, 
  LogOut, Menu, X, ChevronRight, Wifi, WifiOff, Send, Check, Search, Download, 
  AlertTriangle, Shield, CheckCircle2, AlertCircle, FileText, SendHorizontal
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';
import { QRCodeSVG } from 'qrcode.react';

export function StudentPortal({ user, onLogout }: { user: any; onLogout: () => void }) {
  const [apiToken, setApiToken] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Assignment states
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [textSubmission, setTextSubmission] = useState('');
  const [fileName, setFileName] = useState('');
  const [submitMessage, setSubmitMessage] = useState('');

  // AI Tutoring states
  const [aiChatSubject, setAiChatSubject] = useState('Mathematics');
  const [chatMessages, setChatMessages] = useState<any[]>([
    { role: 'bot', content: 'Hello! I am your AI Study Companion. How can I help you master your classes today?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);

  // Library states
  const [libraryData, setLibraryData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [fineMessage, setFineMessage] = useState('');

  // Study materials
  const [studyMaterials, setStudyMaterials] = useState<any[]>([]);
  const [studySearch, setStudySearch] = useState('');

  // Track online/offline status
  useEffect(() => {
    const ping = () => setIsOnline(true);
    const pong = () => setIsOnline(false);
    window.addEventListener('online', ping);
    window.addEventListener('offline', pong);
    return () => {
      window.removeEventListener('online', ping);
      window.removeEventListener('offline', pong);
    };
  }, []);

  // Silent login on mount to obtain the Express JWT token
  useEffect(() => {
    const getJwtToken = async () => {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email, password: 'Passw0rd!' })
        });
        if (res.ok) {
          const data = await res.json();
          setApiToken(data.accessToken);
        }
      } catch (err) {
        console.error('Silent login failed:', err);
      }
    };
    getJwtToken();
  }, [user.email]);

  useEffect(() => {
    if (apiToken) {
      fetchDashboard();
    }
  }, [apiToken]);

  useEffect(() => {
    if (!apiToken) return;
    if (activeTab === 'assignments') {
      fetchAssignments();
    } else if (activeTab === 'library') {
      fetchLibrary();
    } else if (activeTab === 'study-materials') {
      fetchStudyMaterials();
    }
  }, [activeTab, apiToken]);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/student/dashboard', {
        headers: { 'Authorization': `Bearer ${apiToken}` }
      });
      const data = await res.json();
      setDashboardData(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAssignments = async () => {
    try {
      const res = await fetch('/api/student/assignments', {
        headers: { 'Authorization': `Bearer ${apiToken}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setAssignments(data);
    } catch (err) {
      console.error(err);
    }
  };

  const submitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingId || !apiToken) return;
    try {
      const res = await fetch(`/api/student/assignments/${submittingId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`
        },
        body: JSON.stringify({
          text_submission: textSubmission,
          file_name: fileName || 'homework_file.pdf'
        })
      });
      if (res.ok) {
        setSubmitMessage('Assignment submitted successfully!');
        setTextSubmission('');
        setFileName('');
        fetchAssignments();
        setTimeout(() => {
          setSubmittingId(null);
          setSubmitMessage('');
        }, 1500);
      }
    } catch (err) {
      setSubmitMessage('Failed to submit assignment.');
    }
  };

  const fetchLibrary = async () => {
    try {
      const res = await fetch('/api/student/library', {
        headers: { 'Authorization': `Bearer ${apiToken}` }
      });
      const data = await res.json();
      setLibraryData(data);
    } catch (err) {
      console.error(err);
    }
  };

  const payFine = async (issueId: number) => {
    if (!apiToken) return;
    try {
      const res = await fetch('/api/student/library/pay-fine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`
        },
        body: JSON.stringify({ id: issueId })
      });
      const data = await res.json();
      if (res.ok) {
        setFineMessage('Library fine paid successfully via your smart card wallet!');
        fetchLibrary();
        fetchDashboard();
      } else {
        setFineMessage(data.message || 'Payment failed.');
      }
    } catch (err) {
      setFineMessage('Error paying fine.');
    }
  };

  const fetchStudyMaterials = async () => {
    try {
      const res = await fetch('/api/student/study-materials', {
        headers: { 'Authorization': `Bearer ${apiToken}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setStudyMaterials(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !apiToken) return;

    const userMsg = { role: 'user', content: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    const prompt = chatInput;
    setChatInput('');
    setIsAiTyping(true);

    try {
      const res = await fetch('/api/student/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`
        },
        body: JSON.stringify({ message: prompt, contextSubject: aiChatSubject })
      });
      const data = await res.json();
      if (res.ok) {
        setChatMessages(prev => [...prev, { role: 'bot', content: data.response }]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiTyping(false);
    }
  };

  // Filter study materials
  const filteredMaterials = studyMaterials.filter(m => 
    m.title.toLowerCase().includes(studySearch.toLowerCase()) ||
    m.subject.toLowerCase().includes(studySearch.toLowerCase()) ||
    m.chapter?.toLowerCase().includes(studySearch.toLowerCase())
  );

  // Filter catalog
  const filteredCatalog = libraryData?.catalog?.filter((b: any) =>
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.author.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-stone-955 text-stone-100 flex flex-col md:flex-row font-sans">
      {/* Sidebar navigation */}
      <aside className="w-full md:w-72 bg-stone-900 border-b md:border-b-0 md:border-r border-stone-850 flex flex-col justify-between shrink-0">
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight">SSMS Portals</h1>
                <p className="text-xs text-stone-400">Student Progress Hub</p>
              </div>
            </div>
            
            {/* Online Badge */}
            <div className={`px-2 py-1 rounded-full text-[10px] flex items-center gap-1 ${
              isOnline ? 'bg-emerald-900/40 text-emerald-400' : 'bg-rose-900/40 text-rose-400'
            }`}>
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isOnline ? 'Online' : 'Offline'}
            </div>
          </div>

          <nav className="space-y-1">
            {[
              { id: 'overview', label: 'Student Dashboard', icon: Sparkles },
              { id: 'assignments', label: 'My Assignments', icon: FileText },
              { id: 'tutoring', label: 'AI Tutoring Bot (24/7)', icon: Sparkles },
              { id: 'library', label: 'Digital Library', icon: BookOpen },
              { id: 'study-materials', label: 'Study Materials', icon: FileText },
              { id: 'wallet', label: 'Digital Wallet ID', icon: CreditCard },
              { id: 'bus', label: 'School Bus Tracking', icon: MapPin }
            ].map(item => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                    active 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                      : 'text-stone-400 hover:text-stone-100 hover:bg-stone-800/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User profile footer */}
        <div className="p-6 border-t border-stone-850 bg-stone-955/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-950 text-indigo-400 flex items-center justify-center font-bold">
                {user?.name?.[0] || 'S'}
              </div>
              <div className="truncate max-w-[120px]">
                <p className="text-xs font-semibold text-stone-100">{user?.name}</p>
                <p className="text-[10px] text-stone-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button 
              onClick={onLogout}
              className="p-2 text-stone-400 hover:text-rose-400 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main panel */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full space-y-6">
        
        {/* Profile / Banner */}
        <header className="bg-stone-900 rounded-3xl p-6 border border-stone-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold font-serif text-white">Student Dashboard</h2>
            <p className="text-stone-400 text-sm mt-1">
              Welcome back, <span className="text-indigo-400 font-semibold">{user?.name}</span>. Complete your tasks and learn something new today!
            </p>
          </div>
          <div className="bg-indigo-955/60 px-4 py-2 rounded-2xl border border-indigo-900 text-xs text-indigo-400">
            Class: <span className="font-bold text-white">{dashboardData?.student?.class || '10'}-A</span>
          </div>
        </header>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && dashboardData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left column */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Stats row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Pending assignments */}
                <div className="bg-stone-900 p-6 rounded-3xl border border-stone-800 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest block">Pending Tasks</span>
                    <span className="text-3xl font-bold font-serif text-white">{dashboardData.assignmentStats?.pending || 0}</span>
                    <span className="text-xs text-indigo-400 block">Due this week</span>
                  </div>
                  <div className="w-12 h-12 bg-indigo-955/60 rounded-2xl flex items-center justify-center text-indigo-400">
                    <FileText className="w-6 h-6" />
                  </div>
                </div>

                {/* Library books */}
                <div className="bg-stone-900 p-6 rounded-3xl border border-stone-800 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest block">Books Issued</span>
                    <span className="text-3xl font-bold font-serif text-white">{dashboardData.library?.issued_count || 0}</span>
                    <span className="text-xs text-amber-400 block">Fines: ₹{dashboardData.library?.total_fines || 0}</span>
                  </div>
                  <div className="w-12 h-12 bg-amber-955/60 rounded-2xl flex items-center justify-center text-amber-400">
                    <BookOpen className="w-6 h-6" />
                  </div>
                </div>

                {/* Smart card balance */}
                <div className="bg-stone-900 p-6 rounded-3xl border border-stone-800 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest block">Wallet Balance</span>
                    <span className="text-3xl font-bold font-serif text-emerald-400">₹{dashboardData.card?.wallet_balance || 0}</span>
                    <span className="text-xs text-stone-400 block">Status: {dashboardData.card?.status || 'Active'}</span>
                  </div>
                  <div className="w-12 h-12 bg-emerald-955/60 rounded-2xl flex items-center justify-center text-emerald-400">
                    <CreditCard className="w-6 h-6" />
                  </div>
                </div>

              </div>

              {/* Timetable schedule for today */}
              <div className="bg-stone-900 p-6 rounded-3xl border border-stone-800">
                <h3 className="text-white font-bold font-serif mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-400" />
                  Today's Timetable / Schedule
                </h3>

                <div className="space-y-3">
                  {[
                    { subject: 'Mathematics', teacher: 'Mrs. Sharma', time: '09:00 AM - 10:00 AM', room: 'Class Room 12' },
                    { subject: 'Physics', teacher: 'Mr. Verma', time: '10:15 AM - 11:15 AM', room: 'Science Lab 2' },
                    { subject: 'English', teacher: 'Miss Sen', time: '11:30 AM - 12:30 PM', room: 'Class Room 12' },
                    { subject: 'History', teacher: 'Mrs. Rawat', time: '01:30 PM - 02:30 PM', room: 'Seminar Hall' }
                  ].map((period, idx) => (
                    <div key={idx} className="bg-stone-950 p-4 rounded-2xl border border-stone-800 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-white">{period.subject}</p>
                        <p className="text-[10px] text-stone-500">{period.teacher} · {period.room}</p>
                      </div>
                      <span className="bg-indigo-950 text-indigo-400 border border-indigo-900 px-3 py-1 rounded-full text-[10px] font-bold">
                        {period.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Sidebar columns: Digital Card View & Bus tracking info */}
            <div className="space-y-6">
              
              {/* Digital smart ID card */}
              <div className="bg-stone-900 p-6 rounded-3xl border border-stone-800 space-y-4">
                <h3 className="text-white font-bold font-serif text-sm flex items-center gap-2">
                  <CreditCard className="w-4.5 h-4.5 text-indigo-400" />
                  My Smart ID Card
                </h3>
                
                <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 p-4 rounded-2xl border border-indigo-805 relative overflow-hidden flex flex-col items-center justify-center gap-4 text-center">
                  <div className="bg-white p-2 rounded-xl">
                    <QRCodeSVG value={`STUDENT_ID:${dashboardData.student?.id || 16}`} size={100} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{dashboardData.student?.name}</p>
                    <p className="text-[10px] text-indigo-300">Roll No: {dashboardData.student?.roll_number || '24'}</p>
                  </div>
                </div>
              </div>

              {/* Live Bus tracking status */}
              <div className="bg-stone-900 p-6 rounded-3xl border border-stone-800 space-y-4">
                <h3 className="text-white font-bold font-serif text-sm flex items-center gap-2">
                  <MapPin className="w-4.5 h-4.5 text-indigo-400" />
                  Your School Bus Arrival
                </h3>
                
                {dashboardData.bus ? (
                  <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 text-center space-y-2">
                    <span className="text-[10px] text-stone-500 uppercase tracking-widest block">Estimated Arrival</span>
                    <span className="text-3xl font-bold font-serif text-indigo-400 block">{dashboardData.bus.eta_minutes} mins</span>
                    <span className="text-[10px] text-stone-400 block">Driver: {dashboardData.bus.driver_name}</span>
                  </div>
                ) : (
                  <div className="bg-stone-955 p-4 rounded-2xl border border-stone-800 text-center text-stone-500 text-xs">
                    No active transport route assigned.
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* ASSIGNMENTS TAB */}
        {activeTab === 'assignments' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* List panel */}
            <div className="lg:col-span-2 bg-stone-900 p-6 rounded-3xl border border-stone-800 space-y-4">
              <h3 className="text-white font-bold font-serif">Assignments List</h3>
              
              <div className="space-y-3">
                {assignments.map(a => (
                  <div 
                    key={a.id} 
                    onClick={() => {
                      setSelectedAssignment(a);
                      setSubmittingId(null);
                    }}
                    className={`bg-stone-955 p-4 rounded-2xl border transition-all text-xs cursor-pointer flex justify-between items-center ${
                      selectedAssignment?.id === a.id ? 'border-indigo-600' : 'border-stone-800 hover:border-stone-750'
                    }`}
                  >
                    <div className="space-y-1">
                      <p className="font-bold text-white">{a.title}</p>
                      <p className="text-stone-500 text-[10px]">{a.subject} · Due in 5 days</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold ${
                      a.submission_status === 'graded' ? 'bg-emerald-955 text-emerald-400 border border-emerald-900' :
                      a.submission_status === 'submitted' ? 'bg-indigo-955 text-indigo-400 border border-indigo-900' :
                      'bg-rose-955 text-rose-400 border border-rose-900'
                    }`}>
                      {a.submission_status ? a.submission_status.toUpperCase() : 'PENDING'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Detail panel */}
            <div className="bg-stone-900 p-6 rounded-3xl border border-stone-800 space-y-6">
              {selectedAssignment ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-white font-bold font-serif leading-tight">{selectedAssignment.title}</h3>
                    <p className="text-[10px] text-indigo-400 mt-1">{selectedAssignment.subject}</p>
                  </div>

                  <div className="text-xs text-stone-300 leading-relaxed bg-stone-955 p-4 rounded-2xl border border-stone-850">
                    <p className="font-bold text-white mb-2">Description / Instructions:</p>
                    <p>{selectedAssignment.description}</p>
                  </div>

                  {/* Submission details */}
                  {selectedAssignment.submission_status ? (
                    <div className="bg-stone-955 p-4 rounded-2xl border border-stone-850 space-y-2 text-xs">
                      <p className="font-bold text-emerald-400">Submitted successfully</p>
                      <p className="text-stone-400">File: {selectedAssignment.file_name}</p>
                      {selectedAssignment.grade && (
                        <div className="border-t border-stone-800 pt-2 mt-2">
                          <p className="text-white font-bold">Grade: {selectedAssignment.grade}/{selectedAssignment.max_marks}</p>
                          <p className="text-stone-400 mt-1">Feedback: "{selectedAssignment.feedback}"</p>
                        </div>
                      )}
                    </div>
                  ) : submittingId === selectedAssignment.id ? (
                    <form onSubmit={submitAssignment} className="space-y-4">
                      <div>
                        <label className="text-[10px] text-stone-400 block mb-1">Text Submission</label>
                        <textarea
                          rows={4}
                          value={textSubmission}
                          onChange={(e) => setTextSubmission(e.target.value)}
                          placeholder="Type your homework response here..."
                          className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                        />
                      </div>
                      
                      <div>
                        <label className="text-[10px] text-stone-400 block mb-1">File Name</label>
                        <input
                          type="text"
                          value={fileName}
                          onChange={(e) => setFileName(e.target.value)}
                          placeholder="e.g. math_homework.pdf"
                          className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                        />
                      </div>

                      {submitMessage && (
                        <div className="bg-indigo-950 border border-indigo-900 text-indigo-400 p-3 rounded-xl text-[10px]">
                          {submitMessage}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSubmittingId(null)}
                          className="flex-1 bg-stone-950 hover:bg-stone-800 text-stone-400 text-xs py-2 rounded-xl transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs py-2 rounded-xl transition-all"
                        >
                          Submit
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => setSubmittingId(selectedAssignment.id)}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3 rounded-xl transition-all"
                    >
                      Submit Assignment
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center text-stone-500 text-xs py-12">
                  Select an assignment to view details and submit.
                </div>
              )}
            </div>

          </div>
        )}

        {/* AI TUTOR BOT TAB */}
        {activeTab === 'tutoring' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[550px]">
            
            {/* Subject Context Gating */}
            <div className="bg-stone-900 p-6 rounded-3xl border border-stone-800 flex flex-col gap-4">
              <h3 className="text-white font-bold font-serif flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                Select Subject Context
              </h3>
              <p className="text-stone-400 text-xs leading-relaxed">
                Selecting a subject helps the bot fetch relevant syllabus chapters and review your weak areas.
              </p>
              
              <div className="space-y-2">
                {['Mathematics', 'Physics', 'Biology', 'History'].map(sub => (
                  <button
                    key={sub}
                    onClick={() => setAiChatSubject(sub)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all text-xs font-semibold ${
                      aiChatSubject === sub ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400' : 'bg-stone-950 border-stone-800 hover:border-stone-750 text-stone-300'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Area */}
            <div className="lg:col-span-2 bg-stone-900 p-6 rounded-3xl border border-stone-800 flex flex-col justify-between h-full">
              <div className="flex justify-between items-center pb-4 border-b border-stone-800">
                <div>
                  <h3 className="text-white font-bold font-serif text-sm">AI Study Assistant</h3>
                  <p className="text-[10px] text-stone-400 mt-1">Context: {aiChatSubject}</p>
                </div>
                <span className="text-[10px] text-indigo-400 flex items-center gap-1 font-bold">
                  <Wifi className="w-3.5 h-3.5" /> 24/7 Academic Tutor
                </span>
              </div>

              {/* Message thread */}
              <div className="flex-1 overflow-y-auto space-y-4 my-4 pr-2">
                {chatMessages.map((m, idx) => {
                  const isBot = m.role === 'bot';
                  return (
                    <div key={idx} className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}>
                      <div className={`p-4 rounded-2xl max-w-lg text-xs leading-relaxed ${
                        isBot ? 'bg-stone-950 text-stone-300 rounded-tl-none border border-stone-850' : 'bg-indigo-600 text-white rounded-tr-none'
                      }`}>
                        {m.content.split('\n').map((para: string, pIdx: number) => (
                          <p key={pIdx} className={pIdx > 0 ? 'mt-2' : ''}>{para}</p>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {isAiTyping && (
                  <div className="flex justify-start">
                    <div className="p-4 rounded-2xl bg-stone-950 text-stone-400 border border-stone-850 rounded-tl-none text-xs italic">
                      AI is typing study guides...
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Send Form */}
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask a question about formulas, definitions, or try a practice quiz..."
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-stone-100 placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-xl transition-all"
                >
                  <SendHorizontal className="w-4.5 h-4.5" />
                </button>
              </form>
            </div>

          </div>
        )}

        {/* LIBRARY CATALOG TAB */}
        {activeTab === 'library' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Catalog search */}
            <div className="lg:col-span-2 bg-stone-900 p-6 rounded-3xl border border-stone-800 space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h3 className="text-white font-bold font-serif">Library Book Search Catalog</h3>
                
                <div className="relative w-full md:w-64">
                  <Search className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by title or author..."
                    className="w-full bg-stone-955 border border-stone-800 rounded-xl pl-9 pr-4 py-2.5 text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-indigo-600 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCatalog.map((book: any) => (
                  <div key={book.id} className="bg-stone-955 p-4 rounded-2xl border border-stone-800 flex justify-between items-start text-xs">
                    <div>
                      <p className="font-bold text-white">{book.title}</p>
                      <p className="text-stone-500 text-[10px] mt-0.5">Author: {book.author}</p>
                      <p className="text-[10px] text-stone-400 mt-1 bg-stone-900 px-2 py-0.5 rounded-full inline-block border border-stone-850">
                        {book.subject}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      book.available ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900' : 'bg-rose-955/60 text-rose-400 border border-rose-900'
                    }`}>
                      {book.available ? 'AVAILABLE' : 'ISSUED'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Issued books list & Fines */}
            <div className="bg-stone-900 p-6 rounded-3xl border border-stone-800 space-y-6">
              <h3 className="text-white font-bold font-serif">Books Checked Out</h3>

              {fineMessage && (
                <div className="bg-indigo-950/60 border border-indigo-900 text-indigo-400 p-4 rounded-2xl text-xs font-semibold">
                  {fineMessage}
                </div>
              )}

              <div className="space-y-4">
                {libraryData?.issues?.length === 0 ? (
                  <p className="text-stone-500 text-xs text-center py-6">No books issued currently.</p>
                ) : (
                  libraryData?.issues?.map((iss: any) => (
                    <div key={iss.id} className="bg-stone-955 p-4 rounded-2xl border border-stone-800 space-y-3 text-xs">
                      <div>
                        <p className="font-bold text-white">{iss.book_title}</p>
                        <p className="text-stone-500 text-[10px]">Due: {new Date(iss.due_date).toLocaleDateString()}</p>
                      </div>

                      {Number(iss.fine_amount) > 0 && (
                        <div className="flex justify-between items-center border-t border-stone-850 pt-3 mt-1">
                          <div>
                            <p className="text-rose-500 font-bold">Outstanding Fine: ₹{iss.fine_amount}</p>
                            <p className="text-[9px] text-stone-500">{iss.fine_paid ? 'Paid' : 'Unpaid'}</p>
                          </div>
                          {!iss.fine_paid && (
                            <button
                              onClick={() => payFine(iss.id)}
                              className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] px-3 py-1.5 rounded-xl transition-all"
                            >
                              Pay Fine
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

        {/* STUDY MATERIALS TAB */}
        {activeTab === 'study-materials' && (
          <div className="bg-stone-900 p-6 rounded-3xl border border-stone-800 space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h3 className="text-white font-bold font-serif">Study Materials & Syllabus Library</h3>
              
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={studySearch}
                  onChange={(e) => setStudySearch(e.target.value)}
                  placeholder="Search materials by title..."
                  className="w-full bg-stone-955 border border-stone-800 rounded-xl pl-9 pr-4 py-2.5 text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-indigo-600 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMaterials.map(m => (
                <div key={m.id} className="bg-stone-955 p-4 rounded-2xl border border-stone-800 flex justify-between items-center text-xs">
                  <div className="space-y-1">
                    <p className="font-bold text-white">{m.title}</p>
                    <p className="text-stone-500 text-[10px]">{m.subject} · {m.chapter}</p>
                    <p className="text-stone-400 text-[10px] italic">"{m.description}"</p>
                  </div>
                  
                  <button 
                    onClick={() => alert(`Downloading ${m.title} PDF`)}
                    className="p-3 bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-stone-750 text-indigo-400 rounded-xl transition-all shrink-0"
                    title="Download Notes"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DIGITAL ID CARD WALLET TAB */}
        {activeTab === 'wallet' && dashboardData && (
          <div className="max-w-md mx-auto bg-stone-900 p-6 rounded-3xl border border-stone-800 space-y-6">
            <h3 className="text-white font-bold font-serif text-center">My Digital Wallet ID</h3>

            <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 p-6 rounded-3xl border border-indigo-805 relative overflow-hidden flex flex-col items-center justify-between text-center min-h-[350px]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl animate-pulse" />
              
              <div>
                <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider block">Smart ID Card Wallet</span>
                <span className="text-stone-100 text-xs mt-1 block">Card: {dashboardData.card?.card_no}</span>
              </div>

              {/* QR Code */}
              <div className="bg-white p-3 rounded-2xl shadow-xl my-4">
                <QRCodeSVG value={`STUDENT_ID:${dashboardData.student?.id}`} size={140} />
              </div>

              <div>
                <p className="text-xs text-indigo-300">Available Wallet Balance</p>
                <p className="text-3xl font-bold font-serif text-white mt-1">₹{dashboardData.card?.wallet_balance}</p>
                <p className="text-[10px] text-emerald-400 font-bold mt-2 flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> CARD ACTIVE
                </p>
              </div>
            </div>
          </div>
        )}

        {/* BUS TRACKING TAB */}
        {activeTab === 'bus' && dashboardData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Real-time map */}
            <div className="lg:col-span-2 bg-stone-900 p-6 rounded-3xl border border-stone-800 space-y-4 flex flex-col justify-between h-[500px]">
              <h3 className="text-white font-bold font-serif flex items-center gap-2">
                <MapPin className="w-5 h-5 text-indigo-400" />
                Live School Bus Location Tracking
              </h3>
              
              <div className="flex-1 bg-stone-955 rounded-2xl border border-stone-800 relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
                
                <svg className="absolute inset-0 w-full h-full stroke-indigo-600/30 stroke-[3] fill-none">
                  <path d="M 50 400 Q 200 200 400 300 T 700 100" />
                </svg>

                <div className="absolute top-[215px] left-[320px] z-10 flex flex-col items-center">
                  <div className="bg-indigo-600 text-white p-2 rounded-full shadow-lg shadow-indigo-600/50 animate-bounce">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <span className="bg-stone-900 text-white border border-stone-750 px-2 py-0.5 rounded-full text-[9px] mt-1 font-bold">
                    GPS Active
                  </span>
                </div>
                
                <div className="absolute top-[390px] left-[50px] w-4 h-4 bg-stone-750 border-2 border-white rounded-full" />
                <div className="absolute top-[90px] left-[690px] w-4 h-4 bg-indigo-500 border-2 border-white rounded-full animate-pulse" />
              </div>
            </div>

            {/* Bus Info sidebar */}
            <div className="bg-stone-900 p-6 rounded-3xl border border-stone-800 space-y-6">
              <h3 className="text-white font-bold font-serif">Route Details</h3>
              
              {dashboardData.bus ? (
                <div className="space-y-6">
                  <div className="bg-stone-955 p-4 rounded-2xl border border-stone-800 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-stone-400">Route Name</span>
                      <span className="text-white font-bold">{dashboardData.bus.route_name}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-stone-400">Driver Name</span>
                      <span className="text-white font-bold">{dashboardData.bus.driver_name}</span>
                    </div>
                  </div>

                  <div className="bg-stone-955 p-4 rounded-2xl border border-stone-805 text-center space-y-2">
                    <span className="text-[10px] text-stone-500 uppercase tracking-widest block">Estimated Arrival</span>
                    <span className="text-4xl font-bold font-serif text-indigo-400 block">{dashboardData.bus.eta_minutes} mins</span>
                  </div>
                </div>
              ) : (
                <div className="bg-stone-955 p-6 rounded-2xl border border-stone-800 text-center text-stone-500 text-xs">
                  No transport route assigned to your profile.
                </div>
              )}
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
