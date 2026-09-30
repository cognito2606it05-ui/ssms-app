import React, { useState, useEffect } from 'react';
import { 
  Sparkles, BookOpen, Calendar, DollarSign, CreditCard, TrendingUp, MapPin, 
  MessageSquare, Clock, Lock, Unlock, Settings, Phone, ArrowLeft, User, 
  LogOut, Menu, X, ChevronRight, Wifi, WifiOff, Send, Check, Search, Download, 
  AlertTriangle, Shield, CheckCircle2, AlertCircle, RefreshCw
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar 
} from 'recharts';

interface Child {
  id: number;
  name: string;
  class: string;
  section: string;
  admission_number: string;
  transport_route: string;
  photo_url?: string;
}

export function ParentPortal({ user, onLogout }: { user: any; onLogout: () => void }) {
  const [apiToken, setApiToken] = useState<string | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Tab states
  const [topUpAmount, setTopUpAmount] = useState('500');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMessage, setPaymentMessage] = useState('');
  const [walletMessage, setWalletMessage] = useState('');
  const [spendingLimits, setSpendingLimits] = useState<any>({
    canteen: { daily: 150, weekly: 500, blocked: false },
    library: { daily: 100, weekly: 300, blocked: false }
  });
  
  // PT Meeting states
  const [ptMeetingDate, setPtMeetingDate] = useState('');
  const [ptMeetingSlot, setPtMeetingSlot] = useState('');
  const [ptTeacher, setPtTeacher] = useState('6');
  const [meetingMessage, setMeetingMessage] = useState('');

  // Messaging states
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  // Notification Prefs
  const [notifPrefs, setNotifPrefs] = useState({
    sms: true,
    email: true,
    push: false
  });

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

  // Fetch children list
  useEffect(() => {
    if (apiToken) {
      fetchChildren();
    }
  }, [apiToken]);

  // Fetch dashboard data when child changes
  useEffect(() => {
    if (selectedChild && apiToken) {
      fetchDashboard(selectedChild.id);
    }
  }, [selectedChild, apiToken]);

  // Fetch messages and preferences when needed
  useEffect(() => {
    if (!apiToken) return;
    if (activeTab === 'messages') {
      fetchMessages();
    } else if (activeTab === 'settings') {
      fetchPrefs();
    }
  }, [activeTab, apiToken]);

  const fetchChildren = async () => {
    try {
      const res = await fetch('/api/parent/children', {
        headers: { 'Authorization': `Bearer ${apiToken}` }
      });
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setChildren(data);
        setSelectedChild(data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch children list:', err);
    }
  };

  const fetchDashboard = async (childId: number) => {
    try {
      const res = await fetch(`/api/parent/child/${childId}/dashboard`, {
        headers: { 'Authorization': `Bearer ${apiToken}` }
      });
      const data = await res.json();
      setDashboardData(data);
      if (data.spendingControls) {
        const limits: any = {};
        data.spendingControls.forEach((c: any) => {
          limits[c.category] = {
            daily: Number(c.daily_limit || 200),
            weekly: Number(c.weekly_limit || 1000),
            blocked: c.blocked
          };
        });
        setSpendingLimits(prev => ({ ...prev, ...limits }));
      }
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/parent/messages', {
        headers: { 'Authorization': `Bearer ${apiToken}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setMessages(data);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !apiToken) return;
    try {
      const res = await fetch('/api/parent/messages/send', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`
        },
        body: JSON.stringify({ receiver_id: 6, content: newMessage })
      });
      if (res.ok) {
        setNewMessage('');
        fetchMessages();
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const fetchPrefs = async () => {
    try {
      const res = await fetch('/api/parent/notification-prefs', {
        headers: { 'Authorization': `Bearer ${apiToken}` }
      });
      const data = await res.json();
      setNotifPrefs(data);
    } catch (err) {
      console.error(err);
    }
  };

  const updatePrefs = async (updated: any) => {
    try {
      await fetch('/api/parent/notification-prefs', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`
        },
        body: JSON.stringify(updated)
      });
      setNotifPrefs(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePayFees = async () => {
    if (!selectedChild || !apiToken) return;
    try {
      const res = await fetch(`/api/parent/child/${selectedChild.id}/pay-fees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`
        },
        body: JSON.stringify({ amount: Number(paymentAmount || 5000) })
      });
      const data = await res.json();
      if (res.ok) {
        setPaymentMessage('Payment simulated successfully! Outstanding balance updated.');
        setPaymentAmount('');
        fetchDashboard(selectedChild.id);
      } else {
        setPaymentMessage(data.message || 'Payment failed.');
      }
    } catch (err) {
      setPaymentMessage('Error processing payment.');
    }
  };

  const handleTopUp = async () => {
    if (!selectedChild || !apiToken) return;
    try {
      const res = await fetch(`/api/parent/child/${selectedChild.id}/wallet/topup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`
        },
        body: JSON.stringify({ amount: Number(topUpAmount) })
      });
      if (res.ok) {
        setWalletMessage('Wallet top-up successful!');
        fetchDashboard(selectedChild.id);
      } else {
        setWalletMessage('Top-up failed.');
      }
    } catch (err) {
      setWalletMessage('Error processing top-up.');
    }
  };

  const handleToggleLock = async (currentLocked: boolean) => {
    if (!selectedChild || !apiToken) return;
    try {
      const res = await fetch(`/api/parent/child/${selectedChild.id}/wallet/lock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`
        },
        body: JSON.stringify({ lock: !currentLocked })
      });
      if (res.ok) {
        fetchDashboard(selectedChild.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveLimits = async (category: string) => {
    if (!selectedChild || !apiToken) return;
    const limits = spendingLimits[category];
    try {
      const res = await fetch(`/api/parent/child/${selectedChild.id}/wallet/limits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`
        },
        body: JSON.stringify({
          category,
          daily_limit: limits.daily,
          weekly_limit: limits.weekly,
          blocked: limits.blocked
        })
      });
      if (res.ok) {
        setWalletMessage(`${category.toUpperCase()} limits saved successfully.`);
        fetchDashboard(selectedChild.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBookMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChild || !ptMeetingDate || !ptMeetingSlot || !apiToken) return;
    try {
      const res = await fetch('/api/parent/meetings/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`
        },
        body: JSON.stringify({
          teacher_id: Number(ptTeacher),
          student_id: selectedChild.id,
          meeting_date: ptMeetingDate,
          time_slot: ptMeetingSlot
        })
      });
      if (res.ok) {
        setMeetingMessage('Meeting booked successfully! SMS confirmation sent to registered mobile.');
        setPtMeetingDate('');
        setPtMeetingSlot('');
      } else {
        setMeetingMessage('Failed to book meeting.');
      }
    } catch (err) {
      setMeetingMessage('Error booking meeting.');
    }
  };

  // Prepare chart data from marks feed
  const chartData = dashboardData?.marksFeed?.map((m: any) => ({
    name: m.subject,
    score: Number(m.marks_obtained),
    max: Number(m.max_marks)
  })) || [];

  return (
    <div className="min-h-screen bg-stone-955 text-stone-100 flex flex-col md:flex-row font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-72 bg-stone-900 border-b md:border-b-0 md:border-r border-stone-850 flex flex-col justify-between shrink-0">
        <div className="p-6">
          {/* Logo / Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight">SSMS Portals</h1>
                <p className="text-xs text-stone-400">Parent Self-Service</p>
              </div>
            </div>
            
            {/* Online Status Badge */}
            <div className={`px-2 py-1 rounded-full text-[10px] flex items-center gap-1 ${
              isOnline ? 'bg-emerald-900/40 text-emerald-400' : 'bg-rose-900/40 text-rose-400'
            }`}>
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isOnline ? 'Online' : 'Offline'}
            </div>
          </div>

          {/* Child Switcher Dropdown */}
          {children.length > 0 && (
            <div className="mb-8 bg-stone-950/50 p-4 rounded-2xl border border-stone-800">
              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-2">
                Active Ward / Child
              </label>
              <select
                value={selectedChild?.id || ''}
                onChange={(e) => {
                  const child = children.find(c => c.id === Number(e.target.value));
                  if (child) setSelectedChild(child);
                }}
                className="w-full bg-stone-900 border border-stone-750 rounded-xl px-3 py-2 text-stone-100 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              >
                {children.map(c => (
                  <option key={c.id} value={c.id}>{c.name} (Class {c.class})</option>
                ))}
              </select>
            </div>
          )}

          {/* Nav Links */}
          <nav className="space-y-1">
            {[
              { id: 'overview', label: 'Dashboard Overview', icon: Sparkles },
              { id: 'academics', label: 'Academic Progress', icon: TrendingUp },
              { id: 'fees', label: 'Fee Payments', icon: DollarSign },
              { id: 'wallet', label: 'Smart Card Wallet', icon: CreditCard },
              { id: 'bus', label: 'Real-time Bus Tracking', icon: MapPin },
              { id: 'meetings', label: 'Teacher Meetings', icon: Calendar },
              { id: 'messages', label: 'Message Center', icon: MessageSquare },
              { id: 'settings', label: 'Portal Settings', icon: Settings }
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

        {/* Footer Area */}
        <div className="p-6 border-t border-stone-850 bg-stone-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-950 text-indigo-400 flex items-center justify-center font-bold">
                {user?.name?.[0] || 'P'}
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

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full space-y-6">
        
        {/* Banner Section */}
        <header className="bg-stone-900 rounded-3xl p-6 border border-stone-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold font-serif text-white">Parent Self-Service Portal</h2>
            <p className="text-stone-400 text-sm mt-1">
              Currently viewing information for <span className="text-indigo-400 font-semibold">{selectedChild?.name}</span> (Class {selectedChild?.class}-{selectedChild?.section})
            </p>
          </div>
          <div className="bg-stone-805 px-4 py-2 rounded-2xl border border-stone-750 text-xs text-stone-300">
            Admission Number: <span className="font-bold text-white">{selectedChild?.admission_number || 'N/A'}</span>
          </div>
        </header>

        {/* Dynamic Render based on Active Tab */}
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && dashboardData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Quick Cards Grid */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Top Row: Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Attendance Summary */}
                <div className="bg-stone-900 p-6 rounded-3xl border border-stone-800 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest block">Attendance</span>
                    <span className="text-3xl font-bold font-serif text-white">92.4%</span>
                    <span className="text-xs text-emerald-400 block">Good standing</span>
                  </div>
                  <div className="w-12 h-12 bg-emerald-950/60 rounded-2xl flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                </div>

                {/* Outstanding Balance */}
                <div className="bg-stone-900 p-6 rounded-3xl border border-stone-800 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest block">Outstanding Fee</span>
                    <span className="text-3xl font-bold font-serif text-rose-500">₹{dashboardData.outstandingFee}</span>
                    <span className="text-xs text-stone-400 block">Due in 5 days</span>
                  </div>
                  <div className="w-12 h-12 bg-rose-950/60 rounded-2xl flex items-center justify-center text-rose-400">
                    <DollarSign className="w-6 h-6" />
                  </div>
                </div>

                {/* Wallet Balance */}
                <div className="bg-stone-900 p-6 rounded-3xl border border-stone-800 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest block">Wallet Balance</span>
                    <span className="text-3xl font-bold font-serif text-indigo-400">₹{dashboardData.card?.wallet_balance || 0}</span>
                    <span className="text-xs text-stone-400 block">Status: {dashboardData.card?.status || 'Active'}</span>
                  </div>
                  <div className="w-12 h-12 bg-indigo-950/60 rounded-2xl flex items-center justify-center text-indigo-400">
                    <CreditCard className="w-6 h-6" />
                  </div>
                </div>

              </div>

              {/* AI Insight Card */}
              {dashboardData.aiInsight && (
                <div className="bg-gradient-to-r from-indigo-950 to-purple-950 p-6 rounded-3xl border border-indigo-900/50 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl -mr-16 -mt-16" />
                  <div className="flex gap-4 items-start relative z-10">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-base flex items-center gap-2">
                        {dashboardData.aiInsight.title}
                      </h4>
                      <p className="text-stone-300 text-sm mt-2 leading-relaxed">
                        {dashboardData.aiInsight.insight}
                      </p>
                      <div className="mt-4 flex gap-2">
                        <button 
                          onClick={() => setActiveTab('academics')}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-colors"
                        >
                          View Academics
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Marks & Attendance Calendar preview */}
              <div className="bg-stone-900 p-6 rounded-3xl border border-stone-800">
                <h3 className="text-white font-bold font-serif mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-400" />
                  Recent Exam Performance
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                      <XAxis dataKey="name" stroke="#a3a3a3" />
                      <YAxis stroke="#a3a3a3" />
                      <Tooltip contentStyle={{ backgroundColor: '#171717', borderColor: '#262626' }} />
                      <Bar dataKey="score" fill="#6366f1" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* Sidebar Columns: Notifications & Quick Actions */}
            <div className="space-y-6">
              
              {/* Wallet Lock status */}
              <div className="bg-stone-900 p-6 rounded-3xl border border-stone-800">
                <h3 className="text-white font-bold font-serif mb-4 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-indigo-400" />
                  Smart ID Card Wallet
                </h3>
                <div className="bg-stone-950 p-4 rounded-2xl border border-stone-805 flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-stone-400">Card Status</p>
                    <p className="text-sm font-bold text-white mt-1 capitalize">{dashboardData.card?.status || 'Active'}</p>
                  </div>
                  <button
                    onClick={() => handleToggleLock(dashboardData.card?.status === 'blocked')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                      dashboardData.card?.status === 'blocked' 
                        ? 'bg-emerald-600 text-white hover:bg-emerald-500' 
                        : 'bg-rose-900/60 text-rose-400 border border-rose-800 hover:bg-rose-900'
                    }`}
                  >
                    {dashboardData.card?.status === 'blocked' ? (
                      <>
                        <Unlock className="w-4 h-4" /> Unlock Card
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" /> Lock Card
                      </>
                    )}
                  </button>
                </div>
                
                {/* Spend limit summary */}
                <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-400">Canteen Spend Control:</span>
                    <span className="text-white font-bold">₹{spendingLimits.canteen?.daily}/day</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-400">Library Spend Control:</span>
                    <span className="text-white font-bold">₹{spendingLimits.library?.daily}/day</span>
                  </div>
                </div>
              </div>

              {/* Feed: Marks Entry Notifications */}
              <div className="bg-stone-900 p-6 rounded-3xl border border-stone-800">
                <h3 className="text-white font-bold font-serif mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-400" />
                  Latest Marks Notifications
                </h3>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                  {dashboardData.marksFeed?.map((m: any, idx: number) => (
                    <div key={idx} className="bg-stone-950 p-3 rounded-2xl border border-stone-800 flex justify-between items-center">
                      <div>
                        <p className="text-xs font-bold text-white">{m.subject}</p>
                        <p className="text-[10px] text-stone-500">{m.exam_name}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-indigo-400 font-bold text-sm">{m.marks_obtained}/{m.max_marks}</span>
                        <span className="text-[9px] text-stone-500 block">Entered recently</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ACADEMICS TAB */}
        {activeTab === 'academics' && dashboardData && (
          <div className="space-y-6">
            
            {/* Grid of details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Attendance Tracker */}
              <div className="lg:col-span-2 bg-stone-900 p-6 rounded-3xl border border-stone-800">
                <h3 className="text-white font-bold font-serif mb-6 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-400" />
                    Attendance History Calendar (Last 30 days)
                  </span>
                  <span className="text-xs text-indigo-400 bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-900">
                    Overall: 92.4%
                  </span>
                </h3>

                {/* Color-coded Attendance grid */}
                <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
                  {Array.from({ length: 30 }).map((_, idx) => {
                    const status = idx % 8 === 0 ? 'Absent' : idx % 12 === 0 ? 'Late' : 'Present';
                    const color = status === 'Present' ? 'bg-emerald-950 text-emerald-400 border-emerald-850' 
                                : status === 'Absent' ? 'bg-rose-955 text-rose-400 border-rose-850' 
                                : 'bg-amber-955 text-amber-400 border-amber-850';
                    return (
                      <div 
                        key={idx} 
                        className={`p-3 rounded-2xl border text-center font-bold text-xs flex flex-col justify-between h-20 ${color}`}
                      >
                        <span className="text-[10px] opacity-60">Day {idx+1}</span>
                        <span className="text-[11px] truncate">{status}</span>
                      </div>
                    );
                  })}
                </div>
                
                {/* Legend */}
                <div className="flex gap-4 mt-6 text-xs text-stone-400 justify-end">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-emerald-950 border border-emerald-850 inline-block" />
                    <span>Present</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-rose-955 border border-rose-850 inline-block" />
                    <span>Absent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-amber-955 border border-amber-850 inline-block" />
                    <span>Late</span>
                  </div>
                </div>
              </div>

              {/* Progress Analysis & Report Card Download */}
              <div className="bg-stone-900 p-6 rounded-3xl border border-stone-800 space-y-6">
                <div>
                  <h3 className="text-white font-bold font-serif mb-2 flex items-center gap-2">
                    <Download className="w-5 h-5 text-indigo-400" />
                    Report Cards
                  </h3>
                  <p className="text-stone-400 text-xs leading-relaxed">
                    Download official, term-wise progress reports with digital signatures.
                  </p>
                </div>
                
                <div className="space-y-3">
                  <button 
                    onClick={() => alert('Downloading Term 1 Report Card PDF')}
                    className="w-full bg-stone-950 hover:bg-stone-800 p-4 rounded-2xl border border-stone-800 flex justify-between items-center text-left text-xs font-semibold group transition-all"
                  >
                    <div>
                      <p className="text-white group-hover:text-indigo-400">Term 1 Examination Report</p>
                      <p className="text-stone-500 text-[10px]">Academic Year 2025-2026</p>
                    </div>
                    <Download className="w-4 h-4 text-stone-400" />
                  </button>

                  <button 
                    onClick={() => alert('Downloading Unit Test 1 Report Card PDF')}
                    className="w-full bg-stone-950 hover:bg-stone-800 p-4 rounded-2xl border border-stone-800 flex justify-between items-center text-left text-xs font-semibold group transition-all"
                  >
                    <div>
                      <p className="text-white group-hover:text-indigo-400">Unit Test 1 Report</p>
                      <p className="text-stone-500 text-[10px]">Academic Year 2025-2026</p>
                    </div>
                    <Download className="w-4 h-4 text-stone-400" />
                  </button>
                </div>
              </div>

            </div>

            {/* Performance charts */}
            <div className="bg-stone-900 p-6 rounded-3xl border border-stone-800">
              <h3 className="text-white font-bold font-serif mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
                Performance Metrics & Trend Analysis
              </h3>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                    <XAxis dataKey="name" stroke="#a3a3a3" />
                    <YAxis stroke="#a3a3a3" />
                    <Tooltip contentStyle={{ backgroundColor: '#171717', borderColor: '#262626' }} />
                    <Legend />
                    <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="max" stroke="#d97706" strokeWidth={2} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        )}

        {/* FEES TAB */}
        {activeTab === 'fees' && dashboardData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Payment interface */}
            <div className="lg:col-span-2 bg-stone-900 p-6 rounded-3xl border border-stone-800 space-y-6">
              <h3 className="text-white font-bold font-serif flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-indigo-400" />
                Invoice & Fee Payments
              </h3>

              <div className="bg-stone-950 p-6 rounded-3xl border border-stone-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <p className="text-xs text-stone-400">Total Outstanding Balance</p>
                  <p className="text-3xl font-bold font-serif text-rose-500 mt-1">₹{dashboardData.outstandingFee}</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder={`Enter amount (max ₹${dashboardData.outstandingFee})`}
                    className="bg-stone-900 border border-stone-700 rounded-xl px-4 py-2 text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs w-full md:w-48"
                  />
                  <button
                    onClick={handlePayFees}
                    disabled={!dashboardData.outstandingFee}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all shrink-0"
                  >
                    Pay Now (UPI/Razorpay)
                  </button>
                </div>
              </div>

              {paymentMessage && (
                <div className="bg-indigo-950/60 border border-indigo-900 text-indigo-300 p-4 rounded-2xl text-xs font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  {paymentMessage}
                </div>
              )}

              {/* Payment History */}
              <div className="space-y-4">
                <h4 className="text-white font-bold text-sm">Payment History</h4>
                <div className="space-y-3">
                  {dashboardData.paymentHistory?.length === 0 ? (
                    <p className="text-stone-500 text-xs">No payment history found.</p>
                  ) : (
                    dashboardData.paymentHistory?.map((p: any, idx: number) => (
                      <div key={idx} className="bg-stone-955 p-4 rounded-2xl border border-stone-800 flex justify-between items-center">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-white">Invoice #{p.invoice_no || p.invoice_id}</p>
                          <p className="text-[10px] text-stone-500">Method: {p.method?.toUpperCase()} · Txn: {p.receipt_no}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-emerald-400 font-bold text-sm">₹{p.amount}</p>
                          <p className="text-[9px] text-stone-400 mt-1">{new Date(p.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Right sidebar: Due Dates Calendar */}
            <div className="bg-stone-900 p-6 rounded-3xl border border-stone-800 space-y-6">
              <h3 className="text-white font-bold font-serif flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-400" />
                Upcoming Due Dates
              </h3>

              <div className="space-y-4">
                {[
                  { title: 'Tuition Fee Installment Q1', date: 'July 10, 2025', amount: '₹12,500', status: 'Upcoming' },
                  { title: 'Transport Fee Term 1', date: 'July 15, 2025', amount: '₹3,000', status: 'Upcoming' },
                  { title: 'Hostel Rent Split Q1', date: 'August 01, 2025', amount: '₹15,000', status: 'Upcoming' }
                ].map((due, idx) => (
                  <div key={idx} className="bg-stone-955 p-4 rounded-2xl border border-stone-800 space-y-2">
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-bold text-white leading-tight">{due.title}</p>
                      <span className="bg-indigo-950 text-indigo-400 border border-indigo-900 px-2 py-0.5 rounded-full text-[9px]">
                        {due.status}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-stone-400">
                      <span>Due: {due.date}</span>
                      <span className="font-bold text-white">{due.amount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* WALLET TAB */}
        {activeTab === 'wallet' && dashboardData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Wallet details & Actions */}
            <div className="lg:col-span-2 bg-stone-900 p-6 rounded-3xl border border-stone-800 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-white font-bold font-serif flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-indigo-400" />
                  Smart Card Wallet & Parental Controls
                </h3>
                
                {/* Status Toggle */}
                <button
                  onClick={() => handleToggleLock(dashboardData.card?.status === 'blocked')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    dashboardData.card?.status === 'blocked' 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-rose-900/60 text-rose-400 border border-rose-800'
                  }`}
                >
                  {dashboardData.card?.status === 'blocked' ? <Unlock className="w-4.5 h-4.5" /> : <Lock className="w-4.5 h-4.5" />}
                  {dashboardData.card?.status === 'blocked' ? 'Unlock Card' : 'Freeze / Lock Card'}
                </button>
              </div>

              {/* Wallet overview card */}
              <div className="bg-gradient-to-r from-indigo-900 to-indigo-950 p-6 rounded-3xl border border-indigo-800/40 relative overflow-hidden flex flex-col justify-between h-48">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24 blur-xl" />
                
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider block">Smart ID Digital Wallet</span>
                    <span className="text-stone-100 text-xs mt-1 block">Card No: {dashboardData.card?.card_no || 'NOT ISSUED'}</span>
                  </div>
                  <div className="w-12 h-8 bg-white/10 rounded-lg flex items-center justify-center font-bold text-xs text-white">
                    SSMS
                  </div>
                </div>

                <div className="relative z-10">
                  <span className="text-[10px] text-indigo-300 block">Available Balance</span>
                  <span className="text-3xl font-bold font-serif text-white block mt-1">₹{dashboardData.card?.wallet_balance || 0}</span>
                </div>
              </div>

              {/* Top up & Limit Updates messages */}
              {walletMessage && (
                <div className="bg-indigo-950/60 border border-indigo-900 text-indigo-350 p-4 rounded-2xl text-xs font-semibold">
                  {walletMessage}
                </div>
              )}

              {/* Top-up card */}
              <div className="bg-stone-950 p-6 rounded-3xl border border-stone-800 space-y-4">
                <h4 className="text-white font-bold text-sm">Add Funds to Smart Card</h4>
                <div className="flex flex-wrap gap-2">
                  {['100', '200', '500', '1000'].map(amt => (
                    <button
                      key={amt}
                      onClick={() => setTopUpAmount(amt)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
                        topUpAmount === amt 
                          ? 'bg-indigo-600 text-white border-indigo-500' 
                          : 'bg-stone-900 text-stone-300 border-stone-800 hover:border-stone-700'
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <input
                    type="number"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                    placeholder="Custom Amount"
                    className="bg-stone-900 border border-stone-700 rounded-xl px-4 py-2 text-stone-100 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs w-full"
                  />
                  <button
                    onClick={handleTopUp}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all shrink-0"
                  >
                    Top-up Wallet
                  </button>
                </div>
              </div>

              {/* Limits and blocks per category */}
              <div className="space-y-4 bg-stone-950 p-6 rounded-3xl border border-stone-800">
                <h4 className="text-white font-bold text-sm">Spending Limits & Restrictions</h4>
                
                {['canteen', 'library'].map(cat => (
                  <div key={cat} className="space-y-3 p-4 bg-stone-900 rounded-2xl border border-stone-800">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xs text-white capitalize">{cat} Portal Settings</span>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <span className="text-[10px] text-stone-400">Block Purchases</span>
                        <input
                          type="checkbox"
                          checked={spendingLimits[cat]?.blocked || false}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setSpendingLimits((prev: any) => ({
                              ...prev,
                              [cat]: { ...prev[cat], blocked: val }
                            }));
                          }}
                          className="accent-indigo-600"
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-stone-400 block mb-1">Daily Limit (₹)</label>
                        <input
                          type="number"
                          value={spendingLimits[cat]?.daily || ''}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setSpendingLimits((prev: any) => ({
                              ...prev,
                              [cat]: { ...prev[cat], daily: val }
                            }));
                          }}
                          className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-stone-100 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-stone-400 block mb-1">Weekly Limit (₹)</label>
                        <input
                          type="number"
                          value={spendingLimits[cat]?.weekly || ''}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setSpendingLimits((prev: any) => ({
                              ...prev,
                              [cat]: { ...prev[cat], weekly: val }
                            }));
                          }}
                          className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-stone-100 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                        />
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleSaveLimits(cat)}
                      className="bg-indigo-900 hover:bg-indigo-850 text-indigo-200 border border-indigo-850 text-[10px] font-bold px-3 py-1.5 rounded-xl transition-all block text-center w-full"
                    >
                      Save {cat.toUpperCase()} Settings
                    </button>
                  </div>
                ))}
              </div>

            </div>

            {/* Left Column: Transaction Feed */}
            <div className="bg-stone-900 p-6 rounded-3xl border border-stone-800 space-y-4">
              <h3 className="text-white font-bold font-serif flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-400" />
                Wallet Transactions (Last 10)
              </h3>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {dashboardData.walletTransactions?.length === 0 ? (
                  <p className="text-stone-500 text-xs">No transactions recorded.</p>
                ) : (
                  dashboardData.walletTransactions?.map((txn: any, idx: number) => (
                    <div key={idx} className="bg-stone-955 p-3 rounded-2xl border border-stone-800 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-white capitalize">{txn.module || 'System'}</p>
                        <p className="text-[10px] text-stone-500">{txn.kind?.toUpperCase()} · {new Date(txn.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <span className={`font-bold ${txn.type === 'topup' || txn.kind === 'topup' ? 'text-emerald-400' : 'text-stone-350'}`}>
                          {txn.type === 'topup' || txn.kind === 'topup' ? '+' : '-'}₹{txn.amount}
                        </span>
                      </div>
                    </div>
                  ))
                )}
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
                Live School Bus Location
              </h3>
              
              {/* Map widget simulator */}
              <div className="flex-1 bg-stone-950 rounded-2xl border border-stone-800 relative overflow-hidden flex items-center justify-center">
                {/* Grid markings */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
                
                {/* Route line */}
                <svg className="absolute inset-0 w-full h-full stroke-indigo-600/30 stroke-[3] fill-none">
                  <path d="M 50 400 Q 200 200 400 300 T 700 100" />
                </svg>

                {/* Bus marker */}
                <div className="absolute top-[215px] left-[320px] z-10 flex flex-col items-center">
                  <div className="bg-indigo-600 text-white p-2 rounded-full shadow-lg shadow-indigo-600/50 animate-bounce">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <span className="bg-stone-900 text-white border border-stone-750 px-2 py-0.5 rounded-full text-[9px] mt-1 font-bold">
                    GPS Active
                  </span>
                </div>
                
                {/* Route stops */}
                <div className="absolute top-[390px] left-[50px] w-4 h-4 bg-stone-700 border-2 border-white rounded-full" title="Start Point" />
                <div className="absolute top-[90px] left-[690px] w-4 h-4 bg-indigo-500 border-2 border-white rounded-full animate-pulse" title="School" />

                <div className="absolute bottom-4 left-4 bg-stone-900/90 border border-stone-800 p-4 rounded-xl text-xs space-y-2 z-10 max-w-xs">
                  <p className="font-bold text-white">Driver Status</p>
                  <p className="text-stone-400">Driver is currently on route, driving at 45 km/h. Next stop: Sector 15. ETA 8 min.</p>
                </div>
              </div>
            </div>

            {/* Bus Info sidebar */}
            <div className="bg-stone-900 p-6 rounded-3xl border border-stone-800 space-y-6">
              <h3 className="text-white font-bold font-serif">Route Information</h3>
              
              {dashboardData.bus ? (
                <div className="space-y-6">
                  <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-stone-400">Route Name</span>
                      <span className="text-white font-bold">{dashboardData.bus.route_name}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-stone-400">Driver Name</span>
                      <span className="text-white font-bold">{dashboardData.bus.driver_name}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-stone-400">Phone Number</span>
                      <span className="text-indigo-400 font-bold flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" />
                        {dashboardData.bus.driver_phone}
                      </span>
                    </div>
                  </div>

                  <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 text-center space-y-2">
                    <span className="text-[10px] text-stone-500 uppercase tracking-widest block">Estimated Arrival (ETA)</span>
                    <span className="text-4xl font-bold font-serif text-indigo-400 block">{dashboardData.bus.eta_minutes} mins</span>
                    <span className="text-xs text-stone-400 block">GPS coordinates: {dashboardData.bus.lat}, {dashboardData.bus.lng}</span>
                  </div>
                </div>
              ) : (
                <div className="bg-stone-950 p-6 rounded-2xl border border-stone-800 text-center text-stone-500 text-xs">
                  No transport route assigned to this student.
                </div>
              )}
            </div>

          </div>
        )}

        {/* PT MEETING TAB */}
        {activeTab === 'meetings' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Booking Form */}
            <div className="lg:col-span-2 bg-stone-900 p-6 rounded-3xl border border-stone-800 space-y-6">
              <h3 className="text-white font-bold font-serif flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-400" />
                Book Parent-Teacher Meeting Slot
              </h3>

              <form onSubmit={handleBookMeeting} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-stone-400 block mb-2">Select Teacher</label>
                    <select
                      value={ptTeacher}
                      onChange={(e) => setPtTeacher(e.target.value)}
                      className="w-full bg-stone-955 border border-stone-800 rounded-xl px-4 py-3 text-stone-100 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs"
                    >
                      <option value="6">Mrs. Sharma (Mathematics Teacher)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-stone-400 block mb-2">Meeting Date</label>
                    <input
                      type="date"
                      value={ptMeetingDate}
                      onChange={(e) => setPtMeetingDate(e.target.value)}
                      className="w-full bg-stone-955 border border-stone-800 rounded-xl px-4 py-3 text-stone-100 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-stone-400 block mb-2">Available Slot</label>
                  <select
                    value={ptMeetingSlot}
                    onChange={(e) => setPtMeetingSlot(e.target.value)}
                    className="w-full bg-stone-955 border border-stone-800 rounded-xl px-4 py-3 text-stone-100 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs"
                  >
                    <option value="">-- Select Time Slot --</option>
                    <option value="10:00 AM - 10:30 AM">10:00 AM - 10:30 AM</option>
                    <option value="10:30 AM - 11:00 AM">10:30 AM - 11:00 AM</option>
                    <option value="02:00 PM - 02:30 PM">02:00 PM - 02:30 PM</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={!ptMeetingDate || !ptMeetingSlot}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs py-3 rounded-xl transition-all"
                >
                  Book Appointment Slot
                </button>
              </form>

              {meetingMessage && (
                <div className="bg-emerald-950/60 border border-emerald-905 text-emerald-400 p-4 rounded-2xl text-xs font-semibold">
                  {meetingMessage}
                </div>
              )}
            </div>

            {/* Right sidebar: Scheduled list */}
            <div className="bg-stone-900 p-6 rounded-3xl border border-stone-800 space-y-6">
              <h3 className="text-white font-bold font-serif">Your Booked Meetings</h3>
              
              <div className="space-y-4">
                {[
                  { teacher: 'Mrs. Sharma', subject: 'Mathematics', date: 'June 12, 2026', time: '10:00 AM - 10:30 AM', status: 'Booked' }
                ].map((meet, idx) => (
                  <div key={idx} className="bg-stone-955 p-4 rounded-2xl border border-stone-850 space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="text-xs font-bold text-white">{meet.teacher}</p>
                      <span className="bg-indigo-955 text-indigo-400 border border-indigo-900 px-2 py-0.5 rounded-full text-[9px]">
                        {meet.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-400 space-y-1">
                      <p>Subject: {meet.subject}</p>
                      <p>Date: {meet.date}</p>
                      <p>Time: {meet.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* MESSAGE CENTER */}
        {activeTab === 'messages' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[550px]">
            
            {/* Channels / Contacts */}
            <div className="bg-stone-900 p-6 rounded-3xl border border-stone-800 flex flex-col gap-4">
              <h3 className="text-white font-bold font-serif">Staff Contacts</h3>
              
              <div className="space-y-2 overflow-y-auto flex-1">
                <button className="w-full text-left bg-stone-950 border border-indigo-900 p-4 rounded-2xl flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                    T
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Mrs. Sharma</p>
                    <p className="text-[10px] text-stone-500">Mathematics Teacher</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Chat Thread */}
            <div className="lg:col-span-2 bg-stone-900 p-6 rounded-3xl border border-stone-800 flex flex-col justify-between h-full">
              <div className="flex justify-between items-center pb-4 border-b border-stone-800">
                <h3 className="text-white font-bold font-serif text-sm">Conversation with Mrs. Sharma</h3>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-bold">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block" /> Active now
                </span>
              </div>

              {/* Message Feed */}
              <div className="flex-1 overflow-y-auto space-y-4 my-4 pr-2">
                {messages.length === 0 ? (
                  <p className="text-center text-stone-500 text-xs py-8">No messages found. Start typing below.</p>
                ) : (
                  messages.map((m: any, idx: number) => {
                    const isMe = m.sender_id === user?.id;
                    return (
                      <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-4 rounded-2xl max-w-md text-xs leading-relaxed ${
                          isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-stone-950 text-stone-300 rounded-tl-none border border-stone-850'
                        }`}>
                          <p>{m.content}</p>
                          <span className="text-[8px] text-stone-400 block mt-1 text-right font-bold">
                            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={sendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message to teacher..."
                  className="w-full bg-stone-955 border border-stone-800 rounded-xl px-4 py-3 text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-xl transition-all shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>

          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="bg-stone-900 p-6 rounded-3xl border border-stone-800 space-y-6">
            <h3 className="text-white font-bold font-serif flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-400" />
              Notification Channels & Alert Preferences
            </h3>

            <div className="space-y-4 max-w-xl">
              {[
                { key: 'sms', title: 'SMS Notifications', desc: 'Get attendance status and emergency campus notices via text messages.' },
                { key: 'email', title: 'Email Alerts', desc: 'Receive detailed fee receipts, invoice copies, and weekly progress cards.' },
                { key: 'push', title: 'Push Alerts (Mobile PWA)', desc: 'Get live updates on class grading feed and real-time school bus arrivals.' }
              ].map(pref => (
                <div key={pref.key} className="bg-stone-950 p-4 rounded-2xl border border-stone-800 flex justify-between items-center">
                  <div>
                    <h4 className="text-white font-bold text-xs">{pref.title}</h4>
                    <p className="text-stone-500 text-[10px] mt-1 leading-relaxed">{pref.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(notifPrefs as any)[pref.key] || false}
                      onChange={(e) => {
                        const updated = { ...notifPrefs, [pref.key]: e.target.checked };
                        updatePrefs(updated);
                      }}
                      className="accent-indigo-600"
                    />
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
