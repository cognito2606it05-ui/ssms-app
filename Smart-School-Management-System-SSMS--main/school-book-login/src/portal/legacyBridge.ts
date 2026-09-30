// Bridge between the new RBAC world (JWT, Postgres) and the legacy App.tsx
// world (localStorage mock, legacy User/Student types). The classic modules
// keep reading/writing the SAME localStorage mock they always used, so their
// behaviour is untouched — we only synthesize the props they expect.
import { useEffect, useState } from 'react';
import type { Session } from '../rbac/auth';
import type { Student, User, UserRole } from '../types';
import { db, collection, onSnapshot } from '../localDatabase';

// RBAC role key -> legacy UserRole string (classic components branch on these).
const ROLE_MAP: Record<string, UserRole> = {
  super_admin: 'Super Admin',
  management: 'Management',
  admin_staff: 'Management',
  reception: 'Reception',
  teacher: 'Teacher',
  lab_technician: 'Teacher',
  student: 'Student',
  parent: 'Parent',
  librarian: 'Librarian',
  canteen_staff: 'Canteen Manager',
  store_staff: 'Store',
  security_staff: 'Security',
  electrician: 'Electrician',
};

export function legacyRoleOf(session: Session | null): UserRole {
  return (session && ROLE_MAP[session.activeRole]) || 'Attender';
}

// Synthesize the legacy User object classic modules expect from the JWT session.
export function legacyUserOf(session: Session | null): User | null {
  if (!session) return null;
  return {
    user_id: String(session.user.id),
    email: session.user.email,
    role: legacyRoleOf(session),
    role_type: 'academic',
    name: session.user.name || session.user.email,
    phone: '',
    linked_id: '',
    photo: '',
  } as User;
}

// Live students from the SAME localStorage mock the legacy app uses.
export function useLegacyStudents(): Student[] {
  const [students, setStudents] = useState<Student[]>([]);
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'students'), (snapshot: any) => {
      setStudents(snapshot.docs.map((d: any) => d.data()));
    });
    return () => { try { (unsub as any)?.(); } catch { /* mock */ } };
  }, []);
  return students;
}
