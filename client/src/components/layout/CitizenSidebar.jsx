import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import {
  Scale, LayoutDashboard, FolderOpen, PlusCircle,
  BookOpen, Bell, User, LogOut, ChevronRight, X
} from 'lucide-react';

export default function CitizenSidebar({ mobile = false, onClose }) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const NAV = [
    { to: '/citizen',           icon: LayoutDashboard, label: t('nav.dashboard'), exact: true },
    { to: '/citizen/cases/new', icon: PlusCircle,      label: t('nav.newCase') },
    { to: '/library',           icon: BookOpen,        label: t('nav.library') },
  ];

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className={`flex flex-col h-full ${mobile ? '' : 'w-64 border-r border-white/8'} bg-surface-800/60 backdrop-blur-md`}>
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-white/8">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center">
            <Scale className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-lg text-white">Lex<span className="text-gradient">Aid</span></span>
        </Link>
        {mobile && (
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
        )}
      </div>

      {/* User badge */}
      <div className="mx-4 my-4 p-3 rounded-xl bg-surface-700/50 border border-white/8 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
          {user?.full_name?.[0]?.toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">{user?.full_name}</p>
          <p className="text-xs text-brand-400 font-medium">Citizen</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 flex flex-col gap-1">
        {NAV.map(({ to, icon: Icon, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            onClick={onClose}
            className={({ isActive }) => isActive ? 'nav-item-active' : 'nav-item'}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-white/8 flex flex-col gap-1">
        <button onClick={handleLogout} className="nav-item text-red-400 hover:text-red-300 hover:bg-red-500/8 w-full">
          <LogOut className="w-4 h-4" />
          <span>{t('nav.logout')}</span>
        </button>
      </div>
    </div>
  );
}
