import { NavLink, useNavigate } from 'react-router';
import {
  LayoutDashboard,
  Trees,
  FileText,
  Settings,
  LogOut,
  Plus,
  Crown,
  ChevronRight,
  Leaf,
} from 'lucide-react';
import logoFull from '../../../assets/ambisafe-logo-full.png';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { cn } from '../ui/utils';

const navItems = [
  { to: '/app/dashboard', label: 'Painel de Controle', icon: LayoutDashboard },
  { to: '/app/projetos', label: 'Projetos', icon: Trees },
  { to: '/app/relatorios', label: 'Relatórios', icon: FileText },
  { to: '/app/especies', label: 'Banco de Espécies', icon: Leaf },
  { to: '/app/configuracoes', label: 'Configurações', icon: Settings },
];

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const { user, profile, empresa, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleNewProject = () => {
    navigate('/app/projetos/novo');
    onClose?.();
  };

  const isFounder = user?.email === 'admin@ambisafe.com.br';

  return (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3 mb-3">
          <img src={logoFull} alt="AMBISAFE" style={{ height: '36px', width: 'auto', objectFit: 'contain' }} />
        </div>
        {empresa && (
          <div className="bg-sidebar-accent/50 rounded-lg px-3 py-2">
            <p className="text-xs text-sidebar-foreground/70 mb-0.5">Empresa</p>
            <p className="text-sm font-medium truncate">{empresa.name}</p>
            <span className={cn(
              'inline-flex items-center text-xs mt-1 px-2 py-0.5 rounded-full font-medium',
              empresa.plan === 'trial'
                ? 'bg-yellow-500/20 text-yellow-300'
                : 'bg-sidebar-primary/50 text-sidebar-primary-foreground'
            )}>
              {empresa.plan === 'trial' ? 'Trial' : 'Profissional'}
            </span>
          </div>
        )}
      </div>

      {/* New Project Button */}
      <div className="p-4">
        <Button
          onClick={handleNewProject}
          className="w-full bg-sidebar-primary hover:bg-sidebar-primary/90 text-white gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo Inventário
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 pb-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group',
              isActive
                ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground'
            )}
          >
            {({ isActive }) => (
              <>
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight className="w-4 h-4 opacity-60" />}
              </>
            )}
          </NavLink>
        ))}

        {isFounder && (
          <NavLink
            to="/app/admin"
            onClick={onClose}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mt-2',
              isActive
                ? 'bg-yellow-500/30 text-yellow-300'
                : 'text-yellow-400/80 hover:bg-yellow-500/10 hover:text-yellow-300'
            )}
          >
            <Crown className="w-5 h-5" />
            <span>Admin Supremo</span>
          </NavLink>
        )}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-3 px-1">
          <div className="w-9 h-9 bg-sidebar-primary rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {(profile?.name || user?.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{profile?.name || user?.email}</p>
            <p className="text-xs text-sidebar-foreground/60 capitalize">{profile?.role || 'Usuário'}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>
      </div>
    </div>
  );
}
