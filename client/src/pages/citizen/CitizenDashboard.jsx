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

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
  { label: 'Total Cases',     value: '3', icon: FolderOpen,    color: '#FCA311',  bg: 'rgba(252,163,17,0.12)' },
  { label: 'In Progress',     value: '1', icon: Clock,         color: '#fbbf24',  bg: 'rgba(251,191,36,0.12)' },
  { label: 'Resolved',        value: '0', icon: CheckCircle2,  color: '#86efac',  bg: 'rgba(134,239,172,0.12)' },
  { label: 'Unread Messages', value: '2', icon: MessageSquare, color: '#c084fc',  bg: 'rgba(192,132,252,0.12)' },
];

export default function CitizenDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [cases, setCases] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Use real API:
  useEffect(() => {
    setLoading(true);
    const token = localStorage.getItem('lexaid_token');
    axios.get(`${API}/cases/my`, { 
      headers: { Authorization: `Bearer ${token}` } 
    })
    .then(r => setCases(r.data.cases))
    .catch(() => {})
    .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#000000' }}>
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
        <div className="sticky top-0 z-30 backdrop-blur-md px-4 sm:px-6 py-4 flex items-center justify-between"
          style={{ background: 'rgba(20,33,61,0.90)', borderBottom: '1px solid rgba(252,163,17,0.12)' }}>
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 animate-fade-in">
            {[
              { label: 'Total Cases',     value: cases.length, icon: FolderOpen,    color: '#FCA311',  bg: 'rgba(252,163,17,0.12)' },
              { label: 'In Progress',     value: cases.filter(c => ['assigned','in_progress'].includes(c.status)).length, icon: Clock,         color: '#fbbf24',  bg: 'rgba(251,191,36,0.12)' },
              { label: 'Resolved',        value: cases.filter(c => ['resolved','closed'].includes(c.status)).length, icon: CheckCircle2,  color: '#86efac',  bg: 'rgba(134,239,172,0.12)' },
              { label: 'Notifications',   value: '0', icon: Bell, color: '#c084fc',  bg: 'rgba(192,132,252,0.12)' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="stat-card">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2 flex-shrink-0" style={{ background: bg }}>
                  <Icon className="w-4 h-4" style={{ color }} />
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
              <Link to="/citizen/cases/new" className="btn-ghost text-xs" style={{ color: '#FCA311' }}>
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
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(252,163,17,0.12)' }}>
                        <Icon className="w-5 h-5" style={{ color: '#FCA311' }} />
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
            <div className="card" style={{ background: 'rgba(252,163,17,0.08)', border: '1px solid rgba(252,163,17,0.20)' }}>
              <h3 className="text-sm font-semibold text-white mb-1">📚 Legal Resource Library</h3>
              <p className="text-xs text-gray-400 mb-4">Self-help guides on tenant rights, employment law, and more — in your language.</p>
              <Link to="/library" className="btn-ghost text-xs px-0" style={{ color: '#FCA311' }}>Browse Articles <ChevronRight className="w-3.5 h-3.5" /></Link>
            </div>
            <div className="card" style={{ background: 'rgba(20,33,61,0.50)', border: '1px solid rgba(252,163,17,0.15)' }}>
              <h3 className="text-sm font-semibold text-white mb-1">⚖️ About Legal Aid</h3>
              <p className="text-xs text-gray-400 mb-4">Understand your rights and how LexAid's volunteer lawyers can help you.</p>
              <Link to="/" className="btn-ghost text-xs px-0" style={{ color: '#FCA311' }}>Learn More <ChevronRight className="w-3.5 h-3.5" /></Link>
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
