import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { ShieldAlert } from 'lucide-react';
import { UnifiedLoginRedirect } from '../rbac/UnifiedLogin';
import { RbacAuthProvider, useAuth } from '../rbac/auth';
import StudentList from './StudentList';
import RegistrationWizard from './RegistrationWizard';
import StudentProfile from './StudentProfile';

export type View = { name: 'list' } | { name: 'wizard' } | { name: 'profile'; id: number };

function Gate() {
  const { session, can } = useAuth();
  const [view, setView] = useState<View>({ name: 'list' });

  if (!session) return <UnifiedLoginRedirect portal="Student Management" />;

  if (!can('students', 'read')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-950 text-stone-100 p-4">
        <div className="max-w-md text-center">
          <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h1 className="text-xl font-bold">No access</h1>
          <p className="text-sm text-stone-400 mt-2">Role <b>{session.activeRoleMeta?.name}</b> has no <span className="font-mono">students:read</span> permission.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-50">
      {view.name === 'list' && <StudentList onOpen={(id) => setView({ name: 'profile', id })} onRegister={() => setView({ name: 'wizard' })} />}
      {view.name === 'wizard' && <RegistrationWizard onDone={(id) => setView(id ? { name: 'profile', id } : { name: 'list' })} onCancel={() => setView({ name: 'list' })} />}
      {view.name === 'profile' && <StudentProfile id={view.id} onBack={() => setView({ name: 'list' })} />}
    </div>
  );
}

export default function StudentsApp() {
  return (
    <RbacAuthProvider>
      <Toaster position="top-right" />
      <Gate />
    </RbacAuthProvider>
  );
}
