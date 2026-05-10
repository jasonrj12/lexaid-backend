import { useState } from 'react';
import { Link, useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Scale, LayoutDashboard, Users, FolderOpen, BookOpen,
  BarChart3, Settings, LogOut, X, BadgeCheck, AlertOctagon
} from 'lucide-react';

export default function AdminSidebar({ mobile = false, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const NAV = [
    { to: '/admin',                icon: LayoutDashboard, label: 'Overview',        exact: true },
    { to: '/admin/lawyers',        icon: BadgeCheck,      label: 'Lawyer Verif.' },
    { to: '/admin/cases',          icon: FolderOpen,      label: 'All Cases' },
    { to: '/admin/users',          icon: Users,           label: 'Users' },
    { to: '/admin/library',        icon: BookOpen,        label: 'Library Queue' },
    { to: '/admin/reports',        icon: BarChart3,       label: 'Reports' },
    { to: '/admin/settings',       icon: Settings,        label: 'Settings' },
  ];
  const handleLogout = () => { logout(); navigate('/'); };
  return (
    <div className={`flex flex-col h-full ${mobile ? '' : 'w-64 border-r border-white/8'} bg-surface-800/60 backdrop-blur-md`}>
      <div className="flex items-center justify-between px-5 py-5 border-b border-white/8">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center"><Scale className="w-4 h-4 text-white" /></div>
          <span className="font-display font-bold text-lg text-white">Lex<span className="text-gradient">Aid</span></span>
        </Link>
        {mobile && <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>}
      </div>
      <div className="mx-4 my-4 p-3 rounded-xl bg-gradient-to-br from-brand-600/20 to-purple-600/10 border border-brand-500/20 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
          {user?.full_name?.[0]?.toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">{user?.full_name}</p>
          <p className="text-xs text-brand-400 font-medium">🛡 Administrator</p>
        </div>
      </div>
      <nav className="flex-1 px-3 py-2 flex flex-col gap-1">
        {NAV.map(({ to, icon: Icon, label, exact }) => (
          <NavLink key={to} to={to} end={exact} onClick={onClose}
            className={({ isActive }) => isActive ? 'nav-item-active' : 'nav-item'}>
            <Icon className="w-4 h-4 flex-shrink-0" /><span className="flex-1">{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-white/8">
        <button onClick={handleLogout} className="nav-item text-red-400 hover:text-red-300 hover:bg-red-500/8 w-full">
          <LogOut className="w-4 h-4" /><span>Log Out</span>
        </button>
      </div>
    </div>
  );
}
