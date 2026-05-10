import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import i18n from '../../i18n';

const LANGUAGES = [
  { code: 'en', label: 'English',  flag: '🇬🇧' },
  { code: 'si', label: 'සිංහල',   flag: '🇱🇰' },
  { code: 'ta', label: 'தமிழ்',   flag: '🇱🇰' },
];

export default function LanguageSwitcher() {
  const { i18n: i18nHook } = useTranslation();
  const current = LANGUAGES.find(l => l.code === i18nHook.language) || LANGUAGES[0];

  const change = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('lexaid_lang', code);
  };

  return (
    <div className="flex items-center gap-1 bg-white/8 rounded-xl p-1 border border-white/10">
      {LANGUAGES.map(lang => (
        <button
          key={lang.code}
          id={`lang-${lang.code}`}
          onClick={() => change(lang.code)}
          title={lang.label}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-200
            ${i18nHook.language === lang.code
              ? 'bg-brand-600 text-white shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-white/8'
            }`}
        >
          {lang.code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
