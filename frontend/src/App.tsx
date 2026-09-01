import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AdminLayout, Layout } from './components/Layout';
import { AdminRoute, ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Home } from './pages/public/Home';
import { Login } from './pages/public/Login';
import { Register } from './pages/public/Register';
import { ForgotPassword } from './pages/public/ForgotPassword';
import { Venues } from './pages/public/Venues';
import { VenueDetails } from './pages/public/VenueDetails';
import { BookingPage } from './pages/user/BookingPage';
import { Dashboard } from './pages/user/Dashboard';
import { MyBookings } from './pages/user/MyBookings';
import { Profile } from './pages/user/Profile';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminFutsals } from './pages/admin/AdminFutsals';
import { AdminSlots } from './pages/admin/AdminSlots';
import { AdminBookings } from './pages/admin/AdminBookings';
import { AdminUsers } from './pages/admin/AdminUsers';
import { PaymentFailure } from './pages/public/PaymentFailure';
import { PaymentSuccess } from './pages/public/PaymentSuccess';
import { NotFound } from './pages/public/NotFound';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthRedirectListener />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/venues" element={<Venues />} />
          <Route path="/venues/:id" element={<VenueDetails />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/failure" element={<PaymentFailure />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/booking" element={<BookingPage />} />
            <Route path="/booking/:futsalId" element={<BookingPage />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>
        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/futsals" element={<AdminFutsals />} />
            <Route path="/admin/slots" element={<AdminSlots />} />
            <Route path="/admin/bookings" element={<AdminBookings />} />
            <Route path="/admin/users" element={<AdminUsers />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ErrorBoundary>
  );
}

function AuthRedirectListener() {
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    const handler = () => {
      if (!['/login', '/register'].includes(location.pathname)) navigate('/login', { replace: true });
    };
    window.addEventListener('authrequired', handler);
    return () => window.removeEventListener('authrequired', handler);
  }, [location.pathname, navigate]);
  return null;
}
