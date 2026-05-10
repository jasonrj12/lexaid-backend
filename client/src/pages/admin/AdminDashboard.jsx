import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import AdminSidebar from '../../components/layout/AdminSidebar';
import LanguageSwitcher from '../../components/layout/LanguageSwitcher';
import {
  Menu, Users, FolderOpen, CheckCircle2, Clock, AlertOctagon,
  BadgeCheck, TrendingUp, Eye, Check, X as XIcon, Ban, RefreshCw,
  BarChart3, Globe, ChevronRight, Loader2, ShieldCheck, UserX, UserCheck
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function authHeader() {
  const token = localStorage.getItem('lexaid_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── Overview Section ────────────────────────────────────────────────────────
function Overview() {
  const [stats, setStats] = useState(null);
  const [overdue, setOverdue] = useState([]);
  const [langs, setLangs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sRes, oRes, lRes] = await Promise.all([
          axios.get(`${API}/admin/stats`, { headers: authHeader() }),
          axios.get(`${API}/admin/overdue-cases`, { headers: authHeader() }),
          axios.get(`${API}/admin/lang-stats`, { headers: authHeader() }),
        ]);
        setStats(sRes.data);
        setOverdue(oRes.data.cases);
        setLangs(lRes.data.stats);
      } catch (err) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-brand-400 animate-spin" /></div>;

  const cards = [
    { label: 'Total Users',     value: stats?.total_users || 0,     icon: Users,         color: 'text-brand-400',  bg: 'bg-brand-500/10' },
    { label: 'Active Cases',    value: stats?.active_cases || 0,    icon: FolderOpen,    color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { label: 'Pending Lawyers', value: stats?.pending_lawyers || 0, icon: BadgeCheck,    color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Overdue Cases',   value: stats?.overdue_cases || 0,   icon: AlertOctagon,  color: 'text-red-400',    bg: 'bg-red-500/10' },
  ];

  const LANG_MAP = { en: 'English', si: 'Sinhala', ta: 'Tamil' };
  const totalLangUsers = langs.reduce((acc, curr) => acc + parseInt(curr.count), 0);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="stat-card">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-2`}><Icon className={`w-4 h-4 ${color}`} /></div>
            <p className="text-2xl font-bold text-white font-display">{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="section-title text-base mb-4 flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-red-400" /> Overdue Cases (SLA Breach)
          </h2>
          <div className="flex flex-col gap-3">
            {overdue.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">No cases currently breaching SLA.</p>
            ) : overdue.map(c => (
              <div key={c.ref} className="flex items-center justify-between p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                <div className="min-w-0">
                  <p className="text-xs font-mono text-gray-500">{c.ref}</p>
                  <p className="text-sm font-semibold text-white truncate">{c.title}</p>
                  <p className="text-[10px] text-red-400 mt-0.5">{Math.floor(c.hours_since_creation)}h since creation</p>
                </div>
                <Link to={`/admin/cases/${c.ref}`} className="btn-secondary text-[10px] py-1 px-2">View</Link>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="section-title text-base mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-brand-400" /> Language Distribution
          </h2>
          <div className="space-y-4">
            {langs.map(l => {
              const pct = totalLangUsers > 0 ? Math.round((parseInt(l.count) / totalLangUsers) * 100) : 0;
              return (
                <div key={l.preferred_lang}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">{LANG_MAP[l.preferred_lang] || l.preferred_lang}</span>
                    <span className="text-white font-medium">{pct}% ({l.count})</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-600 overflow-hidden">
                    <div className="h-full bg-brand-500 transition-all duration-1000" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Lawyer Verification Section ───────────────────────────────────────────
function LawyerVerif() {
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await axios.get(`${API}/admin/pending-lawyers`, { headers: authHeader() });
      setLawyers(data.lawyers);
    } catch { toast.error('Failed to load pending lawyers'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleAction = async (id, action) => {
    try {
      await axios.patch(`${API}/admin/lawyers/${id}/${action}`, {}, { headers: authHeader() });
      toast.success(`Lawyer ${action}ed`);
      setLawyers(p => p.filter(l => l.id !== id));
    } catch { toast.error(`Failed to ${action} lawyer`); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-brand-400 animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <h2 className="section-title text-xl">Lawyer Verification Queue</h2>
        <span className="badge badge-review">{lawyers.length} awaiting review</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {lawyers.length === 0 ? (
          <div className="card col-span-full py-12 text-center text-gray-500">
            <CheckCircle2 className="w-12 h-12 text-accent-500/20 mx-auto mb-4" />
            <p>Verification queue is empty.</p>
          </div>
        ) : lawyers.map(l => (
          <div key={l.id} className="card border-white/5 hover:border-brand-500/30 transition-colors">
            <div className="flex justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-white">{l.full_name}</h3>
                <p className="text-xs text-gray-500">{l.email}</p>
              </div>
              <span className="text-[10px] font-mono text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-md border border-brand-500/20">{l.slba_number}</span>
            </div>
            <div className="flex flex-wrap gap-1 mb-4">
              {(l.specialisations || []).map(s => <span key={s} className="badge badge-progress text-[10px]">{s}</span>)}
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleAction(l.id, 'approve')} className="btn-accent flex-1 text-xs py-2">Approve</button>
              <button onClick={() => handleAction(l.id, 'reject')} className="btn-danger flex-1 text-xs py-2">Reject</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── User Management Section ───────────────────────────────────────────────
function UsersList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await axios.get(`${API}/admin/users`, { headers: authHeader() });
      setUsers(data.users);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const toggleStatus = async (user) => {
    const action = user.status === 'suspended' ? 'reactivate' : 'suspend';
    try {
      await axios.patch(`${API}/admin/users/${user.id}/${action}`, {}, { headers: authHeader() });
      toast.success(`User ${action}d`);
      load();
    } catch { toast.error(`Failed to ${action} user`); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-brand-400 animate-spin" /></div>;

  return (
    <div className="card animate-slide-up">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-xs text-gray-500 border-b border-white/8">
              <th className="pb-3 px-2 font-medium">Name</th>
              <th className="pb-3 px-2 font-medium">Email</th>
              <th className="pb-3 px-2 font-medium">Role</th>
              <th className="pb-3 px-2 font-medium">Status</th>
              <th className="pb-3 px-2 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map(u => (
              <tr key={u.id} className="text-sm">
                <td className="py-3 px-2 text-white font-medium">{u.full_name}</td>
                <td className="py-3 px-2 text-gray-400">{u.email}</td>
                <td className="py-3 px-2"><span className="badge badge-progress capitalize">{u.role}</span></td>
                <td className="py-3 px-2">
                  <span className={`badge ${u.status === 'active' ? 'badge-resolved' : u.status === 'pending' ? 'badge-review' : 'badge-danger'}`}>
                    {u.status}
                  </span>
                </td>
                <td className="py-3 px-2 text-right">
                  <button onClick={() => toggleStatus(u)} className={`btn-ghost p-1.5 ${u.status === 'suspended' ? 'text-green-400' : 'text-red-400'}`}>
                    {u.status === 'suspended' ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Cases Management Section ──────────────────────────────────────────────
function CasesList() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await axios.get(`${API}/cases`, { headers: authHeader() });
        setCases(data.cases);
      } catch { toast.error('Failed to load cases'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-brand-400 animate-spin" /></div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up">
      {cases.map(c => (
        <div key={c.id} className="card flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono text-gray-500">{c.ref}</span>
              <span className="badge badge-progress text-[10px] capitalize">{c.status.replace('_',' ')}</span>
            </div>
            <h3 className="text-sm font-semibold text-white truncate">{c.title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">Citizen: {c.citizen_name}</p>
          </div>
          <Link to={`/admin/cases/${c.id}`} className="btn-secondary text-xs px-3 py-1.5"><Eye className="w-3.5 h-3.5" /> View</Link>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const { section = 'overview' } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-surface-900">
      <div className="hidden lg:block flex-shrink-0"><AdminSidebar /></div>
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-50 w-72 animate-slide-up">
            <AdminSidebar mobile onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}
      <main className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-30 bg-surface-900/80 backdrop-blur-md border-b border-white/8 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden btn-ghost p-2"><Menu className="w-5 h-5" /></button>
            <div>
              <h1 className="text-lg font-bold text-white font-display">Admin Control Center</h1>
              <p className="text-xs text-gray-500 capitalize">{section.replace('-',' ')}</p>
            </div>
          </div>
          <LanguageSwitcher />
        </div>

        <div className="p-6 max-w-5xl mx-auto">
          {section === 'overview' && <Overview />}
          {section === 'lawyers'  && <LawyerVerif />}
          {section === 'users'    && <UsersList />}
          {section === 'cases'    && <CasesList />}
          
          {/* Fallback for sections not yet fully implemented */}
          {!['overview', 'lawyers', 'users', 'cases'].includes(section) && (
            <div className="card py-20 text-center">
              <ShieldCheck className="w-16 h-16 text-brand-400/20 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Section Under Development</h2>
              <p className="text-gray-500 max-w-sm mx-auto">The {section} module is being connected to the secure LexAid backend. Please check back shortly.</p>
              <Link to="/admin" className="btn-primary mt-6">Return to Overview</Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
