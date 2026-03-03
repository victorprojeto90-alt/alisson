import { useState } from 'react';
import { Outlet } from 'react-router';
import { Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';
import { Button } from '../ui/button';
import HelpWidget from '../help/HelpWidget';

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 flex-shrink-0">
        <div className="fixed top-0 left-0 w-64 h-screen overflow-y-auto">
          <Sidebar />
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`
          md:hidden fixed top-0 left-0 w-64 h-screen z-50 transform transition-transform duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <Sidebar onClose={() => setMobileOpen(false)} />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-sidebar border-b border-sidebar-border h-14 flex items-center px-4 gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(true)}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-sidebar-primary rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">A</span>
          </div>
          <span className="text-sidebar-foreground font-bold text-sm">AMBISAFE</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 min-w-0 pt-14 md:pt-0 overflow-auto">
        <div className="min-h-full">
          <Outlet />
        </div>
      </main>

      {/* Help Widget — visible on all app pages */}
      <HelpWidget />
    </div>
  );
}
