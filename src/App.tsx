import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthProvider, AuthProvider } from './hooks/useAuth';
import { AussieEnglishPractice } from './components/AussieEnglishPractice';
import { SpeakFreePage } from './components/SpeakFreePage';
import { SlangPage } from './components/slang/SlangPage';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/app" element={
        <div className="app">
          <AussieEnglishPractice />
        </div>
      } />
      <Route path="/speak" element={<SpeakFreePage />} />
      <Route path="/slang" element={<SlangPage />} />
      <Route path="/" element={<Navigate to="/app" replace />} />
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
}

function App() {
  const auth = useAuthProvider();

  return (
    <AuthProvider value={auth}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
