import { q, pool } from './db.js';
import { ensureSystemAccounts, systemAccountId, postTxn } from './wallet-ledger.js';

export function mountPortals(app, { authenticate }) {
  
  // Middleware to ensure the user has the Student role
  const requireStudent = (req, res, next) => {
    if (req.user.activeRole !== 'student') {
      return res.status(403).json({ error: 'forbidden', message: 'Student portal access only.' });
    }
    next();
  };

  // Middleware to ensure the user has the Parent role
  const requireParent = (req, res, next) => {
    if (req.user.activeRole !== 'parent') {
      return res.status(403).json({ error: 'forbidden', message: 'Parent portal access only.' });
    }
    next();
  };

  // Helper to find student record associated with logged in student email
  async function getStudentForUser(email) {
    const { rows } = await q('SELECT * FROM students WHERE LOWER(email) = LOWER($1)', [email]);
    return rows[0];
  }

  /* ============================================================
     STUDENT PORTAL ENDPOINTS
     ============================================================ */

  // GET /api/student/dashboard
  app.get('/api/student/dashboard', authenticate, requireStudent, async (req, res) => {
    try {
      const student = await getStudentForUser(req.user.email);
      if (!student) return res.status(404).json({ error: 'not_found', message: 'Student record not found.' });

      // Today's schedule / timetable
      const timetableRes = await q(`
        SELECT t.* FROM timetables t 
        WHERE t.class = $1 AND (t.section = $2 OR t.section IS NULL)
        ORDER BY t.start_time
      `, [student.class, student.section]);

      // Assignments count
      const assignmentsCount = await q(`
        SELECT 
          COUNT(CASE WHEN status = 'graded' THEN 1 END) as graded,
          COUNT(CASE WHEN status = 'submitted' THEN 1 END) as submitted,
          COUNT(a.id) - COUNT(s.id) as pending
        FROM assignments a
        LEFT JOIN assignment_submissions s ON s.assignment_id = a.id AND s.student_id = $1
        WHERE a.class = $2
      `, [student.id, student.class]);

      // Smart card digital view & balance
      const cardRes = await q('SELECT * FROM id_cards WHERE student_id = $1', [student.id]);
      const card = cardRes.rows[0];

      // Recent wallet transactions (last 5)
      let transactions = [];
      if (card) {
        const txns = await q(`
          SELECT * FROM wallet_txns 
          WHERE student_id = $1 
          ORDER BY created_at DESC LIMIT 5
        `, [student.id]);
        transactions = txns.rows;
      }

      // Bus tracking location & ETA
      const busRes = await q('SELECT * FROM bus_tracking WHERE route_name = $1', [student.transport_route]);
      const bus = busRes.rows[0] || null;

      // Library issued books count & fines
      const libraryRes = await q(`
        SELECT COUNT(*) as issued_count, COALESCE(SUM(fine_amount), 0) as total_fines
        FROM portal_library_issues 
        WHERE student_id = $1 AND returned_at IS NULL
      `, [student.id]);

      res.json({
        student,
        timetable: timetableRes.rows,
        assignmentStats: assignmentsCount.rows[0] || { graded: 0, submitted: 0, pending: 0 },
        card: card ? { card_no: card.card_no, wallet_balance: Number(card.wallet_balance), status: card.status } : null,
        recentTransactions: transactions,
        bus,
        library: libraryRes.rows[0] || { issued_count: 0, total_fines: 0 }
      });
    } catch (e) {
      res.status(500).json({ error: 'server_error', message: e.message });
    }
  });

  // GET /api/student/assignments
  app.get('/api/student/assignments', authenticate, requireStudent, async (req, res) => {
    try {
      const student = await getStudentForUser(req.user.email);
      if (!student) return res.status(404).json({ error: 'not_found', message: 'Student record not found.' });

      const { rows } = await q(`
        SELECT a.*, s.submitted_at, s.file_url, s.file_name, s.text_submission, s.grade, s.feedback, s.status as submission_status
        FROM assignments a
        LEFT JOIN assignment_submissions s ON s.assignment_id = a.id AND s.student_id = $1
        WHERE a.class = $2
        ORDER BY a.due_date ASC
      `, [student.id, student.class]);

      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: 'server_error', message: e.message });
    }
  });

  // POST /api/student/assignments/:id/submit
  app.post('/api/student/assignments/:id/submit', authenticate, requireStudent, async (req, res) => {
    const { id } = req.params;
    const { text_submission, file_name } = req.body || {};
    try {
      const student = await getStudentForUser(req.user.email);
      if (!student) return res.status(404).json({ error: 'not_found', message: 'Student record not found.' });

      // Simulated file_url path
      const fileUrl = file_name ? `/uploads/assignments/${Date.now()}_${file_name}` : null;

      await q(`
        INSERT INTO assignment_submissions (assignment_id, student_id, file_url, file_name, text_submission, submitted_at, status)
        VALUES ($1, $2, $3, $4, $5, now(), 'submitted')
        ON CONFLICT (assignment_id, student_id) DO UPDATE SET
          file_url = EXCLUDED.file_url,
          file_name = EXCLUDED.file_name,
          text_submission = EXCLUDED.text_submission,
          submitted_at = now(),
          status = 'submitted'
      `, [id, student.id, fileUrl, file_name || null, text_submission || null]);

      res.json({ ok: true, message: 'Assignment submitted successfully.' });
    } catch (e) {
      res.status(500).json({ error: 'server_error', message: e.message });
    }
  });

  // GET /api/student/grades
  app.get('/api/student/grades', authenticate, requireStudent, async (req, res) => {
    try {
      const student = await getStudentForUser(req.user.email);
      if (!student) return res.status(404).json({ error: 'not_found', message: 'Student record not found.' });

      const marksRes = await q('SELECT * FROM exam_marks WHERE student_id = $1 ORDER BY created_at DESC', [student.id]);
      
      // Calculate subject-wise class average
      const avgRes = await q(`
        SELECT subject, exam_name, ROUND(AVG(marks_obtained), 2) as class_average
        FROM exam_marks
        GROUP BY subject, exam_name
      `);

      res.json({
        studentMarks: marksRes.rows,
        classAverages: avgRes.rows
      });
    } catch (e) {
      res.status(500).json({ error: 'server_error', message: e.message });
    }
  });

  // GET /api/student/library
  app.get('/api/student/library', authenticate, requireStudent, async (req, res) => {
    try {
      const student = await getStudentForUser(req.user.email);
      if (!student) return res.status(404).json({ error: 'not_found', message: 'Student record not found.' });

      const issues = await q('SELECT * FROM portal_library_issues WHERE student_id = $1 ORDER BY due_date DESC', [student.id]);
      
      // Return catalog search results too
      const catalog = [
        { id: 1, title: 'Introduction to Algorithms', author: 'Cormen', subject: 'Computer Science', available: false },
        { id: 2, title: 'Clean Code', author: 'Robert C. Martin', subject: 'Software Eng', available: true },
        { id: 3, title: 'Brief History of Time', author: 'Stephen Hawking', subject: 'Physics', available: true },
        { id: 4, title: 'To Kill a Mockingbird', author: 'Harper Lee', subject: 'English', available: true }
      ];

      res.json({ issues: issues.rows, catalog });
    } catch (e) {
      res.status(500).json({ error: 'server_error', message: e.message });
    }
  });

  // POST /api/student/library/pay-fine
  app.post('/api/student/library/pay-fine', authenticate, requireStudent, async (req, res) => {
    const { id } = req.body || {};
    const client = await pool.connect();
    try {
      const student = await getStudentForUser(req.user.email);
      if (!student) return res.status(404).json({ error: 'not_found', message: 'Student record not found.' });

      await client.query('BEGIN');

      const issueRes = await client.query('SELECT * FROM portal_library_issues WHERE id=$1 AND student_id=$2', [id, student.id]);
      const issue = issueRes.rows[0];
      if (!issue) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'Library record not found' });
      }

      if (issue.fine_paid) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Fine already paid.' });
      }

      const cardRes = await client.query('SELECT * FROM id_cards WHERE student_id=$1 FOR UPDATE', [student.id]);
      const card = cardRes.rows[0];
      if (!card || Number(card.wallet_balance) < Number(issue.fine_amount)) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Insufficient wallet balance.' });
      }

      // Deduct from card balance
      await client.query('UPDATE id_cards SET wallet_balance = wallet_balance - $1 WHERE id=$2', [issue.fine_amount, card.id]);
      await client.query('UPDATE portal_library_issues SET fine_paid = true WHERE id=$1', [id]);

      // Record transaction
      await client.query(`
        INSERT INTO card_transactions (card_id, type, amount, balance_after, note)
        VALUES ($1, 'spend', $2, $3, $4)
      `, [card.id, issue.fine_amount, Number(card.wallet_balance) - Number(issue.fine_amount), `Fine paid for ${issue.book_title}`]);

      await client.query('COMMIT');
      res.json({ ok: true, message: 'Library fine paid successfully.' });
    } catch (e) {
      await client.query('ROLLBACK');
      res.status(500).json({ error: 'server_error', message: e.message });
    } finally {
      client.release();
    }
  });

  // GET /api/student/study-materials
  app.get('/api/student/study-materials', authenticate, requireStudent, async (req, res) => {
    try {
      const { rows } = await q('SELECT * FROM study_materials ORDER BY subject, chapter');
      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: 'server_error', message: e.message });
    }
  });

  // POST /api/student/ai-chat
  app.post('/api/student/ai-chat', authenticate, requireStudent, async (req, res) => {
    const { message, contextSubject } = req.body || {};
    try {
      const student = await getStudentForUser(req.user.email);
      if (!student) return res.status(404).json({ error: 'not_found', message: 'Student record not found.' });

      // Context-aware prompt generation
      let botResponse = `I am your EduSmart Study assistant. As a Class ${student.class} student studying ${contextSubject || 'Science/Math'}, I can help explain concepts, generate test questions, or guide you step by step. `;
      
      const lower = message.toLowerCase();
      if (lower.includes('algebra') || lower.includes('equation')) {
        botResponse += "\n\nSure! In Algebra, we balance equations using rules like adding/subtracting the same value from both sides. Here is a simple practice question: Find x in: 3x - 7 = 14. Would you like to try solving it?";
      } else if (lower.includes('newton') || lower.includes('law')) {
        botResponse += "\n\nNewton's first law states that an object remains at rest or in uniform motion unless acted upon by a force. An example is a book resting on a table. Would you like a practice question on Newtonian mechanics?";
      } else if (lower.includes('teacher') || lower.includes('human') || lower.includes('unable') || lower.includes('escalate')) {
        botResponse = "I understand you need help beyond my current base. I am escalating this chat thread to your teacher, Mrs. Sharma (Mathematics). She will get back to you shortly.";
      } else {
        botResponse += `\n\nTo explain further: "${message}" is an interesting topic in our syllabus. Let me know if you want me to give you a practice question or explain the core definitions!`;
      }

      res.json({ response: botResponse, escalated: lower.includes('teacher') || lower.includes('human') || lower.includes('escalate') });
    } catch (e) {
      res.status(500).json({ error: 'server_error', message: e.message });
    }
  });

  /* ============================================================
     PARENT PORTAL ENDPOINTS
     ============================================================ */

  // GET /api/parent/children
  app.get('/api/parent/children', authenticate, requireParent, async (req, res) => {
    try {
      // Find children by parent_user_id or by email match
      const { rows } = await q(`
        SELECT s.* FROM students s
        LEFT JOIN student_guardians g ON g.student_id = s.id
        WHERE g.parent_user_id = $1 OR LOWER(g.email) = LOWER($2) OR LOWER(s.emergency1_phone) = LOWER($2)
      `, [req.user.sub, req.user.email]);

      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: 'server_error', message: e.message });
    }
  });

  // GET /api/parent/child/:id/dashboard
  app.get('/api/parent/child/:id/dashboard', authenticate, requireParent, async (req, res) => {
    const { id } = req.params;
    try {
      const studentRes = await q('SELECT * FROM students WHERE id = $1', [id]);
      const student = studentRes.rows[0];
      if (!student) return res.status(404).json({ error: 'not_found', message: 'Student record not found.' });

      // Attendance records (color-coded format)
      const attRes = await q(`
        SELECT attendance_date, status FROM attendance 
        WHERE student_id = $1 AND attendance_date >= current_date - interval '30 days'
      `, [id]);

      // Marks notifications & notifications feed
      const marksRes = await q(`
        SELECT * FROM exam_marks WHERE student_id = $1 ORDER BY created_at DESC LIMIT 5
      `, [id]);

      // AI insight card
      const mathDrop = student.name.split(' ')[0] + "'s Math score dropped 12% vs last term. We recommend practicing Chapter 1: Algebraic Identities and equation balancing.";
      const aiInsight = {
        title: `Academic Performance Alert for ${student.name}`,
        insight: mathDrop,
        rec: "algebra practice",
        level: "warning"
      };

      // Outstanding invoice balance
      const invoiceBalanceRes = await q(`
        SELECT COALESCE(SUM(total - paid), 0) as balance
        FROM invoices WHERE student_id = $1 AND status != 'paid'
      `, [id]);

      // Payment history
      const paymentsRes = await q(`
        SELECT p.*, i.invoice_no FROM fee_payments p
        JOIN invoices i ON p.invoice_id = i.id
        WHERE i.student_id = $1 ORDER BY p.created_at DESC LIMIT 5
      `, [id]);

      // Smart Card wallet balance & daily limit
      const walletRes = await q('SELECT * FROM id_cards WHERE student_id = $1', [id]);
      const card = walletRes.rows[0];

      let transactions = [];
      let controls = [];
      if (card) {
        const txns = await q('SELECT * FROM card_transactions WHERE card_id = $1 ORDER BY created_at DESC LIMIT 10', [card.id]);
        transactions = txns.rows;
        const ctrl = await q('SELECT * FROM spending_controls WHERE student_id = $1', [id]);
        controls = ctrl.rows;
      }

      // Bus tracking coordinates
      const busRes = await q('SELECT * FROM bus_tracking WHERE route_name = $1', [student.transport_route]);
      const bus = busRes.rows[0] || null;

      res.json({
        student,
        attendance: attRes.rows,
        marksFeed: marksRes.rows,
        aiInsight,
        outstandingFee: Number(invoiceBalanceRes.rows[0]?.balance || 0),
        paymentHistory: paymentsRes.rows,
        card: card ? { card_no: card.card_no, wallet_balance: Number(card.wallet_balance), status: card.status } : null,
        walletTransactions: transactions,
        spendingControls: controls,
        bus
      });
    } catch (e) {
      res.status(500).json({ error: 'server_error', message: e.message });
    }
  });

  // POST /api/parent/child/:id/pay-fees
  app.post('/api/parent/child/:id/pay-fees', authenticate, requireParent, async (req, res) => {
    const { id } = req.params;
    const { amount } = req.body || {};
    try {
      const studentRes = await q('SELECT * FROM students WHERE id = $1', [id]);
      if (!studentRes.rows[0]) return res.status(404).json({ error: 'not_found', message: 'Student not found.' });

      // Find unpaid invoice
      const invoicesRes = await q("SELECT * FROM invoices WHERE student_id=$1 AND status != 'paid' ORDER BY due_date LIMIT 1", [id]);
      const invoice = invoicesRes.rows[0];

      if (!invoice) return res.status(400).json({ message: 'No outstanding fees found.' });

      const payAmt = Math.min(amount || 5000, Number(invoice.total) - Number(invoice.paid));

      // Simulate transaction payment inside database
      await q('UPDATE invoices SET paid = paid + $1, status = CASE WHEN paid + $1 >= total THEN \'paid\' ELSE \'partial\' END WHERE id = $2', [payAmt, invoice.id]);
      
      const receiptNo = 'RCP' + Date.now();
      const payRes = await q(`
        INSERT INTO fee_payments (invoice_id, amount, method, receipt_no, gateway_txn_id, status)
        VALUES ($1, $2, 'upi', $3, $4, 'reconciled') RETURNING *
      `, [invoice.id, payAmt, receiptNo, 'TXN_' + Math.random().toString(36).slice(2).toUpperCase()]);

      res.json({ ok: true, message: 'Fee payment recorded successfully.', payment: payRes.rows[0] });
    } catch (e) {
      res.status(500).json({ error: 'server_error', message: e.message });
    }
  });

  // POST /api/parent/child/:id/wallet/topup
  app.post('/api/parent/child/:id/wallet/topup', authenticate, requireParent, async (req, res) => {
    const { id } = req.params;
    const { amount } = req.body || {};
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const cardRes = await client.query('SELECT * FROM id_cards WHERE student_id=$1 FOR UPDATE', [id]);
      const card = cardRes.rows[0];
      if (!card) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'Smart card not found for this child.' });
      }

      const topupAmt = Number(amount || 500);
      await client.query('UPDATE id_cards SET wallet_balance = wallet_balance + $1 WHERE id=$2', [topupAmt, card.id]);
      
      await client.query(`
        INSERT INTO card_transactions (card_id, type, amount, balance_after, note)
        VALUES ($1, 'topup', $2, $3, $4)
      `, [card.id, topupAmt, Number(card.wallet_balance) + topupAmt, 'Parent dashboard top-up']);

      await client.query('COMMIT');
      res.json({ ok: true, message: 'Wallet balance topped up successfully.' });
    } catch (e) {
      await client.query('ROLLBACK');
      res.status(500).json({ error: 'server_error', message: e.message });
    } finally {
      client.release();
    }
  });

  // POST /api/parent/child/:id/wallet/limits
  app.post('/api/parent/child/:id/wallet/limits', authenticate, requireParent, async (req, res) => {
    const { id } = req.params;
    const { category, daily_limit, weekly_limit, blocked } = req.body || {};
    try {
      await q(`
        INSERT INTO spending_controls (student_id, category, daily_limit, weekly_limit, blocked)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (student_id, category) DO UPDATE SET
          daily_limit = EXCLUDED.daily_limit,
          weekly_limit = EXCLUDED.weekly_limit,
          blocked = EXCLUDED.blocked
      `, [id, category || 'canteen', daily_limit || null, weekly_limit || null, blocked || false]);

      res.json({ ok: true, message: 'Spending controls updated successfully.' });
    } catch (e) {
      res.status(500).json({ error: 'server_error', message: e.message });
    }
  });

  // POST /api/parent/child/:id/wallet/lock
  app.post('/api/parent/child/:id/wallet/lock', authenticate, requireParent, async (req, res) => {
    const { id } = req.params;
    const { lock } = req.body || {};
    try {
      const nextStatus = lock ? 'blocked' : 'active';
      await q('UPDATE id_cards SET status = $1 WHERE student_id = $2', [nextStatus, id]);
      res.json({ ok: true, status: nextStatus, message: `Card ${lock ? 'blocked' : 'unlocked'} successfully.` });
    } catch (e) {
      res.status(500).json({ error: 'server_error', message: e.message });
    }
  });

  // GET /api/parent/meetings/slots
  app.get('/api/parent/meetings/slots', authenticate, requireParent, async (req, res) => {
    try {
      // Return a set of mock available slots for teachers
      const slots = [
        { teacherId: 6, teacherName: 'Teacher Demo', slots: ['09:00 AM - 09:30 AM', '10:00 AM - 10:30 AM', '02:00 PM - 02:30 PM'] }
      ];
      res.json(slots);
    } catch (e) {
      res.status(500).json({ error: 'server_error', message: e.message });
    }
  });

  // POST /api/parent/meetings/book
  app.post('/api/parent/meetings/book', authenticate, requireParent, async (req, res) => {
    const { teacher_id, student_id, meeting_date, time_slot } = req.body || {};
    try {
      await q(`
        INSERT INTO meeting_bookings (parent_id, teacher_id, student_id, meeting_date, time_slot, status)
        VALUES ($1, $2, $3, $4, $5, 'booked')
      `, [req.user.sub, teacher_id, student_id, meeting_date, time_slot]);

      // Simulated SMS notification triggers
      await q(`
        INSERT INTO notification_queue (student_id, channel, message, status, scheduled_for)
        VALUES ($1, 'sms', $2, 'sent', now())
      `, [student_id, `Your Parent-Teacher meeting has been booked for ${meeting_date} at ${time_slot}.`]);

      res.json({ ok: true, message: 'PT meeting booked and SMS confirmation sent.' });
    } catch (e) {
      res.status(500).json({ error: 'server_error', message: e.message });
    }
  });

  // GET /api/parent/messages
  app.get('/api/parent/messages', authenticate, requireParent, async (req, res) => {
    try {
      const { rows } = await q(`
        SELECT m.*, u_send.name as sender_name, u_recv.name as receiver_name
        FROM portal_messages m
        JOIN users u_send ON m.sender_id = u_send.id
        JOIN users u_recv ON m.receiver_id = u_recv.id
        WHERE m.sender_id = $1 OR m.receiver_id = $1
        ORDER BY m.created_at ASC
      `, [req.user.sub]);

      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: 'server_error', message: e.message });
    }
  });

  // POST /api/parent/messages/send
  app.post('/api/parent/messages/send', authenticate, requireParent, async (req, res) => {
    const { receiver_id, content } = req.body || {};
    try {
      const { rows } = await q(`
        INSERT INTO portal_messages (sender_id, receiver_id, content)
        VALUES ($1, $2, $3) RETURNING *
      `, [req.user.sub, receiver_id, content]);

      res.json(rows[0]);
    } catch (e) {
      res.status(500).json({ error: 'server_error', message: e.message });
    }
  });

  // GET /api/parent/notification-prefs
  app.get('/api/parent/notification-prefs', authenticate, requireParent, async (req, res) => {
    try {
      // Get associated child first
      const studentRes = await q(`
        SELECT s.id FROM students s
        LEFT JOIN student_guardians g ON g.student_id = s.id
        WHERE g.parent_user_id = $1 OR LOWER(g.email) = LOWER($2) OR LOWER(s.emergency1_phone) = LOWER($2)
        LIMIT 1
      `, [req.user.sub, req.user.email]);
      
      const child = studentRes.rows[0];
      if (!child) return res.json({ sms: true, email: true, push: false });

      const prefs = await q('SELECT * FROM notification_prefs WHERE student_id = $1', [child.id]);
      res.json(prefs.rows[0] || { sms: true, email: true, push: false });
    } catch (e) {
      res.status(500).json({ error: 'server_error', message: e.message });
    }
  });

  // POST /api/parent/notification-prefs
  app.post('/api/parent/notification-prefs', authenticate, requireParent, async (req, res) => {
    const { sms, email, push } = req.body || {};
    try {
      // Get associated child first
      const studentRes = await q(`
        SELECT s.id FROM students s
        LEFT JOIN student_guardians g ON g.student_id = s.id
        WHERE g.parent_user_id = $1 OR LOWER(g.email) = LOWER($2) OR LOWER(s.emergency1_phone) = LOWER($2)
        LIMIT 1
      `, [req.user.sub, req.user.email]);
      
      const child = studentRes.rows[0];
      if (!child) return res.status(404).json({ message: 'No student associated.' });

      await q(`
        INSERT INTO notification_prefs (student_id, sms, email, push, whatsapp)
        VALUES ($1, $2, $3, $4, $2)
        ON CONFLICT (student_id) DO UPDATE SET
          sms = EXCLUDED.sms,
          email = EXCLUDED.email,
          push = EXCLUDED.push,
          whatsapp = EXCLUDED.sms
      `, [child.id, sms ?? true, email ?? true, push ?? false]);

      res.json({ ok: true, message: 'Notification preferences updated successfully.' });
    } catch (e) {
      res.status(500).json({ error: 'server_error', message: e.message });
    }
  });
}
