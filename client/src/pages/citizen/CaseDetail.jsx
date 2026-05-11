import { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import toast from 'react-hot-toast';
import CitizenSidebar from '../../components/layout/CitizenSidebar';
import {
  ArrowLeft, Send, FileText, AlertTriangle, Clock, User,
  CheckCircle2, Star, Sparkles, Loader2, RotateCcw, X
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const STATUS_STEPS = ['submitted','under_review','assigned','in_progress','resolved','closed'];

function authHeader() {
  const token = localStorage.getItem('lexaid_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── Rating Modal ─────────────────────────────────────────────────────────────
function RatingModal({ caseId, onDone, onClose }) {
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (rating === 0) { toast.error('Please select a star rating'); return; }
    setLoading(true);
    try {
      await axios.patch(`${API}/cases/${caseId}/rate`, { rating, comment }, { headers: authHeader() });
      toast.success('Thank you for your feedback!');
      onDone();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit rating');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="card max-w-md w-full animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white font-display">Rate Your Experience</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
        </div>
        <p className="text-sm text-gray-400 mb-4">How helpful was the legal guidance you received?</p>

        {/* Stars */}
        <div className="flex gap-2 mb-4" id="rating-stars">
          {[1,2,3,4,5].map(n => (
            <button
              key={n}
              type="button"
              id={`star-${n}`}
              className="transition-transform hover:scale-110"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHovered(n)}
              onMouseLeave={() => setHovered(0)}
            >
              <Star className={`w-8 h-8 transition-colors ${n <= (hovered || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`} />
            </button>
          ))}
        </div>

        <textarea
          id="rating-comment"
          rows={3}
          value={comment}
          onChange={e => setComment(e.target.value)}
          className="input resize-none mb-4"
          placeholder="Optional: Any comments about the guidance received?"
        />

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Skip</button>
          <button id="submit-rating-btn" onClick={submit} disabled={loading || rating === 0} className="btn-primary flex-1">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Rating'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Plain Language Simplifier Button (§4.8.2) ────────────────────────────────
function SimplifyButton({ text, lang, messageId }) {
  const [simplified, setSimplified] = useState(null);
  const [showSimplified, setShowSimplified] = useState(false);
  const [loading, setLoading] = useState(false);

  const simplify = async () => {
    if (simplified) { setShowSimplified(true); return; }
    setLoading(true);
    try {
      const { data } = await axios.post(
        `${API}/ai/simplify`,
        { text, lang: lang || 'en' },
        { headers: authHeader() }
      );
      setSimplified(data.simplified);
      setShowSimplified(true);
    } catch (err) {
      const msg = err.response?.data?.message || 'Simplification unavailable. Please read the original response.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {showSimplified && simplified ? (
        <div className="mt-3 p-3 rounded-xl bg-accent-500/10 border border-accent-500/20 text-xs text-gray-300 leading-relaxed">
          <div className="flex items-center gap-1.5 mb-2 text-accent-400 font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> Plain language version
          </div>
          <p className="whitespace-pre-wrap">{simplified}</p>
          <button onClick={() => setShowSimplified(false)} className="mt-2 flex items-center gap-1 text-gray-500 hover:text-gray-300 text-xs transition-colors">
            <RotateCcw className="w-3 h-3" /> Show original
          </button>
        </div>
      ) : (
        <button
          id={`simplify-${messageId}`}
          onClick={simplify}
          disabled={loading}
          className="mt-2 flex items-center gap-1.5 text-xs text-accent-400 hover:text-accent-300 disabled:opacity-50 transition-colors"
        >
          {loading
            ? <><Loader2 className="w-3 h-3 animate-spin" /> Simplifying…</>
            : <><Sparkles className="w-3 h-3" /> Simplify in plain language</>}
        </button>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function CaseDetail() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const threadRef = useRef(null);

  // Fetch case + messages
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

  // Auto-scroll thread
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
      setMessages(p => [...p, { ...data.message, sender_role: 'citizen', sender_name: 'You' }]);
      setMessage('');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Message failed to send');
    } finally {
      setSending(false);
    }
  };

  const closeCase = async () => {
    if (!window.confirm('Close this case? This action cannot be undone.')) return;
    setClosing(true);
    try {
      await axios.patch(`${API}/cases/${id}/close`, {}, { headers: authHeader() });
      toast.success('Case closed.');
      // Prompt for rating if not already rated
      if (!caseData?.rating) setShowRating(true);
      else navigate('/citizen');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not close case');
    } finally {
      setClosing(false);
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
        <Link to="/citizen" className="btn-primary">Back to Dashboard</Link>
      </div>
    </div>
  );

  const currentStep = STATUS_STEPS.indexOf(caseData.status);
  const lang = i18n.language?.slice(0,2) || 'en';

  return (
    <div className="flex h-screen overflow-hidden bg-surface-900">
      <div className="hidden lg:block flex-shrink-0"><CitizenSidebar /></div>
      {showRating && (
        <RatingModal
          caseId={id}
          onDone={() => { setShowRating(false); navigate('/citizen'); }}
          onClose={() => { setShowRating(false); navigate('/citizen'); }}
        />
      )}
      <main className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-30 bg-surface-900/80 backdrop-blur-md border-b border-white/8 px-6 py-4 flex items-center gap-3">
          <Link to="/citizen" className="btn-ghost p-2"><ArrowLeft className="w-4 h-4" /></Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-white font-display truncate">{caseData.title}</h1>
            <p className="text-xs text-gray-500 font-mono">{caseData.ref}</p>
          </div>
          {caseData.status === 'resolved' && (
            <button id="close-case-btn" onClick={closeCase} disabled={closing} className="btn-accent text-xs">
              {closing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Close Case</>}
            </button>
          )}
        </div>

        <div className="p-6 max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Info panel */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            {/* Status tracker */}
            <div className="card">
              <h3 className="text-sm font-semibold text-white mb-4">Case Progress</h3>
              <div className="flex flex-col gap-1">
                {STATUS_STEPS.map((s, i) => (
                  <div key={s} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold
                      ${i < currentStep ? 'bg-accent-500 text-white' :
                        i === currentStep ? 'bg-brand-600 text-white ring-4 ring-brand-500/20' :
                        'bg-surface-600 text-gray-500'}`}>
                      {i < currentStep ? '✓' : i + 1}
                    </div>
                    <div className="flex-1">
                      <p className={`text-xs font-medium ${i <= currentStep ? 'text-white' : 'text-gray-500'}`}>
                        {t(`cases.status_labels.${s}`)}
                      </p>
                    </div>
                    {i === currentStep && <div className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Case info */}
            <div className="card flex flex-col gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Category</p>
                <p className="text-white font-medium">{t(`cases.categories.${caseData.category}`)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Assigned Lawyer</p>
                <p className="text-white font-medium flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-brand-400" />
                  {caseData.lawyer_name || t('cases.unassigned')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Submitted</p>
                <p className="text-gray-300">{new Date(caseData.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Last Updated</p>
                <p className="text-gray-300">{new Date(caseData.updated_at).toLocaleDateString()}</p>
              </div>
              {caseData.rating && (
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Your Rating</p>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(n => (
                      <Star key={n} className={`w-4 h-4 ${n <= caseData.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="card">
              <p className="text-xs text-gray-500 mb-2">Case Description</p>
              <p className="text-sm text-gray-300 leading-relaxed">{caseData.description}</p>
            </div>

            {/* Rate case prompt if resolved and unrated */}
            {['resolved','closed'].includes(caseData.status) && !caseData.rating && (
              <button id="rate-case-btn" onClick={() => setShowRating(true)} className="btn-secondary text-xs">
                <Star className="w-4 h-4 text-yellow-400" /> Rate this case
              </button>
            )}
          </div>

          {/* Message thread */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="card flex-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">{t('messages.title')}</h3>
                <span className="badge badge-progress">{messages.length} messages</span>
              </div>

              <div className="alert-warning rounded-xl mb-4 flex gap-2 text-xs">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-yellow-400" />
                {t('messages.disclaimer')}
              </div>

              <div ref={threadRef} className="thread-scroll h-80 flex flex-col gap-4 pr-1">
                {messages.length === 0 && (
                  <p className="text-gray-600 text-sm text-center py-8">{t('messages.no_messages')}</p>
                )}
                {messages.map(m => {
                  const isCitizen = m.sender_role === 'citizen';
                  return (
                    <div key={m.id} className={`flex ${isCitizen ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        isCitizen
                          ? 'bg-brand-600/30 border border-brand-500/30 rounded-br-sm'
                          : 'bg-surface-700/60 border border-white/8 rounded-bl-sm'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-semibold ${isCitizen ? 'text-brand-400' : 'text-accent-400'}`}>
                            {m.sender_name || (isCitizen ? 'You' : 'Lawyer')}
                          </span>
                          <span className="text-xs text-gray-600">
                            {new Date(m.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-200 leading-relaxed">{m.body}</p>
                        {/* §4.8.2 — Simplify button on lawyer messages */}
                        {!isCitizen && (
                          <SimplifyButton text={m.body} lang={lang} messageId={m.id} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {caseData.status !== 'closed' ? (
                <div className="mt-4 flex gap-3">
                  <textarea
                    id="message-input"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
                    rows={2}
                    className="input resize-none flex-1"
                    placeholder={t('messages.placeholder')}
                  />
                  <button id="send-message-btn" onClick={sendMessage} disabled={!message.trim() || sending} className="btn-primary px-4">
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              ) : (
                <div className="mt-4 p-3 rounded-xl bg-surface-700/30 border border-white/8 text-xs text-gray-500 text-center">
                  This case is closed. Messaging is disabled.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
