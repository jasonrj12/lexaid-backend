import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { Scale, Eye, EyeOff, ArrowRight, User, Mail, Phone, Lock, CreditCard, BadgeCheck, ShieldCheck } from 'lucide-react';
import axios from 'axios';
import LanguageSwitcher from '../../components/layout/LanguageSwitcher';

const SPECIALISATIONS = ['Land & Property','Labour & Employment','Consumer Rights','Family Law','Criminal Guidance','Other Civil Matters'];

const validateNIC = (val) => {
  const old12   = /^\d{9}[VXvx]$/.test(val);
  const newFmt  = /^\d{12}$/.test(val);
  return old12 || newFmt || 'Invalid NIC format (e.g. 901234567V or 200012345678)';
};

export default function RegisterPage() {
  const { t } = useTranslation();
  const { register: authRegister } = useAuth();
  const navigate   = useNavigate();
  const [params]   = useSearchParams();
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  
  // OTP State
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  const {
    register, handleSubmit, watch, setValue,
    formState: { errors }
  } = useForm({
    defaultValues: { role: params.get('role') === 'lawyer' ? 'lawyer' : 'citizen' }
  });

  const role = watch('role');

  const handleSendOtp = async () => {
    let phoneVal = watch('phone');
    if (!phoneVal) return;
    
    // Normalize: if user typed 077..., strip the 0 because we'll prepend 0 later or let backend handle
    // Actually, backend normalizePhone handles '077...' and '77...' correctly.
    // So we just need to ensure it's a valid 9 or 10 digit string.
    if (phoneVal.startsWith('0')) phoneVal = phoneVal.slice(1);
    
    setOtpLoading(true);
    try {
      const { data } = await axios.post('/auth/send-otp', { phone: '0' + phoneVal });
      setOtpSent(true);
      toast.success(data.message);
      if (data.dev_otp) {
        console.log('DEV OTP:', data.dev_otp);
        toast(`Dev OTP: ${data.dev_otp}`, { icon: '🔑' });
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    let phoneVal = watch('phone');
    if (phoneVal.startsWith('0')) phoneVal = phoneVal.slice(1);
    
    setOtpLoading(true);
    try {
      await axios.post('/auth/verify-otp', { phone: '0' + phoneVal, otp: otpCode });
      setOtpVerified(true);
      toast.success('Phone number verified!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Invalid OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const onSubmit = async (data) => {
    if (!otpVerified) {
      toast.error('Please verify your phone number first');
      return;
    }
    setLoading(true);
    let phoneVal = data.phone;
    if (phoneVal.startsWith('0')) phoneVal = phoneVal.slice(1);
    const payload = { ...data, phone: '0' + phoneVal };
    try {
      const user = await authRegister(payload);
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
    <div className="min-h-screen flex" style={{ background: '#000000' }}>

      {/* ── Left decorative panel ── */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #000000 0%, #14213D 60%, #000000 100%)' }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-72 h-72 rounded-full blur-3xl animate-pulse-slow"
            style={{ background: 'rgba(252,163,17,0.10)' }} />
          <div className="absolute bottom-1/3 left-1/4 w-56 h-56 rounded-full blur-3xl animate-pulse-slow"
            style={{ background: 'rgba(20,33,61,0.70)', animationDelay: '2s' }} />
        </div>

        {/* Grid overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: 'linear-gradient(rgba(252,163,17,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(252,163,17,0.06) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative z-10 text-center px-12">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-float"
            style={{ background: 'linear-gradient(135deg, #FCA311, #e5920f)', boxShadow: '0 12px 40px rgba(252,163,17,0.35)' }}
          >
            <Scale className="w-10 h-10 text-black" />
          </div>
          <h1 className="font-display text-4xl font-bold text-white mb-3">Join LexAid</h1>
          <p className="text-gray-400 text-base leading-relaxed max-w-sm">
            Whether you need legal help or want to volunteer your expertise — LexAid connects you.
          </p>

          <div className="amber-line w-24 mx-auto my-8" />

          {/* Role highlight */}
          <div className="flex flex-col gap-4">
            <button
              type="button"
              onClick={() => setValue('role', 'citizen')}
              className="text-left p-4 rounded-2xl transition-all duration-300 cursor-pointer"
              style={{
                background: role === 'citizen' ? 'rgba(252,163,17,0.15)' : 'rgba(20,33,61,0.40)',
                border: `1px solid ${role === 'citizen' ? 'rgba(252,163,17,0.50)' : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              <p className="text-sm font-semibold text-white mb-1">👤 Citizen</p>
              <p className="text-xs text-gray-400">Submit queries, track cases, receive legal guidance — free of charge.</p>
            </button>
            <button
              type="button"
              onClick={() => setValue('role', 'lawyer')}
              className="text-left p-4 rounded-2xl transition-all duration-300 cursor-pointer"
              style={{
                background: role === 'lawyer' ? 'rgba(20,33,61,0.70)' : 'rgba(20,33,61,0.40)',
                border: `1px solid ${role === 'lawyer' ? 'rgba(252,163,17,0.40)' : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              <p className="text-sm font-semibold text-white mb-1">⚖️ Volunteer Lawyer</p>
              <p className="text-xs text-gray-400">Provide guidance, contribute to legal literacy, help those in need.</p>
            </button>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div
        className="flex-1 flex items-start justify-center px-4 sm:px-8 py-10 sm:py-12 overflow-y-auto"
        style={{ background: '#000000' }}
      >
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #FCA311, #e5920f)' }}>
              <Scale className="w-4 h-4 text-black" />
            </div>
            <span className="font-display font-bold text-xl text-white">Lex<span className="text-gradient">Aid</span></span>
          </div>

          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">{t('auth.register_title')}</h2>
              <p className="text-gray-400 mt-1 text-sm">{t('auth.register_subtitle')}</p>
            </div>
            <LanguageSwitcher />
          </div>

          {/* Role selector (mobile only) */}
          <div className="lg:hidden flex rounded-xl overflow-hidden border mb-6" style={{ borderColor: 'rgba(252,163,17,0.20)' }}>
            {['citizen', 'lawyer'].map(r => (
              <button key={r} type="button" id={`role-${r}`}
                onClick={() => setValue('role', r)}
                className="flex-1 py-3 text-sm font-semibold transition-all"
                style={role === r
                  ? { background: '#FCA311', color: '#000' }
                  : { background: 'rgba(20,33,61,0.50)', color: '#9ca3af' }
                }
              >
                {r === 'citizen' ? '👤 ' + t('auth.role_citizen') : '⚖️ ' + t('auth.role_lawyer')}
              </button>
            ))}
          </div>

          <form id="register-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <input type="hidden" {...register('role')} />

            {/* Full Name */}
            <div className="form-group">
              <label className="label" htmlFor="reg-name">
                <User className="w-3 h-3 inline mr-1" style={{ color: '#FCA311' }} />
                {t('auth.full_name')}
              </label>
              <input id="reg-name" type="text" className={`input ${errors.full_name ? 'input-error' : ''}`}
                placeholder="Kumara Perera"
                {...register('full_name', { required: t('common.required'), minLength: { value: 2, message: 'Name too short' } })} />
              {errors.full_name && <p className="field-error">{errors.full_name.message}</p>}
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="label" htmlFor="reg-email">
                <Mail className="w-3 h-3 inline mr-1" style={{ color: '#FCA311' }} />
                {t('auth.email')}
              </label>
              <input id="reg-email" type="email" className={`input ${errors.email ? 'input-error' : ''}`}
                placeholder="you@example.com"
                {...register('email', {
                  required: t('common.required'),
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email address' }
                })} />
              {errors.email && <p className="field-error">{errors.email.message}</p>}
            </div>

            {/* Phone & OTP */}
            <div className="form-group">
              <label className="label" htmlFor="reg-phone">
                <Phone className="w-3 h-3 inline mr-1" style={{ color: '#FCA311' }} />
                {t('auth.phone')}
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">+94</span>
                  <input
                    id="reg-phone"
                    type="tel"
                    className={`input pl-12 ${errors.phone ? 'input-error' : ''}`}
                    placeholder="077 123 4567"
                    maxLength={10}
                    {...register('phone', {
                      required: t('common.required'),
                      pattern: { value: /^\d{9,10}$/, message: 'Enter a valid 9 or 10-digit phone number' }
                    })}
                    disabled={otpVerified || otpSent}
                  />
                </div>
                {!otpVerified && (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={otpLoading || !watch('phone') || errors.phone || otpSent}
                    className="px-4 rounded-xl text-xs font-semibold transition-all"
                    style={{
                      background: 'rgba(252,163,17,0.15)',
                      color: '#FCA311',
                      border: '1px solid rgba(252,163,17,0.40)'
                    }}
                  >
                    {otpLoading ? '...' : otpSent ? 'Sent' : 'Send OTP'}
                  </button>
                )}
              </div>
              {errors.phone && <p className="field-error">{errors.phone.message}</p>}
              
              {otpSent && !otpVerified && (
                <div className="mt-3 flex gap-2 animate-in fade-in slide-in-from-top-2">
                  <input
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    className="input flex-1 text-center tracking-widest font-mono"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={otpLoading || otpCode.length !== 6}
                    className="btn-primary py-2 px-6 text-sm"
                  >
                    {otpLoading ? '...' : 'Verify'}
                  </button>
                </div>
              )}
              
              {otpVerified && (
                <p className="text-xs text-green-500 mt-2 flex items-center gap-1">
                  <BadgeCheck className="w-3 h-3" /> Phone number verified
                </p>
              )}
            </div>

            {/* NIC */}
            <div className="form-group">
              <label className="label" htmlFor="reg-nic">
                <CreditCard className="w-3 h-3 inline mr-1" style={{ color: '#FCA311' }} />
                {t('auth.nic')}
              </label>
              <input id="reg-nic" type="text" className={`input ${errors.nic ? 'input-error' : ''}`}
                placeholder="901234567V or 200012345678"
                {...register('nic', { required: t('common.required'), validate: validateNIC })} />
              <p className="text-xs text-gray-600 mt-1">{t('auth.nic_hint')}</p>
              {errors.nic && <p className="field-error">{errors.nic.message}</p>}
            </div>

            {/* SLBA (lawyers only) */}
            {role === 'lawyer' && (
              <div className="form-group">
                <label className="label" htmlFor="reg-slba">
                  <BadgeCheck className="w-3 h-3 inline mr-1" style={{ color: '#FCA311' }} />
                  {t('auth.slba')}
                </label>
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
                        className="rounded bg-surface-700 focus:ring-offset-0"
                        style={{ accentColor: '#FCA311' }} />
                      <span className="text-xs text-gray-400 group-hover:text-gray-200 transition-colors">{spec}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Password */}
            <div className="form-group">
              <label className="label" htmlFor="reg-password">
                <Lock className="w-3 h-3 inline mr-1" style={{ color: '#FCA311' }} />
                {t('auth.password')}
              </label>
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

            <button id="register-submit" type="submit" disabled={loading || !otpVerified}
              className={`btn-primary w-full justify-center py-3 text-base mt-2 ${!otpVerified ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {!otpVerified ? (
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Verify Phone to Continue
                </span>
              ) : loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 rounded-full animate-spin"
                    style={{ borderColor: 'rgba(0,0,0,0.30)', borderTopColor: '#000' }} />
                  Creating account…
                </span>
              ) : (
                <>{t('auth.register_btn')} <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            {t('auth.have_account')}{' '}
            <Link to="/login" id="register-login-link" className="font-medium transition-colors hover:underline" style={{ color: '#FCA311' }}>
              {t('nav.login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
