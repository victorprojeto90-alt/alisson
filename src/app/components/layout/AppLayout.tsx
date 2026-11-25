import { Suspense, useEffect, useState } from 'react';
import { PageSkeleton } from '../ui/skeletons';
import { NavLink, Outlet, useLocation } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { LayoutDashboard, Trees, Plus, Leaf, Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import HelpWidget from '../help/HelpWidget';
import InstallPrompt from '../pwa/InstallPrompt';
import logoFull from '../../../assets/ambisafe-logo-full2.png';
import { cn } from '../ui/utils';

const tabs = [
  { to: '/app/dashboard', label: 'Início', icon: LayoutDashboard },
  { to: '/app/projetos', label: 'Projetos', icon: Trees, end: true },
  { to: '/app/projetos/novo', label: 'Novo', icon: Plus, destaque: true },
  { to: '/app/especies', label: 'Espécies', icon: Leaf },
];

function PageLoader() {
  return (
    <PageSkeleton />
  );
}

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Fecha o menu "Mais" ao trocar de página
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 flex-shrink-0">
        <div className="fixed top-0 left-0 w-64 h-screen overflow-y-auto">
          <Sidebar />
        </div>
      </aside>

      {/* Mobile: menu "Mais" (gaveta lateral) */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="md:hidden fixed top-0 left-0 w-72 max-w-[85vw] h-[100dvh] z-50 shadow-2xl"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            >
              <div className="h-full pt-[env(safe-area-inset-top)] bg-sidebar">
                <Sidebar onClose={() => setMobileOpen(false)} />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Mobile: cabeçalho do app */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-30 bg-[#00420d] text-white shadow-md pt-[env(safe-area-inset-top)]">
        <div className="h-14 flex items-center justify-between px-4">
          <img src={logoFull} alt="AMBISAFE" className="h-7 w-auto object-contain" />
          <button
            type="button"
            aria-label="Abrir menu"
            onClick={() => setMobileOpen(true)}
            className="w-10 h-10 -mr-2 rounded-full flex items-center justify-center active:bg-white/15 transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="flex-1 min-w-0 pt-[calc(3.5rem+env(safe-area-inset-top))] pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pt-0 md:pb-0 overflow-x-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            className="min-h-full"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile: barra de navegação inferior (estilo app) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur border-t border-gray-200 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="grid grid-cols-5 h-[4.5rem]">
          {tabs.map(({ to, label, icon: Icon, destaque, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className="flex flex-col items-center justify-center gap-1 select-none"
            >
              {({ isActive }) =>
                destaque ? (
                  <>
                    <motion.span
                      whileTap={{ scale: 0.9 }}
                      className="w-12 h-12 -mt-5 rounded-2xl bg-[#00420d] text-[#acd115] flex items-center justify-center shadow-lg ring-4 ring-white"
                    >
                      <Icon className="w-6 h-6" strokeWidth={2.6} />
                    </motion.span>
                    <span className={cn('text-[11px] font-semibold', isActive ? 'text-[#00420d]' : 'text-gray-500')}>{label}</span>
                  </>
                ) : (
                  <>
                    <motion.span
                      whileTap={{ scale: 0.85 }}
                      className={cn(
                        'w-12 h-8 rounded-full flex items-center justify-center transition-colors',
                        isActive ? 'bg-[#acd115]/30 text-[#00420d]' : 'text-gray-500'
                      )}
                    >
                      <Icon className="w-[22px] h-[22px]" strokeWidth={isActive ? 2.5 : 2} />
                    </motion.span>
                    <span className={cn('text-[11px]', isActive ? 'text-[#00420d] font-semibold' : 'text-gray-500')}>{label}</span>
                  </>
                )
              }
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex flex-col items-center justify-center gap-1 text-gray-500 select-none"
          >
            <motion.span whileTap={{ scale: 0.85 }} className="w-12 h-8 rounded-full flex items-center justify-center">
              <Menu className="w-[22px] h-[22px]" />
            </motion.span>
            <span className="text-[11px]">Mais</span>
          </button>
        </div>
      </nav>

      <InstallPrompt />

      {/* Help Widget — visible on all app pages */}
      <HelpWidget />
    </div>
  );
}
