-- ============================================================
--  Parent and Student Portal Schema
-- ============================================================

DROP TABLE IF EXISTS bus_tracking, portal_library_issues, study_materials, meeting_bookings, portal_messages, exam_marks, assignment_submissions, assignments CASCADE;

CREATE TABLE IF NOT EXISTS assignments (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  class TEXT NOT NULL,
  section TEXT,
  subject TEXT NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  max_marks INT NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assignment_submissions (
  id SERIAL PRIMARY KEY,
  assignment_id INT REFERENCES assignments(id) ON DELETE CASCADE,
  student_id INT REFERENCES students(id) ON DELETE CASCADE,
  file_url TEXT,
  file_name TEXT,
  text_submission TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  grade NUMERIC(5,2),
  feedback TEXT,
  status TEXT NOT NULL DEFAULT 'submitted', -- submitted | graded
  UNIQUE(assignment_id, student_id)
);

CREATE TABLE IF NOT EXISTS exam_marks (
  id SERIAL PRIMARY KEY,
  student_id INT REFERENCES students(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  exam_name TEXT NOT NULL,
  marks_obtained NUMERIC(5,2) NOT NULL,
  max_marks NUMERIC(5,2) NOT NULL,
  graded_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS portal_messages (
  id SERIAL PRIMARY KEY,
  sender_id INT REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INT REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS meeting_bookings (
  id SERIAL PRIMARY KEY,
  parent_id INT REFERENCES users(id) ON DELETE CASCADE,
  teacher_id INT REFERENCES users(id) ON DELETE CASCADE,
  student_id INT REFERENCES students(id) ON DELETE CASCADE,
  meeting_date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'booked', -- booked | cancelled | completed
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS study_materials (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  chapter TEXT,
  file_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS portal_library_issues (
  id SERIAL PRIMARY KEY,
  student_id INT REFERENCES students(id) ON DELETE CASCADE,
  book_title TEXT NOT NULL,
  author TEXT,
  due_date DATE NOT NULL,
  returned_at DATE,
  fine_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  fine_paid BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS bus_tracking (
  id SERIAL PRIMARY KEY,
  route_name TEXT UNIQUE NOT NULL,
  driver_name TEXT,
  driver_phone TEXT,
  lat NUMERIC(9,6) NOT NULL,
  lng NUMERIC(9,6) NOT NULL,
  eta_minutes INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
);
