import { lazy, Suspense } from 'react';
import { PageSkeleton } from './components/ui/skeletons';
import { Routes, Route, Navigate } from 'react-router';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from './components/ui/sonner';
import BlockedScreen from './components/BlockedScreen';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import AppLayout from './components/layout/AppLayout';
import AdminLayout from './components/layout/AdminLayout';

// Páginas internas carregadas sob demanda (app abre mais rápido no celular)
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ProjectNew = lazy(() => import('./pages/ProjectNew'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const Configuracoes = lazy(() => import('./pages/Configuracoes'));
const Relatorios = lazy(() => import('./pages/Relatorios'));
const Projetos = lazy(() => import('./pages/Projetos'));
const Especies = lazy(() => import('./pages/Especies'));
const FAQ = lazy(() => import('./pages/FAQ'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminClientes = lazy(() => import('./pages/admin/AdminClientes'));
const AdminFinanceiro = lazy(() => import('./pages/admin/AdminFinanceiro'));
const TermosDeUso = lazy(() => import('./pages/TermosDeUso'));
const Privacidade = lazy(() => import('./pages/Privacidade'));

function PageLoader() {
  return (
    <PageSkeleton />
  );
}

// admin@ambisafe.com.br é o único superadmin — mesmo critério já usado em
// Sidebar.tsx ("Admin Supremo") e no backend (supabase/functions/server/index.tsx,
// requireAdmin). NÃO usar profile.role === 'admin' aqui: esse campo marca o dono
// de cada empresa/tenant (todo cadastro novo recebe role 'admin' automaticamente
// em AuthContext.tsx), não o superadmin da plataforma — usar role pra isso deixaria
// qualquer cliente pago acessar o painel interno com dados de todo mundo.
const ADMIN_EMAIL = 'admin@ambisafe.com.br';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isBlocked, blockReason } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PageSkeleton />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (isBlocked) return <BlockedScreen reason={blockReason} />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PageSkeleton />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (user.email !== ADMIN_EMAIL) return <Navigate to="/app/dashboard" replace />;
  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isPasswordRecovery, entrando } = useAuth();
  if (loading) return null;
  // Durante a animação de entrada a tela de login continua montada até a animação terminar.
  if (entrando) return <>{children}</>;
  // Durante o fluxo de recuperação de senha o Supabase cria uma sessão temporária
  // (evento PASSWORD_RECOVERY) só para permitir a troca — não deve ser tratada como um
  // login normal, senão o usuário é redirecionado para o dashboard antes de conseguir
  // ver o formulário de nova senha em /auth.
  if (user && !isPasswordRecovery) {
    return <Navigate to={user.email === ADMIN_EMAIL ? '/admin/dashboard' : '/app/dashboard'} replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/termos-de-uso" element={<TermosDeUso />} />
      <Route path="/privacidade" element={<Privacidade />} />
      <Route path="/auth" element={
        <PublicOnlyRoute>
          <AuthPage />
        </PublicOnlyRoute>
      } />
      <Route path="/admin" element={
        <AdminRoute>
          <AdminLayout />
        </AdminRoute>
      }>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="clientes" element={<AdminClientes />} />
        <Route path="financeiro" element={<AdminFinanceiro />} />
      </Route>
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
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
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
