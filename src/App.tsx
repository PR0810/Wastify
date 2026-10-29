import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { LandingPage } from '@/pages/LandingPage';
import { SignInPage } from '@/pages/SignInPage';
import { SignUpPage } from '@/pages/SignUpPage';
import { CitizenDashboard } from '@/pages/dashboards/CitizenDashboard';
import { DriverDashboard } from '@/pages/dashboards/DriverDashboard';
import { AdminDashboard } from '@/pages/dashboards/AdminDashboard';
import { NgoDashboard } from '@/pages/dashboards/NgoDashboard';
import { LearningHub } from '@/pages/LearningHub';
import type { Profile } from '@/lib/supabase';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: Profile['role'][] }) {
  const { session, profile, loading } = useAuth();

  if (loading) return <FullPageSpinner label="Loading your dashboard..." />;
  if (!session) return <Navigate to="/signin" replace />;
  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/app" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  const { session, profile, loading } = useAuth();

  if (loading) return <FullPageSpinner label="Loading..." />;

  function getDashboard() {
    if (!profile) return <FullPageSpinner label="Loading your profile..." />;
    switch (profile.role) {
      case 'citizen': return <CitizenDashboard />;
      case 'driver': return <DriverDashboard />;
      case 'admin': return <AdminDashboard />;
      case 'ngo': return <NgoDashboard />;
      default: return <CitizenDashboard />;
    }
  }

  return (
    <Routes>
      <Route path="/" element={session ? <Navigate to="/app" replace /> : <LandingPage />} />
      <Route path="/signin" element={session ? <Navigate to="/app" replace /> : <SignInPage />} />
      <Route path="/signup" element={session ? <Navigate to="/app" replace /> : <SignUpPage />} />
      <Route path="/app" element={<ProtectedRoute>{getDashboard()}</ProtectedRoute>} />
      <Route path="/app/learning" element={<ProtectedRoute allowedRoles={['citizen']}><LearningHub /></ProtectedRoute>} />
      <Route path="/app/scan" element={<Navigate to="/app" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return <AppRoutes />;
}
