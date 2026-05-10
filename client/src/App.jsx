import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LandingPage    from './pages/LandingPage';
import LoginPage      from './pages/auth/LoginPage';
import RegisterPage   from './pages/auth/RegisterPage';
import CitizenDash    from './pages/citizen/CitizenDashboard';
import SubmitCase     from './pages/citizen/SubmitCase';
import CaseDetail     from './pages/citizen/CaseDetail';
import LawyerDash     from './pages/lawyer/LawyerDashboard';
import OpenCases      from './pages/lawyer/OpenCases';
import LawyerCaseDetail from './pages/lawyer/LawyerCaseDetail';
import AdminDash      from './pages/admin/AdminDashboard';
import LibraryPage    from './pages/library/LibraryPage';
import ArticlePage    from './pages/library/ArticlePage';
import NotFound       from './pages/NotFound';

// Route guards
function RequireAuth({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-brand-500 border-t-transparent animate-spin" />
        <p className="text-gray-400 text-sm">Loading…</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) {
    const dest = user.role === 'admin' ? '/admin' : user.role === 'lawyer' ? '/lawyer' : '/citizen';
    return <Navigate to={dest} replace />;
  }
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a1a2e',
              color: '#e5e7eb',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
        <Routes>
          {/* Public */}
          <Route path="/"         element={<LandingPage />} />
          <Route path="/library"  element={<LibraryPage />} />
          <Route path="/library/:slug" element={<ArticlePage />} />

          {/* Auth */}
          <Route path="/login"    element={<PublicOnly><LoginPage /></PublicOnly>} />
          <Route path="/register" element={<PublicOnly><RegisterPage /></PublicOnly>} />

          {/* Citizen */}
          <Route path="/citizen"            element={<RequireAuth roles={['citizen']}><CitizenDash /></RequireAuth>} />
          <Route path="/citizen/cases/new"  element={<RequireAuth roles={['citizen']}><SubmitCase /></RequireAuth>} />
          <Route path="/citizen/cases/:id"  element={<RequireAuth roles={['citizen']}><CaseDetail /></RequireAuth>} />

          {/* Lawyer */}
          <Route path="/lawyer"             element={<RequireAuth roles={['lawyer']}><LawyerDash /></RequireAuth>} />
          <Route path="/lawyer/open"        element={<RequireAuth roles={['lawyer']}><OpenCases /></RequireAuth>} />
          <Route path="/lawyer/cases/:id"   element={<RequireAuth roles={['lawyer']}><LawyerCaseDetail /></RequireAuth>} />

          {/* Admin */}
          <Route path="/admin"              element={<RequireAuth roles={['admin']}><AdminDash /></RequireAuth>} />
          <Route path="/admin/:section"     element={<RequireAuth roles={['admin']}><AdminDash /></RequireAuth>} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
