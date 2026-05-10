import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import {
  Scale, ArrowRight, Shield, Globe, Clock, Users,
  Landmark, Briefcase, ShoppingBag, Heart, Gavel, FileText,
  CheckCircle2, ChevronRight, Sparkles
} from 'lucide-react';

const STATS = [
  { key: 'stats_cases', value: '12,400+', icon: Scale },
  { key: 'stats_lawyers', value: '340+', icon: Users },
  { key: 'stats_resolution', value: '91%', icon: CheckCircle2 },
  { key: 'stats_languages', value: '3', icon: Globe },
];

const CATEGORIES = [
  { key: 'land', icon: Landmark, color: '#1a2a4a', border: 'rgba(252,163,17,0.25)', text: '#FCA311' },
  { key: 'labour', icon: Briefcase, color: '#1a2040', border: 'rgba(93,139,198,0.30)', text: '#7eb3e3' },
  { key: 'consumer', icon: ShoppingBag, color: '#1f1a2a', border: 'rgba(168,85,247,0.25)', text: '#c084fc' },
  { key: 'family', icon: Heart, color: '#2a1a25', border: 'rgba(236,72,153,0.25)', text: '#f9a8d4' },
  { key: 'criminal', icon: Gavel, color: '#2a1a1a', border: 'rgba(239,68,68,0.25)', text: '#fca5a5' },
  { key: 'other', icon: FileText, color: '#1a2a20', border: 'rgba(34,197,94,0.25)', text: '#86efac' },
];

const STEPS = ['how_step1', 'how_step2', 'how_step3', 'how_step4'];

export default function LandingPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#000000' }}>
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">

        {/* Background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse-slow"
            style={{ background: 'rgba(252,163,17,0.10)' }} />
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full blur-3xl animate-pulse-slow"
            style={{ background: 'rgba(20,33,61,0.60)', animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl animate-pulse-slow"
            style={{ background: 'rgba(252,163,17,0.05)', animationDelay: '4s' }} />
        </div>

        {/* Subtle grid overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage: 'linear-gradient(rgba(252,163,17,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(252,163,17,0.04) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">

          {/* Tag */}
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-8 animate-fade-in"
            style={{ background: 'rgba(252,163,17,0.12)', border: '1px solid rgba(252,163,17,0.30)', color: '#FCA311' }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            {t('landing.hero_tag')}
          </div>

          {/* Title */}
          <h1 className="font-display font-extrabold text-4xl sm:text-6xl lg:text-7xl text-white mb-6 leading-tight animate-slide-up text-balance">
            {t('landing.hero_title').split('\n').map((line, i) => (
              <span key={i} className={i === 2 ? 'text-gradient' : ''}>
                {i > 0 && <br />}
                {line}
              </span>
            ))}
          </h1>

          {/* Subtitle */}
          <p className="text-gray-400 text-base sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
            {t('landing.hero_subtitle')}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Link to="/register" id="hero-cta-citizen" className="btn-primary text-base px-8 py-3 w-full sm:w-auto">
              {t('landing.cta_citizen')} <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/register?role=lawyer" id="hero-cta-lawyer" className="btn-secondary text-base px-8 py-3 w-full sm:w-auto">
              {t('landing.cta_lawyer')}
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mt-10 sm:mt-12 text-gray-500 text-xs font-medium animate-fade-in" style={{ animationDelay: '0.4s' }}>
            {[
              { icon: Shield, label: 'NIC Verified' },
              { icon: CheckCircle2, label: 'SLBA Verified Lawyers' },
              { icon: Globe, label: '3 Languages' },
              { icon: Clock, label: '72h Response SLA' },
            ].map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5" style={{ color: '#FCA311' }} />
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-600 text-xs animate-bounce">
          <ChevronRight className="w-4 h-4 rotate-90" />
        </div>
      </section>

      {/* Amber divider */}
      <div className="amber-line" />

      {/* ── Stats ────────────────────────────────────────────────── */}
      <section className="py-14 sm:py-16" style={{ background: 'rgba(20,33,61,0.40)', borderBottom: '1px solid rgba(252,163,17,0.10)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {STATS.map(({ key, value, icon: Icon }) => (
              <div
                key={key}
                className="stat-card text-center items-center group transition-all duration-300 hover:-translate-y-1"
                style={{ borderColor: 'rgba(252,163,17,0.10)' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(252,163,17,0.35)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(252,163,17,0.10)'}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors"
                  style={{ background: 'rgba(252,163,17,0.12)' }}
                >
                  <Icon className="w-5 h-5" style={{ color: '#FCA311' }} />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-white font-display">{value}</p>
                <p className="text-xs text-gray-500 font-medium mt-1">{t(`landing.${key}`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────── */}
      <section className="py-20 sm:py-24 max-w-5xl mx-auto px-4 sm:px-6 w-full">
        <div className="text-center mb-12 sm:mb-14">
          <h2 className="section-title text-3xl sm:text-4xl">{t('landing.how_title')}</h2>
          <div className="amber-line w-16 mx-auto mt-3" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {STEPS.map((step, idx) => (
            <div
              key={step}
              className="relative overflow-hidden group transition-all duration-300 hover:-translate-y-1 rounded-2xl p-5 sm:p-6"
              style={{
                background: 'rgba(20,33,61,0.50)',
                border: '1px solid rgba(252,163,17,0.10)',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(252,163,17,0.35)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(252,163,17,0.10)'}
            >
              <div className="absolute -top-6 -right-4 text-8xl font-black font-display select-none"
                style={{ color: 'rgba(252,163,17,0.06)' }}>
                {idx + 1}
              </div>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 text-black font-bold text-lg font-display transition-colors"
                style={{ background: '#FCA311' }}
              >
                {idx + 1}
              </div>
              <h3 className="text-base font-semibold text-white mb-2">{t(`landing.${step}_title`)}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{t(`landing.${step}_desc`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Legal Categories ──────────────────────────────────────── */}
      <section
        className="py-20 sm:py-24"
        style={{ background: 'rgba(20,33,61,0.30)', borderTop: '1px solid rgba(252,163,17,0.08)', borderBottom: '1px solid rgba(252,163,17,0.08)' }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-14">
            <h2 className="section-title text-3xl sm:text-4xl">{t('landing.categories_title')}</h2>
            <div className="amber-line w-16 mx-auto mt-3" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {CATEGORIES.map(({ key, icon: Icon, color, border, text }) => (
              <Link
                key={key}
                to="/register"
                id={`cat-${key}`}
                className="p-4 sm:p-5 rounded-2xl flex flex-col gap-3 group transition-all duration-300 hover:scale-[1.03] hover:-translate-y-0.5"
                style={{ background: color, border: `1px solid ${border}` }}
              >
                <Icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: text }} />
                <span className="text-sm font-semibold leading-tight" style={{ color: text }}>{t(`cases.categories.${key}`)}</span>
                <ArrowRight
                  className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300"
                  style={{ color: text }}
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 max-w-4xl mx-auto px-4 sm:px-6 text-center w-full">
        <div
          className="relative overflow-hidden rounded-2xl p-8 sm:p-12"
          style={{ background: 'rgba(20,33,61,0.60)', border: '1px solid rgba(252,163,17,0.20)' }}
        >
          {/* Decorative orb */}
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl pointer-events-none"
            style={{ background: 'rgba(252,163,17,0.08)' }} />

          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #FCA311, #e5920f)', boxShadow: '0 6px 24px rgba(252,163,17,0.35)' }}
          >
            <Sparkles className="w-7 h-7 text-black" />
          </div>

          <h2 className="text-2xl sm:text-4xl font-bold text-white font-display mb-4">
            Access to justice <span className="text-gradient">starts here.</span>
          </h2>
          <p className="text-gray-400 max-w-lg mx-auto mb-8 text-sm sm:text-base">
            Register today, submit your query, and receive guidance from a verified lawyer within 72 hours - free of charge.
          </p>
          <Link to="/register" id="footer-cta" className="btn-primary text-base px-10 py-3">
            Get Started - It's Free <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-xs text-gray-600 mt-4">{t('landing.disclaimer')}</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
