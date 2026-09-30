import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { ShieldCheck, ShieldAlert } from 'lucide-react';
import { RbacAuthProvider, useAuth } from '../rbac/auth';
import { UnifiedLoginRedirect } from '../rbac/UnifiedLogin';
import AdminPanel from './AdminPanel';

function Gate() {
  const { session, switchRole, logout } = useAuth();

  // Logged in as Super Admin -> the panel.
  if (session?.activeRole === 'super_admin') return <AdminPanel />;

  // Logged in but not as Super Admin.
  if (session) {
    const hasSuper = session.roles.includes('super_admin');
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-950 text-stone-100 p-4">
        <div className="max-w-md w-full rounded-3xl border border-stone-800 bg-stone-900 p-8 text-center">
          <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h1 className="text-xl font-bold">Super Admin required</h1>
          <p className="text-sm text-stone-400 mt-2">You are signed in as <b>{session.activeRoleMeta?.name}</b>. The Master Control Panel is restricted to Super Admin.</p>
          <div className="mt-5 flex flex-col gap-2">
            {hasSuper && <button onClick={() => switchRole('super_admin')} className="px-4 py-2 rounded-xl font-bold text-white bg-blue-600">Switch to Super Admin</button>}
            <button onClick={logout} className="px-4 py-2 rounded-xl font-bold border border-stone-700">Sign in as another user</button>
          </div>
        </div>
      </div>
    );
  }

  // Not logged in -> unified Book Login.
  return <UnifiedLoginRedirect portal="Master Control Panel" />;
}

export default function AdminApp() {
  return (
    <RbacAuthProvider>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <Gate />
    </RbacAuthProvider>
  );
}
