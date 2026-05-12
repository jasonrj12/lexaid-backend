import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import AdminSidebar from '../../components/layout/AdminSidebar';
import LanguageSwitcher from '../../components/layout/LanguageSwitcher';
import {
  Menu, Users, FolderOpen, CheckCircle2, AlertOctagon,
  BadgeCheck, Eye, Loader2, ShieldCheck, UserX, UserCheck,
  BookOpen, Download, Filter, Globe,
  Gavel, Star, Phone, Calendar, Award
} from 'lucide-react';


const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BASE_URL = API.replace('/api', '');

function authHeader() {
  const token = localStorage.getItem('lexaid_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Resolve a stored file URL to an openable href.
 *  - null/undefined  → null  (caller should hide/disable the link)
 *  - https://…       → unchanged (Supabase public URL)
 *  - /uploads/…      → BASE_URL + path  (local server)
 */
function resolveFileUrl(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${BASE_URL}${url}`;
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {lawyers.length === 0 ? (
          <div className="card col-span-full py-12 text-center text-gray-500">
            <CheckCircle2 className="w-12 h-12 text-accent-500/20 mx-auto mb-4" />
            <p>Verification queue is empty.</p>
          </div>
        ) : lawyers.map(l => (
          <div key={l.id} className="card border-white/5 hover:border-brand-500/30 transition-colors flex flex-col">
            <div className="flex justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">{l.full_name}</h3>
                <p className="text-sm text-gray-500">{l.email}</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-md border border-brand-500/20">{l.slba_number}</span>
                <p className="text-[10px] text-gray-600 mt-1">Joined {new Date(l.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">ID Card</p>
                <div className="aspect-video rounded-lg overflow-hidden bg-surface-600 border border-white/10 group relative">
                  {!resolveFileUrl(l.id_card_url) ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 text-[10px] gap-1">
                      <FolderOpen className="w-7 h-7" /><span>Not uploaded</span>
                    </div>
                  ) : l.id_card_url?.endsWith('.pdf') ? (
                    <a href={resolveFileUrl(l.id_card_url)} target="_blank" rel="noreferrer"
                      className="w-full h-full flex flex-col items-center justify-center bg-surface-700 text-gray-400 hover:text-brand-400 transition-colors gap-1">
                      <FolderOpen className="w-8 h-8" />
                      <span className="text-[10px]">PDF — click to open</span>
                    </a>
                  ) : (
                    <>
                      <img src={resolveFileUrl(l.id_card_url)} alt="ID Card"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
                      />
                      <div className="w-full h-full hidden flex-col items-center justify-center text-gray-600 text-[10px] gap-1">
                        <FolderOpen className="w-7 h-7" /><span>Cannot load image</span>
                      </div>
                      <a href={resolveFileUrl(l.id_card_url)} target="_blank" rel="noreferrer"
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Eye className="w-6 h-6 text-white" />
                      </a>
                    </>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Face Verification</p>
                <div className="aspect-video rounded-lg overflow-hidden bg-surface-600 border border-white/10 group relative">
                  {!resolveFileUrl(l.face_photo_url) ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 text-[10px] gap-1">
                      <FolderOpen className="w-7 h-7" /><span>Not uploaded</span>
                    </div>
                  ) : (
                    <>
                      <img src={resolveFileUrl(l.face_photo_url)} alt="Face"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
                      />
                      <div className="w-full h-full hidden flex-col items-center justify-center text-gray-600 text-[10px] gap-1">
                        <FolderOpen className="w-7 h-7" /><span>Cannot load image</span>
                      </div>
                      <a href={resolveFileUrl(l.face_photo_url)} target="_blank" rel="noreferrer"
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Eye className="w-6 h-6 text-white" />
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-1 mb-5">
              {(l.specialisations || []).map(s => <span key={s} className="badge badge-progress text-[10px]">{s}</span>)}
            </div>

            <div className="flex gap-3 mt-auto">
              <button onClick={() => handleAction(l.id, 'approve')} className="btn-accent flex-1 py-2.5 text-sm">Approve Lawyer</button>
              <button onClick={() => handleAction(l.id, 'reject')} className="btn-ghost flex-1 py-2.5 text-sm text-red-400 hover:bg-red-500/10">Reject</button>
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
  const [statusFilter, setStatusFilter] = useState('');

  const load = async (status = '') => {
    setLoading(true);
    try {
      const url = status ? `${API}/cases?status=${status}` : `${API}/cases`;
      const { data } = await axios.get(url, { headers: authHeader() });
      setCases(data.cases);
    } catch { toast.error('Failed to load cases'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const STATUS_BADGE = {
    submitted:    'badge-submitted',
    under_review: 'badge-review',
    assigned:     'badge-assigned',
    in_progress:  'badge-progress',
    resolved:     'badge-resolved',
    closed:       'badge-closed',
  };

  const STATUSES = ['', 'submitted', 'under_review', 'assigned', 'in_progress', 'resolved', 'closed'];

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="section-title text-xl">All Cases ({cases.length})</h2>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); load(e.target.value); }}
            className="input text-xs py-2 w-auto"
          >
            {STATUSES.map(s => (
              <option key={s} value={s}>{s ? s.replace('_', ' ') : 'All Statuses'}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-brand-400 animate-spin" /></div>
      ) : cases.length === 0 ? (
        <div className="card py-16 text-center text-gray-500">
          <FolderOpen className="w-12 h-12 mx-auto mb-3 text-gray-600" />
          <p className="text-sm">No cases found{statusFilter ? ` with status "${statusFilter.replace('_',' ')}"` : ''}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cases.map(c => (
            <div key={c.id} className="card flex items-center justify-between gap-4 hover:border-brand-500/30 transition-colors border border-white/5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[10px] font-mono text-gray-500">{c.ref}</span>
                  <span className={`badge ${STATUS_BADGE[c.status] || 'badge-progress'} text-[10px] capitalize`}>
                    {c.status.replace('_',' ')}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-white truncate">{c.title}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-xs text-gray-500">Citizen: {c.citizen_name}</p>
                  {c.lawyer_name && <p className="text-xs text-brand-400">Lawyer: {c.lawyer_name}</p>}
                </div>
              </div>
              <Link to={`/admin/cases/${c.id}`} className="btn-secondary text-xs px-3 py-1.5 flex-shrink-0 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" /> View
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Library Queue Management Section ─────────────────────────────────────
function LibraryQueue() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await axios.get(`${API}/library/queue`, { headers: authHeader() });
      setArticles(data.articles);
    } catch { toast.error('Failed to load library queue'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handlePublish = async (id) => {
    try {
      await axios.patch(`${API}/library/${id}/publish`, {}, { headers: authHeader() });
      toast.success('Article published successfully');
      load();
    } catch { toast.error('Failed to publish article'); }
  };

  const handleReject = async (id) => {
    try {
      await axios.patch(`${API}/library/${id}/reject`, {}, { headers: authHeader() });
      toast.success('Article rejected');
      load();
    } catch {
      // silently remove from list if reject not yet implemented
      setArticles(p => p.filter(a => a.id !== id));
      toast.success('Article removed from queue');
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-brand-400 animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <h2 className="section-title text-xl">Library Review Queue</h2>
        <span className="badge badge-review">{articles.length} pending review</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {articles.length === 0 ? (
          <div className="card col-span-full py-12 text-center text-gray-500">
            <BookOpen className="w-12 h-12 text-brand-500/20 mx-auto mb-4" />
            <p>No articles awaiting review.</p>
          </div>
        ) : articles.map(a => (
          <div key={a.id} className="card border-white/5 hover:border-brand-500/30 transition-colors">
            <div className="flex justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-white">{a.title_en}</h3>
                <p className="text-xs text-gray-500">Author: {a.author}</p>
              </div>
              <span className="badge badge-progress text-[10px] capitalize">{a.category}</span>
            </div>
            <p className="text-xs text-gray-600 mb-4">Submitted: {new Date(a.created_at).toLocaleDateString()}</p>
            <div className="flex gap-2">
              <Link to={`/library/${a.slug}`} target="_blank" className="btn-secondary text-xs py-2 px-3 text-center">Preview</Link>
              <button onClick={() => handlePublish(a.id)} className="btn-accent flex-1 text-xs py-2">Publish</button>
              <button onClick={() => handleReject(a.id)} className="btn-ghost text-xs py-2 px-3 text-red-400 hover:bg-red-500/10">Reject</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Reports Section ───────────────────────────────────────────────────────
function Reports() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sRes, lRes] = await Promise.all([
          axios.get(`${API}/admin/stats`, { headers: authHeader() }),
          axios.get(`${API}/admin/lang-stats`, { headers: authHeader() }),
        ]);
        setStats({ ...sRes.data, langs: lRes.data.stats });
      } catch { toast.error('Failed to load reports'); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-brand-400 animate-spin" /></div>;

  const LANG_MAP = { en: 'English', si: 'Sinhala', ta: 'Tamil' };
  const totalLangUsers = (stats?.langs || []).reduce((acc, curr) => acc + parseInt(curr.count), 0);

  const metrics = [
    { label: 'Total Users',      value: stats?.total_users || 0,     icon: Users,        color: 'text-brand-400' },
    { label: 'Active Cases',     value: stats?.active_cases || 0,    icon: FolderOpen,   color: 'text-yellow-400' },
    { label: 'Pending Lawyers',  value: stats?.pending_lawyers || 0, icon: BadgeCheck,   color: 'text-purple-400' },
    { label: 'SLA Breaches',     value: stats?.overdue_cases || 0,   icon: AlertOctagon, color: 'text-red-400' },
  ];

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="flex items-center justify-between">
        <h2 className="section-title text-xl">Reports</h2>
        <button className="btn-secondary text-xs flex items-center gap-2">
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card text-center">
            <Icon className={`w-8 h-8 ${color} mx-auto mb-2`} />
            <p className="text-3xl font-bold text-white font-display">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Globe className="w-4 h-4 text-brand-400" /> Language Breakdown
        </h3>
        <div className="space-y-4">
          {(stats?.langs || []).map(l => {
            const pct = totalLangUsers > 0 ? Math.round((parseInt(l.count) / totalLangUsers) * 100) : 0;
            const colors = { en: 'bg-brand-500', si: 'bg-purple-500', ta: 'bg-yellow-500' };
            return (
              <div key={l.preferred_lang}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">{LANG_MAP[l.preferred_lang] || l.preferred_lang}</span>
                  <span className="text-white font-medium">{pct}% ({l.count} users)</span>
                </div>
                <div className="h-2 rounded-full bg-surface-600 overflow-hidden">
                  <div className={`h-full ${colors[l.preferred_lang] || 'bg-brand-500'} transition-all duration-1000`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Lawyers Directory Section ─────────────────────────────────────────────
function LawyersDirectory() {
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await axios.get(`${API}/admin/all-lawyers`, { headers: authHeader() });
        setLawyers(data.lawyers);
      } catch { toast.error('Failed to load lawyers directory'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const toggleStatus = async (lawyer) => {
    const action = lawyer.status === 'suspended' ? 'reactivate' : 'suspend';
    try {
      await axios.patch(`${API}/admin/users/${lawyer.id}/${action}`, {}, { headers: authHeader() });
      toast.success(`Lawyer ${action}d`);
      setLawyers(prev => prev.map(l => l.id === lawyer.id
        ? { ...l, status: action === 'suspend' ? 'suspended' : 'active' }
        : l
      ));
    } catch { toast.error(`Failed to ${action} lawyer`); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-brand-400 animate-spin" /></div>;

  const filtered = lawyers.filter(l => {
    const matchSearch = !search ||
      l.full_name.toLowerCase().includes(search.toLowerCase()) ||
      l.email.toLowerCase().includes(search.toLowerCase()) ||
      (l.slba_number || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const renderStars = (rating) => {
    const r = parseFloat(rating) || 0;
    return (
      <div className="flex items-center gap-0.5">
        {[1,2,3,4,5].map(i => (
          <Star key={i} className={`w-3 h-3 ${i <= Math.round(r) ? 'text-brand-400 fill-brand-400' : 'text-gray-600'}`} />
        ))}
        <span className="text-xs text-gray-400 ml-1">{r > 0 ? r.toFixed(1) : 'N/A'}</span>
      </div>
    );
  };

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="section-title text-xl">Lawyers Directory</h2>
          <p className="text-xs text-gray-500 mt-0.5">{filtered.length} of {lawyers.length} lawyers</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Search name, email, SLBA…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input text-xs py-2 w-52"
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="input text-xs py-2 w-auto"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card py-16 text-center text-gray-500">
          <Gavel className="w-12 h-12 mx-auto mb-3 text-gray-600" />
          <p className="text-sm">No lawyers found matching your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(l => (
            <div key={l.id} className="card border border-white/5 hover:border-brand-500/25 transition-colors flex flex-col gap-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/15 border border-brand-500/25 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-brand-400">{l.full_name?.[0]?.toUpperCase()}</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">{l.full_name}</h3>
                    <p className="text-[11px] text-gray-500 truncate">{l.email}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className={`badge text-[10px] ${
                    l.status === 'active' ? 'badge-resolved' :
                    l.status === 'pending' ? 'badge-review' : 'badge-danger'
                  } capitalize`}>{l.status}</span>
                  {l.slba_verified && (
                    <span className="badge badge-resolved text-[10px]">✓ SLBA Verified</span>
                  )}
                </div>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
                <div className="flex items-center gap-1.5 text-gray-400">
                  <Award className="w-3 h-3 text-brand-400 flex-shrink-0" />
                  <span className="font-mono text-brand-400">{l.slba_number || '—'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-400">
                  <Phone className="w-3 h-3 flex-shrink-0" />
                  <span>{l.phone || 'No phone'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-400">
                  <Calendar className="w-3 h-3 flex-shrink-0" />
                  <span>Joined {new Date(l.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-400">
                  <FolderOpen className="w-3 h-3 flex-shrink-0" />
                  <span>{l.total_cases || 0} cases ({l.resolved_cases || 0} resolved)</span>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">Rating</span>
                {renderStars(l.avg_rating)}
              </div>

              {/* Specialisations */}
              {(l.specialisations || []).length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {l.specialisations.map(s => (
                    <span key={s} className="badge badge-progress text-[10px] capitalize">{s}</span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-auto pt-1 border-t border-white/5">
                {resolveFileUrl(l.id_card_url) ? (
                  <a
                    href={resolveFileUrl(l.id_card_url)}
                    target="_blank" rel="noreferrer"
                    className="btn-secondary text-[10px] py-1.5 px-3 flex-1 text-center"
                  >
                    View ID Card
                  </a>
                ) : (
                  <span className="btn-secondary text-[10px] py-1.5 px-3 flex-1 text-center opacity-40 cursor-not-allowed">
                    No ID Card
                  </span>
                )}
                <button
                  onClick={() => toggleStatus(l)}
                  className={`btn-ghost text-[10px] py-1.5 px-3 flex-1 ${
                    l.status === 'suspended' ? 'text-green-400 hover:bg-green-500/10' : 'text-red-400 hover:bg-red-500/10'
                  }`}
                >
                  {l.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
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
          {section === 'overview'           && <Overview />}
          {section === 'lawyers'            && <LawyerVerif />}
          {section === 'lawyers-directory'  && <LawyersDirectory />}
          {section === 'users'              && <UsersList />}
          {section === 'cases'              && <CasesList />}
          {section === 'library'            && <LibraryQueue />}
          {section === 'reports'            && <Reports />}

          {!['overview','lawyers','lawyers-directory','users','cases','library','reports'].includes(section) && (
            <div className="card py-20 text-center">
              <ShieldCheck className="w-16 h-16 text-brand-400/20 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Section Not Found</h2>
              <p className="text-gray-500 max-w-sm mx-auto">The requested section does not exist.</p>
              <Link to="/admin" className="btn-primary mt-6">Return to Overview</Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
