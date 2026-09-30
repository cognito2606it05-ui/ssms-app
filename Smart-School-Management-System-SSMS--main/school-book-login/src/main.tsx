import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import RbacApp from './rbac/RbacApp.tsx';
import AdminApp from './admin/AdminApp.tsx';
import StudentsApp from './students/StudentsApp.tsx';
import AttendanceApp from './attendance/AttendanceApp.tsx';
import WalletApp from './wallet/WalletApp.tsx';
import FeesApp from './fees/FeesApp.tsx';
import './index.css';

// Lightweight hash router: the full RBAC console lives at #/rbac, fully
// isolated from the existing app so it can't destabilise it.
function Root() {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const onHash = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  if (hash.startsWith('#/admin')) return <AdminApp />;
  if (hash.startsWith('#/students')) return <StudentsApp />;
  if (hash.startsWith('#/attendance')) return <AttendanceApp />;
  if (hash.startsWith('#/wallet')) return <WalletApp />;
  if (hash.startsWith('#/fees')) return <FeesApp />;
  if (hash.startsWith('#/rbac')) return <RbacApp />;
  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
