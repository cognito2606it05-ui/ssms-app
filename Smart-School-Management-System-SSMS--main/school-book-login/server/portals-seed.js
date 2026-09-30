import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pool, q } from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  console.log('› Applying portals schema…');
  await q(readFileSync(join(__dirname, 'portals-schema.sql'), 'utf8'));

  console.log('› Resetting portals tables…');
  await q(`TRUNCATE assignments, assignment_submissions, exam_marks, portal_messages,
           meeting_bookings, study_materials, portal_library_issues, bus_tracking RESTART IDENTITY CASCADE`);

  const students = (await q('SELECT id, class, name FROM students')).rows;
  const teachers = (await q("SELECT id, name, email FROM users WHERE primary_role = 'teacher'")).rows;
  const parents = (await q("SELECT id, name, email FROM users WHERE primary_role = 'parent'")).rows;

  if (!students.length) {
    console.log('⚠ No students found in database. Run students-seed.js or seed.js first.');
    return;
  }
  if (!teachers.length) {
    console.log('⚠ No teachers found. Make sure users exist.');
    return;
  }
  if (!parents.length) {
    console.log('⚠ No parents found. Make sure parent users exist.');
    return;
  }

  console.log('› Seeding bus tracking…');
  await q(`
    INSERT INTO bus_tracking (route_name, driver_name, driver_phone, lat, lng, eta_minutes, status) VALUES
    ('Route A - North Delhi', 'Ramesh Singh', '+91 98765 43210', 28.7041, 77.1025, 12, 'active'),
    ('Route B - West Delhi', 'Suresh Kumar', '+91 87654 32109', 28.6304, 77.0878, 25, 'active'),
    ('Route C - South Delhi', 'Satish Sharma', '+91 76543 21098', 28.5355, 77.2410, 8, 'active')
  `);

  console.log('› Seeding study materials…');
  await q(`
    INSERT INTO study_materials (title, subject, chapter, file_url, description) VALUES
    ('Algebraic Identities & Formulas', 'Mathematics', 'Chapter 1: Algebra', '#', 'Core formulas and solved examples for algebraic identities.'),
    ('Newtonian Mechanics - Notes', 'Physics', 'Chapter 2: Mechanics', '#', 'Study notes on Newton laws of motion with practice numericals.'),
    ('Cell Structure and Functions', 'Biology', 'Chapter 1: The Cell', '#', 'Diagrams and descriptions of plant and animal cell structures.'),
    ('French Revolution Chronology', 'History', 'Chapter 3: Revolutions', '#', 'Key dates, timeline, and causes of the French Revolution.')
  `);

  console.log('› Seeding assignments…');
  const subjects = ['Mathematics', 'Science', 'English', 'History'];
  const classes = ['8', '9', '10', '11', '12'];
  const assignmentIds = [];

  for (const cls of classes) {
    for (const sub of subjects) {
      const { rows } = await q(`
        INSERT INTO assignments (title, description, class, section, subject, due_date, max_marks)
        VALUES ($1, $2, $3, 'A', $4, now() + interval '5 days', 100)
        RETURNING id
      `, [`${sub} Homework - Assignment 1`, `Complete exercises 1.1 to 1.5. Show all steps clearly.`, cls, sub]);
      assignmentIds.push(rows[0].id);
    }
  }

  console.log('› Seeding assignment submissions & grades…');
  for (const s of students) {
    // find assignments for this student's class
    const { rows: studentAssgns } = await q('SELECT id FROM assignments WHERE class = $1', [s.class]);
    for (let i = 0; i < studentAssgns.length; i++) {
      const assgnId = studentAssgns[i].id;
      const shouldSubmit = i % 3 !== 0; // submit 2 out of 3
      if (shouldSubmit) {
        const isGraded = i % 2 === 0;
        const grade = isGraded ? Math.floor(70 + Math.random() * 30) : null;
        const feedback = isGraded ? 'Great effort, neat presentation.' : null;
        const status = isGraded ? 'graded' : 'submitted';

        await q(`
          INSERT INTO assignment_submissions (assignment_id, student_id, file_url, file_name, text_submission, grade, feedback, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (assignment_id, student_id) DO NOTHING
        `, [assgnId, s.id, '#', 'homework_submission.pdf', 'Hi Teacher, I have completed the assignment. Please find attached.', grade, feedback, status]);
      }
    }
  }

  console.log('› Seeding exam marks…');
  for (const s of students) {
    for (const sub of subjects) {
      await q(`
        INSERT INTO exam_marks (student_id, subject, exam_name, marks_obtained, max_marks, graded_by) VALUES
        ($1, $2, 'Term 1 Exam', $3, 100, 'System Grader'),
        ($1, $2, 'Unit Test 1', $4, 25, 'System Grader')
      `, [s.id, sub, Math.floor(65 + Math.random() * 30), Math.floor(15 + Math.random() * 10)]);
    }
  }

  console.log('› Seeding library issues…');
  for (const s of students) {
    await q(`
      INSERT INTO portal_library_issues (student_id, book_title, author, due_date, returned_at, fine_amount, fine_paid) VALUES
      ($1, 'Introduction to Algorithms', 'Thomas H. Cormen', current_date - interval '10 days', null, 50.00, false),
      ($1, 'Brief History of Time', 'Stephen Hawking', current_date - interval '2 days', current_date, 0, false),
      ($1, 'To Kill a Mockingbird', 'Harper Lee', current_date + interval '5 days', null, 0, false)
    `, [s.id]);
  }

  console.log('› Seeding PT meetings…');
  for (let idx = 0; idx < Math.min(parents.length, 5); idx++) {
    const parent = parents[idx];
    const teacher = teachers[0];
    const std = students.find(st => st.class === '10') || students[0];
    await q(`
      INSERT INTO meeting_bookings (parent_id, teacher_id, student_id, meeting_date, time_slot, status) VALUES
      ($1, $2, $3, current_date + interval '2 days', '10:00 AM - 10:30 AM', 'booked'),
      ($1, $2, $3, current_date - interval '4 days', '11:30 AM - 12:00 PM', 'completed')
    `, [parent.id, teacher.id, std.id]);
  }

  console.log('› Seeding messaging center…');
  for (let idx = 0; idx < Math.min(parents.length, 5); idx++) {
    const parent = parents[idx];
    const teacher = teachers[0];
    await q(`
      INSERT INTO portal_messages (sender_id, receiver_id, content, read_at) VALUES
      ($1, $2, 'Hello Teacher, wanted to check on Rohans homework submissions.', now() - interval '2 hours'),
      ($2, $1, 'Hi! Rohan is doing great. He submitted all of them except Mathematics, which is due today.', now() - interval '1 hour'),
      ($1, $2, 'Perfect, I will ask him to complete and submit it soon. Thank you!', null)
    `, [parent.id, teacher.id]);
  }

  console.log('✨ Portals Seeding Completed Successfully.');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(() => pool.end());
