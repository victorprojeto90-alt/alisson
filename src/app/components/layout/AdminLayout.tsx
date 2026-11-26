import { Suspense } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';
import logoFull from '../../../assets/ambisafe-logo-full2.png';
import { LayoutDashboard, Users, CreditCard, LogOut, Shield, ChevronRight } from 'lucide-react';
import { PageSkeleton } from '../ui/skeletons';
import { Button } from '../ui/button';
import { cn } from '../ui/utils';

const navItems = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Painel', labelLongo: 'Painel geral' },
  { to: '/admin/clientes', icon: Users, label: 'Clientes', labelLongo: 'Clientes' },
  { to: '/admin/financeiro', icon: CreditCard, label: 'Financeiro', labelLongo: 'Financeiro' },
];

export default function AdminLayout() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const sair = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Computador: barra lateral, igual à do app */}
      <aside className="hidden md:flex md:flex-col w-64 flex-shrink-0">
        <div className="fixed top-0 left-0 w-64 h-screen overflow-y-auto flex flex-col bg-sidebar text-sidebar-foreground">
          <div className="p-6 border-b border-sidebar-border">
            <img src={logoFull} alt="AMBISAFE" className="h-9 w-auto object-contain mb-3" />
            <div className="bg-sidebar-accent/50 rounded-lg px-3 py-2">
              <p className="text-xs text-sidebar-foreground/70 mb-0.5">Área restrita</p>
              <p className="text-sm font-medium flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-[#acd115]" /> Painel administrativo</p>
            </div>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map(({ to, icon: Icon, labelLongo }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                )}
              >
                {({ isActive }) => (
                  <>
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="flex-1">{labelLongo}</span>
                    {isActive && <ChevronRight className="w-4 h-4 opacity-60" />}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-3 mb-3 px-1">
              <div className="w-9 h-9 bg-sidebar-primary rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">A</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Administrador</p>
                <p className="text-xs text-sidebar-foreground/60 truncate">{user?.email}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={sair} className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent">
              <LogOut className="w-4 h-4 mr-2" /> Sair
            </Button>
          </div>
        </div>
      </aside>

      {/* Celular: cabeçalho */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-30 bg-[#00420d] text-white shadow-md pt-[env(safe-area-inset-top)]">
        <div className="h-14 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <img src={logoFull} alt="AMBISAFE" className="h-7 w-auto object-contain" />
            <span className="text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-full bg-[#acd115] text-[#00420d]">ADMIN</span>
          </div>
          <button type="button" onClick={sair} className="h-9 pl-2.5 pr-3 -mr-1 rounded-full flex items-center gap-1.5 bg-white/10 active:bg-white/20 text-sm font-medium">
            <LogOut className="w-4 h-4 text-[#acd115]" /> Sair
          </button>
        </div>
      </header>

      <main className="flex-1 min-w-0 pt-[calc(3.5rem+env(safe-area-inset-top))] pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pt-0 md:pb-0 overflow-x-clip">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <Suspense fallback={<PageSkeleton />}>
              <Outlet />
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Celular: barra de baixo */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur border-t border-gray-200 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="grid grid-cols-3 h-[4.5rem]">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className="flex flex-col items-center justify-center gap-1 select-none">
              {({ isActive }) => (
                <>
                  <motion.span
                    whileTap={{ scale: 0.85 }}
                    className={cn('w-12 h-8 rounded-full flex items-center justify-center transition-colors', isActive ? 'bg-[#acd115]/30 text-[#00420d]' : 'text-gray-500')}
                  >
                    <Icon className="w-[22px] h-[22px]" strokeWidth={isActive ? 2.5 : 2} />
                  </motion.span>
                  <span className={cn('text-[11px]', isActive ? 'text-[#00420d] font-semibold' : 'text-gray-500')}>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
