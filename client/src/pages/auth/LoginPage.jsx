import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { Scale, Eye, EyeOff, ArrowRight, Lock, Mail } from 'lucide-react';
import LanguageSwitcher from '../../components/layout/LanguageSwitcher';

export default function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const user = await login(data.email, data.password);
      toast.success('Welcome back!');
      const dest = user.role === 'admin' ? '/admin' : user.role === 'lawyer' ? '/lawyer' : '/citizen';
      navigate(dest, { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-surface-900 via-surface-800 to-surface-900 items-center justify-center">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-brand-600/20 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-1/3 right-1/4 w-56 h-56 bg-purple-600/15 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
        </div>
        <div className="relative z-10 text-center px-12">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-brand-900/50 animate-float">
            <Scale className="w-10 h-10 text-white" />
          </div>
          <h1 className="font-display text-4xl font-bold text-white mb-3">
            Lex<span className="text-gradient">Aid</span>
          </h1>
          <p className="text-gray-400 text-base leading-relaxed max-w-sm">
            Multilingual legal guidance for Sri Lankan citizens — in Sinhala, Tamil, and English.
          </p>
          <div className="mt-10 flex flex-col gap-3 text-left">
            {['NIC-Verified Identity', 'SLBA-Verified Lawyers', 'Encrypted & Secure', 'Free of Charge'].map(f => (
              <div key={f} className="flex items-center gap-3 text-sm text-gray-300">
                <div className="w-5 h-5 rounded-full bg-accent-500/20 border border-accent-500/40 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-accent-500" />
                </div>
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center">
              <Scale className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-white">Lex<span className="text-gradient">Aid</span></span>
          </div>

          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="font-display text-3xl font-bold text-white">{t('auth.login_title')}</h2>
              <p className="text-gray-400 mt-1 text-sm">{t('auth.login_subtitle')}</p>
            </div>
            <LanguageSwitcher />
          </div>

          <form id="login-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            {/* Email */}
            <div className="form-group">
              <label className="label" htmlFor="login-email"><Mail className="w-3 h-3 inline mr-1" />{t('auth.email')}</label>
              <input
                id="login-email"
                type="email"
                className={`input ${errors.email ? 'input-error' : ''}`}
                placeholder="you@example.com"
                {...register('email', { required: t('common.required') })}
              />
              {errors.email && <p className="field-error">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="label" htmlFor="login-password"><Lock className="w-3 h-3 inline mr-1" />{t('auth.password')}</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  className={`input pr-11 ${errors.password ? 'input-error' : ''}`}
                  placeholder="••••••••"
                  {...register('password', { required: t('common.required') })}
                />
                <button
                  type="button"
                  id="toggle-password"
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="field-error">{errors.password.message}</p>}
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 text-base mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : (
                <>{t('auth.login_btn')} <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            {t('auth.no_account')}{' '}
            <Link to="/register" id="login-register-link" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              {t('nav.register')}
            </Link>
          </p>

          {/* Demo accounts notice */}
          <div className="mt-8 p-4 rounded-xl bg-surface-700/50 border border-white/8">
            <p className="text-xs text-gray-500 font-semibold mb-2 uppercase tracking-wide">Demo Accounts</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                { role: 'Citizen', email: 'citizen@demo.com' },
                { role: 'Lawyer',  email: 'lawyer@demo.com' },
                { role: 'Admin',   email: 'admin@demo.com' },
              ].map(d => (
                <div key={d.role} className="flex flex-col gap-0.5">
                  <span className="text-gray-400 font-medium">{d.role}</span>
                  <span className="text-gray-600 truncate">{d.email}</span>
                  <span className="text-gray-600">pw: demo1234</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
