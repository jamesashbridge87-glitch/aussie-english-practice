import { useAuthProvider, AuthProvider } from './hooks/useAuth';
import { AussieEnglishPractice } from './components/AussieEnglishPractice';

function AppContent() {
  return (
    <div className="app">
      <AussieEnglishPractice />
    </div>
  );
}

function App() {
  const auth = useAuthProvider();

  return (
    <AuthProvider value={auth}>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
