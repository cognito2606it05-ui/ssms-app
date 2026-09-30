import { User, Teacher, Student, Parent, Staff, UserRole, BusRoute, ExamResult } from './types';

const subjects = ['English', 'Telugu', 'Hindi', 'Maths', 'Science', 'Social'];
export const CLASSES = Array.from({ length: 10 }, (_, i) => (i + 1).toString());
export const SECTIONS = ['A', 'B', 'C', 'D'];
export const SUBJECTS = subjects;

export const INITIAL_TEACHERS: Teacher[] = Array.from({ length: 10 }, (_, i) => {
  const sub = subjects[i % subjects.length];
  const teacherId = `T-${(i+1).toString().padStart(3, '0')}`;
  return {
    teacher_id: teacherId,
    name: `Teacher ${i+1} (${sub})`,
    assigned_classes: CLASSES.map(c => `${c}-A`),
    subjects: [sub],
    email: `teacher${i+1}@school.com`,
    photo: `https://api.dicebear.com/7.x/avataaars/svg?seed=${teacherId}`,
    phone: '9876543210',
    salary: { basic: 50000, allowances: 5000, history: [] }
  };
});

export const INITIAL_STUDENTS: Student[] = [];
export const INITIAL_PARENTS: Parent[] = [];
export const INITIAL_EXAM_RESULTS: ExamResult[] = [];

CLASSES.forEach((c) => {
  for (let i = 1; i <= 5; i++) {
    const studentIdx = (parseInt(c) - 1) * 5 + i;
    const studentId = `S-${studentIdx.toString().padStart(3, '0')}`;
    const parentId = `P-${studentIdx.toString().padStart(3, '0')}`;
    
    INITIAL_STUDENTS.push({
      student_id: studentId,
      name: `Student ${studentIdx} (Class ${c})`,
      class_id: c,
      class: c,
      section: 'A',
      parent_id: parentId,
      subjects: subjects,
      summary: { attendance_percentage: 95, latest_grade: 'A', fee_status: 'Pending' },
      email: `student${studentIdx}@school.com`,
      photo: `https://api.dicebear.com/7.x/avataaars/svg?seed=${studentId}`,
      phone: `98765${studentIdx.toString().padStart(5, '0')}`,
      fatherName: `Father of Student ${studentIdx}`,
      guardian: {
        name: `Guardian ${studentIdx}`,
        phone: `98765${studentIdx.toString().padStart(5, '0')}`,
        email: `guardian${studentIdx}@school.com`,
        relation: 'Father',
        address: `123 Edu Road, Area ${c}`,
        photo: `https://api.dicebear.com/7.x/avataaars/svg?seed=G-${studentId}`
      },
      fees: { total: 50000, paid: 25000, status: 'Pending', history: [] }
    });

    INITIAL_PARENTS.push({
      parent_id: parentId,
      name: `Parent ${studentIdx}`,
      linked_students: [studentId],
      email: `guardian${studentIdx}@school.com`,
      phone: `98765${studentIdx.toString().padStart(5, '0')}`
    });

    INITIAL_EXAM_RESULTS.push(
      { id: `ER-${studentId}-1`, student_id: studentId, subject: 'Mathematics', marksObtained: 95, maxMarks: 100, grade: 'A+', date: '2025-10-15' },
      { id: `ER-${studentId}-2`, student_id: studentId, subject: 'Science', marksObtained: 88, maxMarks: 100, grade: 'A', date: '2025-10-16' },
      { id: `ER-${studentId}-3`, student_id: studentId, subject: 'English', marksObtained: 78, maxMarks: 100, grade: 'B+', date: '2025-10-17' },
      { id: `ER-${studentId}-4`, student_id: studentId, subject: 'Social', marksObtained: 82, maxMarks: 100, grade: 'A-', date: '2025-10-18' },
      { id: `ER-${studentId}-5`, student_id: studentId, subject: 'Hindi', marksObtained: 85, maxMarks: 100, grade: 'A', date: '2025-10-19' },
      { id: `ER-${studentId}-6`, student_id: studentId, subject: 'Telugu', marksObtained: 90, maxMarks: 100, grade: 'A+', date: '2025-10-20' }
    );
  }
});

export const MOCK_USERS: User[] = [
  { user_id: 'U-ADMIN1', email: 'eswara.alugolu6511@gmail.com', role: 'Super Admin', role_type: 'academic', name: 'Eswara Alugolu', phone: '1234567890', linked_id: 'ADMIN-01' },
  { user_id: 'U-ADMIN2', email: 'admin@school.com', role: 'Management', role_type: 'academic', name: 'Management Admin', phone: '1234567891', linked_id: 'ADMIN-02' },
  
  ...INITIAL_TEACHERS.map((t, i) => ({ user_id: `U-T${i}`, email: t.email, role: 'Teacher' as UserRole, role_type: 'academic' as const, name: t.name, phone: t.phone || '9876543210', linked_id: t.teacher_id, photo: t.photo })),
  
  ...INITIAL_STUDENTS.map((s, i) => ({ user_id: `U-S${i}`, email: s.email, role: 'Student' as UserRole, role_type: 'academic' as const, name: s.name, phone: s.phone || '9876543230', linked_id: s.student_id, photo: s.photo })),
  
  ...INITIAL_PARENTS.map((p, i) => ({ user_id: `U-P${i}`, email: p.email, role: 'Parent' as UserRole, role_type: 'academic' as const, name: p.name, phone: p.phone || '9876543231', linked_id: p.parent_id })),

  { user_id: 'U-SEC', email: 'security@school.com', role: 'Security', role_type: 'non-academic', name: 'Officer Mike', phone: '555-0101', linked_id: 'ST-001' },
  { user_id: 'U-REC', email: 'reception@school.com', role: 'Reception', role_type: 'non-academic', name: 'Ms. Parker', phone: '555-0203', linked_id: 'ST-002' },
  { user_id: 'U-LIB', email: 'librarian@school.com', role: 'Librarian', role_type: 'non-academic', name: 'Librarian (Library)', phone: '555-0301', linked_id: 'ST-003' },
  { user_id: 'U-CAN', email: 'canteen@school.com', role: 'Canteen Manager', role_type: 'non-academic', name: 'Canteen Manager (Canteen)', phone: '555-0302', linked_id: 'ST-004' }
];

export const ROLE_PASSWORDS: Record<UserRole, string> = {
  'Super Admin': 'S.admin12!@',
  'Management': 'Admin12!@',
  'Teacher': 'Teacher12!@',
  'Student': 'Student12!@',
  'Parent': 'Parent12!@',
  'Security': 'Security12!@',
  'Reception': 'Reception12!@',
  'Store': 'Store12!@',
  'Electrician': 'Electrician12!@',
  'Accounts': 'Accounts12!@',
  'Attender': 'Attender12!@',
  'Librarian': 'Librarian12!@',
  'Canteen Manager': 'Canteen12!@',
};

export const INITIAL_STAFF: Staff[] = [
  { staff_id: 'ST-001', name: 'Officer Mike', role: 'Security', module_access: ['gate_logs', 'alerts'], email: 'security@school.com' },
  { staff_id: 'ST-002', name: 'Ms. Parker', role: 'Reception', module_access: ['inquiry_logs', 'visitors'], email: 'reception@school.com' },
  { staff_id: 'ST-003', name: 'Librarian (Library)', role: 'Librarian', module_access: ['books', 'borrows', 'reservations'], email: 'librarian@school.com' },
  { staff_id: 'ST-004', name: 'Canteen Manager (Canteen)', role: 'Canteen Manager', module_access: ['food_items', 'orders', 'inventory'], email: 'canteen@school.com' }
];

export const INITIAL_BUS_ROUTES: BusRoute[] = [
  { id: 'BR-001', routeName: 'North Route', driverName: 'John Doe', driverPhone: '1234567890', busNumber: 'BUS-01', capacity: 40, studentsCount: 25, stops: [{ name: 'Main Gate', time: '07:30 AM' }, { name: 'North Park', time: '07:45 AM' }], status: 'On Time' }
];

export const INITIAL_SECURITY_STAFF = INITIAL_STAFF.filter(s => s.role === 'Security');
export const INITIAL_NON_TEACHING_STAFF = INITIAL_STAFF.filter(s => s.role !== 'Security');

export const INITIAL_BOOKS = [
  {
    id: "B-001",
    title: "Clean Code",
    author: "Robert C. Martin",
    isbn: "9780132350884",
    category: "Computer Science",
    quantity: 5,
    available_quantity: 4,
    description: "A Handbook of Agile Software Craftsmanship",
    image_url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&auto=format&fit=crop&q=60"
  },
  {
    id: "B-002",
    title: "Introduction to Algorithms",
    author: "Thomas H. Cormen",
    isbn: "9780262033848",
    category: "Computer Science",
    quantity: 3,
    available_quantity: 3,
    description: "The bible of algorithm design and analysis.",
    image_url: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&auto=format&fit=crop&q=60"
  },
  {
    id: "B-003",
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    isbn: "9780261102217",
    category: "Literature",
    quantity: 4,
    available_quantity: 2,
    description: "Classic fantasy adventure novel.",
    image_url: "https://images.unsplash.com/photo-1508898578281-774ac4893c0c?w=400&auto=format&fit=crop&q=60"
  },
  {
    id: "B-004",
    title: "A Brief History of Time",
    author: "Stephen Hawking",
    isbn: "9780553380163",
    category: "Science Fiction",
    quantity: 3,
    available_quantity: 1,
    description: "Explaining cosmology and astrophysics to laypeople.",
    image_url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&auto=format&fit=crop&q=60"
  },
  {
    id: "B-005",
    title: "Design Patterns",
    author: "Erich Gamma",
    isbn: "9780201633610",
    category: "Computer Science",
    quantity: 2,
    available_quantity: 2,
    description: "Elements of Reusable Object-Oriented Software.",
    image_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=60"
  },
  {
    id: "B-006",
    title: "The Alchemist",
    author: "Paulo Coelho",
    isbn: "9780061122415",
    category: "Literature",
    quantity: 8,
    available_quantity: 8,
    description: "An allegorical novel about following your dreams.",
    image_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&auto=format&fit=crop&q=60"
  },
  {
    id: "B-007",
    title: "Sapiens",
    author: "Yuval Noah Harari",
    isbn: "9780062316097",
    category: "History",
    quantity: 4,
    available_quantity: 4,
    description: "A brief history of humankind.",
    image_url: "https://images.unsplash.com/photo-1447069387593-a5de0862481e?w=400&auto=format&fit=crop&q=60"
  },
  {
    id: "B-008",
    title: "Calculus",
    author: "Michael Spivak",
    isbn: "9780914098911",
    category: "Mathematics",
    quantity: 1,
    available_quantity: 0,
    description: "A classic introduction to mathematical analysis.",
    image_url: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&auto=format&fit=crop&q=60"
  }
];

export const INITIAL_FOOD_ITEMS = [
  {
    id: "F-001",
    name: "Veggie Burger",
    category: "Snacks",
    price: 80.00,
    quantity: 30,
    low_stock_threshold: 10,
    description: "Delicious vegetable patty with fresh lettuce and sauces.",
    image_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=60"
  },
  {
    id: "F-002",
    name: "Cheese Pizza (Personal)",
    category: "Main Course",
    price: 150.00,
    quantity: 15,
    low_stock_threshold: 5,
    description: "Single-serve thin crust pizza loaded with mozzarella cheese.",
    image_url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=60"
  },
  {
    id: "F-003",
    name: "Club Sandwich",
    category: "Snacks",
    price: 90.00,
    quantity: 3,
    low_stock_threshold: 5,
    description: "Double decker toasted bread sandwich with loaded fillings.",
    image_url: "https://images.unsplash.com/photo-1539252554453-80ab65ce3586?w=400&auto=format&fit=crop&q=60"
  },
  {
    id: "F-004",
    name: "Cold Coffee",
    category: "Beverages",
    price: 60.00,
    quantity: 40,
    low_stock_threshold: 8,
    description: "Rich blended coffee served chilled with vanilla ice cream.",
    image_url: "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=400&auto=format&fit=crop&q=60"
  },
  {
    id: "F-005",
    name: "Masala Tea",
    category: "Beverages",
    price: 20.00,
    quantity: 100,
    low_stock_threshold: 15,
    description: "Indian spiced milk tea brewed to perfection.",
    image_url: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&auto=format&fit=crop&q=60"
  },
  {
    id: "F-006",
    name: "French Fries",
    category: "Snacks",
    price: 70.00,
    quantity: 25,
    low_stock_threshold: 5,
    description: "Crispy salted potato fries served with tomato ketchup.",
    image_url: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&auto=format&fit=crop&q=60"
  },
  {
    id: "F-007",
    name: "Garlic Bread",
    category: "Snacks",
    price: 50.00,
    quantity: 0,
    low_stock_threshold: 5,
    description: "Toasted garlic bread slices brushed with butter.",
    image_url: "https://images.unsplash.com/photo-1544982503-9f984c14501a?w=400&auto=format&fit=crop&q=60"
  },
  {
    id: "F-008",
    name: "Banana",
    category: "Fruits",
    price: 10.00,
    quantity: 50,
    low_stock_threshold: 10,
    description: "Fresh organic yellow banana.",
    image_url: ""
  }
];
