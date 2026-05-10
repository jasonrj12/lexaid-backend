import { useState } from 'react';
import { useParams } from 'react-router-dom';
import AdminSidebar from '../../components/layout/AdminSidebar';
import LanguageSwitcher from '../../components/layout/LanguageSwitcher';
import {
  Menu, Users, FolderOpen, CheckCircle2, Clock, AlertOctagon,
  BadgeCheck, TrendingUp, Eye, Check, X as XIcon, Ban, RefreshCw,
  BarChart3, Globe, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const PENDING_LAWYERS = [
  { id: 'l1', name: 'Priya Rajapaksa', email: 'priya.r@example.com', slba: 'SLBA/2017/0892', specs: ['Family Law', 'Labour & Employment'], submitted: '2025-11-18' },
  { id: 'l2', name: 'Suresh Balasingham', email: 'suresh.b@example.com', slba: 'SLBA/2020/1245', specs: ['Land & Property', 'Criminal Guidance'], submitted: '2025-11-19' },
];
const OVERDUE_CASES = [
  { ref: 'LX-2025-009', title: 'Employment contract breach', hours: 96, status: 'under_review' },
  { ref: 'LX-2025-012', title: 'Consumer rights violation', hours: 78, status: 'assigned' },
];
const PLATFORM_STATS = [
  { label: 'Total Users',     value: '1,240', icon: Users,         color: 'text-brand-400',  bg: 'bg-brand-500/10' },
  { label: 'Active Cases',    value: '87',    icon: FolderOpen,    color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  { label: 'Resolved (30d)', value: '312',   icon: CheckCircle2,  color: 'text-accent-400', bg: 'bg-accent-500/10' },
  { label: 'Pending Review',  value: '2',     icon: Clock,         color: 'text-purple-400', bg: 'bg-purple-500/10' },
];
const LANG_DIST = [
  { lang: 'English', pct: 52, color: 'bg-brand-500' },
  { lang: 'Sinhala', pct: 35, color: 'bg-accent-500' },
  { lang: 'Tamil',   pct: 13, color: 'bg-purple-500' },
];

export default function AdminDashboard() {
  const { section } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingLawyers, setPendingLawyers] = useState(PENDING_LAWYERS);

  const approve = (id) => { setPendingLawyers(p => p.filter(l => l.id !== id)); toast.success('Lawyer account approved and activated.'); };
  const reject  = (id) => { setPendingLawyers(p => p.filter(l => l.id !== id)); toast.error('Lawyer account rejected.'); };

  return (
    <div className="flex h-screen overflow-hidden bg-surface-900">
      <div className="hidden lg:block flex-shrink-0"><AdminSidebar /></div>
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-50 w-72"><AdminSidebar mobile onClose={() => setSidebarOpen(false)} /></div>
        </div>
      )}
      <main className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-30 bg-surface-900/80 backdrop-blur-md border-b border-white/8 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden btn-ghost p-2"><Menu className="w-5 h-5" /></button>
            <div>
              <h1 className="text-lg font-bold text-white font-display">Admin Dashboard</h1>
              <p className="text-xs text-gray-500">Platform governance &amp; oversight</p>
            </div>
          </div>
          <LanguageSwitcher />
        </div>

        <div className="p-6 max-w-5xl mx-auto space-y-8">

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
            {PLATFORM_STATS.map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="stat-card">
                <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-2`}><Icon className={`w-4 h-4 ${color}`} /></div>
                <p className="text-2xl font-bold text-white font-display">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Pending lawyer verifications */}
            <div className="animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <h2 className="section-title text-xl">Pending Lawyer Verifications</h2>
                {pendingLawyers.length > 0 && (
                  <span className="badge badge-review">{pendingLawyers.length} pending</span>
                )}
              </div>
              <div className="flex flex-col gap-3">
                {pendingLawyers.length === 0 ? (
                  <div className="card text-center py-8">
                    <CheckCircle2 className="w-8 h-8 text-accent-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">All lawyer verifications complete</p>
                  </div>
                ) : pendingLawyers.map(l => (
                  <div key={l.id} id={`lawyer-verify-${l.id}`} className="card">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{l.name}</p>
                        <p className="text-xs text-gray-500">{l.email}</p>
                        <p className="text-xs text-brand-400 font-mono mt-1">{l.slba}</p>
                      </div>
                      <span className="badge badge-review">Pending</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {l.specs.map(s => <span key={s} className="badge badge-progress text-xs">{s}</span>)}
                    </div>
                    <p className="text-xs text-gray-600 mb-3">Submitted: {l.submitted}</p>
                    <div className="flex gap-2">
                      <button id={`approve-${l.id}`} onClick={() => approve(l.id)} className="btn-accent flex-1 text-xs py-2">
                        <Check className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button id={`reject-${l.id}`} onClick={() => reject(l.id)} className="btn-danger flex-1 text-xs py-2">
                        <XIcon className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Overdue cases */}
            <div className="animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <h2 className="section-title text-xl">Overdue Cases</h2>
                <span className="badge badge-review">&gt; 72h SLA</span>
              </div>
              <div className="flex flex-col gap-3">
                {OVERDUE_CASES.map(c => (
                  <div key={c.ref} id={`overdue-${c.ref}`} className="card border-red-500/20 bg-red-500/5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-mono text-gray-500">{c.ref}</p>
                        <p className="text-sm font-semibold text-white mt-0.5">{c.title}</p>
                        <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                          <AlertOctagon className="w-3 h-3" /> {c.hours}h since last update
                        </p>
                      </div>
                      <button className="btn-secondary text-xs py-1.5 px-3"><Eye className="w-3 h-3" /> View</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Language distribution */}
              <div className="card mt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="w-4 h-4 text-brand-400" />
                  <h3 className="text-sm font-semibold text-white">Language Distribution</h3>
                </div>
                <div className="flex flex-col gap-3">
                  {LANG_DIST.map(({ lang, pct, color }) => (
                    <div key={lang}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">{lang}</span>
                        <span className="text-gray-400">{pct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-surface-600">
                        <div className={`h-2 rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
