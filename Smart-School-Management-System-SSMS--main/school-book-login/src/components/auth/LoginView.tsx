import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  UserCog, 
  GraduationCap, 
  User as UserIcon, 
  Users, 
  Shield, 
  Phone, 
  Briefcase, 
  DollarSign, 
  Library, 
  Coffee,
  School,
  ArrowLeft,
  ArrowRight,
  BookOpen as BookIcon,
  Sun,
  Moon,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { VerificationNotice } from '../VerificationNotice';
import { getRoleTheme } from '../RoleEntryAnimation';

const Page = ({ children, backContent, isOpen, index, totalPages, zIndex }: { 
  children: React.ReactNode; 
  backContent?: React.ReactNode;
  isOpen: boolean; 
  index: number; 
  totalPages: number;
  zIndex: number;
}) => {
  return (
    <motion.div
      className="absolute top-0 left-1/2 w-1/2 h-full origin-left preserve-3d"
      initial={false}
      animate={{
        rotateY: isOpen ? -180 : 0,
        zIndex: isOpen ? index : totalPages - index,
        skewY: isOpen ? [0, -2, 0] : [0, 2, 0],
      }}
      transition={{
        duration: 1.6,
        ease: [0.76, 0, 0.24, 1]
      }}
      style={{ zIndex }}
    >
      {/* Front of the page */}
      <motion.div 
        className="absolute inset-0 backface-hidden page-gradient border-l border-stone-300 dark:border-stone-800 page-shadow-left rounded-r-lg overflow-hidden"
        whileHover={{
          boxShadow: "0 0 20px rgba(59, 130, 246, 0.5)",
          scale: 1.01,
          borderColor: "rgba(59, 130, 246, 0.8)",
        }}
      >
        <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-black/5 dark:bg-white/5 z-10" />
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none z-20"
          animate={{
            x: isOpen ? ['-100%', '200%'] : ['200%', '-100%'],
            opacity: isOpen ? [0, 1, 0] : [0, 1, 0]
          }}
          transition={{ duration: 1.6, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute inset-0 pointer-events-none z-30 bg-gradient-to-l from-black/40 via-black/10 to-transparent"
          initial={false}
          animate={{ opacity: isOpen ? [0, 0.7, 0] : [0, 0.5, 0] }}
          transition={{ duration: 1.6, ease: "easeInOut" }}
        />
        <div className="p-8 h-full flex flex-col relative z-0">
          {children}
        </div>
      </motion.div>

      {/* Back of the page (mirrored) */}
      <div className="absolute inset-0 backface-hidden page-gradient border-r border-stone-300 page-shadow-right rounded-l-lg overflow-hidden" style={{ transform: 'rotateY(180deg)' }}>
        <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-black/5 z-10" />
        <div className="p-8 h-full flex flex-col">
          {backContent}
        </div>
      </div>
    </motion.div>
  );
};

export const LoginView = () => {
  const {
    isMobile,
    currentPage,
    setCurrentPage,
    selectedRole,
    setSelectedRole,
    email,
    setEmail,
    password,
    setPassword,
    rememberMe,
    setRememberMe,
    verificationEmail,
    setVerificationEmail,
    error,
    setError,
    emailError,
    setEmailError,
    passwordError,
    setPasswordError,
    handleBackToLogin,
    handleRoleSelect,
    handleSignUp,
    handleLogin,
    handleForgotPassword,
    handleRefreshVerification,
    handleResendVerification,
    darkMode,
    setDarkMode,
    activeSplash,
    setActiveSplash,
    splashCallback,
    setSplashCallback
  } = useApp();

  const totalPages = 2;

  const roles = [
    { role: 'Super Admin', icon: ShieldCheck, color: 'bg-red-500', neon: 'shadow-lg shadow-red-500/20' },
    { role: 'Management', icon: UserCog, color: 'bg-orange-500', neon: 'shadow-lg shadow-orange-500/20' },
    { role: 'Teacher', icon: GraduationCap, color: 'bg-blue-500', neon: 'shadow-lg shadow-blue-500/20' },
    { role: 'Student', icon: UserIcon, color: 'bg-green-500', neon: 'shadow-lg shadow-green-500/20' },
    { role: 'Parent', icon: Users, color: 'bg-purple-500', neon: 'shadow-lg shadow-purple-500/20' },
    { role: 'Security', icon: Shield, color: 'bg-slate-700', neon: 'shadow-lg shadow-slate-500/20' },
    { role: 'Reception', icon: Phone, color: 'bg-yellow-600', neon: 'shadow-lg shadow-yellow-500/20' },
    { role: 'Store', icon: Briefcase, color: 'bg-stone-600', neon: 'shadow-lg shadow-stone-500/20' },
    { role: 'Accounts', icon: DollarSign, color: 'bg-emerald-600', neon: 'shadow-lg shadow-emerald-500/20' },
    { role: 'Librarian', icon: Library, color: 'bg-indigo-600', neon: 'shadow-lg shadow-indigo-500/20' },
    { role: 'Canteen Manager', icon: Coffee, color: 'bg-amber-600', neon: 'shadow-lg shadow-amber-500/20' },
  ];

  const LeftSideContent = () => (
    <div className="flex flex-col items-center justify-center h-full space-y-8 p-6">
      <motion.div 
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="w-32 h-32 bg-white dark:bg-stone-900 rounded-3xl flex items-center justify-center shadow-2xl border-4 border-blue-400 shadow-lg shadow-blue-500/20"
      >
        <School className="w-16 h-16 text-blue-600 animate-neon" />
      </motion.div>
      <div className="text-center">
        <h3 className="text-xl font-serif font-bold text-stone-950 dark:text-stone-50 text-blue-600">EduSmart Tech</h3>
        <p className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-[0.2em] mt-2">Enterprise Edition 2.0</p>
      </div>
    </div>
  );

  const authTheme = getRoleTheme(selectedRole ?? '');
  const authAccent = selectedRole ? authTheme.accent : '#3b82f6';
  const authAccentDeep = selectedRole ? authTheme.accentDeep : '#1d4ed8';
  const roleMeta = roles.find((r) => r.role === selectedRole);

  return (
    <div className="relative z-10 w-full flex items-center justify-center">
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="fixed top-8 right-8 z-[200] p-3 rounded-2xl bg-white dark:bg-stone-900 shadow-xl border border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 hover:scale-110 transition-all active:scale-95"
        title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
      >
        {darkMode ? <Sun className="w-6 h-6 text-amber-500" /> : <Moon className="w-6 h-6" />}
      </button>

      {isMobile && (
        <div className="w-full h-full max-w-sm flex flex-col items-center justify-center p-4 relative z-10 transition-colors">
          <div className="relative w-full bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col h-[85vh] mt-8">
            <div className="p-5 border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                  <School className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="font-bold text-lg text-stone-800 dark:text-stone-100 leading-tight">EduSmart</h1>
                  <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-widest leading-none mt-0.5">Platform</p>
                </div>
              </div>
              {currentPage > 0 && currentPage < 4 && (
                <button onClick={() => {
                    if (currentPage === 1) setCurrentPage(0);
                    else if (currentPage === 2 || currentPage >= 3) setCurrentPage(1);
                  }} 
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-500 dark:text-stone-400 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col relative custom-scrollbar bg-white dark:bg-stone-900">
              {currentPage === 0 && (
                <div className="flex flex-col h-full items-center justify-center text-center animate-in fade-in zoom-in-95 duration-500">
                  <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-6 border-4 border-blue-100 dark:border-blue-800">
                    <School className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 mb-3">Smart School<br/><span className="text-blue-600">Management</span></h2>
                  <p className="text-stone-500 dark:text-stone-400 text-sm mb-8 px-2">
                    A centralized, secure ecosystem designed to streamline operations and enhance learning.
                  </p>
                  <button
                    onClick={() => setCurrentPage(1)}
                    className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-200 dark:shadow-none active:scale-95 transition-all"
                  >
                    Get Started <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              )}

              {currentPage === 1 && (
                <div className="flex flex-col h-full animate-in slide-in-from-right-8 duration-300">
                  <h3 className="text-2xl font-serif font-bold text-stone-800 dark:text-stone-100 mb-1">Select Role</h3>
                  <p className="text-stone-500 dark:text-stone-400 text-sm mb-6">Choose your account type to proceed.</p>
                  <div className="space-y-3 pb-6 flex-1 overflow-y-auto custom-scrollbar">
                    {roles.map((role) => (
                      <button
                        key={role.role}
                        onClick={() => {
                          handleRoleSelect(role.role);
                          setTimeout(() => setCurrentPage(2), 50);
                        }}
                        className="w-full flex items-center p-4 rounded-2xl border border-stone-200 dark:border-stone-800 hover:border-blue-300 bg-stone-50/50 dark:bg-stone-800/20 active:scale-[0.98] transition-all"
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md ${role.color} ${role.neon} mr-4`}>
                          <role.icon className="w-6 h-6" />
                        </div>
                        <div className="text-left flex-1">
                          <h4 className="font-bold text-stone-800 dark:text-stone-100">{role.role}</h4>
                          <p className="text-[10px] text-stone-500 uppercase tracking-widest mt-0.5">Portal Access</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-stone-400 dark:text-stone-600" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {currentPage === 2 && (
                <div className="flex flex-col h-full animate-in slide-in-from-right-8 duration-300 overflow-y-auto pb-4">
                  <h2 className="text-2xl font-serif font-bold text-stone-800 dark:text-stone-100 mb-2">{selectedRole} Login</h2>
                  <p className="text-stone-500 dark:text-stone-400 text-sm mb-6">Enter credentials to proceed.</p>
                  
                  {verificationEmail ? (
                    <VerificationNotice 
                      email={verificationEmail} 
                      onRefresh={handleRefreshVerification}
                      onResend={handleResendVerification}
                      onBack={handleBackToLogin}
                    />
                  ) : isForgotPassword ? (
                    <form onSubmit={handleForgotPassword} className="space-y-5">
                      <div>
                        <label className="block text-xs font-bold text-stone-500 dark:text-stone-500 uppercase mb-1 ml-1">Email Address</label>
                        <input
                          type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                          placeholder="e.g. user@school.com"
                          className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 dark:text-stone-100 mb-2"
                        />
                      </div>
                      {error && <p className="text-red-500 text-xs font-medium bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">{error}</p>}
                      <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold active:scale-95 transition-all">Send Reset Link</button>
                      <div className="text-center mt-4">
                        <button type="button" onClick={() => { setIsForgotPassword(false); setError(''); }} className="text-xs font-bold text-blue-600 underline">Back to Login</button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-stone-500 dark:text-stone-500 uppercase mb-1 ml-1">Email</label>
                        <input type="email" required value={email} onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                          className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 dark:text-stone-100" />
                        {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-stone-500 dark:text-stone-500 uppercase mb-1 ml-1">Password</label>
                        <input type="password" required value={password} onChange={(e) => { setPassword(e.target.value); setPasswordError(''); }}
                          className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 dark:text-stone-100" />
                        {passwordError && <p className="text-red-500 text-xs mt-1">{passwordError}</p>}
                      </div>
                      
                      <div className="flex items-center justify-between mt-2 mb-4">
                        <div className="flex items-center">
                          <input type="checkbox" id="mobile-remember" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="rounded" />
                          <label htmlFor="mobile-remember" className="ml-2 text-xs font-bold text-stone-500">Remember Me</label>
                        </div>
                        <button type="button" onClick={() => { setIsForgotPassword(true); setError(''); }} className="text-xs text-blue-600 font-bold">Forgot?</button>
                      </div>

                      {error && <p className="text-red-500 text-xs font-medium bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">{error}</p>}
                      
                      <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold active:scale-95 transition-all">Sign In</button>
                      
                      <div className="text-center mt-6">
                        <button type="button" onClick={() => { setCurrentPage(3); setError(''); }} className="text-xs font-bold text-blue-600">Need an account? Register</button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {currentPage >= 3 && (
                <div className="flex flex-col h-full animate-in slide-in-from-right-8 duration-300 overflow-y-auto pb-4">
                  <h2 className="text-2xl font-serif font-bold text-stone-800 dark:text-stone-100 mb-2">{selectedRole} Register</h2>
                  <p className="text-stone-500 dark:text-stone-400 text-sm mb-6">Create your account.</p>
                  {verificationEmail ? (
                    <VerificationNotice 
                      email={verificationEmail} 
                      onRefresh={handleRefreshVerification}
                      onResend={handleResendVerification}
                      onBack={handleBackToLogin}
                    />
                  ) : (
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-stone-500 dark:text-stone-500 uppercase mb-1 ml-1">Email</label>
                        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 dark:text-stone-100" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-stone-500 dark:text-stone-500 uppercase mb-1 ml-1">Password</label>
                        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 dark:text-stone-100" />
                      </div>
                      {error && <p className="text-red-500 text-xs font-medium bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">{error}</p>}
                      
                      <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold active:scale-95 transition-all mt-4">Create Account</button>
                      <div className="text-center mt-6">
                        <button type="button" onClick={() => { setCurrentPage(2); setError(''); }} className="text-xs font-bold text-blue-600">Already have an account? Sign In</button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>

            {activeSplash && selectedRole === 'Student' && (
              <div className="absolute inset-0 z-50 bg-stone-900/90 backdrop-blur-md flex flex-col items-center justify-center rounded-3xl overflow-hidden p-6 animate-in fade-in duration-300">
                <video
                  src={`/api/splashscreens/${activeSplash === 'success' ? 'stu_success' : 'stu_error'}`}
                  autoPlay
                  playsInline
                  muted
                  onEnded={() => {
                    if (splashCallback) {
                      splashCallback();
                    }
                    setActiveSplash(null);
                    setSplashCallback(null);
                  }}
                  className="w-full h-full object-contain"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {!isMobile && currentPage < 2 && (
        <motion.div
          key="book-login"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
          transition={{ duration: 0.5 }}
          className="relative w-[1000px] h-[700px] preserve-3d book-shadow book-glow rounded-lg"
        >
          <div className="absolute top-0 left-[calc(50%-15px)] w-[30px] h-full bg-stone-800 z-50 rounded-sm shadow-inner" />
          <div className="absolute top-0 left-0 w-1/2 h-full bg-stone-900 rounded-l-lg border-r-4 border-stone-800" />
          <div className="absolute top-0 right-0 w-1/2 h-full bg-stone-900 rounded-r-lg border-l-4 border-stone-800" />

          <div className="absolute top-0 left-0 w-1/2 h-full page-gradient border-r border-stone-300 page-shadow-right rounded-l-lg z-0">
            <LeftSideContent />
          </div>

          <Page 
            isOpen={currentPage >= 1} 
            index={0} 
            totalPages={totalPages} 
            zIndex={40}
            backContent={<LeftSideContent />}
          >
            <div className="flex flex-col h-full p-4">
              <div className="flex items-center gap-2 mb-12">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                  <School className="w-5 h-5" />
                </div>
                <span className="font-bold text-xl text-stone-800 dark:text-stone-100">EduSmart <span className="text-blue-600">Tech</span></span>
              </div>

              <div className="space-y-6 flex-1">
                <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  • Enterprise Edition 2.0
                </div>
                
                <h1 className="text-5xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-tight">
                  Smart School <br />
                  <span className="text-blue-600 dark:text-blue-400">Management</span> <br />
                  Platform
                </h1>

                <p className="text-stone-500 dark:text-stone-400 text-sm max-w-xs leading-relaxed">
                  A centralized, secure, and AI-ready ecosystem designed to streamline operations and enhance the learning experience.
                </p>
              </div>

              <div className="flex items-center justify-end mt-8">
                <motion.button
                  whileHover={{ scale: 1.05, x: 5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentPage(1)}
                  className="p-3 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-200 dark:shadow-none"
                >
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </Page>

          <Page 
            isOpen={currentPage >= 2} 
            index={1} 
            totalPages={totalPages} 
            zIndex={30}
            backContent={<LeftSideContent />}
          >
            <div className="h-full flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <BookIcon className="w-5 h-5 text-stone-500" />
                <span className="text-xs font-mono text-stone-500 uppercase tracking-tighter">Select Your Role</span>
              </div>
              
              <h2 className="text-3xl font-serif font-bold text-stone-800 dark:text-stone-100 mb-2">Welcome Back</h2>
              <p className="text-stone-500 dark:text-stone-400 text-sm mb-8">Please select your role to continue to your personalized dashboard.</p>

              <div className="grid grid-cols-1 gap-3 overflow-y-auto pr-2 custom-scrollbar">
                {roles.map((role) => (
                  <motion.button
                    key={role.role}
                    whileHover={{ x: 10, backgroundColor: darkMode ? 'rgb(28 25 23)' : 'rgb(249 250 251)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleRoleSelect(role.role)}
                    className="group flex items-center justify-between p-4 rounded-2xl border border-stone-100 dark:border-stone-800 hover:border-blue-200 dark:hover:border-blue-800 transition-all text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl ${role.color} flex items-center justify-center text-white shadow-lg ${role.neon}`}>
                        <role.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-stone-800 dark:text-stone-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{role.role}</h3>
                        <p className="text-[10px] text-stone-500 dark:text-stone-500 uppercase tracking-widest">Access Portal</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-stone-400 dark:text-stone-600 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                  </motion.button>
                ))}
              </div>

              <button 
                onClick={() => setCurrentPage(0)}
                className="mt-auto flex items-center gap-2 text-stone-500 hover:text-stone-600 transition-colors text-sm"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Cover
              </button>
            </div>
          </Page>
        </motion.div>
      )}

      {!isMobile && currentPage >= 2 && (
        <motion.div
          key="auth-card"
          initial={{ opacity: 0, y: 28, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 28, scale: 0.95 }}
          transition={{ duration: 0.55, ease: [0.16, 0.84, 0.32, 1] }}
          className={`relative rounded-3xl border border-stone-200 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl p-9 shadow-2xl transition-all duration-500 overflow-hidden ${
            activeSplash && selectedRole === 'Student' ? 'w-[500px] h-[500px] min-h-[500px] flex flex-col items-center justify-center' : 'w-[440px] max-w-[92vw] min-h-[460px]'
          }`}
          style={{ ['--accent' as any]: authAccent, borderTop: `4px solid ${authAccent}`, boxShadow: `0 30px 80px -24px ${authAccent}59` }}
        >
          <div className="flex items-center gap-3 mb-8">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0"
              style={{ background: `linear-gradient(135deg, ${authAccent}, ${authAccentDeep})` }}
            >
              {roleMeta ? <roleMeta.icon className="w-7 h-7" /> : <School className="w-7 h-7" />}
            </div>
            <div>
              <h2 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-50 leading-tight">{selectedRole}</h2>
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: authAccent }}>
                {verificationEmail ? 'Verify Email' : isForgotPassword ? 'Reset Password' : currentPage === 2 ? 'Secure Login' : 'Create Account'}
              </p>
            </div>
          </div>

          {verificationEmail ? (
            <VerificationNotice
              email={verificationEmail}
              onRefresh={handleRefreshVerification}
              onResend={handleResendVerification}
              onBack={handleBackToLogin}
            />
          ) : isForgotPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <p className="text-stone-500 dark:text-stone-400 text-sm -mt-2">Enter your email and we'll send you a reset link.</p>
              <div>
                <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase mb-1.5 ml-1">Email Address</label>
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. user@school.com"
                  className="accent-input w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500"
                />
              </div>
              {error && <p className="text-red-500 text-xs font-medium bg-red-50 dark:bg-red-900/20 p-2.5 rounded-lg border border-red-100 dark:border-red-800">{error}</p>}
              <button type="submit" className="w-full py-3 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-[0.98]" style={{ background: `linear-gradient(135deg, ${authAccent}, ${authAccentDeep})` }}>
                Send Reset Link
              </button>
              <div className="text-center">
                <button type="button" onClick={() => { setIsForgotPassword(false); setError(''); }} className="accent-link text-xs font-bold">Back to Login</button>
              </div>
            </form>
          ) : currentPage === 2 ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase mb-1.5 ml-1">Email Address</label>
                <input
                  type="email" required value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                  placeholder="e.g. user@school.com"
                  className={`accent-input w-full px-4 py-3 rounded-xl border ${emailError ? 'border-red-500' : 'border-stone-200 dark:border-stone-700'} bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500`}
                />
                {emailError && <p className="text-red-500 text-xs mt-1 ml-1">{emailError}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase mb-1.5 ml-1">Password</label>
                <input
                  type="password" required value={password}
                  onChange={(e) => { setPassword(e.target.value); setPasswordError(''); }}
                  placeholder="••••••••"
                  className={`accent-input w-full px-4 py-3 rounded-xl border ${passwordError ? 'border-red-500' : 'border-stone-200 dark:border-stone-700'} bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500`}
                />
                {passwordError && <p className="text-red-500 text-xs mt-1 ml-1">{passwordError}</p>}
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-bold text-stone-500 dark:text-stone-400 cursor-pointer">
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4 rounded" style={{ accentColor: authAccent }} />
                  Remember Me
                </label>
                <button type="button" onClick={() => { setIsForgotPassword(true); setError(''); }} className="accent-link text-xs font-bold">Forgot Password?</button>
              </div>
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <p className="text-xs font-medium">{error}</p>
                </div>
              )}
              <button type="submit" className="w-full py-3 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-[0.98]" style={{ background: `linear-gradient(135deg, ${authAccent}, ${authAccentDeep})` }}>
                Sign In
              </button>
              <div className="text-center">
                <button type="button" onClick={() => { setCurrentPage(3); setError(''); }} className="accent-link text-xs font-bold">Need an account? Register Now</button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase mb-1.5 ml-1">Email Address</label>
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. user@school.com"
                  className="accent-input w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase mb-1.5 ml-1">Password</label>
                <input
                  type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="accent-input w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500"
                />
              </div>
              {error && <p className="text-red-500 text-xs font-medium bg-red-50 dark:bg-red-900/20 p-2.5 rounded-lg border border-red-100 dark:border-red-800">{error}</p>}
              <button type="submit" className="w-full py-3 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-[0.98]" style={{ background: `linear-gradient(135deg, ${authAccent}, ${authAccentDeep})` }}>
                Create Account
              </button>
              <div className="text-center">
                <button type="button" onClick={() => { setCurrentPage(2); setError(''); }} className="accent-link text-xs font-bold">Already have an account? Sign In</button>
              </div>
            </form>
          )}

          {!verificationEmail && (
            <button
              onClick={() => { setCurrentPage(1); setSelectedRole(null); setIsForgotPassword(false); setVerificationEmail(null); setError(''); }}
              className="mt-7 flex items-center gap-2 text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors text-sm mx-auto"
            >
              <ArrowLeft className="w-4 h-4" /> Change Role
            </button>
          )}

          {activeSplash && selectedRole === 'Student' && (
            <div className="absolute inset-0 z-50 bg-stone-900/90 backdrop-blur-md flex flex-col items-center justify-center rounded-3xl overflow-hidden p-6 animate-in fade-in duration-300">
              <video
                src={`/api/splashscreens/${activeSplash === 'success' ? 'stu_success' : 'stu_error'}`}
                autoPlay
                playsInline
                muted
                onEnded={() => {
                  if (splashCallback) {
                    splashCallback();
                  }
                  setActiveSplash(null);
                  setSplashCallback(null);
                }}
                className="w-full h-full object-contain"
              />
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};
