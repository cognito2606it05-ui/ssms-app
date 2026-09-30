import crypto from 'node:crypto';
import express from 'express';
import cors from 'cors';
import { q, pool } from './db.js';
import { hashPassword, verifyPassword, signAccess, signRefresh, verify } from './auth.js';
import { authenticate, requirePermission } from './middleware.js';
import { flagsToPerm } from './rbac-config.js';
import http from 'node:http';
import { mountAdmin } from './admin.js';
import { mountStudents } from './students.js';
import { mountAttendance } from './attendance.js';
import { mountWallet } from './wallet.js';
import { mountFees } from './fees.js';
import { mountPortals } from './portals.js';
import { initWs } from './ws.js';

import { recordCall, recordError } from './metrics.js';

const app = express();
app.set('trust proxy', true);
app.use(cors());
app.use(express.json());

// Count every API call (and whether it errored) for the live metrics graph.
app.use((req, res, next) => {
  res.on('finish', () => recordCall(res.statusCode >= 500));
  next();
});

const PORT = Number(process.env.PORT || 4000);

/* ---------- helpers ---------- */

async function loadUserByEmail(email) {
  const { rows } = await q('SELECT * FROM users WHERE email=$1', [email.toLowerCase()]);
  if (!rows[0]) return null;
  const user = rows[0];
  const roleRows = await q('SELECT role_key FROM user_roles WHERE user_id=$1', [user.id]);
  user.roles = roleRows.rows.map((r) => r.role_key);
  return user;
}

// Highest tier among the user's roles ('premium' if any premium role is held).
async function tierForRoles(roles) {
  if (!roles.length) return 'basic';
  const { rows } = await q('SELECT tier FROM roles WHERE key = ANY($1)', [roles]);
  return rows.some((r) => r.tier === 'premium') ? 'premium' : 'basic';
}

async function permissionsForRole(roleKey) {
  const { rows } = await q(
    `SELECT module_key, can_read, can_write, can_edit, can_delete, can_approve, can_export
       FROM role_permissions WHERE role_key=$1 ORDER BY module_key`,
    [roleKey],
  );
  const map = {};
  for (const r of rows) {
    map[r.module_key] = {
      read: r.can_read, write: r.can_write, edit: r.can_edit,
      delete: r.can_delete, approve: r.can_approve, export: r.can_export,
    };
  }
  return map;
}

async function roleMeta(roleKey) {
  const { rows } = await q('SELECT key, name, level, access_pct, tier, is_custom FROM roles WHERE key=$1', [roleKey]);
  return rows[0] || null;
}

async function createSession(user, activeRole, req) {
  const sid = crypto.randomUUID();
  await q(
    'INSERT INTO sessions (id, user_id, email, role, ip, user_agent) VALUES ($1,$2,$3,$4,$5,$6)',
    [sid, user.id, user.email, activeRole, req?.ip || req?.socket?.remoteAddress || null, req?.headers?.['user-agent'] || null],
  );
  return sid;
}

async function sessionPayload(user, activeRole, sid) {
  user.tier = await tierForRoles(user.roles);
  const accessToken = signAccess(user, activeRole, sid);
  const refreshToken = signRefresh(user);
  return {
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, name: user.name },
    roles: user.roles,
    activeRole,
    activeRoleMeta: await roleMeta(activeRole),
    tier: user.tier,
    permissions: await permissionsForRole(activeRole),
  };
}

/* ---------- health ---------- */
app.get('/api/health', async (_req, res) => {
  try { await q('SELECT 1'); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

/* ---------- auth ---------- */
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'bad_request', message: 'Email and password required.' });
  const ip = req.ip || req.socket?.remoteAddress || null;
  const user = await loadUserByEmail(email);
  const ok = user && verifyPassword(password, user.password_hash);
  await q('INSERT INTO login_attempts (email, ip, success, country) VALUES ($1,$2,$3,$4)', [email, ip, !!ok, 'India']);
  if (!ok) {
    return res.status(401).json({ error: 'invalid_credentials', message: 'Incorrect email or password.' });
  }
  if (user.locked) {
    return res.status(403).json({ error: 'account_locked', message: `Account locked: ${user.lock_reason || 'contact administrator'}.` });
  }
  const sid = await createSession(user, user.primary_role, req);
  res.json(await sessionPayload(user, user.primary_role, sid));
});

app.post('/api/auth/refresh', async (req, res) => {
  const { refreshToken } = req.body || {};
  try {
    const decoded = verify(refreshToken);
    if (decoded.type !== 'refresh') throw new Error('not a refresh token');
    const { rows } = await q('SELECT * FROM users WHERE id=$1', [decoded.sub]);
    const user = rows[0];
    if (!user) throw new Error('user gone');
    const roleRows = await q('SELECT role_key FROM user_roles WHERE user_id=$1', [user.id]);
    user.roles = roleRows.rows.map((r) => r.role_key);
    const sid = await createSession(user, user.primary_role, req);
    res.json(await sessionPayload(user, user.primary_role, sid));
  } catch {
    res.status(401).json({ error: 'invalid_refresh', message: 'Could not refresh session.' });
  }
});

// Role switching for multi-role staff. Issues a fresh token (refresh-on-role-change).
app.post('/api/auth/switch-role', authenticate, async (req, res) => {
  const { role } = req.body || {};
  const { rows } = await q('SELECT * FROM users WHERE id=$1', [req.user.sub]);
  const user = rows[0];
  if (!user) return res.status(401).json({ error: 'invalid_token' });
  const roleRows = await q('SELECT role_key FROM user_roles WHERE user_id=$1', [user.id]);
  user.roles = roleRows.rows.map((r) => r.role_key);
  if (!user.roles.includes(role)) {
    return res.status(403).json({ error: 'forbidden', message: `You do not hold the role '${role}'.` });
  }
  const sid = await createSession(user, role, req);
  res.json(await sessionPayload(user, role, sid));
});

app.get('/api/me', authenticate, async (req, res) => {
  res.json({
    user: { id: req.user.sub, email: req.user.email, name: req.user.name },
    roles: req.user.roles,
    activeRole: req.user.activeRole,
    activeRoleMeta: await roleMeta(req.user.activeRole),
    tier: req.user.tier,
    permissions: await permissionsForRole(req.user.activeRole),
  });
});

app.get('/api/permissions/me', authenticate, async (req, res) => {
  res.json({ activeRole: req.user.activeRole, permissions: await permissionsForRole(req.user.activeRole) });
});

/* ---------- catalogue ---------- */
app.get('/api/roles', async (_req, res) => {
  const { rows } = await q('SELECT key, name, level, access_pct, tier, is_custom, cloned_from, description FROM roles ORDER BY level, name');
  res.json(rows);
});

app.get('/api/modules', async (_req, res) => {
  const { rows } = await q('SELECT key, name, sort FROM modules ORDER BY sort');
  res.json(rows);
});

// Full matrix (guarded: needs rbac read on the active role).
app.get('/api/matrix', authenticate, requirePermission('rbac', 'read'), async (_req, res) => {
  const { rows } = await q(
    `SELECT role_key, module_key, can_read, can_write, can_edit, can_delete, can_approve, can_export
       FROM role_permissions ORDER BY role_key, module_key`,
  );
  res.json(rows);
});

/* ---------- custom roles (Premium) ---------- */
// Clone an existing role into a new premium custom role (+ copy its permissions).
app.post('/api/custom-roles', authenticate, requirePermission('rbac', 'write'), async (req, res) => {
  const { name, cloneFrom } = req.body || {};
  if (!name || !cloneFrom) return res.status(400).json({ error: 'bad_request', message: 'name and cloneFrom required.' });
  const base = await roleMeta(cloneFrom);
  if (!base) return res.status(404).json({ error: 'not_found', message: 'Source role not found.' });
  const key = `custom_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}_${Date.now().toString(36)}`;
  await q(
    `INSERT INTO roles (key, name, level, access_pct, tier, is_custom, cloned_from, description)
     VALUES ($1,$2,$3,$4,'premium',TRUE,$5,$6)`,
    [key, name, base.level, base.access_pct, cloneFrom, `Custom role cloned from ${base.name}.`],
  );
  await q(
    `INSERT INTO role_permissions
       (role_key, module_key, can_read, can_write, can_edit, can_delete, can_approve, can_export)
     SELECT $1, module_key, can_read, can_write, can_edit, can_delete, can_approve, can_export
       FROM role_permissions WHERE role_key=$2`,
    [key, cloneFrom],
  );
  res.status(201).json({ key, ...(await roleMeta(key)), permissions: await permissionsForRole(key) });
});

// Toggle/replace permissions on a custom role.
app.put('/api/custom-roles/:key/permissions', authenticate, requirePermission('rbac', 'edit'), async (req, res) => {
  const { key } = req.params;
  const meta = await roleMeta(key);
  if (!meta) return res.status(404).json({ error: 'not_found' });
  if (!meta.is_custom) return res.status(400).json({ error: 'immutable', message: 'Only custom roles can be edited.' });
  const updates = Array.isArray(req.body?.permissions) ? req.body.permissions : [];
  for (const u of updates) {
    const p = u.flags !== undefined ? flagsToPerm(u.flags) : {
      can_read: !!u.read, can_write: !!u.write, can_edit: !!u.edit,
      can_delete: !!u.delete, can_approve: !!u.approve, can_export: !!u.export,
    };
    await q(
      `INSERT INTO role_permissions
         (role_key, module_key, can_read, can_write, can_edit, can_delete, can_approve, can_export)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (role_key, module_key) DO UPDATE SET
         can_read=$3, can_write=$4, can_edit=$5, can_delete=$6, can_approve=$7, can_export=$8`,
      [key, u.module, p.can_read, p.can_write, p.can_edit, p.can_delete, p.can_approve, p.can_export],
    );
  }
  res.json({ key, permissions: await permissionsForRole(key) });
});

app.delete('/api/custom-roles/:key', authenticate, requirePermission('rbac', 'delete'), async (req, res) => {
  const meta = await roleMeta(req.params.key);
  if (!meta) return res.status(404).json({ error: 'not_found' });
  if (!meta.is_custom) return res.status(400).json({ error: 'immutable', message: 'Only custom roles can be deleted.' });
  await q('DELETE FROM roles WHERE key=$1', [req.params.key]);
  res.json({ ok: true });
});

/* ---------- audit (Super Admin security panel) ---------- */
app.get('/api/audit/denials', authenticate, requirePermission('audit', 'read'), async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  const { rows } = await q(
    `SELECT id, user_id, email, active_role, module_key, action, method, path, reason, created_at
       FROM audit_denials ORDER BY created_at DESC LIMIT $1`,
    [limit],
  );
  res.json(rows);
});

/* ---------- demonstrative guarded resource ----------
   GET /api/secure/:module  -> requires READ on :module for the active role.
   Used by the frontend to prove guards + generate audit denials. */
app.get('/api/secure/:module', authenticate, (req, res, next) => {
  return requirePermission(req.params.module, 'read')(req, res, next);
}, (req, res) => {
  res.json({ ok: true, module: req.params.module, role: req.user.activeRole, message: 'Access granted.' });
});

// Mount the Super Admin Master Control Panel API.
mountAdmin(app, { authenticate, requirePermission });
// Mount the Student Management API (RBAC-guarded via requirePermission('students', …)).
mountStudents(app, { authenticate, requirePermission });
// Mount the multi-modal Attendance API (RBAC-guarded via requirePermission('attendance', …)).
mountAttendance(app, { authenticate, requirePermission });
// Mount the Smart ID Card + Digital Wallet API (double-entry ledger, RBAC-guarded).
mountWallet(app, { authenticate, requirePermission });
// Mount the Fee Management API (double-entry fee ledger, idempotent payments, webhooks).
mountFees(app, { authenticate, requirePermission });
// Mount the Parent and Student Portals API.
mountPortals(app, { authenticate });

/* ============================================================
   GENERIC FIRESTORE-LIKE COLLECTIONS & REGISTRATION APIs
   ============================================================ */

const LEGACY_ROLES = {
  super_admin: 'Super Admin',
  management: 'Management',
  admin_staff: 'Accounts',
  reception: 'Reception',
  teacher: 'Teacher',
  lab_technician: 'Teacher',
  student: 'Student',
  parent: 'Parent',
  librarian: 'Librarian',
  canteen_staff: 'Canteen Manager',
  store_staff: 'Store',
  security_staff: 'Security',
  electrician: 'Electrician',
  cleaning_staff: 'Attender'
};

const DB_ROLES = {
  'Super Admin': 'super_admin',
  'Management': 'management',
  'Teacher': 'teacher',
  'Student': 'student',
  'Parent': 'parent',
  'Librarian': 'librarian',
  'Canteen Manager': 'canteen_staff',
  'Store': 'store_staff',
  'Security': 'security_staff',
  'Electrician': 'electrician',
  'Attender': 'cleaning_staff',
  'Reception': 'reception'
};

function legacyRoleOf(dbRole) {
  return LEGACY_ROLES[dbRole] || 'Student';
}

function dbRoleOf(legacyRole) {
  return DB_ROLES[legacyRole] || 'student';
}

function legacyRoleTypeOf(dbRole) {
  const legacy = legacyRoleOf(dbRole);
  if (['Super Admin', 'Management', 'Teacher', 'Student'].includes(legacy)) {
    return 'academic';
  }
  return 'non-academic';
}

// Public registration endpoint
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name, role } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'bad_request', message: 'Email and password required.' });
  }
  try {
    const dbRole = dbRoleOf(role || 'Student');
    const hash = hashPassword(password);
    const { rows } = await q(
      'INSERT INTO users (email, password_hash, name, primary_role) VALUES ($1,$2,$3,$4) RETURNING id',
      [email.toLowerCase(), hash, name || email.split('@')[0], dbRole]
    );
    const userId = rows[0].id;
    await q('INSERT INTO user_roles (user_id, role_key) VALUES ($1,$2)', [userId, dbRole]);
    res.status(201).json({ id: userId, email, name, role });
  } catch (e) {
    res.status(500).json({ error: 'server_error', message: e.message });
  }
});

// Generic collection fetch endpoint
app.get('/api/collections/:colName', authenticate, async (req, res) => {
  const { colName } = req.params;
  try {
    if (colName === 'users') {
      const { rows: sqlUsers } = await q('SELECT * FROM users');
      const { rows: mockUsers } = await q("SELECT * FROM mock_collections WHERE collection_name = 'users'");
      const mockMap = new Map(mockUsers.map(m => [m.id, m.data]));
      const result = sqlUsers.map(u => {
        const mock = mockMap.get(String(u.id)) || mockMap.get(u.email) || {};
        return {
          user_id: String(u.id),
          email: u.email,
          role: mock.role || legacyRoleOf(u.primary_role),
          role_type: mock.role_type || legacyRoleTypeOf(u.primary_role),
          name: u.name || mock.name || u.email.split('@')[0],
          phone: mock.phone || '',
          linked_id: mock.linked_id || '',
          photo: mock.photo || '',
          ...mock
        };
      });
      return res.json(result);
    }

    if (colName === 'students') {
      const { rows: sqlStudents } = await q('SELECT * FROM students');
      const { rows: mockStudents } = await q("SELECT * FROM mock_collections WHERE collection_name = 'students'");
      const mockMap = new Map(mockStudents.map(m => [m.id, m.data]));
      const { rows: guardians } = await q('SELECT * FROM student_guardians');
      const { rows: cards } = await q('SELECT * FROM id_cards');
      const result = sqlStudents.map(s => {
        const mock = mockMap.get(String(s.admission_number)) || mockMap.get(String(s.id)) || {};
        const g = guardians.find(gu => gu.student_id === s.id) || {};
        const c = cards.find(ca => ca.student_id === s.id) || {};
        return {
          student_id: s.admission_number,
          name: s.name,
          class_id: s.class,
          class: s.class,
          section: s.section,
          parent_id: g.parent_user_id ? String(g.parent_user_id) : (mock.parent_id || ''),
          subjects: mock.subjects || ['English', 'Telugu', 'Hindi', 'Maths', 'Science', 'Social'],
          summary: {
            attendance_percentage: Number(s.attendance_pct || 95.0),
            latest_grade: mock.summary?.latest_grade || 'A',
            fee_status: s.fee_status || 'Pending'
          },
          email: s.email || '',
          photo: s.photo_url || mock.photo || '',
          phone: s.phone || mock.phone || '',
          dob: s.dob ? (typeof s.dob === 'string' ? s.dob : s.dob.toISOString().slice(0,10)) : (mock.dob || ''),
          gender: s.gender || mock.gender || '',
          fatherName: s.emergency1_name || mock.fatherName || g.name || '',
          motherName: mock.motherName || '',
          address: s.address || mock.address || '',
          guardian: {
            name: g.name || mock.guardian?.name || '',
            phone: g.phone || mock.guardian?.phone || '',
            email: g.email || mock.guardian?.email || '',
            relation: g.relation || mock.guardian?.relation || 'Father',
            address: s.address || mock.guardian?.address || '',
            photo: mock.guardian?.photo || ''
          },
          fees: {
            total: Number(mock.fees?.total ?? 50000),
            paid: Number(mock.fees?.paid ?? (s.fee_status === 'Paid' ? 50000 : 25000)),
            status: s.fee_status || 'Pending',
            history: mock.fees?.history || []
          },
          ...mock
        };
      });
      return res.json(result);
    }

    if (colName === 'teachers') {
      const { rows: sqlUsers } = await q("SELECT * FROM users WHERE primary_role = 'teacher'");
      const { rows: mockTeachers } = await q("SELECT * FROM mock_collections WHERE collection_name = 'teachers'");
      const mockMap = new Map(mockTeachers.map(m => [m.id, m.data]));
      const result = sqlUsers.map(u => {
        const mock = mockMap.get(`T-${u.id}`) || mockMap.get(u.email) || {};
        return {
          teacher_id: `T-${u.id}`,
          name: u.name,
          email: u.email,
          assigned_classes: mock.assigned_classes || ['10-A', '9-A', '8-A'],
          subjects: mock.subjects || ['Maths'],
          photo: mock.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=T-${u.id}`,
          phone: mock.phone || '9876543210',
          salary: mock.salary || { basic: 50000, allowances: 5000, history: [] },
          ...mock
        };
      });
      return res.json(result);
    }

    if (colName === 'parents') {
      const { rows: sqlUsers } = await q("SELECT * FROM users WHERE primary_role = 'parent'");
      const { rows: mockParents } = await q("SELECT * FROM mock_collections WHERE collection_name = 'parents'");
      const mockMap = new Map(mockParents.map(m => [m.id, m.data]));
      const { rows: guardians } = await q("SELECT sg.parent_user_id, s.admission_number FROM student_guardians sg JOIN students s ON s.id = sg.student_id WHERE sg.parent_user_id IS NOT NULL");
      const result = sqlUsers.map(u => {
        const mock = mockMap.get(`P-${u.id}`) || mockMap.get(u.email) || {};
        const linked = guardians.filter(g => g.parent_user_id === u.id).map(g => g.admission_number);
        return {
          parent_id: `P-${u.id}`,
          name: u.name,
          email: u.email,
          phone: mock.phone || '9876543210',
          linked_students: linked.length ? linked : (mock.linked_students || []),
          ...mock
        };
      });
      return res.json(result);
    }

    if (colName === 'staff') {
      const staffRoles = ['reception', 'security_staff', 'librarian', 'canteen_staff', 'store_staff', 'sports_coord', 'electrician', 'hostel_super', 'cleaning_staff', 'driver_staff', 'lab_technician', 'admin_staff'];
      const { rows: sqlUsers } = await q("SELECT * FROM users WHERE primary_role = ANY($1)", [staffRoles]);
      const { rows: mockStaff } = await q("SELECT * FROM mock_collections WHERE collection_name = 'staff'");
      const mockMap = new Map(mockStaff.map(m => [m.id, m.data]));
      const result = sqlUsers.map(u => {
        const mock = mockMap.get(`ST-${u.id}`) || mockMap.get(u.email) || {};
        return {
          staff_id: `ST-${u.id}`,
          name: u.name,
          email: u.email,
          role: legacyRoleOf(u.primary_role),
          module_access: mock.module_access || [],
          ...mock
        };
      });
      return res.json(result);
    }

    if (colName === 'busRoutes') {
      const { rows: sqlRoutes } = await q("SELECT * FROM bus_tracking");
      const { rows: mockRoutes } = await q("SELECT * FROM mock_collections WHERE collection_name = 'busRoutes'");
      const mockMap = new Map(mockRoutes.map(m => [m.id, m.data]));
      const result = sqlRoutes.map(r => {
        const mock = mockMap.get(String(r.id)) || {};
        return {
          id: String(r.id),
          routeName: r.route_name,
          driverName: r.driver_name,
          driverPhone: r.driver_phone,
          busNumber: mock.busNumber || `BUS-${r.id}`,
          capacity: mock.capacity || 40,
          studentsCount: mock.studentsCount || 20,
          stops: mock.stops || [{ name: 'Main Gate', time: '07:30 AM' }],
          status: r.status === 'active' ? 'On Time' : 'Delayed',
          ...mock
        };
      });
      return res.json(result);
    }

    if (colName === 'homeworks') {
      const { rows: sqlHomeworks } = await q("SELECT * FROM assignments");
      const { rows: mockHomeworks } = await q("SELECT * FROM mock_collections WHERE collection_name = 'homeworks'");
      const mockMap = new Map(mockHomeworks.map(m => [m.id, m.data]));
      const result = sqlHomeworks.map(h => {
        const mock = mockMap.get(String(h.id)) || {};
        return {
          id: String(h.id),
          title: h.title,
          description: h.description,
          dueDate: h.due_date,
          class: h.class,
          section: h.section,
          subject: h.subject,
          teacherId: mock.teacherId || 'T-001',
          teacherName: mock.teacherName || 'Teacher',
          createdAt: h.created_at,
          ...mock
        };
      });
      return res.json(result);
    }

    if (colName === 'examResults') {
      const { rows: sqlMarks } = await q("SELECT * FROM exam_marks");
      const { rows: mockMarks } = await q("SELECT * FROM mock_collections WHERE collection_name = 'examResults'");
      const mockMap = new Map(mockMarks.map(m => [m.id, m.data]));
      const result = sqlMarks.map(m => {
        const mock = mockMap.get(String(m.id)) || {};
        return {
          id: String(m.id),
          student_id: String(m.student_id),
          subject: m.subject,
          examName: m.exam_name,
          marksObtained: Number(m.marks_obtained),
          maxMarks: Number(m.max_marks),
          grade: mock.grade || 'A',
          date: m.created_at,
          ...mock
        };
      });
      return res.json(result);
    }

    if (colName === 'attendance') {
      const { rows: sqlAttendance } = await q("SELECT * FROM attendance");
      const { rows: mockAttendance } = await q("SELECT * FROM mock_collections WHERE collection_name = 'attendance'");
      const mockMap = new Map(mockAttendance.map(m => [m.id, m.data]));
      const result = sqlAttendance.map(a => {
        const mock = mockMap.get(String(a.id)) || {};
        return {
          id: String(a.id),
          student_id: String(a.student_id),
          date: a.attendance_date,
          status: a.status === 'present' ? 'Present' : (a.status === 'absent' ? 'Absent' : 'Late'),
          timestamp: a.ts,
          ...mock
        };
      });
      return res.json(result);
    }

    // Default fallback to mock_collections
    const { rows } = await q("SELECT * FROM mock_collections WHERE collection_name = $1", [colName]);
    res.json(rows.map(r => ({ id: r.id, ...r.data })));
  } catch (e) {
    res.status(500).json({ error: 'server_error', message: e.message });
  }
});

// Generic collection single document fetch
app.get('/api/collections/:colName/:id', authenticate, async (req, res) => {
  const { colName, id } = req.params;
  try {
    const { rows } = await q("SELECT * FROM mock_collections WHERE collection_name = $1 AND id = $2", [colName, id]);
    if (rows.length > 0) {
      return res.json({ id: rows[0].id, ...rows[0].data });
    }
    res.status(404).json({ error: 'not_found', message: 'Document not found.' });
  } catch (e) {
    res.status(500).json({ error: 'server_error', message: e.message });
  }
});

// Generic collection add document (POST)
app.post('/api/collections/:colName', authenticate, async (req, res) => {
  const { colName } = req.params;
  const data = req.body || {};
  const id = data.id || Math.random().toString(36).substring(2, 15);
  try {
    // Write to PostgreSQL structured tables if applicable
    if (colName === 'users') {
      const dbRole = dbRoleOf(data.role);
      const hash = hashPassword(ROLE_PASSWORDS[data.role] || 'Passw0rd!');
      const { rows } = await q('INSERT INTO users (email, password_hash, name, primary_role) VALUES ($1,$2,$3,$4) RETURNING id',
        [data.email.toLowerCase(), hash, data.name, dbRole]);
      await q('INSERT INTO user_roles (user_id, role_key) VALUES ($1,$2)', [rows[0].id, dbRole]);
    } else if (colName === 'students') {
      await q(`
        INSERT INTO students (admission_number, roll_number, name, class, section, email, phone, status, fee_status, attendance_pct)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      `, [
        data.student_id,
        data.student_id.split('-')[1] || '1',
        data.name,
        data.class,
        data.section || 'A',
        data.email,
        data.phone || '',
        'Active',
        data.fees?.status || 'Pending',
        data.summary?.attendance_percentage || 95.0
      ]);
    } else if (colName === 'homeworks') {
      await q(`
        INSERT INTO assignments (title, description, class, section, subject, due_date)
        VALUES ($1,$2,$3,$4,$5,$6)
      `, [data.title, data.description, data.class, data.section, data.subject, data.dueDate || new Date()]);
    }

    // Write to mock_collections
    await q(`
      INSERT INTO mock_collections (id, collection_name, data)
      VALUES ($1, $2, $3)
      ON CONFLICT (id) DO UPDATE SET data = $3, updated_at = now()
    `, [id, colName, JSON.stringify(data)]);

    res.status(201).json({ id, ...data });
  } catch (e) {
    res.status(500).json({ error: 'server_error', message: e.message });
  }
});

// Generic collection update document (PUT)
app.put('/api/collections/:colName/:id', authenticate, async (req, res) => {
  const { colName, id } = req.params;
  const data = req.body || {};
  try {
    // Update structured tables if applicable
    if (colName === 'users') {
      const dbRole = dbRoleOf(data.role);
      await q('UPDATE users SET name=$1, primary_role=$2 WHERE email=$3', [data.name, dbRole, data.email.toLowerCase()]);
    } else if (colName === 'students') {
      await q(`
        UPDATE students SET name=$1, class=$2, section=$3, email=$4, phone=$5, fee_status=$6, attendance_pct=$7
        WHERE admission_number=$8
      `, [
        data.name,
        data.class,
        data.section,
        data.email,
        data.phone,
        data.fees?.status || 'Pending',
        data.summary?.attendance_percentage || 95.0,
        id
      ]);
    } else if (colName === 'homeworks') {
      await q(`
        UPDATE assignments SET title=$1, description=$2, class=$3, section=$4, subject=$5, due_date=$6
        WHERE id = $7
      `, [data.title, data.description, data.class, data.section, data.subject, data.dueDate, parseInt(id) || 0]);
    }

    // Update mock_collections
    // Merge existing data if available
    const existing = await q("SELECT data FROM mock_collections WHERE id = $1", [id]);
    const merged = existing.rows.length > 0 ? { ...existing.rows[0].data, ...data } : data;

    await q(`
      INSERT INTO mock_collections (id, collection_name, data)
      VALUES ($1, $2, $3)
      ON CONFLICT (id) DO UPDATE SET data = $3, updated_at = now()
    `, [id, colName, JSON.stringify(merged)]);

    res.json({ id, ...merged });
  } catch (e) {
    res.status(500).json({ error: 'server_error', message: e.message });
  }
});

// Generic collection delete document (DELETE)
app.delete('/api/collections/:colName/:id', authenticate, async (req, res) => {
  const { colName, id } = req.params;
  try {
    // Delete from structured tables if applicable
    if (colName === 'users') {
      // Find the email first from mock or directly delete
      const mock = await q("SELECT data FROM mock_collections WHERE id=$1", [id]);
      if (mock.rows.length > 0) {
        await q("DELETE FROM users WHERE email = $1", [mock.rows[0].data.email.toLowerCase()]);
      }
    } else if (colName === 'students') {
      await q("DELETE FROM students WHERE admission_number = $1", [id]);
    } else if (colName === 'homeworks') {
      await q("DELETE FROM assignments WHERE id = $1", [parseInt(id) || 0]);
    }

    // Delete from mock_collections
    await q("DELETE FROM mock_collections WHERE id = $1 AND collection_name = $2", [id, colName]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'server_error', message: e.message });
  }
});

// Serve video splashscreens directly from the PostgreSQL database
app.get('/api/splashscreens/:name', async (req, res, next) => {
  try {
    const { name } = req.params;
    const { rows } = await q('SELECT mime_type, data FROM portal_splashscreens WHERE name = $1', [name]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'not_found', message: 'Splashscreen not found.' });
    }
    const { mime_type, data } = rows[0];
    res.setHeader('Content-Type', mime_type);
    res.setHeader('Content-Length', data.length);
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.send(data);
  } catch (err) {
    next(err);
  }
});

// Central error handler -> feed the error tracker.
app.use((err, req, res, _next) => {
  recordError(err, req);
  console.error('API error:', err.message);
  res.status(500).json({ error: 'server_error', message: err.message });
});

// Use an explicit HTTP server so the WebSocket hub can share the port.
const server = http.createServer(app);
initWs(server);
server.listen(PORT, () => {
  console.log(`SSMS RBAC + Admin + Attendance API listening on http://localhost:${PORT}`);
});

process.on('SIGTERM', () => pool.end());
process.on('SIGINT', () => { pool.end(); process.exit(0); });
