import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User as UserIcon, 
  Users, 
  CheckCircle2, 
  GraduationCap, 
  BookOpen as BookIcon, 
  Calendar, 
  School, 
  BarChart3, 
  X, 
  DollarSign, 
  CreditCard, 
  Eye 
} from 'lucide-react';
import { useApp, OperationType, handleFirestoreError } from '../../context/AppContext';
import { db, doc, updateDoc, setDoc } from '../../localDatabase';
import { FeePayment, LeaveRequest } from '../../types';

export const ParentPortal = () => {
  const { 
    students, 
    loggedInUser, 
    attendanceRecords, 
    setNotification,
    showFeeModal,
    setShowFeeModal,
    setActiveAdminTab,
    setViewingReceipt,
    setViewingStudent
  } = useApp();

  const children = students.filter(s => {
    const matchParent = loggedInUser?.linked_id && s.parent_id === loggedInUser.linked_id;
    const matchGuardian = loggedInUser?.email && s.guardian?.email === loggedInUser.email;
    return matchParent || matchGuardian;
  });

  const [selectedChildIndex, setSelectedChildIndex] = useState(0);
  const child = children[selectedChildIndex];
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (children.length === 0) {
    return (
      <div className="bg-white dark:bg-stone-900 p-12 rounded-3xl shadow-xl border border-stone-100 dark:border-stone-800 text-center">
        <Users className="w-16 h-16 text-stone-200 dark:text-stone-700 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-2">No Student Found</h3>
        <p className="text-stone-500 dark:text-stone-400">We couldn't find any student associated with your account. Please contact the administration.</p>
      </div>
    );
  }

  const handlePayFees = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentAmount || isNaN(Number(paymentAmount))) {
      setNotification({ message: 'Please enter a valid amount', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      const studentRef = doc(db, 'students', child.student_id);
      const amountNum = Number(paymentAmount);
      const newPaid = (child.fees?.paid || 0) + amountNum;
      const newStatus = newPaid >= (child.fees?.total || 0) ? 'Paid' : 'Pending';
      
      const newPayment: FeePayment = {
        id: `REC-${Math.random().toString(36).substr(2, 9)}`,
        amount: amountNum,
        date: new Date().toISOString().split('T')[0],
        method: paymentMethod,
        receiptNo: `R-${Math.floor(Math.random() * 100000)}`
      };

      await updateDoc(studentRef, {
        'fees.paid': newPaid,
        'fees.status': newStatus,
        'fees.history': [newPayment, ...(child.fees?.history || [])]
      });
      
      setLastTransaction({
        ...newPayment,
        student: child.name,
        class: `${child.class}-${child.section}`
      });
      setShowFeeModal(false);
      setShowConfirmation(true);
      setPaymentAmount('');
      setNotification({ message: 'Payment Successful! Fee status updated.', type: 'success' });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `students/${child.student_id}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyLeave = async () => {
    const reason = prompt('Enter reason for leave:');
    const start = prompt('Enter start date (YYYY-MM-DD):');
    const end = prompt('Enter end date (YYYY-MM-DD):');
    if (reason && start && end) {
      const newRequest: LeaveRequest = {
        id: `LR-${Math.random().toString(36).substr(2, 9)}`,
        student_id: child.student_id,
        userId: child.student_id,
        studentName: child.name,
        userName: child.name,
        startDate: start,
        endDate: end,
        reason,
        status: 'Pending',
        appliedAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'leaveRequests', newRequest.id), newRequest);
      setNotification({ message: 'Leave request submitted successfully!', type: 'success' });
    }
  };

  return (
    <div className="space-y-8">
      {children.length > 1 && (
        <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
          {children.map((c, idx) => (
            <button
              key={c.student_id}
              onClick={() => setSelectedChildIndex(idx)}
              className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-bold transition-all whitespace-nowrap ${
                selectedChildIndex === idx 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 dark:shadow-none' 
                  : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border border-stone-100 dark:border-stone-800 hover:border-blue-200 dark:hover:border-blue-900'
              }`}
            >
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                {c.photo ? <img src={c.photo} className="w-full h-full object-cover" /> : <UserIcon className="w-4 h-4 text-stone-500" />}
              </div>
              {c.name.split(' ')[0]}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Child Info */}
          <div className="bg-white dark:bg-stone-900 p-8 rounded-3xl shadow-xl border border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center overflow-hidden border border-blue-100 dark:border-blue-900/30">
                {child.photo ? (
                  <img src={child.photo} alt="Child" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-10 h-10 text-blue-400 dark:text-blue-500" />
                )}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-stone-800 dark:text-stone-100">{child.name}</h3>
                <p className="text-stone-500 dark:text-stone-400">Class {child.class} - Section {child.section} • ID: {child.student_id}</p>
              </div>
              <button 
                onClick={() => setViewingStudent(child)}
                className="ml-auto p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl font-bold text-xs hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all"
              >
                View Full Report
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-stone-50 dark:bg-stone-800 rounded-2xl">
                <p className="text-[10px] font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest mb-1">Attendance</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">96.5%</p>
              </div>
              <div className="p-4 bg-stone-50 dark:bg-stone-800 rounded-2xl">
                <p className="text-[10px] font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest mb-1">Last Grade</p>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">A+</p>
              </div>
              <div className="p-4 bg-stone-50 dark:bg-stone-800 rounded-2xl">
                <p className="text-[10px] font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest mb-1">Dues</p>
                <p className="text-xl font-bold text-red-600 dark:text-red-400">${(child.fees?.total || 0) - (child.fees?.paid || 0)}</p>
              </div>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="bg-white dark:bg-stone-900 p-8 rounded-3xl shadow-xl border border-stone-100 dark:border-stone-800">
            <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100 mb-6">Recent Activities</h3>
            <div className="space-y-6">
              {[
                { title: 'Attendance Marked', time: 'Today, 08:30 AM', desc: `${child.name} was marked present for the day.`, icon: CheckCircle2, color: 'text-emerald-500' },
                { title: 'New Grade Posted', time: 'Yesterday', desc: 'Mathematics Quiz 3: 18/20 (A+)', icon: GraduationCap, color: 'text-blue-500' },
                { title: 'Library Book Issued', time: '2 days ago', desc: 'Advanced Physics by H.C. Verma', icon: BookIcon, color: 'text-purple-500' },
              ].map((activity, i) => (
                <div key={i} className="flex gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-stone-50 dark:bg-stone-800 ${activity.color}`}>
                    <activity.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-800 dark:text-stone-100 text-sm">{activity.title}</h4>
                    <p className="text-xs text-stone-500 dark:text-stone-500 mb-1">{activity.time}</p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">{activity.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Quick Actions */}
          <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800">
            <h3 className="text-sm font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Pay Fees', icon: BarChart3, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', action: () => setShowFeeModal(true) },
                { label: 'Leave Req', icon: Calendar, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20', action: handleApplyLeave },
                { label: 'Transport', icon: School, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', action: () => setActiveAdminTab('transport') },
                { label: 'Contact', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20', action: () => setActiveAdminTab('contact') },
              ].map((action) => (
                <button 
                  key={action.label} 
                  onClick={action.action}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                >
                  <div className={`w-10 h-10 ${action.bg} ${action.color} rounded-xl flex items-center justify-center`}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-stone-600 dark:text-stone-400">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* School Contact */}
          <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800">
            <h3 className="text-sm font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest mb-4">School Contact</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-stone-50 dark:bg-stone-800 rounded-lg flex items-center justify-center text-stone-500 dark:text-stone-500">
                  <School className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-stone-800 dark:text-stone-100">Main Office</p>
                  <p className="text-[10px] text-stone-500 dark:text-stone-400">+1 (555) 123-4567</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-stone-50 dark:bg-stone-800 rounded-lg flex items-center justify-center text-stone-500 dark:text-stone-500">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-stone-800 dark:text-stone-100">Support Email</p>
                  <p className="text-[10px] text-stone-500 dark:text-stone-400">support@edusmart.tech</p>
                </div>
              </div>
            </div>
          </div>

          {/* Notice Board */}
          <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800">
            <h3 className="text-sm font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest mb-4">Notice Board</h3>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1">Annual Sports Day</p>
                <p className="text-[10px] text-blue-800 dark:text-blue-300 opacity-70">Scheduled for March 25th. Please ensure students have their kits ready.</p>
              </div>
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">Parent-Teacher Meeting</p>
                <p className="text-[10px] text-emerald-800 dark:text-emerald-300 opacity-70">Saturday, March 21st from 09:00 AM to 12:00 PM.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fee Payment Modal */}
      <AnimatePresence>
        {showFeeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-stone-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-stone-100 dark:border-stone-800"
            >
              <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center">
                <h3 className="text-xl font-bold text-stone-800 dark:text-stone-100">Pay Student Fees</h3>
                <button onClick={() => setShowFeeModal(false)} className="p-2 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-stone-500 dark:text-stone-500" />
                </button>
              </div>
              
              <form onSubmit={handlePayFees} className="p-6 space-y-6">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800">
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-widest mb-1">Total Outstanding</p>
                  <p className="text-2xl font-bold text-blue-800 dark:text-blue-100">${(child.fees?.total || 0) - (child.fees?.paid || 0)}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Payment Amount</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-500 dark:text-stone-500" />
                    <input
                      type="number"
                      required
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-12 pr-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold dark:text-stone-100"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Payment Method</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['Credit Card', 'Bank Transfer'].map(method => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all ${
                          paymentMethod === method 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100 dark:shadow-none' 
                            : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-blue-200 dark:hover:border-blue-800'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Pay Now
                    </>
                  )}
                </button>
                
                <p className="text-[10px] text-center text-stone-500">
                  Secure encrypted payment processing by EduSmart Pay
                </p>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Payment Confirmation Modal */}
      <AnimatePresence>
        {showConfirmation && lastTransaction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-stone-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-stone-100 dark:border-stone-800"
            >
              <div className="p-8 text-center">
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-stone-800 dark:text-stone-100 mb-2">Payment Successful!</h3>
                <p className="text-stone-500 dark:text-stone-400 text-sm mb-8">Your transaction has been processed successfully.</p>
                
                <div className="bg-stone-50 dark:bg-stone-800 rounded-2xl p-6 mb-8 space-y-3 text-left">
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-500 font-bold uppercase">Transaction ID</span>
                    <span className="text-stone-800 font-mono">{lastTransaction.id}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-500 font-bold uppercase">Amount Paid</span>
                    <span className="text-emerald-600 font-bold">${lastTransaction.amount}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-500 font-bold uppercase">Date</span>
                    <span className="text-stone-800">{lastTransaction.date}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-500 font-bold uppercase">Method</span>
                    <span className="text-stone-800">{lastTransaction.method}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      setViewingReceipt(lastTransaction);
                      setShowConfirmation(false);
                    }}
                    className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Eye className="w-5 h-5" />
                    View Receipt
                  </button>
                  <button
                    onClick={() => setShowConfirmation(false)}
                    className="w-full py-4 bg-stone-100 text-stone-600 rounded-2xl font-bold hover:bg-stone-200 transition-all"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
