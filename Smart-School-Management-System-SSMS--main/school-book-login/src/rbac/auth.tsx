import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { apiFetch } from './api';

export type Action = 'read' | 'write' | 'edit' | 'delete' | 'approve' | 'export';
export type ModulePerm = Record<Action, boolean>;
export type Permissions = Record<string, ModulePerm>;

export interface RoleMeta {
  key: string;
  name: string;
  level: number;
  access_pct: number;
  tier: 'basic' | 'premium';
  is_custom?: boolean;
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  user: { id: number; email: string; name: string };
  roles: string[];
  activeRole: string;
  activeRoleMeta: RoleMeta | null;
  tier: 'basic' | 'premium';
  permissions: Permissions;
}

interface AuthCtx {
  session: Session | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchRole: (role: string) => Promise<void>;
  can: (module: string, action?: Action) => boolean;
  token: string | null;
}

const STORAGE_KEY = 'ssms_rbac_session';
const Ctx = createContext<AuthCtx | null>(null);

export function RbacAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Session) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const persist = (s: Session | null) => {
    setSession(s);
    if (s) localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    else localStorage.removeItem(STORAGE_KEY);
  };

  // On boot, refresh a stored session so permissions reflect the latest matrix.
  useEffect(() => {
    if (!session?.refreshToken) return;
    apiFetch<Session>('/auth/refresh', { method: 'POST', body: { refreshToken: session.refreshToken } })
      .then(persist)
      .catch(() => persist(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const s = await apiFetch<Session>('/auth/login', { method: 'POST', body: { email, password } });
      persist(s);
    } catch (e: any) {
      setError(e.message || 'Login failed');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => persist(null), []);

  // Refresh-token-on-role-change: a brand new access token is issued for the role.
  const switchRole = useCallback(
    async (role: string) => {
      if (!session) return;
      const s = await apiFetch<Session>('/auth/switch-role', {
        method: 'POST',
        token: session.accessToken,
        body: { role },
      });
      persist(s);
    },
    [session],
  );

  const can = useCallback(
    (module: string, action: Action = 'read') => !!session?.permissions?.[module]?.[action],
    [session],
  );

  const value = useMemo<AuthCtx>(
    () => ({ session, loading, error, login, logout, switchRole, can, token: session?.accessToken ?? null }),
    [session, loading, error, login, logout, switchRole, can],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used within RbacAuthProvider');
  return ctx;
}

export function usePermissions() {
  const { can, session } = useAuth();
  return { can, permissions: session?.permissions ?? {}, activeRole: session?.activeRole ?? null };
}
