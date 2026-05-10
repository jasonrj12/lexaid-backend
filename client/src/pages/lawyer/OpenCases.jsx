import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import LawyerSidebar from '../../components/layout/LawyerSidebar';
import { Menu, Search, Filter, ChevronRight, FileText, Landmark, Briefcase, ShoppingBag, Heart, Gavel, User, Clock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const CAT_ICONS = { land: Landmark, labour: Briefcase, consumer: ShoppingBag, family: Heart, criminal: Gavel, other: FileText };
const STATUS_BADGE = { submitted:'badge-submitted', under_review:'badge-review' };

export default function OpenCases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchCases();
  }, [catFilter, search]);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('lexaid_token');
      const params = {};
      if (catFilter !== 'all') params.category = catFilter;
      if (search) params.search = search;
      
      const { data } = await axios.get(`${API}/cases/open`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setCases(data.cases);
    } catch (err) {
      toast.error('Failed to load open cases');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (c) => {
    if (!window.confirm(`Accept case ${c.ref}? You will be assigned as the volunteer lawyer.`)) return;
    try {
      const token = localStorage.getItem('lexaid_token');
      await axios.patch(`${API}/cases/${c.id}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Case ${c.ref} accepted!`);
      fetchCases();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to accept case');
    }
  };

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
        <div className="sticky top-0 z-30 bg-surface-900/80 backdrop-blur-md border-b border-white/8 px-6 py-4">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden btn-ghost p-2"><Menu className="w-5 h-5" /></button>
            <div>
              <h1 className="text-lg font-bold text-white font-display">Open Cases</h1>
              <p className="text-xs text-gray-500">Cases awaiting a volunteer lawyer</p>
            </div>
          </div>
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input id="open-cases-search" type="text" value={search} onChange={e => setSearch(e.target.value)}
                className="input pl-9" placeholder="Search cases…" />
            </div>
            <select id="cat-filter" value={catFilter} onChange={e => setCatFilter(e.target.value)} className="input w-auto">
              <option value="all">All Categories</option>
              {['land','labour','consumer','family','criminal','other'].map(c => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-6 max-w-5xl mx-auto">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-brand-400 animate-spin" /></div>
          ) : (
            <>
              <p className="text-xs text-gray-500 mb-4">{cases.length} case{cases.length !== 1 ? 's' : ''} found</p>
              <div className="flex flex-col gap-4">
                {cases.map(c => {
                  const Icon = CAT_ICONS[c.category] || FileText;
                  return (
                    <div key={c.id} id={`open-case-${c.id}`} className="card hover:border-accent-500/30 transition-all duration-300">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-accent-500/15 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-accent-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-xs font-mono text-gray-500">{c.ref}</span>
                            <span className={`badge ${STATUS_BADGE[c.status]}`}>{c.status.replace('_',' ')}</span>
                          </div>
                          <h3 className="text-base font-semibold text-white mb-2">{c.title}</h3>
                          <p className="text-sm text-gray-400 leading-relaxed line-clamp-2">{c.description}</p>
                          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Submitted {new Date(c.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <Link to={`/lawyer/cases/${c.id}`} id={`view-case-${c.id}`} className="btn-secondary text-xs px-4 py-2 text-center">View Details</Link>
                          <button id={`accept-case-${c.id}`} onClick={() => handleAccept(c)} className="btn-accent text-xs px-4 py-2">Accept Case</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {cases.length === 0 && (
                  <div className="card text-center py-12">
                    <Search className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No cases match your search.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
