import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Scale } from 'lucide-react';

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer
      className="mt-auto"
      style={{ background: '#14213D', borderTop: '1px solid rgba(252,163,17,0.15)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-10">

          {/* Brand */}
          <div className="flex flex-col gap-4">
            <Link to="/" className="flex items-center gap-2 group w-fit">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #FCA311, #e5920f)', boxShadow: '0 4px 12px rgba(252,163,17,0.30)' }}
              >
                <Scale className="w-4 h-4 text-black" />
              </div>
              <span className="font-display font-bold text-lg text-white">LexAid</span>
            </Link>
            <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
              Free multilingual legal guidance for Sri Lankan citizens — in Sinhala, Tamil, and English.
            </p>
            {/* Amber accent line */}
            <div className="amber-line w-16" />
          </div>

          {/* Links */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#FCA311' }}>Platform</p>
            <Link to="/library"  className="text-sm text-gray-400 hover:text-white transition-colors">{t('nav.library')}</Link>
            <Link to="/register" className="text-sm text-gray-400 hover:text-white transition-colors">{t('nav.register')}</Link>
            <Link to="/login"    className="text-sm text-gray-400 hover:text-white transition-colors">{t('nav.login')}</Link>
          </div>

          {/* Legal Notice */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#FCA311' }}>Legal Notice</p>
            <p className="text-xs text-gray-500 leading-relaxed">{t('landing.disclaimer')}</p>
            <p className="text-xs text-gray-600">{t('landing.footer_disclaimer')}</p>
          </div>
        </div>

        <div
          className="mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2"
          style={{ borderTop: '1px solid rgba(252,163,17,0.10)' }}
        >
          <p className="text-xs text-gray-600">{t('landing.footer_rights')}</p>
          <p className="text-xs text-gray-700">
            Cardiff Metropolitan University · BSc (Hons) Software Engineering · CM6013
          </p>
        </div>
      </div>
    </footer>
  );
}
