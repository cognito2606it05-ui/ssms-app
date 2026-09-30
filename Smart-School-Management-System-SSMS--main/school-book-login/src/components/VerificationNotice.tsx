import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, CheckCircle2, RefreshCw, ArrowLeft, AlertCircle } from 'lucide-react';

interface VerificationNoticeProps {
  email: string;
  onRefresh: () => Promise<void>;
  onResend: () => Promise<void>;
  onBack: () => Promise<void>;
}

export const VerificationNotice: React.FC<VerificationNoticeProps> = ({ 
  email, 
  onRefresh, 
  onResend, 
  onBack 
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setIsResending(true);
    try {
      await onResend();
      setResendCooldown(60); // 60 seconds cooldown
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-8">
      {/* Animated Icon Container */}
      <div className="relative">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center shadow-2xl shadow-blue-100 dark:shadow-none"
        >
          <Mail className="w-12 h-12" />
        </motion.div>
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.1, 0.3]
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 bg-blue-400 dark:bg-blue-600 rounded-full -z-10"
        />
      </div>

      {/* Text Content */}
      <div className="space-y-3">
        <h2 className="text-3xl font-serif font-bold text-stone-800 dark:text-stone-100 tracking-tight">Verify Your Email</h2>
        <div className="space-y-2">
          <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed max-w-xs mx-auto">
            We've sent a secure verification link to:
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-stone-100 dark:bg-stone-800 rounded-full border border-stone-200 dark:border-stone-700">
            <span className="font-mono text-xs font-bold text-stone-700 dark:text-stone-300">{email}</span>
          </div>
          <p className="text-stone-500 dark:text-stone-500 text-xs italic">
            Please check your inbox and follow the instructions to activate your account.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-full max-w-xs space-y-4">
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 dark:shadow-none flex items-center justify-center gap-3 disabled:opacity-70"
        >
          {isRefreshing ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <CheckCircle2 className="w-5 h-5" />
          )}
          {isRefreshing ? 'Checking...' : "I've Verified My Email"}
        </motion.button>

        <motion.button
          whileHover={resendCooldown === 0 ? { scale: 1.02, y: -2 } : {}}
          whileTap={resendCooldown === 0 ? { scale: 0.98 } : {}}
          onClick={handleResend}
          disabled={isResending || resendCooldown > 0}
          className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 border-2 ${
            resendCooldown > 0 
            ? 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-500 cursor-not-allowed' 
            : 'bg-white dark:bg-stone-900 border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 shadow-lg shadow-blue-50 dark:shadow-none'
          }`}
        >
          {isResending ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Mail className="w-5 h-5" />
          )}
          {resendCooldown > 0 
            ? `Resend in ${resendCooldown}s` 
            : isResending ? 'Sending...' : 'Resend Verification Email'}
        </motion.button>

        <button 
          onClick={onBack}
          className="flex items-center gap-2 mx-auto text-sm font-bold text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Login
        </button>
      </div>

      {/* Footer Tip */}
      <div className="mt-auto pt-6 border-t border-stone-100 dark:border-stone-800 w-full">
        <div className="flex items-center justify-center gap-2 text-stone-500 dark:text-stone-500">
          <AlertCircle className="w-4 h-4" />
          <p className="text-[10px] uppercase tracking-widest font-bold">
            Check your spam folder if you don't see it
          </p>
        </div>
      </div>
    </div>
  );
};
