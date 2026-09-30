const fs = require('fs');

try {
  let app = fs.readFileSync('/tmp/school-book-backup/src/App.tsx', 'utf8');

  app = app.replace("import { auth, db } from './firebase';", () => "import { auth, db } from './localDatabase';");
  app = app.replace(/bootstrapFirebase/g, () => 'bootstrapDatabase');

  app = app.replace("import { MobileDashboard } from './components/MobileDashboard';", () => "// import removed");
  app = app.replace("  const [showFeeModal, setShowFeeModal] = useState(false);", () => "  const [showFeeModal, setShowFeeModal] = useState(false);\n  const [isSidebarOpen, setIsSidebarOpen] = useState(false);");
  app = app.replace("    if (!loggedInUser) return null;\n    if (isMobile) return <MobileDashboard user={loggedInUser} onLogout={handleLogout} />;", () => "    if (!loggedInUser) return null;");
  
  app = app.replace(
    '            <aside className="w-72 bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 flex flex-col shadow-xl z-10">',
    () => `            {/* Mobile Sidebar Backdrop */}
            {isMobile && isSidebarOpen && (
              <div 
                className="fixed inset-0 bg-black/50 z-40 backdrop-blur-[2px] transition-opacity" 
                onClick={() => setIsSidebarOpen(false)} 
              />
            )}
            
            {/* Sidebar */}
            <aside className={\`absolute inset-y-0 left-0 bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 flex flex-col shadow-xl z-50 transform \${isMobile && !isSidebarOpen ? '-translate-x-full' : 'translate-x-0'} md:relative md:translate-x-0 transition-transform duration-300 w-72\`}>`
  );

  app = app.replace(
    /                    onClick=\{\(\) => setActiveAdminTab\(tab\.id as any\)\}/g,
    () => '                    onClick={() => { setActiveAdminTab(tab.id as any); if (isMobile) setIsSidebarOpen(false); }}'
  );

  app = app.replace(
    '              <header className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 px-8 py-4 flex items-center justify-between shadow-sm">\n                <div className="flex items-center gap-4">\n                  <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100 capitalize">',
    () => `              <header className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 px-4 md:px-8 py-4 flex items-center justify-between shadow-sm sticky top-0 z-30">
                <div className="flex items-center gap-4">
                  {isMobile && (
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors">
                      <Menu className="w-6 h-6" />
                    </button>
                  )}
                  <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100 capitalize">`
  );

  app = app.replace(
    '            <div className="grid grid-cols-3 gap-6">\n              <div className="p-4 bg-stone-50 dark:bg-stone-800 rounded-2xl">',
    () => '            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">\n              <div className="p-4 bg-stone-50 dark:bg-stone-800 rounded-2xl">'
  );

  const target1 = `            </button>\n            <motion.div \n              key="book-login"`;
  const mobileAuthBlock = `            </button>
            {isMobile && (
              <div className="w-full h-full max-w-sm flex flex-col items-center justify-center p-4 relative z-10 transition-colors">
                <div className="w-full bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col h-[85vh] mt-8">
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
                              <div className={\`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md \${role.color} \${role.neon} mr-4\`}>
                                <role.icon className="w-6 h-6" />
                              </div>
                              <div className="text-left flex-1">
                                <h4 className="font-bold text-stone-800 dark:text-stone-100">{role.role}</h4>
                                <p className="text-[10px] text-stone-400 uppercase tracking-widest mt-0.5">Portal Access</p>
                              </div>
                              <ArrowRight className="w-5 h-5 text-stone-300 dark:text-stone-600" />
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
                              <label className="block text-xs font-bold text-stone-400 dark:text-stone-500 uppercase mb-1 ml-1">Email Address</label>
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
                              <label className="block text-xs font-bold text-stone-400 dark:text-stone-500 uppercase mb-1 ml-1">Email</label>
                              <input type="email" required value={email} onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                                className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 dark:text-stone-100" />
                              {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-stone-400 dark:text-stone-500 uppercase mb-1 ml-1">Password</label>
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
                              <label className="block text-xs font-bold text-stone-400 dark:text-stone-500 uppercase mb-1 ml-1">Email</label>
                              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 dark:text-stone-100" />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-stone-400 dark:text-stone-500 uppercase mb-1 ml-1">Password</label>
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
                </div>
              </div>
            )}
            {!isMobile && (
              <motion.div 
                key="book-login"`;
  app = app.replace(target1, () => mobileAuthBlock);

  const target2 = `            </Page>\n          </motion.div>\n        </div>\n      ) : (`;
  app = app.replace(target2, () => `            </Page>\n          </motion.div>\n            )}\n        </div>\n      ) : (`);

  fs.writeFileSync('src/App.tsx', app);
  console.log('App.tsx cleanly restored with all manual fixes re-applied!');
} catch (e) {
  console.error("Critical Failure:", e.message);
}
