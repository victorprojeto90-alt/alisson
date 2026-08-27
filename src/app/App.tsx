import { Routes, Route, Navigate } from 'react-router';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from './components/ui/sonner';
import BlockedScreen from './components/BlockedScreen';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import ProjectNew from './pages/ProjectNew';
import ProjectDetail from './pages/ProjectDetail';
import Configuracoes from './pages/Configuracoes';
import Relatorios from './pages/Relatorios';
import Projetos from './pages/Projetos';
import Especies from './pages/Especies';
import FAQ from './pages/FAQ';
import AdminPage from './pages/AdminPage';
import TermosDeUso from './pages/TermosDeUso';
import Privacidade from './pages/Privacidade';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isBlocked, blockReason } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (isBlocked) return <BlockedScreen reason={blockReason} />;
  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isPasswordRecovery } = useAuth();
  if (loading) return null;
  // Durante o fluxo de recuperação de senha o Supabase cria uma sessão temporária
  // (evento PASSWORD_RECOVERY) só para permitir a troca — não deve ser tratada como um
  // login normal, senão o usuário é redirecionado para o dashboard antes de conseguir
  // ver o formulário de nova senha em /auth.
  if (user && !isPasswordRecovery) return <Navigate to="/app/dashboard" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/termos-de-uso" element={<TermosDeUso />} />
      <Route path="/privacidade" element={<Privacidade />} />
      <Route path="/auth" element={
        <PublicOnlyRoute>
          <AuthPage />
        </PublicOnlyRoute>
      } />
      <Route path="/app" element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="projetos" element={<Projetos />} />
        <Route path="projetos/novo" element={<ProjectNew />} />
        <Route path="projetos/:id" element={<ProjectDetail />} />
        <Route path="relatorios" element={<Relatorios />} />
        <Route path="especies" element={<Especies />} />
        <Route path="faq" element={<FAQ />} />
        <Route path="configuracoes" element={<Configuracoes />} />
        <Route path="admin" element={<AdminPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <Toaster richColors position="top-right" />
    </AuthProvider>
  );
}
