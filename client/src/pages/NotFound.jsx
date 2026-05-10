import { Link } from 'react-router-dom';
import { Scale, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-float"
        style={{ background: 'linear-gradient(135deg, #FCA311, #e5920f)', boxShadow: '0 12px 40px rgba(252,163,17,0.35)' }}
      >
        <Scale className="w-10 h-10 text-black" />
      </div>
      <h1 className="font-display text-8xl font-black text-gradient mb-4">404</h1>
      <h2 className="text-2xl font-bold text-white mb-2">Page Not Found</h2>
      <p className="text-gray-400 max-w-sm mb-8">The page you're looking for doesn't exist, or you may not have permission to view it.</p>
      <Link to="/" id="notfound-home" className="btn-primary">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>
    </div>
  );
}
