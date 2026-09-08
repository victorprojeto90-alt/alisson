import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import logoFull from '../../../assets/ambisafe-logo-full2.png';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  LogOut,
  Menu,
  X,
  Shield,
} from 'lucide-react';

const navItems = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/clientes', icon: Users, label: 'Clientes' },
  { to: '/admin/financeiro', icon: CreditCard, label: 'Financeiro' },
];

export default function AdminLayout() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [menuAberto, setMenuAberto] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const sidebarConteudo = (
    <>
      {/* Logo */}
      <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <img src={logoFull} alt="AMBISAFE" style={{ height: '32px', width: 'auto', objectFit: 'contain' }} />
        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Shield size={12} color="#acd115" />
          <span style={{ color: '#acd115', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px' }}>
            PAINEL ADMINISTRATIVO
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 12px' }}>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMenuAberto(false)}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              borderRadius: '8px',
              marginBottom: '4px',
              textDecoration: 'none',
              color: isActive ? '#00420d' : 'rgba(255,255,255,0.8)',
              background: isActive ? '#acd115' : 'transparent',
              fontWeight: isActive ? 700 : 400,
              fontSize: '14px',
              transition: 'all 0.15s',
            })}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer com info do admin e logout */}
      <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginBottom: '12px' }}>
          <div style={{ color: 'white', fontWeight: 600, fontSize: '13px' }}>Admin</div>
          <div>{user?.email}</div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            width: '100%',
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'transparent',
            color: 'rgba(255,255,255,0.8)',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8f9fa' }}>
      {/* Sidebar desktop */}
      <aside
        className="hidden md:flex"
        style={{
          width: '240px',
          background: '#00420d',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          zIndex: 100,
        }}
      >
        {sidebarConteudo}
      </aside>

      {/* Header mobile */}
      <div
        className="md:hidden"
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 90,
          background: '#00420d', height: '56px', display: 'flex',
          alignItems: 'center', padding: '0 16px', gap: '12px',
        }}
      >
        <button
          onClick={() => setMenuAberto(true)}
          style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}
        >
          <Menu size={22} />
        </button>
        <span style={{ color: 'white', fontWeight: 700, fontSize: '14px' }}>AMBISAFE Admin</span>
      </div>

      {/* Sidebar mobile (drawer) */}
      {menuAberto && (
        <>
          <div
            className="md:hidden"
            onClick={() => setMenuAberto(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 95 }}
          />
          <aside
            className="md:hidden"
            style={{
              width: '240px', background: '#00420d', display: 'flex', flexDirection: 'column',
              position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 100,
            }}
          >
            <button
              onClick={() => setMenuAberto(false)}
              style={{
                alignSelf: 'flex-end', margin: '12px', background: 'transparent',
                border: 'none', color: 'white', cursor: 'pointer',
              }}
            >
              <X size={20} />
            </button>
            {sidebarConteudo}
          </aside>
        </>
      )}

      {/* Conteúdo principal */}
      <main className="md:ml-[240px] pt-14 md:pt-0" style={{ flex: 1, minHeight: '100vh', minWidth: 0 }}>
        <Outlet />
      </main>
    </div>
  );
}
