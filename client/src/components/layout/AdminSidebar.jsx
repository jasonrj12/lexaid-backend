import { Link, useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Scale, LayoutDashboard, Users, FolderOpen, BookOpen,
  BarChart3, LogOut, X, BadgeCheck, Gavel
} from 'lucide-react';

export default function AdminSidebar({ mobile = false, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const NAV = [
    { to: '/admin',                   icon: LayoutDashboard, label: 'Overview',           exact: true },
    { to: '/admin/lawyers',           icon: BadgeCheck,      label: 'Lawyer Verif.' },
    { to: '/admin/lawyers-directory', icon: Gavel,           label: 'Lawyers Directory' },
    { to: '/admin/cases',             icon: FolderOpen,      label: 'All Cases' },
    { to: '/admin/users',             icon: Users,           label: 'Users' },
    { to: '/admin/library',           icon: BookOpen,        label: 'Library Queue' },
    { to: '/admin/reports',           icon: BarChart3,       label: 'Reports' },
  ];

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div
      className={`flex flex-col h-full ${mobile ? '' : 'w-64'}`}
      style={{ background: '#14213D', borderRight: mobile ? 'none' : '1px solid rgba(252,163,17,0.12)' }}
    >
      {/* Logo */}
      <div
        className="flex items-center justify-between px-5 py-5"
        style={{ borderBottom: '1px solid rgba(252,163,17,0.12)' }}
      >
        <Link to="/" className="flex items-center gap-2 group">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #FCA311, #e5920f)', boxShadow: '0 4px 12px rgba(252,163,17,0.30)' }}
          >
            <Scale className="w-4 h-4 text-black" />
          </div>
          <span className="font-display font-bold text-lg text-white">Lex<span className="text-gradient">Aid</span></span>
        </Link>
        {mobile && (
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* User badge */}
      <div
        className="mx-4 my-4 p-3 rounded-xl flex items-center gap-3"
        style={{ background: 'rgba(252,163,17,0.08)', border: '1px solid rgba(252,163,17,0.25)' }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-black flex-shrink-0"
          style={{ background: '#FCA311' }}
        >
          {user?.full_name?.[0]?.toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">{user?.full_name}</p>
          <p className="text-xs font-medium" style={{ color: '#FCA311' }}>🛡 Administrator</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 flex flex-col gap-1 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label, exact }) => (
          <NavLink key={to} to={to} end={exact} onClick={onClose}
            className={({ isActive }) => isActive ? 'nav-item-active' : 'nav-item'}>
            <Icon className="w-4 h-4 flex-shrink-0" /><span className="flex-1">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div
        className="px-3 py-4"
        style={{ borderTop: '1px solid rgba(252,163,17,0.12)' }}
      >
        <button
          onClick={handleLogout}
          className="nav-item text-red-400 hover:text-red-300 w-full"
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.10)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <LogOut className="w-4 h-4" /><span>Log Out</span>
        </button>
      </div>
    </div>
  );
}
