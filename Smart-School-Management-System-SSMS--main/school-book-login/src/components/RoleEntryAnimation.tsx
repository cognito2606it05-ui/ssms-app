import { useEffect, lazy, Suspense } from 'react';
import { motion } from 'motion/react';

// three.js is heavy, so the 3D character is split into its own chunk and only
// fetched when an entry animation actually plays (the SVG shows meanwhile).
const Character3D = lazy(() => import('./Character3D'));

/**
 * RoleEntryAnimation
 * -------------------
 * A premium, 5-second cinematic splash that plays when a user picks ANY
 * login role. A stylized 3D-cartoon character walks in from the left and
 * physically *pushes* the login container into the centre of the screen to
 * reveal the credential fields underneath.
 *
 * Every selectable role has its own character styling (accent colour +
 * themed accessories) but shares the same choreographed 5-second timeline.
 */

export type EntryRole =
  | 'Super Admin'
  | 'Management'
  | 'Teacher'
  | 'Student'
  | 'Parent'
  | 'Security'
  | 'Reception'
  | 'Store'
  | 'Accounts'
  | 'Librarian'
  | 'Canteen Manager';

type Headgear = 'crown' | 'cap' | 'chefhat';
type Handheld =
  | 'shield'
  | 'briefcase'
  | 'box'
  | 'calculator'
  | 'books'
  | 'clipboard'
  | 'pointer';

interface RoleConfig {
  label: string;
  sub: string;
  accent: string;
  accentDeep: string;
  shirt: string;
  shirtDeep: string;
  hair: string;
  headgear?: Headgear;
  handheld?: Handheld;
  glasses?: boolean;
  backpack?: boolean;
  headset?: boolean;
}

const ROLE_CONFIG: Record<EntryRole, RoleConfig> = {
  'Super Admin': {
    label: 'Super Admin Console',
    sub: 'Unlocking full system control',
    accent: '#ef4444', accentDeep: '#b91c1c',
    shirt: '#f87171', shirtDeep: '#dc2626', hair: '#1f2937',
    headgear: 'crown', handheld: 'shield',
  },
  Management: {
    label: 'Management Suite',
    sub: 'Loading your operations dashboard',
    accent: '#f97316', accentDeep: '#c2410c',
    shirt: '#fb923c', shirtDeep: '#ea580c', hair: '#3b2417',
    handheld: 'clipboard',
  },
  Teacher: {
    label: 'Teacher Portal',
    sub: 'Preparing your classroom tools',
    accent: '#3b82f6', accentDeep: '#1d4ed8',
    shirt: '#60a5fa', shirtDeep: '#2563eb', hair: '#1f2937',
    glasses: true, handheld: 'pointer',
  },
  Student: {
    label: 'Student Portal',
    sub: 'Setting up your learning space',
    accent: '#22c55e', accentDeep: '#15803d',
    shirt: '#34d399', shirtDeep: '#059669', hair: '#3b2417',
    backpack: true,
  },
  Parent: {
    label: 'Parent Portal',
    sub: "Connecting to your child's journey",
    accent: '#a855f7', accentDeep: '#7e22ce',
    shirt: '#c084fc', shirtDeep: '#9333ea', hair: '#2d2a32',
    handheld: 'briefcase',
  },
  Security: {
    label: 'Security Desk',
    sub: 'Securing the campus gates',
    accent: '#475569', accentDeep: '#1e293b',
    shirt: '#64748b', shirtDeep: '#334155', hair: '#111827',
    headgear: 'cap', handheld: 'shield',
  },
  Reception: {
    label: 'Reception Desk',
    sub: 'Opening up the front office',
    accent: '#ca8a04', accentDeep: '#a16207',
    shirt: '#eab308', shirtDeep: '#ca8a04', hair: '#4b2e1e',
    headset: true,
  },
  Store: {
    label: 'Store & Inventory',
    sub: 'Stocking up the shelves',
    accent: '#78716c', accentDeep: '#44403c',
    shirt: '#a8a29e', shirtDeep: '#78716c', hair: '#292524',
    handheld: 'box',
  },
  Accounts: {
    label: 'Accounts Office',
    sub: 'Balancing the books',
    accent: '#059669', accentDeep: '#047857',
    shirt: '#34d399', shirtDeep: '#059669', hair: '#1f2937',
    handheld: 'calculator',
  },
  Librarian: {
    label: 'Library Portal',
    sub: 'Organising the shelves',
    accent: '#4f46e5', accentDeep: '#3730a3',
    shirt: '#818cf8', shirtDeep: '#4f46e5', hair: '#3b2417',
    glasses: true, handheld: 'books',
  },
  'Canteen Manager': {
    label: 'Canteen Manager',
    sub: 'Firing up the kitchen',
    accent: '#d97706', accentDeep: '#b45309',
    shirt: '#fbbf24', shirtDeep: '#d97706', hair: '#2d2a32',
    headgear: 'chefhat',
  },
};

const DEFAULT_CONFIG: RoleConfig = {
  label: 'Welcome',
  sub: 'Preparing your portal',
  accent: '#3b82f6', accentDeep: '#1d4ed8',
  shirt: '#60a5fa', shirtDeep: '#2563eb', hair: '#1f2937',
};

const DURATION = 5; // seconds — the smooth, professional entry duration.

/** Resolve a role's accent theme for use elsewhere (login container, bg). */
export function getRoleTheme(role: string): { accent: string; accentDeep: string; label: string } {
  const cfg = ROLE_CONFIG[role as EntryRole] ?? DEFAULT_CONFIG;
  return { accent: cfg.accent, accentDeep: cfg.accentDeep, label: cfg.label };
}

/**
 * The shared premium auth backdrop — the same radial gradient + breathing
 * accent glow used by the entry splash, so the login pages match the
 * cinematic intro. Render it as a full-bleed, behind-content layer.
 */
export function AuthBackground({
  accent,
  darkMode,
  className = '',
}: {
  accent: string;
  darkMode: boolean;
  className?: string;
}) {
  return (
    <div className={`overflow-hidden pointer-events-none ${className}`} aria-hidden>
      {/* Glass Forest base: #003366 -> #0056B3 -> #0EA5E9 */}
      <div
        className="absolute inset-0"
        style={{
          background: darkMode
            ? 'linear-gradient(135deg, #001a33 0%, #003366 45%, #075985 100%)'
            : 'linear-gradient(135deg, #003366 0%, #0056B3 45%, #0EA5E9 100%)',
        }}
      />
      {/* forest glow + role accent orbs (layered depth) */}
      <div className="gf-orb" style={{ width: 480, height: 480, left: '-8%', top: '-12%', background: 'rgba(16,185,129,0.28)' }} />
      <div className="gf-orb" style={{ width: 420, height: 420, right: '-6%', bottom: '-10%', background: 'rgba(14,165,233,0.30)', animationDelay: '2.5s' }} />
      <motion.div
        className="absolute left-1/2 top-1/2 rounded-full blur-3xl"
        style={{ width: 640, height: 640, marginLeft: -320, marginTop: -320, background: accent, opacity: 0.16 }}
        animate={{ scale: [0.92, 1.06, 0.92], opacity: [0.12, 0.2, 0.12] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* crystal sheen sweep */}
      <motion.div
        className="absolute inset-y-0 w-1/3"
        style={{ background: 'linear-gradient(105deg, transparent, rgba(255,255,255,0.07), transparent)' }}
        animate={{ x: ['-40vw', '120vw'] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Accessory sub-renderers                                             */
/* ------------------------------------------------------------------ */

// Drawn ON TOP of the head. Head local origin is (0,0) with radius 32.
function HeadGear({ kind, accent }: { kind: Headgear; accent: string }) {
  switch (kind) {
    case 'crown':
      return (
        <g transform="translate(0 -30)">
          <path d="M-22 4 L-22 -14 L-10 -2 L0 -18 L10 -2 L22 -14 L22 4 Z" fill="url(#rea-gold)" stroke="#b45309" strokeWidth="1.5" />
          <circle cx="-10" cy="-2" r="2.4" fill="#ef4444" />
          <circle cx="0" cy="-10" r="2.4" fill="#3b82f6" />
          <circle cx="10" cy="-2" r="2.4" fill="#22c55e" />
        </g>
      );
    case 'cap':
      return (
        <g transform="translate(0 -28)">
          <path d="M-26 6 q26 -10 52 0 q-2 -22 -26 -22 q-24 0 -26 22 z" fill="#1e293b" />
          <rect x="-30" y="4" width="60" height="7" rx="3.5" fill="#0f172a" />
          <circle cx="0" cy="-12" r="5" fill={accent} stroke="#cbd5e1" strokeWidth="1.5" />
        </g>
      );
    case 'chefhat':
      return (
        <g transform="translate(0 -34)">
          <rect x="-20" y="2" width="40" height="12" rx="4" fill="#f8fafc" />
          <circle cx="-16" cy="-2" r="13" fill="#ffffff" />
          <circle cx="0" cy="-10" r="16" fill="#ffffff" />
          <circle cx="16" cy="-2" r="13" fill="#ffffff" />
        </g>
      );
  }
}

// Drawn in FRONT of the body, near the leading (pushing) hand at ~(196,176).
function HandHeld({ kind, accent, accentDeep }: { kind: Handheld; accent: string; accentDeep: string }) {
  switch (kind) {
    case 'shield':
      return (
        <g transform="translate(190 150)">
          <path d="M0 0 L36 0 L36 22 Q36 42 18 50 Q0 42 0 22 Z" fill="url(#rea-acc)" stroke="#ffffff" strokeWidth="2" />
          <path d="M18 12 l6 6 -10 12 -8 -8 4 -4 4 4 z" fill="#ffffff" />
        </g>
      );
    case 'briefcase':
      return (
        <g transform="translate(186 168)">
          <rect x="0" y="0" width="46" height="34" rx="6" fill="#92400e" />
          <rect x="0" y="11" width="46" height="6" fill="#78350f" />
          <rect x="16" y="-8" width="14" height="10" rx="3" fill="none" stroke="#78350f" strokeWidth="3" />
        </g>
      );
    case 'box':
      return (
        <g transform="translate(184 156)">
          <rect x="0" y="6" width="44" height="38" rx="3" fill="#d6a460" />
          <path d="M0 6 L22 16 L44 6" fill="none" stroke="#a9743b" strokeWidth="2" />
          <rect x="18" y="6" width="8" height="38" fill="#c2410c" opacity="0.5" />
        </g>
      );
    case 'calculator':
      return (
        <g transform="translate(196 162)">
          <rect x="0" y="0" width="30" height="40" rx="4" fill="#1f2937" />
          <rect x="4" y="4" width="22" height="9" rx="2" fill={accent} />
          {[0, 1, 2].map((r) => [0, 1, 2].map((c) => (
            <rect key={`${r}-${c}`} x={5 + c * 8} y={17 + r * 7} width="5" height="5" rx="1" fill="#94a3b8" />
          )))}
        </g>
      );
    case 'books':
      return (
        <g transform="translate(188 150)">
          <rect x="0" y="30" width="42" height="12" rx="2" fill={accentDeep} />
          <rect x="3" y="18" width="38" height="12" rx="2" fill={accent} />
          <rect x="1" y="6" width="40" height="12" rx="2" fill="#f59e0b" />
        </g>
      );
    case 'clipboard':
      return (
        <g transform="translate(192 156)">
          <rect x="0" y="0" width="32" height="42" rx="4" fill="#78716c" />
          <rect x="4" y="5" width="24" height="33" rx="2" fill="#ffffff" />
          <rect x="11" y="-4" width="10" height="8" rx="2" fill="#44403c" />
          <line x1="8" y1="14" x2="24" y2="14" stroke="#cbd5e1" strokeWidth="2" />
          <line x1="8" y1="22" x2="24" y2="22" stroke="#cbd5e1" strokeWidth="2" />
          <line x1="8" y1="30" x2="18" y2="30" stroke="#cbd5e1" strokeWidth="2" />
        </g>
      );
    case 'pointer':
      return (
        <g transform="translate(196 120)">
          <rect x="0" y="0" width="6" height="64" rx="3" fill="#a16207" transform="rotate(28 3 32)" />
          <circle cx="-13" cy="58" r="5" fill="#ef4444" />
        </g>
      );
  }
}

/* ------------------------------------------------------------------ */
/* The cartoon character — layered SVG with gradients + soft shadows,   */
/* drawn in a forward-leaning "pushing" pose, facing right.             */
/* ------------------------------------------------------------------ */
function CartoonCharacter({ cfg }: { cfg: RoleConfig }) {
  const stride = {
    animate: { rotate: [16, -16, 16] },
    transition: { duration: 0.62, repeat: Infinity, ease: 'easeInOut' as const },
  };
  const strideBack = {
    animate: { rotate: [-16, 16, -16] },
    transition: { duration: 0.62, repeat: Infinity, ease: 'easeInOut' as const },
  };

  return (
    <svg width="240" height="300" viewBox="0 0 240 300" fill="none" style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id="rea-skin" cx="40%" cy="35%" r="75%">
          <stop offset="0%" stopColor="#ffe0c2" />
          <stop offset="100%" stopColor="#f0b384" />
        </radialGradient>
        <linearGradient id="rea-shirt" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={cfg.shirt} />
          <stop offset="100%" stopColor={cfg.shirtDeep} />
        </linearGradient>
        <linearGradient id="rea-pants" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#475569" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
        <radialGradient id="rea-hair" cx="35%" cy="25%" r="80%">
          <stop offset="0%" stopColor={cfg.hair} stopOpacity="0.92" />
          <stop offset="100%" stopColor={cfg.hair} />
        </radialGradient>
        <linearGradient id="rea-acc" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={cfg.accent} />
          <stop offset="100%" stopColor={cfg.accentDeep} />
        </linearGradient>
        <linearGradient id="rea-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
        <filter id="rea-soft" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#0f172a" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* contact shadow on the ground */}
      <motion.ellipse
        cx="118" cy="284" rx="78" ry="13" fill="#0f172a" opacity="0.18"
        animate={{ rx: [78, 70, 78], opacity: [0.18, 0.13, 0.18] }}
        transition={{ duration: 0.62, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* whole-body bob */}
      <motion.g
        filter="url(#rea-soft)"
        animate={{ y: [0, -7, 0] }}
        transition={{ duration: 0.62, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* legs (walk cycle) */}
        <motion.g style={{ transformBox: 'fill-box', transformOrigin: '50% 0%' }} {...strideBack}>
          <rect x="86" y="196" width="26" height="66" rx="13" fill="url(#rea-pants)" />
          <ellipse cx="92" cy="266" rx="20" ry="11" fill="#0f172a" />
        </motion.g>
        <motion.g style={{ transformBox: 'fill-box', transformOrigin: '50% 0%' }} {...stride}>
          <rect x="112" y="196" width="26" height="70" rx="13" fill="url(#rea-pants)" />
          <ellipse cx="124" cy="270" rx="22" ry="11" fill="#1e293b" />
        </motion.g>

        {/* torso (leaning forward to push) */}
        <g transform="rotate(10 118 150)">
          {cfg.backpack && (
            <g>
              <rect x="58" y="120" width="42" height="60" rx="16" fill="url(#rea-acc)" />
              <rect x="66" y="138" width="26" height="22" rx="7" fill="#ffffff" opacity="0.35" />
            </g>
          )}

          <path d="M92 132 q26 -14 52 0 q10 40 4 70 q-30 12 -60 0 q-8 -34 4 -70 z" fill="url(#rea-shirt)" />
          <path d="M104 130 q14 -6 26 0 q4 30 0 60 q-14 5 -28 0 q-2 -30 2 -60 z" fill="#ffffff" opacity="0.12" />

          {/* arms extended forward (pushing) */}
          <g>
            <rect x="132" y="146" width="62" height="20" rx="10" fill="url(#rea-shirt)" />
            <circle cx="196" cy="156" r="13" fill="url(#rea-skin)" />
          </g>
          <motion.g
            style={{ transformBox: 'fill-box', transformOrigin: '0% 50%' }}
            animate={{ rotate: [0, -4, 0] }}
            transition={{ duration: 0.62, repeat: Infinity, ease: 'easeInOut' }}
          >
            <rect x="130" y="160" width="68" height="21" rx="10.5" fill="url(#rea-acc)" />
            <circle cx="200" cy="170" r="14" fill="url(#rea-skin)" />
          </motion.g>

          {/* head */}
          <g transform="translate(118 96)">
            <rect x="-9" y="20" width="18" height="20" rx="9" fill="url(#rea-skin)" />
            <circle cx="0" cy="0" r="32" fill="url(#rea-skin)" />
            <circle cx="-26" cy="4" r="7" fill="url(#rea-skin)" />
            <path d="M-33 -6 q-2 -34 33 -34 q35 0 33 34 q-10 -18 -33 -18 q-23 0 -33 18 z" fill="url(#rea-hair)" />

            {/* face */}
            <circle cx="12" cy="-2" r="3.6" fill="#1f2937" />
            <circle cx="26" cy="-2" r="3.6" fill="#1f2937" />
            <path d="M10 14 q9 8 18 0" stroke="#b45309" strokeWidth="3" strokeLinecap="round" fill="none" />
            <circle cx="9" cy="10" r="4" fill="#fb7185" opacity="0.5" />
            <circle cx="29" cy="10" r="4" fill="#fb7185" opacity="0.5" />

            {cfg.glasses && (
              <g stroke="#1f2937" strokeWidth="2.4" fill="none">
                <circle cx="12" cy="-2" r="7.5" />
                <circle cx="29" cy="-2" r="7.5" />
                <path d="M19.5 -2 h2" />
              </g>
            )}

            {cfg.headset && (
              <g>
                <path d="M-30 -2 q0 -34 30 -34 q30 0 30 34" fill="none" stroke="#1f2937" strokeWidth="4" />
                <rect x="-36" y="-4" width="10" height="16" rx="4" fill="#1f2937" />
                <path d="M-26 8 q-14 6 -10 22" fill="none" stroke="#1f2937" strokeWidth="3" />
                <circle cx="-36" cy="30" r="4" fill={cfg.accent} />
              </g>
            )}

            {cfg.headgear && <HeadGear kind={cfg.headgear} accent={cfg.accent} />}
          </g>
        </g>

        {cfg.handheld && <HandHeld kind={cfg.handheld} accent={cfg.accent} accentDeep={cfg.accentDeep} />}
      </motion.g>
    </svg>
  );
}

export default function RoleEntryAnimation({
  role,
  darkMode,
  onComplete,
}: {
  role: EntryRole;
  darkMode: boolean;
  onComplete: () => void;
}) {
  const cfg = ROLE_CONFIG[role] ?? DEFAULT_CONFIG;

  useEffect(() => {
    const t = setTimeout(onComplete, DURATION * 1000);
    return () => clearTimeout(t);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[300] flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.6 } }}
      transition={{ duration: 0.4 }}
    >
      <AuthBackground accent={cfg.accent} darkMode={darkMode} className="absolute inset-0" />

      {/* The push-rig: character + container travel together from left to centre */}
      <motion.div
        className="relative flex items-end"
        initial={{ x: '-58vw' }}
        animate={{ x: '0vw' }}
        transition={{ duration: DURATION - 0.6, ease: [0.16, 0.84, 0.32, 1], delay: 0.3 }}
      >
        {/* Character — real-time 3D, with the SVG cartoon as a safe fallback
            (also shown while the 3D chunk loads, and if WebGL is unavailable) */}
        <div className="relative z-10 -mr-6 -mb-4">
          <Suspense fallback={<div className="drop-shadow-2xl"><CartoonCharacter cfg={cfg} /></div>}>
            <Character3D
              role={role}
              accent={cfg.accent}
              accentDeep={cfg.accentDeep}
              hair={cfg.hair}
              fallback={<div className="drop-shadow-2xl"><CartoonCharacter cfg={cfg} /></div>}
            />
          </Suspense>
        </div>

        {/* The login container being pushed into place */}
        <div
          className="relative z-0 mb-6 w-[340px] rounded-3xl border p-8 shadow-2xl"
          style={{
            background: darkMode ? 'rgba(28,25,23,0.95)' : 'rgba(255,255,255,0.97)',
            borderColor: darkMode ? '#292524' : '#e7e5e4',
            boxShadow: `0 30px 80px -20px ${cfg.accent}66`,
          }}
        >
          <div
            className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-black text-white shadow-lg"
            style={{ background: `linear-gradient(135deg, ${cfg.accent}, ${cfg.accentDeep})` }}
          >
            {role[0]}
          </div>
          <h2 className="font-serif text-2xl font-bold" style={{ color: darkMode ? '#f5f5f4' : '#1c1917' }}>
            {cfg.label}
          </h2>
          <p className="mt-1 text-sm" style={{ color: darkMode ? '#a8a29e' : '#57534e' }}>
            {cfg.sub}
          </p>

          <div className="mt-7 h-1.5 w-full overflow-hidden rounded-full" style={{ background: darkMode ? '#292524' : '#f1f5f9' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${cfg.accent}, ${cfg.accentDeep})` }}
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: DURATION - 0.4, ease: 'easeInOut' }}
            />
          </div>
          <p className="mt-3 text-xs font-medium" style={{ color: cfg.accent }}>
            Almost ready…
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
