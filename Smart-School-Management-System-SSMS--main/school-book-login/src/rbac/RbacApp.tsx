import { RbacAuthProvider } from './auth';
import RbacConsole from './RbacConsole';

export default function RbacApp() {
  return (
    <RbacAuthProvider>
      <RbacConsole />
    </RbacAuthProvider>
  );
}
