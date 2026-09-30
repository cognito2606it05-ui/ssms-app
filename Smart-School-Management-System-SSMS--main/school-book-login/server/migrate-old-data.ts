import { q, pool } from './db.js';
import { hashPassword } from './auth.js';
import {
  MOCK_USERS,
  INITIAL_TEACHERS,
  INITIAL_STUDENTS,
  INITIAL_PARENTS,
  INITIAL_STAFF,
  INITIAL_BUS_ROUTES,
  INITIAL_EXAM_RESULTS,
  ROLE_PASSWORDS,
  INITIAL_BOOKS,
  INITIAL_FOOD_ITEMS
} from '../src/constants';

const DB_ROLES: Record<string, string> = {
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

async function main() {
  console.log('--- STARTING SSMS DATA MIGRATION ---');

  // 1. Create mock_collections table
  console.log('› Creating mock_collections table...');
  await q(`
    CREATE TABLE IF NOT EXISTS mock_collections (
      id TEXT PRIMARY KEY,
      collection_name TEXT NOT NULL,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_mock_collections_name ON mock_collections(collection_name);
  `);

  // 2. Clear old data from these tables to avoid duplication
  console.log('› Resetting users, student/parent portal tables...');
  await q(`
    TRUNCATE users, user_roles, students, student_guardians, id_cards,
             assignments, exam_marks, bus_tracking, mock_collections,
             attendance RESTART IDENTITY CASCADE
  `);

  // Seed default roles if not present
  console.log('› Ensuring roles are present in database...');
  const roles = [
    { key: 'super_admin', name: 'Super Admin', level: 100, access_pct: 100 },
    { key: 'management', name: 'Management', level: 90, access_pct: 90 },
    { key: 'teacher', name: 'Teacher', level: 50, access_pct: 50 },
    { key: 'student', name: 'Student', level: 10, access_pct: 10 },
    { key: 'parent', name: 'Parent', level: 10, access_pct: 10 },
    { key: 'librarian', name: 'Librarian', level: 30, access_pct: 30 },
    { key: 'canteen_staff', name: 'Canteen Manager', level: 20, access_pct: 20 },
    { key: 'store_staff', name: 'Store Keeper', level: 20, access_pct: 20 },
    { key: 'security_staff', name: 'Security Staff', level: 20, access_pct: 20 },
    { key: 'electrician', name: 'Electrician', level: 20, access_pct: 20 },
    { key: 'cleaning_staff', name: 'Cleaning Staff', level: 20, access_pct: 20 },
    { key: 'reception', name: 'Receptionist', level: 30, access_pct: 30 },
    { key: 'admin_staff', name: 'Accounts Staff', level: 40, access_pct: 40 }
  ];
  for (const r of roles) {
    await q(`
      INSERT INTO roles (key, name, level, access_pct, tier)
      VALUES ($1, $2, $3, $4, 'basic')
      ON CONFLICT (key) DO NOTHING
    `, [r.key, r.name, r.level, r.access_pct]);
  }

  // 3. Migrate Users
  console.log(`› Migrating ${MOCK_USERS.length} users...`);
  const userMap = new Map<string, number>(); // email -> user.id
  for (const user of MOCK_USERS) {
    const dbRole = DB_ROLES[user.role] || 'student';
    const pw = ROLE_PASSWORDS[user.role] || 'Passw0rd!';
    const pwHash = hashPassword(pw);

    const { rows } = await q(`
      INSERT INTO users (email, password_hash, name, primary_role)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `, [user.email.toLowerCase(), pwHash, user.name, dbRole]);

    const userId = rows[0].id;
    userMap.set(user.email.toLowerCase(), userId);

    // Assign role in user_roles
    await q(`
      INSERT INTO user_roles (user_id, role_key)
      VALUES ($1, $2)
    `, [userId, dbRole]);

    // Save user metadata to mock_collections
    await q(`
      INSERT INTO mock_collections (id, collection_name, data)
      VALUES ($1, 'users', $2)
    `, [user.user_id, JSON.stringify({
      user_id: user.user_id,
      email: user.email,
      role: user.role,
      role_type: user.role_type,
      name: user.name,
      phone: user.phone || '',
      linked_id: user.linked_id || '',
      photo: user.photo || ''
    })]);
  }

  // 4. Migrate Students
  console.log(`› Migrating ${INITIAL_STUDENTS.length} students...`);
  for (const s of INITIAL_STUDENTS) {
    const { rows } = await q(`
      INSERT INTO students (
        admission_number, roll_number, name, dob, gender, address, phone, email,
        emergency1_name, emergency1_phone, class, section, status, transport_route,
        fee_status, attendance_pct
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING id
    `, [
      s.student_id,
      s.student_id.split('-')[1] || '1',
      s.name,
      s.dob || '2010-01-01',
      s.gender || 'Male',
      s.address || s.guardian?.address || '',
      s.phone || '',
      s.email,
      s.fatherName || s.guardian?.name || '',
      s.phone || s.guardian?.phone || '',
      s.class,
      s.section || 'A',
      'Active',
      s.assignedBusId || 'Day Scholar',
      s.fees.status || 'Pending',
      s.summary.attendance_percentage
    ]);

    const studentDbId = rows[0].id;

    // Link parents to students
    const parentUser = MOCK_USERS.find(u => u.linked_id === s.parent_id);
    const parentUserId = parentUser ? userMap.get(parentUser.email.toLowerCase()) : null;

    await q(`
      INSERT INTO student_guardians (student_id, parent_user_id, name, relation, phone, email, is_primary)
      VALUES ($1, $2, $3, $4, $5, $6, TRUE)
    `, [
      studentDbId,
      parentUserId,
      s.guardian?.name || `Parent of ${s.name}`,
      s.guardian?.relation || 'Father',
      s.guardian?.phone || '',
      s.guardian?.email || '',
    ]);

    // Create an ID card
    await q(`
      INSERT INTO id_cards (student_id, card_no, status, wallet_balance, expires_at)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      studentDbId,
      `CARD-${s.student_id}`,
      'active',
      s.fees.paid || 1000,
      '2027-03-31'
    ]);

    // Save full unstructured student to mock_collections
    await q(`
      INSERT INTO mock_collections (id, collection_name, data)
      VALUES ($1, 'students', $2)
    `, [s.student_id, JSON.stringify(s)]);
  }

  // 5. Migrate Parents metadata
  console.log(`› Migrating parents metadata...`);
  for (const p of INITIAL_PARENTS) {
    await q(`
      INSERT INTO mock_collections (id, collection_name, data)
      VALUES ($1, 'parents', $2)
    `, [p.parent_id, JSON.stringify(p)]);
  }

  // 6. Migrate Teachers metadata
  console.log(`› Migrating teachers metadata...`);
  for (const t of INITIAL_TEACHERS) {
    await q(`
      INSERT INTO mock_collections (id, collection_name, data)
      VALUES ($1, 'teachers', $2)
    `, [t.teacher_id, JSON.stringify(t)]);
  }

  // 7. Migrate Staff metadata
  console.log(`› Migrating staff metadata...`);
  for (const st of INITIAL_STAFF) {
    await q(`
      INSERT INTO mock_collections (id, collection_name, data)
      VALUES ($1, 'staff', $2)
    `, [st.staff_id, JSON.stringify(st)]);
  }

  // 8. Migrate Bus Routes
  console.log(`› Migrating bus routes...`);
  for (const r of INITIAL_BUS_ROUTES) {
    await q(`
      INSERT INTO bus_tracking (route_name, driver_name, driver_phone, lat, lng, eta_minutes, status)
      VALUES ($1, $2, $3, 12.9716, 77.5946, 15, 'active')
    `, [r.routeName, r.driverName, r.driverPhone]);

    await q(`
      INSERT INTO mock_collections (id, collection_name, data)
      VALUES ($1, 'busRoutes', $2)
    `, [r.id, JSON.stringify(r)]);
  }

  // 9. Migrate Exam Results
  console.log(`› Migrating exam results...`);
  for (const r of INITIAL_EXAM_RESULTS) {
    // Find student ID in DB
    const studentRow = (await q('SELECT id FROM students WHERE admission_number = $1', [r.student_id])).rows[0];
    if (studentRow) {
      await q(`
        INSERT INTO exam_marks (student_id, subject, exam_name, marks_obtained, max_marks)
        VALUES ($1, $2, $3, $4, $5)
      `, [studentRow.id, r.subject, r.examName || 'Term 1 Exam', r.marksObtained || 0, r.maxMarks || 100]);
    }

    await q(`
      INSERT INTO mock_collections (id, collection_name, data)
      VALUES ($1, 'examResults', $2)
    `, [r.id, JSON.stringify(r)]);
  }

  // 10. Migrate Books & Food Items to mock_collections
  console.log(`› Migrating library books and food items...`);
  for (const b of INITIAL_BOOKS) {
    await q(`
      INSERT INTO mock_collections (id, collection_name, data)
      VALUES ($1, 'books', $2)
    `, [b.id, JSON.stringify(b)]);
  }
  for (const f of INITIAL_FOOD_ITEMS) {
    await q(`
      INSERT INTO mock_collections (id, collection_name, data)
      VALUES ($1, 'storeItems', $2)
    `, [f.id, JSON.stringify(f)]);
  }

  console.log('--- SSMS MIGRATION COMPLETED SUCCESSFULLY ---');
  await pool.end();
}

main().catch(e => {
  console.error('Migration failed:', e);
  process.exit(1);
});
