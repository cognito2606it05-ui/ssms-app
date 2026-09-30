import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { UserRole, User, Teacher, Student, Parent, Staff, Alert, LeaveRequest, BusRoute, Subject, AttendanceRecord, Homework, ExamResult, StoreItem, Reservation } from '../types';
import { EntryRole } from '../components/RoleEntryAnimation';
import { MOCK_USERS, ROLE_PASSWORDS } from '../constants';
import Papa from 'papaparse';
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
  getDocFromServer,
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  db,
  auth
} from '../localDatabase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  GET = 'get',
  LIST = 'list',
  WRITE = 'write'
}

export interface FirestoreErrorInfo {
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

export const getAuthErrorMessage = (code: string) => {
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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null, setError?: (msg: string) => void) {
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

interface AppContextProps {
  isMobile: boolean;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  isInitialLoad: boolean;
  setIsInitialLoad: React.Dispatch<React.SetStateAction<boolean>>;
  selectedRole: UserRole | null;
  setSelectedRole: React.Dispatch<React.SetStateAction<UserRole | null>>;
  entryRole: EntryRole | null;
  setEntryRole: React.Dispatch<React.SetStateAction<EntryRole | null>>;
  email: string;
  setEmail: React.Dispatch<React.SetStateAction<string>>;
  password: string;
  setPassword: React.Dispatch<React.SetStateAction<string>>;
  rememberMe: boolean;
  setRememberMe: React.Dispatch<React.SetStateAction<boolean>>;
  loggedInUser: User | null;
  setLoggedInUser: React.Dispatch<React.SetStateAction<User | null>>;
  isForgotPassword: boolean;
  setIsForgotPassword: React.Dispatch<React.SetStateAction<boolean>>;
  verificationEmail: string | null;
  setVerificationEmail: React.Dispatch<React.SetStateAction<string | null>>;
  error: string;
  setError: React.Dispatch<React.SetStateAction<string>>;
  emailError: string;
  setEmailError: React.Dispatch<React.SetStateAction<string>>;
  passwordError: string;
  setPasswordError: React.Dispatch<React.SetStateAction<string>>;
  notification: { message: string; type: 'success' | 'error' | 'info' } | null;
  setNotification: React.Dispatch<React.SetStateAction<{ message: string; type: 'success' | 'error' | 'info' } | null>>;
  confirmDialog: { message: string; onConfirm: () => void } | null;
  setConfirmDialog: React.Dispatch<React.SetStateAction<{ message: string; onConfirm: () => void } | null>>;
  selectedFeeIds: string[];
  setSelectedFeeIds: React.Dispatch<React.SetStateAction<string[]>>;
  activeSplash: 'success' | 'error' | null;
  setActiveSplash: React.Dispatch<React.SetStateAction<'success' | 'error' | null>>;
  splashCallback: (() => void) | null;
  setSplashCallback: React.Dispatch<React.SetStateAction<(() => void) | null>>;
  isLoggingInStudentRef: React.MutableRefObject<boolean>;
  allUsers: User[];
  setAllUsers: React.Dispatch<React.SetStateAction<User[]>>;
  teachers: Teacher[];
  setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  parents: Parent[];
  setParents: React.Dispatch<React.SetStateAction<Parent[]>>;
  staff: Staff[];
  setStaff: React.Dispatch<React.SetStateAction<Staff[]>>;
  activeAdminTab: string;
  setActiveAdminTab: React.Dispatch<React.SetStateAction<string>>;
  busRoutes: BusRoute[];
  setBusRoutes: React.Dispatch<React.SetStateAction<BusRoute[]>>;
  schoolSubjects: Subject[];
  setSchoolSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
  attendanceRecords: AttendanceRecord[];
  setAttendanceRecords: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
  homeworks: Homework[];
  setHomeworks: React.Dispatch<React.SetStateAction<Homework[]>>;
  examResults: ExamResult[];
  setExamResults: React.Dispatch<React.SetStateAction<ExamResult[]>>;
  storeItems: StoreItem[];
  setStoreItems: React.Dispatch<React.SetStateAction<StoreItem[]>>;
  alerts: Alert[];
  setAlerts: React.Dispatch<React.SetStateAction<Alert[]>>;
  leaveRequests: LeaveRequest[];
  setLeaveRequests: React.Dispatch<React.SetStateAction<LeaveRequest[]>>;
  reservations: Reservation[];
  setReservations: React.Dispatch<React.SetStateAction<Reservation[]>>;
  attendanceMode: 'Manual' | 'Biometric' | 'QR';
  setAttendanceMode: React.Dispatch<React.SetStateAction<'Manual' | 'Biometric' | 'QR'>>;
  showAddModal: 'teacher' | 'student' | null;
  setShowAddModal: React.Dispatch<React.SetStateAction<'teacher' | 'student' | null>>;
  editingTeacher: Teacher | null;
  setEditingTeacher: React.Dispatch<React.SetStateAction<Teacher | null>>;
  editingStudent: Student | null;
  setEditingStudent: React.Dispatch<React.SetStateAction<Student | null>>;
  viewingStudent: Student | null;
  setViewingStudent: React.Dispatch<React.SetStateAction<Student | null>>;
  viewingIDCard: Student | Teacher | null;
  setViewingIDCard: React.Dispatch<React.SetStateAction<Student | Teacher | null>>;
  showAIAssistant: boolean;
  setShowAIAssistant: React.Dispatch<React.SetStateAction<boolean>>;
  showScanner: boolean;
  setShowScanner: React.Dispatch<React.SetStateAction<boolean>>;
  viewingReceipt: any;
  setViewingReceipt: React.Dispatch<React.SetStateAction<any>>;
  showFeeModal: boolean;
  setShowFeeModal: React.Dispatch<React.SetStateAction<boolean>>;
  isSidebarOpen: boolean;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  darkMode: boolean;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  isTeachersLoading: boolean;
  setIsTeachersLoading: React.Dispatch<React.SetStateAction<boolean>>;
  isStudentsLoading: boolean;
  setIsStudentsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  teacherSubjectFilter: string;
  setTeacherSubjectFilter: React.Dispatch<React.SetStateAction<string>>;
  viewingReportCard: Student | null;
  setViewingReportCard: React.Dispatch<React.SetStateAction<Student | null>>;
  bulkImportInputRef: React.RefObject<HTMLInputElement>;
  aiMessages: { role: 'user' | 'ai'; text: string }[];
  setAiMessages: React.Dispatch<React.SetStateAction<{ role: 'user' | 'ai'; text: string }[]>>;
  handleBackToLogin: () => Promise<void>;
  handleRoleSelect: (role: UserRole) => void;
  handleSignUp: (e: React.FormEvent) => Promise<void>;
  handleLogin: (e: React.FormEvent) => Promise<void>;
  handleForgotPassword: (e: React.FormEvent) => Promise<void>;
  handleRefreshVerification: () => Promise<void>;
  handleResendVerification: () => Promise<void>;
  handleBulkImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  bootstrapDatabase: () => Promise<void>;
  handleLogout: () => Promise<void>;
  removeTeacher: (id: string) => Promise<void>;
  removeStudent: (id: string) => Promise<void>;
  getAssociatedStudent: () => Student | null;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
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
  const [activeSplash, setActiveSplash] = useState<'success' | 'error' | null>(null);
  const [splashCallback, setSplashCallback] = useState<(() => void) | null>(null);
  const isLoggingInStudentRef = useRef(false);

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
  const bulkImportInputRef = useRef<HTMLInputElement>(null);
  const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: 'Hello! I am your EduSmart AI Assistant. How can I help you today?' }
  ]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const verificationEmailRef = useRef<string | null>(null);
  useEffect(() => {
    verificationEmailRef.current = verificationEmail;
  }, [verificationEmail]);

  // Firebase Auth Listener
  useEffect(() => {
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
        unsubProfile = onSnapshot(doc(db, 'users', user.uid), (userDoc) => {
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            if (isLoggingInStudentRef.current && userData.role === 'Student') {
              isLoggingInStudentRef.current = false;
              setActiveSplash('success');
              setSplashCallback(() => {
                setLoggedInUser(userData);
                setCurrentPage(3);
              });
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

    let attendanceQuery: any = collection(db, 'attendance');
    if (!isAdmin && !isTeacher) {
      if (loggedInUser.role === 'Student') {
        attendanceQuery = query(collection(db, 'attendance'), where('studentEmail', '==', loggedInUser.email));
      } else {
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

  const handleBackToLogin = async () => {
    await signOut(auth);
    setVerificationEmail(null);
    setCurrentPage(2);
    setError('');
  };

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setCurrentPage(2);
    setEmail('');
    setPassword('');
    setError('');
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

      await sendEmailVerification(user);
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

    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } catch (err: any) {
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
          const mockUser = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase() && u.role === selectedRole);
          const expectedPassword = selectedRole ? ROLE_PASSWORDS[selectedRole] : '';
          
          if (mockUser && password === expectedPassword) {
            userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await sendEmailVerification(userCredential.user);
          } else {
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
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
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
        if (selectedRole && userData.role !== selectedRole) {
          await signOut(auth);
          triggerLoginError(`This account is registered as a ${userData.role}, not a ${selectedRole}.`);
          setIsLoading(false);
          return;
        }
      }
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
    setLoggedInUser(null);
    setSelectedRole(null);
    setCurrentPage(0);
  };

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

  const getAssociatedStudent = () => {
    if (!loggedInUser) return null;
    if (loggedInUser.role === 'Student') {
      return students.find(s => s.email === loggedInUser.email) || null;
    }
    if (loggedInUser.role === 'Parent') {
      return students.find(s => s.guardian.email === loggedInUser.email) || null;
    }
    return null;
  };

  return (
    <AppContext.Provider value={{
      isMobile,
      currentPage,
      setCurrentPage,
      isLoading,
      setIsLoading,
      isInitialLoad,
      setIsInitialLoad,
      selectedRole,
      setSelectedRole,
      entryRole,
      setEntryRole,
      email,
      setEmail,
      password,
      setPassword,
      rememberMe,
      setRememberMe,
      loggedInUser,
      setLoggedInUser,
      isForgotPassword,
      setIsForgotPassword,
      verificationEmail,
      setVerificationEmail,
      error,
      setError,
      emailError,
      setEmailError,
      passwordError,
      setPasswordError,
      notification,
      setNotification,
      confirmDialog,
      setConfirmDialog,
      selectedFeeIds,
      setSelectedFeeIds,
      activeSplash,
      setActiveSplash,
      splashCallback,
      setSplashCallback,
      isLoggingInStudentRef,
      allUsers,
      setAllUsers,
      teachers,
      setTeachers,
      students,
      setStudents,
      parents,
      setParents,
      staff,
      setStaff,
      activeAdminTab,
      setActiveAdminTab,
      busRoutes,
      setBusRoutes,
      schoolSubjects,
      setSchoolSubjects,
      attendanceRecords,
      setAttendanceRecords,
      homeworks,
      setHomeworks,
      examResults,
      setExamResults,
      storeItems,
      setStoreItems,
      alerts,
      setAlerts,
      leaveRequests,
      setLeaveRequests,
      reservations,
      setReservations,
      attendanceMode,
      setAttendanceMode,
      showAddModal,
      setShowAddModal,
      editingTeacher,
      setEditingTeacher,
      editingStudent,
      setEditingStudent,
      viewingStudent,
      setViewingStudent,
      viewingIDCard,
      setViewingIDCard,
      showAIAssistant,
      setShowAIAssistant,
      showScanner,
      setShowScanner,
      viewingReceipt,
      setViewingReceipt,
      showFeeModal,
      setShowFeeModal,
      isSidebarOpen,
      setIsSidebarOpen,
      darkMode,
      setDarkMode,
      isTeachersLoading,
      setIsTeachersLoading,
      isStudentsLoading,
      setIsStudentsLoading,
      teacherSubjectFilter,
      setTeacherSubjectFilter,
      viewingReportCard,
      setViewingReportCard,
      bulkImportInputRef,
      aiMessages,
      setAiMessages,
      handleBackToLogin,
      handleRoleSelect,
      handleSignUp,
      handleLogin,
      handleForgotPassword,
      handleRefreshVerification,
      handleResendVerification,
      handleBulkImport,
      bootstrapDatabase,
      handleLogout,
      removeTeacher,
      removeStudent,
      getAssociatedStudent
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
