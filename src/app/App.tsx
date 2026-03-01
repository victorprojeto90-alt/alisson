import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';

function AppContent() {
  const { user, loading } = useAuth();
  const [view, setView] = useState<'landing' | 'auth'>('landing');

  // Determine user role (simplified - in production, fetch from backend)
  const userRole: 'admin' | 'user' = user?.email?.includes('admin') ? 'admin' : 'user';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-secondary">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg">Carregando AMBISAFE...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, show dashboard
  if (user) {
    return <Dashboard userRole={userRole} />;
  }

  // If not authenticated, show landing or auth page
  if (view === 'auth') {
    return <AuthPage onBack={() => setView('landing')} />;
  }

  return (
    <LandingPage
      onGetStarted={() => setView('auth')}
      onContactSpecialist={() => {
        // In production, open contact form or scheduling tool
        alert('Em produção, isso abriria um formulário de contato ou agendamento de demonstração.');
      }}
    />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
