import { AuthProvider } from '@/lib/auth';
import { AppShell } from '@/components/AppShell';

function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

export default App;
