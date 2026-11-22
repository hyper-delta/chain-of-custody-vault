import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

export default function ProtectedRoute({ children, permission }) {
  const { user, loading, hasPermission } = useAuth();
  const location = useLocation();
  if (loading) return <main className="page"><div className="card">Loading…</div></main>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (permission && !hasPermission(permission)) return <Navigate to="/403" replace />;
  return children;
}
