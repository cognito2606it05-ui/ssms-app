--
-- PostgreSQL database dump
--

\restrict D02sgthAcsaTVOrBN0kwnFOQFPDdsakoalrc5CopKC5wudZjtaUbWvROkd9UkFY

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_denials; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_denials (
    id integer NOT NULL,
    user_id integer,
    email text,
    active_role text,
    module_key text,
    action text,
    method text,
    path text,
    reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.audit_denials OWNER TO postgres;

--
-- Name: audit_denials_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_denials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_denials_id_seq OWNER TO postgres;

--
-- Name: audit_denials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_denials_id_seq OWNED BY public.audit_denials.id;


--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_log (
    id integer NOT NULL,
    actor_email text,
    actor_role text,
    action text NOT NULL,
    target text,
    ip text,
    meta jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.audit_log OWNER TO postgres;

--
-- Name: audit_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_log_id_seq OWNER TO postgres;

--
-- Name: audit_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_log_id_seq OWNED BY public.audit_log.id;


--
-- Name: backups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.backups (
    id integer NOT NULL,
    filename text NOT NULL,
    size_bytes bigint,
    created_by text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.backups OWNER TO postgres;

--
-- Name: backups_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.backups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.backups_id_seq OWNER TO postgres;

--
-- Name: backups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.backups_id_seq OWNED BY public.backups.id;


--
-- Name: data_export_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.data_export_log (
    id integer NOT NULL,
    actor_email text,
    dataset text,
    rows integer,
    ip text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.data_export_log OWNER TO postgres;

--
-- Name: data_export_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.data_export_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.data_export_log_id_seq OWNER TO postgres;

--
-- Name: data_export_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.data_export_log_id_seq OWNED BY public.data_export_log.id;


--
-- Name: erasure_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.erasure_requests (
    id integer NOT NULL,
    subject_email text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    requested_by text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    resolved_at timestamp with time zone
);


ALTER TABLE public.erasure_requests OWNER TO postgres;

--
-- Name: erasure_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.erasure_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.erasure_requests_id_seq OWNER TO postgres;

--
-- Name: erasure_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.erasure_requests_id_seq OWNED BY public.erasure_requests.id;


--
-- Name: fee_structures; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fee_structures (
    id integer NOT NULL,
    name text NOT NULL,
    amount numeric(12,2) NOT NULL,
    applies_to text,
    frequency text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.fee_structures OWNER TO postgres;

--
-- Name: fee_structures_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.fee_structures_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.fee_structures_id_seq OWNER TO postgres;

--
-- Name: fee_structures_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.fee_structures_id_seq OWNED BY public.fee_structures.id;


--
-- Name: holidays; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.holidays (
    id integer NOT NULL,
    title text NOT NULL,
    date date NOT NULL,
    kind text DEFAULT 'holiday'::text
);


ALTER TABLE public.holidays OWNER TO postgres;

--
-- Name: holidays_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.holidays_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.holidays_id_seq OWNER TO postgres;

--
-- Name: holidays_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.holidays_id_seq OWNED BY public.holidays.id;


--
-- Name: integration_credentials; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.integration_credentials (
    id integer NOT NULL,
    provider text NOT NULL,
    key_cipher text NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.integration_credentials OWNER TO postgres;

--
-- Name: integration_credentials_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.integration_credentials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.integration_credentials_id_seq OWNER TO postgres;

--
-- Name: integration_credentials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.integration_credentials_id_seq OWNED BY public.integration_credentials.id;


--
-- Name: login_attempts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.login_attempts (
    id integer NOT NULL,
    email text,
    ip text,
    success boolean NOT NULL,
    country text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.login_attempts OWNER TO postgres;

--
-- Name: login_attempts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.login_attempts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.login_attempts_id_seq OWNER TO postgres;

--
-- Name: login_attempts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.login_attempts_id_seq OWNED BY public.login_attempts.id;


--
-- Name: modules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.modules (
    key text NOT NULL,
    name text NOT NULL,
    sort integer DEFAULT 0
);


ALTER TABLE public.modules OWNER TO postgres;

--
-- Name: notification_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification_templates (
    id integer NOT NULL,
    channel text NOT NULL,
    name text NOT NULL,
    subject text,
    body text NOT NULL
);


ALTER TABLE public.notification_templates OWNER TO postgres;

--
-- Name: notification_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notification_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notification_templates_id_seq OWNER TO postgres;

--
-- Name: notification_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notification_templates_id_seq OWNED BY public.notification_templates.id;


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role_permissions (
    role_key text NOT NULL,
    module_key text NOT NULL,
    can_read boolean DEFAULT false NOT NULL,
    can_write boolean DEFAULT false NOT NULL,
    can_edit boolean DEFAULT false NOT NULL,
    can_delete boolean DEFAULT false NOT NULL,
    can_approve boolean DEFAULT false NOT NULL,
    can_export boolean DEFAULT false NOT NULL
);


ALTER TABLE public.role_permissions OWNER TO postgres;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    key text NOT NULL,
    name text NOT NULL,
    level integer NOT NULL,
    access_pct integer NOT NULL,
    tier text NOT NULL,
    is_custom boolean DEFAULT false NOT NULL,
    cloned_from text,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    twofa_required boolean DEFAULT false NOT NULL,
    CONSTRAINT roles_tier_check CHECK ((tier = ANY (ARRAY['basic'::text, 'premium'::text])))
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessions (
    id text NOT NULL,
    user_id integer,
    email text,
    role text,
    ip text,
    user_agent text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    last_activity timestamp with time zone DEFAULT now() NOT NULL,
    revoked boolean DEFAULT false NOT NULL,
    revoked_reason text
);


ALTER TABLE public.sessions OWNER TO postgres;

--
-- Name: settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.settings (
    key text NOT NULL,
    value jsonb NOT NULL
);


ALTER TABLE public.settings OWNER TO postgres;

--
-- Name: transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transactions (
    id integer NOT NULL,
    ref text NOT NULL,
    description text,
    amount numeric(12,2) NOT NULL,
    currency text DEFAULT 'INR'::text NOT NULL,
    role text,
    module text,
    method text,
    status text DEFAULT 'success'::text NOT NULL,
    gateway_ref text,
    approved_by text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.transactions OWNER TO postgres;

--
-- Name: transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.transactions_id_seq OWNER TO postgres;

--
-- Name: transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.transactions_id_seq OWNED BY public.transactions.id;


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_roles (
    user_id integer NOT NULL,
    role_key text NOT NULL,
    effective_from date
);


ALTER TABLE public.user_roles OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    name text,
    primary_role text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    locked boolean DEFAULT false NOT NULL,
    lock_reason text
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: audit_denials id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_denials ALTER COLUMN id SET DEFAULT nextval('public.audit_denials_id_seq'::regclass);


--
-- Name: audit_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_log ALTER COLUMN id SET DEFAULT nextval('public.audit_log_id_seq'::regclass);


--
-- Name: backups id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.backups ALTER COLUMN id SET DEFAULT nextval('public.backups_id_seq'::regclass);


--
-- Name: data_export_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.data_export_log ALTER COLUMN id SET DEFAULT nextval('public.data_export_log_id_seq'::regclass);


--
-- Name: erasure_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.erasure_requests ALTER COLUMN id SET DEFAULT nextval('public.erasure_requests_id_seq'::regclass);


--
-- Name: fee_structures id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fee_structures ALTER COLUMN id SET DEFAULT nextval('public.fee_structures_id_seq'::regclass);


--
-- Name: holidays id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.holidays ALTER COLUMN id SET DEFAULT nextval('public.holidays_id_seq'::regclass);


--
-- Name: integration_credentials id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.integration_credentials ALTER COLUMN id SET DEFAULT nextval('public.integration_credentials_id_seq'::regclass);


--
-- Name: login_attempts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.login_attempts ALTER COLUMN id SET DEFAULT nextval('public.login_attempts_id_seq'::regclass);


--
-- Name: notification_templates id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_templates ALTER COLUMN id SET DEFAULT nextval('public.notification_templates_id_seq'::regclass);


--
-- Name: transactions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions ALTER COLUMN id SET DEFAULT nextval('public.transactions_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: audit_denials; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_denials (id, user_id, email, active_role, module_key, action, method, path, reason, created_at) FROM stdin;
1	6	teacher@ssms.local	teacher	canteen	read	GET	/api/secure/canteen	no_module_grant	2026-06-10 00:13:34.127759+05:30
2	6	teacher@ssms.local	teacher	rbac	read	GET	/api/matrix	no_module_grant	2026-06-10 00:13:34.137395+05:30
\.


--
-- Data for Name: audit_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_log (id, actor_email, actor_role, action, target, ip, meta, created_at) FROM stdin;
1	super_admin@ssms.local	super_admin	settings.update	institution	127.0.0.1	{"field": "timezone"}	2026-06-10 00:42:08.989256+05:30
2	admin_staff@ssms.local	admin_staff	user.create	student#1042	127.0.0.1	{}	2026-06-10 00:42:08.989575+05:30
3	management@ssms.local	management	fee.approve	TXN100021	127.0.0.1	{}	2026-06-10 00:42:08.98969+05:30
4	super_admin@ssms.local	super_admin	session.revoke	ac88f6ba-0e7e-4573-83e7-f44e9c19fbb9	::ffff:127.0.0.1	{"reason": "Security review"}	2026-06-10 00:44:44.4953+05:30
\.


--
-- Data for Name: backups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.backups (id, filename, size_bytes, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: data_export_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.data_export_log (id, actor_email, dataset, rows, ip, created_at) FROM stdin;
1	super_admin@ssms.local	transactions	180	127.0.0.1	2026-06-10 00:42:08.989827+05:30
2	admin_staff@ssms.local	students	1248	10.0.0.5	2026-06-10 00:42:08.989827+05:30
\.


--
-- Data for Name: erasure_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.erasure_requests (id, subject_email, status, requested_by, created_at, resolved_at) FROM stdin;
\.


--
-- Data for Name: fee_structures; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fee_structures (id, name, amount, applies_to, frequency, created_at) FROM stdin;
1	Tuition Fee	45000.00	All Students	annual	2026-06-10 00:42:08.951983+05:30
2	Transport Fee	12000.00	Bus Users	annual	2026-06-10 00:42:08.952291+05:30
3	Hostel Fee	60000.00	Hostelers	annual	2026-06-10 00:42:08.952497+05:30
4	Lab Fee	5000.00	Science Stream	annual	2026-06-10 00:42:08.952697+05:30
5	Exam Fee	1500.00	All Students	one-time	2026-06-10 00:42:08.952905+05:30
\.


--
-- Data for Name: holidays; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.holidays (id, title, date, kind) FROM stdin;
1	Independence Day	2025-08-15	holiday
2	Mid-Term Exams	2025-09-22	exam
3	Diwali Break	2025-10-20	holiday
4	Annual Sports Day	2025-12-05	event
5	Final Exams	2026-03-10	exam
\.


--
-- Data for Name: integration_credentials; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.integration_credentials (id, provider, key_cipher, updated_at) FROM stdin;
1	Razorpay	0065a0278e4f5567c450adf8:68d84836910e1e130cf70905b6318412:ca9c8bd1900ac0d97d4d5785e42ea2a895cf87a541ba7eac2fc5a68b05	2026-06-10 00:42:08.954158+05:30
2	Twilio SMS	92ab365772c52a413b616e22:5afd1621c2b7c60948bf3a1206626e1e:5b10a3fda2d051de62c90de947ae6d424ccb78b373ecd0	2026-06-10 00:42:08.954461+05:30
3	SMTP / Email	519021e77f7e0b54d024a1e9:d535df5d3ea3e23a3f28bc422c2c7954:f94ac6aff24c03aa34f815ef8dfd4b4d0e47d2c4d0ed177408b0	2026-06-10 00:42:08.954628+05:30
\.


--
-- Data for Name: login_attempts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.login_attempts (id, email, ip, success, country, created_at) FROM stdin;
1	unknown@bad.com	82.167.172.125	t	Germany	2026-06-08 05:42:08.983972+05:30
2	unknown@bad.com	180.117.26.18	t	India	2026-06-07 21:42:08.984296+05:30
3	attacker@evil.io	104.68.227.89	t	Germany	2026-06-07 21:42:08.984416+05:30
4	attacker@evil.io	101.15.215.43	t	India	2026-06-07 03:42:08.984535+05:30
5	unknown@bad.com	15.128.81.32	f	India	2026-06-09 20:42:08.984654+05:30
6	teacher@ssms.local	45.219.95.107	t	India	2026-06-09 18:42:08.98479+05:30
7	super_admin@ssms.local	116.183.121.47	f	India	2026-06-08 06:42:08.984911+05:30
8	attacker@evil.io	216.172.14.92	f	Russia	2026-06-08 18:42:08.985038+05:30
9	teacher@ssms.local	207.224.188.164	f	India	2026-06-08 16:42:08.985164+05:30
10	super_admin@ssms.local	230.108.145.192	f	Russia	2026-06-07 23:42:08.985284+05:30
11	super_admin@ssms.local	179.208.47.237	t	United States	2026-06-07 04:42:08.985403+05:30
12	unknown@bad.com	179.205.191.228	t	India	2026-06-09 18:42:08.985519+05:30
13	unknown@bad.com	173.71.74.196	t	India	2026-06-07 10:42:08.98564+05:30
14	attacker@evil.io	202.118.119.19	f	India	2026-06-08 01:42:08.985764+05:30
15	unknown@bad.com	71.28.68.157	t	Nigeria	2026-06-08 12:42:08.985883+05:30
16	unknown@bad.com	169.157.189.22	t	Germany	2026-06-09 10:42:08.985996+05:30
17	super_admin@ssms.local	151.170.239.28	t	India	2026-06-08 15:42:08.986119+05:30
18	attacker@evil.io	217.37.157.215	f	India	2026-06-07 02:42:08.986229+05:30
19	attacker@evil.io	37.70.169.87	t	Russia	2026-06-08 10:42:08.986343+05:30
20	unknown@bad.com	126.124.37.77	t	Nigeria	2026-06-09 05:42:08.986452+05:30
21	attacker@evil.io	230.104.183.147	t	India	2026-06-08 07:42:08.98657+05:30
22	attacker@evil.io	101.226.115.122	f	India	2026-06-09 04:42:08.986679+05:30
23	super_admin@ssms.local	92.97.73.46	f	Germany	2026-06-08 04:42:08.986859+05:30
24	unknown@bad.com	78.52.212.93	f	India	2026-06-08 17:42:08.986974+05:30
25	teacher@ssms.local	81.137.92.132	f	United States	2026-06-08 21:42:08.987099+05:30
26	teacher@ssms.local	158.209.145.183	t	India	2026-06-07 14:42:08.987216+05:30
27	teacher@ssms.local	159.147.144.16	f	Nigeria	2026-06-08 00:42:08.987345+05:30
28	teacher@ssms.local	99.35.87.198	f	India	2026-06-09 10:42:08.987459+05:30
29	unknown@bad.com	118.38.38.51	t	United States	2026-06-09 23:42:08.987616+05:30
30	attacker@evil.io	20.56.74.68	f	United States	2026-06-08 07:42:08.987729+05:30
31	super_admin@ssms.local	73.106.198.130	f	United States	2026-06-08 21:42:08.98785+05:30
32	teacher@ssms.local	48.227.195.195	f	Germany	2026-06-08 03:42:08.987988+05:30
33	unknown@bad.com	113.199.165.3	t	Germany	2026-06-07 01:42:08.988116+05:30
34	teacher@ssms.local	77.17.79.198	t	India	2026-06-08 13:42:08.988293+05:30
35	teacher@ssms.local	201.109.147.195	f	Germany	2026-06-09 11:42:08.988421+05:30
36	attacker@evil.io	223.236.21.204	f	India	2026-06-09 17:42:08.988542+05:30
37	teacher@ssms.local	28.143.153.163	t	India	2026-06-07 08:42:08.988681+05:30
38	super_admin@ssms.local	194.36.138.155	f	India	2026-06-09 01:42:08.988797+05:30
39	attacker@evil.io	228.3.15.118	t	India	2026-06-09 07:42:08.988952+05:30
40	super_admin@ssms.local	67.197.115.124	t	Germany	2026-06-07 08:42:08.989118+05:30
41	super_admin@ssms.local	::ffff:127.0.0.1	t	India	2026-06-10 00:44:12.399888+05:30
42	teacher@ssms.local	::ffff:127.0.0.1	t	India	2026-06-10 00:44:44.269916+05:30
43	teacher@ssms.local	::ffff:127.0.0.1	t	India	2026-06-10 00:44:44.31956+05:30
44	super_admin@ssms.local	::ffff:127.0.0.1	t	India	2026-06-10 00:44:44.420366+05:30
\.


--
-- Data for Name: modules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.modules (key, name, sort) FROM stdin;
dashboard	Dashboard	0
students	Student Information	1
teachers	Teacher Management	2
staff	Staff Management	3
attendance	Attendance	4
fees	Fees & Collection	5
exams	Exams & Results	6
timetable	Timetable	7
library	Library	8
transport	Transport	9
hostel	Hostel	10
canteen	Canteen	11
store	Store / Inventory	12
sports	Sports	13
maintenance	Maintenance	14
security	Security / Gate	15
frontoffice	Front Office	16
lms	LMS / Learning	17
reports	Reports & Analytics	18
audit	Security & Audit Log	19
rbac	Roles & Permissions	20
users	User Management	21
settings	Settings	22
\.


--
-- Data for Name: notification_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notification_templates (id, channel, name, subject, body) FROM stdin;
1	email	Fee Reminder	Fee due for {{student_name}}	Dear {{parent_name}}, fees of {{amount}} for {{student_name}} are due on {{due_date}}.
2	sms	Absence Alert	\N	{{student_name}} was marked absent on {{date}}.
3	whatsapp	Exam Schedule	\N	Hi {{parent_name}}, {{student_name}}'s exams start {{exam_date}}.
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.role_permissions (role_key, module_key, can_read, can_write, can_edit, can_delete, can_approve, can_export) FROM stdin;
super_admin	dashboard	t	t	t	t	t	t
super_admin	students	t	t	t	t	t	t
super_admin	teachers	t	t	t	t	t	t
super_admin	staff	t	t	t	t	t	t
super_admin	attendance	t	t	t	t	t	t
super_admin	fees	t	t	t	t	t	t
super_admin	exams	t	t	t	t	t	t
super_admin	timetable	t	t	t	t	t	t
super_admin	library	t	t	t	t	t	t
super_admin	transport	t	t	t	t	t	t
super_admin	hostel	t	t	t	t	t	t
super_admin	canteen	t	t	t	t	t	t
super_admin	store	t	t	t	t	t	t
super_admin	sports	t	t	t	t	t	t
super_admin	maintenance	t	t	t	t	t	t
super_admin	security	t	t	t	t	t	t
super_admin	frontoffice	t	t	t	t	t	t
super_admin	lms	t	t	t	t	t	t
super_admin	reports	t	t	t	t	t	t
super_admin	audit	t	t	t	t	t	t
super_admin	rbac	t	t	t	t	t	t
super_admin	users	t	t	t	t	t	t
super_admin	settings	t	t	t	t	t	t
management	dashboard	t	f	f	f	f	t
management	students	t	t	t	f	f	t
management	teachers	t	t	t	f	f	t
management	staff	t	t	t	f	f	t
management	attendance	t	t	t	f	t	t
management	fees	t	t	t	f	t	t
management	exams	t	t	t	f	t	t
management	timetable	t	t	t	f	f	t
management	library	t	f	f	f	f	t
management	transport	t	t	t	f	f	t
management	hostel	t	t	t	f	f	t
management	canteen	t	f	f	f	f	t
management	store	t	f	f	f	f	t
management	sports	t	f	f	f	f	t
management	maintenance	t	t	t	f	t	t
management	security	t	f	f	f	f	t
management	frontoffice	t	t	t	f	f	t
management	lms	t	t	t	f	f	t
management	reports	t	f	f	f	f	t
management	audit	t	f	f	f	f	f
management	rbac	t	f	f	f	f	f
management	users	t	t	t	f	f	f
management	settings	t	t	t	f	f	f
admin_staff	dashboard	t	f	f	f	f	f
admin_staff	students	t	t	t	f	f	t
admin_staff	fees	t	t	t	f	f	t
admin_staff	attendance	t	t	t	f	f	t
admin_staff	timetable	t	t	t	f	f	t
admin_staff	frontoffice	t	t	t	f	f	t
admin_staff	exams	t	f	f	f	f	t
admin_staff	reports	t	f	f	f	f	t
admin_staff	users	t	f	f	f	f	f
admin_staff	library	t	f	f	f	f	f
admin_staff	transport	t	f	f	f	f	f
admin_staff	store	t	f	f	f	f	f
reception	dashboard	t	f	f	f	f	f
reception	frontoffice	t	t	t	f	f	t
reception	students	t	f	f	f	f	f
reception	attendance	t	f	f	f	f	f
reception	transport	t	f	f	f	f	f
reception	library	t	f	f	f	f	f
reception	fees	t	f	f	f	f	f
security_staff	dashboard	t	f	f	f	f	f
security_staff	security	t	t	t	f	f	t
security_staff	frontoffice	t	f	f	f	f	f
security_staff	attendance	t	f	f	f	f	f
security_staff	transport	t	f	f	f	f	f
security_staff	students	t	f	f	f	f	f
teacher	dashboard	t	f	f	f	f	f
teacher	students	t	f	f	f	f	t
teacher	attendance	t	t	t	f	f	t
teacher	exams	t	t	t	f	f	t
teacher	timetable	t	f	f	f	f	f
teacher	lms	t	t	t	f	f	t
teacher	reports	t	f	f	f	f	f
teacher	library	t	f	f	f	f	f
lab_technician	dashboard	t	f	f	f	f	f
lab_technician	store	t	t	t	f	f	f
lab_technician	maintenance	t	f	f	f	f	f
lab_technician	students	t	f	f	f	f	f
lab_technician	reports	t	f	f	f	f	f
lab_technician	exams	t	f	f	f	f	f
librarian	dashboard	t	f	f	f	f	f
librarian	library	t	t	t	t	t	t
librarian	students	t	f	f	f	f	f
librarian	reports	t	f	f	f	f	f
canteen_staff	dashboard	t	f	f	f	f	f
canteen_staff	canteen	t	t	t	t	t	t
canteen_staff	store	t	f	f	f	f	f
canteen_staff	reports	t	f	f	f	f	f
store_staff	dashboard	t	f	f	f	f	f
store_staff	store	t	t	t	t	t	t
store_staff	reports	t	f	f	f	f	f
sports_coord	dashboard	t	f	f	f	f	f
sports_coord	sports	t	t	t	t	t	t
sports_coord	students	t	f	f	f	f	f
sports_coord	timetable	t	f	f	f	f	f
sports_coord	reports	t	f	f	f	f	f
electrician	dashboard	t	f	f	f	f	f
electrician	maintenance	t	t	t	t	t	t
electrician	store	t	f	f	f	f	f
hostel_super	dashboard	t	f	f	f	f	f
hostel_super	hostel	t	t	t	t	t	t
hostel_super	students	t	f	f	f	f	f
hostel_super	attendance	t	t	f	f	f	f
hostel_super	reports	t	f	f	f	f	f
cleaning_staff	dashboard	t	f	f	f	f	f
cleaning_staff	maintenance	t	t	f	f	f	f
driver_staff	dashboard	t	f	f	f	f	f
driver_staff	transport	t	t	t	f	f	t
driver_staff	students	t	f	f	f	f	f
student	dashboard	t	f	f	f	f	f
student	timetable	t	f	f	f	f	f
student	exams	t	f	f	f	f	f
student	library	t	f	f	f	f	f
student	lms	t	f	f	f	f	f
student	fees	t	f	f	f	f	f
student	attendance	t	f	f	f	f	f
parent	dashboard	t	f	f	f	f	f
parent	attendance	t	f	f	f	f	f
parent	exams	t	f	f	f	f	f
parent	fees	t	t	f	f	f	f
parent	transport	t	f	f	f	f	f
parent	lms	t	f	f	f	f	f
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (key, name, level, access_pct, tier, is_custom, cloned_from, description, created_at, twofa_required) FROM stdin;
super_admin	Super Admin	1	100	basic	f	\N	Full, unrestricted system control.	2026-06-10 00:11:59.567252+05:30	f
management	Management	2	85	basic	f	\N	Principal / Dean / Director.	2026-06-10 00:11:59.568065+05:30	f
admin_staff	Administrative Staff	3	60	basic	f	\N	Office administration and records.	2026-06-10 00:11:59.568301+05:30	f
reception	Reception	3	60	basic	f	\N	Front desk and visitor handling.	2026-06-10 00:11:59.568505+05:30	f
security_staff	Security Staff	4	35	premium	f	\N	Gate, visitors and campus security.	2026-06-10 00:11:59.568686+05:30	f
teacher	Teacher	5	50	basic	f	\N	Teaching, attendance and results.	2026-06-10 00:11:59.56887+05:30	f
lab_technician	Lab Technician	5	50	premium	f	\N	Laboratory equipment and inventory.	2026-06-10 00:11:59.56904+05:30	f
librarian	Librarian	6	45	basic	f	\N	Library catalogue and lending.	2026-06-10 00:11:59.569232+05:30	f
canteen_staff	Canteen Staff	6	40	premium	f	\N	Canteen menu, stock and sales.	2026-06-10 00:11:59.569417+05:30	f
store_staff	Store / Stationery Staff	6	45	premium	f	\N	Stationery and general store.	2026-06-10 00:11:59.569668+05:30	f
sports_coord	Sports Coordinator	6	45	premium	f	\N	Sports, events and equipment.	2026-06-10 00:11:59.569939+05:30	f
electrician	Electrician / Maintenance	7	30	premium	f	\N	Facilities and maintenance tickets.	2026-06-10 00:11:59.570149+05:30	f
hostel_super	Hostel Supervisor	7	30	premium	f	\N	Hostel residents and discipline.	2026-06-10 00:11:59.57036+05:30	f
cleaning_staff	Cleaning Staff	7	20	premium	f	\N	Housekeeping task lists.	2026-06-10 00:11:59.57055+05:30	f
driver_staff	Driver / Transportation	8	25	premium	f	\N	Routes, vehicles and trips.	2026-06-10 00:11:59.570735+05:30	f
student	Student	9	35	basic	f	\N	Personal academics and resources.	2026-06-10 00:11:59.570921+05:30	f
parent	Parent	9	40	basic	f	\N	Ward's progress and payments.	2026-06-10 00:11:59.571111+05:30	f
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (id, user_id, email, role, ip, user_agent, created_at, last_activity, revoked, revoked_reason) FROM stdin;
1f8d5ddf-19ee-4c7a-b673-d2a8924ecb04	1	super_admin@ssms.local	super_admin	::ffff:127.0.0.1	curl/8.7.1	2026-06-10 00:44:12.401835+05:30	2026-06-10 00:44:12.862937+05:30	f	\N
10420881-4348-466f-a2b7-ace391a475ff	6	teacher@ssms.local	teacher	::ffff:127.0.0.1	curl/8.7.1	2026-06-10 00:44:44.271219+05:30	2026-06-10 00:44:44.289686+05:30	f	\N
ac88f6ba-0e7e-4573-83e7-f44e9c19fbb9	6	teacher@ssms.local	teacher	::ffff:127.0.0.1	curl/8.7.1	2026-06-10 00:44:44.320046+05:30	2026-06-10 00:44:44.378443+05:30	t	Security review
aa58adc7-80c3-44bd-afb8-1a8af408da72	1	super_admin@ssms.local	super_admin	::ffff:127.0.0.1	curl/8.7.1	2026-06-10 00:44:44.421404+05:30	2026-06-10 00:44:44.508285+05:30	f	\N
\.


--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.settings (key, value) FROM stdin;
institution	{"logo": "", "name": "Greenwood Smart Institute", "currency": "INR", "timezone": "Asia/Kolkata", "academic_year": "2025-2026"}
security	{"force_2fa_admins": true, "password_min_len": 8, "session_timeout_min": 30}
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transactions (id, ref, description, amount, currency, role, module, method, status, gateway_ref, approved_by, created_at) FROM stdin;
1	TXN100000	hostel payment	109.00	INR	admin_staff	hostel	netbanking	success	pay_opswj3fdme	\N	2026-04-04 00:42:08.955683+05:30
2	TXN100001	store payment	2438.00	INR	student	store	cash	success	pay_283d5kpqtu	\N	2025-08-14 00:42:08.956367+05:30
3	TXN100002	library payment	2225.00	INR	student	library	upi	pending	pay_g7s0g7k5lb	\N	2026-05-09 00:42:08.956532+05:30
4	TXN100003	fees payment	28663.00	INR	parent	fees	upi	success	pay_fh1kcs9jy1	\N	2026-05-21 00:42:08.956685+05:30
5	TXN100004	hostel payment	760.00	INR	admin_staff	hostel	netbanking	success	pay_zzfv1ypgoz	\N	2025-10-04 00:42:08.956855+05:30
6	TXN100005	canteen payment	2274.00	INR	student	canteen	upi	success	pay_5ahf16gl9p	\N	2026-01-11 00:42:08.957015+05:30
7	TXN100006	transport payment	438.00	INR	admin_staff	transport	netbanking	success	pay_c7ugwck71m	\N	2026-04-05 00:42:08.957156+05:30
8	TXN100007	hostel payment	351.00	INR	student	hostel	cash	failed	pay_n15gq6jyb1	\N	2025-11-24 00:42:08.957304+05:30
9	TXN100008	transport payment	347.00	INR	admin_staff	transport	card	success	pay_9scmooca4r	\N	2026-05-01 00:42:08.957442+05:30
10	TXN100009	fees payment	52041.00	INR	parent	fees	card	success	pay_aoktz7iziu	\N	2025-11-18 00:42:08.957581+05:30
11	TXN100010	hostel payment	158.00	INR	admin_staff	hostel	cash	success	pay_62bpp1jk6w	\N	2026-02-25 00:42:08.957722+05:30
12	TXN100011	store payment	2292.00	INR	parent	store	cash	success	pay_c2pcsdrkaj	\N	2025-11-11 00:42:08.957855+05:30
13	TXN100012	transport payment	2544.00	INR	parent	transport	card	success	pay_05wz5tfehp	\N	2026-04-01 00:42:08.958025+05:30
14	TXN100013	library payment	640.00	INR	parent	library	card	success	pay_3ailn8apm4	\N	2025-08-17 00:42:08.95819+05:30
15	TXN100014	store payment	282.00	INR	student	store	upi	failed	pay_w4a78dgm4z	\N	2026-03-07 00:42:08.958477+05:30
16	TXN100015	hostel payment	196.00	INR	admin_staff	hostel	cash	pending	pay_cbqe3g8jgr	\N	2026-03-06 00:42:08.958689+05:30
17	TXN100016	hostel payment	480.00	INR	parent	hostel	card	success	pay_mrdfvvzomy	\N	2025-08-21 00:42:08.958826+05:30
18	TXN100017	hostel payment	1993.00	INR	parent	hostel	card	pending	pay_s2gphkhdyq	\N	2025-10-17 00:42:08.958982+05:30
19	TXN100018	fees payment	57521.00	INR	student	fees	netbanking	success	pay_zjx7oa8u26	\N	2025-10-15 00:42:08.959131+05:30
20	TXN100019	transport payment	2050.00	INR	admin_staff	transport	cash	success	pay_r716yf1yug	\N	2025-06-19 00:42:08.959288+05:30
21	TXN100020	fees payment	44794.00	INR	student	fees	upi	success	pay_2eqx8m8rvg	\N	2025-08-05 00:42:08.959526+05:30
22	TXN100021	canteen payment	2903.00	INR	student	canteen	netbanking	success	pay_xi5tc7a6a9	\N	2026-03-26 00:42:08.959684+05:30
23	TXN100022	hostel payment	2214.00	INR	admin_staff	hostel	netbanking	success	pay_z6pq8r7cwq	\N	2026-03-13 00:42:08.959884+05:30
24	TXN100023	library payment	797.00	INR	admin_staff	library	card	success	pay_b4bk11euq3	\N	2026-02-25 00:42:08.960037+05:30
25	TXN100024	library payment	1213.00	INR	student	library	netbanking	pending	pay_shse0q0umb	\N	2026-03-22 00:42:08.960187+05:30
26	TXN100025	store payment	72.00	INR	student	store	cash	pending	pay_fn1vnrn55z	\N	2025-08-29 00:42:08.960356+05:30
27	TXN100026	transport payment	910.00	INR	parent	transport	netbanking	success	pay_fxknxxgnth	\N	2025-07-27 00:42:08.960563+05:30
28	TXN100027	fees payment	55689.00	INR	admin_staff	fees	upi	pending	pay_nhybsxblwz	\N	2025-10-14 00:42:08.960786+05:30
29	TXN100028	transport payment	1122.00	INR	student	transport	cash	pending	pay_6nvubgauzt	\N	2025-07-18 00:42:08.960948+05:30
30	TXN100029	canteen payment	630.00	INR	admin_staff	canteen	netbanking	success	pay_e9252cbnlq	\N	2026-01-14 00:42:08.961123+05:30
31	TXN100030	fees payment	53694.00	INR	parent	fees	card	success	pay_9axqr1bbhz	\N	2026-04-17 00:42:08.961261+05:30
32	TXN100031	transport payment	787.00	INR	admin_staff	transport	netbanking	success	pay_dnh6j2i4xo	\N	2025-06-11 00:42:08.96141+05:30
33	TXN100032	transport payment	919.00	INR	parent	transport	card	success	pay_1un2m7qsi6	\N	2026-04-15 00:42:08.961584+05:30
34	TXN100033	canteen payment	1287.00	INR	parent	canteen	upi	failed	pay_nos8r1dwhr	\N	2025-12-10 00:42:08.96174+05:30
35	TXN100034	hostel payment	1889.00	INR	parent	hostel	card	success	pay_cj8egrv0kh	\N	2025-12-18 00:42:08.961882+05:30
36	TXN100035	hostel payment	2744.00	INR	parent	hostel	upi	pending	pay_2ugdwbfbu6	\N	2025-07-25 00:42:08.962045+05:30
37	TXN100036	hostel payment	1780.00	INR	student	hostel	netbanking	success	pay_ghsh1597hv	\N	2025-08-29 00:42:08.962189+05:30
38	TXN100037	hostel payment	2796.00	INR	student	hostel	cash	failed	pay_0ppbtgmm2j	\N	2026-01-12 00:42:08.962354+05:30
39	TXN100038	library payment	1981.00	INR	admin_staff	library	upi	success	pay_255hy8fm4e	\N	2025-07-22 00:42:08.962489+05:30
40	TXN100039	canteen payment	804.00	INR	parent	canteen	netbanking	success	pay_i1i6ahxmo5	\N	2026-04-02 00:42:08.962624+05:30
41	TXN100040	transport payment	1646.00	INR	admin_staff	transport	netbanking	failed	pay_0a20e9xhvi	\N	2025-10-10 00:42:08.962788+05:30
42	TXN100041	hostel payment	985.00	INR	admin_staff	hostel	upi	success	pay_l4wprqysvi	\N	2026-01-30 00:42:08.962934+05:30
43	TXN100042	library payment	2879.00	INR	student	library	upi	success	pay_e97vn3c203	\N	2026-06-10 00:42:08.963074+05:30
44	TXN100043	fees payment	20728.00	INR	admin_staff	fees	cash	success	pay_xbnx9e9cuc	\N	2025-07-08 00:42:08.963223+05:30
45	TXN100044	canteen payment	529.00	INR	student	canteen	card	success	pay_io5t1izv5r	\N	2025-07-12 00:42:08.963372+05:30
46	TXN100045	hostel payment	2980.00	INR	admin_staff	hostel	cash	success	pay_sax5sxvc1u	\N	2025-11-05 00:42:08.963517+05:30
47	TXN100046	store payment	2408.00	INR	student	store	netbanking	success	pay_pc1kvcpl6l	\N	2026-04-17 00:42:08.963676+05:30
48	TXN100047	fees payment	51876.00	INR	parent	fees	upi	success	pay_gnt5adm2nt	\N	2026-05-14 00:42:08.963831+05:30
49	TXN100048	fees payment	21269.00	INR	parent	fees	netbanking	success	pay_0r14nit9en	\N	2025-09-28 00:42:08.963962+05:30
50	TXN100049	library payment	1209.00	INR	parent	library	netbanking	success	pay_7687l4wcw1	\N	2025-10-24 00:42:08.964128+05:30
51	TXN100050	fees payment	53393.00	INR	admin_staff	fees	upi	success	pay_zj65joby7	\N	2025-06-17 00:42:08.964277+05:30
52	TXN100051	canteen payment	2524.00	INR	admin_staff	canteen	netbanking	success	pay_oon4rj3qfj	\N	2025-11-11 00:42:08.96444+05:30
53	TXN100052	library payment	725.00	INR	student	library	upi	success	pay_nbwwo01lzd	\N	2025-08-20 00:42:08.964598+05:30
54	TXN100053	canteen payment	1145.00	INR	parent	canteen	cash	failed	pay_r3fgeqnk24	\N	2025-11-25 00:42:08.964746+05:30
55	TXN100054	hostel payment	2168.00	INR	admin_staff	hostel	upi	pending	pay_7pvz1bs2tw	\N	2026-01-13 00:42:08.965068+05:30
56	TXN100055	store payment	1191.00	INR	parent	store	upi	success	pay_id1757pgkj	\N	2026-05-11 00:42:08.965231+05:30
57	TXN100056	canteen payment	370.00	INR	student	canteen	netbanking	failed	pay_vd2xxh7fe3	\N	2025-09-29 00:42:08.965401+05:30
58	TXN100057	hostel payment	79.00	INR	admin_staff	hostel	cash	success	pay_muhxh3ksab	\N	2026-05-24 00:42:08.965552+05:30
59	TXN100058	library payment	2250.00	INR	parent	library	cash	pending	pay_50ramybw40	\N	2026-04-25 00:42:08.965703+05:30
60	TXN100059	canteen payment	2901.00	INR	admin_staff	canteen	netbanking	success	pay_f978bl0pyb	\N	2025-10-12 00:42:08.965849+05:30
61	TXN100060	library payment	312.00	INR	parent	library	netbanking	success	pay_78zpnmrvcp	\N	2026-01-08 00:42:08.965992+05:30
62	TXN100061	fees payment	8443.00	INR	parent	fees	upi	success	pay_b7c22w2wde	\N	2026-02-26 00:42:08.966156+05:30
63	TXN100062	hostel payment	2097.00	INR	admin_staff	hostel	netbanking	success	pay_dbz5bq0bhw	\N	2025-11-10 00:42:08.966316+05:30
64	TXN100063	fees payment	16084.00	INR	student	fees	netbanking	success	pay_jhsu4b24um	\N	2025-09-27 00:42:08.966608+05:30
65	TXN100064	store payment	2007.00	INR	parent	store	upi	success	pay_qmp7r23qh7	\N	2025-10-30 00:42:08.966758+05:30
66	TXN100065	fees payment	14902.00	INR	parent	fees	netbanking	pending	pay_o75dagjt1u	\N	2025-09-29 00:42:08.9669+05:30
67	TXN100066	fees payment	50347.00	INR	parent	fees	cash	success	pay_ts9283h0af	\N	2026-04-29 00:42:08.967054+05:30
68	TXN100067	canteen payment	1857.00	INR	parent	canteen	card	success	pay_2vu4o8rj6v	\N	2026-03-22 00:42:08.967193+05:30
69	TXN100068	transport payment	1495.00	INR	admin_staff	transport	upi	success	pay_xkhouyvv65	\N	2025-08-03 00:42:08.967347+05:30
70	TXN100069	canteen payment	2643.00	INR	parent	canteen	netbanking	success	pay_tb7emwc79r	\N	2025-10-20 00:42:08.967492+05:30
71	TXN100070	store payment	2362.00	INR	student	store	card	pending	pay_ca3ms7fy79	\N	2025-11-05 00:42:08.967629+05:30
72	TXN100071	canteen payment	1120.00	INR	parent	canteen	card	success	pay_am1aob0crj	\N	2025-08-21 00:42:08.967776+05:30
73	TXN100072	canteen payment	479.00	INR	student	canteen	cash	success	pay_wxjencxs1z	\N	2025-08-11 00:42:08.967917+05:30
74	TXN100073	hostel payment	757.00	INR	admin_staff	hostel	netbanking	pending	pay_r9s3mtgp72	\N	2025-07-04 00:42:08.968057+05:30
75	TXN100074	transport payment	877.00	INR	admin_staff	transport	netbanking	success	pay_aopqwg0wwl	\N	2025-09-24 00:42:08.968202+05:30
76	TXN100075	transport payment	1903.00	INR	admin_staff	transport	cash	success	pay_sfv9a04t14	\N	2026-01-08 00:42:08.968339+05:30
77	TXN100076	fees payment	54505.00	INR	admin_staff	fees	card	success	pay_k4xnz8j1td	\N	2026-03-10 00:42:08.968494+05:30
78	TXN100077	hostel payment	2443.00	INR	admin_staff	hostel	card	success	pay_jo1ka6s0hj	\N	2026-01-25 00:42:08.968629+05:30
79	TXN100078	fees payment	32079.00	INR	student	fees	cash	success	pay_at3x0idov	\N	2026-03-30 00:42:08.968762+05:30
80	TXN100079	store payment	2697.00	INR	student	store	cash	success	pay_cfwbetlmu6	\N	2026-02-20 00:42:08.968891+05:30
81	TXN100080	library payment	2371.00	INR	student	library	upi	success	pay_cztpnj0pvq	\N	2025-10-24 00:42:08.969016+05:30
82	TXN100081	hostel payment	626.00	INR	admin_staff	hostel	cash	success	pay_ncvy7l8cw7	\N	2026-01-09 00:42:08.96915+05:30
83	TXN100082	fees payment	41536.00	INR	student	fees	cash	success	pay_do3qo2oy5o	\N	2025-10-02 00:42:08.969284+05:30
84	TXN100083	fees payment	7700.00	INR	admin_staff	fees	upi	success	pay_d6j6jdgbhk	\N	2025-08-06 00:42:08.969446+05:30
85	TXN100084	hostel payment	2993.00	INR	admin_staff	hostel	cash	pending	pay_k9x046zbyb	\N	2026-01-01 00:42:08.969585+05:30
86	TXN100085	canteen payment	2568.00	INR	student	canteen	card	failed	pay_bof3umflz4	\N	2026-04-30 00:42:08.969794+05:30
87	TXN100086	fees payment	32626.00	INR	student	fees	cash	success	pay_9qbcumygno	\N	2025-09-26 00:42:08.969955+05:30
88	TXN100087	library payment	1643.00	INR	student	library	card	success	pay_95e7ag1qb5	\N	2025-07-10 00:42:08.970119+05:30
89	TXN100088	transport payment	2228.00	INR	student	transport	card	success	pay_roly8xak3r	\N	2026-02-20 00:42:08.970341+05:30
90	TXN100089	store payment	517.00	INR	student	store	cash	success	pay_qiorr624bt	\N	2025-08-18 00:42:08.970504+05:30
91	TXN100090	hostel payment	375.00	INR	parent	hostel	card	failed	pay_j20m28f82x	\N	2025-11-19 00:42:08.97065+05:30
92	TXN100091	fees payment	36423.00	INR	parent	fees	upi	success	pay_hcf9gd7gh0	\N	2026-02-20 00:42:08.970818+05:30
93	TXN100092	fees payment	52703.00	INR	parent	fees	upi	pending	pay_zl2z1hn86w	\N	2025-10-15 00:42:08.971039+05:30
94	TXN100093	canteen payment	2069.00	INR	admin_staff	canteen	card	failed	pay_cl53w6ff5f	\N	2025-10-05 00:42:08.971318+05:30
95	TXN100094	library payment	1615.00	INR	student	library	netbanking	success	pay_6qkoju82zx	\N	2025-12-11 00:42:08.971455+05:30
96	TXN100095	hostel payment	333.00	INR	student	hostel	card	failed	pay_p6aw8jf58p	\N	2026-05-31 00:42:08.971709+05:30
97	TXN100096	canteen payment	767.00	INR	student	canteen	card	success	pay_3k78izqr2c	\N	2025-12-27 00:42:08.97184+05:30
98	TXN100097	library payment	1395.00	INR	student	library	card	pending	pay_x81zioku76	\N	2025-08-11 00:42:08.972028+05:30
99	TXN100098	hostel payment	2987.00	INR	admin_staff	hostel	upi	success	pay_d47zpo2i1o	\N	2026-04-19 00:42:08.972186+05:30
100	TXN100099	store payment	1220.00	INR	admin_staff	store	cash	success	pay_80cgxucm2o	\N	2025-09-05 00:42:08.972359+05:30
101	TXN100100	hostel payment	1547.00	INR	admin_staff	hostel	card	success	pay_41htjmxu3u	\N	2026-04-10 00:42:08.972507+05:30
102	TXN100101	hostel payment	405.00	INR	admin_staff	hostel	cash	success	pay_vhnw1o1de0	\N	2026-01-06 00:42:08.972658+05:30
103	TXN100102	library payment	1666.00	INR	parent	library	cash	success	pay_i4yf4hg6sk	\N	2026-03-13 00:42:08.972808+05:30
104	TXN100103	canteen payment	1187.00	INR	admin_staff	canteen	netbanking	failed	pay_yt6fquafyd	\N	2025-12-08 00:42:08.972947+05:30
105	TXN100104	store payment	433.00	INR	admin_staff	store	card	success	pay_00hpkyy1ti	\N	2026-03-27 00:42:08.973132+05:30
106	TXN100105	library payment	2860.00	INR	parent	library	cash	pending	pay_osviiam5uk	\N	2025-10-18 00:42:08.973283+05:30
107	TXN100106	fees payment	10132.00	INR	admin_staff	fees	cash	pending	pay_c6bfdytvvl	\N	2025-12-23 00:42:08.973413+05:30
108	TXN100107	hostel payment	2401.00	INR	student	hostel	card	failed	pay_jl4s01m3q7	\N	2025-12-06 00:42:08.973537+05:30
109	TXN100108	hostel payment	845.00	INR	student	hostel	cash	success	pay_zhzvih6mof	\N	2026-03-21 00:42:08.973669+05:30
110	TXN100109	canteen payment	1312.00	INR	admin_staff	canteen	upi	pending	pay_q5kz2ldrg1	\N	2026-04-12 00:42:08.973791+05:30
111	TXN100110	canteen payment	2066.00	INR	admin_staff	canteen	cash	failed	pay_phpek76lui	\N	2025-07-30 00:42:08.973935+05:30
112	TXN100111	canteen payment	2106.00	INR	admin_staff	canteen	upi	success	pay_q2y1zwmxyh	\N	2025-06-18 00:42:08.974094+05:30
113	TXN100112	transport payment	2656.00	INR	parent	transport	cash	pending	pay_zkciaaa67x	\N	2025-10-11 00:42:08.974248+05:30
114	TXN100113	canteen payment	2253.00	INR	student	canteen	cash	success	pay_xoglid6rh8	\N	2025-09-08 00:42:08.974408+05:30
115	TXN100114	fees payment	8837.00	INR	student	fees	netbanking	success	pay_p1b7kf2y8f	\N	2025-08-23 00:42:08.974558+05:30
116	TXN100115	library payment	2816.00	INR	admin_staff	library	netbanking	success	pay_nxcgq1337i	\N	2025-10-26 00:42:08.974699+05:30
117	TXN100116	store payment	1022.00	INR	student	store	upi	pending	pay_e5hj3zntpi	\N	2026-05-27 00:42:08.974873+05:30
118	TXN100117	store payment	2622.00	INR	student	store	netbanking	success	pay_1s727l0b33	\N	2025-10-27 00:42:08.975029+05:30
119	TXN100118	canteen payment	1526.00	INR	admin_staff	canteen	cash	success	pay_pu7botr4eo	\N	2026-05-20 00:42:08.975166+05:30
120	TXN100119	canteen payment	2219.00	INR	parent	canteen	netbanking	failed	pay_qdgrg5r5hg	\N	2026-01-24 00:42:08.97531+05:30
121	TXN100120	transport payment	1855.00	INR	admin_staff	transport	upi	failed	pay_w0hoomuitg	\N	2026-04-06 00:42:08.975453+05:30
122	TXN100121	hostel payment	2703.00	INR	admin_staff	hostel	netbanking	failed	pay_3835s6fvra	\N	2026-01-18 00:42:08.975591+05:30
123	TXN100122	canteen payment	1425.00	INR	parent	canteen	card	success	pay_zzbxz0nl3e	\N	2025-12-18 00:42:08.975733+05:30
124	TXN100123	library payment	955.00	INR	admin_staff	library	netbanking	success	pay_54w15qsret	\N	2026-05-19 00:42:08.975873+05:30
125	TXN100124	library payment	2825.00	INR	admin_staff	library	cash	failed	pay_w1h0giwj2s	\N	2025-08-15 00:42:08.976008+05:30
126	TXN100125	hostel payment	2094.00	INR	parent	hostel	netbanking	failed	pay_s6d4tvj05w	\N	2025-12-01 00:42:08.976159+05:30
127	TXN100126	hostel payment	1300.00	INR	student	hostel	card	success	pay_fh9rdq3hrc	\N	2025-06-13 00:42:08.976292+05:30
128	TXN100127	transport payment	2349.00	INR	student	transport	cash	success	pay_tlnw5711eh	\N	2026-04-21 00:42:08.976439+05:30
129	TXN100128	store payment	663.00	INR	parent	store	cash	pending	pay_on91in5s4i	\N	2025-09-16 00:42:08.976568+05:30
130	TXN100129	library payment	845.00	INR	admin_staff	library	netbanking	success	pay_lh7hw7m5h0	\N	2026-04-23 00:42:08.976688+05:30
131	TXN100130	hostel payment	2273.00	INR	student	hostel	upi	success	pay_4w4n2dzulj	\N	2025-12-24 00:42:08.976828+05:30
132	TXN100131	store payment	2743.00	INR	student	store	upi	pending	pay_ndpgfgqx8x	\N	2026-01-02 00:42:08.976952+05:30
133	TXN100132	store payment	2245.00	INR	admin_staff	store	cash	success	pay_tb1nvcl680	\N	2026-04-11 00:42:08.977083+05:30
134	TXN100133	fees payment	39780.00	INR	admin_staff	fees	upi	success	pay_r2rrra4mkd	\N	2025-10-15 00:42:08.977214+05:30
135	TXN100134	hostel payment	689.00	INR	parent	hostel	netbanking	success	pay_gx2ouuqpi2	\N	2026-03-03 00:42:08.977348+05:30
136	TXN100135	canteen payment	1115.00	INR	parent	canteen	netbanking	success	pay_pg0vl52o3c	\N	2025-10-25 00:42:08.977775+05:30
137	TXN100136	store payment	790.00	INR	parent	store	upi	pending	pay_46nejo98rw	\N	2025-08-21 00:42:08.977898+05:30
138	TXN100137	canteen payment	1216.00	INR	admin_staff	canteen	cash	success	pay_57rg7cp0g7	\N	2026-03-01 00:42:08.978022+05:30
139	TXN100138	canteen payment	1160.00	INR	parent	canteen	upi	success	pay_pqw403dh2g	\N	2025-10-23 00:42:08.978148+05:30
140	TXN100139	store payment	1449.00	INR	student	store	upi	success	pay_hwffms40uv	\N	2025-06-11 00:42:08.978271+05:30
141	TXN100140	fees payment	52332.00	INR	admin_staff	fees	cash	failed	pay_7ks0yvczpn	\N	2025-09-28 00:42:08.978394+05:30
142	TXN100141	hostel payment	1386.00	INR	student	hostel	card	success	pay_mrap49rgld	\N	2025-12-06 00:42:08.978514+05:30
143	TXN100142	canteen payment	1992.00	INR	parent	canteen	upi	pending	pay_yvfswsj235	\N	2026-03-15 00:42:08.97864+05:30
144	TXN100143	library payment	1757.00	INR	parent	library	card	success	pay_me17y3akzj	\N	2025-12-25 00:42:08.978759+05:30
145	TXN100144	library payment	1220.00	INR	parent	library	netbanking	success	pay_y2wefm5vsr	\N	2026-01-28 00:42:08.978882+05:30
146	TXN100145	library payment	2139.00	INR	parent	library	cash	success	pay_flgca4o97m	\N	2026-03-19 00:42:08.979006+05:30
147	TXN100146	transport payment	1421.00	INR	parent	transport	cash	failed	pay_4zfeq2lnpo	\N	2026-01-26 00:42:08.979162+05:30
148	TXN100147	fees payment	11864.00	INR	student	fees	netbanking	success	pay_jxtcj53rga	\N	2025-07-30 00:42:08.979336+05:30
149	TXN100148	transport payment	563.00	INR	student	transport	netbanking	success	pay_c5ektilsxa	\N	2025-12-25 00:42:08.979503+05:30
150	TXN100149	canteen payment	1153.00	INR	student	canteen	card	success	pay_iokunwthii	\N	2026-05-14 00:42:08.979631+05:30
151	TXN100150	fees payment	10594.00	INR	admin_staff	fees	upi	success	pay_xuy7656v5h	\N	2026-04-08 00:42:08.979776+05:30
152	TXN100151	fees payment	37017.00	INR	admin_staff	fees	cash	success	pay_kuy2obr7w7	\N	2025-12-06 00:42:08.979969+05:30
153	TXN100152	transport payment	1660.00	INR	admin_staff	transport	cash	success	pay_evnnye5lps	\N	2025-08-07 00:42:08.980097+05:30
154	TXN100153	canteen payment	612.00	INR	admin_staff	canteen	netbanking	success	pay_4ybf32jror	\N	2026-02-27 00:42:08.980248+05:30
155	TXN100154	store payment	458.00	INR	student	store	cash	success	pay_9hdz59198w	\N	2026-03-20 00:42:08.980381+05:30
156	TXN100155	hostel payment	462.00	INR	admin_staff	hostel	netbanking	pending	pay_scvrlfc41x	\N	2026-01-18 00:42:08.980549+05:30
157	TXN100156	transport payment	1500.00	INR	admin_staff	transport	cash	success	pay_pz6vmsmap8	\N	2025-09-03 00:42:08.980688+05:30
158	TXN100157	fees payment	23210.00	INR	admin_staff	fees	netbanking	success	pay_p77xfend73	\N	2025-11-29 00:42:08.980831+05:30
159	TXN100158	hostel payment	627.00	INR	parent	hostel	cash	success	pay_6uwn6z7srb	\N	2025-12-27 00:42:08.980969+05:30
160	TXN100159	fees payment	57878.00	INR	student	fees	netbanking	pending	pay_ww702m6nde	\N	2026-04-22 00:42:08.981098+05:30
161	TXN100160	library payment	635.00	INR	student	library	netbanking	failed	pay_2lonm23g15	\N	2025-09-18 00:42:08.981222+05:30
162	TXN100161	fees payment	45878.00	INR	parent	fees	card	failed	pay_i6ov2jjmn7	\N	2026-03-25 00:42:08.981347+05:30
163	TXN100162	library payment	273.00	INR	admin_staff	library	netbanking	success	pay_7h7ejqeblm	\N	2026-03-16 00:42:08.981496+05:30
164	TXN100163	library payment	2048.00	INR	admin_staff	library	upi	success	pay_93g7h4n8in	\N	2026-03-20 00:42:08.981626+05:30
165	TXN100164	library payment	1603.00	INR	student	library	upi	pending	pay_61vtzrk2vy	\N	2025-06-22 00:42:08.981758+05:30
166	TXN100165	canteen payment	714.00	INR	student	canteen	card	pending	pay_ty0rtqb0pb	\N	2026-04-18 00:42:08.98189+05:30
167	TXN100166	store payment	110.00	INR	student	store	upi	pending	pay_yxmilh702n	\N	2026-01-28 00:42:08.982025+05:30
168	TXN100167	canteen payment	1023.00	INR	admin_staff	canteen	cash	success	pay_z8opllshux	\N	2026-06-03 00:42:08.982149+05:30
169	TXN100168	library payment	744.00	INR	student	library	upi	success	pay_4h213dw7ih	\N	2026-03-06 00:42:08.982275+05:30
170	TXN100169	library payment	1677.00	INR	parent	library	card	success	pay_6dx2x9dpqo	\N	2026-01-24 00:42:08.982399+05:30
171	TXN100170	canteen payment	385.00	INR	admin_staff	canteen	cash	success	pay_2laui3xyxe	\N	2025-12-21 00:42:08.982527+05:30
172	TXN100171	canteen payment	549.00	INR	student	canteen	netbanking	pending	pay_7vm3m9qaar	\N	2026-02-18 00:42:08.982649+05:30
173	TXN100172	hostel payment	2258.00	INR	parent	hostel	upi	failed	pay_086x9x33se	\N	2026-04-13 00:42:08.982769+05:30
174	TXN100173	canteen payment	826.00	INR	student	canteen	card	success	pay_9mqrrdry9m	\N	2025-12-27 00:42:08.982906+05:30
175	TXN100174	canteen payment	2582.00	INR	parent	canteen	upi	pending	pay_7zpqamzbe9	\N	2025-07-20 00:42:08.983032+05:30
176	TXN100175	store payment	719.00	INR	student	store	cash	pending	pay_0p7cip41xs	\N	2025-09-14 00:42:08.983158+05:30
177	TXN100176	transport payment	1476.00	INR	parent	transport	card	success	pay_g9rd2cwi0x	\N	2025-11-04 00:42:08.983425+05:30
178	TXN100177	library payment	2288.00	INR	parent	library	cash	success	pay_bd6zh8w46s	\N	2026-04-24 00:42:08.983545+05:30
179	TXN100178	canteen payment	1278.00	INR	parent	canteen	netbanking	failed	pay_kxcbrcbya2	\N	2026-01-27 00:42:08.98367+05:30
180	TXN100179	hostel payment	1740.00	INR	student	hostel	cash	success	pay_8eieitleu2	\N	2026-06-09 00:42:08.983788+05:30
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_roles (user_id, role_key, effective_from) FROM stdin;
1	super_admin	\N
2	management	\N
3	admin_staff	\N
4	reception	\N
5	security_staff	\N
6	teacher	\N
7	lab_technician	\N
8	librarian	\N
9	canteen_staff	\N
10	store_staff	\N
11	sports_coord	\N
12	electrician	\N
13	hostel_super	\N
14	cleaning_staff	\N
15	driver_staff	\N
16	student	\N
17	parent	\N
18	teacher	\N
18	hostel_super	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password_hash, name, primary_role, created_at, locked, lock_reason) FROM stdin;
1	super_admin@ssms.local	a2303370290c2e73ace5e8340ee810c4:8d57a9da757fb8742b871ced883c4bffa82336219dbad4ab0146e6700d5289a893f282459d78d49bb0cc7e2d7b0c69fcaf007dc56be5f79cf99387f7fa2dda80	Super Admin Demo	super_admin	2026-06-10 00:11:59.626829+05:30	f	\N
2	management@ssms.local	a2303370290c2e73ace5e8340ee810c4:8d57a9da757fb8742b871ced883c4bffa82336219dbad4ab0146e6700d5289a893f282459d78d49bb0cc7e2d7b0c69fcaf007dc56be5f79cf99387f7fa2dda80	Management Demo	management	2026-06-10 00:11:59.627931+05:30	f	\N
3	admin_staff@ssms.local	a2303370290c2e73ace5e8340ee810c4:8d57a9da757fb8742b871ced883c4bffa82336219dbad4ab0146e6700d5289a893f282459d78d49bb0cc7e2d7b0c69fcaf007dc56be5f79cf99387f7fa2dda80	Administrative Staff Demo	admin_staff	2026-06-10 00:11:59.628276+05:30	f	\N
4	reception@ssms.local	a2303370290c2e73ace5e8340ee810c4:8d57a9da757fb8742b871ced883c4bffa82336219dbad4ab0146e6700d5289a893f282459d78d49bb0cc7e2d7b0c69fcaf007dc56be5f79cf99387f7fa2dda80	Reception Demo	reception	2026-06-10 00:11:59.628598+05:30	f	\N
5	security_staff@ssms.local	a2303370290c2e73ace5e8340ee810c4:8d57a9da757fb8742b871ced883c4bffa82336219dbad4ab0146e6700d5289a893f282459d78d49bb0cc7e2d7b0c69fcaf007dc56be5f79cf99387f7fa2dda80	Security Staff Demo	security_staff	2026-06-10 00:11:59.628911+05:30	f	\N
6	teacher@ssms.local	a2303370290c2e73ace5e8340ee810c4:8d57a9da757fb8742b871ced883c4bffa82336219dbad4ab0146e6700d5289a893f282459d78d49bb0cc7e2d7b0c69fcaf007dc56be5f79cf99387f7fa2dda80	Teacher Demo	teacher	2026-06-10 00:11:59.629236+05:30	f	\N
7	lab_technician@ssms.local	a2303370290c2e73ace5e8340ee810c4:8d57a9da757fb8742b871ced883c4bffa82336219dbad4ab0146e6700d5289a893f282459d78d49bb0cc7e2d7b0c69fcaf007dc56be5f79cf99387f7fa2dda80	Lab Technician Demo	lab_technician	2026-06-10 00:11:59.629582+05:30	f	\N
8	librarian@ssms.local	a2303370290c2e73ace5e8340ee810c4:8d57a9da757fb8742b871ced883c4bffa82336219dbad4ab0146e6700d5289a893f282459d78d49bb0cc7e2d7b0c69fcaf007dc56be5f79cf99387f7fa2dda80	Librarian Demo	librarian	2026-06-10 00:11:59.629965+05:30	f	\N
9	canteen_staff@ssms.local	a2303370290c2e73ace5e8340ee810c4:8d57a9da757fb8742b871ced883c4bffa82336219dbad4ab0146e6700d5289a893f282459d78d49bb0cc7e2d7b0c69fcaf007dc56be5f79cf99387f7fa2dda80	Canteen Staff Demo	canteen_staff	2026-06-10 00:11:59.63028+05:30	f	\N
10	store_staff@ssms.local	a2303370290c2e73ace5e8340ee810c4:8d57a9da757fb8742b871ced883c4bffa82336219dbad4ab0146e6700d5289a893f282459d78d49bb0cc7e2d7b0c69fcaf007dc56be5f79cf99387f7fa2dda80	Store / Stationery Staff Demo	store_staff	2026-06-10 00:11:59.630582+05:30	f	\N
11	sports_coord@ssms.local	a2303370290c2e73ace5e8340ee810c4:8d57a9da757fb8742b871ced883c4bffa82336219dbad4ab0146e6700d5289a893f282459d78d49bb0cc7e2d7b0c69fcaf007dc56be5f79cf99387f7fa2dda80	Sports Coordinator Demo	sports_coord	2026-06-10 00:11:59.630909+05:30	f	\N
12	electrician@ssms.local	a2303370290c2e73ace5e8340ee810c4:8d57a9da757fb8742b871ced883c4bffa82336219dbad4ab0146e6700d5289a893f282459d78d49bb0cc7e2d7b0c69fcaf007dc56be5f79cf99387f7fa2dda80	Electrician / Maintenance Demo	electrician	2026-06-10 00:11:59.631207+05:30	f	\N
13	hostel_super@ssms.local	a2303370290c2e73ace5e8340ee810c4:8d57a9da757fb8742b871ced883c4bffa82336219dbad4ab0146e6700d5289a893f282459d78d49bb0cc7e2d7b0c69fcaf007dc56be5f79cf99387f7fa2dda80	Hostel Supervisor Demo	hostel_super	2026-06-10 00:11:59.631539+05:30	f	\N
14	cleaning_staff@ssms.local	a2303370290c2e73ace5e8340ee810c4:8d57a9da757fb8742b871ced883c4bffa82336219dbad4ab0146e6700d5289a893f282459d78d49bb0cc7e2d7b0c69fcaf007dc56be5f79cf99387f7fa2dda80	Cleaning Staff Demo	cleaning_staff	2026-06-10 00:11:59.631852+05:30	f	\N
15	driver_staff@ssms.local	a2303370290c2e73ace5e8340ee810c4:8d57a9da757fb8742b871ced883c4bffa82336219dbad4ab0146e6700d5289a893f282459d78d49bb0cc7e2d7b0c69fcaf007dc56be5f79cf99387f7fa2dda80	Driver / Transportation Demo	driver_staff	2026-06-10 00:11:59.632147+05:30	f	\N
16	student@ssms.local	a2303370290c2e73ace5e8340ee810c4:8d57a9da757fb8742b871ced883c4bffa82336219dbad4ab0146e6700d5289a893f282459d78d49bb0cc7e2d7b0c69fcaf007dc56be5f79cf99387f7fa2dda80	Student Demo	student	2026-06-10 00:11:59.632439+05:30	f	\N
17	parent@ssms.local	a2303370290c2e73ace5e8340ee810c4:8d57a9da757fb8742b871ced883c4bffa82336219dbad4ab0146e6700d5289a893f282459d78d49bb0cc7e2d7b0c69fcaf007dc56be5f79cf99387f7fa2dda80	Parent Demo	parent	2026-06-10 00:11:59.632709+05:30	f	\N
18	multi@ssms.local	a2303370290c2e73ace5e8340ee810c4:8d57a9da757fb8742b871ced883c4bffa82336219dbad4ab0146e6700d5289a893f282459d78d49bb0cc7e2d7b0c69fcaf007dc56be5f79cf99387f7fa2dda80	Multi-Role Demo (Teacher + Hostel)	teacher	2026-06-10 00:11:59.632999+05:30	f	\N
\.


--
-- Name: audit_denials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_denials_id_seq', 2, true);


--
-- Name: audit_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_log_id_seq', 4, true);


--
-- Name: backups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.backups_id_seq', 1, false);


--
-- Name: data_export_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.data_export_log_id_seq', 2, true);


--
-- Name: erasure_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.erasure_requests_id_seq', 1, false);


--
-- Name: fee_structures_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.fee_structures_id_seq', 5, true);


--
-- Name: holidays_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.holidays_id_seq', 5, true);


--
-- Name: integration_credentials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.integration_credentials_id_seq', 3, true);


--
-- Name: login_attempts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.login_attempts_id_seq', 44, true);


--
-- Name: notification_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notification_templates_id_seq', 3, true);


--
-- Name: transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.transactions_id_seq', 180, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 18, true);


--
-- Name: audit_denials audit_denials_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_denials
    ADD CONSTRAINT audit_denials_pkey PRIMARY KEY (id);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);


--
-- Name: backups backups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.backups
    ADD CONSTRAINT backups_pkey PRIMARY KEY (id);


--
-- Name: data_export_log data_export_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.data_export_log
    ADD CONSTRAINT data_export_log_pkey PRIMARY KEY (id);


--
-- Name: erasure_requests erasure_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.erasure_requests
    ADD CONSTRAINT erasure_requests_pkey PRIMARY KEY (id);


--
-- Name: fee_structures fee_structures_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fee_structures
    ADD CONSTRAINT fee_structures_pkey PRIMARY KEY (id);


--
-- Name: holidays holidays_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.holidays
    ADD CONSTRAINT holidays_pkey PRIMARY KEY (id);


--
-- Name: integration_credentials integration_credentials_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.integration_credentials
    ADD CONSTRAINT integration_credentials_pkey PRIMARY KEY (id);


--
-- Name: integration_credentials integration_credentials_provider_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.integration_credentials
    ADD CONSTRAINT integration_credentials_provider_key UNIQUE (provider);


--
-- Name: login_attempts login_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.login_attempts
    ADD CONSTRAINT login_attempts_pkey PRIMARY KEY (id);


--
-- Name: modules modules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_pkey PRIMARY KEY (key);


--
-- Name: notification_templates notification_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_templates
    ADD CONSTRAINT notification_templates_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_key, module_key);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (key);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (key);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_ref_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_ref_key UNIQUE (ref);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role_key);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_audit_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_created ON public.audit_denials USING btree (created_at DESC);


--
-- Name: idx_auditlog_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auditlog_created ON public.audit_log USING btree (created_at DESC);


--
-- Name: idx_login_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_login_created ON public.login_attempts USING btree (created_at DESC);


--
-- Name: idx_roleperm_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_roleperm_role ON public.role_permissions USING btree (role_key);


--
-- Name: idx_sessions_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sessions_user ON public.sessions USING btree (user_id);


--
-- Name: idx_tx_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tx_created ON public.transactions USING btree (created_at DESC);


--
-- Name: role_permissions role_permissions_module_key_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_module_key_fkey FOREIGN KEY (module_key) REFERENCES public.modules(key) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_role_key_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_key_fkey FOREIGN KEY (role_key) REFERENCES public.roles(key) ON DELETE CASCADE;


--
-- Name: roles roles_cloned_from_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_cloned_from_fkey FOREIGN KEY (cloned_from) REFERENCES public.roles(key);


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_role_key_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_key_fkey FOREIGN KEY (role_key) REFERENCES public.roles(key) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_primary_role_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_primary_role_fkey FOREIGN KEY (primary_role) REFERENCES public.roles(key);


--
-- PostgreSQL database dump complete
--

\unrestrict D02sgthAcsaTVOrBN0kwnFOQFPDdsakoalrc5CopKC5wudZjtaUbWvROkd9UkFY

