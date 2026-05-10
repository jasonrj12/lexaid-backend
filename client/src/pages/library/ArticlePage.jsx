import { Link, useParams } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { ArrowLeft, User, Calendar, Clock, AlertTriangle, BookOpen } from 'lucide-react';

const ARTICLES_CONTENT = {
  'tenant-rights-sri-lanka': {
    title: 'Tenant Rights in Sri Lanka: A Complete Guide',
    category: 'land',
    author: 'K. Rajapaksa (Attorney-at-Law)',
    date: '2025-10-15',
    readTime: '8 min',
    content: `
## Overview

As a tenant in Sri Lanka, you have significant legal protections under the **Rent Act (No. 7 of 1972)** and common law principles. Understanding these rights is essential to protect yourself from unlawful eviction and exploitation.

## Security Deposits

Landlords may collect a security deposit (typically 1–3 months' rent). This must be:
- Returned within **30 days** of vacating, subject to deductions for legitimate damage
- Not used for routine wear and tear
- Accompanied by a written itemised deduction if any amount is withheld

**If your landlord refuses to return the deposit**, you may file a civil claim in the Magistrate's Court for amounts under LKR 1,500,000.

## Eviction Procedures

Under the Rent Act, a landlord **cannot evict you** without:
1. A valid ground (non-payment of rent, breach of tenancy agreement, landlord's own use)
2. Proper written notice (typically 1–3 months depending on the ground)
3. A court order from the Rent Tribunal

**Self-help eviction** (changing locks, removing belongings, cutting utilities) is illegal and actionable as a civil wrong.

## Rent Increases

- Rent increases must be **agreed in writing**
- Sudden or arbitrary increases without agreement may be challenged at the Rent Tribunal
- If your property is rent-controlled under the Rent Act, increases are subject to statutory limits

## Repairs and Maintenance

The landlord is responsible for:
- Structural repairs (roof, walls, foundations)
- Essential services (water, sanitation, electricity connections)

You, as the tenant, are responsible for day-to-day maintenance and minor repairs unless agreed otherwise.

## What to Do If Your Rights Are Violated

1. **Document everything** — keep all rent receipts, the tenancy agreement, and any communications in writing
2. **Send a formal letter** by registered post outlining the breach
3. **File a complaint** with the Rent Tribunal in your district
4. **Seek legal aid** through the Legal Aid Commission or LexAid if you cannot afford private counsel

---

*This article provides general guidance only. For advice specific to your situation, submit a query through LexAid.*
    `.trim(),
  },
};

export default function ArticlePage() {
  const { slug } = useParams();
  const article = ARTICLES_CONTENT[slug];

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">Article not found</h1>
            <Link to="/library" className="btn-primary mt-4">Back to Library</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Simple markdown renderer
  const renderContent = (md) => {
    return md.split('\n').map((line, i) => {
      if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold text-white mt-8 mb-3 font-display">{line.slice(3)}</h2>;
      if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-semibold text-white mt-6 mb-2">{line.slice(4)}</h3>;
      if (line.startsWith('- ')) return <li key={i} className="text-gray-300 ml-4 list-disc">{renderInline(line.slice(2))}</li>;
      if (/^\d+\./.test(line)) return <li key={i} className="text-gray-300 ml-4 list-decimal">{renderInline(line.replace(/^\d+\.\s/, ''))}</li>;
      if (line.startsWith('---')) return <hr key={i} className="border-white/10 my-6" />;
      if (line.startsWith('*') && line.endsWith('*')) return <p key={i} className="text-xs text-gray-500 italic mt-4">{line.slice(1, -1)}</p>;
      if (line.trim() === '') return <div key={i} className="h-3" />;
      return <p key={i} className="text-gray-300 leading-relaxed">{renderInline(line)}</p>;
    });
  };

  const renderInline = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((p, i) => p.startsWith('**') && p.endsWith('**') ? <strong key={i} className="text-white font-semibold">{p.slice(2,-2)}</strong> : p);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <Link to="/library" id="back-to-library" className="btn-ghost px-0 mb-6 inline-flex">
            <ArrowLeft className="w-4 h-4" /> Back to Library
          </Link>

          <div className="card mb-8">
            <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-4">
              <span className="flex items-center gap-1"><User className="w-3 h-3" /> {article.author}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {article.date}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {article.readTime} read</span>
            </div>
            <h1 className="text-2xl font-bold text-white font-display leading-tight mb-4">{article.title}</h1>
            <div className="alert-warning rounded-xl flex gap-2 text-xs">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-yellow-400 mt-0.5" />
              This article provides general legal information only. It does not constitute formal legal advice. For advice specific to your situation, submit a query through LexAid.
            </div>
          </div>

          <article className="prose-custom flex flex-col gap-1">
            {renderContent(article.content)}
          </article>

          <div className="card mt-10 bg-gradient-to-br from-brand-600/15 to-purple-600/10 border-brand-500/20">
            <h3 className="text-base font-semibold text-white mb-2">Need personalised guidance?</h3>
            <p className="text-sm text-gray-400 mb-4">Submit your legal query and a verified volunteer lawyer will respond within 72 hours — free of charge.</p>
            <Link to="/register" id="article-cta" className="btn-primary">Submit a Query</Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
