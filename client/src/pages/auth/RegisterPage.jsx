import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { 
  Scale, Eye, EyeOff, ArrowRight, ArrowLeft, User, Mail, 
  Phone, Lock, CreditCard, BadgeCheck, ShieldCheck, 
  Camera, RefreshCw, CheckCircle2, Image as ImageIcon
} from 'lucide-react';
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
  
  // Multi-step State
  const [step, setStep] = useState(1);
  
  // OTP State
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  // Phone availability check
  const [phoneStatus, setPhoneStatus] = useState('idle'); // 'idle' | 'checking' | 'available' | 'taken'

  // Camera State
  const [cameraActive, setCameraActive] = useState(false);
  const [selfieBlob, setSelfieBlob] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const {
    register, handleSubmit, watch, setValue, trigger,
    formState: { errors }
  } = useForm({
    defaultValues: { role: params.get('role') === 'lawyer' ? 'lawyer' : 'citizen' }
  });

  const role = watch('role');
  const maxSteps = role === 'lawyer' ? 6 : 4;

  const startCamera = async () => {
    setCameraActive(true);
    setSelfieBlob(null);
    setSelfiePreview(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      toast.error("Could not access camera. Please check permissions.");
      setCameraActive(false);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      setSelfieBlob(blob);
      setSelfiePreview(URL.createObjectURL(blob));
      stopCamera();
    }, 'image/jpeg', 0.95);
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    stream?.getTracks().forEach(track => track.stop());
    setCameraActive(false);
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const handleSendOtp = async () => {
    let phoneVal = watch('phone');
    if (!phoneVal || phoneVal.length < 9) {
      toast.error('Please enter a valid phone number');
      return;
    }
    
    if (phoneVal.startsWith('0')) phoneVal = phoneVal.slice(1);

    // If not checked yet, check now
    if (phoneStatus === 'idle') {
      setPhoneStatus('checking');
      try {
        const { data } = await axios.post('/auth/check-phone', { phone: '0' + phoneVal });
        if (!data.available) {
          setPhoneStatus('taken');
          return;
        }
        setPhoneStatus('available');
      } catch {
        setPhoneStatus('idle');
        toast.error('Could not verify phone availability. Please try again.');
        return;
      }
    }

    if (phoneStatus === 'taken') return;

    setOtpLoading(true);
    try {
      const { data } = await axios.post('/auth/send-otp', { phone: '0' + phoneVal });
      setOtpSent(true);
      toast.success(data.message);
      if (data.dev_otp) {
        toast(`Dev OTP: ${data.dev_otp}`, { icon: '🔑' });
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleCheckPhone = async (val) => {
    let phoneVal = val || watch('phone');
    if (!phoneVal || phoneVal.length < 9) {
      setPhoneStatus('idle');
      return;
    }
    if (phoneVal.startsWith('0')) phoneVal = phoneVal.slice(1);
    setPhoneStatus('checking');
    try {
      const { data } = await axios.post('/auth/check-phone', { phone: '0' + phoneVal });
      setPhoneStatus(data.available ? 'available' : 'taken');
    } catch {
      setPhoneStatus('idle');
    }
  };

  const phoneValue = watch('phone');

  // Automatic Check on Type (Debounced)
  useEffect(() => {
    if (!phoneValue || phoneValue.length < 9) {
      setPhoneStatus('idle');
      return;
    }
    
    setOtpSent(false); // Reset OTP if phone changes
    
    const timer = setTimeout(() => {
      handleCheckPhone(phoneValue);
    }, 600); // Wait 600ms after last type

    return () => clearTimeout(timer);
  }, [phoneValue]);

  const handleVerifyOtp = async () => {
    let phoneVal = watch('phone');
    if (phoneVal.startsWith('0')) phoneVal = phoneVal.slice(1);

    setOtpLoading(true);
    try {
      await axios.post('/auth/verify-otp', { phone: '0' + phoneVal, otp: otpCode });
      setOtpVerified(true);
      toast.success('Phone number verified!');
      // Auto move to next step after verification
      setTimeout(() => setStep(3), 1000);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Invalid OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const nextStep = async () => {
    let fieldsToValidate = [];
    if (step === 1) fieldsToValidate = ['full_name', 'email'];
    if (step === 2) {
      if (!otpVerified) {
        toast.error('Please verify your phone number first');
        return;
      }
      fieldsToValidate = ['phone'];
    }
    if (step === 3) {
      fieldsToValidate = ['role', 'nic'];
      if (role === 'lawyer') fieldsToValidate.push('slba_number', 'specialisations');
    }
    if (step === 4 && role === 'lawyer') {
      const idCard = watch('id_card');
      if (!idCard || idCard.length === 0) {
        toast.error('Please upload your ID Card');
        return;
      }
    }
    if (step === 5 && role === 'lawyer') {
      if (!selfieBlob) {
        toast.error('Please take a selfie for verification');
        return;
      }
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep(s => s + 1);
    }
  };

  const prevStep = () => {
    setStep(s => s - 1);
  };

  const onSubmit = async (data) => {
    setLoading(true);
    let phoneVal = data.phone;
    if (phoneVal.startsWith('0')) phoneVal = phoneVal.slice(1);
    
    const formData = new FormData();
    formData.append('full_name', data.full_name);
    formData.append('email', data.email);
    formData.append('password', data.password);
    formData.append('nic', data.nic);
    formData.append('role', data.role);
    formData.append('phone', '0' + phoneVal);
    
    if (role === 'lawyer') {
      formData.append('slba_number', data.slba_number);
      if (Array.isArray(data.specialisations)) {
        data.specialisations.forEach(s => formData.append('specialisations[]', s));
      }
      formData.append('id_card', data.id_card[0]);
      // Use the live selfie blob
      formData.append('face_photo', selfieBlob, 'selfie.jpg');
    }

    try {
      const user = await authRegister(formData);
      toast.success('Account created! Welcome to LexAid.');
      if (user.role === 'lawyer' && user.status === 'pending') {
        toast('Your account is pending admin verification.', { icon: '⏳', duration: 6000 });
        navigate('/login');
      } else {
        navigate(user.role === 'lawyer' ? '/lawyer' : '/citizen', { replace: true });
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Registration failed. Please try again.';
      const isDuplicate = err?.response?.status === 409;

      if (isDuplicate) {
        // Show error with a login shortcut
        toast.error(
          (t) => (
            <div>
              <p className="text-sm font-semibold">{msg}</p>
              <button
                onClick={() => { toast.dismiss(t.id); navigate('/login'); }}
                className="mt-2 text-xs font-bold underline text-amber-400 hover:text-amber-300"
              >
                Go to Login →
              </button>
            </div>
          ),
          { duration: 8000, icon: '🔑' }
        );
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#000000' }}>

      {/* ── Left decorative panel ── */}
      <div
        className="hidden lg:flex lg:w-1/3 relative overflow-hidden items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #000000 0%, #14213D 60%, #000000 100%)' }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-72 h-72 rounded-full blur-3xl animate-pulse-slow"
            style={{ background: 'rgba(252,163,17,0.10)' }} />
          <div className="absolute bottom-1/3 left-1/4 w-56 h-56 rounded-full blur-3xl animate-pulse-slow"
            style={{ background: 'rgba(20,33,61,0.70)', animationDelay: '2s' }} />
        </div>

        <div className="relative z-10 text-center px-12">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-float"
            style={{ background: 'linear-gradient(135deg, #FCA311, #e5920f)', boxShadow: '0 12px 40px rgba(252,163,17,0.35)' }}
          >
            <Scale className="w-10 h-10 text-black" />
          </div>
          <h1 className="font-display text-4xl font-bold text-white mb-3">Join LexAid</h1>
          <p className="text-gray-400 text-base leading-relaxed max-w-sm">
            Complete the verification process to get started.
          </p>

          <div className="mt-12 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2">
              {[...Array(maxSteps)].map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i + 1 <= step ? 'w-8 bg-brand-500' : 'w-2 bg-surface-700'}`} />
              ))}
            </div>
            <p className="text-xs text-brand-400 font-bold uppercase tracking-widest">Step {step} of {maxSteps}</p>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div
        className="flex-1 flex items-start justify-center px-4 sm:px-8 py-10 sm:py-12 overflow-y-auto"
        style={{ background: '#000000' }}
      >
        <div className="w-full max-w-md">

          {/* Mobile progress indicator */}
          <div className="lg:hidden flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #FCA311, #e5920f)' }}>
                <Scale className="w-4 h-4 text-black" />
              </div>
              <span className="font-display font-bold text-xl text-white">LexAid</span>
            </div>
            <div className="flex items-center gap-1">
              {[...Array(maxSteps)].map((_, i) => (
                <div key={i} className={`h-1 rounded-full ${i + 1 <= step ? 'w-4 bg-brand-500' : 'w-1.5 bg-surface-700'}`} />
              ))}
            </div>
          </div>

          <div className="flex justify-between items-start mb-10">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
                {step === 1 && "Create Your Account"}
                {step === 2 && "Phone Verification"}
                {step === 3 && "Identity Details"}
                {step === 4 && (role === 'lawyer' ? "Verification Documents" : "Set Your Password")}
                {step === 5 && "Face Verification"}
                {step === 6 && "Finalize Registration"}
              </h2>
              <p className="text-gray-500 mt-1 text-sm">
                {step === 1 && "Start by telling us who you are."}
                {step === 2 && "We'll send a code to your phone."}
                {step === 3 && "Choose your role and provide your NIC."}
                {step === 4 && (role === 'lawyer' ? "Upload your official lawyer ID card." : "Create a secure password.")}
                {step === 5 && "Take a live selfie for face verification."}
                {step === 6 && "Create a secure password to finish."}
              </p>
            </div>
            <LanguageSwitcher />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
            
            {/* STEP 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <div className="form-group">
                  <label className="label">
                    <User className="w-3.5 h-3.5 inline mr-2 text-brand-400" />
                    Full Name
                  </label>
                  <input type="text" className={`input ${errors.full_name ? 'input-error' : ''}`}
                    placeholder="John Doe"
                    {...register('full_name', { required: "Name is required", minLength: 2 })} />
                  {errors.full_name && <p className="field-error">{errors.full_name.message}</p>}
                </div>

                <div className="form-group">
                  <label className="label">
                    <Mail className="w-3.5 h-3.5 inline mr-2 text-brand-400" />
                    Email Address
                  </label>
                  <input type="email" className={`input ${errors.email ? 'input-error' : ''}`}
                    placeholder="john@example.com"
                    {...register('email', {
                      required: "Email is required",
                      pattern: { value: /^\S+@\S+\.\S+$/, message: "Invalid email" }
                    })} />
                  {errors.email && <p className="field-error">{errors.email.message}</p>}
                </div>
              </div>
            )}

            {/* STEP 2: Phone & OTP */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <div className="form-group">
                  <label className="label">
                    <Phone className="w-3.5 h-3.5 inline mr-2 text-brand-400" />
                    Mobile Number
                  </label>

                  {/* Phone input row */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">+94</span>
                      <input
                        type="tel"
                        className={`input pl-12 pr-10 ${
                          errors.phone ? 'input-error' :
                          phoneStatus === 'taken' ? 'input-error' :
                          phoneStatus === 'available' ? 'border-green-500/60' : ''
                        }`}
                        placeholder="077 123 4567"
                        maxLength={10}
                        {...register('phone', {
                          required: 'Phone is required',
                          pattern: { value: /^\d{9,10}$/, message: 'Invalid phone number' },
                        })}
                        disabled={otpVerified}
                      />
                      {/* Status icon inside input */}
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm">
                        {phoneStatus === 'checking' && <RefreshCw className="w-3.5 h-3.5 text-gray-400 animate-spin" />}
                        {phoneStatus === 'available' && <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />}
                        {phoneStatus === 'taken'     && <span className="text-red-400 text-xs font-bold">✕</span>}
                      </span>
                    </div>

                    {/* Send OTP button — hidden once verified */}
                    {!otpVerified && (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={otpLoading || !watch('phone') || otpSent || phoneStatus === 'taken' || phoneStatus === 'checking'}
                        className="btn-ghost text-brand-400 border border-brand-500/20 px-4 rounded-xl text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {otpLoading
                          ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          : phoneStatus === 'checking' ? 'Checking…'
                          : otpSent ? 'Resend'
                          : 'Send OTP'}
                      </button>
                    )}
                  </div>

                  {errors.phone && <p className="field-error">{errors.phone.message}</p>}

                  {/* Phone status messages */}
                  {phoneStatus === 'available' && !otpSent && (
                    <p className="text-xs text-green-400 flex items-center gap-1 mt-1">
                      <CheckCircle2 className="w-3 h-3" /> Number available — tap Send OTP to continue
                    </p>
                  )}
                  {phoneStatus === 'taken' && (
                    <div className="mt-2 p-3 rounded-xl bg-red-500/8 border border-red-500/25 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-red-400">📵 Already registered</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">This number is linked to an existing account.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate('/login')}
                        className="text-[10px] font-bold text-brand-400 hover:text-brand-300 underline flex-shrink-0 mt-0.5"
                      >
                        Log in →
                      </button>
                    </div>
                  )}
                </div>

                {otpSent && !otpVerified && (
                  <div className="form-group animate-in fade-in zoom-in-95">
                    <label className="label">Verification Code</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="6-digit code"
                        className="input flex-1 text-center tracking-widest font-mono text-lg"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      />
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={otpLoading || otpCode.length !== 6}
                        className="btn-primary px-6"
                      >
                        {otpLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Verify'}
                      </button>
                    </div>
                  </div>
                )}

                {otpVerified && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Verified Successfully</p>
                      <p className="text-xs text-gray-400">Your phone number is linked.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: Role & Identity */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="form-group">
                  <label className="label">Choose Your Role</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['citizen', 'lawyer'].map(r => (
                      <button key={r} type="button"
                        onClick={() => setValue('role', r)}
                        className={`p-4 rounded-2xl border transition-all text-left ${role === r ? 'bg-brand-500/10 border-brand-500' : 'bg-surface-800 border-white/5 hover:border-white/10'}`}>
                        <p className={`text-sm font-bold ${role === r ? 'text-brand-400' : 'text-white'}`}>
                          {r === 'citizen' ? '👤 Citizen' : '⚖️ Lawyer'}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-1">
                          {r === 'citizen' ? 'Get legal help' : 'Provide legal help'}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="label">
                    <CreditCard className="w-3.5 h-3.5 inline mr-2 text-brand-400" />
                    NIC Number
                  </label>
                  <input type="text" className={`input ${errors.nic ? 'input-error' : ''}`}
                    placeholder="901234567V or 200012345678"
                    {...register('nic', { required: true, validate: validateNIC })} />
                  {errors.nic && <p className="field-error">{errors.nic.message}</p>}
                </div>

                {role === 'lawyer' && (
                  <>
                    <div className="form-group animate-in fade-in slide-in-from-top-2">
                      <label className="label">SLBA Enrollment Number</label>
                      <input type="text" className={`input ${errors.slba_number ? 'input-error' : ''}`}
                        placeholder="SLBA/20XX/XXXX"
                        {...register('slba_number', { required: role === 'lawyer' })} />
                    </div>

                    <div className="form-group">
                      <label className="label">Specialisations</label>
                      <div className="grid grid-cols-2 gap-2">
                        {SPECIALISATIONS.map(spec => (
                          <label key={spec} className="flex items-center gap-2 cursor-pointer group">
                            <input type="checkbox" value={spec}
                              {...register('specialisations')}
                              className="rounded bg-surface-700 focus:ring-offset-0 text-brand-500" />
                            <span className="text-[10px] text-gray-400 group-hover:text-gray-200">{spec}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* STEP 4: Lawyer ID Card */}
            {step === 4 && role === 'lawyer' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="bg-surface-800 rounded-3xl p-8 border border-white/5 text-center">
                  <div className="w-16 h-16 bg-brand-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <ImageIcon className="w-8 h-8 text-brand-400" />
                  </div>
                  <h3 className="text-white font-bold mb-2">Upload ID Card</h3>
                  <p className="text-gray-500 text-xs leading-relaxed mb-6">
                    Please upload a clear image or PDF of your official lawyer identification card for verification.
                  </p>
                  
                  <label className="block">
                    <span className="sr-only">Choose ID card</span>
                    <input type="file" accept="image/*,application/pdf"
                      className="block w-full text-xs text-gray-500
                        file:mr-4 file:py-2.5 file:px-6
                        file:rounded-xl file:border-0
                        file:text-xs file:font-bold
                        file:bg-brand-500 file:text-black
                        hover:file:bg-brand-400 transition-all cursor-pointer"
                      {...register('id_card', { required: true })} />
                  </label>
                </div>
              </div>
            )}

            {/* STEP 5: Face Verification (Lawyer Only) */}
            {step === 5 && role === 'lawyer' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="relative aspect-square rounded-3xl overflow-hidden bg-surface-800 border border-white/10 group">
                  {cameraActive ? (
                    <>
                      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover mirror" />
                      <div className="absolute inset-0 border-[3px] border-dashed border-brand-500/50 rounded-3xl m-8 pointer-events-none" />
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
                        <button type="button" onClick={capturePhoto} 
                          className="w-14 h-14 rounded-full bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/20 hover:scale-105 transition-transform">
                          <Camera className="w-6 h-6 text-black" />
                        </button>
                      </div>
                    </>
                  ) : selfiePreview ? (
                    <div className="relative w-full h-full">
                      <img src={selfiePreview} alt="Selfie" className="w-full h-full object-cover" />
                      <button type="button" onClick={startCamera}
                        className="absolute bottom-6 left-1/2 -translate-x-1/2 btn-secondary bg-black/60 backdrop-blur-md border-white/20 text-xs py-2 px-4 flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5" /> Retake Photo
                      </button>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
                      <div className="w-16 h-16 bg-brand-500/10 rounded-full flex items-center justify-center mb-4">
                        <Camera className="w-8 h-8 text-brand-400" />
                      </div>
                      <h3 className="text-white font-bold">Face Verification</h3>
                      <p className="text-gray-500 text-xs mt-2 mb-6">Position your face in the frame. This photo will be compared with your ID card.</p>
                      <button type="button" onClick={startCamera} className="btn-primary px-8">Start Camera</button>
                    </div>
                  )}
                  <canvas ref={canvasRef} className="hidden" />
                </div>
              </div>
            )}

            {/* STEP: Password (Last Step) */}
            {((step === 4 && role === 'citizen') || step === maxSteps) && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <div className="form-group">
                  <label className="label">
                    <Lock className="w-3.5 h-3.5 inline mr-2 text-brand-400" />
                    Security Password
                  </label>
                  <div className="relative">
                    <input type={showPw ? 'text' : 'password'} className={`input pr-11 ${errors.password ? 'input-error' : ''}`}
                      placeholder="Min. 8 characters"
                      {...register('password', {
                        required: "Password is required",
                        minLength: { value: 8, message: "Too short" }
                      })} />
                    <button type="button" onClick={() => setShowPw(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="field-error">{errors.password.message}</p>}
                </div>

                {role === 'lawyer' && (
                  <div className="alert-info rounded-2xl text-[10px] p-4 border-brand-500/20 bg-brand-500/5">
                    <ShieldCheck className="w-3.5 h-3.5 inline mr-1 text-brand-400" />
                    By registering, you agree to LexAid's professional guidelines. Your account will be activated after SLBA verification.
                  </div>
                )}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-4 mt-4">
              {step > 1 && (
                <button type="button" onClick={prevStep} className="btn-secondary px-6">
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              
              {step < maxSteps ? (
                <button type="button" onClick={nextStep}
                  className="btn-primary flex-1 justify-center py-3.5 text-base shadow-xl shadow-brand-500/10">
                  Continue <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              ) : (
                <button type="submit" disabled={loading}
                  className="btn-primary flex-1 justify-center py-3.5 text-base shadow-xl shadow-brand-500/20">
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" /> Creating Account...
                    </span>
                  ) : (
                    <>Complete Registration <CheckCircle2 className="w-4 h-4 ml-2" /></>
                  )}
                </button>
              )}
            </div>
          </form>

          <p className="text-center text-sm text-gray-500 mt-10">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-brand-400 hover:underline transition-all">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
