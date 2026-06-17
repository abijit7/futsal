import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute() {
  const { user } = useAuth();
  const location = useLocation();
  if (!user?.authToken) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

export function AdminRoute() {
  const { user, isAdmin } = useAuth();
  const location = useLocation();
  if (!user?.authToken) return <Navigate to="/login" replace state={{ from: location }} />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
