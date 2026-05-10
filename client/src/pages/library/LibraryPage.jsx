import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { Search, BookOpen, User, Calendar, ChevronRight, Landmark, Briefcase, ShoppingBag, Heart, Gavel, FileText } from 'lucide-react';

const ARTICLES = [
  { slug: 'tenant-rights-sri-lanka', title: 'Tenant Rights in Sri Lanka: A Complete Guide', category: 'land', author: 'K. Rajapaksa (Attorney-at-Law)', date: '2025-10-15', summary: 'Understand your rights as a tenant — security deposits, eviction procedures, rent increases, and repairs under Sri Lankan law.', readTime: '8 min' },
  { slug: 'wrongful-dismissal', title: 'Wrongful Dismissal: What Every Employee Should Know', category: 'labour', author: 'S. Balasingham (Attorney-at-Law)', date: '2025-10-22', summary: 'Your rights when facing termination — proper notice periods, entitlements, and how to file a complaint with the Labour Tribunal.', readTime: '6 min' },
  { slug: 'consumer-rights-caa', title: 'Consumer Rights Under the Consumer Affairs Authority Act', category: 'consumer', author: 'P. Seneviratne (Attorney-at-Law)', date: '2025-10-28', summary: 'How to file complaints, seek refunds, and enforce your consumer rights through the CAA and small claims procedures.', readTime: '5 min' },
  { slug: 'divorce-maintenance', title: 'Divorce and Maintenance: Legal Options in Sri Lanka', category: 'family', author: 'A. Fernando (Attorney-at-Law)', date: '2025-11-02', summary: 'Understanding the grounds for divorce, maintenance obligations, child custody, and how the District Court handles matrimonial cases.', readTime: '9 min' },
  { slug: 'land-boundary-disputes', title: 'Resolving Land Boundary Disputes', category: 'land', author: 'K. Rajapaksa (Attorney-at-Law)', date: '2025-11-08', summary: 'Step-by-step guide to resolving boundary disputes through the Land Disputes Settlement Board and District Court.', readTime: '7 min' },
  { slug: 'police-rights', title: 'Your Rights When Dealing with Police', category: 'criminal', author: 'M. Mendis (Attorney-at-Law)', date: '2025-11-12', summary: 'What you can and cannot be compelled to do, right to legal counsel, bail procedures, and fundamental rights protections.', readTime: '6 min' },
];

const CAT_ICONS = { land: Landmark, labour: Briefcase, consumer: ShoppingBag, family: Heart, criminal: Gavel, other: FileText };
const CAT_COLORS = {
  land:     'bg-blue-500/15 text-blue-400 border-blue-500/30',
  labour:   'bg-purple-500/15 text-purple-400 border-purple-500/30',
  consumer: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  family:   'bg-pink-500/15 text-pink-400 border-pink-500/30',
  criminal: 'bg-red-500/15 text-red-400 border-red-500/30',
  other:    'bg-accent-500/15 text-accent-400 border-accent-500/30',
};

export default function LibraryPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');

  const filtered = ARTICLES.filter(a => {
    const matchCat = catFilter === 'all' || a.category === catFilter;
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase()) || a.summary.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20">
        {/* Header */}
        <div className="bg-surface-800/50 border-b border-white/8 py-12">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-6 h-6 text-brand-400" />
              <h1 className="section-title text-3xl">{t('library.title')}</h1>
            </div>
            <p className="text-gray-400 mb-6">{t('library.subtitle')}</p>

            {/* Search + filter */}
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input id="library-search" type="text" value={search} onChange={e => setSearch(e.target.value)}
                  className="input pl-9" placeholder={t('library.search')} />
              </div>
              <div className="flex gap-2 flex-wrap">
                {['all','land','labour','consumer','family','criminal','other'].map(cat => (
                  <button key={cat} id={`lib-filter-${cat}`} onClick={() => setCatFilter(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${catFilter === cat ? 'bg-brand-600 text-white' : 'bg-surface-700/50 text-gray-400 border border-white/8 hover:text-white'}`}>
                    {cat === 'all' ? 'All' : t(`cases.categories.${cat}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Articles grid */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
          <p className="text-xs text-gray-500 mb-6">{filtered.length} article{filtered.length !== 1 ? 's' : ''}</p>
          {filtered.length === 0 ? (
            <div className="card text-center py-16">
              <BookOpen className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">{t('library.no_results')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filtered.map(a => {
                const Icon = CAT_ICONS[a.category] || FileText;
                return (
                  <Link key={a.slug} to={`/library/${a.slug}`} id={`article-${a.slug}`} className="card-hover flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className={`badge border ${CAT_COLORS[a.category]}`}>
                        <Icon className="w-3 h-3" /> {t(`cases.categories.${a.category}`)}
                      </span>
                      <span className="text-xs text-gray-600">{a.readTime} read</span>
                    </div>
                    <h3 className="text-base font-semibold text-white leading-snug">{a.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed flex-1">{a.summary}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-white/8">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <User className="w-3 h-3" /> {a.author}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-brand-400">
                        {t('library.read_more')} <ChevronRight className="w-3 h-3" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
