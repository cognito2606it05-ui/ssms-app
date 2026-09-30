// ============================================================
//  Single source of truth for the seeded RBAC model.
//  Flags string letters: r=read w=write e=edit d=delete a=approve x=export
// ============================================================

export const MODULES = [
  { key: 'dashboard',   name: 'Dashboard' },
  { key: 'students',    name: 'Student Information' },
  { key: 'teachers',    name: 'Teacher Management' },
  { key: 'staff',       name: 'Staff Management' },
  { key: 'attendance',  name: 'Attendance' },
  { key: 'fees',        name: 'Fees & Collection' },
  { key: 'exams',       name: 'Exams & Results' },
  { key: 'timetable',   name: 'Timetable' },
  { key: 'library',     name: 'Library' },
  { key: 'transport',   name: 'Transport' },
  { key: 'hostel',      name: 'Hostel' },
  { key: 'canteen',     name: 'Canteen' },
  { key: 'store',       name: 'Store / Inventory' },
  { key: 'sports',      name: 'Sports' },
  { key: 'maintenance', name: 'Maintenance' },
  { key: 'security',    name: 'Security / Gate' },
  { key: 'frontoffice', name: 'Front Office' },
  { key: 'lms',         name: 'LMS / Learning' },
  { key: 'reports',     name: 'Reports & Analytics' },
  { key: 'audit',       name: 'Security & Audit Log' },
  { key: 'rbac',        name: 'Roles & Permissions' },
  { key: 'users',       name: 'User Management' },
  { key: 'settings',    name: 'Settings' },
].map((m, i) => ({ ...m, sort: i }));

// 17-role hierarchy. level 1 = highest authority.
export const ROLES = [
  { key: 'super_admin',     name: 'Super Admin',                level: 1, access_pct: 100, tier: 'basic',   description: 'Full, unrestricted system control.' },
  { key: 'management',      name: 'Management',                 level: 2, access_pct: 85,  tier: 'basic',   description: 'Principal / Dean / Director.' },
  { key: 'admin_staff',     name: 'Administrative Staff',       level: 3, access_pct: 60,  tier: 'basic',   description: 'Office administration and records.' },
  { key: 'reception',       name: 'Reception',                  level: 3, access_pct: 60,  tier: 'basic',   description: 'Front desk and visitor handling.' },
  { key: 'security_staff',  name: 'Security Staff',             level: 4, access_pct: 35,  tier: 'premium', description: 'Gate, visitors and campus security.' },
  { key: 'teacher',         name: 'Teacher',                    level: 5, access_pct: 50,  tier: 'basic',   description: 'Teaching, attendance and results.' },
  { key: 'lab_technician',  name: 'Lab Technician',             level: 5, access_pct: 50,  tier: 'premium', description: 'Laboratory equipment and inventory.' },
  { key: 'librarian',       name: 'Librarian',                  level: 6, access_pct: 45,  tier: 'basic',   description: 'Library catalogue and lending.' },
  { key: 'canteen_staff',   name: 'Canteen Staff',              level: 6, access_pct: 40,  tier: 'premium', description: 'Canteen menu, stock and sales.' },
  { key: 'store_staff',     name: 'Store / Stationery Staff',   level: 6, access_pct: 45,  tier: 'premium', description: 'Stationery and general store.' },
  { key: 'sports_coord',    name: 'Sports Coordinator',         level: 6, access_pct: 45,  tier: 'premium', description: 'Sports, events and equipment.' },
  { key: 'electrician',     name: 'Electrician / Maintenance',  level: 7, access_pct: 30,  tier: 'premium', description: 'Facilities and maintenance tickets.' },
  { key: 'hostel_super',    name: 'Hostel Supervisor',          level: 7, access_pct: 30,  tier: 'premium', description: 'Hostel residents and discipline.' },
  { key: 'cleaning_staff',  name: 'Cleaning Staff',             level: 7, access_pct: 20,  tier: 'premium', description: 'Housekeeping task lists.' },
  { key: 'driver_staff',    name: 'Driver / Transportation',    level: 8, access_pct: 25,  tier: 'premium', description: 'Routes, vehicles and trips.' },
  { key: 'student',         name: 'Student',                    level: 9, access_pct: 35,  tier: 'basic',   description: 'Personal academics and resources.' },
  { key: 'parent',          name: 'Parent',                     level: 9, access_pct: 40,  tier: 'basic',   description: "Ward's progress and payments." },
];

// Per-role module access profiles.
export const PROFILES = {
  super_admin: Object.fromEntries(MODULES.map((m) => [m.key, 'rwedax'])),

  management: {
    dashboard: 'rx', students: 'rwex', teachers: 'rwex', staff: 'rwex', attendance: 'rweax',
    fees: 'rweax', exams: 'rweax', timetable: 'rwex', library: 'rx', transport: 'rwex',
    hostel: 'rwex', canteen: 'rx', store: 'rx', sports: 'rx', maintenance: 'rweax',
    security: 'rx', frontoffice: 'rwex', lms: 'rwex', reports: 'rx', audit: 'r',
    rbac: 'r', users: 'rwe', settings: 'rwe',
  },

  admin_staff: {
    dashboard: 'r', students: 'rwex', fees: 'rwex', attendance: 'rwex', timetable: 'rwex',
    frontoffice: 'rwex', exams: 'rx', reports: 'rx', users: 'r', library: 'r',
    transport: 'r', store: 'r',
  },

  reception: {
    dashboard: 'r', frontoffice: 'rwex', students: 'r', attendance: 'r', transport: 'r',
    library: 'r', fees: 'r',
  },

  security_staff: {
    dashboard: 'r', security: 'rwex', frontoffice: 'r', attendance: 'r', transport: 'r', students: 'r',
  },

  teacher: {
    dashboard: 'r', students: 'rx', attendance: 'rwex', exams: 'rwex', timetable: 'r',
    lms: 'rwex', reports: 'r', library: 'r',
  },

  lab_technician: {
    dashboard: 'r', store: 'rwe', maintenance: 'r', students: 'r', reports: 'r', exams: 'r',
  },

  librarian: { dashboard: 'r', library: 'rwedax', students: 'r', reports: 'r' },

  canteen_staff: { dashboard: 'r', canteen: 'rwedax', store: 'r', reports: 'r' },

  store_staff: { dashboard: 'r', store: 'rwedax', reports: 'r' },

  sports_coord: { dashboard: 'r', sports: 'rwedax', students: 'r', timetable: 'r', reports: 'r' },

  electrician: { dashboard: 'r', maintenance: 'rwedax', store: 'r' },

  hostel_super: { dashboard: 'r', hostel: 'rwedax', students: 'r', attendance: 'rw', reports: 'r' },

  cleaning_staff: { dashboard: 'r', maintenance: 'rw' },

  driver_staff: { dashboard: 'r', transport: 'rwex', students: 'r' },

  student: {
    dashboard: 'r', timetable: 'r', exams: 'r', library: 'r', lms: 'r', fees: 'r', attendance: 'r',
  },

  parent: {
    dashboard: 'r', attendance: 'r', exams: 'r', fees: 'rw', transport: 'r', lms: 'r',
  },
};

export function flagsToPerm(flags = '') {
  return {
    can_read: flags.includes('r'),
    can_write: flags.includes('w'),
    can_edit: flags.includes('e'),
    can_delete: flags.includes('d'),
    can_approve: flags.includes('a'),
    can_export: flags.includes('x'),
  };
}

// Demo users: one per role, plus a multi-role user for role switching.
export const DEMO_PASSWORD = 'Passw0rd!';
export const DEMO_USERS = [
  ...ROLES.map((r) => ({
    email: `${r.key}@ssms.local`,
    name: `${r.name} Demo`,
    primary_role: r.key,
    roles: [r.key],
  })),
  {
    email: 'multi@ssms.local',
    name: 'Multi-Role Demo (Teacher + Hostel)',
    primary_role: 'teacher',
    roles: ['teacher', 'hostel_super'],
  },
];
