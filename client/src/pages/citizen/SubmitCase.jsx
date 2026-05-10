import { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import axios from 'axios';
import CitizenSidebar from '../../components/layout/CitizenSidebar';
import {
  ArrowLeft, Upload, X, Landmark, Briefcase, ShoppingBag,
  Heart, Gavel, FileText, AlertTriangle, Send, Sparkles, Loader2
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const CATEGORIES = [
  { key: 'land',     icon: Landmark,    color: 'border-blue-500/40 bg-blue-500/10',    active: 'border-blue-500 bg-blue-500/20 text-blue-300' },
  { key: 'labour',   icon: Briefcase,   color: 'border-purple-500/40 bg-purple-500/10', active: 'border-purple-500 bg-purple-500/20 text-purple-300' },
  { key: 'consumer', icon: ShoppingBag, color: 'border-orange-500/40 bg-orange-500/10', active: 'border-orange-500 bg-orange-500/20 text-orange-300' },
  { key: 'family',   icon: Heart,       color: 'border-pink-500/40 bg-pink-500/10',    active: 'border-pink-500 bg-pink-500/20 text-pink-300' },
  { key: 'criminal', icon: Gavel,       color: 'border-red-500/40 bg-red-500/10',      active: 'border-red-500 bg-red-500/20 text-red-300' },
  { key: 'other',    icon: FileText,    color: 'border-accent-500/40 bg-accent-500/10', active: 'border-accent-500 bg-accent-500/20 text-accent-300' },
];

export default function SubmitCase() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiSuggesting, setAiSuggesting] = useState(false);
  const [aiSuggested, setAiSuggested] = useState(null); // { key, accepted }
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm();

  const selectedCat = watch('category');
  const description = watch('description', '');

  // §4.8.1 — AI Category Suggestion
  const suggestCategory = useCallback(async () => {
    if (!description || description.length < 30) {
      toast.error('Please write at least 30 characters in your description first.');
      return;
    }
    setAiSuggesting(true);
    setAiSuggested(null);
    try {
      const token = localStorage.getItem('lexaid_token');
      const { data } = await axios.post(
        `${API}/ai/suggest-category`,
        { description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.suggested_category) {
        setAiSuggested({ key: data.suggested_category, accepted: false });
      } else {
        toast('AI suggestion unavailable. Please select a category manually.', { icon: '🤖' });
      }
    } catch {
      toast('Could not get AI suggestion. Please select manually.', { icon: '🤖' });
    } finally {
      setAiSuggesting(false);
    }
  }, [description]);

  const acceptSuggestion = () => {
    if (!aiSuggested) return;
    setValue('category', aiSuggested.key);
    setAiSuggested(s => ({ ...s, accepted: true }));
    toast.success('Category applied!');
  };

  const handleFile = (e) => {
    const newFiles = Array.from(e.target.files).filter(f => {
      if (!['application/pdf', 'image/jpeg', 'image/png'].includes(f.type)) {
        toast.error(`${f.name}: only PDF, JPG, PNG allowed`);
        return false;
      }
      if (f.size > 5 * 1024 * 1024) {
        toast.error(`${f.name}: max 5MB`);
        return false;
      }
      return true;
    });
    setFiles(p => [...p, ...newFiles].slice(0, 5));
  };

  const onSubmit = async (data) => {
    if (!data.category) { toast.error('Please select a legal category'); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem('lexaid_token');
      const fd = new FormData();
      Object.entries(data).forEach(([k, v]) => fd.append(k, v));
      files.forEach(f => fd.append('documents', f));
      const res = await axios.post(`${API}/cases`, fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success(`Case submitted! Reference: ${res.data.case?.ref}`);
      navigate('/citizen');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-surface-900">
      <div className="hidden lg:block flex-shrink-0"><CitizenSidebar /></div>
      <main className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-30 bg-surface-900/80 backdrop-blur-md border-b border-white/8 px-6 py-4 flex items-center gap-3">
          <Link to="/citizen" className="btn-ghost p-2"><ArrowLeft className="w-4 h-4" /></Link>
          <div>
            <h1 className="text-lg font-bold text-white font-display">{t('cases.submit_title')}</h1>
            <p className="text-xs text-gray-500">{t('cases.submit_subtitle')}</p>
          </div>
        </div>

        <div className="p-6 max-w-3xl mx-auto">
          <form id="submit-case-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">

            {/* Category */}
            <div>
              <label className="label mb-3">{t('cases.category')}</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {CATEGORIES.map(({ key, icon: Icon, color, active }) => (
                  <button
                    key={key}
                    type="button"
                    id={`cat-${key}`}
                    onClick={() => { setValue('category', key); setAiSuggested(null); }}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 text-center
                      ${selectedCat === key ? active : `${color} text-gray-400 hover:text-gray-200`}
                      ${aiSuggested?.key === key && !aiSuggested.accepted ? 'ring-2 ring-yellow-400/50' : ''}`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-semibold">{t(`cases.categories.${key}`)}</span>
                    {aiSuggested?.key === key && !aiSuggested.accepted && (
                      <span className="text-xs text-yellow-400 font-semibold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> AI suggestion
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* AI Suggestion Banner */}
              {aiSuggested && !aiSuggested.accepted && (
                <div className="mt-3 flex items-center gap-3 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                  <Sparkles className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                  <div className="flex-1 text-xs text-yellow-300">
                    AI suggests: <strong className="text-yellow-200">{t(`cases.categories.${aiSuggested.key}`)}</strong>
                  </div>
                  <button type="button" onClick={acceptSuggestion} className="btn-primary text-xs py-1.5 px-3">
                    Apply
                  </button>
                  <button type="button" onClick={() => setAiSuggested(null)} className="text-gray-500 hover:text-gray-300">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Title */}
            <div className="form-group">
              <label className="label" htmlFor="case-title">{t('cases.title')}</label>
              <input id="case-title" type="text" className={`input ${errors.title ? 'input-error' : ''}`}
                placeholder="Brief summary of your legal issue"
                {...register('title', { required: t('common.required'), minLength: { value: 10, message: 'Please be more descriptive (min 10 chars)' } })} />
              {errors.title && <p className="field-error">{errors.title.message}</p>}
            </div>

            {/* Description + AI Suggest button */}
            <div className="form-group">
              <div className="flex items-center justify-between mb-1">
                <label className="label" htmlFor="case-desc">{t('cases.description')}</label>
                <button
                  id="ai-suggest-btn"
                  type="button"
                  onClick={suggestCategory}
                  disabled={aiSuggesting}
                  className="flex items-center gap-1.5 text-xs text-yellow-400 hover:text-yellow-300 disabled:opacity-50 transition-colors"
                >
                  {aiSuggesting
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analysing…</>
                    : <><Sparkles className="w-3.5 h-3.5" /> {t('cases.ai_suggest_btn', 'AI Suggest Category')}</>
                  }
                </button>
              </div>
              <textarea id="case-desc" rows={6}
                className={`input resize-none ${errors.description ? 'input-error' : ''}`}
                placeholder="Describe your situation in detail: What happened? When? Who is involved? What outcome are you seeking?"
                {...register('description', { required: t('common.required'), minLength: { value: 50, message: 'Please provide more detail (min 50 characters)' } })} />
              {errors.description && <p className="field-error">{errors.description.message}</p>}
              <p className="text-xs text-gray-600 mt-1">Min. 50 characters. Be as specific as possible. The AI Suggest button will automatically recommend the best legal category.</p>
            </div>

            {/* Documents */}
            <div>
              <label className="label mb-2">{t('cases.documents')}</label>
              <label id="file-upload-label"
                className="flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed border-white/15 hover:border-brand-500/50 bg-surface-700/30 cursor-pointer transition-all duration-200 group">
                <Upload className="w-8 h-8 text-gray-600 group-hover:text-brand-400 transition-colors" />
                <div className="text-center">
                  <p className="text-sm text-gray-400 group-hover:text-gray-300">Click to upload or drag & drop</p>
                  <p className="text-xs text-gray-600 mt-1">PDF, JPG, PNG · Max 5MB each · Up to 5 files</p>
                </div>
                <input id="file-upload" type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="sr-only" onChange={handleFile} />
              </label>
              {files.length > 0 && (
                <div className="mt-3 flex flex-col gap-2">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-700/50 border border-white/8">
                      <FileText className="w-4 h-4 text-brand-400 flex-shrink-0" />
                      <span className="flex-1 text-sm text-gray-300 truncate">{f.name}</span>
                      <span className="text-xs text-gray-500">{(f.size / 1024).toFixed(0)}KB</span>
                      <button type="button" onClick={() => setFiles(p => p.filter((_, j) => j !== i))}
                        className="text-gray-500 hover:text-red-400 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Disclaimer */}
            <div className="alert-warning rounded-xl flex gap-3">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-yellow-400" />
              <p className="text-xs">{t('landing.disclaimer')}</p>
            </div>

            <div className="flex gap-3">
              <Link to="/citizen" className="btn-secondary flex-1 justify-center">{t('common.cancel')}</Link>
              <button id="submit-case-btn" type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting…
                  </span>
                ) : (
                  <><Send className="w-4 h-4" /> {t('common.submit')}</>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
