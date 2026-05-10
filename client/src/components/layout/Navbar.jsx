import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import {
  Scale, Menu, X, ChevronDown, LogOut, User, LayoutDashboard
} from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';

export default function Navbar() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropOpen, setDropOpen]     = useState(false);
  const [scrolled, setScrolled]     = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMobileOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const dashboardPath =
    user?.role === 'admin'  ? '/admin'  :
    user?.role === 'lawyer' ? '/lawyer' : '/citizen';

  const handleLogout = () => { logout(); navigate('/'); setMobileOpen(false); setDropOpen(false); };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-black/95 backdrop-blur-md shadow-lg shadow-black/50 border-b border-amber-500/10'
          : 'bg-black/80 backdrop-blur-sm border-b border-white/5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0" id="nav-logo">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg transition-all duration-200 group-hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #FCA311 0%, #e5920f 100%)', boxShadow: '0 4px 14px rgba(252,163,17,0.35)' }}>
              <Scale className="w-5 h-5 text-black" />
            </div>
            <span className="font-display font-bold text-xl text-white tracking-tight">
              Lex<span className="text-gradient">Aid</span>
            </span>
          </Link>

          {/* Desktop nav links */}
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
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all text-sm border"
                  style={{ background: 'rgba(20,33,61,0.60)', borderColor: 'rgba(252,163,17,0.20)' }}
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-black flex-shrink-0"
                    style={{ background: '#FCA311' }}>
                    {user.full_name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-gray-200 font-medium max-w-[120px] truncate">{user.full_name}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${dropOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropOpen && (
                  <div className="absolute right-0 mt-2 w-52 shadow-xl shadow-black/50 animate-slide-down rounded-2xl overflow-hidden"
                    style={{ background: '#14213D', border: '1px solid rgba(252,163,17,0.20)' }}>
                    <div className="p-1.5">
                      <Link to={dashboardPath} onClick={() => setDropOpen(false)} id="nav-dashboard"
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white transition-all"
                        style={{ ':hover': { background: 'rgba(252,163,17,0.10)' } }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(252,163,17,0.10)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <LayoutDashboard className="w-4 h-4 text-amber-400" /> {t('nav.dashboard')}
                      </Link>
                      <Link to={`${dashboardPath}/profile`} onClick={() => setDropOpen(false)} id="nav-profile"
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white transition-all"
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(252,163,17,0.10)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <User className="w-4 h-4 text-amber-400" /> {t('nav.profile')}
                      </Link>
                      <div className="my-1" style={{ borderTop: '1px solid rgba(252,163,17,0.12)' }} />
                      <button onClick={handleLogout} id="nav-logout"
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-400 hover:text-red-300 transition-all"
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.10)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
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
            className="md:hidden p-2 rounded-lg text-gray-300 hover:text-white transition-all"
            style={{ background: mobileOpen ? 'rgba(252,163,17,0.15)' : 'transparent' }}
            onClick={() => setMobileOpen(p => !p)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="md:hidden animate-slide-down border-t"
          style={{ background: '#14213D', borderColor: 'rgba(252,163,17,0.15)' }}
        >
          <div className="px-4 py-4 flex flex-col gap-1 safe-bottom">
            <Link to="/library" className="nav-item" onClick={() => setMobileOpen(false)}>
              {t('nav.library')}
            </Link>
            {!user && (
              <Link to="/login" className="nav-item" onClick={() => setMobileOpen(false)}>
                {t('nav.login')}
              </Link>
            )}
            {!user && (
              <Link
                to="/register"
                className="btn-primary w-full justify-center mt-2"
                onClick={() => setMobileOpen(false)}
              >
                {t('nav.register')}
              </Link>
            )}
            {user && (
              <>
                <Link to={dashboardPath} className="nav-item" onClick={() => setMobileOpen(false)}>
                  <LayoutDashboard className="w-4 h-4" /> {t('nav.dashboard')}
                </Link>
                <button
                  onClick={handleLogout}
                  className="nav-item text-red-400 w-full text-left"
                >
                  <LogOut className="w-4 h-4" /> {t('nav.logout')}
                </button>
              </>
            )}
            <div className="pt-3 border-t" style={{ borderColor: 'rgba(252,163,17,0.12)' }}>
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
