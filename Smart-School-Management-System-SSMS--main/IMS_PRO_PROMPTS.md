# 🏫 SMART INSTITUTIONAL MANAGEMENT SYSTEM
## Pro-Level Feature Modification Prompts
### Complete Prompt Library — All Modules, Roles & AI Features

---

> **How to use these prompts:** Each prompt below is self-contained. Copy it directly into your AI coding assistant (Claude, Cursor, GitHub Copilot, etc.) to implement that specific feature or module. Prompts are ordered by implementation priority (Phase 1 → Phase 5).

---

## ═══════════════════════════════════════════
## PHASE 1 — CORE PLATFORM (Foundation)
## ═══════════════════════════════════════════

---

### PROMPT 01 — RBAC System Upgrade (8 → 17 Roles)

```
Upgrade the existing Role-Based Access Control (RBAC) system from 8 roles to the full 17-role hierarchy for a Smart Institutional Management System.

EXISTING ROLES (keep and extend):
Super Admin, Management, Administrative Staff, Teacher, Student, Parent, Librarian, Reception

ADD THESE 9 NEW ROLES:
Security Staff, Lab Technician, Canteen Staff, Store/Stationery Staff,
Sports Coordinator, Electrician/Maintenance, Cleaning Staff,
Hostel Supervisor, Driver/Transportation Staff

ROLE HIERARCHY TO IMPLEMENT:
Level 1: Super Admin (100% access)
Level 2: Management — Principal/Dean/Director (85% access)
Level 3: Administrative Staff, Reception (60% access)
Level 4: Security Staff (35% access)
Level 5: Teacher, Lab Technician (50% access)
Level 6: Librarian, Canteen Staff, Store Staff, Sports Coordinator (40-50%)
Level 7: Electrician, Hostel Supervisor, Cleaning Staff (20-30%)
Level 8: Driver/Transportation Staff (25% access)
Level 9: Student (35%), Parent (40%)

IMPLEMENT:
1. A permissions matrix table in the database with granular permission flags per module per role (read, write, edit, delete, approve, export).
2. Role-based dynamic sidebar navigation — each role sees only their permitted modules.
3. Role-based dashboard cards — KPI widgets rendered conditionally per role.
4. A "Custom Role" builder UI (Premium Tier) — clone an existing role, toggle permissions, save as new role.
5. Two-tier role display: Basic Tier (8 roles), Premium Tier (17 roles + Custom).
6. Audit log: record every permission check that was denied, and surface these in the Super Admin security panel.
7. Role switching UI for staff with multiple concurrent roles (e.g., a teacher who is also hostel supervisor).
8. Middleware-level permission guards on all API routes — return 403 with role-context error message if denied.

Use JWT-based session tokens with role claims. Refresh token on role change. Stack: Node.js/Express backend, PostgreSQL for permissions table, React frontend with protected route wrappers.
```

---

### PROMPT 02 — Super Admin Master Control Panel

```
Build a production-grade Super Admin Master Control Panel for an Institutional Management System.

DASHBOARD SECTIONS:
1. SYSTEM HEALTH MONITOR
   - Real-time server CPU, memory, disk usage (gauge charts, auto-refresh every 30s)
   - Database health: connection pool status, query performance, last backup timestamp
   - Active user sessions with IP, device, role, last activity
   - API call rate graph (last 24h)
   - Error rate tracker with stack trace viewer

2. USER & ROLE MANAGEMENT
   - Full user CRUD with bulk import (CSV/Excel)
   - Role assignment with effective-date scheduling
   - Forced logout button per user or bulk
   - Account lock/unlock with reason logging
   - Password reset (send link or admin-set)
   - Two-factor auth enforcement toggle per role

3. FINANCIAL OVERSIGHT
   - Real-time revenue dashboard: today / this week / this month / this year
   - All transactions with filter (by role, module, payment method, status)
   - Reconciliation tool: compare gateway ledger vs internal records
   - Manual payment entry with dual-approval workflow
   - GST invoice generation with itemized module breakdown

4. CONFIGURATION CENTER
   - Institution settings (name, logo, academic year, timezone, currency)
   - Fee structure builder (create fee types, apply to student groups)
   - Holiday & academic calendar editor
   - Notification template editor (Email/SMS/WhatsApp with variable substitution)
   - Integration credentials vault (encrypted storage for API keys)

5. COMPLIANCE & AUDIT
   - Searchable audit trail: who did what, when, from which IP
   - Failed login attempt tracker with geo-IP map
   - Data export log (GDPR compliance: who downloaded what)
   - Risk assessment dashboard with AI-flagged anomalies

6. DATA MANAGEMENT
   - One-click backup trigger with download link
   - Restore from backup (with dry-run option)
   - Bulk data import wizard (students, staff, fees)
   - Data archival by academic year
   - GDPR: right-to-erasure request handler

7. ANALYTICS
   - Institution-wide KPI scorecard (enrollment, attendance %, fee collection %, staff retention)
   - AI-generated weekly summary report (auto-emailed to Super Admin every Monday)
   - Predictive flags: dropout risk, fee default risk, staff attrition risk

UI: Use a dark sidebar with collapsible sections. Status badges (green/amber/red) on every section header. Real-time toast notifications for critical alerts. All data tables must have column sort, filter, and CSV export.
```

---

### PROMPT 03 — Student Management Module (Pro)

```
Build a professional Student Management module for an Institutional Management System with the following features:

1. STUDENT REGISTRATION WIZARD (multi-step form):
   Step 1: Personal Info (name, DOB, gender, nationality, religion, blood group, photo upload with crop)
   Step 2: Contact Details (address, phone, email, emergency contacts x2)
   Step 3: Academic Info (class, section, roll number, admission date, admission number)
   Step 4: Previous School Info (transfer certificate, last school, percentage)
   Step 5: Documents Upload (TC, birth certificate, ID proof, medical records — PDF/image, max 5MB each)
   Step 6: Guardian/Parent linking (link existing parent account or create new)
   Step 7: Review & Submit with preview card

2. STUDENT PROFILE PAGE:
   - Header: photo, name, class, roll number, status badge (Active/Inactive/Transferred)
   - Tabbed layout: Overview | Academic | Attendance | Fees | Documents | Activity | ID Card
   - AI Insight panel (right sidebar): risk score, engagement level, predicted performance, recommendations

3. BULK OPERATIONS:
   - CSV/Excel import with column mapping wizard and validation report
   - Bulk class promotion (with exceptions for detained students)
   - Bulk certificate/TC generation
   - Bulk SMS/Email to filtered student group

4. SEARCH & FILTER:
   - Global search (name, roll number, admission number, parent phone)
   - Advanced filters: class, section, gender, blood group, transport route, fee status, attendance %
   - Saved filter presets per admin user

5. AI FEATURES:
   - Dropout risk score (0-100) based on attendance, fee payment, engagement — shown as colored badge
   - Learning style detection from assignment submission patterns
   - Anomaly alerts: sudden drop in attendance or grades triggers notification
   - Auto-generate student profile summary (exportable as PDF)

6. ID CARD INTEGRATION:
   - Issue new ID card button on profile
   - View current card status (active/blocked/expired)
   - Card wallet balance visible on profile
   - Quick top-up button

Stack: React frontend with lazy-loaded tabs. Backend: Node.js + PostgreSQL. File storage: S3-compatible bucket. Real-time AI scoring via background job queue (Bull/BullMQ).
```

---

### PROMPT 04 — Attendance System (QR + Manual + Biometric-Ready)

```
Upgrade the attendance system to a multi-modal, AI-enhanced attendance module:

MARKING MODES:
1. Manual marking: class roster with present/absent/late/on-leave toggles. Bulk mark all present button.
2. QR Code mode: teacher opens QR session → students scan from their ID card/mobile → auto-marked present (with timestamp & location hash)
3. CSV Bulk Import: upload attendance sheet with student ID + status columns — validate and auto-reconcile duplicates
4. Biometric-ready API hook: placeholder endpoint to receive attendance from third-party biometric device (fingerprint/face scanner) via webhook

TEACHER WORKFLOW:
- Start session button (selects class, subject, period)
- Live counter: X/Y students marked (updates in real-time as QR scans arrive)
- Late-joiner window: configurable grace period (e.g., 10 minutes)
- Close session → auto-sends SMS alert to parents of absent students

REPORTS:
- Daily register (printable PDF per class)
- Monthly attendance summary (student-wise % with color coding: green >85%, amber 75-85%, red <75%)
- Subject-wise attendance (for college-level timetables)
- Cumulative report with trend graph (last 30/60/90 days)
- Staff attendance report (separate from student)

AI FEATURES:
- Anomaly detection: flag if a student who is always present is suddenly absent 3+ days
- Pattern recognition: identify students who are consistently late on Mondays or after holidays
- Absence prediction: ML model predicts students likely to be absent tomorrow based on historical patterns — alert teacher and parent proactively
- Correlation analysis: surface students whose attendance drop correlates with fee payment issues

PARENT NOTIFICATION:
- Instant SMS/WhatsApp when student marked absent
- Daily digest email at 10 AM if student was late/absent
- Configurable quiet hours (no SMS between 9 PM–7 AM)

Build with WebSocket support for real-time QR session updates. Store attendance in PostgreSQL with composite index on (student_id, date, period_id) for fast queries.
```

---

### PROMPT 05 — Smart ID Card + Digital Wallet System

```
Build a complete Smart ID Card and Digital Wallet system for an Institutional Management System.

CARD DESIGN & ISSUANCE:
- Card template designer: drag-and-drop fields (name, photo, class, roll number, QR code, NFC chip area, institution logo, emergency contact)
- Multiple card templates per institution (student, staff, visitor)
- Batch print queue: select students → generate print-ready PDF (CR80 card size, 300 DPI)
- Card status tracking: Active | Blocked | Lost | Expired | Pending
- Digital card: downloadable to phone wallet (Apple/Google Wallet compatible PKPass)
- Card renewal workflow with automated expiry alerts (30 days before)

DIGITAL WALLET:
- Each student card has a linked wallet (pre-paid balance system)
- Balance display: current balance prominently shown on card profile
- Top-up methods: parent pays via payment gateway (Razorpay/PayU/UPI) → auto-credited to wallet
- Transaction ledger: every debit/credit with timestamp, location, amount, module (canteen/library/store/sports)
- Low balance alert: push notification to parent when balance drops below configurable threshold (e.g., ₹50)
- Spending limits (Premium): parent sets daily/weekly limit per category (e.g., canteen max ₹100/day)
- Module blocking (Premium): parent can disable canteen spending but keep library payments active
- Card lock/unlock: parent or student can instantly freeze card from mobile app

TRANSACTION PROCESSING:
- POS-style scan interface for canteen/store staff: scan student QR → see name + balance → enter amount → confirm → debit
- Transaction receipt auto-generated (SMS + in-app)
- Mixed payment: if balance insufficient, allow partial wallet + cash
- Refund workflow: staff initiates → admin approves → amount credited back to wallet
- Transaction dispute system: student/parent flags a transaction → admin reviews with CCTV timestamp

AI FRAUD DETECTION:
- Flag transactions outside school hours (canteen open 7 AM–5 PM only)
- Alert if same card scanned at two locations within impossible timeframe
- Spending pattern anomaly: student who normally spends ₹30/day suddenly spends ₹500 → alert parent
- Duplicate transaction detection (same amount, same vendor, within 60 seconds)
- Velocity check: more than 5 transactions in 10 minutes → auto-lock + alert

PARENTAL CONTROLS DASHBOARD:
- Real-time spending feed (parent app)
- Set monthly budget per category
- Receive receipt for every transaction instantly
- One-tap card freeze
- Spending analytics: pie chart by category, trend graph

Build wallet as a double-entry ledger system (not simple balance column) for auditability. Use database transactions with row-level locking to prevent race conditions on concurrent debits. PostgreSQL + pgcrypto for balance encryption at rest.
```

---

### PROMPT 06 — Fee Management System (Pro)

```
Build a professional Fee Management module with the following capabilities:

FEE STRUCTURE BUILDER:
- Create fee types: Tuition, Transport, Hostel, Library, Lab, Sports, Miscellaneous
- Fee applicable rules: by class, by section, by student group, by academic year
- Concession/discount engine: apply % or flat discount per student or group (scholarship, staff ward, sibling discount)
- Late fee rules: auto-add penalty after due date (flat or % per day)
- Fee installment plans: split annual fee into monthly/quarterly installments with due dates

INVOICE GENERATION:
- Auto-generate invoices at start of each billing cycle
- Bulk invoice generation (all students in a class/group)
- Manual ad-hoc invoice creation (for miscellaneous charges)
- GST-compliant invoice format with GSTIN, HSN code, tax breakdown
- Invoice preview before sending
- Delivery: email + SMS link + in-app

PAYMENT PROCESSING:
- Online payment: Razorpay, PayU, Stripe, CCAvenue integration
- UPI deep links: generate UPI QR per invoice
- Cash/cheque manual entry with receipt number
- Partial payment recording (mark as partially paid)
- Payment reconciliation: auto-match gateway transaction ID to invoice
- Auto-receipt generation (email + downloadable PDF) on payment

COLLECTION TRACKING:
- Real-time collection dashboard: today / this month / this academic year
- Collection rate % by class, by fee type
- Due list: filter by amount, class, days overdue
- Aging analysis: 0-30 days / 31-60 days / 60+ days overdue
- Top defaulters list with contact info

AUTOMATED FOLLOW-UP:
- SMS/WhatsApp reminder series: 7 days before due → on due date → 3 days after → 7 days after
- Escalation: email to parent + principal notification after 30 days overdue
- Hold services: optionally block library/canteen wallet if fees overdue (configurable)

AI FEATURES:
- Payment default prediction: ML model flags students likely to default based on payment history, family income indicators, sibling patterns
- Optimal collection time: AI identifies the best time to send reminders per parent (based on when previous payments were made)
- Revenue forecasting: predict next month's collection with confidence interval
- Fee waiver recommendation: AI suggests students who may qualify for financial aid

REPORTS:
- Daily collection report (PDF, Excel)
- Monthly summary with previous-year comparison
- Outstanding dues by class, by teacher (for teacher-wise responsibility)
- Fee receipt register (auditor-grade report)
- GST report (for tax filing)

Stack: Node.js backend with idempotency keys on payment endpoints. PostgreSQL with double-entry accounting pattern for fee ledger. Webhook handlers for all payment gateways.
```

---

## ═══════════════════════════════════════════
## PHASE 2 — EXTENDED MODULES
## ═══════════════════════════════════════════

---

### PROMPT 07 — Parent & Student Portals

```
Build dedicated self-service portals for Parents and Students in an Institutional Management System.

PARENT PORTAL:
1. Multi-child switcher: if parent has 2+ children, tab or dropdown to switch between them (separate data context per child)
2. Academic progress hub:
   - Attendance calendar (color-coded: present=green, absent=red, late=orange, holiday=grey)
   - Marks entry feed: real-time notification when teacher enters new marks
   - Report card viewer with subject-wise trend graphs
   - AI insight card: "Rahul's Math score dropped 15% vs last term. Recommend practice in Algebra."
3. Fee portal (full payment flow within parent portal):
   - Outstanding balance prominently displayed
   - Pay now button (Razorpay/UPI)
   - Payment history with downloadable receipts
   - Upcoming due dates with calendar integration
4. ID card wallet panel:
   - Current balance with last 10 transactions
   - Top-up button
   - Set spending limits per module
   - Card lock toggle
5. Bus tracking: embedded map with real-time bus location and ETA
6. Messaging center: threaded conversations with teachers, with read receipts
7. Parent-Teacher meeting booking: calendar showing teacher available slots, one-click book, get confirmation SMS
8. Notification preferences: toggle each alert type (SMS/email/push) per category

STUDENT PORTAL:
1. Personal dashboard with today's schedule (timetable view for the day)
2. Assignments tracker: Due / Submitted / Graded — with countdown timers for deadlines
3. Assignment submission: drag-and-drop file upload (PDF, image, doc — max 20MB), text submission with rich text editor
4. Marks & grades: subject-wise performance chart, comparison with class average (anonymized), download report card
5. AI Tutoring Bot:
   - Chat interface available 24/7
   - Context-aware: knows student's class, syllabus, recent weak areas
   - Can explain concepts, give practice questions, check understanding with follow-up questions
   - Escalate to human teacher if unable to answer
6. Study materials library: browse by subject/chapter, search, download
7. ID card digital view: QR code display, wallet balance, recent transactions
8. Bus tracking: map with current bus location and ETA
9. Library: search catalog, view issued books, pay fines via wallet
10. Notifications: priority inbox (exam alerts, fee reminders, assignment deadlines)

Both portals: responsive design (mobile-first). Progressive Web App (PWA) support for home screen install. Offline mode for viewing last-loaded data. React + Tailwind CSS. Backend: shared API with role-filtered responses.
```

---

### PROMPT 08 — Marks, Grades & Report Card System

```

Build a comprehensive Marks and Grading module for an Institutional Management System.

MARKS ENTRY:
- Exam-based entry: select exam type (unit test, mid-term, final, practical, internal assessment)
- Grid entry UI: student list as rows, marks columns per subject — tabular entry like a spreadsheet
- Bulk CSV upload for marks (with validation report)
- Marks validation: max marks enforced, flag marks above maximum, warn on zero marks (accidental?)
- Save draft (auto-save every 30 seconds), submit for finalization (locked after submission)
- Correction workflow: teacher requests edit → admin approves → audit trail records original and corrected value

GRADE CALCULATION ENGINE:
- Custom formula builder: define grading logic per class/exam type
  Example: Grade = 30% Unit Test 1 + 30% Unit Test 2 + 40% Final Exam
- Multiple grading scales: numerical (0-100), letter grade (A+/A/B/C/D/F), GPA (4.0 scale), competency-based (Excellent/Proficient/Developing/Beginning)
- Auto-calculation: enter raw marks → system computes weighted average → assigns grade → populates report card
- Override: teacher can manually override auto-grade with reason (audit logged)
- Rank calculation: class rank, section rank, subject rank — auto-updated on marks entry

REPORT CARD GENERATOR:
- Template designer: drag-and-drop layout with institution branding, logo, signature fields
- Auto-population: pull student info + marks + grades + attendance % + teacher remarks
- AI-generated personalized remarks: "Priya has shown excellent improvement in Science this term. Focus on consistent performance in Mathematics."
- Batch generation: generate report cards for entire class in one click → downloadable ZIP
- Digital distribution: send to parent portal + email with PDF attachment
- Signature workflow: teacher signs section → class teacher signs → principal approves → released to parents
- Reprint control: log every reprint with reason (lost, damaged, etc.)

COMPETENCY-BASED ASSESSMENT (NEP 2020):
- Define learning outcomes per subject per class
- Map assessments to learning outcomes
- Track mastery level per student per outcome
- Generate competency profile report

AI FEATURES:
- Performance prediction: forecast final exam score based on unit test pattern (confidence interval shown)
- At-risk identification: flag students predicted to fail a subject → alert teacher and parent proactively
- Subject difficulty analysis: if 60%+ of class fails a subject → flag to principal as curriculum/teaching issue
- Comparative analytics: class performance vs institution average vs last year's batch

Stack: React with virtualized grid for large class mark entry. Backend: Node.js. Grade calculation as pure functions with full test coverage. Report card PDF generation: Puppeteer headless Chrome for pixel-perfect rendering.
```

---

### PROMPT 09 — Library Management System

```
Build a full-featured Library Management System for an Institutional Management System.

CATALOG MANAGEMENT:
- Book master: title, author(s), publisher, ISBN, edition, year, language, category (Dewey Decimal or custom), subject, location code (shelf/row/column)
- Cover image upload or auto-fetch from Google Books API by ISBN
- Copy management: multiple copies per title with individual barcode/QR code
- Digital resources: eBook PDF/EPUB upload, video lectures, external URLs
- AI book recommendations panel: "Students in Class 10 who read this also read..."
- Bulk import books via CSV or MARC21 format

CIRCULATION:
- Issue: scan/enter student ID → scan book barcode → auto-record due date (configurable loan period per role/category) → print slip
- Return: scan book → check condition (Good/Damaged/Lost) → calculate fine if overdue → accept payment via ID card wallet or cash
- Renewal: extend due date (max 2 renewals allowed, configurable) → update record
- Reservation: student reserves unavailable book → auto-notify when returned → hold for 2 days
- Fine calculator: per-day rate configurable per book category → auto-accumulate → collect at return or via wallet

MEMBERSHIP:
- Member types: Student, Staff, Guest
- Borrowing limits per member type (e.g., students: 3 books max, 14-day loan)
- Fine waiver: librarian can waive fine with reason (logged)
- Blacklist: block borrowing if fines exceed threshold

DIGITAL LIBRARY:
- eBook reader interface (in-browser PDF viewer with page tracking)
- Access control: only enrolled students in relevant class can access subject-specific resources
- Download limit: configurable (e.g., 2 downloads per eBook per student)
- Reading progress tracking

INVENTORY:
- Annual stock verification workflow: scan all books, flag missing, generate discrepancy report
- Damaged book write-off workflow with approval
- Acquisition suggestions: staff/students can suggest new books (voting system)
- Budget tracker: set library budget, track spending on acquisitions

AI FEATURES:
- Demand forecasting: predict which books will be needed next month based on curriculum and borrow history
- Reading analytics: most borrowed books, least borrowed (suggest weeding), peak borrow times
- Late return prediction: flag members statistically likely to return late → send earlier reminder
- Personalized reading list: suggest books based on student's class, interests, and reading history

REPORTS:
- Daily circulation report
- Overdue list (with escalation: >30 days → email to parent + principal)
- Inventory status report
- Most/least popular books
- Fine collection summary
- Member activity report (top borrowers, inactive members)

Stack: React frontend. Node.js + PostgreSQL. Barcode/QR scanning via device camera (ZXing library) — no separate hardware required, though USB scanner compatible.
```

---

### PROMPT 10 — Transport Management with GPS Tracking

```
Build a real-time Transport Management module for an Institutional Management System.

FLEET MANAGEMENT:
- Vehicle master: registration number, make, model, year, capacity, fuel type, insurance expiry, fitness certificate expiry, permit expiry
- Document tracking: auto-alert 30/15/7 days before any document expiry
- Maintenance log: service history, next service due (km-based or date-based), repair records
- Driver-vehicle assignment (with effective dates for rotations)

ROUTE MANAGEMENT:
- Route builder: name, start point, end point, intermediate stops (in order with coordinates and address)
- Google Maps integration: auto-calculate route distance and estimated time
- Fare matrix: different fee per stop (distance-based pricing)
- Student-route assignment: assign student to route + specific boarding stop
- Capacity management: show current occupancy vs vehicle capacity per route

DRIVER MANAGEMENT:
- Driver profile: license number, license type, expiry date, emergency contact, photo
- Conductor assignment per route
- Attendance: driver marks their own attendance (app-based clock-in/out)
- Leave management: if driver on leave, system prompts admin to assign replacement
- Rating system: parent rates driver after trip (safety, punctuality)

GPS REAL-TIME TRACKING:
- Driver mobile app (React Native): broadcasts GPS coordinates every 10 seconds via WebSocket
- Parent/student app: shows live bus location on map with ETA to their stop
- Geofencing: alert parent when bus is within 500m of their stop
- Route deviation alert: if bus deviates >200m from assigned route → alert admin + parent
- Speed alert: if vehicle exceeds 40 km/h in school zone → alert admin
- Trip history: replay any past trip on map

STUDENT ATTENDANCE (BUS):
- Driver scans student ID card as they board → auto-marks bus attendance
- Absent from bus notification to parent (in case student boarded differently)
- Alighting confirmation: optional scan at destination → parent notified student has arrived

AI FEATURES:
- Delay prediction: based on historical data, traffic patterns → predict arrival time with confidence range
- Route optimization: AI suggests optimal stop sequence to minimize total route time (especially useful when new stops are added)
- Fuel efficiency analysis: compare fuel consumption across drivers on similar routes → flag inefficient driving
- Demand forecasting: predict how many students will use bus next semester based on enrollment trends

REPORTS:
- Daily trip log (departure time, arrival time, occupancy, driver)
- Monthly transport revenue report
- Vehicle-wise mileage and fuel cost
- Driver performance report (punctuality, safety ratings)
- Route-wise profitability analysis

Stack: React frontend + React Native driver app. Node.js backend. WebSocket server for real-time location streaming. Google Maps/Mapbox SDK. PostgreSQL with PostGIS extension for geo queries.
```

---

### PROMPT 11 — Canteen Management + POS

```
Build a Canteen Management module integrated with the ID card wallet system.

MENU MANAGEMENT:
- Item master: name, category (breakfast/lunch/snack/beverage), price, photo, nutritional info (calories, protein, allergens)
- Dietary tags: vegetarian, vegan, gluten-free, halal — filterable by students with dietary restrictions
- Daily menu planner: set which items are available on which days
- Seasonal/special menu: mark items as available for a limited period
- Price history: track price changes over time
- Item-level availability toggle: mark item as sold-out (real-time, visible on student app)

POS (POINT OF SALE) INTERFACE:
- Designed for canteen counter use (tablet/touchscreen friendly)
- Scan student ID card (camera QR scan or USB scanner)
- Display: student name, photo, current wallet balance, any dietary restrictions
- Item selection: grid of menu items with photos, one-tap add to cart
- Cart: running total, quantity adjustment, remove item
- Balance check before confirm: if insufficient balance → show shortfall → offer partial wallet + cash
- One-tap checkout: debit wallet → print receipt (thermal printer compatible) → show success screen
- Return to home in 3 seconds for next customer (high throughput design)
- Cash-mode toggle: for cash-paying visitors (records separately)
- Offline mode: if internet drops, queue transactions locally → sync when reconnected

INVENTORY MANAGEMENT:
- Opening stock entry each morning
- Auto-deduct from inventory on each sale
- Low stock alerts (configurable threshold per item: e.g., alert when <10 idlis remaining)
- Expiry date tracking: alert 1 day before expiry on perishables
- Waste log: record spoiled/unsold items at end of day
- Supplier order requests: one-click reorder to supplier (sends WhatsApp/email)
- Stock valuation: current inventory value at cost price

FINANCIAL MANAGEMENT:
- Real-time sales counter on manager dashboard (updates every minute)
- Payment method split: wallet vs cash vs UPI breakdown
- End-of-day report: total sales, items sold, cash collected, wallet transactions, waste
- Cash reconciliation: expected cash vs actual count → flag discrepancy
- Monthly P&L: revenue, COGS (cost of goods sold), gross margin
- Tax tracking (if applicable)

AI FEATURES:
- Demand forecasting: predict tomorrow's demand per item based on day-of-week patterns, weather, upcoming exams (students eat more on exam days?), holidays
- Menu optimization: identify slow-moving items (suggest removal) and high-margin items (suggest promotion)
- Inventory auto-order: AI calculates reorder quantity to minimize stockout while minimizing waste
- Price sensitivity: suggest price adjustments to maximize revenue while maintaining student satisfaction

PARENT VISIBILITY:
- Every canteen transaction appears instantly in parent app
- Category spend analysis: "Ravi spent ₹340 on canteen this week (5 days)"
- Parent can set daily canteen limit (e.g., max ₹80/day)
- Nutritional summary: weekly calorie and protein intake estimate based on canteen purchases

Stack: React (web POS) + React Native (mobile view). Node.js + PostgreSQL. WebSocket for real-time sales updates on manager dashboard. Thermal printer integration via WebUSB API.
```

---

### PROMPT 12 — Hostel Management System

```
Build a comprehensive Hostel Management module for an Institutional Management System.

ROOM & ALLOCATION:
- Building/block/floor/room hierarchy: create rooms with capacity (single, double, triple, dormitory)
- Room features: AC/Non-AC, attached bathroom, floor number, view preferences
- Allocation workflow: student applies → hostel supervisor assigns room → student receives confirmation
- Waitlist management: if no room available, add to waitlist with priority queue
- Room change requests: student submits request with reason → supervisor approves/denies
- Academic year rollover: retain existing allocations or reset for fresh allocation
- Room capacity utilization dashboard: color-coded floor map (green=available, orange=partial, red=full)

RESIDENT MANAGEMENT:
- Resident profile: linked to student record + hostel-specific info (check-in date, room, warden, emergency contact)
- Check-in/check-out recording with timestamp
- Guest register: log visitors (name, ID, purpose, time in/out, who they're visiting)
- Leave tracking: student applies for home leave (from date, to date, destination, parent approval required) → warden approves → gate clearance issued
- Curfew management: configure curfew times → flag residents returning after curfew → generate report

FEES & EXPENSES:
- Hostel fee structure: monthly/semester/annual charges
- Meal plan: include/exclude in fee, separate vegetarian/non-vegetarian pricing
- Additional charges: laundry, room service, late payment penalty
- Integration with main fee module: hostel fee appears in student's consolidated fee statement
- Expense tracking: utilities, maintenance, staff salary, food procurement
- P&L per hostel building

DISCIPLINE & COMPLAINTS:
- Incident reporting: warden logs incidents (rule violation, misconduct, property damage)
- Warning letter generation: auto-fill student name and incident details
- Escalation: repeat incidents → auto-escalate to principal
- Grievance portal: student/parent reports complaint → tracked to resolution
- Counseling referral: flag students with repeated issues for counseling

MAINTENANCE:
- Room inspection schedule: periodic inspection with checklist (cleanliness, fixtures, damage)
- Maintenance requests: residents report issues → maintenance staff assigned
- Damage charge: if damage found → charge to student account (deducted from security deposit)

COMMUNICATION:
- Warden-to-all-residents broadcast (WhatsApp/SMS)
- Individual messaging
- Emergency alert system (immediate push notification to all residents + parents)
- Notice board (digital, pinned to hostel app section)

AI FEATURES:
- Optimal room allocation: AI suggests room assignments to maximize satisfaction (single-gender, region-based grouping, academic compatibility)
- Occupancy forecasting: predict next semester demand to guide infrastructure planning
- Conflict prediction: identify room-pair combinations with high complaint history → suggest proactive reassignment

REPORTS:
- Occupancy report (current and historical)
- Financial report (fees collected vs due)
- Incident report (monthly summary for principal)
- Leave movement log
- Visitor log (for security)

Stack: React frontend. Node.js + PostgreSQL. Role-restricted access: Hostel Supervisor sees only their building. Physical gate integration-ready via QR scan on mobile.
```

---

## ═══════════════════════════════════════════
## PHASE 3 — ACADEMIC & EXAMINATION
## ═══════════════════════════════════════════

---

### PROMPT 13 — Examination System (Full-Featured)

```
Build a complete Examination Management module for an Institutional Management System.

EXAM SCHEDULING:
- Exam master: name (Unit Test 1, Mid-Term, Final), academic year, date range
- Subject-wise schedule: date, time, duration, max marks, passing marks per subject per class
- Clash detection: alert if same student has two exams at same time
- Schedule publishing: draft → review → publish → notify (students + parents + teachers simultaneously)
- Timetable PDF: auto-generated in school format, ready to print or share

HALL TICKET GENERATION:
- Template designer: institution logo, student photo, exam name, roll number, schedule table, instructions, invigilator signature space
- Batch generation: all students in an exam → ZIP of PDFs
- Distribution: publish to student portal + email to parent + print
- Duplicate issuance: log every reprint with reason

SEATING ARRANGEMENT:
- Venue/hall master: hall name, capacity, row/column configuration
- Auto-seating: algorithm to arrange students (randomized, or class-mixed to prevent copying)
- Subject-wise seating (if multiple exams in same hall): color-coded seat map
- Print seating plan: per hall, wall-posting format
- Change seating: drag-and-drop individual swaps
- Special needs seating: flag students needing front row, extra space, writer support

ANSWER SHEET MANAGEMENT:
- Answer sheet serialization: QR/barcode on sheets linking to student (for blind evaluation)
- Distribution log: track which sheets given to which evaluator
- Submission tracking: mark each script as received after exam
- Missing script alert: if exam finished but script not returned → immediate alert

RESULT PROCESSING:
- Marks entry by evaluator (with evaluator login, marks entry locked after submission deadline)
- Double-evaluation support: two evaluators for same paper → average or escalate if difference >15%
- Grace marks application: add grace marks to specific subjects (bulk) with reason log
- Result compilation: aggregate marks → calculate percentage → assign grade → rank
- Result approval workflow: teacher enters → admin reviews → principal approves → released to portal
- Withheld results: flag students with fee dues → result released only after clearance
- Result statistics: pass %, average marks, highest, lowest, standard deviation per subject

AUTOMATED ANALYSIS:
- Subject-wise performance distribution (bell curve graph)
- Rank list generation (class rank, section rank, school rank)
- Toppers list with certificates auto-generated
- Failed students list with subject-wise breakup → sent to class teacher + parent
- Year-over-year comparison: this batch vs last 3 years on same exam

AI FEATURES:
- AI answer grading for objective MCQ questions (if online exam)
- Cheating detection: flag answer sheets with suspiciously similar answers (Jaccard similarity algorithm)
- Performance prediction: before exam, predict each student's likely score range based on attendance, unit test history, assignment scores
- Difficult question identification: questions answered wrong by >70% of students → flag for curriculum review

ONLINE EXAM MODULE (Premium):
- Question bank: create questions (MCQ, true/false, short answer, essay) with difficulty tags, subject, chapter
- Question paper generator: auto-pick questions by difficulty distribution, subject, marks allocation
- Proctoring features: fullscreen lock, tab-switch detection, webcam snapshot (configurable frequency)
- Timer: auto-submit on time expiry
- Real-time monitoring: see which students have submitted vs in-progress
- Results: instant MCQ grading → score published on submission

Stack: React frontend with PDF generation (Puppeteer). Node.js + PostgreSQL. For online exams: WebSocket for real-time monitoring dashboard. Proctoring via WebRTC + OpenCV face detection (or third-party API).
```

---

### PROMPT 14 — Curriculum & Lesson Planning (NEP 2020)

```
Build a Curriculum and Lesson Planning module aligned with NEP 2020 for an Institutional Management System.

CURRICULUM MAPPING:
- Curriculum hierarchy: Board → Standard → Subject → Chapter → Topic → Sub-topic
- Learning outcome definition per topic (what student should know/be able to do after this topic)
- Bloom's Taxonomy tagging: Remember / Understand / Apply / Analyze / Evaluate / Create
- Competency mapping: link topics to skill areas (critical thinking, communication, numeracy, etc.)
- NEP 2020 integration:
  - Map to Foundational, Preparatory, Middle, Secondary stages
  - Multidisciplinary learning flags
  - Project-based learning slots
  - Holistic Assessment criteria

LESSON PLAN BUILDER:
- Structured form: Class, Subject, Chapter, Topic, Date, Duration
- Sections: Learning Objectives, Pre-requisite Knowledge, Teaching Method, Resources Needed, Classroom Activities, Assessment Method, Homework
- Teaching method tags: Lecture, Discussion, Demonstration, Group Work, Flipped Classroom, Project, Field Trip
- AI-assisted lesson plan generation: teacher provides topic + class → AI generates a draft lesson plan including suggested activities, resources, and questions
- Resource attachment: upload PDFs, videos, presentation links
- Lesson plan approval: teacher submits → department head reviews → approved/revisions needed

ACADEMIC CALENDAR:
- Year planner: map chapters to weeks across the academic year
- Coverage tracker: mark topics as covered (with date) → auto-calculate syllabus completion %
- Lag detection: if teacher is behind schedule (< 70% coverage by mid-year) → alert to department head
- Holiday integration: auto-account for holidays and adjust pacing

ASSESSMENT ALIGNMENT:
- Map each exam/test question to a specific learning outcome
- Generate assessment coverage report: which outcomes have been tested, which haven't
- Gap analysis: identify learning outcomes not addressed in any exam → flag as assessment gap

TEACHER COLLABORATION:
- Shared lesson plan library: teachers can browse and adapt plans from colleagues
- Version control: see edit history of any lesson plan
- Department head can push a "master lesson plan" → teachers can fork and customize
- Feedback: department head adds comments on submitted lesson plans

AI FEATURES:
- Content recommendations: after teacher specifies topic, AI suggests supplementary videos (YouTube), articles, practice problems from open educational resources
- Curriculum gap detection: compare actual teaching coverage vs planned curriculum → identify gaps
- Learning outcome achievement prediction: based on assessment data, predict which students have achieved each learning outcome

REPORTS:
- Syllabus completion report per teacher per subject (for management review)
- Learning outcome achievement map (heatmap: student × outcome)
- NEP compliance report (percentage of activities that are NEP-aligned)
- Teacher lesson plan submission compliance report

Stack: React with rich text editor (TipTap/Quill) for lesson plans. Node.js + PostgreSQL. AI features via Anthropic Claude API (lesson plan generation, content recommendations). Version control: store lesson plan revisions as JSON snapshots.
```

---

### PROMPT 15 — Online Classes & E-Learning Integration

```
Build an Online Classes and E-Learning module for a Premium Tier Institutional Management System.

VIDEO CONFERENCING INTEGRATION:
- Support three platforms: Zoom, Google Meet, Microsoft Teams
- Class scheduling: teacher creates online class (select platform, date, time, duration, class/subject) → system auto-generates meeting link via platform API
- Auto-publish to student and parent portals with join button
- Reminder notifications: 1 day before → 30 minutes before → 5 minutes before
- Attendance tracking: student clicks join → system records join time and leave time → auto-calculate participation duration → mark as present if attended >75% of class duration
- Recording management: after class, teacher uploads recording link → stored in video library → accessible to students who missed class

VIDEO LIBRARY:
- Organized by subject → chapter → topic
- Thumbnail auto-generated from video
- View count, average watch time, completion rate per video
- Student progress tracking: pause/resume position saved
- Speed control (0.75x, 1x, 1.25x, 1.5x, 2x)
- Closed captions support (upload SRT file)
- Download restriction: configurable (prevent/allow download for offline viewing)
- Access control: only enrolled students of relevant class can view

ASSIGNMENTS & QUIZZES (ONLINE):
- Assignment creation: title, instructions, attachments, due date, marks, submission type (file upload / text / URL)
- Question bank for quizzes (MCQ, true/false, fill-in-the-blank)
- Auto-graded quizzes: instant score on submission, review mode shows correct answers
- Assignment submission: drag-and-drop, multiple file types (PDF, Word, image, zip)
- Late submission policy: configurable (accept with penalty / reject after deadline)
- Plagiarism detection hook: integrate with Turnitin API or similar
- AI grading for short text answers: AI scores and provides feedback, teacher can override

DISCUSSION FORUMS:
- Per-subject, per-chapter discussion threads
- Teacher can post discussion prompts
- Student replies with nested comments
- Upvote/helpful buttons
- Teacher marks best answer (highlighted)
- Moderation: flag inappropriate content → teacher/admin review queue
- AI summarization: summarize long thread to bullet points for latecomers

LIVE CLASS FEATURES (in-app, without third-party):
- Whiteboard: collaborative drawing canvas (teacher controls, students view)
- Poll: teacher launches poll → students vote → results shown live
- Q&A: students submit questions → teacher sees queue → answers one by one
- Hand raise: student signals they have a question
- Breakout rooms: teacher splits class into groups (random or manual)

STUDENT ANALYTICS:
- Engagement score per student: based on video watch time, quiz scores, assignment submission rate, forum participation
- Learning velocity: how fast a student is progressing through the curriculum vs pace
- Dropout risk for online learning: students who stop engaging with online content → alert teacher

REPORTS (for management):
- Platform-wise class count and attendance rates
- Video library usage (most/least watched content)
- Assignment submission rates per class
- Quiz performance analytics per topic
- Teacher engagement metrics (how often they post new content)

Stack: React frontend. Node.js + PostgreSQL. Zoom/Google Meet/Teams APIs for meeting creation. Video storage: S3 with CloudFront CDN for streaming. Quiz engine: custom built with partial scoring support. WebSocket for live class features.
```

---

## ═══════════════════════════════════════════
## PHASE 4 — AI & AUTOMATION
## ═══════════════════════════════════════════

---

### PROMPT 16 — AI Tutoring Bot (24/7 Student Support)

```
Build an AI-powered Tutoring Bot integrated into the Student Portal of an Institutional Management System.

CORE CAPABILITIES:
- Subject matter tutor: answers academic questions across all subjects taught at the institution
- Curriculum-aware: knows the student's class, board (CBSE/ICSE/State), and current syllabus mapping — answers are scoped to grade-appropriate content
- Concept explanation: explains concepts using the Feynman Technique (simple language, analogies, examples)
- Problem solving: walks through math/science problems step by step (doesn't just give the answer — teaches the method)
- Practice question generation: on any topic, generates practice questions at requested difficulty level
- Answer checking: student types their answer → bot checks correctness → explains why it's right or wrong

PERSONALIZATION:
- Weak area awareness: system provides bot with student's recent low-scoring topics (from marks module) → bot proactively offers help in those areas when student opens the chat
- Learning style adaptation: track whether student prefers detailed explanations or concise answers → adjust response style
- Progress tracking: log every tutoring session (topic, questions asked, correct/incorrect attempts)
- Spaced repetition prompts: bot reminds student to revise topics from 7 days ago

CONVERSATION FEATURES:
- Multi-turn conversations with context memory within session
- LaTeX rendering for math equations
- Code block rendering for computer science questions
- Image input: student takes photo of a handwritten problem → bot reads and solves
- Voice input: optional (Web Speech API)
- Conversation history: student can review past chats, organized by subject/date
- Bookmark: student marks a bot explanation as saved → accessible in notes section

ESCALATION:
- If bot cannot confidently answer: "I'm not sure about this one. Let me connect you with your teacher."
- Trigger: low confidence score → auto-create a query ticket → assigned to subject teacher → teacher responds within 24h → student notified

GUARDRAILS:
- Content filter: bot refuses to do homework for students (writes solutions in a way that teaches, not just gives answers)
- No off-topic conversations: politely redirects non-academic queries
- Age-appropriate language enforced
- No sharing of other students' data
- Rate limiting: max 50 messages per session to prevent misuse

ADMIN PANEL (for management):
- Most-asked questions (anonymized): identify topics students struggle most with → useful for curriculum planning
- Bot confidence distribution: how often bot said "I don't know" per subject → reveals knowledge gaps in the system
- Session analytics: average session duration, questions per session, student satisfaction rating
- Teacher response time to escalated questions

IMPLEMENTATION:
- Backend: Call Anthropic Claude API (claude-sonnet-4-20250514) with a system prompt that includes: student's class, current chapter, weak areas, conversation history
- Frontend: Chat UI with message bubbles, typing indicator, subject selector sidebar, math rendering (KaTeX)
- Storage: Store conversation history in PostgreSQL (sessions table linked to student_id)
- Rate limiting: Redis with sliding window counter
- Cost control: max_tokens=1000 per API call, truncate old context if conversation exceeds 8000 tokens

System prompt template:
"You are a helpful academic tutor for a student in Class [X] studying under the [BOARD] curriculum. The student's name is [NAME]. Their recent weak subjects are [WEAK_AREAS]. Current chapter being studied: [CHAPTER]. Explain concepts clearly, step by step. Do not simply give answers to homework — teach the method. Keep language simple and encouraging."
```

---

### PROMPT 17 — AI Analytics & Business Intelligence Dashboard

```
Build a comprehensive AI-powered Analytics and Business Intelligence module for the Premium Tier of an Institutional Management System.

MANAGEMENT DASHBOARD (Principal/Dean view):
- KPI scorecard (large cards): Enrollment, Attendance %, Fee Collection %, Staff Strength, Student-Teacher Ratio
- Trend graphs: enrollment growth (monthly, 3-year), attendance trend (weekly), revenue trend (monthly vs last year)
- Heat maps: class-wise attendance (rows=classes, columns=weeks, color intensity=attendance %)
- Bubble chart: class vs average grade vs attendance (identify classes that are outliers)
- Geographic map: if multi-branch, show branch-wise performance on a map

AI-POWERED PREDICTIVE ANALYTICS:
1. DROPOUT RISK MODEL:
   - Input features: attendance %, payment history, assignment submission rate, grade trend, library usage, canteen usage, parental engagement
   - Output: risk score per student (0-100) with color badge (green <30, amber 30-70, red >70)
   - Risk explanation: "Rahul's risk is HIGH because attendance dropped to 62% and last 2 fee payments were late."
   - Intervention recommendations: suggested actions per risk level
   - Track intervention outcomes: did the at-risk student improve after intervention?

2. FEE DEFAULT PREDICTION:
   - Predict which families are likely to default on next payment
   - Confidence level and key drivers displayed
   - Priority follow-up list sorted by risk + amount due

3. STAFF ATTRITION RISK:
   - Predict which staff members may resign in next 3 months
   - Based on: leave patterns, performance reviews, market salary comparison
   - Flag to HR/management for retention action

4. ENROLLMENT FORECAST:
   - Predict next academic year enrollment by class
   - Useful for resource planning (rooms, staff, books)
   - Scenario builder: "What if we open a new section in Class 8?"

5. ACADEMIC PERFORMANCE TRENDS:
   - Subject-wise difficulty index: which subjects consistently pull down average scores
   - Teacher effectiveness score: compare class performance on same subject across teachers (controlling for student intake quality)
   - Batch comparison: this year's Grade 10 vs last 3 years' Grade 10 on key metrics

CUSTOM DASHBOARD BUILDER:
- Drag-and-drop widget library: choose from 20+ chart types, KPI cards, data tables
- Filters: academic year, class, date range, branch (multi-campus)
- Save custom dashboard configurations per user role
- Schedule email delivery: send PDF snapshot of dashboard to management every Monday at 7 AM
- Share dashboard: generate shareable link (read-only, expires in 7 days)

DATA EXPORT & REPORTS:
- Any chart/table exportable as CSV, Excel, or PDF
- Report scheduler: define a report → set schedule → auto-email to specified recipients
- Raw data explorer: SQL-like filter builder for non-technical users (no SQL required)
- Audit log of all data exports (who exported what, when)

WHAT-IF ANALYSIS:
- Fee increase simulator: "If we increase tuition fee by 10%, model the impact on enrollment and revenue."
- Scholarship impact: "If we give 50 students 50% fee waiver, what's the net revenue impact?"
- Class size optimizer: "What's the optimal students-per-class to maximize teacher effectiveness while minimizing cost?"

Stack: React with Recharts/D3.js for visualizations. Node.js data API with query optimization (materialized views for heavy aggregations). ML models: Python microservice with scikit-learn (retrained monthly with new data). Scheduled reports: cron jobs + Puppeteer for PDF generation + Nodemailer.
```

---

### PROMPT 18 — Complaints & Grievances System

```
Build a Complaints & Grievances management module for an Institutional Management System.

COMPLAINT REGISTRATION:
- Multi-channel intake: web portal, mobile app, email-to-ticket, WhatsApp bot, front desk officer entry
- Complaint form: submitter info (auto-filled if logged in), complaint category (Academic, Staff Conduct, Infrastructure, Fee Related, Hostel, Transport, Safety, Other), subject, description (rich text + file attachments), urgency (Low/Medium/High/Critical)
- Anonymous complaints: option to submit anonymously (system stores identity internally but hides from staff)
- Duplicate detection: AI flags if similar complaint was already submitted → merge or link

WORKFLOW ENGINE:
- Auto-routing rules: based on category → assigned to relevant department/person
  Examples: Transport complaint → Transport Manager; Infrastructure → Maintenance Head; Teacher conduct → Principal
- SLA matrix: response time targets by urgency (Critical: 2h, High: 8h, Medium: 48h, Low: 7 days)
- SLA tracking: color-coded status badges — within SLA (green), approaching breach (amber), breached (red)
- Escalation engine: if no response within X hours → auto-escalate to next level manager → send escalation alert
- Status flow: New → Assigned → In Progress → Resolved → Closed / Reopened

STAFF (HANDLER) INTERFACE:
- My queue: list of assigned complaints with SLA countdown timer
- Complaint detail view: full history, all attachments, conversation thread
- Internal notes: add private notes visible only to staff (not complainant)
- Assignment transfer: reassign to another staff member with reason
- Resolution form: describe resolution taken → close ticket → complainant notified automatically
- Bulk actions: close/reassign multiple tickets

COMPLAINANT TRACKING:
- Complaint tracking page: enter complaint ID → see current status, last updated, expected resolution date
- Email/SMS notifications at every status change
- Satisfaction survey: after closure → 1-5 star rating + comment → average rating tracked per resolver

MANAGEMENT VIEW:
- Open complaints dashboard: count by category, by urgency, by SLA status
- SLA breach report: all tickets that missed SLA targets in the last 30 days
- Resolution time analytics: average by category, by department, by month
- Top complaint categories: identify systemic issues
- Staff performance: tickets resolved per staff, average resolution time, satisfaction rating

AI FEATURES:
- Auto-categorization: complainant describes issue in free text → AI classifies category and sub-category and urgency → routes automatically
- Sentiment analysis: analyze complaint text for emotional intensity → prioritize highly distressed complainants
- Duplicate/similar complaint detection: before creation, AI searches existing open tickets for overlap → suggest merge
- Resolution suggestion: for common complaint types, AI suggests standard resolution based on past similar tickets
- Trend detection: if same issue reported 5+ times in 7 days → flag as systemic issue to principal with auto-generated summary

REPORTS:
- Monthly complaint summary (for board/management)
- Category-wise trend (monthly, 12-month view)
- Staff performance scorecard
- SLA compliance rate
- Parent satisfaction score trend

Stack: React frontend. Node.js + PostgreSQL. AI features via Claude API (categorization prompt, sentiment scoring, resolution suggestion). Email handling: SendGrid inbound parse for email-to-ticket. WebSocket for real-time ticket updates in staff dashboard.
```

---

## ═══════════════════════════════════════════
## PHASE 5 — SECURITY & INTEGRATIONS
## ═══════════════════════════════════════════

---

### PROMPT 19 — Advanced Security Module (2FA, SSO, DLP)

```
Implement a comprehensive security module for a Premium Tier Institutional Management System.

AUTHENTICATION UPGRADES:
1. Two-Factor Authentication (2FA):
   - TOTP (Time-based OTP): Google Authenticator, Authy compatible (RFC 6238)
   - SMS OTP: 6-digit code via Twilio/AWS SNS on login
   - Email OTP: fallback option
   - Remember device: skip 2FA for 30 days on trusted device (device fingerprint stored)
   - 2FA enforcement: Super Admin can mandate 2FA for specific roles (e.g., mandatory for Admin, optional for Students)
   - Recovery codes: generate 10 single-use backup codes on 2FA setup

2. Single Sign-On (SSO):
   - SAML 2.0 provider: integrate with institution's Active Directory / Azure AD / Google Workspace
   - OAuth 2.0 / OIDC: allow login with Google or Microsoft account
   - SSO bypass: local account fallback if SSO provider is unavailable
   - Just-in-time provisioning: auto-create user account on first SSO login based on SAML attributes (role mapping from AD groups)

3. Session Management:
   - Configurable session timeout per role (Admin: 4h, Teacher: 8h, Student: 24h)
   - Concurrent session limit: max 3 simultaneous sessions per user
   - Force logout: Super Admin can terminate any active session remotely
   - Session activity extension: auto-extend on user activity (configurable)

THREAT DETECTION:
- Brute force protection: lock account after 5 failed logins in 10 minutes → unlock after 30 minutes or admin reset
- Geographic anomaly: if user logs in from a new country → send verification email → require confirmation
- Impossible travel detection: login from City A, then City B within 30 minutes (travel impossible) → flag and require re-auth
- Credential stuffing detection: identify patterns of failed logins across many accounts from same IP → auto-block IP
- Real-time threat dashboard: live feed of suspicious events with severity ratings
- Automated incident response: critical threats → auto-lock affected accounts + alert Super Admin via SMS

DATA LOSS PREVENTION (DLP):
- Sensitive data classification: tag fields as PII (student name, Aadhaar, phone), financial, health data
- Export controls: bulk exports of PII require Super Admin approval + business justification
- DLP alerts: if a user attempts to export more than 100 student records → alert + require approval
- Screen capture prevention: watermark sensitive data exports with user ID + timestamp
- API rate limiting: per-user rate limits on data-intensive endpoints
- Data masking: for non-essential roles, show masked data (e.g., phone: 98XXXXX890)

AUDIT & COMPLIANCE:
- Immutable audit log: every create/read/update/delete action recorded with user ID, IP, timestamp, affected record
- Audit log tamper protection: logs stored in append-only table with cryptographic hash chain
- GDPR tools:
  - Right to access: export all data associated with a person in JSON/PDF
  - Right to erasure: soft-delete + anonymization workflow (with legal hold capability)
  - Consent management: track consent given by each parent (for data processing, communications)
  - Data retention policies: auto-archive records older than configurable period
- ISO 27001 / SOC 2 readiness: policy document generator, control evidence export

PENETRATION-TESTING READINESS:
- SQL injection prevention: parameterized queries only (ORM enforced, raw queries forbidden)
- XSS prevention: CSP headers, output encoding, React's default escaping
- CSRF protection: double-submit cookie pattern on all state-changing requests
- SSRF prevention: URL allowlist for webhook/integration endpoints
- Dependency vulnerability scanning: npm audit in CI/CD pipeline, fail build on critical CVEs
- Secret scanning: pre-commit hook to prevent API keys in code

Stack: Node.js + Passport.js (for SSO/OAuth). node-speakeasy for TOTP. PostgreSQL audit tables with trigger-based logging. Redis for session storage and brute-force counters. HashiCorp Vault or AWS Secrets Manager for credential storage.
```

---

### PROMPT 20 — WhatsApp Bot + Notification Hub

```
Build a centralized Notification Hub with WhatsApp Business API integration for an Institutional Management System.

NOTIFICATION HUB ARCHITECTURE:
- Unified notification service: all modules (attendance, fees, exams, transport, library) publish events → notification hub processes and dispatches via appropriate channel
- Channel matrix: each notification type × user role → configurable channel (WhatsApp / SMS / Email / Push)
- User preferences: each user can toggle which channels they want for each notification type
- Quiet hours: configurable per-user (default: no notifications 9 PM–7 AM, except emergencies)
- Rate limiting: max 5 SMS/day per user (to control costs), WhatsApp preferred as primary channel
- Deduplication: if same event triggers 2 notifications within 60 seconds, send only one

WHATSAPP BUSINESS API INTEGRATION:
- Setup: integrate with WhatsApp Business API (via 360Dialog, Twilio, or direct Meta API)
- Message templates: pre-approved templates for each notification type (Meta requires pre-approval)
- Two-way messaging: parents can reply to notifications → responses routed to relevant staff inbox
- Delivery status tracking: sent → delivered → read (read receipts tracked and logged)
- Opt-out management: if user replies STOP → flag in system → no further WhatsApp messages

WHATSAPP BOT (Conversational):
- Keyword commands parents can send to the school's WhatsApp number:
  - "ATTENDANCE [child name]" → bot replies with today's attendance status
  - "FEES" → bot replies with outstanding fee amount and due date
  - "BUS" → bot replies with current bus location ETA
  - "BALANCE" → bot replies with ID card wallet balance
  - "RESULT" → bot replies with latest exam result
  - "TIMETABLE" → bot replies with today's class schedule
  - "MENU" → bot replies with today's canteen menu
- Authentication: parent must register their WhatsApp number in the parent portal first → OTP verification
- Bot NLP: if parent sends a free-text query → AI (Claude API) interprets intent → routes to correct data → responds naturally
- Handoff to human: if bot cannot answer → "I'll connect you with the school office. They'll respond within 2 hours."
- Bot analytics: most used commands, average response time, fallback rate

NOTIFICATION TEMPLATES (all channels):
- Attendance: "Hi [Parent], [Student] was marked ABSENT today ([Date]) at [School]. If this is a mistake, please contact the school."
- Fee reminder: "Fee of ₹[Amount] for [Student] is due on [Date]. Pay online: [link]. Ignore if already paid."
- Result: "[Student]'s [Exam] results are available. Overall: [Grade]. View report card: [link]"
- Bus alert: "[Student]'s bus is 5 minutes away from [Stop]. Expected arrival: [Time]."
- Low balance: "[Student]'s ID card balance is ₹[Amount]. Top up now: [link]"
- Emergency: "URGENT: [School] has declared an emergency. [Message]. All parents please [Action]."

EMAIL TEMPLATES:
- Professional HTML emails with institution branding
- Dynamic content blocks: render different sections based on notification type
- PDF attachments: fee receipts, report cards, hall tickets attached directly
- Unsubscribe link with granular preferences (unsubscribe from fee reminders only, not emergency alerts)

REPORTS:
- Delivery rate per channel (WhatsApp/SMS/Email)
- Message volume by type and date
- Cost tracker (SMS charges, WhatsApp conversation charges)
- Failed delivery log with reason codes
- Bot usage analytics

Stack: Node.js notification service (separate microservice). Bull/BullMQ for message queue (handles retries, delays, rate limiting). WhatsApp: Meta Cloud API or 360Dialog. Email: SendGrid or AWS SES. SMS: Twilio or MSG91 (India). Push notifications: Firebase Cloud Messaging.
```

---

### PROMPT 21 — Multi-Campus & White-Label Support

```
Upgrade the Institutional Management System to support multi-campus institutions and white-label branding for resellers.

MULTI-CAMPUS ARCHITECTURE:
1. DATA ISOLATION:
   - Each campus = separate tenant namespace in PostgreSQL (schema-per-tenant or row-level tenant_id with RLS)
   - All queries automatically scoped to campus via middleware (no cross-campus data leakage)
   - Campus-specific configurations: academic calendar, fee structure, timetable (each campus can differ)
   - Campus-specific staff and students (a teacher belongs to one or more campuses)

2. SUPER ADMIN (INSTITUTION HEAD):
   - Cross-campus dashboard: view all campuses side by side (enrollment, attendance %, fee collection, key metrics)
   - Inter-campus comparison: which campus is performing best on each KPI
   - Consolidated reports: institution-wide reports that aggregate across all campuses
   - Shared resources: a book from the main library can be transferred to a branch campus library
   - Inter-campus student transfer: student moves from Campus A to Campus B → records migrated with full history

3. CAMPUS-LEVEL ADMIN:
   - Sees only their campus data
   - Can manage their own staff, students, fee structures within their campus
   - Requests to cross-campus super admin for inter-campus operations

4. BILLING:
   - Each campus billed separately OR consolidated invoice for institution
   - Campus-wise revenue attribution

WHITE-LABEL BRANDING:
1. BRANDING CUSTOMIZATION (per institution):
   - Upload institution logo (used across all pages, PDFs, email headers)
   - Primary color scheme (primary, secondary, accent colors → applied via CSS variables throughout)
   - Custom domain: institution uses their own domain (e.g., erp.stmarys.edu.in) via CNAME
   - Custom email sender: emails sent from no-reply@stmarys.edu.in instead of our domain
   - SMS sender ID: use institution name as SMS sender ID
   - Login page: custom welcome message, background image, institution name

2. RESELLER SUPPORT:
   - Reseller admin panel: reseller can create/manage multiple institutions from one interface
   - Reseller branding: reseller can put their own logo (instead of platform's) for their clients
   - Revenue tracking: reseller sees total MRR, upcoming renewals, churn
   - Commission tracking: reseller's commission calculated and shown

3. CONFIGURATION PER INSTITUTION:
   - Feature flags: enable/disable modules per institution (e.g., institution without hostel → disable hostel module)
   - Terminology customization: "Term" vs "Semester" vs "Quarter", "Principal" vs "Director", "Student ID" vs "Roll Number"
   - Locale: language (English, Hindi, Telugu, Tamil), date format, currency symbol
   - Academic year start month (June in South India, April in some states)

IMPLEMENTATION:
- Tenant resolution: identify tenant from subdomain (stmarys.yourplatform.com) or custom domain header
- Tenant config cached in Redis with 1-hour TTL
- Feature flag system: JSON config per tenant stored in PostgreSQL, checked on every request
- CSS theming: CSS custom properties set server-side per tenant → injected into HTML head
- PDF branding: institution logo + colors applied to all generated PDFs (report cards, invoices, hall tickets)

Stack: PostgreSQL with Row-Level Security (RLS) policies per tenant. Redis for tenant config caching. Nginx for custom domain → tenant routing. Node.js middleware for tenant context injection. React with runtime CSS variable injection for theming.
```

---

## ═══════════════════════════════════════════
## ADDITIONAL PRO-LEVEL FEATURE PROMPTS
## ═══════════════════════════════════════════

---

### PROMPT 22 — Advanced Staff Management & Payroll

```
Build a Professional Staff Management and Payroll module for an Institutional Management System.

STAFF MASTER DATA:
- Employee profile: personal info, photo, designation, department, joining date, employment type (permanent/contract/part-time)
- Qualification tracking: degree, institution, year, certificate upload
- Experience history: previous employment records
- Document management: appointment letter, contracts, ID proof, certificates (all uploaded and versioned)
- Probation tracking: flag employees in probation, auto-alert for confirmation
- Contract renewal: alert 90/60/30 days before contract expiry

ATTENDANCE & LEAVE:
- Staff attendance: biometric integration ready / mobile app clock-in with geo-fence (must be within school premises)
- Leave types: casual, sick, earned, maternity/paternity, loss of pay, compensatory off
- Leave balance: configurable accrual rules per leave type per designation
- Leave application workflow: staff applies → reporting manager approves → admin records → balance deducted
- Leave calendar: team view showing who is on leave on any given day (useful for coverage planning)
- Comp-off tracking: extra hours worked → compensatory leave earned (configurable)

PAYROLL ENGINE:
- Salary structure builder: define components per designation (Basic, HRA, DA, Conveyance Allowance, Medical, Special Allowance, Gratuity)
- PF/ESI: auto-calculate employer and employee PF (12% of Basic) and ESI contributions
- Tax (TDS): monthly TDS calculation based on projected annual income (Section 192)
- Loan & advance: record salary advances/loans, auto-deduct EMI from monthly salary
- Deductions: LWP (leave without pay) auto-calculated from attendance
- Arrears: retroactive salary revision → calculate arrears → include in next payroll
- Payroll finalization workflow: HR prepares → Finance reviews → Super Admin approves → bank transfer file generated
- Bank transfer file: NEFT/RTGS format compatible with major Indian banks (ICICI, HDFC, SBI)
- Salary slip: auto-generated PDF (payslip) → emailed to staff + downloadable from portal

PERFORMANCE MANAGEMENT:
- Goal setting: manager sets KPIs for each staff member at start of academic year
- Mid-year review: progress assessment
- Annual appraisal: final rating (1-5 scale) with comments
- 360-degree feedback: peers + students (anonymous) + self-assessment
- AI performance scoring: combine attendance record, leave patterns, student feedback, appraisal ratings → composite performance score
- Increment calculation: performance score → recommended increment % → approval workflow

TRAINING & DEVELOPMENT:
- Training catalog: internal workshops, external certifications, online courses
- Training nomination: manager nominates staff for training
- Training completion tracking: certificate upload + credits earned
- Skill matrix: staff × skills → identify skill gaps at department level
- AI training recommendations: based on performance gaps and role requirements → suggest specific training

Stack: Node.js + PostgreSQL. Payroll engine: pure functions, extensively unit-tested. Bank file generation: custom formatter per bank format. PDF payslip: Puppeteer. Tax calculation: updated annually per Finance Ministry guidelines.
```

---

### PROMPT 23 — Sports, Health & Wellness Module

```
Build an integrated Sports Management and Health & Wellness module for an Institutional Management System.

SPORTS MANAGEMENT:
1. TEAM MANAGEMENT:
   - Create sports teams (Cricket, Football, Basketball, Chess, Athletics, etc.)
   - Student roster with position/role in team
   - Coach assignment (internal staff or external coach with separate login)
   - Practice schedule: recurring practice sessions on timetable, room/ground booking
   - Team performance history: match results, season records

2. TOURNAMENT MANAGEMENT:
   - Create tournaments (intra-school, inter-school, district-level)
   - Bracket generator: single elimination, double elimination, round-robin, league formats
   - Team/player registration: self-registration with coach approval
   - Registration fee collection via ID card wallet
   - Match scheduling: assign venue, date, time, referee
   - Live score entry: update scores in real-time during match → visible to all students/parents on match page
   - Results & rankings: auto-updated leaderboard
   - Certificate generation: winner, runner-up, participation certificates with names pre-filled

3. PLAYER ANALYTICS (AI):
   - Individual player statistics tracked across all matches
   - Performance trend: improving/declining per season
   - Talent identification: AI ranks students by performance potential per sport → highlights to coach
   - Team composition optimizer: AI suggests best starting lineup based on player stats vs opponent history

4. EQUIPMENT MANAGEMENT:
   - Equipment catalog: type, quantity, condition, purchase date, value
   - Issue/return: equipment checked out to team/individual with return date
   - Damage log: flag damaged equipment, calculate depreciation
   - Maintenance schedule: service dates for equipment (e.g., annual cricket kit refurbishment)
   - Budget tracker: sports department annual budget vs actual spend

HEALTH & WELLNESS MODULE:
1. STUDENT HEALTH RECORDS:
   - BMI tracker: height + weight recorded per health checkup → BMI calculated → trend graph
   - Medical history: known allergies, chronic conditions, medications, doctor contact
   - Vaccination record: immunization history with next due dates
   - Special needs: physical, learning, dietary restrictions — shared with relevant staff (teacher, canteen, PE teacher)
   - Access control: health records visible only to school nurse, principal, and parent (not teachers)

2. HEALTH CHECKUP MANAGEMENT:
   - Annual health checkup scheduling: batch students by class
   - Checkup data entry: doctor/nurse enters readings (vision, hearing, dental, BMI, blood pressure for seniors)
   - Automated health report per student (downloadable by parent)
   - Follow-up flagging: students with concerning readings → alert parent with recommendation

3. WELLNESS PROGRAMS:
   - Program catalog: yoga, meditation, anti-bullying, mental health awareness sessions
   - Enrollment tracking: which students participate
   - Session attendance
   - Outcome tracking: before/after surveys

4. COUNSELING:
   - Counselor can request referral for a student
   - Counseling session log (confidential — visible only to counselor + principal)
   - Concern categories: academic stress, peer conflict, family issues, behavioral
   - Follow-up scheduling

5. INCIDENT MANAGEMENT:
   - Medical incident report: date, student, description, action taken, parent notified
   - First aid log
   - Accident report (for insurance and compliance)
   - Pattern detection: AI flags if same student has repeated health incidents

Stack: React frontend with chart.js for health trend graphs. Node.js + PostgreSQL. Health data encrypted at column level (AES-256 via pgcrypto). Role-based access enforced at API level (health records excluded from teacher API responses).
```

---

### PROMPT 24 — Career Guidance & Alumni Management

```
Build a Career Guidance and Alumni Management module for the Premium Tier of an Institutional Management System.

CAREER GUIDANCE MODULE:
1. CAREER ASSESSMENT:
   - Psychometric aptitude tests: numerical, verbal, logical reasoning (auto-graded MCQ)
   - Interest inventory: Holland's RIASEC model (Realistic, Investigative, Artistic, Social, Enterprising, Conventional)
   - Personality quiz: Big Five traits assessment
   - AI Career Counselor: based on assessment results → suggests top 5 career paths with explanations
   - Report generation: personalized career guidance report (downloadable PDF)

2. CAREER RESOURCE LIBRARY:
   - Career profiles: detailed write-ups on 200+ career options (daily work, required education, salary range, growth prospects, top colleges)
   - Entrance exam guide: JEE, NEET, CLAT, CAT, UPSC — eligibility, syllabus, preparation tips
   - Scholarship database: government and private scholarships with eligibility and application deadlines
   - College search tool: filter by course, state, entrance exam, fees, ranking (NIRF)
   - Career events: webinars, expert talks, career fairs (virtual and physical)

3. COUNSELING:
   - One-on-one session booking with career counselor (internal or external)
   - Session notes (counselor-facing)
   - Action plan: goals and milestones set with student → progress tracked

4. MENTORSHIP MATCHING:
   - Connect current students with alumni mentors by field/career interest
   - Secure messaging between mentor and mentee
   - Session logging (mentors log their interaction hours)

ALUMNI MANAGEMENT MODULE:
1. ALUMNI PROFILES:
   - Auto-created on student graduation (converted from student record)
   - Alumni updates their own profile: current employer, designation, location, contact, LinkedIn
   - Achievement tracking: notable achievements, awards, publications
   - Privacy control: alumni controls what is visible to institution vs other alumni

2. ALUMNI NETWORK:
   - Searchable directory: find alumni by batch year, field, location, company
   - Alumni groups: batch-wise and field-wise interest groups
   - Discussion forum: alumni community board

3. ENGAGEMENT:
   - Reunion event management: invite alumni batch by batch, RSVP tracking, attendance
   - Alumni newsletter (auto-generated): highlights from institution + notable alumni achievements
   - Donation portal: alumni can contribute to institution development fund (with tax receipt)
   - Donation tracking: campaign-wise, donor-wise, year-wise

4. ALUMNI AS RESOURCES:
   - Guest lecture requests: institution can request alumni to speak to current students
   - Job posting: alumni can post job opportunities for graduating students
   - Internship opportunities: alumni companies can offer internships
   - Mentorship signup: alumni can volunteer as mentors

5. ANALYTICS:
   - Alumni by industry/field (pie chart)
   - Geographic distribution (map view)
   - Employment rate at 1/3/5 years post-graduation
   - Average salary trajectory
   - Engagement rate (how many alumni are active on the platform)

Stack: React frontend. Node.js + PostgreSQL. Psychometric assessments: custom MCQ engine. Career data: curated by content team (structured JSON). Alumni: separate module with alumni_id linked to historical student_id. Email campaigns: SendGrid with segmentation by batch/field.
```

---

## ═══════════════════════════════════════════
## INTEGRATION PROMPTS
## ═══════════════════════════════════════════

---

### PROMPT 25 — Payment Gateway Integration (Multi-Provider)

```
Implement a robust multi-provider payment gateway integration for an Institutional Management System.

SUPPORTED GATEWAYS:
1. Razorpay (primary for India): UPI, Cards, Net Banking, EMI, Wallets
2. PayU: alternative gateway with similar feature set
3. Stripe: for international payments
4. CCAvenue: for institutions requiring CCAvenue specifically

ARCHITECTURE:
- Payment abstraction layer: define a unified interface (createOrder, capturePayment, refundPayment, getStatus) → each gateway implements this interface → application code never directly calls gateway-specific code
- Gateway selection: configurable per institution (Super Admin selects which gateway is active)
- Fallback: if primary gateway is down → auto-failover to backup gateway (with alert to admin)

IMPLEMENTATION PER GATEWAY:
Razorpay:
- Create order server-side (POST /v1/orders) → return order_id to frontend
- Frontend: open Razorpay checkout modal with order_id
- Webhook: receive payment.captured event → verify signature (HMAC-SHA256) → mark invoice as paid
- Refund: POST /v1/payments/{id}/refund → link to original transaction

PayU:
- Generate hash server-side (MD5 of key|txnid|amount|productinfo|firstname|email|udf1|...|SALT)
- Redirect user to PayU payment page
- Success/failure redirect handling + S2S notification webhook
- Verify payment via PayU verify API before marking paid

PAYMENT FLOW (frontend):
- Click "Pay ₹[amount]" → loading indicator
- Call backend to create order → get order token
- Launch gateway checkout (modal or redirect)
- On success callback → backend webhook fires → invoice updated → success page shown
- On failure → retry option with different payment method

IDEMPOTENCY:
- Every payment creation request has a unique idempotency_key (UUID generated client-side)
- Backend rejects duplicate requests with same key → prevents double-charging on network retry
- Store idempotency_key → payment_id mapping in Redis (TTL: 24 hours)

RECONCILIATION:
- Daily reconciliation job: pull settlement report from each gateway → compare with internal payment records → flag discrepancies (missing payments, amount mismatches)
- Reconciliation dashboard: show matched, unmatched, excess entries
- Alert: any unmatched entry > ₹1000 → immediate notification to Finance team

SECURITY:
- Never log full card numbers or CVV (PCI-DSS compliance)
- Store only last 4 digits + card type in database
- All payment API calls server-side (no gateway credentials in frontend)
- Webhook signature verification before processing any webhook event
- HTTPS enforced for all payment pages

REPORTS:
- Transaction log: date, amount, gateway, method, status, gateway reference ID
- Settlement report: money received in bank account vs transactions processed
- Refund report: refunds issued with reasons
- Failed transaction analysis: failure reasons, retry success rate

Stack: Node.js. Each gateway SDK installed (razorpay, payumoneyjs, stripe). Webhook endpoints: POST /webhooks/razorpay, /webhooks/payu, /webhooks/stripe — all verified before processing. Redis for idempotency and session. PostgreSQL for transaction ledger.
```

---

## APPENDIX: QUICK-REFERENCE PROMPT CATALOG

| # | Prompt | Phase | Tier |
|---|--------|-------|------|
| 01 | RBAC Upgrade (8→17 Roles) | 1 | Basic+Premium |
| 02 | Super Admin Control Panel | 1 | Both |
| 03 | Student Management (Pro) | 1 | Both |
| 04 | Attendance System (Multi-modal + AI) | 1 | Both |
| 05 | Smart ID Card + Digital Wallet | 1 | Both |
| 06 | Fee Management (Pro) | 1 | Both |
| 07 | Parent & Student Portals | 2 | Premium |
| 08 | Marks, Grades & Report Cards | 2 | Premium |
| 09 | Library Management System | 2 | Premium |
| 10 | Transport Management + GPS | 2 | Premium |
| 11 | Canteen Management + POS | 2 | Premium |
| 12 | Hostel Management | 2 | Premium |
| 13 | Examination System (Full) | 3 | Premium |
| 14 | Curriculum & Lesson Planning | 3 | Premium |
| 15 | Online Classes & E-Learning | 3 | Premium |
| 16 | AI Tutoring Bot (24/7) | 4 | Premium |
| 17 | AI Analytics & BI Dashboard | 4 | Premium |
| 18 | Complaints & Grievances | 4 | Both |
| 19 | Security (2FA, SSO, DLP) | 5 | Premium |
| 20 | WhatsApp Bot + Notification Hub | 5 | Both |
| 21 | Multi-Campus + White-Label | 5 | Premium |
| 22 | Staff Management & Payroll | Add-on | Both |
| 23 | Sports, Health & Wellness | Add-on | Premium |
| 24 | Career Guidance & Alumni | Add-on | Premium |
| 25 | Payment Gateway (Multi-Provider) | Core | Both |

---

*Generated from: COMPLETE_INSTITUTIONAL_MANAGEMENT_SYSTEM.md*
*Total Prompts: 25 | Covering: 20+ modules, 17 roles, 2 tiers, all AI features*
