/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, Component } from 'react';
import { motion, AnimatePresence } from 'motion/react';
// Line 8: Verified import from geminiService
import { generatePerformanceReport, predictAttendanceTrends, generateNotification, predictPerformanceTrends } from './services/geminiService';
// Line 9: Verified import from VerificationNotice
import { VerificationNotice } from './components/VerificationNotice';
// Line 10: Verified import from Skeleton
// import removed
import { QRScanner } from './components/QRScanner';
import { QRGenerator } from './components/QRGenerator';
import { Skeleton } from './components/Skeleton';
import { TimetableManagement } from './components/TimetableManagement';
import { FrontOfficeManagement } from './components/FrontOfficeManagement';
import { StudentInformationManagement } from './components/StudentInformationManagement';
import { FeesCollectionManagement } from './components/FeesCollectionManagement';
import { IncomeManagement } from './components/IncomeManagement';
import { ExpenseManagement } from './components/ExpenseManagement';
import { StudentAttendanceManagement } from './components/StudentAttendanceManagement';
import { LmsManagement } from './components/LmsCms/LmsManagement';
import { CanteenManagement } from './components/LmsCms/CanteenManagement';
import { LmsCmsReports } from './components/LmsCms/LmsCmsReports';
import { Character3DStudio } from './components/Character3DStudio';
import { initializeMockDatabase } from './services/lmsCmsService';
import { ParentPortal } from './portals/ParentPortal';
import { StudentPortal } from './portals/StudentPortal';
import RoleEntryAnimation, { EntryRole, getRoleTheme, AuthBackground } from './components/RoleEntryAnimation';
import { legacyRoleOf } from './portal/legacyBridge';
import { 
  Book as BookIcon, 
  User as UserIcon, 
  GraduationCap, 
  Users, 
  ShieldCheck, 
  UserCog, 
  Lock,
  ArrowRight,
  ArrowLeft,
  LogOut,
  School,
  Plus,
  Trash2,
  FileText,
  Calendar,
  Search,
  Filter,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  LayoutGrid,
  List,
  Upload,
  BarChart3,
  Sparkles,
  Check,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronRight,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Download,
  Eye,
  Camera,
  MessageSquare,
  Send,
  Bot,
  History,
  Box,
  TrendingUp,
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  Menu,
  X,
  LayoutDashboard,
  Library,
  Truck,
  Shield,
  DollarSign,
  MessageCircle,
  Briefcase,
  Award,
  Clock,
  ClipboardList,
  Package,
  ShoppingCart,
  Sun,
  Moon,
  Wallet,
  Coffee,
  PlusCircle,
  ShieldAlert,
  Receipt
} from 'lucide-react';
// Line 75: Verified types import
import { UserRole, User, Teacher, Student, Parent, Staff, Alert, LeaveRequest, BusRoute, Subject, FeePayment, AttendanceRecord, Homework, ExamResult, StoreItem, SalaryRecord, FeeRecord, Reservation } from './types';
import { GoogleGenAI } from "@google/genai";
import { 
  MOCK_USERS, 
  ROLE_PASSWORDS,
  CLASSES,
  SECTIONS,
  SUBJECTS
// Line 90: Verified constants import
} from './constants';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend
} from 'recharts';

import Papa from 'papaparse';
// Firebase Imports
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc, 
  getDoc, 
  query, 
  where, 
  serverTimestamp, 
  getDocs,
  getDocFromServer
} from './localDatabase';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from './localDatabase';
// Line 137: Verified firebase import
import { db, auth } from './localDatabase';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

// Error Boundary Component
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  constructor(props: ErrorBoundaryProps) {
    super(props);
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 dark:bg-red-950/20 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center space-y-4 border border-stone-100 dark:border-stone-800">
            <XCircle className="w-16 h-16 text-red-500 mx-auto" />
            <h2 className="text-2xl font-bold text-stone-950 dark:text-stone-50">Something went wrong</h2>
            <p className="text-stone-600 dark:text-stone-400 text-sm">
              {this.state.error?.message?.startsWith('{') 
                ? "A database permission error occurred. Please contact support." 
                : "An unexpected error occurred. Please try refreshing the page."}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    // @ts-ignore
    return this.props.children;
  }
}

const getAuthErrorMessage = (code: string) => {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Invalid email or password. Please check your credentials.';
    case 'auth/email-already-in-use':
      return 'This email is already registered. Try logging in instead.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    case 'auth/too-many-requests':
      return 'Too many unsuccessful attempts. Please try again later.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/requires-recent-login':
      return 'Please log in again to perform this sensitive action.';
    default:
      return 'An unexpected authentication error occurred. Please try again.';
  }
};

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null, setError?: (msg: string) => void) {
  const errMessage = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  
  console.group('🔥 Firestore Error Detail');
  console.error('Operation:', operationType);
  console.error('Path:', path);
  console.error('Message:', errMessage);
  console.error('Full Info:', errInfo);
  console.groupEnd();
  
  // If it's a permission error, we throw it to be caught by the ErrorBoundary
  if (errMessage.toLowerCase().includes('permission-denied') || errMessage.toLowerCase().includes('insufficient permissions')) {
    throw new Error(JSON.stringify(errInfo));
  }

  if (setError) {
    if (errMessage.includes('quota-exceeded')) {
      setError('Database quota exceeded. Please try again later.');
    } else if (errMessage.includes('offline')) {
      setError('You appear to be offline. Please check your connection.');
    } else {
      setError('A database error occurred. Please try again.');
    }
  }
}

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
        skewY: isOpen ? [0, -1.2, 0] : [0, 1.2, 0],
      }}
      transition={{
        rotateY: { type: 'spring', stiffness: 60, damping: 14, mass: 1.1 },
        skewY: { duration: 1.4, ease: 'easeInOut' },
      }}
      style={{ zIndex }}
    >
      {/* Front of the page */}
      <motion.div
        className="page-leaf absolute inset-0 backface-hidden page-gradient border-l border-stone-300 dark:border-stone-800 page-shadow-left rounded-r-lg overflow-hidden"
        whileHover={{
          boxShadow: "0 0 20px rgba(59, 130, 246, 0.5)", // Glow effect
          scale: 1.01, // Subtle scale
          borderColor: "rgba(59, 130, 246, 0.8)", // Border highlight
        }}
      >
        {/* Crease line */}
        <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-black/5 dark:bg-white/5 z-10" />
        
        {/* Wrinkle/Fold highlight effect during turn */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none z-20"
          animate={{
            x: isOpen ? ['-100%', '200%'] : ['200%', '-100%'],
            opacity: isOpen ? [0, 1, 0] : [0, 1, 0]
          }}
          transition={{ duration: 1.6, ease: "easeInOut" }}
        />

        {/* Turning shadow — darkens the leaf as it lifts off the spine for 3D depth */}
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
      <div className="page-leaf absolute inset-0 backface-hidden page-gradient border-r border-stone-300 page-shadow-right rounded-l-lg overflow-hidden" style={{ transform: 'rotateY(180deg)' }}>
        {/* Crease line */}
        <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-black/5 z-10" />
        
        <div className="p-8 h-full flex flex-col">
          {backContent}
        </div>
      </div>
    </motion.div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

const LoadingSpinner = ({ size = 'md', color = 'blue' }: { size?: 'sm' | 'md' | 'lg', color?: string }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  };
  
  const colorClasses: Record<string, string> = {
    blue: 'border-blue-500',
    white: 'border-white',
    stone: 'border-stone-500'
  };

  return (
    <div className={`${sizeClasses[size]} border-t-transparent ${colorClasses[color] || 'border-blue-500'} rounded-full animate-spin`}></div>
  );
};

function AppContent() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    initializeMockDatabase();

    // Pre-load video splashscreens to ensure instant playback during authentication
    const videoSuccess = document.createElement('video');
    videoSuccess.src = '/api/splashscreens/stu_success';
    videoSuccess.preload = 'auto';

    const videoError = document.createElement('video');
    videoError.src = '/api/splashscreens/stu_error';
    videoError.preload = 'auto';
  }, []);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [entryRole, setEntryRole] = useState<EntryRole | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const [selectedFeeIds, setSelectedFeeIds] = useState<string[]>([]);

  // Student Login Splashscreen state
  const [activeSplash, setActiveSplash] = useState<'success' | 'error' | null>(null);
  const [splashCallback, setSplashCallback] = useState<(() => void) | null>(null);
  const isLoggingInStudentRef = useRef(false);
  const pendingStudentUserRef = useRef<User | null>(null);
  const studentRedirectTimerRef = useRef<NodeJS.Timeout | null>(null);

  const completeStudentRedirect = () => {
    if (studentRedirectTimerRef.current) {
      clearTimeout(studentRedirectTimerRef.current);
      studentRedirectTimerRef.current = null;
    }
    const userData = pendingStudentUserRef.current;
    if (userData) {
      sessionStorage.setItem('isAuthenticated', 'true');
      sessionStorage.setItem('userRole', userData.role);
      sessionStorage.setItem('student_session', JSON.stringify(userData));
      localStorage.setItem('student_user', JSON.stringify(userData));

      setLoggedInUser(userData);
      setCurrentPage(3);
    }
    setActiveSplash(null);
    pendingStudentUserRef.current = null;
  };

  useEffect(() => {
    return () => {
      if (studentRedirectTimerRef.current) {
        clearTimeout(studentRedirectTimerRef.current);
      }
    };
  }, []);

  // Management State
  const [allUsers, setAllUsers] = useState<User[]>(MOCK_USERS);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [activeAdminTab, setActiveAdminTab] = useState<string>('overview');
  const [busRoutes, setBusRoutes] = useState<BusRoute[]>([]);
  const [schoolSubjects, setSchoolSubjects] = useState<Subject[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [attendanceMode, setAttendanceMode] = useState<'Manual' | 'Biometric' | 'QR'>('Manual');
  const [showAddModal, setShowAddModal] = useState<'teacher' | 'student' | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [viewingIDCard, setViewingIDCard] = useState<Student | Teacher | null>(null);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<any>(null);
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isTeachersLoading, setIsTeachersLoading] = useState(true);
  const [isStudentsLoading, setIsStudentsLoading] = useState(true);
  const [teacherSubjectFilter, setTeacherSubjectFilter] = useState<string>('All');
  const [viewingReportCard, setViewingReportCard] = useState<Student | null>(null);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);
  const bulkImportInputRef = useRef<HTMLInputElement>(null);
  const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: 'Hello! I am your EduSmart AI Assistant. How can I help you today?' }
  ]);

  const verificationEmailRef = useRef<string | null>(null);
  useEffect(() => {
    verificationEmailRef.current = verificationEmail;
  }, [verificationEmail]);

  // Firebase Auth Listener
  useEffect(() => {
    // Connection Test
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. The client is offline.");
        }
      }
    };
    testConnection();

    let unsubProfile: (() => void) | null = null;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Temporarily bypassing email verification check
        // if (user.emailVerified) {
        if (true) {
          // Fetch user profile from Firestore with a listener
          unsubProfile = onSnapshot(doc(db, 'users', user.uid), (userDoc) => {
            if (userDoc.exists()) {
              const userData = userDoc.data() as User;
              if (userData.role === 'Student' && (isLoggingInStudentRef.current || pendingStudentUserRef.current)) {
                if (isLoggingInStudentRef.current) {
                  isLoggingInStudentRef.current = false;
                  pendingStudentUserRef.current = userData;
                  
                  // Store session data immediately after successful validation
                  sessionStorage.setItem('isAuthenticated', 'true');
                  sessionStorage.setItem('userRole', userData.role);
                  sessionStorage.setItem('student_session', JSON.stringify(userData));
                  localStorage.setItem('student_user', JSON.stringify(userData));

                  setActiveSplash('success');

                  if (studentRedirectTimerRef.current) {
                    clearTimeout(studentRedirectTimerRef.current);
                  }
                  studentRedirectTimerRef.current = setTimeout(() => {
                    console.log('Fallback timeout triggered for student login redirection.');
                    completeStudentRedirect();
                  }, 3000);
                } else {
                  // Subsequent snapshot updates while the video is playing
                  pendingStudentUserRef.current = userData;
                }
              } else {
                setLoggedInUser(userData);
                setCurrentPage(3);
              }
            } else {
              setLoggedInUser(null);
            }
            setIsInitialLoad(false);
          }, (error) => {
            handleFirestoreError(error, OperationType.GET, `users/${user.uid}`, setError);
            setIsInitialLoad(false);
          });
        } else {
          // User is signed in but not verified
          setLoggedInUser(null);
          if (!verificationEmailRef.current) {
            setVerificationEmail(user.email);
          }
          setCurrentPage(2);
          setIsInitialLoad(false);
        }
      } else {
        if (unsubProfile) unsubProfile();
        setLoggedInUser(null);
        if (!verificationEmailRef.current) {
          setCurrentPage(0);
        }
        setIsInitialLoad(false);
      }
    });
    return () => {
      unsubscribe();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  // Firestore Listeners
  useEffect(() => {
    if (!loggedInUser) return;

    const isAdmin = loggedInUser.role === 'Super Admin' || loggedInUser.role === 'Management';
    const isTeacher = loggedInUser.role === 'Teacher';

    const unsubTeachers = onSnapshot(collection(db, 'teachers'), (snapshot) => {
      setTeachers(snapshot.docs.map(doc => ({ ...doc.data(), teacher_id: doc.id } as Teacher)));
      setIsTeachersLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'teachers', setError);
      setIsTeachersLoading(false);
    });

    // Role-based Student Query
    let studentQuery: any = collection(db, 'students');
    if (!isAdmin && !isTeacher) {
      if (loggedInUser.role === 'Student') {
        studentQuery = query(collection(db, 'students'), where('email', '==', loggedInUser.email));
      } else if (loggedInUser.role === 'Parent') {
        studentQuery = query(collection(db, 'students'), where('parent_id', '==', loggedInUser.linked_id));
      } else {
        studentQuery = query(collection(db, 'students'), where('email', '==', '___none___'));
      }
    }

    const unsubStudents = onSnapshot(studentQuery, (snapshot) => {
      setStudents(snapshot.docs.map(doc => ({ ...doc.data(), student_id: doc.id } as Student)));
      setIsStudentsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'students', setError);
      setIsStudentsLoading(false);
    });

    const unsubParents = onSnapshot(collection(db, 'parents'), (snapshot) => {
      setParents(snapshot.docs.map(doc => ({ ...doc.data(), parent_id: doc.id } as Parent)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'parents', setError));

    const unsubStaff = onSnapshot(collection(db, 'staff'), (snapshot) => {
      setStaff(snapshot.docs.map(doc => ({ ...doc.data(), staff_id: doc.id } as Staff)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'staff', setError));

    const unsubLeaves = onSnapshot(collection(db, 'leaveRequests'), (snapshot) => {
      setLeaveRequests(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as LeaveRequest)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'leaveRequests', setError));

    const unsubAlerts = onSnapshot(collection(db, 'alerts'), (snapshot) => {
      setAlerts(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Alert)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'alerts', setError));

    const unsubReservations = onSnapshot(collection(db, 'reservations'), (snapshot) => {
      setReservations(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Reservation)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'reservations', setError));

    // Role-based Attendance Query
    let attendanceQuery: any = collection(db, 'attendance');
    if (!isAdmin && !isTeacher) {
      if (loggedInUser.role === 'Student') {
        attendanceQuery = query(collection(db, 'attendance'), where('studentEmail', '==', loggedInUser.email));
      } else {
        // For Parents or others, we might need a more complex query or they just don't see the list
        // For now, restrict to avoid permission errors
        attendanceQuery = query(collection(db, 'attendance'), where('studentEmail', '==', '___none___'));
      }
    }

    const unsubAttendance = onSnapshot(attendanceQuery, (snapshot) => {
      setAttendanceRecords(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as AttendanceRecord)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'attendance', setError));

    const unsubBusRoutes = onSnapshot(collection(db, 'busRoutes'), (snapshot) => {
      setBusRoutes(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as BusRoute)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'busRoutes', setError));

    const unsubHomeworks = onSnapshot(collection(db, 'homeworks'), (snapshot) => {
      setHomeworks(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Homework)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'homeworks', setError));

    const unsubResults = onSnapshot(collection(db, 'examResults'), (snapshot) => {
      setExamResults(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ExamResult)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'examResults', setError));

    const unsubStore = onSnapshot(collection(db, 'storeItems'), (snapshot) => {
      setStoreItems(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as StoreItem)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'storeItems', setError));

    let unsubUsers = () => {};
    if (isAdmin) {
      unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
        setAllUsers(snapshot.docs.map(doc => doc.data() as User));
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'users', setError));
    }

    return () => {
      unsubTeachers();
      unsubStudents();
      unsubParents();
      unsubStaff();
      unsubLeaves();
      unsubAlerts();
      unsubReservations();
      unsubAttendance();
      unsubBusRoutes();
      unsubHomeworks();
      unsubResults();
      unsubStore();
      unsubUsers();
    };
  }, [loggedInUser]);


  const totalPages = 4;

  const handleBackToLogin = async () => {
    await signOut(auth);
    setVerificationEmail(null);
    setCurrentPage(2); // Always return to login page
    setError('');
  };

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setCurrentPage(2); // Flip to login page (revealed beneath the entry splash)
    setEmail('');
    setPassword('');
    setError('');
    // Play the cinematic 3D-cartoon entry for every login role. The themed
    // character pushes the login container into place over 5 seconds, then
    // onComplete clears the overlay to reveal the credential fields.
    setEntryRole(role as EntryRole);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    setIsLoading(true);
    try {
      setError('');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Create Firestore profile
      await setDoc(doc(db, 'users', user.uid), {
        user_id: user.uid,
        email: user.email,
        role: selectedRole,
        role_type: (selectedRole === 'Student' || selectedRole === 'Teacher' || selectedRole === 'Management' || selectedRole === 'Super Admin') ? 'academic' : 'non-academic',
        name: email.split('@')[0],
        phone: '',
        linked_id: '',
        photo: `https://picsum.photos/seed/${user.uid}/200/200`
      });

      // Send verification email
      await sendEmailVerification(user);
      // Temporarily disabled verification notice
      // setVerificationEmail(email);
    } catch (err: any) {
      console.error("Signup error:", err);
      setError(getAuthErrorMessage(err.code));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setEmailError('');
    setPasswordError('');

    if (selectedRole === 'Student') {
      isLoggingInStudentRef.current = true;
    }

    const triggerLoginError = (msg: string) => {
      isLoggingInStudentRef.current = false;
      if (selectedRole === 'Student') {
        setActiveSplash('error');
        setSplashCallback(() => {
          setError(msg);
        });
      } else {
        setError(msg);
      }
    };

    // 0. Unified auth: try the real RBAC backend first. Success stores the
    //    shared JWT session (SSO across every #/ portal) and logs into the
    //    classic dashboard with the mapped legacy role. Failure (wrong creds
    //    or backend down) falls through to the original mock flow untouched.
    try {
      const res = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const rbacSession = await res.json();
        localStorage.setItem('ssms_rbac_session', JSON.stringify(rbacSession));
        const legacyRole = legacyRoleOf(rbacSession);
        setLoggedInUser({
          user_id: String(rbacSession.user.id),
          email: rbacSession.user.email,
          role: legacyRole,
          role_type: 'academic',
          name: rbacSession.user.name || rbacSession.user.email,
          phone: '',
          linked_id: '',
          photo: `https://picsum.photos/seed/${rbacSession.user.id}/200/200`,
        } as User);
        setIsLoading(false);
        isLoggingInStudentRef.current = false;
        return;
      }
    } catch { /* backend unreachable -> classic mock flow below */ }

    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);

      // 1. Attempt to sign in with Firebase Auth
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } catch (err: any) {
        // If user not found in Auth, check if they are a mock user and create them for this demo
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
          const mockUser = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase() && u.role === selectedRole);
          const expectedPassword = selectedRole ? ROLE_PASSWORDS[selectedRole] : '';
          
          if (mockUser && password === expectedPassword) {
            userCredential = await createUserWithEmailAndPassword(auth, email, password);
            // Send verification email for new accounts
            await sendEmailVerification(userCredential.user);
          } else {
            // Set specific errors
            if (err.code === 'auth/user-not-found') {
                setEmailError('User not found.');
            } else {
                setPasswordError('Invalid credentials.');
            }
            throw err;
          }
        } else {
          throw err;
        }
      }

      const user = userCredential.user;

      // Check if email is verified - Temporarily disabled
      /*
      if (!user.emailVerified) {
        setVerificationEmail(email);
        return;
      }
      */

      // 2. Ensure user profile exists in Firestore keyed by UID
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        // Find mock data if available, otherwise use defaults
        const mockUser = MOCK_USERS.find(u => u.email === email);
        await setDoc(userRef, {
          user_id: user.uid,
          email: user.email,
          role: selectedRole || mockUser?.role || 'Student',
          role_type: mockUser?.role_type || 'academic',
          name: mockUser?.name || user.email?.split('@')[0],
          phone: mockUser?.phone || '',
          linked_id: mockUser?.linked_id || '',
          photo: `https://picsum.photos/seed/${user.uid}/200/200`
        });
      } else {
        const userData = userSnap.data() as User;
        // If a role was selected, verify it matches the DB role
        if (selectedRole && userData.role !== selectedRole) {
          await signOut(auth);
          triggerLoginError(`This account is registered as a ${userData.role}, not a ${selectedRole}.`);
          setIsLoading(false);
          return;
        }
      }

      // onAuthStateChanged will handle setting loggedInUser and navigation
    } catch (err: any) {
      console.error("Login error:", err);
      triggerLoginError(getAuthErrorMessage(err.code));
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setNotification({ message: 'Password reset email sent! Check your inbox.', type: 'success' });
      setIsForgotPassword(false);
      setError('');
    } catch (err: any) {
      console.error("Forgot password error:", err);
      setError(getAuthErrorMessage(err.code));
    }
  };

  const handleRefreshVerification = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        await user.reload();
        if (auth.currentUser?.emailVerified) {
          setVerificationEmail(null);
          setNotification({ message: 'Email verified! Loading your dashboard...', type: 'success' });
          // Force a re-check of the profile
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setLoggedInUser(userDoc.data() as User);
            setCurrentPage(3);
          }
        } else {
          setError('Email not verified yet. Please check your inbox.');
        }
      } catch (err: any) {
        console.error("Refresh verification error:", err);
        setError(getAuthErrorMessage(err.code));
      }
    } else {
      setError('Session expired. Please log in again.');
      setVerificationEmail(null);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setError('Email address is missing. Please try logging in again.');
      return;
    }
    
    // If we have a password, we can re-auth and send
    if (password) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
        await signOut(auth);
        setNotification({ message: 'Verification email resent! Please check your inbox.', type: 'info' });
        setError('');
      } catch (err: any) {
        console.error("Resend verification error:", err);
        setError(getAuthErrorMessage(err.code));
      }
    } else {
      setError('Please enter your password to resend the verification email.');
    }
  };

  const handleBulkImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const data = results.data as any[];
        const errors: string[] = [];
        const validStudents: Student[] = [];

        data.forEach((row, index) => {
          if (!row.name || !row.id || !row.email || !row.class) {
            errors.push(`Row ${index + 1}: Missing required fields (name, id, email, class)`);
            return;
          }
          
          if (students.some(s => s.student_id === row.id)) {
            errors.push(`Row ${index + 1}: Student ID ${row.id} already exists`);
            return;
          }

          const newStudent: Student = {
            student_id: row.id,
            name: row.name,
            class_id: row.class,
            class: row.class,
            section: row.section || 'A',
            parent_id: row.parent_id || '',
            subjects: row.subjects ? row.subjects.split(',') : [],
            summary: {
              attendance_percentage: 0,
              latest_grade: 'N/A',
              fee_status: 'Pending'
            },
            email: row.email,
            fees: {
              total: 50000,
              paid: 0,
              status: 'Pending',
              history: []
            }
          };
          validStudents.push(newStudent);
        });

        if (errors.length > 0) {
          setNotification({ 
            message: `Import failed with ${errors.length} errors. Check console for details.`, 
            type: 'error' 
          });
          console.error("Import errors:", errors);
        } else if (validStudents.length === 0) {
          setNotification({ message: 'No valid students found in CSV.', type: 'error' });
        } else {
          try {
            for (const student of validStudents) {
              await setDoc(doc(db, 'students', student.student_id), student);
            }
            setNotification({ message: `Successfully imported ${validStudents.length} students.`, type: 'success' });
          } catch (err) {
            console.error(err);
            setNotification({ message: 'Failed to upload students to database.', type: 'error' });
          }
        }
        if (bulkImportInputRef.current) bulkImportInputRef.current.value = '';
      },
      error: (error) => {
        setNotification({ message: `CSV Parsing Error: ${error.message}`, type: 'error' });
      }
    });
  };

  const bootstrapDatabase = async () => {
    if (!loggedInUser || loggedInUser.role !== 'Super Admin') {
      setNotification({ message: 'Only Super Admin can bootstrap the system.', type: 'error' });
      return;
    }

    setConfirmDialog({
      message: 'This will attempt to create all default users in Firebase Auth and Firestore. Continue?',
      onConfirm: async () => {
        setIsLoading(true);
        try {
          for (const mockUser of MOCK_USERS) {
            const password = ROLE_PASSWORDS[mockUser.role];
            try {
              const userCredential = await createUserWithEmailAndPassword(auth, mockUser.email, password);
              const uid = userCredential.user.uid;
              await setDoc(doc(db, 'users', uid), mockUser);
            } catch (err: any) {
              if (err.code === 'auth/email-already-in-use') {
                console.log(`User ${mockUser.email} already exists in Auth.`);
              } else {
                console.error(`Error creating ${mockUser.email}:`, err);
              }
            }
          }

          // Seed other data

          setNotification({ message: 'Firebase bootstrapping complete. Default users and records have been initialized.', type: 'success' });
        } catch (err) {
          console.error(err);
          setNotification({ message: 'Bootstrapping failed. Check console for details.', type: 'error' });
        } finally {
          setIsLoading(false);
          setConfirmDialog(null);
        }
      }
    });
  };

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('ssms_rbac_session'); // unified logout: end portal SSO too
    setLoggedInUser(null);
    setSelectedRole(null);
    setCurrentPage(0);
  };

  const roles: { role: UserRole; icon: any; color: string; neon: string }[] = [
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

  const removeTeacher = async (id: string) => {
    setConfirmDialog({
      message: 'Are you sure you want to delete this teacher record? This action cannot be undone.',
      onConfirm: async () => {
        setIsLoading(true);
        try {
          await deleteDoc(doc(db, 'teachers', id));
          setNotification({ message: 'Teacher record deleted successfully.', type: 'success' });
        } catch (err: any) {
          console.error("Error removing teacher:", err);
          setNotification({ message: 'Failed to delete teacher record.', type: 'error' });
        } finally {
          setIsLoading(false);
          setConfirmDialog(null);
        }
      }
    });
  };

  const removeStudent = async (id: string) => {
    setConfirmDialog({
      message: 'Are you sure you want to delete this student record? This action cannot be undone.',
      onConfirm: async () => {
        setIsLoading(true);
        try {
          await deleteDoc(doc(db, 'students', id));
          setNotification({ message: 'Student record deleted successfully.', type: 'success' });
        } catch (err: any) {
          console.error("Error removing student:", err);
          setNotification({ message: 'Failed to delete student record.', type: 'error' });
        } finally {
          setIsLoading(false);
          setConfirmDialog(null);
        }
      }
    });
  };

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

  const TeacherManagement = () => {
    const [sortConfig, setSortConfig] = useState<{ key: 'name' | 'salary' | 'joiningDate'; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
    const subjects = ['All', ...Array.from(new Set(teachers.map(t => t.subject)))];
    const filteredTeachers = teacherSubjectFilter === 'All' 
      ? teachers 
      : teachers.filter(t => t.subject === teacherSubjectFilter);

    const sortedTeachers = [...filteredTeachers].sort((a, b) => {
      let aValue: any = a[sortConfig.key];
      let bValue: any = b[sortConfig.key];
      
      if (sortConfig.key === 'salary') {
        aValue = a.salary.basic;
        bValue = b.salary.basic;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400">Manage Teachers</h3>
            <p className="text-xs text-stone-500">Manage staff records, salaries, and documents</p>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
              <select
                value={teacherSubjectFilter}
                onChange={(e) => setTeacherSubjectFilter(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 outline-none appearance-none min-w-[150px] dark:text-stone-100"
              >
                {subjects.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
            <select
              value={`${sortConfig.key}-${sortConfig.direction}`}
              onChange={(e) => {
                const [key, direction] = e.target.value.split('-') as ['name' | 'salary' | 'joiningDate', 'asc' | 'desc'];
                setSortConfig({ key, direction });
              }}
              className="px-4 py-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 outline-none dark:text-stone-100"
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="salary-asc">Salary (Low-High)</option>
              <option value="salary-desc">Salary (High-Low)</option>
              <option value="joiningDate-asc">Joining Date (Oldest)</option>
              <option value="joiningDate-desc">Joining Date (Newest)</option>
            </select>
            <button 
              onClick={() => setShowAddModal('teacher')}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 dark:shadow-none whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> Add Teacher
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {isTeachersLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
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
                  <Skeleton className="flex-1 h-8 rounded-lg" />
                </div>
              </div>
            ))
          ) : sortedTeachers.map(teacher => (
          <div key={teacher.teacher_id} className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800 space-y-4 relative group hover:border-blue-200 dark:hover:border-blue-900 transition-all">
            <button 
              onClick={() => removeTeacher(teacher.teacher_id)}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 overflow-hidden border border-blue-100 dark:border-blue-900/30">
                {teacher.photo ? <img src={teacher.photo} className="w-full h-full object-cover" /> : <UserIcon className="w-8 h-8" />}
              </div>
              <div>
                <h4 className="font-bold text-stone-800 dark:text-stone-100">{teacher.name}</h4>
                <p className="text-xs text-stone-500 dark:text-stone-400">{teacher.subject} • {teacher.classSection}</p>
                <p className="text-[10px] text-stone-500 dark:text-stone-500 font-bold uppercase tracking-widest mt-1">Joined: {teacher.joiningDate}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-stone-50 dark:bg-stone-800 rounded-lg">
                <p className="text-stone-500 dark:text-stone-500">Salary</p>
                <p className="font-bold text-stone-800 dark:text-stone-100">${teacher.salary.basic}</p>
              </div>
              <div className="p-2 bg-stone-50 dark:bg-stone-800 rounded-lg">
                <p className="text-stone-500 dark:text-stone-500">Phone</p>
                <p className="font-medium dark:text-stone-300">{teacher.phone}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setViewingIDCard(teacher)}
                className="flex-1 py-2 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              >
                ID Card
              </button>
              <button 
                onClick={() => setNotification({ message: `Generating Joining Letter for ${teacher.name}...\nSalary: $${teacher.salary?.basic || 0}\nDate: ${teacher.joiningDate || 'N/A'}`, type: 'info' })}
                className="flex-1 py-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
              >
                Joining Letter
              </button>
              <button 
                onClick={() => setEditingTeacher(teacher)}
                className="flex-1 py-2 text-[10px] font-bold text-stone-600 dark:text-stone-400 bg-stone-50 dark:bg-stone-800 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
              >
                Edit Profile
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

  const StudentManagement = () => {
    const isTeacher = loggedInUser?.role === 'Teacher';
    const teacher = teachers.find(t => t.email === loggedInUser?.email);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
    const [sortConfig, setSortConfig] = useState<{ key: keyof Student | 'fullName'; direction: 'asc' | 'desc' }>({ key: 'student_id', direction: 'asc' });
    
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
              className="bg-green-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-green-700 transition-all shadow-lg shadow-green-100 dark:shadow-none"
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
                    <p className={`font-bold ${student.fees.status === 'Paid' ? 'text-emerald-600' : 'text-red-600'}`}>{student.fees.status}</p>
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
                <tr className="bg-stone-50 dark:bg-stone-800/50 border-b border-stone-100 dark:border-stone-800">
                  <th className="p-4 text-xs font-bold text-stone-500 uppercase tracking-widest cursor-pointer hover:text-stone-600 dark:hover:text-stone-300" onClick={() => handleSort('student_id')}>
                    <div className="flex items-center gap-2">
                      Student ID {sortConfig.key === 'id' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-500" /> : <ChevronDown className="w-3 h-3 text-blue-500" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                    </div>
                  </th>
                  <th className="p-4 text-xs font-bold text-stone-500 uppercase tracking-widest cursor-pointer hover:text-stone-600 dark:hover:text-stone-300" onClick={() => handleSort('fullName')}>
                    <div className="flex items-center gap-2">
                      Name {sortConfig.key === 'fullName' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-500" /> : <ChevronDown className="w-3 h-3 text-blue-500" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                    </div>
                  </th>
                  <th className="p-4 text-xs font-bold text-stone-500 uppercase tracking-widest cursor-pointer hover:text-stone-600 dark:hover:text-stone-300" onClick={() => handleSort('class')}>
                    <div className="flex items-center gap-2">
                      Class {sortConfig.key === 'class' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-500" /> : <ChevronDown className="w-3 h-3 text-blue-500" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                    </div>
                  </th>
                  <th className="p-4 text-xs font-bold text-stone-500 uppercase tracking-widest cursor-pointer hover:text-stone-600 dark:hover:text-stone-300" onClick={() => handleSort('section')}>
                    <div className="flex items-center gap-2">
                      Section {sortConfig.key === 'section' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-500" /> : <ChevronDown className="w-3 h-3 text-blue-500" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                    </div>
                  </th>
                  <th className="p-4 text-xs font-bold text-stone-500 uppercase tracking-widest cursor-pointer hover:text-stone-600 dark:hover:text-stone-300" onClick={() => handleSort('phone')}>
                    <div className="flex items-center gap-2">
                      Contact {sortConfig.key === 'phone' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-500" /> : <ChevronDown className="w-3 h-3 text-blue-500" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                    </div>
                  </th>
                  <th className="p-4 text-xs font-bold text-stone-500 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedStudents.map(student => (
                  <tr key={student.student_id} className="border-b border-stone-50 dark:border-stone-800/50 hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-colors">
                    <td className="p-4 text-sm font-mono font-bold text-stone-800 dark:text-stone-100">{student.student_id}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-stone-100 dark:bg-stone-800 rounded-lg overflow-hidden">
                          {student.photo ? <img src={student.photo} className="w-full h-full object-cover" /> : <UserIcon className="w-4 h-4 m-auto mt-2 text-stone-500 dark:text-stone-500" />}
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

  const AIAssistant = () => {
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

  const SmartIDCardModal = ({ person, onClose }: { person: Student | Teacher; onClose: () => void }) => {
    const isStudent = 'class' in person;
    
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[300] flex items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0, rotateY: 90 }}
          animate={{ scale: 1, opacity: 1, rotateY: 0 }}
          className="relative w-[350px] h-[550px] preserve-3d"
        >
          {/* ID Card Front */}
          <div className="absolute inset-0 bg-white dark:bg-stone-900 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col border-4 border-white dark:border-stone-800">
            {/* Header */}
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

            {/* Body */}
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

  const ViewDetailsModal = ({ student, onClose }: { student: Student; onClose: () => void }) => {
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
  )};

  const AddModal = () => {
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
      
      // Generate Guardian Email
      const guardianRefSubmit = activeEdit && 'guardian' in activeEdit ? activeEdit.guardian : null;
      const generatedGuardianEmail = guardianRefSubmit?.email || `${guardianName.toLowerCase().replace(/\s+/g, '')}@school.com`;

      if (!activeEdit) {
        const newUser: User = {
          user_id: id, // Using ID as user_id for linking
          name: name,
          email: generatedEmail,
          role: isTeacher ? 'Teacher' : 'Student',
          role_type: 'academic',
          phone: formData.get('phone') as string,
          linked_id: id,
          photo: photoPreview || undefined
        };
        
        await setDoc(doc(db, 'users', id), newUser);

        // Only create parent account for students
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

          const parentData: Parent = {
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
            total: 50000,
            paid: 0,
            status: 'Pending',
            history: []
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
              {/* Personal Info */}
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
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <select name="classSection" defaultValue={editingTeacher?.classSection} className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm dark:text-stone-100" required>
                        <option value="">Select Class</option>
                        {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
                      </select>
                      <select name="subject" defaultValue={editingTeacher?.subject} className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm dark:text-stone-100" required>
                        <option value="">Select Subject</option>
                        {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </>
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

              {/* Contact & Address */}
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

              {/* Guardian Info */}
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

              {/* Qualification (Teacher Only) */}
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

  const ReportCardModal = () => {
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
                className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors"
              >
                <XCircle className="w-6 h-6 text-stone-500" />
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
  };  const AttendanceManagement = () => {
    const teacher = teachers.find(t => t.email === loggedInUser?.email);
    const isTeacher = loggedInUser?.role === 'Teacher';
    const isAttender = loggedInUser?.role === 'Attender';
    
    // If teacher, default to their assigned class
    const initialClass = isTeacher && teacher && teacher.assigned_classes && teacher.assigned_classes.length > 0 ? teacher.assigned_classes[0].split('-')[0] : '1';
    const [selectedClass, setSelectedClass] = useState(initialClass);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [view, setView] = useState<'Students' | 'Teachers' | 'Non-Staff' | 'Security'>(isAttender ? 'Students' : 'Students');
    const [searchTerm, setSearchTerm] = useState('');
    const [scanStatus, setScanStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [showFaceScanner, setShowFaceScanner] = useState(false);
    const [faceStatus, setFaceStatus] = useState<'idle' | 'scanning' | 'success'>('idle');

    const filteredRecords = attendanceRecords.filter(r => 
      r.date === selectedDate && 
      (view === 'Students' ? r.class === selectedClass : true)
    );

    const exportToCSV = () => {
      const headers = ['Date', 'Student ID', 'Name', 'Class', 'Section', 'Status', 'Timestamp'];
      const rows = filteredRecords.map(r => [
        r.date,
        r.student_id,
        r.studentName,
        r.class,
        r.section,
        r.status,
        r.timestamp
      ]);

      const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `attendance_${selectedDate}_class_${selectedClass}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    const handleSubmitAll = async () => {
      setIsLoading(true);
      try {
        let count = 0;
        for (const person of filteredList) {
          if (!person.student_id) continue;
          const record = filteredRecords.find(r => r.student_id === person.student_id);
          if (!record) {
            await handleToggleAttendance(person as Student, 'Present'); // Send Present so we toggle to 'Absent'
            count++;
          }
        }
        setNotification({ message: `Submitted! ${count} unmarked students recorded as Absent & auto-alerts delivered.`, type: 'success' });
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    const handleFaceScan = async () => {
      setFaceStatus('scanning');
      setTimeout(async () => {
        const remainingStudents = filteredList.filter(s => s.student_id && !filteredRecords.find(r => r.student_id === s.student_id));
        const student = remainingStudents.length > 0 ? remainingStudents[Math.floor(Math.random() * remainingStudents.length)] : null;
        if (student && student.student_id) {
          await handleToggleAttendance(student as Student, 'Absent'); // Mark present
          setFaceStatus('success');
          setNotification({ message: `Face match: ${student.name} marked Present`, type: 'success' });
        } else {
          setFaceStatus('success');
          setNotification({ message: `No unmarked students found for face match`, type: 'info' });
        }
        setTimeout(() => {
          setFaceStatus('idle');
          setShowFaceScanner(false);
        }, 1500);
      }, 2000);
    };

    const list = view === 'Students' ? students.filter(s => s.class === selectedClass) : 
                 view === 'Teachers' ? teachers : 
                 view === 'Staff' ? staff : [];

    const filteredList = list.filter(person => {
      const name = person.name;
      const personId = person.student_id || person.teacher_id || person.staff_id;
      return name.toLowerCase().includes(searchTerm.toLowerCase()) || 
             (personId && personId.toLowerCase().includes(searchTerm.toLowerCase()));
    });

    const handleToggleAttendance = async (student: Student, currentStatus: string | undefined) => {
      if (!isTeacher && !isAttender && loggedInUser?.role !== 'Super Admin' && loggedInUser?.role !== 'Management') return;
      
      const newStatus = currentStatus === 'Present' ? 'Absent' : 'Present';
      const recordId = filteredRecords.find(r => r.student_id === student.student_id)?.id || `ATT-${Math.random().toString(36).substr(2, 9)}`;
      
      const newRecord: AttendanceRecord = {
        id: recordId,
        user_id: student.student_id,
        student_id: student.student_id,
        studentEmail: student.email,
        studentName: student.name,
        class: student.class_id,
        section: student.section,
        date: selectedDate,
        timestamp: new Date().toISOString(),
        status: newStatus as 'Present' | 'Absent' | 'Late'
      };

      try {
        await setDoc(doc(db, 'attendance', recordId), newRecord);
        if (newStatus === 'Absent') {
          const alertId = `ALR-${Date.now()}-${student.student_id}`;
          const alert: Alert = {
            id: alertId,
            type: 'General',
            message: `Attendance Alert: ${student.name} marked as ${newStatus} on ${selectedDate}`,
            timestamp: new Date().toISOString(),
            sender: loggedInUser?.name || 'System Auto',
            status: 'Active',
            scope: student.student_id
          };
          await setDoc(doc(db, 'alerts', alertId), alert);
        }
        setNotification({ message: `Attendance marked as ${newStatus} for ${student.name}`, type: 'success' });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `attendance/${recordId}`);
      }
    };

    const handleQRScan = async (data: string) => {
      const student = students.find(s => s.student_id === data);
      if (!student) {
        setScanStatus('error');
        setNotification({ message: 'Invalid Student QR Code!', type: 'error' });
        setTimeout(() => setScanStatus('idle'), 2000);
        return;
      }
      
      await handleToggleAttendance(student, 'Absent');
      setScanStatus('success');
      setTimeout(() => {
        setScanStatus('idle');
        setShowScanner(false);
      }, 1000);
    };

    return (
      <div className="space-y-6">
        <AnimatePresence>
          {showScanner && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-[290]"
                onClick={() => setShowScanner(false)}
              />
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                className="fixed inset-x-0 bottom-0 z-[300] bg-white dark:bg-stone-900 p-6 rounded-t-3xl shadow-2xl border-t border-stone-100 dark:border-stone-800"
              >
                <div className="max-w-md mx-auto relative">
                  {scanStatus === 'success' && (
                    <div className="absolute inset-0 z-10 bg-emerald-500/90 flex items-center justify-center rounded-2xl">
                      <CheckCircle2 className="w-16 h-16 text-white" />
                    </div>
                  )}
                  {scanStatus === 'error' && (
                    <div className="absolute inset-0 z-10 bg-red-500/90 flex items-center justify-center rounded-2xl">
                      <XCircle className="w-16 h-16 text-white" />
                    </div>
                  )}
                  <QRScanner onScan={handleQRScan} onError={(err) => setNotification({ message: err, type: 'error' })} />
                  <button onClick={() => setShowScanner(false)} className="mt-4 w-full py-3 bg-red-600 text-white rounded-xl font-bold">Close Scanner</button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showFaceScanner && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-[290]"
                onClick={() => setShowFaceScanner(false)}
              />
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                className="fixed inset-x-0 bottom-0 z-[300] bg-white dark:bg-stone-900 p-6 rounded-t-3xl shadow-2xl border-t border-stone-100 dark:border-stone-800"
              >
                <div className="max-w-md mx-auto relative p-8 border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-3xl flex flex-col items-center justify-center min-h-[300px]">
                  {faceStatus === 'idle' && (
                    <>
                      <Eye className="w-16 h-16 text-purple-500 mb-4 animate-pulse" />
                      <button onClick={handleFaceScan} className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700">Scan Student Face</button>
                    </>
                  )}
                  {faceStatus === 'scanning' && (
                    <>
                      <div className="w-16 h-16 rounded-full border-4 border-purple-500 border-t-transparent animate-spin mb-4" />
                      <p className="font-bold text-stone-600 dark:text-stone-400">Scanning Subject...</p>
                    </>
                  )}
                  {faceStatus === 'success' && (
                    <>
                      <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
                      <p className="font-bold text-emerald-600 dark:text-emerald-400">Match Recorded!</p>
                    </>
                  )}
                  <button onClick={() => setShowFaceScanner(false)} className="mt-8 w-full py-3 bg-red-600 text-white rounded-xl font-bold">Cancel</button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h3 className="text-xl font-bold text-stone-950 dark:text-stone-50">Attendance Records</h3>
            <p className="text-xs text-stone-500">View and manage attendance data</p>
          </div>
          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
            <button onClick={() => setShowScanner(true)} className="bg-emerald-600 text-white px-4 py-3 lg:py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 dark:shadow-none w-full lg:w-auto font-bold">
              <Camera className="w-4 h-4" /> Scan QR
            </button>
            <button onClick={() => setShowFaceScanner(true)} className="bg-purple-600 text-white px-4 py-3 lg:py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-purple-700 transition-all shadow-lg shadow-purple-100 dark:shadow-none w-full lg:w-auto font-bold">
              <Eye className="w-4 h-4" /> Face Scan
            </button>
            <button onClick={handleSubmitAll} className="bg-indigo-600 text-white px-4 py-3 lg:py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none w-full lg:w-auto font-bold">
              <CheckCircle2 className="w-4 h-4" /> Submit All
            </button>
            <div className="relative flex-1 lg:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
              <input 
                type="text" 
                placeholder="Search by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all w-full lg:w-64 dark:text-stone-100"
              />
            </div>
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="p-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-sm outline-none font-bold text-stone-600 dark:text-stone-400 w-full lg:w-auto"
            />
            {!isTeacher && view === 'Students' && (
              <select 
                value={selectedClass} 
                onChange={(e) => setSelectedClass(e.target.value)}
                className="p-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-sm outline-none font-bold text-stone-600 dark:text-stone-400 w-full lg:w-auto"
              >
                {Array.from({ length: 10 }, (_, i) => (i + 1).toString()).map(c => (
                  <option key={c} value={c}>Class {c}</option>
                ))}
              </select>
            )}
            <button 
              onClick={exportToCSV}
              className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 dark:shadow-none flex items-center gap-2 w-full lg:w-auto justify-center"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800 overflow-hidden overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-stone-50 dark:bg-stone-800/50 border-b border-stone-100 dark:border-stone-800">
              <tr>
                <th className="p-4 text-xs font-bold text-stone-500 uppercase tracking-widest">Student/Staff</th>
                <th className="p-4 text-xs font-bold text-stone-500 uppercase tracking-widest">ID</th>
                <th className="p-4 text-xs font-bold text-stone-500 uppercase tracking-widest">Status</th>
                <th className="p-4 text-xs font-bold text-stone-500 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50 dark:divide-stone-800/50">
              {filteredList.map(person => {
                const personId = person.student_id || person.staff_id;
                const record = filteredRecords.find(r => r.student_id === personId);
                const canMark = (isTeacher || isAttender || loggedInUser?.role === 'Super Admin' || loggedInUser?.role === 'Management') && view === 'Students';
                
                return (
                  <tr key={personId} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-stone-100 dark:bg-stone-800 rounded-xl flex items-center justify-center overflow-hidden">
                          {person.photo ? <img src={person.photo} className="w-full h-full object-cover" /> : <UserIcon className="w-5 h-5 text-stone-400 dark:text-stone-600" />}
                        </div>
                        <span className="font-bold text-stone-800 dark:text-stone-100">
                          {person.name}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-stone-500 dark:text-stone-400">{personId}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        record?.status === 'Present'
                          ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' 
                          : 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                      }`}>
                        {record?.status || 'Absent'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {canMark ? (
                        <button
                          onClick={() => handleToggleAttendance(person as Student, record?.status)}
                          className={`p-2 rounded-lg transition-all ${
                            record?.status === 'Present'
                              ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30'
                              : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
                          }`}
                        >
                          {record?.status === 'Present' ? <X className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                        </button>
                      ) : (
                        <span className="text-xs text-stone-500 dark:text-stone-500 font-mono">
                          {record ? new Date(record.timestamp).toLocaleTimeString() : '-'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredList.length === 0 && (
            <div className="p-12 text-center text-stone-500 dark:text-stone-500">
              No records found for this selection.
            </div>
          )}
        </div>
      </div>
    );
  };

  const LibraryManagement = () => {
    const books = [
      { id: 'B001', title: 'Advanced Physics', author: 'H.C. Verma', stock: 12, category: 'Science' },
      { id: 'B002', title: 'Modern Mathematics', author: 'R.D. Sharma', stock: 8, category: 'Math' },
      { id: 'B003', title: 'World History', author: 'J.L. Nehru', stock: 5, category: 'History' },
    ];

    const handleReserveBook = async (book: any) => {
      if (!loggedInUser) return;
      const reservation: Omit<Reservation, 'id'> = {
        book_title: book.title,
        student_id: loggedInUser.user_id,
        student_name: loggedInUser.name,
        reservation_date: new Date().toISOString(),
        status: 'Pending'
      };
      await addDoc(collection(db, 'reservations'), reservation);
      alert('Book reserved successfully!');
    };

    const handleUpdateReservation = async (id: string, status: 'Approved' | 'Rejected' | 'Returned') => {
      await updateDoc(doc(db, 'reservations', id), { status });
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-stone-950 dark:text-stone-50">Smart Library</h3>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 dark:shadow-none">
            <Plus className="w-4 h-4" /> Add Book
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {books.map(book => (
            <div key={book.id} className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
                  <BookIcon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500 dark:text-stone-500">{book.id}</span>
              </div>
              <div>
                <h4 className="font-bold text-stone-800 dark:text-stone-100">{book.title}</h4>
                <p className="text-xs text-stone-500 dark:text-stone-400">{book.author}</p>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-stone-50 dark:border-stone-800">
                <span className="text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">{book.category}</span>
                <button 
                  onClick={() => handleReserveBook(book)}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/40"
                >
                  Reserve
                </button>
              </div>
            </div>
          ))}
        </div>

        {loggedInUser?.role === 'Librarian' && (
          <div className="mt-8">
            <h3 className="text-xl font-bold text-stone-950 dark:text-stone-50 mb-4">Manage Reservations</h3>
            <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800">
              {reservations.map(res => (
                <div key={res.id} className="flex justify-between items-center py-4 border-b border-stone-100 dark:border-stone-800">
                  <div>
                    <p className="font-bold">{res.book_title}</p>
                    <p className="text-xs text-stone-500">Student: {res.student_name} | Date: {new Date(res.reservation_date).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    {res.status === 'Pending' && (
                      <>
                        <button onClick={() => handleUpdateReservation(res.id, 'Approved')} className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">Approve</button>
                        <button onClick={() => handleUpdateReservation(res.id, 'Rejected')} className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full">Reject</button>
                      </>
                    )}
                    {res.status === 'Approved' && (
                      <button onClick={() => handleUpdateReservation(res.id, 'Returned')} className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">Mark Returned</button>
                    )}
                    <span className="text-xs font-bold text-stone-500">{res.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const SubjectManagement = () => {
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

  const HomeworkManagement = () => {
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

  const ResultManagement = () => {
    const teacher = teachers.find(t => t.email === loggedInUser?.email);
    const isTeacher = loggedInUser?.role === 'Teacher';
    const initialClass = isTeacher && teacher && teacher.assigned_classes && teacher.assigned_classes.length > 0 ? teacher.assigned_classes[0].split('-')[0] : CLASSES[0];
    const initialSection = isTeacher && teacher && teacher.assigned_classes && teacher.assigned_classes.length > 0 ? teacher.assigned_classes[0].split('-')[1] || SECTIONS[0] : SECTIONS[0];
    
    const [selectedClass, setSelectedClass] = useState(initialClass);
    const [selectedSection, setSelectedSection] = useState(initialSection);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [examName, setExamName] = useState('Midterm');
    const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);
    const [marks, setMarks] = useState<{ [student_id: string]: number }>({});
    const [sortOrder, setSortOrder] = useState('name_asc');

    const availableSubjects = schoolSubjects.filter(s => s.class === selectedClass);
    const baseFilteredStudents = students.filter(s => s.class === selectedClass && s.section === selectedSection);
    const filteredStudents = [...baseFilteredStudents].sort((a, b) => {
      if (sortOrder === 'name_asc') return a.name.localeCompare(b.name);
      if (sortOrder === 'name_desc') return b.name.localeCompare(a.name);
      const markA = marks[a.student_id] || 0;
      const markB = marks[b.student_id] || 0;
      if (sortOrder === 'marks_high') return markB - markA;
      if (sortOrder === 'marks_low') return markA - markB;
      return 0;
    });

    const handleSaveResults = async () => {
      if (!selectedSubject || !examName) {
        setNotification({ message: 'Please select subject and exam', type: 'error' });
        return;
      }

      try {
        for (const student of filteredStudents) {
          const mark = marks[student.student_id] || 0;
          const maxMarks = 100;
          const percentage = (mark / maxMarks) * 100;
          let grade = 'F';
          if (percentage >= 90) grade = 'A+';
          else if (percentage >= 80) grade = 'A';
          else if (percentage >= 70) grade = 'B';
          else if (percentage >= 60) grade = 'C';
          else if (percentage >= 50) grade = 'D';

          const result: ExamResult = {
            id: `RES-${student.student_id}-${examName}-${selectedSubject}`,
            student_id: student.student_id,
            studentName: student.name,
            class: selectedClass,
            section: selectedSection,
            subject: selectedSubject,
            examName,
            marksObtained: mark,
            maxMarks,
            grade,
            date: examDate,
            teacherId: teacher?.teacher_id || 'system'
          };

          await setDoc(doc(db, 'examResults', result.id), result);
        }
        setNotification({ message: 'Results published successfully!', type: 'success' });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'examResults');
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-stone-950 dark:text-stone-50">Result Management</h3>
            <p className="text-xs text-stone-500">Enter and publish exam results</p>
          </div>
          <button 
            onClick={handleSaveResults}
            className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 dark:shadow-none flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" /> Publish Results
          </button>
        </div>

        <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Class</label>
              <select 
                value={selectedClass} 
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  if (isTeacher && teacher?.assigned_classes) {
                    const match = teacher.assigned_classes.find(ac => ac.startsWith(e.target.value + '-'));
                    if (match) setSelectedSection(match.split('-')[1]);
                  }
                }}
                disabled={isTeacher && (!teacher?.assigned_classes || teacher.assigned_classes.length <= 1)}
                className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-stone-100 disabled:opacity-50"
              >
                {isTeacher && teacher?.assigned_classes ? 
                  Array.from(new Set(teacher.assigned_classes.map(c => c.split('-')[0]))).map((c: string) => (
                    <option key={c} value={c}>Grade {c}</option>
                  ))
                  : CLASSES.map(c => <option key={c} value={c}>Grade {c}</option>)
                }
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Section</label>
              <select 
                value={selectedSection} 
                onChange={(e) => setSelectedSection(e.target.value)}
                disabled={isTeacher && (!teacher?.assigned_classes || teacher.assigned_classes.length <= 1)}
                className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-stone-100 disabled:opacity-50"
              >
                {isTeacher && teacher?.assigned_classes ?
                  Array.from(new Set(
                    teacher.assigned_classes
                      .filter(ac => ac.startsWith(selectedClass + '-'))
                      .map(ac => ac.split('-')[1])
                  )).map((s: string) => <option key={s} value={s}>Section {s}</option>)
                  : SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)
                }
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Subject</label>
              <select 
                value={selectedSubject} 
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-stone-100"
              >
                <option value="">Select Subject</option>
                {availableSubjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Exam</label>
              <select 
                value={examName} 
                onChange={(e) => setExamName(e.target.value)}
                className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-stone-100"
              >
                <option value="Midterm">Midterm</option>
                <option value="Final">Final</option>
                <option value="Quiz 1">Quiz 1</option>
                <option value="Quiz 2">Quiz 2</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Date</label>
              <input 
                type="date" 
                value={examDate} 
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-stone-100"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Sort By</label>
              <select 
                value={sortOrder} 
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-stone-100"
              >
                <option value="name_asc">Name (A-Z)</option>
                <option value="name_desc">Name (Z-A)</option>
                <option value="marks_high">Marks (High-Low)</option>
                <option value="marks_low">Marks (Low-High)</option>
              </select>
            </div>
          </div>

          <div className="overflow-hidden overflow-x-auto rounded-2xl border border-stone-100 dark:border-stone-800">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-100 dark:border-stone-800">
                  <th className="p-4 text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Student ID</th>
                  <th className="p-4 text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Student Name</th>
                  <th className="p-4 text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Marks (out of 100)</th>
                  <th className="p-4 text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50 dark:divide-stone-800">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-stone-500 dark:text-stone-500 italic">No students found in this section.</td>
                  </tr>
                ) : (
                  filteredStudents.map(student => (
                    <tr key={student.student_id} className="hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                      <td className="p-4 text-xs font-bold text-stone-500 dark:text-stone-400 font-mono">{student.student_id}</td>
                      <td className="p-4 font-bold text-stone-800 dark:text-stone-100">{student.name}</td>
                      <td className="p-4">
                        <input 
                          type="number" 
                          min="0" 
                          max="100"
                          value={marks[student.student_id] || ''}
                          onChange={(e) => setMarks(prev => ({ ...prev, [student.student_id]: Number(e.target.value) }))}
                          className="w-24 p-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-stone-100"
                        />
                      </td>
                      <td className="p-4 text-xs font-bold text-stone-500 dark:text-stone-400">{examDate}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const PayrollManagement = () => {
    const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const handleDisburseSalary = async (teacherId: string) => {
      setIsLoading(true);
      const teacher = teachers.find(t => t.teacher_id === teacherId);
      if (!teacher) {
        setIsLoading(false);
        return;
      }

      const newRecord: SalaryRecord = {
        id: `SAL-${teacherId}-${selectedMonth}-${selectedYear}`,
        month: selectedMonth,
        year: selectedYear,
        basic: teacher.salary.basic,
        allowances: teacher.salary.allowances,
        deductions: 0,
        net: teacher.salary.basic + teacher.salary.allowances,
        paidAt: new Date().toISOString()
      };

      try {
        const teacherRef = doc(db, 'teachers', teacherId);
        await updateDoc(teacherRef, {
          'salary.history': [newRecord, ...(teacher.salary.history || [])]
        });
        setNotification({ message: `Salary disbursed to ${teacher.name}`, type: 'success' });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `teachers/${teacherId}`);
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-stone-950 dark:text-stone-50">Payroll Management</h3>
            <p className="text-xs text-stone-500">Manage staff salaries and disbursements</p>
          </div>
          <div className="flex gap-2">
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="p-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-xs font-bold outline-none dark:text-stone-100"
            >
              {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="p-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-xs font-bold outline-none dark:text-stone-100"
            >
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-xl border border-stone-100 dark:border-stone-800 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-100 dark:border-stone-800">
                <th className="p-4 text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Staff Name</th>
                <th className="p-4 text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Role</th>
                <th className="p-4 text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Basic</th>
                <th className="p-4 text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Net Salary</th>
                <th className="p-4 text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Status</th>
                <th className="p-4 text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map(teacher => {
                const isPaid = teacher.salary.history?.some(h => h.month === selectedMonth && h.year === selectedYear);
                return (
                  <tr key={teacher.teacher_id} className="border-b border-stone-50 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                    <td className="p-4 font-bold text-stone-800 dark:text-stone-100">{teacher.name}</td>
                    <td className="p-4 text-stone-600 dark:text-stone-400">Teacher</td>
                    <td className="p-4 text-stone-600 dark:text-stone-400">${teacher.salary.basic}</td>
                    <td className="p-4 font-bold text-stone-800 dark:text-stone-100">${teacher.salary.basic + teacher.salary.allowances}</td>
                    <td className="p-4">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                        isPaid ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                      }`}>
                        {isPaid ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                    <td className="p-4">
                      {!isPaid && (
                        <button 
                          onClick={() => handleDisburseSalary(teacher.teacher_id)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-bold text-xs"
                        >
                          Disburse
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const StoreManagement = () => {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('Stationery');
    const [quantity, setQuantity] = useState(0);
    const [price, setPrice] = useState(0);

    const handleAddItem = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      const newItem: StoreItem = {
        id: `ITEM-${Date.now()}`,
        name,
        category,
        quantity,
        minQuantity: 10,
        price,
        supplier: 'General Supplier',
        lastRestocked: new Date().toISOString().split('T')[0]
      };

      try {
        await setDoc(doc(db, 'storeItems', newItem.id), newItem);
        setNotification({ message: 'Item added to inventory', type: 'success' });
        setName('');
        setQuantity(0);
        setPrice(0);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'storeItems');
      } finally {
        setIsLoading(false);
      }
    };

    const updateQuantity = async (id: string, delta: number) => {
      const item = storeItems.find(i => i.id === id);
      if (!item) return;

      try {
        await updateDoc(doc(db, 'storeItems', id), {
          quantity: Math.max(0, item.quantity + delta)
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `storeItems/${id}`);
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-stone-950 dark:text-stone-50">Inventory Management</h3>
            <p className="text-xs text-stone-500">Manage school store and supplies</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800">
            <h4 className="text-lg font-bold text-stone-800 dark:text-stone-100 mb-6">Add New Item</h4>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Item Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. School Tie"
                  className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-stone-100"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Category</label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-stone-100"
                >
                  <option value="Stationery">Stationery</option>
                  <option value="Uniform">Uniform</option>
                  <option value="Books">Books</option>
                  <option value="Sports">Sports</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Quantity</label>
                  <input 
                    type="number" 
                    value={quantity} 
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-stone-100"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Price</label>
                  <input 
                    type="number" 
                    value={price} 
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-stone-100"
                    required
                  />
                </div>
              </div>
              <button 
                type="submit"
                className="w-full py-4 bg-stone-800 dark:bg-stone-700 text-white rounded-2xl font-bold shadow-lg hover:bg-stone-900 dark:hover:bg-stone-600 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" /> Add Item
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-stone-900 rounded-3xl shadow-xl border border-stone-100 dark:border-stone-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-100 dark:border-stone-800">
                  <th className="p-4 text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Item</th>
                  <th className="p-4 text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Category</th>
                  <th className="p-4 text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Stock</th>
                  <th className="p-4 text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Price</th>
                  <th className="p-4 text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Action</th>
                </tr>
              </thead>
              <tbody>
                {storeItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-stone-500 dark:text-stone-500 italic">No items in inventory.</td>
                  </tr>
                ) : (
                  storeItems.map(item => (
                    <tr key={item.id} className="border-b border-stone-50 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                      <td className="p-4">
                        <p className="font-bold text-stone-800 dark:text-stone-100">{item.name}</p>
                        <p className="text-[10px] text-stone-500 dark:text-stone-500 uppercase font-bold tracking-widest">ID: {item.id}</p>
                      </td>
                      <td className="p-4 text-stone-600 dark:text-stone-400">{item.category}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${item.quantity <= item.minQuantity ? 'text-red-600 dark:text-red-400' : 'text-stone-800 dark:text-stone-100'}`}>
                            {item.quantity}
                          </span>
                          {item.quantity <= item.minQuantity && (
                            <AlertTriangle className="w-3 h-3 text-red-500" />
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-bold text-stone-800 dark:text-stone-100">${item.price}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => updateQuantity(item.id, 1)}
                            className="p-1 bg-stone-100 dark:bg-stone-800 rounded hover:bg-stone-200 dark:hover:bg-stone-700"
                          >
                            <Plus className="w-3 h-3 dark:text-stone-100" />
                          </button>
                          <button 
                            onClick={() => updateQuantity(item.id, -1)}
                            className="p-1 bg-stone-100 dark:bg-stone-800 rounded hover:bg-stone-200 dark:hover:bg-stone-700"
                          >
                            <Trash2 className="w-3 h-3 text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          </div>
        </div>
      </div>
    );
  };

  const TeacherDashboard = () => {
    const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'homework' | 'results'>('overview');
    const teacher = teachers.find(t => t.email === loggedInUser?.email);

    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4 bg-white dark:bg-stone-900 p-1 rounded-2xl border border-stone-200 dark:border-stone-800 w-fit overflow-x-auto max-w-full">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'attendance', label: 'Attendance' },
            { id: 'homework', label: 'Homework' },
            { id: 'results', label: 'Results' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 dark:shadow-none' : 'text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800">
                <h3 className="text-sm font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest mb-4">My Class</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <span className="font-bold text-blue-800 dark:text-blue-300">{teacher?.classSection || '10-A'}</span>
                    <span className="text-xs text-blue-600 dark:text-blue-400">{teacher?.subject || 'Mathematics'}</span>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800">
                <h3 className="text-sm font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest mb-4">Class Attendance</h3>
                <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">94.2%</div>
                <p className="text-xs text-stone-500 dark:text-stone-500 mt-1">Average for your section</p>
              </div>
              <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800">
                <h3 className="text-sm font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest mb-4">Pending Grades</h3>
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">12</div>
                <p className="text-xs text-stone-500 dark:text-stone-500 mt-1">Assignments to review</p>
              </div>
            </div>
            <StudentManagement />
          </div>
        )}
        {activeTab === 'attendance' && <AttendanceManagement />}
        {activeTab === 'homework' && <HomeworkManagement />}
        {activeTab === 'results' && <ResultManagement />}
      </div>
    );
  };

  const AccountsDashboard = () => {
    const [activeTab, setActiveTab] = useState<'fees' | 'payroll'>('fees');

    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4 bg-white dark:bg-stone-900 p-1 rounded-2xl border border-stone-200 dark:border-stone-800 w-fit">
          <button
            onClick={() => setActiveTab('fees')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'fees' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 dark:shadow-none' : 'text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'
            }`}
          >
            Fees
          </button>
          <button
            onClick={() => setActiveTab('payroll')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'payroll' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 dark:shadow-none' : 'text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'
            }`}
          >
            Payroll
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800">
            <h3 className="text-sm font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest mb-4">Total Revenue</h3>
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">$124,500</div>
            <p className="text-xs text-stone-500 dark:text-stone-500 mt-1">This academic year</p>
          </div>
          <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800">
            <h3 className="text-sm font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest mb-4">Pending Fees</h3>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">$12,400</div>
            <p className="text-xs text-stone-500 dark:text-stone-500 mt-1">42 students overdue</p>
          </div>
          <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800">
            <h3 className="text-sm font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest mb-4">Staff Salaries</h3>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">$85,000</div>
            <p className="text-xs text-stone-500 dark:text-stone-500 mt-1">Monthly disbursement</p>
          </div>
        </div>

        {activeTab === 'fees' ? <FeesManagement /> : <PayrollManagement />}
      </div>
    );
  };

  const SecurityDashboard = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800">
          <h3 className="text-sm font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest mb-4">Active Personnel</h3>
          <div className="text-3xl font-bold text-slate-700 dark:text-stone-100">8 / 12</div>
          <p className="text-xs text-stone-500 dark:text-stone-500 mt-1">Currently on duty</p>
        </div>
        <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800">
          <h3 className="text-sm font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest mb-4">Visitor Count</h3>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">14</div>
          <p className="text-xs text-stone-500 dark:text-stone-500 mt-1">Checked in today</p>
        </div>
        <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800">
          <h3 className="text-sm font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest mb-4">Incidents</h3>
          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">0</div>
          <p className="text-xs text-stone-500 dark:text-stone-500 mt-1">No active reports</p>
        </div>
      </div>
      <SecurityManagement />
    </div>
  );

  const StoreDashboard = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800">
          <h3 className="text-sm font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest mb-4">Total Items</h3>
          <div className="text-3xl font-bold text-stone-800 dark:text-stone-100">{storeItems.length}</div>
          <p className="text-xs text-stone-500 dark:text-stone-500 mt-1">In inventory</p>
        </div>
        <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800">
          <h3 className="text-sm font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest mb-4">Low Stock</h3>
          <div className="text-3xl font-bold text-red-600 dark:text-red-400">
            {storeItems.filter(i => i.quantity <= i.minQuantity).length}
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-500 mt-1">Items need restocking</p>
        </div>
        <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800">
          <h3 className="text-sm font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest mb-4">Inventory Value</h3>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            ${storeItems.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0).toLocaleString()}
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-500 mt-1">Total asset value</p>
        </div>
      </div>
      <StoreManagement />
    </div>
  );

  const ReceptionDashboard = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800">
          <h3 className="text-sm font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest mb-4">Today's Visitors</h3>
          <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">24</div>
          <p className="text-xs text-stone-500 dark:text-stone-500 mt-1">Scheduled appointments</p>
        </div>
        <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800">
          <h3 className="text-sm font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest mb-4">New Admissions</h3>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">12</div>
          <p className="text-xs text-stone-500 dark:text-stone-500 mt-1">Applications this week</p>
        </div>
        <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800">
          <h3 className="text-sm font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest mb-4">Inquiries</h3>
          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">8</div>
          <p className="text-xs text-stone-500 dark:text-stone-500 mt-1">Pending response</p>
        </div>
      </div>
      <FrontOfficeManagement />
    </div>
  );

  const StudentDashboard = () => {
    const student = students.find(s => s.email === loggedInUser?.email);
    const [report, setReport] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    if (!student) return <div className="dark:text-stone-100">Student profile not found.</div>;

    const today = new Date().toISOString().split('T')[0];
    const hasMarkedToday = attendanceRecords.some(r => r.student_id === student.student_id && r.date === today);
    const results = examResults.filter(r => r.student_id === student.student_id);
    const attendance = attendanceRecords.filter(r => r.student_id === student.student_id);

    // Prepare Grade Data
    const gradePoints: { [key: string]: number } = {
        'A+': 4.0, 'A': 4.0, 'A-': 3.7,
        'B+': 3.3, 'B': 3.0, 'B-': 2.7,
        'C+': 2.3, 'C': 2.0, 'C-': 1.7,
        'D+': 1.3, 'D': 1.0, 'F': 0.0
    };
    const gradeData = results
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(r => ({
            date: r.date,
            subject: r.subject,
            gpa: gradePoints[r.grade] || 0
        }));

    // Prepare Attendance Data
    const attendanceData = attendance
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(r => ({
            date: r.date,
            status: r.status === 'Present' ? 1 : 0
        }));

    const calculateGPA = (results: ExamResult[]) => {
      if (results.length === 0) return "0.00";
      const gradePoints: { [key: string]: number } = {
        'A+': 4.0, 'A': 4.0, 'A-': 3.7,
        'B+': 3.3, 'B': 3.0, 'B-': 2.7,
        'C+': 2.3, 'C': 2.0, 'C-': 1.7,
        'D+': 1.3, 'D': 1.0, 'F': 0.0
      };
      const totalPoints = results.reduce((acc, curr) => acc + (gradePoints[curr.grade] || 0), 0);
      return (totalPoints / results.length).toFixed(2);
    };

    const gpa = calculateGPA(results);

    const handleGenerateReport = async () => {
        setIsGenerating(true);
        try {
            const report = await generatePerformanceReport(student.name, results);
            setReport(report);
        } catch (err) {
            console.error(err);
            setNotification({ message: 'Failed to generate report.', type: 'error' });
        } finally {
            setIsGenerating(false);
        }
    };



    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800 relative overflow-hidden">
            <h3 className="text-sm font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest mb-4">Attendance</h3>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">98%</div>
                <p className="text-xs text-stone-500 dark:text-stone-500 mt-1">Present this month</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800">
            <h3 className="text-sm font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest mb-4">GPA</h3>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{gpa}</div>
            <p className="text-xs text-stone-500 dark:text-stone-500 mt-1">Academic performance</p>
          </div>
          <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800">
            <h3 className="text-sm font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest mb-4">Fee Status</h3>
            <div className={`text-3xl font-bold ${student.fees.status === 'Paid' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {student.fees.status}
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-500 mt-1">Next due: April 1st</p>
          </div>
        </div>
        <div className="bg-white dark:bg-stone-900 p-8 rounded-3xl shadow-xl border border-stone-100 dark:border-stone-800">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-stone-800 dark:text-stone-100">Academic Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                <div className="bg-white dark:bg-stone-900 p-8 rounded-3xl shadow-xl border border-stone-100 dark:border-stone-800">
                    <h3 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-6">Academic Progress</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={gradeData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis domain={[0, 4]} />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="gpa" stroke="#2563eb" activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-white dark:bg-stone-900 p-8 rounded-3xl shadow-xl border border-stone-100 dark:border-stone-800">
                    <h3 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-6">Attendance Trend</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={attendanceData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis domain={[0, 1]} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="status" fill="#10b981" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleGenerateReport}
                disabled={isGenerating}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition-colors"
              >
                {isGenerating ? 'Generating...' : 'Generate AI Report'}
              </button>
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <Award className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">GPA: {gpa}</span>
              </div>
            </div>
          </div>
          {report && (
            <div className="p-4 mb-4 bg-stone-50 dark:bg-stone-800 rounded-2xl text-stone-700 dark:text-stone-300 text-sm">
                {report}
            </div>
          )}
          <div className="space-y-4">
            {results.length > 0 ? (
              results.map((result, idx) => (
                <div key={result.id || idx} className="flex justify-between items-center p-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
                  <div>
                    <p className="font-bold text-stone-800 dark:text-stone-200">{result.subject}</p>
                    <p className="text-xs text-stone-500 dark:text-stone-500">{result.examName}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">{result.grade}</span>
                    <p className="text-[10px] text-stone-500 dark:text-stone-500 font-bold">{result.marksObtained}/{result.maxMarks}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <GraduationCap className="w-12 h-12 text-stone-200 dark:text-stone-700 mx-auto mb-4" />
                <p className="text-stone-500 dark:text-stone-400">No academic records found yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  const ParentDashboard = () => {
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
        const newPaid = child.fees.paid + amountNum;
        const newStatus = newPaid >= child.fees.total ? 'Paid' : 'Pending';
        
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
          class: `${child.class_id}-${child.section}`
        });
        setShowFeeModal(false);
        setShowConfirmation(true);
        setPaymentAmount('');
        setNotification({ message: 'Payment Successful! Fee status updated.', type: 'success' });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `students/${child.id}`);
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
                key={c.id}
                onClick={() => setSelectedChildIndex(idx)}
                className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-bold transition-all whitespace-nowrap ${
                  selectedChildIndex === idx 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 dark:shadow-none' 
                    : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border border-stone-100 dark:border-stone-800 hover:border-blue-200 dark:hover:border-blue-900'
                }`}
              >
                <div className="w-8 h-8 rounded-lg overflow-hidden bg-stone-100 dark:bg-stone-800">
                  {c.photo ? <img src={c.photo} className="w-full h-full object-cover" /> : <UserIcon className="w-4 h-4 m-auto mt-2 text-stone-500" />}
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
                <p className="text-stone-500 dark:text-stone-400">Class {child.class_id} - Section {child.section} • ID: {child.student_id}</p>
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
  </div>
);
};

  const TransportManagement = () => {
    const handleAddRoute = () => {
      const name = prompt('Enter route name:');
      const bus = prompt('Enter bus number:');
      const driver = prompt('Enter driver name:');
      if (name && bus && driver) {
        const newRoute: BusRoute = {
          id: `R${busRoutes.length + 1}`,
          routeName: name,
          busNumber: bus,
          driverName: driver,
          driverPhone: '1234567890',
          capacity: 40,
          studentsCount: 0,
          stops: [],
          status: 'On Time'
        };
        setBusRoutes(prev => [...prev, newRoute]);
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-stone-950 dark:text-stone-50">Smart Transport</h3>
          <button 
            onClick={handleAddRoute}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 dark:shadow-none"
          >
            <Plus className="w-4 h-4" /> Add Route
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800 min-h-[400px] relative overflow-hidden">
            <div className="absolute inset-0 bg-stone-50 dark:bg-stone-950 flex items-center justify-center">
              <div className="text-center opacity-20">
                <School className="w-32 h-32 mx-auto mb-4 dark:text-stone-100" />
                <p className="font-bold text-2xl uppercase tracking-widest dark:text-stone-100">Live Map Simulation</p>
              </div>
              {/* Simulated Bus Markers */}
              <motion.div 
                animate={{ x: [0, 100, 0], y: [0, -50, 0] }}
                transition={{ duration: 10, repeat: Infinity }}
                className="absolute top-1/4 left-1/4 w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg"
              >
                <School className="w-4 h-4" />
              </motion.div>
              <motion.div 
                animate={{ x: [0, -150, 0], y: [0, 80, 0] }}
                transition={{ duration: 15, repeat: Infinity }}
                className="absolute bottom-1/3 right-1/4 w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white shadow-lg"
              >
                <School className="w-4 h-4" />
              </motion.div>
            </div>
            <div className="absolute bottom-6 left-6 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md p-4 rounded-2xl border border-white dark:border-stone-800 shadow-xl">
              <p className="text-xs font-bold text-stone-800 dark:text-stone-100 mb-2">Live Tracking</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-600 rounded-full" />
                  <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400">BUS-01</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-600 rounded-full" />
                  <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400">BUS-02</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {busRoutes.map(route => (
              <div key={route.id} className="bg-white dark:bg-stone-900 p-4 rounded-2xl shadow-md border border-stone-100 dark:border-stone-800 group">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-stone-800 dark:text-stone-100">{route.name}</h4>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                      route.status === 'On Route' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' :
                      route.status === 'Delayed' ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {route.status}
                    </span>
                    <button 
                      onClick={() => setBusRoutes(prev => prev.filter(r => r.id !== route.id))}
                      className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-stone-500 dark:text-stone-400">Bus: <span className="font-bold text-stone-800 dark:text-stone-200">{route.bus}</span></p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">Driver: <span className="font-bold text-stone-800 dark:text-stone-200">{route.driver}</span></p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">Students: <span className="font-bold text-stone-800 dark:text-stone-200">{route.students}</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const ReceiptModal = ({ record, onClose }: { record: any; onClose: () => void }) => {
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
                    onClose();
                  }}
                  className="flex-1 py-3 bg-stone-800 dark:bg-stone-700 text-white rounded-xl font-bold text-sm hover:bg-stone-900 dark:hover:bg-stone-600 transition-all"
                >
                  Print Receipt
                </button>
                <button 
                  onClick={onClose}
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

  const sendAlert = async (type: Alert['type'], message?: string) => {
    const newAlert: Alert = {
      id: `ALT-${Date.now()}`,
      type,
      message: message || `${type} Alert triggered.`,
      senderId: loggedInUser?.email || 'system',
      sender: loggedInUser?.name || 'System',
      timestamp: new Date().toISOString(),
      status: 'Active',
      scope: type === 'Emergency' || type === 'Fire' ? 'All' : 'Admin-Only'
    };
    await setDoc(doc(db, 'alerts', newAlert.id), newAlert);
    setNotification({ message: `${type} Alert Sent to ${newAlert.scope}!`, type: 'success' });
  };

  const LeaveManagement = () => {
    const isAdminOrManagement = loggedInUser?.role === 'Super Admin' || loggedInUser?.role === 'Management';

    const handleApplyLeave = async () => {
      const reason = prompt('Enter reason for leave:');
      const start = prompt('Enter start date (YYYY-MM-DD):');
      const end = prompt('Enter end date (YYYY-MM-DD):');
      if (reason && start && end) {
        const newRequest: LeaveRequest = {
          id: `LR-${Math.random().toString(36).substr(2, 9)}`,
          student_id: loggedInUser?.linked_id || '',
          userId: loggedInUser?.email || '',
          studentName: loggedInUser?.name || '',
          userName: loggedInUser?.name || '',
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

    const updateLeaveStatus = async (id: string, status: 'Approved' | 'Rejected') => {
      try {
        await updateDoc(doc(db, 'leaveRequests', id), { status });
      } catch (err: any) {
        console.error("Error updating leave status:", err);
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-stone-950 dark:text-stone-50">Leave Management</h3>
            <p className="text-xs text-stone-500 dark:text-stone-500">Track and manage leave requests</p>
          </div>
          {!isAdminOrManagement && (
            <button 
              onClick={handleApplyLeave}
              className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 dark:shadow-none flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Apply Leave
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4">
          {leaveRequests.length === 0 ? (
            <div className="bg-white dark:bg-stone-900 p-12 rounded-3xl border border-dashed border-stone-200 dark:border-stone-800 text-center">
              <p className="text-stone-500 dark:text-stone-500">No leave requests found.</p>
            </div>
          ) : (
            leaveRequests.map(request => (
              <div key={request.id} className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-stone-100 dark:bg-stone-800 rounded-2xl flex items-center justify-center text-stone-500 dark:text-stone-500">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-800 dark:text-stone-100">{request.userName}</h4>
                    <p className="text-xs text-stone-500 dark:text-stone-500">{request.role} • {request.startDate} to {request.endDate}</p>
                    <p className="text-sm text-stone-600 dark:text-stone-400 mt-1 italic">"{request.reason}"</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    request.status === 'Approved' ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' :
                    request.status === 'Rejected' ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                  }`}>
                    {request.status}
                  </span>
                  {isAdminOrManagement && request.status === 'Pending' && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => updateLeaveStatus(request.id, 'Approved')}
                        className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => updateLeaveStatus(request.id, 'Rejected')}
                        className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const AlertCenter = () => {
    const filteredAlerts = alerts.filter(alert => {
      if (alert.scope === 'All') return true;
      return loggedInUser?.role === 'Super Admin' || loggedInUser?.role === 'Management' || loggedInUser?.role === 'Teacher' || loggedInUser?.role === 'Security';
    });

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-stone-950 dark:text-stone-50">Alert Center</h3>
            <p className="text-xs text-stone-500 dark:text-stone-500">Send and monitor system-wide alerts</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(loggedInUser?.role === 'Super Admin' || loggedInUser?.role === 'Management' || loggedInUser?.role === 'Teacher' || loggedInUser?.role === 'Security') && (
            <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800 space-y-4">
              <h4 className="text-lg font-bold text-stone-800 dark:text-stone-100">Send New Alert</h4>
              <div className="space-y-4">
                <button 
                  onClick={() => sendAlert('Emergency', 'Medical Emergency in Block B')}
                  className="w-full bg-red-600 text-white p-4 rounded-2xl flex items-center justify-between hover:bg-red-700 transition-all shadow-lg shadow-red-100 dark:shadow-none"
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-6 h-6" />
                    <div className="text-left">
                      <p className="font-bold">Medical Emergency</p>
                      <p className="text-[10px] opacity-80">Alert security and medical team</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => sendAlert('Fire', 'Fire detected in Science Lab')}
                  className="w-full bg-orange-600 text-white p-4 rounded-2xl flex items-center justify-between hover:bg-orange-700 transition-all shadow-lg shadow-orange-100 dark:shadow-none"
                >
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-6 h-6" />
                    <div className="text-left">
                      <p className="font-bold">Fire Alert</p>
                      <p className="text-[10px] opacity-80">Evacuation protocol for all users</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => sendAlert('Incident', 'Suspicious activity near gate 2')}
                  className="w-full bg-stone-800 dark:bg-stone-700 text-white p-4 rounded-2xl flex items-center justify-between hover:bg-stone-900 dark:hover:bg-stone-600 transition-all shadow-lg shadow-stone-100 dark:shadow-none"
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-6 h-6" />
                    <div className="text-left">
                      <p className="font-bold">Security Incident</p>
                      <p className="text-[10px] opacity-80">Alert admin and security only</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          <div className={`${(loggedInUser?.role === 'Super Admin' || loggedInUser?.role === 'Management' || loggedInUser?.role === 'Teacher' || loggedInUser?.role === 'Security') ? '' : 'md:col-span-2'} bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800`}>
            <h4 className="text-lg font-bold text-stone-800 dark:text-stone-100 mb-4">Active Alerts</h4>
            <div className="space-y-3">
              {filteredAlerts.length === 0 ? (
                <p className="text-center text-stone-500 dark:text-stone-500 py-8 italic">No active alerts.</p>
              ) : (
                filteredAlerts.map(alert => (
                  <div key={alert.id} className={`p-4 rounded-2xl border ${
                    alert.type === 'Emergency' ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800 text-red-700 dark:text-red-400' :
                    alert.type === 'Fire' ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-800 text-orange-700 dark:text-orange-400' :
                    'bg-stone-50 dark:bg-stone-800 border-stone-100 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                  }`}>
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-bold text-sm">{alert.type} Alert</p>
                      <span className="text-[8px] font-bold uppercase opacity-60">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-xs">{alert.message}</p>
                    <p className="text-[10px] mt-2 opacity-60 font-bold">Sender: {alert.senderName} ({alert.senderRole})</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const SecurityManagement = () => {
    const cameras = [
      { id: 'CAM-01', location: 'Main Entrance', status: 'Active' },
      { id: 'CAM-02', location: 'Library', status: 'Active' },
      { id: 'CAM-03', location: 'Playground', status: 'Active' },
      { id: 'CAM-04', location: 'Corridor A', status: 'Offline' },
    ];

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-stone-950 dark:text-stone-50">Smart Security</h3>
            <p className="text-xs text-stone-500 dark:text-stone-500">Real-time surveillance and emergency protocols</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => sendAlert('Emergency', 'Emergency Alert from Security Console')}
              className="bg-red-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-red-700 transition-all shadow-lg shadow-red-100 dark:shadow-none"
            >
              <ShieldCheck className="w-4 h-4" /> Emergency Alert
            </button>
            <button 
              onClick={() => sendAlert('Fire', 'Fire Alert from Security Console')}
              className="bg-orange-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-orange-700 transition-all shadow-lg shadow-orange-100 dark:shadow-none"
            >
              <Sparkles className="w-4 h-4" /> Fire Alert
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cameras.map(cam => (
            <div key={cam.id} className="bg-stone-900 rounded-3xl overflow-hidden aspect-video relative group border-2 border-stone-800">
              <div className="absolute inset-0 flex items-center justify-center">
                {cam.status === 'Active' ? (
                  <div className="w-full h-full bg-stone-800 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mx-auto mb-2" />
                      <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">Live Feed: {cam.location}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <Plus className="w-8 h-8 text-stone-700 rotate-45 mx-auto mb-2" />
                    <p className="text-[10px] text-stone-700 font-bold uppercase tracking-widest">Feed Offline</p>
                  </div>
                )}
              </div>
              <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm px-2 py-1 rounded text-[8px] font-bold text-white uppercase tracking-widest">
                {cam.id}
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-[10px] font-bold text-white">{cam.location}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800">
          <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100 mb-6">Recent Security Logs</h3>
          <div className="space-y-4">
            {[
              { time: '10:45 AM', event: 'Visitor Entry', details: 'Guest ID #V-902 checked in at Main Gate.', status: 'Normal' },
              { time: '09:15 AM', event: 'Staff Arrival', details: 'All staff members verified via Biometric.', status: 'Normal' },
              { time: '08:00 AM', event: 'System Check', details: 'All security protocols active and verified.', status: 'Normal' },
            ].map((log, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-stone-50 dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-stone-500 dark:text-stone-500">{log.time}</span>
                  <div>
                    <p className="text-sm font-bold text-stone-800 dark:text-stone-100">{log.event}</p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">{log.details}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">{log.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const FeesManagement = () => {
    const [activeTab, setActiveTab] = useState<'records' | 'students'>('records');

    const printReceipt = (record: any) => {
      setViewingReceipt(record);
    };

    const collectFee = async () => {
      const studentId = prompt('Enter Student ID:');
      const amount = prompt('Enter Amount:');
      if (studentId && amount && !isNaN(Number(amount))) {
        const student = students.find(s => s.student_id === studentId);
        if (!student) {
          setNotification({ message: 'Student not found!', type: 'error' });
          return;
        }

        const studentRef = doc(db, 'students', studentId);
        const newPaid = student.fees.paid + Number(amount);
        const newStatus = newPaid >= student.fees.total ? 'Paid' : 'Pending';
        
        const newPayment: FeePayment = {
          id: `REC-${Math.random().toString(36).substr(2, 9)}`,
          amount: Number(amount),
          date: new Date().toISOString().split('T')[0],
          method: 'Cash/Manual',
          receiptNo: `R-${Math.floor(Math.random() * 100000)}`
        };

        await updateDoc(studentRef, {
          'fees.paid': newPaid,
          'fees.status': newStatus,
          'fees.history': [newPayment, ...student.fees.history]
        });
        
        setNotification({ message: 'Fee collected successfully!', type: 'success' });
      }
    };

    const totalExpected = students.reduce((acc, s) => acc + s.fees.total, 0);
    const totalCollected = students.reduce((acc, s) => acc + s.fees.paid, 0);
    const pendingDues = totalExpected - totalCollected;

    // Flatten student fee history for the table
    const feeRecords = students.flatMap(s => 
      s.fees.history.map(h => ({
        id: h.id,
        student: s.name,
        class: `${s.class}-${s.section}`,
        amount: h.amount,
        status: 'Paid' as const,
        date: h.date,
        receiptNo: h.receiptNo
      }))
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-stone-950 dark:text-stone-50">Fee Management</h3>
            <p className="text-xs text-stone-500 dark:text-stone-500">Track payments and generate receipts</p>
          </div>
          <div className="flex gap-2">
            {activeTab === 'students' && selectedFeeIds.length > 0 && (
              <button 
                onClick={() => {
                  // Bulk update logic
                  selectedFeeIds.forEach(async (id) => {
                    const student = students.find(s => s.student_id === id);
                    if (student) {
                      const studentRef = doc(db, 'students', student.student_id);
                      await updateDoc(studentRef, {
                        'fees.paid': student.fees.total,
                        'fees.status': 'Paid'
                      });
                    }
                  });
                  setSelectedFeeIds([]);
                  setNotification({ message: 'Selected students marked as Paid!', type: 'success' });
                }}
                className="bg-emerald-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 dark:shadow-none"
              >
                <Check className="w-4 h-4" /> Mark Selected as Paid
              </button>
            )}
            <button 
              onClick={collectFee}
              className="bg-purple-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-purple-700 transition-all shadow-lg shadow-purple-100 dark:shadow-none"
            >
              <Plus className="w-4 h-4" /> Collect Fee
            </button>
          </div>
        </div>

        <div className="flex gap-4 border-b border-stone-200 dark:border-stone-800">
          <button 
            onClick={() => setActiveTab('records')}
            className={`pb-2 px-1 text-sm font-bold ${activeTab === 'records' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-stone-500'}`}
          >
            Fee Records
          </button>
          <button 
            onClick={() => setActiveTab('students')}
            className={`pb-2 px-1 text-sm font-bold ${activeTab === 'students' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-stone-500'}`}
          >
            Student Fee Status
          </button>
        </div>

        {activeTab === 'records' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800">
                <p className="text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest mb-2">Total Expected</p>
                <p className="text-3xl font-bold text-stone-800 dark:text-stone-100">${totalExpected.toLocaleString()}</p>
              </div>
              <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800">
                <p className="text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest mb-2">Total Collected</p>
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">${totalCollected.toLocaleString()}</p>
              </div>
              <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800">
                <p className="text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest mb-2">Pending Dues</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">${pendingDues.toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-xl border border-stone-100 dark:border-stone-800 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-100 dark:border-stone-700">
                    <th className="p-4 text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Student</th>
                    <th className="p-4 text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Class</th>
                    <th className="p-4 text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Amount</th>
                    <th className="p-4 text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Status</th>
                    <th className="p-4 text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Date</th>
                    <th className="p-4 text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {feeRecords.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-stone-500 dark:text-stone-500 italic">No fee records found.</td>
                    </tr>
                  ) : (
                    feeRecords.map(record => (
                      <tr key={record.id} className="border-b border-stone-50 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
                        <td className="p-4 font-bold text-stone-800 dark:text-stone-100">{record.student}</td>
                        <td className="p-4 text-stone-600 dark:text-stone-400">{record.class}</td>
                        <td className="p-4 font-bold text-stone-800 dark:text-stone-100">${record.amount}</td>
                        <td className="p-4">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                            record.status === 'Paid' ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                          }`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="p-4 text-stone-500 dark:text-stone-400">{record.date}</td>
                        <td className="p-4">
                          <button 
                            onClick={() => printReceipt(record)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-bold text-xs"
                          >
                            Print Receipt
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-xl border border-stone-100 dark:border-stone-800 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-100 dark:border-stone-700">
                  <th className="p-4">
                    <input 
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFeeIds(students.map(s => s.student_id));
                        } else {
                          setSelectedFeeIds([]);
                        }
                      }}
                      checked={selectedFeeIds.length === students.length && students.length > 0}
                    />
                  </th>
                  <th className="p-4 text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Student</th>
                  <th className="p-4 text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Class</th>
                  <th className="p-4 text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Total Fee</th>
                  <th className="p-4 text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Paid</th>
                  <th className="p-4 text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map(student => (
                  <tr key={student.student_id} className="border-b border-stone-50 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
                    <td className="p-4">
                      <input 
                        type="checkbox"
                        checked={selectedFeeIds.includes(student.student_id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFeeIds([...selectedFeeIds, student.student_id]);
                          } else {
                            setSelectedFeeIds(selectedFeeIds.filter(id => id !== student.student_id));
                          }
                        }}
                      />
                    </td>
                    <td className="p-4 font-bold text-stone-800 dark:text-stone-100">{student.name}</td>
                    <td className="p-4 text-stone-600 dark:text-stone-400">{student.class}-{student.section}</td>
                    <td className="p-4 font-bold text-stone-800 dark:text-stone-100">${student.fees.total}</td>
                    <td className="p-4 font-bold text-stone-800 dark:text-stone-100">${student.fees.paid}</td>
                    <td className="p-4">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                        student.fees.status === 'Paid' ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                      }`}>
                        {student.fees.status}
                      </span>
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

  const ContactManagement = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-stone-950 dark:text-stone-50">Contact & Support</h3>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 dark:shadow-none">
            <Plus className="w-4 h-4" /> New Inquiry
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-stone-900 p-8 rounded-3xl shadow-xl border border-stone-100 dark:border-stone-800 space-y-6">
            <h4 className="text-lg font-bold text-stone-800 dark:text-stone-100">School Contact Information</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-stone-50 dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                  <School className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-stone-500 dark:text-stone-500 font-bold uppercase tracking-widest">Address</p>
                  <p className="text-sm font-bold text-stone-800 dark:text-stone-100">123 Education Excellence Way, Springfield, IL</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-stone-50 dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-stone-500 dark:text-stone-500 font-bold uppercase tracking-widest">Phone</p>
                  <p className="text-sm font-bold text-stone-800 dark:text-stone-100">+1 (555) 123-4567</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-stone-50 dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-stone-500 dark:text-stone-500 font-bold uppercase tracking-widest">Email</p>
                  <p className="text-sm font-bold text-stone-800 dark:text-stone-100">support@edusmart.tech</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-stone-900 p-8 rounded-3xl shadow-xl border border-stone-100 dark:border-stone-800">
            <h4 className="text-lg font-bold text-stone-800 dark:text-stone-100 mb-6">Recent Support Tickets</h4>
            <div className="space-y-4">
              {[
                { id: 'T-101', subject: 'Login Issue', user: 'James Smith', status: 'Resolved' },
                { id: 'T-102', subject: 'Fee Payment Error', user: 'Maria Garcia', status: 'Pending' },
                { id: 'T-103', subject: 'Transport Route Query', user: 'Rahul Patel', status: 'In Progress' },
              ].map(ticket => (
                <div key={ticket.id} className="flex items-center justify-between p-4 border-b border-stone-50 dark:border-stone-800 last:border-0 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors rounded-xl">
                  <div>
                    <p className="text-sm font-bold text-stone-800 dark:text-stone-100">{ticket.subject}</p>
                    <p className="text-xs text-stone-500 dark:text-stone-500">By {ticket.user} • {ticket.id}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                    ticket.status === 'Resolved' ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' :
                    ticket.status === 'Pending' ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  }`}>
                    {ticket.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ManagementManagement = () => {
    const managementMembers = allUsers.filter(u => u.role === 'Management');

    const handleAddMember = () => {
      const name = prompt('Enter member name:');
      const email = prompt('Enter email:');
      if (name && email) {
        const newUser: User = {
          user_id: `U-${Math.random().toString(36).substr(2, 9)}`,
          name,
          email,
          role: 'Management',
          role_type: 'academic',
          phone: '',
          linked_id: `MGT-${Math.random().toString(36).substr(2, 9)}`
        };
        setAllUsers(prev => [...prev, newUser]);
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-stone-950 dark:text-stone-50">Management Members</h3>
          <button 
            onClick={handleAddMember}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 dark:shadow-none"
          >
            <Plus className="w-4 h-4" /> Add Member
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {managementMembers.map((member, i) => (
            <motion.div 
              key={member.email}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800 flex items-center gap-4 group"
            >
              <div className="w-12 h-12 bg-stone-100 dark:bg-stone-800 rounded-2xl flex items-center justify-center text-stone-500 dark:text-stone-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                <UserCog className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-stone-800 dark:text-stone-100">{member.name}</h4>
                <p className="text-xs text-stone-500 dark:text-stone-500">{member.email}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  const SettingsManagement = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-stone-950 dark:text-stone-50">System Settings</h3>
          <button className="bg-stone-800 dark:bg-stone-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-stone-900 dark:hover:bg-stone-600 transition-all shadow-lg shadow-stone-100 dark:shadow-none">
            <Plus className="w-4 h-4" /> Save Changes
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-stone-900 p-8 rounded-3xl shadow-xl border border-stone-100 dark:border-stone-800 space-y-6">
            <h4 className="text-lg font-bold text-stone-800 dark:text-stone-100">General Branding</h4>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest block mb-2">School Name</label>
                <input type="text" defaultValue="EduSmart Tech" className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-stone-800 dark:text-stone-100" />
              </div>
              <div>
                <label className="text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest block mb-2">Tagline</label>
                <input type="text" defaultValue="Enterprise Edition 2.0" className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-stone-800 dark:text-stone-100" />
              </div>
              <div>
                <label className="text-xs font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest block mb-2">Primary Color</label>
                <div className="flex gap-2">
                  {['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'].map(color => (
                    <button key={color} className="w-8 h-8 rounded-full border-2 border-white dark:border-stone-800 shadow-sm" style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>
            </div>

            {loggedInUser?.role === 'Super Admin' && (
              <div className="pt-6 border-t border-stone-100 dark:border-stone-800 space-y-4">
                <h4 className="text-lg font-bold text-stone-800 dark:text-stone-100">System Operations</h4>
                <p className="text-sm text-stone-500 dark:text-stone-400">Initialize default credentials and system data in the Firebase database.</p>
                <button 
                  onClick={bootstrapDatabase}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100 dark:shadow-none"
                >
                  <ShieldCheck className="w-5 h-5" /> Bootstrap System Data
                </button>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-stone-900 p-8 rounded-3xl shadow-xl border border-stone-100 dark:border-stone-800 space-y-6">
            <h4 className="text-lg font-bold text-stone-800 dark:text-stone-100">System Information</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-stone-50 dark:border-stone-800">
                <span className="text-stone-500 dark:text-stone-400">Version</span>
                <span className="font-bold text-stone-800 dark:text-stone-100">2.0.4-stable</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-stone-50 dark:border-stone-800">
                <span className="text-stone-500 dark:text-stone-400">Database Status</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">Connected</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-stone-50 dark:border-stone-800">
                <span className="text-stone-500 dark:text-stone-400">Last Backup</span>
                <span className="text-stone-800 dark:text-stone-100 font-bold">Today, 04:00 AM</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-stone-500 dark:text-stone-400">Server Region</span>
                <span className="text-stone-800 dark:text-stone-100 font-bold">Asia-Southeast1</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const getAssociatedStudent = () => {
    if (!loggedInUser) return null;
    if (loggedInUser.role === 'Student') {
      return students.find(s => s.email === loggedInUser.email);
    }
    if (loggedInUser.role === 'Parent') {
      return students.find(s => s.guardian.email === loggedInUser.email);
    }
    return null;
  };

  const MyAttendance = ({ student }: { student: Student }) => {
    const studentAttendance = attendanceRecords.filter(a => a.student_id === student.student_id);
    const presentCount = studentAttendance.filter(a => a.status === 'Present').length;
    const totalCount = studentAttendance.length;
    const percentage = totalCount > 0 ? (presentCount / totalCount) * 100 : 0;

    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800">
            <h3 className="text-sm font-bold text-stone-500 uppercase tracking-widest mb-4">Attendance Summary</h3>
            <div className="text-center space-y-2">
              <div className="text-4xl font-serif font-bold text-indigo-600 dark:text-indigo-400">{percentage.toFixed(1)}%</div>
              <p className="text-stone-500 dark:text-stone-400 text-sm">Overall Attendance</p>
            </div>
          </div>
          <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800">
            <h3 className="text-sm font-bold text-stone-500 uppercase tracking-widest mb-4">Present Days</h3>
            <div className="text-center space-y-2">
              <div className="text-4xl font-serif font-bold text-emerald-600 dark:text-emerald-400">{presentCount}</div>
              <p className="text-stone-500 dark:text-stone-400 text-sm">Out of {totalCount} working days</p>
            </div>
          </div>
          <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800">
            <h3 className="text-sm font-bold text-stone-500 uppercase tracking-widest mb-4">Absent Days</h3>
            <div className="text-center space-y-2">
              <div className="text-4xl font-serif font-bold text-red-600 dark:text-red-400">{totalCount - presentCount}</div>
              <p className="text-stone-500 dark:text-stone-400 text-sm">Total absences</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-xl border border-stone-100 dark:border-stone-800 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 dark:bg-stone-800/50">
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {studentAttendance.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((record) => (
                <tr key={record.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-medium text-stone-800 dark:text-stone-200">{new Date(record.date).toLocaleDateString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      record.status === 'Present' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' :
                      record.status === 'Absent' ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' :
                      'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-stone-500 dark:text-stone-400 text-sm">{record.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const MyFees = ({ student }: { student: Student }) => {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800">
            <h3 className="text-sm font-bold text-stone-500 uppercase tracking-widest mb-4">Total Fees</h3>
            <div className="text-center space-y-2">
              <div className="text-4xl font-serif font-bold text-stone-800 dark:text-stone-100">${student.fees.total}</div>
              <p className="text-stone-500 dark:text-stone-400 text-sm">Academic Year 2023-24</p>
            </div>
          </div>
          <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800">
            <h3 className="text-sm font-bold text-stone-500 uppercase tracking-widest mb-4">Paid Amount</h3>
            <div className="text-center space-y-2">
              <div className="text-4xl font-serif font-bold text-emerald-600 dark:text-emerald-400">${student.fees.paid}</div>
              <p className="text-stone-500 dark:text-stone-400 text-sm">Successfully processed</p>
            </div>
          </div>
          <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800">
            <h3 className="text-sm font-bold text-stone-500 uppercase tracking-widest mb-4">Balance Due</h3>
            <div className="text-center space-y-2">
              <div className="text-4xl font-serif font-bold text-red-600 dark:text-red-400">${student.fees.total - student.fees.paid}</div>
              <p className={`text-xs font-bold px-2 py-1 rounded-full inline-block ${
                student.fees.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
              }`}>
                {student.fees.status}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-xl border border-stone-100 dark:border-stone-800 overflow-hidden">
          <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center">
            <h3 className="font-bold text-stone-800 dark:text-stone-100">Payment History</h3>
            {student.fees.status !== 'Paid' && (
              <button 
                onClick={() => setShowFeeModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none"
              >
                Pay Balance
              </button>
            )}
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 dark:bg-stone-800/50">
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest">Receipt No</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest">Method</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {student.fees.history.map((payment) => (
                <tr key={payment.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-stone-500 dark:text-stone-400">{payment.receiptNo}</td>
                  <td className="px-6 py-4 text-stone-800 dark:text-stone-200">{payment.date}</td>
                  <td className="px-6 py-4 font-bold text-stone-800 dark:text-stone-100">${payment.amount}</td>
                  <td className="px-6 py-4 text-stone-500 dark:text-stone-400">{payment.method}</td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => setViewingReceipt(payment)}
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 transition-colors"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const MyTransport = ({ student }: { student: Student }) => {
    const route = busRoutes.find(r => r.id === student.assignedBusId);
    
    if (!route) {
      return (
        <div className="bg-white dark:bg-stone-900 p-12 rounded-3xl shadow-xl border border-stone-100 dark:border-stone-800 text-center">
          <School className="w-16 h-16 text-stone-200 dark:text-stone-700 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-2">No Transport Assigned</h3>
          <p className="text-stone-500 dark:text-stone-400">Please contact the school office for transport allocation.</p>
        </div>
      );
    }

    const stops = route.stops || [];
    const minLat = Math.min(...stops.map(s => s.lat));
    const maxLat = Math.max(...stops.map(s => s.lat));
    const minLng = Math.min(...stops.map(s => s.lng));
    const maxLng = Math.max(...stops.map(s => s.lng));

    const padding = 15;
    const getX = (lng: number) => padding + ((lng - minLng) / (maxLng - minLng || 1)) * (100 - 2 * padding);
    const getY = (lat: number) => 100 - (padding + ((lat - minLat) / (maxLat - minLat || 1)) * (100 - 2 * padding));

    const pathData = stops.map((s, i) => `${i === 0 ? 'M' : 'L'} ${getX(s.lng)} ${getY(s.lat)}`).join(' ');

    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800">
            <h3 className="text-sm font-bold text-stone-500 uppercase tracking-widest mb-4">Bus Details</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-stone-50 dark:border-stone-800">
                <span className="text-stone-500 dark:text-stone-400">Bus Number</span>
                <span className="font-bold text-stone-800 dark:text-stone-100">{route.bus}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-stone-50 dark:border-stone-800">
                <span className="text-stone-500 dark:text-stone-400">Driver</span>
                <span className="font-bold text-stone-800 dark:text-stone-100">{route.driver}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-stone-500 dark:text-stone-400">Status</span>
                <span className={`font-bold ${route.status === 'On Route' ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}`}>
                  {route.status}
                </span>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800">
            <h3 className="text-sm font-bold text-stone-500 uppercase tracking-widest mb-4">Route Stops</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {stops.map((stop, i) => (
                <div key={i} className="flex items-center gap-4 p-3 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-100 dark:border-stone-800">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-blue-600 text-white' : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300'}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-stone-800 dark:text-stone-200">{stop.name}</p>
                    <p className="text-xs text-stone-500 dark:text-stone-500">{stop.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800 h-[500px] relative overflow-hidden">
          <div className="absolute top-6 left-6 z-10">
            <h3 className="text-sm font-bold text-stone-500 uppercase tracking-widest bg-white/80 dark:bg-stone-900/80 backdrop-blur px-3 py-1 rounded-full border border-stone-100 dark:border-stone-800">
              Live Route Map - {route.name}
            </h3>
          </div>
          
          <div className="absolute inset-0 bg-stone-50 dark:bg-stone-950">
            {/* Grid background for map feel */}
            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" 
                 style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            
            <svg className="w-full h-full p-12" viewBox="0 0 100 100">
              {/* Route Path */}
              <motion.path
                d={pathData}
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-stone-200 dark:text-stone-800"
                strokeDasharray="2 2"
              />
              <motion.path
                d={pathData}
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                className="text-blue-500/30 dark:text-blue-400/20"
              />
              
              {/* Stops */}
              {stops.map((stop, i) => (
                <g key={i}>
                  <circle
                    cx={getX(stop.lng)}
                    cy={getY(stop.lat)}
                    r="1.5"
                    className={i === 0 ? 'fill-blue-600' : 'fill-stone-400 dark:fill-stone-600'}
                  />
                  {/* Stop Marker Label */}
                  <g transform={`translate(${getX(stop.lng)}, ${getY(stop.lat)})`}>
                    <rect
                      x="-10"
                      y="-12"
                      width="20"
                      height="8"
                      rx="1"
                      className="fill-white/90 dark:fill-stone-900/90 stroke-stone-200 dark:stroke-stone-700"
                      strokeWidth="0.2"
                    />
                    <text
                      y="-9"
                      textAnchor="middle"
                      className="text-[1.8px] font-bold fill-stone-800 dark:fill-stone-100"
                    >
                      {stop.name}
                    </text>
                    <text
                      y="-6"
                      textAnchor="middle"
                      className="text-[1.5px] fill-stone-500 dark:fill-stone-400 font-mono"
                    >
                      {stop.time}
                    </text>
                  </g>
                </g>
              ))}

              {/* Moving Bus Icon */}
              {route.status === 'On Route' && (
                <motion.g
                  initial={{ offsetDistance: "0%" }}
                  animate={{ offsetDistance: "100%" }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  style={{ offsetPath: `path('${pathData}')`, offsetRotate: "auto" }}
                >
                  <circle r="3" className="fill-blue-600 shadow-lg" />
                  <foreignObject x="-4" y="-4" width="8" height="8">
                    <div className="w-full h-full flex items-center justify-center bg-blue-600 rounded-full text-white shadow-xl border-2 border-white dark:border-stone-900">
                      <Truck className="w-4 h-4" />
                    </div>
                  </foreignObject>
                </motion.g>
              )}
            </svg>
          </div>

          <div className="absolute bottom-6 right-6 z-10 flex items-center gap-2 bg-white/80 dark:bg-stone-900/80 backdrop-blur px-4 py-2 rounded-2xl border border-stone-100 dark:border-stone-800">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-stone-800 dark:text-stone-100">Live Tracking Active</span>
          </div>
        </div>
      </div>
    );
  };

  const ChildProgress = ({ student }: { student: Student }) => {
    const results = examResults.filter(r => r.studentId === student.student_id);
    
    const calculateGPA = (results: ExamResult[]) => {
      if (results.length === 0) return "0.00";
      const gradePoints: { [key: string]: number } = {
        'A+': 4.0, 'A': 4.0, 'A-': 3.7,
        'B+': 3.3, 'B': 3.0, 'B-': 2.7,
        'C+': 2.3, 'C': 2.0, 'C-': 1.7,
        'D+': 1.3, 'D': 1.0, 'F': 0.0
      };
      const totalPoints = results.reduce((acc, curr) => acc + (gradePoints[curr.grade] || 0), 0);
      return (totalPoints / results.length).toFixed(2);
    };

    const gpa = calculateGPA(results);

    const displayResults = results.length > 0 ? results.map(r => ({
      subject: r.subject,
      grade: r.grade,
      score: Math.round((r.marksObtained / r.maxMarks) * 100)
    })) : [
      { subject: 'Mathematics', grade: 'A+', score: 95 },
      { subject: 'Science', grade: 'A', score: 88 },
      { subject: 'English', grade: 'B+', score: 78 },
      { subject: 'History', grade: 'A-', score: 82 },
    ];

    return (
      <div className="space-y-8">
        <div className="bg-white dark:bg-stone-900 p-8 rounded-3xl shadow-xl border border-stone-100 dark:border-stone-800 flex flex-col md:flex-row items-center gap-8">
          <div className="w-32 h-32 bg-stone-100 dark:bg-stone-800 rounded-2xl flex items-center justify-center overflow-hidden border-4 border-white dark:border-stone-700 shadow-xl">
            {student.photo ? (
              <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-16 h-16 text-stone-400" />
            )}
          </div>
          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-3xl font-serif font-bold text-stone-800 dark:text-stone-100">{student.name}</h2>
              <button
                onClick={() => setViewingReportCard(student)}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none active:scale-95"
              >
                <FileText className="w-4 h-4" /> Generate Report Card
              </button>
            </div>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm">
              <span className="px-3 py-1 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-full font-bold">Class {student.class}-{student.section}</span>
              <span className="px-3 py-1 bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 rounded-full font-bold">ID: {student.student_id}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold text-stone-500 uppercase tracking-widest">Academic Performance</h3>
              <div className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold">
                GPA: {gpa}
              </div>
            </div>
            <div className="space-y-6">
              {displayResults.map((item) => (
                <div key={item.subject} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-stone-800 dark:text-stone-200">{item.subject}</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">{item.grade}</span>
                  </div>
                  <div className="w-full h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${item.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800">
            <h3 className="text-sm font-bold text-stone-500 uppercase tracking-widest mb-6">Recent Achievements</h3>
            <div className="space-y-4">
              {[
                { title: 'Math Olympiad - 1st Place', date: 'Oct 2023', icon: Award, color: 'text-amber-500' },
                { title: 'Perfect Attendance - Q1', date: 'Sep 2023', icon: CheckCircle2, color: 'text-emerald-500' },
                { title: 'Best Project - Science Fair', date: 'Aug 2023', icon: Sparkles, color: 'text-blue-500' },
              ].map((achievement, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50">
                  <achievement.icon className={`w-8 h-8 ${achievement.color}`} />
                  <div>
                    <p className="font-bold text-stone-800 dark:text-stone-200">{achievement.title}</p>
                    <p className="text-xs text-stone-500">{achievement.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDashboard = () => {
    if (!loggedInUser) return null;

    switch (loggedInUser.role) {
      case 'Super Admin':
      case 'Management':
        switch (activeAdminTab) {
          case 'overview': return <AdminOverview />;
          case 'teachers': return <TeacherManagement />;
          case 'students': return <StudentManagement />;
          case 'attendance': return <AttendanceManagement />;
          case 'timetable': return <TimetableManagement userRole={loggedInUser?.role || 'Management'} />;
          case 'library': return <LmsManagement loggedInUser={loggedInUser} />;
          case 'canteen': return <CanteenManagement loggedInUser={loggedInUser} />;
          case 'subjects': return <SubjectManagement />;
          case 'transport': return <TransportManagement />;
          case 'security': return <SecurityManagement />;
          case 'fees': return <FeesManagement />;
          case 'leaves': return <LeaveManagement />;
          case 'alerts': return <AlertCenter />;
          case 'contact': return <ContactManagement />;
          case 'management': return <ManagementManagement />;
          case 'front-office': return <FrontOfficeManagement />;
          case 'student-info': return <StudentInformationManagement students={students} />;
          case 'fees-collection': return <FeesCollectionManagement students={students} />;
          case 'income': return <IncomeManagement />;
          case 'expenses': return <ExpenseManagement />;
          case 'student-attendance': return <StudentAttendanceManagement students={students} />;
          case 'reports': return <LmsCmsReports loggedInUser={loggedInUser} />;
          case 'character-3d': return <Character3DStudio />;
          case 'settings': return <SettingsManagement />;
          default: return <AdminOverview />;
        }
      case 'Teacher':
        switch (activeAdminTab) {
          case 'overview': return <TeacherDashboard />;
          case 'attendance': return <AttendanceManagement />;
          case 'timetable': return <TimetableManagement userRole={loggedInUser?.role || 'Teacher'} />;
          case 'students': return <StudentManagement />;
          case 'leaves': return <LeaveManagement />;
          case 'alerts': return <AlertCenter />;
          case 'character-3d': return <Character3DStudio />;
          default: return <TeacherDashboard />;
        }
      case 'Parent': {
        const student = getAssociatedStudent();
        if (!student) return <div className="p-8 text-center text-stone-500">No linked student found.</div>;
        
        switch (activeAdminTab) {
          case 'overview': return <ParentDashboard />;
          case 'students': return <ChildProgress student={student} />;
          case 'attendance': return <MyAttendance student={student} />;
          case 'timetable': return <TimetableManagement userRole={loggedInUser?.role || 'Parent'} studentClass={student.class} />;
          case 'fees': return <MyFees student={student} />;
          case 'transport': return <MyTransport student={student} />;
          case 'contact': return <ContactManagement />;
          default: return <ParentDashboard />;
        }
      }
      case 'Student': {
        const student = getAssociatedStudent();
        if (!student) return <div className="p-8 text-center text-stone-500">Student record not found.</div>;

        switch (activeAdminTab) {
          case 'overview': return <StudentDashboard />;
          case 'grades': return <ChildProgress student={student} />;
          case 'attendance': return <MyAttendance student={student} />;
          case 'timetable': return <TimetableManagement userRole={loggedInUser?.role || 'Student'} studentClass={student.class} />;
          case 'fees': return <MyFees student={student} />;
          case 'transport': return <MyTransport student={student} />;
          case 'subjects': return <SubjectManagement />;
          case 'library': return <LmsManagement loggedInUser={loggedInUser} />;
          case 'canteen': return <CanteenManagement loggedInUser={loggedInUser} />;
          case 'character-3d': return <Character3DStudio />;
          default: return <StudentDashboard />;
        }
      }
      case 'Librarian':
        switch (activeAdminTab) {
          case 'library-dashboard':
          case 'library-books':
          case 'library-issue':
          case 'library-return':
          case 'library-overdue':
          case 'library-fines':
          case 'library':
            return <LmsManagement loggedInUser={loggedInUser} activeTab={activeAdminTab} setActiveTab={setActiveAdminTab} />;
          case 'reports':
            return <LmsCmsReports loggedInUser={loggedInUser} />;
          default:
            return <LmsManagement loggedInUser={loggedInUser} activeTab="library-dashboard" setActiveTab={setActiveAdminTab} />;
        }
      case 'Canteen Manager':
        switch (activeAdminTab) {
          case 'canteen-dashboard':
          case 'canteen-menu':
          case 'canteen-inventory':
          case 'canteen-incoming':
          case 'canteen-history':
          case 'canteen':
            return <CanteenManagement loggedInUser={loggedInUser} activeTab={activeAdminTab} setActiveTab={setActiveAdminTab} />;
          case 'reports':
            return <LmsCmsReports loggedInUser={loggedInUser} />;
          default:
            return <CanteenManagement loggedInUser={loggedInUser} activeTab="canteen-dashboard" setActiveTab={setActiveAdminTab} />;
        }
      case 'Accounts':
        switch (activeAdminTab) {
          case 'overview': return <AccountsDashboard />;
          case 'fees': return <FeesManagement />;
          case 'reports': return <FinancialReports />;
          default: return <AccountsDashboard />;
        }
      case 'Security':
        switch (activeAdminTab) {
          case 'overview': return <SecurityDashboard />;
          case 'logs': return <SecurityLogs />;
          case 'alerts': return <AlertCenter />;
          default: return <SecurityDashboard />;
        }
      case 'Store':
        switch (activeAdminTab) {
          case 'overview': return <StoreDashboard />;
          case 'stock': return <StockManagement />;
          case 'orders': return <PurchaseOrders />;
          default: return <StoreDashboard />;
        }
      case 'Reception':
        switch (activeAdminTab) {
          case 'overview': return <ReceptionDashboard />;
          case 'front-office': return <FrontOfficeManagement />;
          default: return <ReceptionDashboard />;
        }
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Profile Card */}
            <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800 space-y-4">
              <h3 className="text-sm font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Your Profile</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-stone-50 dark:border-stone-800">
                  <span className="text-stone-500 dark:text-stone-400">Email</span>
                  <span className="font-medium text-stone-800 dark:text-stone-100">{loggedInUser.email}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-stone-50 dark:border-stone-800">
                  <span className="text-stone-500 dark:text-stone-400">Role</span>
                  <span className="font-medium text-stone-800 dark:text-stone-100">{loggedInUser.role}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-stone-500 dark:text-stone-400">Status</span>
                  <span className="text-green-600 dark:text-emerald-400 font-bold flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 dark:bg-emerald-500 rounded-full animate-pulse" /> Active
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="md:col-span-2 bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800 space-y-4">
              <h3 className="text-sm font-bold text-stone-500 dark:text-stone-500 uppercase tracking-widest">Quick Actions</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Attendance', icon: UserIcon, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                  { label: 'Grades', icon: GraduationCap, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
                  { label: 'Schedule', icon: BookIcon, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
                  { label: 'Messages', icon: Users, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
                ].map((action) => (
                  <button key={action.label} className="flex flex-col items-center gap-3 p-4 rounded-2xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors group">
                    <div className={`w-12 h-12 ${action.bg} ${action.color} rounded-xl flex items-center justify-center transition-transform group-hover:scale-110`}>
                      <action.icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-stone-600 dark:text-stone-400">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
    }
  };

  const StudentGrades = () => {
    const [prediction, setPrediction] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const student = students.find(s => s.email === loggedInUser?.email);
    const studentGrades = examResults.filter(r => r.student_id === student?.student_id);
    const studentAttendance = attendanceRecords.filter(r => r.student_id === student?.student_id);

    const handlePredict = async () => {
      setLoading(true);
      try {
        const result = await predictPerformanceTrends(student?.name || 'Student', studentGrades, studentAttendance);
        setPrediction(result || 'No prediction available.');
      } catch (error) {
        console.error(error);
        setPrediction('Failed to generate prediction.');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="bg-white dark:bg-stone-900 p-8 rounded-3xl shadow-xl border border-stone-100 dark:border-stone-800">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-stone-800 dark:text-stone-100">Academic Performance</h3>
          <button 
            onClick={handlePredict}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-blue-700 transition-all"
          >
            {loading ? 'Predicting...' : 'Predict Trends'}
          </button>
        </div>
        
        {prediction && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-sm text-blue-800 dark:text-blue-200">
            {prediction}
          </div>
        )}

        <div className="space-y-4">
          {studentGrades.map(item => (
            <div key={item.id} className="flex items-center justify-between p-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl">
              <div>
                <p className="font-bold text-stone-800 dark:text-stone-200">{item.subject}</p>
                <p className="text-xs text-stone-500 dark:text-stone-500">{item.examName}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{item.grade}</p>
                <p className="text-[10px] text-stone-500 dark:text-stone-500 font-bold">{item.marksObtained}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const StudentAttendance = () => (
    <div className="bg-white dark:bg-stone-900 p-8 rounded-3xl shadow-xl border border-stone-100 dark:border-stone-800">
      <h3 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-6">Attendance History</h3>
      <div className="space-y-4">
        {attendanceRecords.filter(r => r.student_id === students.find(s => s.email === loggedInUser?.email)?.student_id).map(record => (
          <div key={record.id} className="flex items-center justify-between p-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl">
            <div>
              <p className="font-bold text-stone-800 dark:text-stone-200">{record.date}</p>
              <p className="text-xs text-stone-500 dark:text-stone-500">{new Date(record.timestamp).toLocaleTimeString()}</p>
            </div>
            <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-full text-[10px] font-bold uppercase">
              {record.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const StudentFees = () => (
    <div className="bg-white dark:bg-stone-900 p-8 rounded-3xl shadow-xl border border-stone-100 dark:border-stone-800">
      <h3 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-6">Fee Details</h3>
      <div className="space-y-6">
        <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-3xl border border-blue-100 dark:border-blue-800">
          <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-widest mb-1">Current Balance</p>
          <h4 className="text-3xl font-bold text-stone-800 dark:text-stone-100">$0.00</h4>
          <p className="text-xs text-stone-500 dark:text-stone-500 mt-2">All dues are cleared for current term.</p>
        </div>
        <div className="space-y-3">
          <p className="text-sm font-bold text-stone-800 dark:text-stone-200">Payment History</p>
          {[
            { date: '2026-02-15', amount: '$1,200', method: 'Credit Card', status: 'Success' },
            { date: '2026-01-10', amount: '$1,200', method: 'Bank Transfer', status: 'Success' },
          ].map((p, i) => (
            <div key={i} className="flex items-center justify-between p-4 border border-stone-100 dark:border-stone-800 rounded-2xl">
              <div>
                <p className="text-sm font-bold text-stone-800 dark:text-stone-200">{p.amount}</p>
                <p className="text-[10px] text-stone-500 dark:text-stone-500">{p.date} • {p.method}</p>
              </div>
              <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase">{p.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const FinancialReports = () => (
    <div className="bg-white dark:bg-stone-900 p-8 rounded-3xl shadow-xl border border-stone-100 dark:border-stone-800">
      <h3 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-6">Financial Reports</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {['Monthly Revenue', 'Expense Summary', 'Fee Collection Report', 'Salary Disbursement'].map(report => (
          <button key={report} className="p-6 text-left bg-stone-50 dark:bg-stone-800/50 rounded-3xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group">
            <div className="w-12 h-12 bg-white dark:bg-stone-900 rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:text-blue-600 dark:group-hover:text-blue-400">
              <FileText className="w-6 h-6" />
            </div>
            <p className="font-bold text-stone-800 dark:text-stone-200">{report}</p>
            <p className="text-xs text-stone-500 dark:text-stone-500 mt-1">Generate and download PDF</p>
          </button>
        ))}
      </div>
    </div>
  );

  const SecurityLogs = () => (
    <div className="bg-white dark:bg-stone-900 p-8 rounded-3xl shadow-xl border border-stone-100 dark:border-stone-800">
      <h3 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-6">Entry/Exit Logs</h3>
      <div className="space-y-4">
        {[
          { time: '08:15 AM', person: 'John Doe (Student)', action: 'Entry', gate: 'Main Gate' },
          { time: '08:10 AM', person: 'Sarah Smith (Teacher)', action: 'Entry', gate: 'Staff Gate' },
          { time: '07:55 AM', person: 'Mike Wilson (Security)', action: 'Entry', gate: 'Main Gate' },
        ].map((log, i) => (
          <div key={i} className="flex items-center justify-between p-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl">
            <div className="flex items-center gap-4">
              <div className={`w-2 h-2 rounded-full ${log.action === 'Entry' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <div>
                <p className="font-bold text-stone-800 dark:text-stone-200">{log.person}</p>
                <p className="text-xs text-stone-500 dark:text-stone-500">{log.gate}</p>
              </div>
            </div>
            <p className="text-sm font-mono font-bold text-stone-600 dark:text-stone-400">{log.time}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const StockManagement = () => (
    <div className="bg-white dark:bg-stone-900 p-8 rounded-3xl shadow-xl border border-stone-100 dark:border-stone-800">
      <h3 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-6">Stock Inventory</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { item: 'A4 Paper Bundles', stock: 45, status: 'In Stock' },
          { item: 'Whiteboard Markers', stock: 12, status: 'Low Stock' },
          { item: 'Cleaning Supplies', stock: 8, status: 'Critical' },
          { item: 'Printer Ink', stock: 24, status: 'In Stock' },
        ].map((item, i) => (
          <div key={i} className="p-4 border border-stone-100 dark:border-stone-800 rounded-2xl">
            <div className="flex justify-between items-start mb-2">
              <p className="font-bold text-stone-800 dark:text-stone-200">{item.item}</p>
              <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-lg ${
                item.status === 'In Stock' ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' :
                item.status === 'Low Stock' ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400' :
                'bg-rose-100 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400'
              }`}>{item.status}</span>
            </div>
            <p className="text-2xl font-bold text-stone-800 dark:text-stone-100">{item.stock}</p>
            <p className="text-xs text-stone-500 dark:text-stone-500">Units available</p>
          </div>
        ))}
      </div>
    </div>
  );

  const PurchaseOrders = () => (
    <div className="bg-white dark:bg-stone-900 p-8 rounded-3xl shadow-xl border border-stone-100 dark:border-stone-800">
      <h3 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-6">Purchase Orders</h3>
      <div className="space-y-4">
        {[
          { id: 'PO-9921', vendor: 'Office Depot', date: '2026-03-10', total: '$450.00', status: 'Delivered' },
          { id: 'PO-9922', vendor: 'Tech Solutions', date: '2026-03-15', total: '$1,200.00', status: 'Pending' },
        ].map((po, i) => (
          <div key={i} className="flex items-center justify-between p-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl">
            <div>
              <p className="font-bold text-stone-800 dark:text-stone-200">{po.vendor}</p>
              <p className="text-xs text-stone-500 dark:text-stone-500">{po.id} • {po.date}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-stone-800 dark:text-stone-200">{po.total}</p>
              <p className={`text-[10px] font-bold uppercase ${po.status === 'Delivered' ? 'text-emerald-600 dark:text-emerald-400' : 'text-yellow-600 dark:text-yellow-400'}`}>{po.status}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const VisitorLog = () => (
    <div className="bg-white dark:bg-stone-900 p-8 rounded-3xl shadow-xl border border-stone-100 dark:border-stone-800">
      <h3 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-6">Visitor Management</h3>
      <div className="space-y-4">
        {[
          { name: 'Robert Fox', purpose: 'Parent Meeting', time: '10:30 AM', status: 'Checked In' },
          { name: 'Jane Cooper', purpose: 'Vendor Visit', time: '11:15 AM', status: 'Expected' },
        ].map((v, i) => (
          <div key={i} className="flex items-center justify-between p-4 bg-stone-50 dark:bg-stone-800 rounded-2xl">
            <div>
              <p className="font-bold text-stone-800 dark:text-stone-100">{v.name}</p>
              <p className="text-xs text-stone-500">{v.purpose}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-stone-800 dark:text-stone-100">{v.time}</p>
              <p className="text-[10px] font-bold text-blue-600 uppercase">{v.status}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const AdmissionsManagement = () => (
    <div className="bg-white dark:bg-stone-900 p-8 rounded-3xl shadow-xl border border-stone-100 dark:border-stone-800">
      <h3 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-6">Admissions Overview</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'New Enquiries', count: 24, color: 'text-blue-600' },
          { label: 'Interviews', count: 8, color: 'text-purple-600' },
          { label: 'Confirmed', count: 12, color: 'text-emerald-600' },
        ].map(stat => (
          <div key={stat.label} className="p-4 bg-stone-50 dark:bg-stone-800 rounded-2xl">
            <p className="text-xs text-stone-500 font-bold uppercase mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.count}</p>
          </div>
        ))}
      </div>
      <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 dark:shadow-none">
        New Admission Form
      </button>
    </div>
  );

  const AdminOverview = () => {
    const data = [
      { name: 'Teachers', count: teachers.length },
      { name: 'Students', count: students.length },
    ];
    const COLORS = ['#3b82f6', '#22c55e'];

    const feeData = [
      { name: 'Collected', value: 124500 },
      { name: 'Pending', value: 45000 },
    ];
    const FEE_COLORS = ['#3b82f6', '#e2e8f0'];

    return (
      <div className="space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Students Present', value: '94.2%', trend: '+2.4%', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
            { label: 'Staff Present', value: '98.5%', trend: '+0.5%', icon: GraduationCap, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
            { label: 'Fee Collection', value: '$124,500', trend: '+12%', icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
            { label: 'Security Alerts', value: '0', trend: 'Normal', icon: ShieldCheck, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          ].map((kpi, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${kpi.bg} ${kpi.color} rounded-2xl flex items-center justify-center`}>
                  <kpi.icon className="w-6 h-6" />
                </div>
                <span className={`text-xs font-bold ${kpi.trend.includes('+') ? 'text-emerald-500' : 'text-stone-500'}`}>
                  {kpi.trend}
                </span>
              </div>
              <p className="text-2xl font-bold text-stone-800 dark:text-stone-100">{kpi.value}</p>
              <p className="text-xs text-stone-500 font-bold uppercase tracking-widest">{kpi.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Attendance Trends */}
          <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-500" /> Attendance Trends
              </h3>
              <span className="text-xs text-stone-500 font-bold">Today: Mar 14, 2026</span>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#292524" : "#f1f5f9"} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: darkMode ? '#a8a29e' : '#78716c' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: darkMode ? '#a8a29e' : '#78716c' }} />
                  <Tooltip 
                    cursor={{ fill: darkMode ? '#1c1917' : '#f8fafc' }} 
                    contentStyle={{ 
                      backgroundColor: darkMode ? '#1c1917' : '#ffffff',
                      borderRadius: '12px', 
                      border: darkMode ? '1px solid #292524' : 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      color: darkMode ? '#f5f5f4' : '#1c1917'
                    }} 
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Fee Collection Donut */}
          <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-purple-500" /> Fee Collection
              </h3>
              <span className="text-xs text-stone-500 font-bold">Month: March</span>
            </div>
            <div className="h-[300px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={feeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {feeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 1 && darkMode ? '#292524' : FEE_COLORS[index % FEE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: darkMode ? '#1c1917' : '#ffffff',
                      borderRadius: '12px', 
                      border: darkMode ? '1px solid #292524' : 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      color: darkMode ? '#f5f5f4' : '#1c1917'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-3xl font-bold text-stone-800 dark:text-stone-100">$124,500</p>
                <p className="text-xs text-stone-500 font-bold uppercase">Total Collected</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Accent theme for the auth pages — neutral blue until a role is picked,
  // then the selected role's signature colour drives the background + card.
  const authTheme = getRoleTheme(selectedRole ?? '');
  const authAccent = selectedRole ? authTheme.accent : '#3b82f6';
  const authAccentDeep = selectedRole ? authTheme.accentDeep : '#1d4ed8';
  const roleMeta = roles.find((r) => r.role === selectedRole);

  return (
    <ErrorBoundary>
      <div className="relative min-h-screen flex items-center justify-center p-4 perspective-1000 transition-colors duration-300 overflow-hidden">
      {!loggedInUser && (
        <AuthBackground accent={authAccent} darkMode={darkMode} className="fixed inset-0 z-0" />
      )}
      <AnimatePresence>
        {isInitialLoad && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] bg-white dark:bg-stone-950 flex flex-col items-center justify-center gap-6"
          >
            <LoadingSpinner size="lg" />
            <div className="text-center">
              <h2 className="text-2xl font-serif font-bold text-stone-800 dark:text-stone-100">EduSmart Tech</h2>
              <p className="text-stone-500 uppercase tracking-widest text-[10px] mt-2 animate-pulse">Initializing System...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1500] bg-stone-900/20 backdrop-blur-[2px] flex items-center justify-center"
          >
            <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-2xl border border-stone-100 dark:border-stone-800 flex flex-col items-center gap-4">
              <LoadingSpinner size="md" />
              <p className="text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-widest">Processing...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AddModal />
      {viewingReceipt && (
        <ReceiptModal 
          record={viewingReceipt} 
          onClose={() => setViewingReceipt(null)} 
        />
      )}
      {viewingStudent && (
        <ViewDetailsModal 
          student={viewingStudent} 
          onClose={() => setViewingStudent(null)} 
        />
      )}
      {viewingIDCard && (
        <SmartIDCardModal 
          person={viewingIDCard} 
          onClose={() => setViewingIDCard(null)} 
        />
      )}
      <AIAssistant />
      <AnimatePresence>
        {entryRole && !loggedInUser && (
          <RoleEntryAnimation
            role={entryRole}
            darkMode={darkMode}
            onComplete={() => setEntryRole(null)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        {!loggedInUser ? (
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
                              <input type="email" required value={email} disabled={isLoading || activeSplash === 'success'} onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                                className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 dark:text-stone-100 disabled:opacity-60 disabled:cursor-not-allowed" />
                              {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-stone-500 dark:text-stone-500 uppercase mb-1 ml-1">Password</label>
                              <input type="password" required value={password} disabled={isLoading || activeSplash === 'success'} onChange={(e) => { setPassword(e.target.value); setPasswordError(''); }}
                                className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 dark:text-stone-100 disabled:opacity-60 disabled:cursor-not-allowed" />
                              {passwordError && <p className="text-red-500 text-xs mt-1">{passwordError}</p>}
                            </div>
                            
                            <div className="flex items-center justify-between mt-2 mb-4">
                              <div className="flex items-center">
                                <input type="checkbox" id="mobile-remember" checked={rememberMe} disabled={isLoading || activeSplash === 'success'} onChange={(e) => setRememberMe(e.target.checked)} className="rounded" />
                                <label htmlFor="mobile-remember" className="ml-2 text-xs font-bold text-stone-500">Remember Me</label>
                              </div>
                              <button type="button" disabled={isLoading || activeSplash === 'success'} onClick={() => { setIsForgotPassword(true); setError(''); }} className="text-xs text-blue-600 font-bold disabled:opacity-50">Forgot?</button>
                            </div>

                            {error && <p className="text-red-500 text-xs font-medium bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">{error}</p>}
                            
                            <button type="submit" disabled={isLoading || activeSplash === 'success'} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                              {isLoading ? 'Signing In...' : 'Sign In'}
                            </button>
                            
                            <div className="text-center mt-6">
                              <button type="button" disabled={isLoading || activeSplash === 'success'} onClick={() => { setCurrentPage(3); setError(''); }} className="text-xs font-bold text-blue-600 disabled:opacity-50">Need an account? Register</button>
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
                    <div className={`absolute inset-0 z-50 bg-black flex flex-col items-center justify-center rounded-3xl overflow-hidden animate-in fade-in duration-300 ${
                      activeSplash === 'success' ? 'p-0' : 'p-6 bg-stone-900/90 backdrop-blur-md'
                    }`}>
                      <video
                        src={`/api/splashscreens/${activeSplash === 'success' ? 'stu_success' : 'stu_error'}`}
                        autoPlay
                        playsInline
                        muted
                        onEnded={() => {
                          if (activeSplash === 'success') {
                            completeStudentRedirect();
                          } else {
                            if (splashCallback) {
                              splashCallback();
                            }
                            setActiveSplash(null);
                            setSplashCallback(null);
                          }
                        }}
                        className="w-full h-full object-cover rounded-3xl bg-black"
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
              className="book-stage relative w-[1000px] h-[700px] preserve-3d book-shadow book-glow rounded-lg"
            >
            {/* Book Spine — embossed navy with crystal highlight */}
            <div className="absolute top-0 left-[calc(50%-15px)] w-[30px] h-full z-50 rounded-sm shadow-inner"
              style={{ background: 'linear-gradient(90deg, #001a33, #003366 50%, #001a33)' }} />

            {/* Static Back Cover — deep glass navy */}
            <div className="absolute top-0 left-0 w-1/2 h-full rounded-l-lg"
              style={{ background: 'linear-gradient(135deg, #002347, #003366)', borderRight: '4px solid #00264d', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12)' }} />
            <div className="absolute top-0 right-0 w-1/2 h-full rounded-r-lg"
              style={{ background: 'linear-gradient(225deg, #002347, #003366)', borderLeft: '4px solid #00264d', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12)' }} />

            {/* Static Left Page (Revealed when cover flips) */}
            <div className="absolute top-0 left-0 w-1/2 h-full page-gradient border-r border-stone-300 page-shadow-right rounded-l-lg z-0">
              <LeftSideContent />
            </div>

            {/* Page 0: Cover */}
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

            {/* Page 1: Role Selection (Index) */}
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

            {/* Standalone, accent-themed login container (shown after the
                role is picked — the credential fields no longer live in the
                book, only the index of role names does). */}
            {!isMobile && currentPage >= 2 && (
              <motion.div
                key="auth-card"
                initial={{ opacity: 0, y: 28, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 28, scale: 0.95 }}
                transition={{ duration: 0.55, ease: [0.16, 0.84, 0.32, 1] }}
                className={`relative rounded-3xl bg-white/85 dark:bg-stone-900/70 transition-all duration-500 overflow-hidden ${
                  activeSplash && selectedRole === 'Student'
                    ? (activeSplash === 'success'
                        ? 'w-[500px] h-[500px] min-h-[500px] p-0 flex flex-col items-center justify-center'
                        : 'w-[500px] h-[500px] min-h-[500px] p-9 flex flex-col items-center justify-center'
                      )
                    : 'w-[440px] max-w-[92vw] min-h-[460px] p-9'
                }`}
                style={{
                  ['--accent' as any]: authAccent,
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.30)',
                  borderTop: `4px solid ${authAccent}`,
                  boxShadow: `0 8px 32px rgba(0,0,0,0.18), 0 30px 80px -24px ${authAccent}66, inset 0 1px 0 rgba(255,255,255,0.35)`,
                }}
              >
                {/* Header */}
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
                        disabled={isLoading || activeSplash === 'success'}
                        onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                        placeholder="e.g. user@school.com"
                        className={`accent-input w-full px-4 py-3 rounded-xl border ${emailError ? 'border-red-500' : 'border-stone-200 dark:border-stone-700'} bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 disabled:opacity-60 disabled:cursor-not-allowed`}
                      />
                      {emailError && <p className="text-red-500 text-xs mt-1 ml-1">{emailError}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase mb-1.5 ml-1">Password</label>
                      <input
                        type="password" required value={password}
                        disabled={isLoading || activeSplash === 'success'}
                        onChange={(e) => { setPassword(e.target.value); setPasswordError(''); }}
                        placeholder="••••••••"
                        className={`accent-input w-full px-4 py-3 rounded-xl border ${passwordError ? 'border-red-500' : 'border-stone-200 dark:border-stone-700'} bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 disabled:opacity-60 disabled:cursor-not-allowed`}
                      />
                      {passwordError && <p className="text-red-500 text-xs mt-1 ml-1">{passwordError}</p>}
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-xs font-bold text-stone-500 dark:text-stone-400 cursor-pointer">
                        <input type="checkbox" checked={rememberMe} disabled={isLoading || activeSplash === 'success'} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4 rounded disabled:opacity-50" style={{ accentColor: authAccent }} />
                        Remember Me
                      </label>
                      <button type="button" disabled={isLoading || activeSplash === 'success'} onClick={() => { setIsForgotPassword(true); setError(''); }} className="accent-link text-xs font-bold disabled:opacity-50">Forgot Password?</button>
                    </div>
                    {error && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        <p className="text-xs font-medium">{error}</p>
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={isLoading || activeSplash === 'success'}
                      className="w-full py-3 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ background: `linear-gradient(135deg, ${authAccent}, ${authAccentDeep})` }}
                    >
                      {isLoading ? 'Signing In...' : 'Sign In'}
                    </button>
                    <div className="text-center">
                      <button type="button" disabled={isLoading || activeSplash === 'success'} onClick={() => { setCurrentPage(3); setError(''); }} className="accent-link text-xs font-bold disabled:opacity-50">Need an account? Register Now</button>
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
                    disabled={isLoading || activeSplash === 'success'}
                    onClick={() => { setCurrentPage(1); setSelectedRole(null); setIsForgotPassword(false); setVerificationEmail(null); setError(''); }}
                    className="mt-7 flex items-center gap-2 text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors text-sm mx-auto disabled:opacity-50"
                  >
                    <ArrowLeft className="w-4 h-4" /> Change Role
                  </button>
                )}

                {activeSplash && selectedRole === 'Student' && (
                  <div className={`absolute inset-0 z-50 bg-black flex flex-col items-center justify-center rounded-3xl overflow-hidden animate-in fade-in duration-300 ${
                    activeSplash === 'success' ? 'p-0' : 'p-6 bg-stone-900/90 backdrop-blur-md'
                  }`}>
                    <video
                      src={`/api/splashscreens/${activeSplash === 'success' ? 'stu_success' : 'stu_error'}`}
                      autoPlay
                      playsInline
                      muted
                      onEnded={() => {
                        if (activeSplash === 'success') {
                          completeStudentRedirect();
                        } else {
                          if (splashCallback) {
                            splashCallback();
                          }
                          setActiveSplash(null);
                          setSplashCallback(null);
                        }
                      }}
                      className="w-full h-full object-cover rounded-3xl bg-black"
                    />
                  </div>
                )}
              </motion.div>
            )}
        </div>
      ) : loggedInUser.role === 'Parent' ? (
        <ParentPortal user={loggedInUser} onLogout={handleLogout} />
      ) : loggedInUser.role === 'Student' ? (
        <StudentPortal user={loggedInUser} onLogout={handleLogout} />
      ) : (
          <motion.div
            key="full-dashboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="fixed inset-0 bg-stone-100 dark:bg-stone-950 z-[100] flex"
          >
            {/* Sidebar */}
            {/* Mobile Sidebar Backdrop */}
            {isMobile && isSidebarOpen && (
              <div 
                className="fixed inset-0 bg-black/50 z-40 backdrop-blur-[2px] transition-opacity" 
                onClick={() => setIsSidebarOpen(false)} 
              />
            )}
            
            {/* Sidebar */}
            <aside className={`absolute inset-y-0 left-0 bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 flex flex-col shadow-xl z-50 transform ${isMobile && !isSidebarOpen ? '-translate-x-full' : 'translate-x-0'} md:relative md:translate-x-0 transition-transform duration-300 w-72`}>
              <div className="p-6 flex items-center gap-3 border-b border-stone-100 dark:border-stone-800">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                  <School className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="font-serif font-bold text-lg text-stone-800 dark:text-stone-100">EduSmart Tech</h1>
                  <p className="text-[9px] text-stone-500 uppercase tracking-widest">Enterprise Edition 2.0</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-1">
                {(loggedInUser.role === 'Super Admin' || loggedInUser.role === 'Management') && [
                  { id: 'overview', label: 'Overview', icon: BarChart3 },
                  { id: 'teachers', label: 'Teachers', icon: GraduationCap },
                  { id: 'students', label: 'Students', icon: UserIcon },
                  { id: 'attendance', label: 'Attendance', icon: CheckCircle2 },
                  { id: 'timetable', label: 'Timetable', icon: Calendar },
                  { id: 'library', label: 'Library', icon: BookIcon },
                  { id: 'canteen', label: 'Canteen', icon: Coffee },
                  { id: 'subjects', label: 'Subjects', icon: FileText },
                  { id: 'transport', label: 'Transport', icon: School },
                  { id: 'security', label: 'Security', icon: ShieldCheck },
                  { id: 'fees', label: 'Fees', icon: BarChart3 },
                  { id: 'leaves', label: 'Leave Requests', icon: Calendar },
                  { id: 'alerts', label: 'Alert Center', icon: Sparkles },
                  { id: 'contact', label: 'Contact', icon: Users },
                  { id: 'front-office', label: 'Front Office', icon: ClipboardList },
                  { id: 'student-info', label: 'Student Info', icon: UserIcon },
                  { id: 'fees-collection', label: 'Fees Collection', icon: CreditCard },
                  { id: 'income', label: 'Income', icon: DollarSign },
                  { id: 'expenses', label: 'Expenses', icon: Wallet },
                  { id: 'student-attendance', label: 'Student Attendance', icon: CheckCircle2 },
                  ...(loggedInUser.role === 'Super Admin' ? [{ id: 'management', label: 'Management', icon: UserCog }] : []),
                  { id: 'character-3d', label: '3D Character Studio', icon: Sparkles },
                  { id: 'reports', label: 'Reports', icon: FileText },
                  { id: 'settings', label: 'Settings', icon: UserCog },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveAdminTab(tab.id as any); if (isMobile) setIsSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                      activeAdminTab === tab.id 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 dark:shadow-none' 
                        : 'text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/50'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span className="text-sm">{tab.label}</span>
                  </button>
                ))}
                
                {loggedInUser.role === 'Teacher' && [
                  { id: 'overview', label: 'My Dashboard', icon: BarChart3 },
                  { id: 'attendance', label: 'Mark Attendance', icon: CheckCircle2 },
                  { id: 'students', label: 'Student Records', icon: UserIcon },
                  { id: 'timetable', label: 'Timetable', icon: Calendar },
                  { id: 'leaves', label: 'Apply Leave', icon: Calendar },
                  { id: 'alerts', label: 'Alert Security', icon: Sparkles },
                  { id: 'character-3d', label: '3D Character Studio', icon: Sparkles },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveAdminTab(tab.id as any); if (isMobile) setIsSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                      activeAdminTab === tab.id 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 dark:shadow-none' 
                        : 'text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/50'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span className="text-sm">{tab.label}</span>
                  </button>
                ))}

                {loggedInUser.role === 'Accounts' && [
                  { id: 'overview', label: 'Finance Overview', icon: BarChart3 },
                  { id: 'fees', label: 'Fee Management', icon: DollarSign },
                  { id: 'reports', label: 'Financial Reports', icon: FileText },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveAdminTab(tab.id as any); if (isMobile) setIsSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                      activeAdminTab === tab.id 
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100 dark:shadow-none' 
                        : 'text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/50'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span className="text-sm">{tab.label}</span>
                  </button>
                ))}

                {loggedInUser.role === 'Security' && [
                  { id: 'overview', label: 'Security Hub', icon: Shield },
                  { id: 'logs', label: 'Entry/Exit Logs', icon: History },
                  { id: 'alerts', label: 'Active Alerts', icon: Sparkles },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveAdminTab(tab.id as any); if (isMobile) setIsSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                      activeAdminTab === tab.id 
                        ? 'bg-slate-700 text-white shadow-lg shadow-slate-100 dark:shadow-none' 
                        : 'text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/50'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span className="text-sm">{tab.label}</span>
                  </button>
                ))}

                {loggedInUser.role === 'Store' && [
                  { id: 'overview', label: 'Inventory', icon: Briefcase },
                  { id: 'stock', label: 'Stock Management', icon: Box },
                  { id: 'orders', label: 'Purchase Orders', icon: FileText },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveAdminTab(tab.id as any); if (isMobile) setIsSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                      activeAdminTab === tab.id 
                        ? 'bg-stone-700 text-white shadow-lg shadow-stone-100 dark:shadow-none' 
                        : 'text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/50'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span className="text-sm">{tab.label}</span>
                  </button>
                ))}

                {loggedInUser.role === 'Reception' && [
                  { id: 'overview', label: 'Reception Desk', icon: Phone },
                  { id: 'front-office', label: 'Front Office', icon: ClipboardList },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveAdminTab(tab.id as any); if (isMobile) setIsSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                      activeAdminTab === tab.id 
                        ? 'bg-yellow-600 text-white shadow-lg shadow-yellow-100 dark:shadow-none' 
                        : 'text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/50'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span className="text-sm">{tab.label}</span>
                  </button>
                ))}

                {loggedInUser.role === 'Student' && [
                  { id: 'overview', label: 'My Dashboard', icon: BarChart3 },
                  { id: 'grades', label: 'My Grades', icon: Award },
                  { id: 'attendance', label: 'Attendance', icon: CheckCircle2 },
                  { id: 'timetable', label: 'Timetable', icon: Calendar },
                  { id: 'subjects', label: 'My Schedule', icon: Clock },
                  { id: 'transport', label: 'My Transport', icon: School },
                  { id: 'library', label: 'Library', icon: BookIcon },
                  { id: 'canteen', label: 'Canteen', icon: Coffee },
                  { id: 'fees', label: 'Fee Status', icon: DollarSign },
                  { id: 'character-3d', label: '3D Character Studio', icon: Sparkles },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveAdminTab(tab.id as any); if (isMobile) setIsSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                      activeAdminTab === tab.id 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none' 
                        : 'text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/50'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span className="text-sm">{tab.label}</span>
                  </button>
                ))}

                {loggedInUser.role === 'Librarian' && [
                  { id: 'library-dashboard', label: 'Dashboard', icon: LayoutDashboard },
                  { id: 'library-books', label: 'Books List', icon: BookIcon },
                  { id: 'library-issue', label: 'Issue Book', icon: PlusCircle },
                  { id: 'library-return', label: 'Return Book', icon: ArrowUpRight },
                  { id: 'library-overdue', label: 'Overdue Books', icon: ShieldAlert },
                  { id: 'library-fines', label: 'Fine Management', icon: Receipt },
                  { id: 'reports', label: 'Reports', icon: FileText },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveAdminTab(tab.id as any); if (isMobile) setIsSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                      activeAdminTab === tab.id 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none' 
                        : 'text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/50'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span className="text-sm">{tab.label}</span>
                  </button>
                ))}

                {loggedInUser.role === 'Canteen Manager' && [
                  { id: 'canteen-dashboard', label: 'Dashboard', icon: LayoutDashboard },
                  { id: 'canteen-menu', label: 'Menu Management', icon: Coffee },
                  { id: 'canteen-inventory', label: 'Inventory Management', icon: ClipboardList },
                  { id: 'canteen-incoming', label: 'Incoming Orders', icon: Sparkles },
                  { id: 'canteen-history', label: 'Order History', icon: List },
                  { id: 'reports', label: 'Sales Reports', icon: BarChart3 },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveAdminTab(tab.id as any); if (isMobile) setIsSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                      activeAdminTab === tab.id 
                        ? 'bg-amber-600 text-white shadow-lg shadow-amber-100 dark:shadow-none' 
                        : 'text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/50'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span className="text-sm">{tab.label}</span>
                  </button>
                ))}

                {loggedInUser.role === 'Parent' && [
                  { id: 'overview', label: 'Parent Dashboard', icon: BarChart3 },
                  { id: 'students', label: "Child's Progress", icon: GraduationCap },
                  { id: 'attendance', label: 'Attendance', icon: CheckCircle2 },
                  { id: 'timetable', label: 'Timetable', icon: Calendar },
                  { id: 'transport', label: 'My Transport', icon: School },
                  { id: 'fees', label: 'Fee Payments', icon: DollarSign },
                  { id: 'contact', label: 'Contact School', icon: Phone },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveAdminTab(tab.id as any); if (isMobile) setIsSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                      activeAdminTab === tab.id 
                        ? 'bg-rose-600 text-white shadow-lg shadow-rose-100 dark:shadow-none' 
                        : 'text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/50'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span className="text-sm">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Smart Portals — AI add-ons (links only; existing workflow untouched) */}
              <div className="p-4 border-t border-stone-100 dark:border-stone-800">
                <p className="px-1 pb-2 text-[10px] font-bold uppercase tracking-widest text-stone-400">Smart Portals · AI</p>
                <div className="space-y-1">
                  {[
                    { hash: '#/students', label: 'Students AI' },
                    { hash: '#/attendance', label: 'Attendance AI' },
                    { hash: '#/wallet', label: 'ID Card & Wallet' },
                    { hash: '#/fees', label: 'Fee Management' },
                  ].map((p) => (
                    <a key={p.hash} href={p.hash}
                      className="w-full flex items-center gap-3 px-4 py-2 rounded-xl font-bold text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all text-sm"
                    >
                      <Bot className="w-4 h-4" />
                      <span>{p.label}</span>
                    </a>
                  ))}
                </div>
              </div>
              <div className="p-4 border-t border-stone-100 dark:border-stone-800">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm">Sign Out</span>
                </button>
              </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden bg-stone-50 dark:bg-stone-950">
              {/* Header */}
              <header className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 px-4 md:px-8 py-4 flex items-center justify-between shadow-sm sticky top-0 z-30">
                <div className="flex items-center gap-4">
                  {isMobile && (
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors">
                      <Menu className="w-6 h-6" />
                    </button>
                  )}
                  <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100 capitalize">
                    {activeAdminTab.replace('-', ' ')}
                  </h2>
                </div>

                <div className="flex items-center gap-6">
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 transition-all"
                    title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                  >
                    {darkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-bold text-stone-800 dark:text-stone-100">{loggedInUser.name}</p>
                      <p className="text-[10px] text-stone-500 uppercase tracking-widest">{loggedInUser.role}</p>
                    </div>
                    <div className="w-10 h-10 bg-stone-100 dark:bg-stone-800 rounded-xl flex items-center justify-center overflow-hidden border border-stone-200 dark:border-stone-700">
                      {loggedInUser.photo ? (
                        <img src={loggedInUser.photo} alt="User" className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon className="w-6 h-6 text-stone-400 dark:text-stone-600" />
                      )}
                    </div>
                  </div>
                </div>
              </header>

              <main className="flex-1 p-8 overflow-y-auto bg-stone-50 dark:bg-stone-950">
                <div className="max-w-6xl mx-auto space-y-8">
                  {/* Welcome Hero */}
                  <section className="bg-white dark:bg-stone-900 rounded-3xl p-8 shadow-xl border border-stone-100 dark:border-stone-800 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 dark:bg-blue-900/10 rounded-full -mr-32 -mt-32 opacity-50" />
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                      <div className="w-20 h-20 bg-stone-100 dark:bg-stone-800 rounded-2xl flex items-center justify-center overflow-hidden shadow-lg shadow-blue-500/20 border-4 border-white dark:border-stone-700 shadow-xl">
                        {loggedInUser.photo ? (
                          <img src={loggedInUser.photo} alt="User" className="w-full h-full object-cover" />
                        ) : (
                          <ShieldCheck className="w-10 h-10 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <h2 className="text-3xl font-serif font-bold text-stone-800 dark:text-stone-100 mb-1">
                          Welcome, {loggedInUser.name}!
                        </h2>
                        <p className="text-stone-500 dark:text-stone-400 text-sm">
                          Accessing the <span className="font-bold text-blue-600 dark:text-blue-400">{loggedInUser.role} Dashboard</span>.
                        </p>
                      </div>
                    </div>
                  </section>

                  {renderDashboard()}
                </div>
              </main>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingReportCard && <ReportCardModal />}
      </AnimatePresence>

      {/* Notification Overlay */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-8 right-8 z-[1000] flex items-center gap-4 p-4 rounded-2xl shadow-2xl border bg-white dark:bg-stone-900 border-stone-100 dark:border-stone-800"
            style={{ 
              borderColor: notification.type === 'error' ? '#fee2e2' : notification.type === 'success' ? '#dcfce7' : '#e0f2fe'
            }}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              notification.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400' : 
              notification.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 dark:text-emerald-400' : 
              'bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400'
            }`}>
              {notification.type === 'error' ? <XCircle className="w-6 h-6" /> : 
               notification.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : 
               <Sparkles className="w-6 h-6" />}
            </div>
            <div className="pr-8">
              <p className="text-sm font-bold text-stone-800 dark:text-stone-100">{notification.message}</p>
            </div>
            <button 
              onClick={() => setNotification(null)}
              className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-stone-500 dark:text-stone-500" />
            </button>
            <motion.div 
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 5, ease: 'linear' }}
              onAnimationComplete={() => setNotification(null)}
              className={`absolute bottom-0 left-0 h-1 rounded-full ${
                notification.type === 'error' ? 'bg-red-500' : 
                notification.type === 'success' ? 'bg-emerald-500' : 
                'bg-blue-500'
              }`}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {confirmDialog && (
          <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-stone-900 p-8 rounded-3xl shadow-2xl max-w-md w-full space-y-6 border border-stone-100 dark:border-stone-800"
            >
              <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-500 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-stone-800 dark:text-stone-100">Are you sure?</h3>
                <p className="text-stone-500 dark:text-stone-400 text-sm">{confirmDialog.message}</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setConfirmDialog(null)}
                  className="flex-1 py-3 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded-xl font-bold hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDialog.onConfirm}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100 dark:shadow-none"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
}

