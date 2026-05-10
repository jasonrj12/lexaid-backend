import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import LawyerSidebar from '../../components/layout/LawyerSidebar';
import LanguageSwitcher from '../../components/layout/LanguageSwitcher';
import { Menu, FolderOpen, Clock, CheckCircle2, Star, TrendingUp, ChevronRight, FileText, Landmark, Briefcase, ShoppingBag, Heart, Gavel, Bell, Loader2 } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const STATUS_BADGE = { submitted:'badge-submitted', under_review:'badge-review', assigned:'badge-assigned', in_progress:'badge-progress', resolved:'badge-resolved', closed:'badge-closed' };
const CAT_ICONS = { land: Landmark, labour: Briefcase, consumer: ShoppingBag, family: Heart, criminal: Gavel, other: FileText };

export default function LawyerDashboard() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('lexaid_token');
    axios.get(`${API}/cases/my`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(r => setCases(r.data.cases))
    .catch(() => {})
    .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-surface-900">
      <div className="hidden lg:block flex-shrink-0"><LawyerSidebar /></div>
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-50 w-72"><LawyerSidebar mobile onClose={() => setSidebarOpen(false)} /></div>
        </div>
      )}
      <main className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-30 bg-surface-900/80 backdrop-blur-md border-b border-white/8 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden btn-ghost p-2"><Menu className="w-5 h-5" /></button>
            <div>
              <h1 className="text-lg font-bold text-white font-display">Lawyer Dashboard</h1>
              <p className="text-xs text-gray-500">Welcome back, {user?.full_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link to="/lawyer/open" id="browse-open-cases" className="btn-accent"><FolderOpen className="w-4 h-4" /> Browse Open Cases</Link>
          </div>
        </div>

        <div className="p-6 max-w-5xl mx-auto space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
            {[
              { label: 'Total Cases',   value: cases.length,  icon: FolderOpen,    color: 'text-brand-400',  bg: 'bg-brand-500/10' },
              { label: 'Active Cases',  value: cases.filter(c => ['assigned','in_progress'].includes(c.status)).length,   icon: Clock,        color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
              { label: 'Resolved',      value: cases.filter(c => c.status === 'resolved').length, icon: CheckCircle2, color: 'text-accent-400',  bg: 'bg-accent-500/10' },
              { label: 'Avg Rating',    value: user?.avg_rating || 'N/A', icon: Star,         color: 'text-gold-400',   bg: 'bg-yellow-500/10' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="stat-card">
                <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-2`}><Icon className={`w-4 h-4 ${color}`} /></div>
                <p className="text-2xl font-bold text-white font-display">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>

          {/* My active cases */}
          <div className="animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title text-xl">My Active Cases</h2>
              <Link to="/lawyer/open" className="btn-ghost text-accent-400 text-sm">Browse all open cases <ChevronRight className="w-3.5 h-3.5" /></Link>
            </div>

            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-brand-400 animate-spin" /></div>
            ) : cases.length === 0 ? (
              <div className="card text-center py-12 text-gray-500">
                <p>You haven't accepted any cases yet.</p>
                <Link to="/lawyer/open" className="text-accent-400 hover:underline text-sm mt-2 block">Browse open cases</Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {cases.map(c => {
                  const Icon = CAT_ICONS[c.category] || FileText;
                  return (
                    <Link key={c.id} to={`/lawyer/cases/${c.id}`} id={`lawyer-case-${c.id}`} className="card-hover flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-accent-500/15 flex items-center justify-center flex-shrink-0"><Icon className="w-5 h-5 text-accent-400" /></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-gray-500">{c.ref}</span>
                          <span className={`badge ${STATUS_BADGE[c.status]}`}>{c.status.replace('_', ' ')}</span>
                        </div>
                        <p className="text-sm font-semibold text-white truncate">{c.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Citizen: {c.citizen_name} · Updated {new Date(c.updated_at).toLocaleDateString()}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
