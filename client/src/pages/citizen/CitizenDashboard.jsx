import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import CitizenSidebar from '../../components/layout/CitizenSidebar';
import LanguageSwitcher from '../../components/layout/LanguageSwitcher';
import {
  PlusCircle, FolderOpen, Clock, CheckCircle2, Bell, Menu,
  TrendingUp, MessageSquare, Scale, ChevronRight, Landmark,
  Briefcase, ShoppingBag, Heart, Gavel, FileText
} from 'lucide-react';

const CATEGORY_ICONS = {
  land: Landmark, labour: Briefcase, consumer: ShoppingBag,
  family: Heart, criminal: Gavel, other: FileText,
};

const STATUS_BADGE = {
  submitted:    'badge-submitted',
  under_review: 'badge-review',
  assigned:     'badge-assigned',
  in_progress:  'badge-progress',
  resolved:     'badge-resolved',
  closed:       'badge-closed',
};

// Mock data for demo (replace with real API calls)
const MOCK_CASES = [
  { id: '1', ref: 'LX-2025-001', title: 'Land boundary dispute with neighbour', category: 'land', status: 'in_progress', created_at: '2025-11-10', updated_at: '2025-11-18' },
  { id: '2', ref: 'LX-2025-002', title: 'Unfair dismissal from employment', category: 'labour', status: 'assigned', created_at: '2025-11-12', updated_at: '2025-11-15' },
  { id: '3', ref: 'LX-2025-003', title: 'Consumer fraud - online purchase', category: 'consumer', status: 'submitted', created_at: '2025-11-19', updated_at: '2025-11-19' },
];

const MOCK_STATS = [
  { label: 'Total Cases',    value: '3', icon: FolderOpen,    color: 'text-brand-400',  bg: 'bg-brand-500/10' },
  { label: 'In Progress',    value: '1', icon: Clock,         color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  { label: 'Resolved',       value: '0', icon: CheckCircle2,  color: 'text-accent-400', bg: 'bg-accent-500/10' },
  { label: 'Unread Messages',value: '2', icon: MessageSquare, color: 'text-purple-400', bg: 'bg-purple-500/10' },
];

export default function CitizenDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [cases, setCases] = useState(MOCK_CASES);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Uncomment to use real API:
  // useEffect(() => {
  //   axios.get('/cases/my').then(r => setCases(r.data.cases)).catch(() => {});
  // }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-surface-900">
      {/* Desktop sidebar */}
      <div className="hidden lg:block flex-shrink-0">
        <CitizenSidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-50 w-72 animate-slide-up">
            <CitizenSidebar mobile onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-surface-900/80 backdrop-blur-md border-b border-white/8 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button id="citizen-mobile-menu" onClick={() => setSidebarOpen(true)} className="lg:hidden btn-ghost p-2">
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-white font-display">
                Good {getGreeting()}, {user?.full_name?.split(' ')[0]} 👋
              </h1>
              <p className="text-xs text-gray-500">Here's an overview of your legal cases</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link to="/citizen/cases/new" id="dash-new-case" className="btn-primary">
              <PlusCircle className="w-4 h-4" /> {t('nav.newCase')}
            </Link>
          </div>
        </div>

        <div className="p-6 max-w-5xl mx-auto space-y-8">

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
            {MOCK_STATS.map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="stat-card">
                <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-2`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <p className="text-2xl font-bold text-white font-display">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>

          {/* Cases list */}
          <div className="animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="section-title text-xl">{t('nav.cases')}</h2>
                <p className="section-subtitle">Your submitted legal queries</p>
              </div>
              <Link to="/citizen/cases/new" className="btn-ghost text-brand-400 hover:text-brand-300">
                <PlusCircle className="w-4 h-4" /> New Case
              </Link>
            </div>

            {cases.length === 0 ? (
              <div className="card text-center py-16">
                <Scale className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-2">{t('cases.no_cases')}</p>
                <Link to="/citizen/cases/new" className="btn-primary mt-2">
                  {t('cases.start_case')}
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {cases.map(c => {
                  const Icon = CATEGORY_ICONS[c.category] || FileText;
                  return (
                    <Link
                      key={c.id}
                      to={`/citizen/cases/${c.id}`}
                      id={`case-${c.id}`}
                      className="card-hover flex items-center gap-4"
                    >
                      <div className="w-10 h-10 rounded-xl bg-brand-600/15 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-brand-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-gray-500">{c.ref}</span>
                          <span className={`badge ${STATUS_BADGE[c.status]}`}>
                            {t(`cases.status_labels.${c.status}`)}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-white truncate">{c.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {t(`cases.categories.${c.category}`)} · Updated {c.updated_at}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-slide-up">
            <div className="card bg-gradient-to-br from-brand-600/15 to-purple-600/10 border-brand-500/20">
              <h3 className="text-sm font-semibold text-white mb-1">📚 Legal Resource Library</h3>
              <p className="text-xs text-gray-400 mb-4">Self-help guides on tenant rights, employment law, and more — in your language.</p>
              <Link to="/library" className="btn-ghost text-brand-400 text-xs px-0">Browse Articles <ChevronRight className="w-3.5 h-3.5" /></Link>
            </div>
            <div className="card bg-gradient-to-br from-accent-500/10 to-green-600/5 border-accent-500/20">
              <h3 className="text-sm font-semibold text-white mb-1">⚖️ About Legal Aid</h3>
              <p className="text-xs text-gray-400 mb-4">Understand your rights and how LexAid's volunteer lawyers can help you.</p>
              <Link to="/" className="btn-ghost text-accent-400 text-xs px-0">Learn More <ChevronRight className="w-3.5 h-3.5" /></Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
