import { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import AdminSidebar from '../../components/layout/AdminSidebar';
import {
  ArrowLeft, FileText, AlertTriangle, Clock, User,
  CheckCircle2, Star, Shield, Scale, Gavel, Landmark,
  Briefcase, ShoppingBag, Heart, Loader2
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const CATEGORY_ICONS = {
  land: Landmark, labour: Briefcase, consumer: ShoppingBag,
  family: Heart, criminal: Gavel, other: FileText,
};

function authHeader() {
  const token = localStorage.getItem('lexaid_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function AdminCaseDetail() {
  const { id } = useParams();
  const [caseData, setCaseData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [activeLawyers, setActiveLawyers] = useState([]);
  const [assigning, setAssigning] = useState(false);
  const [selectedLawyer, setSelectedLawyer] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [caseRes, msgRes, lawyerRes] = await Promise.all([
        axios.get(`${API}/cases/${id}`, { headers: authHeader() }),
        axios.get(`${API}/messages/${id}`, { headers: authHeader() }),
        axios.get(`${API}/admin/active-lawyers`, { headers: authHeader() }),
      ]);
      setCaseData(caseRes.data.case);
      setMessages(msgRes.data.messages);
      setActiveLawyers(lawyerRes.data.lawyers);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not load case');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [id]);

  const handleAssign = async () => {
    if (!selectedLawyer) return;
    setAssigning(true);
    try {
      await axios.patch(`${API}/admin/cases/${id}/assign`, { lawyer_id: selectedLawyer }, { headers: authHeader() });
      toast.success('Lawyer assigned successfully');
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Assignment failed');
    } finally {
      setAssigning(false);
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-surface-900">
      <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
    </div>
  );

  if (!caseData) return (
    <div className="flex h-screen items-center justify-center bg-surface-900">
      <div className="text-center">
        <p className="text-white font-semibold mb-2">Case not found</p>
        <Link to="/admin/cases" className="btn-primary">Back to Cases</Link>
      </div>
    </div>
  );

  const Icon = CATEGORY_ICONS[caseData.category] || FileText;

  return (
    <div className="flex h-screen overflow-hidden bg-surface-900">
      <div className="hidden lg:block flex-shrink-0"><AdminSidebar /></div>
      <main className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-30 bg-surface-900/80 backdrop-blur-md border-b border-white/8 px-6 py-4 flex items-center gap-3">
          <Link to="/admin/cases" className="btn-ghost p-2"><ArrowLeft className="w-4 h-4" /></Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white font-display truncate">{caseData.title}</h1>
              <span className="badge badge-review">Admin View</span>
            </div>
            <p className="text-xs text-gray-500 font-mono">{caseData.ref}</p>
          </div>
        </div>

        <div className="p-6 max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-brand-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Case Description</h3>
                  <p className="text-xs text-gray-500 capitalize">{caseData.category} Case</p>
                </div>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{caseData.description}</p>
            </div>

            <div className="card">
              <h3 className="text-sm font-bold text-white mb-4">Communication History</h3>
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <p className="text-center py-8 text-sm text-gray-500">No messages exchanged yet.</p>
                ) : messages.map(m => (
                  <div key={m.id} className={`flex ${m.sender_role === 'citizen' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[85%] rounded-xl p-3 border ${
                      m.sender_role === 'citizen' ? 'bg-surface-800 border-white/5' : 'bg-brand-500/5 border-brand-500/20'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold uppercase ${m.sender_role === 'citizen' ? 'text-brand-400' : 'text-accent-400'}`}>
                          {m.sender_name || m.sender_role}
                        </span>
                        <span className="text-[10px] text-gray-600">{new Date(m.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-gray-300">{m.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-sm font-bold text-white mb-4">Case Lifecycle</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Status</span>
                  <span className="badge badge-progress capitalize">{caseData.status.replace('_',' ')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Citizen</span>
                  <span className="text-xs text-white font-medium">{caseData.citizen_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Assigned Lawyer</span>
                  <span className="text-xs text-brand-400 font-medium">{caseData.lawyer_name || 'Unassigned'}</span>
                </div>
                <div className="pt-2 border-t border-white/5">
                  <p className="text-[10px] text-gray-600 mb-1">SLA Deadline</p>
                  <p className={`text-xs font-medium ${new Date(caseData.sla_deadline) < new Date() ? 'text-red-400' : 'text-gray-400'}`}>
                    {new Date(caseData.sla_deadline).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {!caseData.lawyer_id && (
              <div className="card border-brand-500/20 bg-brand-500/5">
                <h3 className="text-sm font-bold text-brand-400 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" /> Assign Volunteer Lawyer
                </h3>
                <div className="space-y-3">
                  <select
                    value={selectedLawyer}
                    onChange={e => setSelectedLawyer(e.target.value)}
                    className="input text-xs"
                  >
                    <option value="">Select a lawyer…</option>
                    {activeLawyers.map(l => (
                      <option key={l.id} value={l.id}>{l.full_name} ({l.specialisations.join(', ')})</option>
                    ))}
                  </select>
                  <button
                    onClick={handleAssign}
                    disabled={!selectedLawyer || assigning}
                    className="btn-primary w-full text-xs py-2"
                  >
                    {assigning ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : 'Confirm Assignment'}
                  </button>
                </div>
              </div>
            )}

            <div className="card bg-red-500/5 border-red-500/10">
              <h3 className="text-sm font-bold text-red-400 mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4" /> Administrative Actions
              </h3>
              <p className="text-xs text-gray-500 mb-4">Admins can oversee case progress but should only intervene in case of disputes or SLA breaches.</p>
              <button className="btn-danger w-full text-xs py-2 opacity-50 cursor-not-allowed" disabled>
                Flag for Review
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
