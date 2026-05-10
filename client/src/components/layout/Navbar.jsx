import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import {
  Scale, Globe, Menu, X, Bell, ChevronDown, LogOut, User, LayoutDashboard
} from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';

export default function Navbar() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);

  const dashboardPath =
    user?.role === 'admin'  ? '/admin'  :
    user?.role === 'lawyer' ? '/lawyer' : '/citizen';

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-surface-900/80 backdrop-blur-md border-b border-white/8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group" id="nav-logo">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-lg shadow-brand-900/40 group-hover:shadow-brand-600/40 transition-shadow">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-white tracking-tight">
              Lex<span className="text-gradient">Aid</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link to="/library" className="btn-ghost" id="nav-library">{t('nav.library')}</Link>
            {!user && <Link to="/login"    className="btn-ghost"    id="nav-login">{t('nav.login')}</Link>}
            {!user && <Link to="/register" className="btn-primary"  id="nav-register">{t('nav.register')}</Link>}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />

            {user && (
              <div className="relative">
                <button
                  id="nav-user-menu"
                  onClick={() => setDropOpen(p => !p)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/8 hover:bg-white/12 border border-white/10 transition-all text-sm"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                    {user.full_name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-gray-200 font-medium max-w-[120px] truncate">{user.full_name}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${dropOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropOpen && (
                  <div className="absolute right-0 mt-2 w-52 glass shadow-xl shadow-black/40 animate-slide-down">
                    <div className="p-1">
                      <Link to={dashboardPath} onClick={() => setDropOpen(false)} id="nav-dashboard"
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/8 transition-all">
                        <LayoutDashboard className="w-4 h-4" /> {t('nav.dashboard')}
                      </Link>
                      <Link to={`${dashboardPath}/profile`} onClick={() => setDropOpen(false)} id="nav-profile"
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/8 transition-all">
                        <User className="w-4 h-4" /> {t('nav.profile')}
                      </Link>
                      <div className="border-t border-white/8 my-1" />
                      <button onClick={handleLogout} id="nav-logout"
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all">
                        <LogOut className="w-4 h-4" /> {t('nav.logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            id="nav-mobile-toggle"
            className="md:hidden btn-ghost p-2"
            onClick={() => setMobileOpen(p => !p)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-surface-800/95 backdrop-blur-lg border-t border-white/8 animate-slide-down">
          <div className="px-4 py-4 flex flex-col gap-2">
            <Link to="/library" className="nav-item" onClick={() => setMobileOpen(false)}>{t('nav.library')}</Link>
            {!user && <Link to="/login"    className="nav-item" onClick={() => setMobileOpen(false)}>{t('nav.login')}</Link>}
            {!user && <Link to="/register" className="btn-primary w-full justify-center" onClick={() => setMobileOpen(false)}>{t('nav.register')}</Link>}
            {user && (
              <>
                <Link to={dashboardPath} className="nav-item" onClick={() => setMobileOpen(false)}>{t('nav.dashboard')}</Link>
                <button onClick={() => { handleLogout(); setMobileOpen(false); }} className="nav-item text-red-400">{t('nav.logout')}</button>
              </>
            )}
            <div className="pt-2"><LanguageSwitcher /></div>
          </div>
        </div>
      )}
    </nav>
  );
}
