export type UserRole = 'Super Admin' | 'Management' | 'Teacher' | 'Student' | 'Parent' | 'Security' | 'Reception' | 'Store' | 'Electrician' | 'Accounts' | 'Attender' | 'Librarian' | 'Canteen Manager';

export type RoleType = 'academic' | 'non-academic';

export interface User {
  user_id: string;
  name: string;
  role: UserRole;
  role_type: RoleType;
  email: string;
  phone: string;
  linked_id: string; // student_id / teacher_id / staff_id
  photo?: string;
}

export interface Alert {
  id: string;
  type: 'Security' | 'Medical' | 'Fire' | 'General' | 'Emergency' | 'Incident';
  message: string;
  timestamp: string;
  sender: string;
  senderId?: string;
  status: 'Active' | 'Resolved';
  scope?: string;
}

export interface LeaveRequest {
  id: string;
  student_id: string;
  userId?: string;
  studentName: string;
  userName?: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  appliedAt: string;
}

export interface BusRoute {
  id: string;
  routeName: string;
  driverName: string;
  driverPhone: string;
  busNumber: string;
  capacity: number;
  studentsCount: number;
  stops: { name: string; time: string }[];
  status: 'On Time' | 'Delayed' | 'Maintenance';
}

export interface Subject {
  id: string;
  name: string;
  class: string;
  teacherId: string;
}

export interface FeePayment {
  id: string;
  amount: number;
  date: string;
  method: string;
  receiptNo: string;
}

export interface Homework {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  class: string;
  section: string;
  subject: string;
  teacherId: string;
  teacherName: string;
  createdAt: string;
}

export interface StoreItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  minQuantity: number;
  price: number;
  supplier: string;
  lastRestocked?: string;
}

export interface SalaryRecord {
  id: string;
  month: string;
  year: number;
  basic: number;
  allowances: number;
  deductions: number;
  net: number;
  paidAt: string;
}

export interface StudentSummary {
  attendance_percentage: number;
  latest_grade: string;
  fee_status: 'Paid' | 'Pending' | 'Overdue';
}

export interface Student {
  student_id: string;
  name: string;
  class_id: string;
  class: string; // Added for compatibility
  section: string;
  parent_id: string;
  subjects: string[];
  summary: StudentSummary;
  email: string;
  photo?: string;
  phone?: string;
  dob?: string;
  gender?: string;
  fatherName?: string;
  motherName?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  assignedBusId?: string;
  guardian?: {
    name: string;
    phone: string;
    email: string;
    relation: string;
    address: string;
    photo?: string;
  };
  fees: {
    total: number;
    paid: number;
    status: 'Paid' | 'Pending' | 'Overdue';
    history: FeePayment[];
  };
}

export interface Parent {
  parent_id: string;
  name: string;
  linked_students: string[]; // array of student_ids
  email: string;
  phone?: string;
}

export interface Teacher {
  teacher_id: string;
  name: string;
  assigned_classes: string[]; // e.g. ["10-A", "10-B"]
  subjects: string[];
  email: string;
  photo?: string;
  phone?: string;
  salary: {
    basic: number;
    allowances: number;
    history: SalaryRecord[];
  };
}

export interface Staff {
  staff_id: string;
  name: string;
  role: UserRole;
  module_access: string[];
  email: string;
}

// Logs and other records
export interface GateLog {
  id: string;
  user_id: string;
  type: 'In' | 'Out';
  timestamp: string;
  notes?: string;
}

export interface AttendanceLog {
  id: string;
  user_id: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late';
  timestamp: string;
}

export interface InquiryLog {
  id: string;
  visitor_name: string;
  purpose: string;
  timestamp: string;
  handled_by: string; // user_id
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface MaintenanceLog {
  id: string;
  issue: string;
  status: 'Pending' | 'Completed';
  timestamp: string;
  handled_by: string; // user_id
}

export interface LibraryRecord {
  id: string;
  book_title: string;
  student_id: string;
  due_date: string;
  status: 'Issued' | 'Returned';
}

export interface Reservation {
  id: string;
  book_title: string;
  student_id: string;
  student_name: string;
  reservation_date: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Returned';
}

export interface AttendanceRecord extends AttendanceLog {
  student_id: string;
  studentName?: string;
  studentEmail?: string;
  class?: string;
  section?: string;
}

export interface ExamResult {
  id: string;
  student_id: string;
  studentName?: string;
  class?: string;
  section?: string;
  subject: string;
  examName?: string;
  marksObtained?: number;
  maxMarks?: number;
  grade: string;
  date: string;
  teacherId?: string;
}

export interface FeeRecord {
  id: string;
  student_id: string;
  amount: number;
  date: string;
  status: 'Paid' | 'Pending';
}

// Front Office Types
export interface AdmissionEnquiry {
  id: string;
  studentName: string;
  guardianName: string;
  phone: string;
  email: string;
  class: string;
  source: string;
  followUpDate: string;
  description: string;
  status: 'New' | 'Contacted' | 'Follow Up' | 'Converted' | 'Closed';
  createdAt: string;
}

export interface VisitorRecord {
  id: string;
  name: string;
  phone: string;
  purpose: string;
  whomToMeet: string;
  idProofType: string;
  idProofNumber: string;
  checkInTime: string;
  checkOutTime: string;
  numberOfPersons: number;
  note: string;
  status: 'Checked In' | 'Checked Out';
}

export interface PhoneCallRecord {
  id: string;
  callerName: string;
  phone: string;
  date: string;
  callType: 'Incoming' | 'Outgoing';
  purpose: string;
  followUp: string;
  note: string;
  handledBy: string;
}

export interface PostalDispatchRecord {
  id: string;
  referenceNo: string;
  toAddress: string;
  fromTitle: string;
  date: string;
  documentType: string;
  note: string;
}

export interface PostalReceiveRecord {
  id: string;
  referenceNo: string;
  fromAddress: string;
  toTitle: string;
  date: string;
  documentType: string;
  note: string;
}

export interface ComplaintRecord {
  id: string;
  complaintType: string;
  source: string;
  name: string;
  phone: string;
  email: string;
  description: string;
  actionTaken: string;
  assignedTo: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  date: string;
}

export interface FrontOfficeSettings {
  visitPurposes: string[];
  complaintTypes: string[];
  complaintSources: string[];
  documentTypes: string[];
  enquirySources: string[];
  idProofTypes: string[];
}

// Student Information Types
export interface StudentCategory {
  id: string;
  name: string;
  description: string;
}

export interface StudentHouse {
  id: string;
  name: string;
  description: string;
  color: string;
}

export interface DisableReason {
  id: string;
  reason: string;
  description: string;
}

export interface OnlineAdmissionApplication {
  id: string;
  studentName: string;
  fatherName: string;
  motherName: string;
  dob: string;
  gender: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  classApplied: string;
  previousSchool: string;
  previousClass: string;
  percentage: string;
  category: string;
  status: 'Submitted' | 'Under Review' | 'Approved' | 'Rejected';
  appliedDate: string;
  remarks: string;
}

export interface DisabledStudentRecord {
  id: string;
  studentId: string;
  studentName: string;
  class: string;
  section: string;
  disableReason: string;
  disableDate: string;
  isActive: boolean;
}

export interface MultiClassAssignment {
  id: string;
  studentId: string;
  studentName: string;
  primaryClass: string;
  primarySection: string;
  additionalClasses: { class: string; section: string }[];
}

// Fees Collection Types
export interface FeeType {
  id: string;
  name: string;
  code: string;
  description: string;
}

export interface FeeGroup {
  id: string;
  name: string;
  description: string;
  feeTypes: string[];
}

export interface FeeMaster {
  id: string;
  feeGroup: string;
  feeType: string;
  dueDate: string;
  amount: number;
  class: string;
  finePer: number;
  fineType: 'Percentage' | 'Fixed';
}

export interface FeeDiscount {
  id: string;
  name: string;
  discountType: 'Percentage' | 'Fixed';
  amount: number;
  description: string;
  applicableFeeGroups: string[];
}

export interface FeeCollectionPayment {
  id: string;
  studentId: string;
  studentName: string;
  class: string;
  section: string;
  feeType: string;
  amount: number;
  discount: number;
  fine: number;
  paid: number;
  paymentMode: 'Cash' | 'Online' | 'Cheque' | 'Bank Transfer' | 'UPI';
  paymentDate: string;
  receiptNo: string;
  status: 'Paid' | 'Partial' | 'Pending';
}

export interface OfflineBankPayment {
  id: string;
  studentId: string;
  studentName: string;
  class: string;
  section: string;
  amount: number;
  bankName: string;
  referenceNo: string;
  paymentDate: string;
  depositDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  note: string;
}

export interface FeeReminder {
  id: string;
  class: string;
  section: string;
  feeType: string;
  reminderDate: string;
  reminderType: 'SMS' | 'Email' | 'Both';
  status: 'Scheduled' | 'Sent' | 'Failed';
  studentCount: number;
}

// Income Types
export interface IncomeHead {
  id: string;
  name: string;
  description: string;
}

export interface IncomeEntry {
  id: string;
  incomeHead: string;
  name: string;
  invoiceNumber: string;
  amount: number;
  date: string;
  description: string;
}

// Expense Types
export interface ExpenseHead {
  id: string;
  name: string;
  description: string;
}

export interface ExpenseEntry {
  id: string;
  expenseHead: string;
  name: string;
  invoiceNumber: string;
  amount: number;
  date: string;
  description: string;
}

// Student Attendance Types
export interface StudentAttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  class: string;
  section: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late' | 'Half Day';
  note?: string;
}

export interface AttendanceLeaveRequest {
  id: string;
  studentId: string;
  studentName: string;
  class: string;
  section: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  appliedAt: string;
  reviewedBy?: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  quantity: number;
  available_quantity: number;
  description?: string;
  image_url?: string;
}

export interface BorrowRecord {
  id: string;
  student_id: string;
  student_name?: string;
  book_id: string;
  book_title?: string;
  issue_date: string;
  due_date: string;
  return_date?: string;
  fine_amount: number;
  fine_status: 'None' | 'Pending' | 'Paid';
}

export interface FoodItem {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  low_stock_threshold: number;
  description?: string;
  image_url?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  food_item_id: string;
  food_item_name?: string;
  quantity: number;
  price_at_order: number;
}

export interface Order {
  id: string;
  student_id: string;
  student_name?: string;
  status: 'Pending' | 'Preparing' | 'Ready' | 'Delivered' | 'Cancelled';
  total_amount: number;
  created_at: string;
  items?: OrderItem[];
}

export interface AuditLog {
  id: string;
  user_id: string;
  username?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: string;
  timestamp: string;
}
