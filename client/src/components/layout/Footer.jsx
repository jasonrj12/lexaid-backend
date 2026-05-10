import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Scale, ExternalLink } from 'lucide-react';

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-white/8 bg-surface-800/50 backdrop-blur-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

          {/* Brand */}
          <div className="flex flex-col gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center">
                <Scale className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-lg text-white">LexAid</span>
            </Link>
            <p className="text-sm text-gray-400 max-w-xs">
              Free multilingual legal guidance for Sri Lankan citizens — in Sinhala, Tamil, and English.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Platform</p>
            <Link to="/library"  className="text-sm text-gray-400 hover:text-white transition-colors">{t('nav.library')}</Link>
            <Link to="/register" className="text-sm text-gray-400 hover:text-white transition-colors">{t('nav.register')}</Link>
            <Link to="/login"    className="text-sm text-gray-400 hover:text-white transition-colors">{t('nav.login')}</Link>
          </div>

          {/* Disclaimer */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Legal Notice</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              {t('landing.disclaimer')}
            </p>
            <p className="text-xs text-gray-600">{t('landing.footer_disclaimer')}</p>
          </div>
        </div>

        <div className="divider mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-xs text-gray-600">{t('landing.footer_rights')}</p>
          <p className="text-xs text-gray-700">
            Cardiff Metropolitan University · BSc (Hons) Software Engineering · CM6013
          </p>
        </div>
      </div>
    </footer>
  );
}
