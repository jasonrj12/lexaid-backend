import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { Scale, Eye, EyeOff, ArrowRight, User, Mail, Phone, Lock, CreditCard, BadgeCheck } from 'lucide-react';
import LanguageSwitcher from '../../components/layout/LanguageSwitcher';

const SPECIALISATIONS = ['Land & Property','Labour & Employment','Consumer Rights','Family Law','Criminal Guidance','Other Civil Matters'];

// Validate Sri Lankan NIC: 9-digit old (ends V/X) or 12-digit new
const validateNIC = (val) => {
  const old12 = /^\d{9}[VXvx]$/.test(val);
  const newFormat = /^\d{12}$/.test(val);
  return old12 || newFormat || 'Invalid NIC format (e.g. 901234567V or 200012345678)';
};

export default function RegisterPage() {
  const { t } = useTranslation();
  const { register: authRegister } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register, handleSubmit, watch, setValue,
    formState: { errors }
  } = useForm({
    defaultValues: { role: params.get('role') === 'lawyer' ? 'lawyer' : 'citizen' }
  });

  const role = watch('role');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const user = await authRegister(data);
      toast.success('Account created! Welcome to LexAid.');
      if (user.role === 'lawyer' && user.status === 'pending') {
        toast('Your account is pending admin verification.', { icon: '⏳', duration: 6000 });
        navigate('/login');
      } else {
        navigate(user.role === 'lawyer' ? '/lawyer' : '/citizen', { replace: true });
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-surface-900 via-surface-800 to-surface-900 items-center justify-center">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-accent-500/15 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-1/3 left-1/4 w-56 h-56 bg-brand-600/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
        </div>
        <div className="relative z-10 text-center px-12">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-brand-900/50 animate-float">
            <Scale className="w-10 h-10 text-white" />
          </div>
          <h1 className="font-display text-4xl font-bold text-white mb-3">Join LexAid</h1>
          <p className="text-gray-400 text-base leading-relaxed max-w-sm">
            Whether you need legal help or want to volunteer your expertise — LexAid connects you.
          </p>

          {/* Role highlight */}
          <div className="mt-10 flex flex-col gap-4">
            <div className={`glass p-4 text-left cursor-pointer transition-all duration-300 ${role === 'citizen' ? 'border-brand-500/50 bg-brand-500/10' : 'hover:border-white/20'}`}
              onClick={() => setValue('role', 'citizen')}>
              <p className="text-sm font-semibold text-white mb-1">👤 Citizen</p>
              <p className="text-xs text-gray-400">Submit queries, track cases, receive legal guidance — free of charge.</p>
            </div>
            <div className={`glass p-4 text-left cursor-pointer transition-all duration-300 ${role === 'lawyer' ? 'border-accent-500/50 bg-accent-500/10' : 'hover:border-white/20'}`}
              onClick={() => setValue('role', 'lawyer')}>
              <p className="text-sm font-semibold text-white mb-1">⚖️ Volunteer Lawyer</p>
              <p className="text-xs text-gray-400">Provide guidance, contribute to legal literacy, help those in need.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-12 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center">
              <Scale className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-white">Lex<span className="text-gradient">Aid</span></span>
          </div>

          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="font-display text-3xl font-bold text-white">{t('auth.register_title')}</h2>
              <p className="text-gray-400 mt-1 text-sm">{t('auth.register_subtitle')}</p>
            </div>
            <LanguageSwitcher />
          </div>

          {/* Role selector (mobile) */}
          <div className="lg:hidden flex rounded-xl overflow-hidden border border-white/10 mb-6">
            {['citizen', 'lawyer'].map(r => (
              <button key={r} type="button" id={`role-${r}`}
                onClick={() => setValue('role', r)}
                className={`flex-1 py-2.5 text-sm font-semibold transition-all ${role === r ? 'bg-brand-600 text-white' : 'bg-surface-700/50 text-gray-400 hover:text-white'}`}>
                {r === 'citizen' ? '👤 ' + t('auth.role_citizen') : '⚖️ ' + t('auth.role_lawyer')}
              </button>
            ))}
          </div>

          <form id="register-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <input type="hidden" {...register('role')} />

            {/* Full Name */}
            <div className="form-group">
              <label className="label" htmlFor="reg-name"><User className="w-3 h-3 inline mr-1" />{t('auth.full_name')}</label>
              <input id="reg-name" type="text" className={`input ${errors.full_name ? 'input-error' : ''}`}
                placeholder="Kumara Perera"
                {...register('full_name', { required: t('common.required'), minLength: { value: 2, message: 'Name too short' } })} />
              {errors.full_name && <p className="field-error">{errors.full_name.message}</p>}
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="label" htmlFor="reg-email"><Mail className="w-3 h-3 inline mr-1" />{t('auth.email')}</label>
              <input id="reg-email" type="email" className={`input ${errors.email ? 'input-error' : ''}`}
                placeholder="you@example.com"
                {...register('email', {
                  required: t('common.required'),
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email address' }
                })} />
              {errors.email && <p className="field-error">{errors.email.message}</p>}
            </div>

            {/* Phone */}
            <div className="form-group">
              <label className="label" htmlFor="reg-phone"><Phone className="w-3 h-3 inline mr-1" />{t('auth.phone')}</label>
              <input id="reg-phone" type="tel" className={`input ${errors.phone ? 'input-error' : ''}`}
                placeholder="+94 77 123 4567"
                {...register('phone', { required: t('common.required') })} />
              {errors.phone && <p className="field-error">{errors.phone.message}</p>}
            </div>

            {/* NIC */}
            <div className="form-group">
              <label className="label" htmlFor="reg-nic"><CreditCard className="w-3 h-3 inline mr-1" />{t('auth.nic')}</label>
              <input id="reg-nic" type="text" className={`input ${errors.nic ? 'input-error' : ''}`}
                placeholder="901234567V or 200012345678"
                {...register('nic', { required: t('common.required'), validate: validateNIC })} />
              <p className="text-xs text-gray-600 mt-1">{t('auth.nic_hint')}</p>
              {errors.nic && <p className="field-error">{errors.nic.message}</p>}
            </div>

            {/* SLBA (lawyers only) */}
            {role === 'lawyer' && (
              <div className="form-group">
                <label className="label" htmlFor="reg-slba"><BadgeCheck className="w-3 h-3 inline mr-1" />{t('auth.slba')}</label>
                <input id="reg-slba" type="text" className={`input ${errors.slba_number ? 'input-error' : ''}`}
                  placeholder="SLBA/2019/1234"
                  {...register('slba_number', { required: role === 'lawyer' ? t('common.required') : false })} />
                <p className="text-xs text-gray-600 mt-1">{t('auth.slba_hint')}</p>
                {errors.slba_number && <p className="field-error">{errors.slba_number.message}</p>}
              </div>
            )}

            {/* Specialisations (lawyers only) */}
            {role === 'lawyer' && (
              <div className="form-group">
                <label className="label">{t('auth.specialization')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {SPECIALISATIONS.map(spec => (
                    <label key={spec} className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" value={spec}
                        {...register('specialisations')}
                        className="rounded border-white/20 bg-surface-700 text-brand-500 focus:ring-brand-500 focus:ring-offset-0" />
                      <span className="text-xs text-gray-400 group-hover:text-gray-200 transition-colors">{spec}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Password */}
            <div className="form-group">
              <label className="label" htmlFor="reg-password"><Lock className="w-3 h-3 inline mr-1" />{t('auth.password')}</label>
              <div className="relative">
                <input id="reg-password" type={showPw ? 'text' : 'password'} className={`input pr-11 ${errors.password ? 'input-error' : ''}`}
                  placeholder="Min. 8 characters"
                  {...register('password', {
                    required: t('common.required'),
                    minLength: { value: 8, message: 'Password must be at least 8 characters' }
                  })} />
                <button type="button" id="reg-toggle-password"
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="field-error">{errors.password.message}</p>}
            </div>

            {/* Lawyer pending notice */}
            {role === 'lawyer' && (
              <div className="alert-info rounded-xl text-xs">
                ⏳ Lawyer accounts require admin verification of your SLBA credentials before activation.
              </div>
            )}

            <button id="register-submit" type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-3 text-base mt-2">
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account…
                </span>
              ) : (
                <>{t('auth.register_btn')} <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            {t('auth.have_account')}{' '}
            <Link to="/login" id="register-login-link" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              {t('nav.login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
