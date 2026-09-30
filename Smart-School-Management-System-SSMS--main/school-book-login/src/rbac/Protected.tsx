import { ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { Action, useAuth } from './auth';

/**
 * Protected route/section wrapper. Renders children only when the active role
 * has `action` on `module`; otherwise shows a 403-style role-context notice.
 */
export function Protected({
  module,
  action = 'read',
  children,
  fallback,
}: {
  module: string;
  action?: Action;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { can, session } = useAuth();
  if (can(module, action)) return <>{children}</>;
  if (fallback !== undefined) return <>{fallback}</>;
  return (
    <div className="flex flex-col items-center justify-center text-center gap-3 p-10 rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50/60 dark:bg-red-950/20">
      <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
        <Lock className="w-6 h-6 text-red-500" />
      </div>
      <div>
        <h3 className="font-bold text-red-700 dark:text-red-300">403 — Access Denied</h3>
        <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-1">
          Role <span className="font-mono font-bold">{session?.activeRole}</span> is not permitted to{' '}
          <span className="font-mono font-bold">{action}</span> on{' '}
          <span className="font-mono font-bold">{module}</span>.
        </p>
      </div>
    </div>
  );
}
