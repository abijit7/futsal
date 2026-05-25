import { Navigate, Outlet } from 'react-router-dom';
import { Auth } from '../utils/auth.js';

export function RequireAuth() {
  return Auth.isLoggedIn() ? <Outlet /> : <Navigate to="/login" replace />;
}

export function RequireAdmin() {
  if (!Auth.isLoggedIn()) return <Navigate to="/login" replace />;
  if (!Auth.isAdmin()) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

