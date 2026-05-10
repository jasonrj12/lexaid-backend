import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import {
  Scale, ArrowRight, Shield, Globe, Clock, Users,
  Landmark, Briefcase, ShoppingBag, Heart, Gavel, FileText,
  CheckCircle2, Star, ChevronRight, Sparkles
} from 'lucide-react';

const STATS = [
  { key: 'stats_cases',      value: '12,400+', icon: Scale },
  { key: 'stats_lawyers',    value: '340+',    icon: Users },
  { key: 'stats_resolution', value: '91%',     icon: CheckCircle2 },
  { key: 'stats_languages',  value: '3',       icon: Globe },
];

const CATEGORIES = [
  { key: 'land',     icon: Landmark,   color: 'from-blue-500/20 to-blue-600/10',    border: 'border-blue-500/20',   text: 'text-blue-400' },
  { key: 'labour',   icon: Briefcase,  color: 'from-purple-500/20 to-purple-600/10',border: 'border-purple-500/20', text: 'text-purple-400' },
  { key: 'consumer', icon: ShoppingBag,color: 'from-orange-500/20 to-orange-600/10',border: 'border-orange-500/20', text: 'text-orange-400' },
  { key: 'family',   icon: Heart,      color: 'from-pink-500/20 to-pink-600/10',    border: 'border-pink-500/20',   text: 'text-pink-400' },
  { key: 'criminal', icon: Gavel,      color: 'from-red-500/20 to-red-600/10',      border: 'border-red-500/20',    text: 'text-red-400' },
  { key: 'other',    icon: FileText,   color: 'from-accent-500/20 to-accent-600/10',border: 'border-accent-500/20', text: 'text-accent-400' },
];

const STEPS = ['how_step1', 'how_step2', 'how_step3', 'how_step4'];

export default function LandingPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        {/* Background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-accent-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '4s' }} />
        </div>

        {/* Grid overlay */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
          {/* Tag */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border-brand-500/30 text-brand-400 text-xs font-semibold mb-8 animate-fade-in">
            <Sparkles className="w-3.5 h-3.5" />
            {t('landing.hero_tag')}
          </div>

          {/* Title */}
          <h1 className="font-display font-extrabold text-5xl sm:text-6xl lg:text-7xl text-white mb-6 leading-tight animate-slide-up text-balance">
            {t('landing.hero_title').split('\n').map((line, i) => (
              <span key={i} className={i === 2 ? 'text-gradient' : ''}>
                {i > 0 && <br />}
                {line}
              </span>
            ))}
          </h1>

          {/* Subtitle */}
          <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
            {t('landing.hero_subtitle')}
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Link to="/register" id="hero-cta-citizen" className="btn-primary text-base px-8 py-3">
              {t('landing.cta_citizen')} <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/register?role=lawyer" id="hero-cta-lawyer" className="btn-secondary text-base px-8 py-3">
              {t('landing.cta_lawyer')}
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-6 mt-12 text-gray-500 text-xs font-medium animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-accent-500" /> NIC Verified</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-accent-500" /> SLBA Verified Lawyers</span>
            <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-accent-500" /> 3 Languages</span>
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-accent-500" /> 72h Response SLA</span>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-600 text-xs animate-bounce">
          <ChevronRight className="w-4 h-4 rotate-90" />
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────────────── */}
      <section className="py-16 border-y border-white/8 bg-surface-800/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {STATS.map(({ key, value, icon: Icon }) => (
              <div key={key} className="stat-card text-center items-center group hover:border-brand-500/30 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-brand-600/15 flex items-center justify-center mb-2 group-hover:bg-brand-600/25 transition-colors">
                  <Icon className="w-5 h-5 text-brand-400" />
                </div>
                <p className="text-3xl font-bold text-white font-display">{value}</p>
                <p className="text-xs text-gray-500 font-medium">{t(`landing.${key}`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────── */}
      <section className="py-24 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <h2 className="section-title text-4xl">{t('landing.how_title')}</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((step, idx) => (
            <div key={step} className="card relative overflow-hidden group hover:border-brand-500/30 transition-all duration-300 hover:-translate-y-1">
              <div className="absolute -top-6 -right-4 text-8xl font-black text-white/3 font-display select-none">
                {idx + 1}
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600/30 to-purple-600/20 flex items-center justify-center mb-4 text-brand-400 font-bold text-lg font-display border border-brand-500/20">
                {idx + 1}
              </div>
              <h3 className="text-base font-semibold text-white mb-2">{t(`landing.${step}_title`)}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{t(`landing.${step}_desc`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Legal Categories ─────────────────────────────────────── */}
      <section className="py-24 bg-surface-800/20 border-y border-white/8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="section-title text-4xl">{t('landing.categories_title')}</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {CATEGORIES.map(({ key, icon: Icon, color, border, text }) => (
              <Link
                key={key}
                to={`/register`}
                id={`cat-${key}`}
                className={`p-5 rounded-2xl bg-gradient-to-br ${color} border ${border} flex flex-col gap-3 group hover:scale-[1.02] transition-all duration-300 cursor-pointer`}
              >
                <Icon className={`w-6 h-6 ${text}`} />
                <span className={`text-sm font-semibold ${text}`}>{t(`cases.categories.${key}`)}</span>
                <ArrowRight className={`w-3.5 h-3.5 ${text} opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300`} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────── */}
      <section className="py-28 max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <div className="glass p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-600/10 to-purple-600/10 pointer-events-none" />
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-brand-600/10 rounded-full blur-3xl" />
          <Sparkles className="w-10 h-10 text-brand-400 mx-auto mb-4" />
          <h2 className="text-3xl sm:text-4xl font-bold text-white font-display mb-4">
            Access to justice <span className="text-gradient">starts here.</span>
          </h2>
          <p className="text-gray-400 max-w-lg mx-auto mb-8 text-base">
            Register today, submit your query, and receive guidance from a verified lawyer within 72 hours — free of charge.
          </p>
          <Link to="/register" id="footer-cta" className="btn-primary text-base px-10 py-3">
            Get Started — It's Free <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-xs text-gray-600 mt-4">{t('landing.disclaimer')}</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
