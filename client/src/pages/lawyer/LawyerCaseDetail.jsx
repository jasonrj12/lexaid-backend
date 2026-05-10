import { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import LawyerSidebar from '../../components/layout/LawyerSidebar';
import { ArrowLeft, Send, CheckCircle2, AlertTriangle, User, Loader2, Sparkles, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const STATUS_STEPS = ['submitted','under_review','assigned','in_progress','resolved','closed'];

function authHeader() {
  const token = localStorage.getItem('lexaid_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * §4.8.2 — Plain Language Simplifier
 * Visible to lawyers so they can preview how their own response will appear
 * in simplified form for the citizen.
 */
function SimplifyPreview({ text, messageId }) {
  const [simplified, setSimplified] = useState(null);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const simplify = async () => {
    if (simplified) { setShow(true); return; }
    setLoading(true);
    try {
      const { data } = await axios.post(
        `${API}/ai/simplify`,
        { text, lang: 'en' },
        { headers: authHeader() }
      );
      setSimplified(data.simplified);
      setShow(true);
    } catch {
      toast.error('Preview unavailable. Citizen can still simplify from their view.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {show && simplified ? (
        <div className="mt-2 p-2.5 rounded-lg bg-brand-500/10 border border-brand-500/20 text-xs text-gray-300 leading-relaxed">
          <div className="flex items-center gap-1 mb-1 text-brand-400 font-medium">
            <Sparkles className="w-3 h-3" /> Citizen plain-language preview
          </div>
          <p className="whitespace-pre-wrap">{simplified}</p>
          <button onClick={() => setShow(false)} className="mt-1 flex items-center gap-1 text-gray-500 hover:text-gray-300 text-xs">
            <RotateCcw className="w-3 h-3" /> Hide
          </button>
        </div>
      ) : (
        <button
          id={`simplify-preview-${messageId}`}
          onClick={simplify}
          disabled={loading}
          className="mt-1.5 flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 disabled:opacity-50 transition-colors"
        >
          {loading
            ? <><Loader2 className="w-3 h-3 animate-spin" /> Generating…</>
            : <><Sparkles className="w-3 h-3" /> Preview citizen plain-language view</>}
        </button>
      )}
    </div>
  );
}

export default function LawyerCaseDetail() {
  const { id } = useParams();
  const [caseData, setCaseData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [loading, setLoading] = useState(true);
  const threadRef = useRef(null);

  const loadData = async () => {
    try {
      const [caseRes, msgRes] = await Promise.all([
        axios.get(`${API}/cases/${id}`, { headers: authHeader() }),
        axios.get(`${API}/messages/${id}`, { headers: authHeader() }),
      ]);
      setCaseData(caseRes.data.case);
      setMessages(msgRes.data.messages);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not load case');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [id]);

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      const { data } = await axios.post(
        `${API}/messages/${id}`,
        { body: message },
        { headers: authHeader() }
      );
      setMessages(p => [...p, { ...data.message, sender_role: 'lawyer', sender_name: 'You (Lawyer)' }]);
      setMessage('');
      toast.success('Message sent');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const markResolved = async () => {
    setResolving(true);
    try {
      await axios.patch(`${API}/cases/${id}/resolve`, {}, { headers: authHeader() });
      setCaseData(c => ({ ...c, status: 'resolved' }));
      toast.success('Case marked as resolved. The citizen has been notified.');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to resolve case');
    } finally {
      setResolving(false);
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-surface-900">
      <Loader2 className="w-8 h-8 text-accent-400 animate-spin" />
    </div>
  );

  if (!caseData) return (
    <div className="flex h-screen items-center justify-center bg-surface-900">
      <div className="text-center">
        <p className="text-white font-semibold mb-2">Case not found</p>
        <Link to="/lawyer" className="btn-accent">Back to Dashboard</Link>
      </div>
    </div>
  );

  const currentStep = STATUS_STEPS.indexOf(caseData.status);

  return (
    <div className="flex h-screen overflow-hidden bg-surface-900">
      <div className="hidden lg:block flex-shrink-0"><LawyerSidebar /></div>
      <main className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-30 bg-surface-900/80 backdrop-blur-md border-b border-white/8 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/lawyer" className="btn-ghost p-2"><ArrowLeft className="w-4 h-4" /></Link>
            <div>
              <h1 className="text-lg font-bold text-white font-display truncate">{caseData.title}</h1>
              <p className="text-xs text-gray-500 font-mono">{caseData.ref}</p>
            </div>
          </div>
          {!['resolved','closed'].includes(caseData.status) && (
            <button id="mark-resolved-btn" onClick={markResolved} disabled={resolving} className="btn-accent">
              {resolving
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <><CheckCircle2 className="w-4 h-4" /> Mark Resolved</>
              }
            </button>
          )}
        </div>

        <div className="p-6 max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Case info panel */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            <div className="card flex flex-col gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Citizen</p>
                <p className="text-white font-medium flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-brand-400" />
                  {caseData.citizen_name}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Category</p>
                <p className="text-white font-medium capitalize">{caseData.category}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Submitted</p>
                <p className="text-gray-300">{new Date(caseData.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">SLA Deadline</p>
                <p className={`text-sm font-medium ${caseData.sla_deadline && new Date(caseData.sla_deadline) < new Date() ? 'text-red-400' : 'text-gray-300'}`}>
                  {caseData.sla_deadline ? new Date(caseData.sla_deadline).toLocaleString() : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Current Status</p>
                <span className={`badge badge-${caseData.status === 'resolved' ? 'resolved' : 'review'}`}>
                  {caseData.status.replace('_', ' ')}
                </span>
              </div>
              {caseData.rating && (
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Citizen Rating</p>
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-400 font-bold">{caseData.rating}/5</span>
                    <span className="text-yellow-400">{'★'.repeat(caseData.rating)}</span>
                  </div>
                  {caseData.rating_comment && (
                    <p className="text-xs text-gray-400 mt-1 italic">"{caseData.rating_comment}"</p>
                  )}
                </div>
              )}
            </div>

            <div className="card">
              <p className="text-xs text-gray-500 mb-2">Case Description</p>
              <p className="text-sm text-gray-300 leading-relaxed">{caseData.description}</p>
            </div>

            {/* Status tracker */}
            <div className="card">
              <h3 className="text-sm font-semibold text-white mb-3">Case Progress</h3>
              <div className="flex flex-col gap-1">
                {STATUS_STEPS.map((s, i) => (
                  <div key={s} className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold
                      ${i < currentStep ? 'bg-accent-500 text-white' :
                        i === currentStep ? 'bg-brand-600 text-white' :
                        'bg-surface-600 text-gray-500'}`}>
                      {i < currentStep ? '✓' : i + 1}
                    </div>
                    <p className={`text-xs ${i <= currentStep ? 'text-white' : 'text-gray-600'}`}>
                      {s.replace('_', ' ')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Message thread */}
          <div className="lg:col-span-2">
            <div className="card">
              <h3 className="text-sm font-semibold text-white mb-4">Case Communication</h3>
              <div className="alert-warning rounded-xl mb-4 flex gap-2 text-xs">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-yellow-400" />
                Remind citizens that your guidance is informal and does not constitute formal legal advice. The platform automatically provides a "Simplify" button for citizens to understand your responses.
              </div>
              <div ref={threadRef} className="thread-scroll h-72 flex flex-col gap-4 mb-4">
                {messages.length === 0 ? (
                  <p className="text-gray-600 text-sm text-center py-8">No messages yet. Start by introducing yourself and asking clarifying questions.</p>
                ) : messages.map(m => {
                  const isLawyer = m.sender_role === 'lawyer';
                  return (
                    <div key={m.id} className={`flex ${isLawyer ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${isLawyer ? 'bg-accent-500/20 border border-accent-500/30 rounded-br-sm' : 'bg-surface-700/60 border border-white/8 rounded-bl-sm'}`}>
                        <p className={`text-xs font-semibold mb-1 ${isLawyer ? 'text-accent-400' : 'text-brand-400'}`}>
                          {m.sender_name || (isLawyer ? 'You (Lawyer)' : 'Citizen')}
                        </p>
                        <p className="text-sm text-gray-200 leading-relaxed">{m.body}</p>
                        <p className="text-xs text-gray-600 mt-1">{new Date(m.created_at).toLocaleString()}</p>
                        {/* Lawyer can preview how their own response looks simplified */}
                        {isLawyer && <SimplifyPreview text={m.body} messageId={m.id} />}
                      </div>
                    </div>
                  );
                })}
              </div>
              {!['resolved','closed'].includes(caseData.status) ? (
                <div className="flex gap-3">
                  <textarea
                    id="lawyer-message-input"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
                    rows={2}
                    className="input resize-none flex-1"
                    placeholder="Provide your legal guidance…"
                  />
                  <button id="lawyer-send-btn" onClick={sendMessage} disabled={!message.trim() || sending} className="btn-accent px-4">
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-surface-700/30 border border-white/8 text-xs text-gray-500 text-center">
                  This case is {caseData.status}. Messaging is disabled.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
