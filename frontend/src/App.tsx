import { Route, Routes, matchPath, useLocation, useNavigate } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import { AdminLayout, Layout } from './components/Layout';
import { AdminRoute, ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingState } from './components/State';
import { usePageTitle } from './hooks/usePageTitle';
import { Home } from './pages/public/Home';
import { Login } from './pages/public/Login';
import { Register } from './pages/public/Register';
import { ForgotPassword } from './pages/public/ForgotPassword';
import { Venues } from './pages/public/Venues';
import { VenueDetails } from './pages/public/VenueDetails';
import { PaymentFailure } from './pages/public/PaymentFailure';
import { PaymentSuccess } from './pages/public/PaymentSuccess';
import { NotFound } from './pages/public/NotFound';

// The public funnel above stays in the entry bundle because it is the first thing a visitor
// sees. Everything below is behind a login, so it is split out and fetched on demand - the
// five admin screens alone are roughly a third of the app's component code and are never
// needed by an anonymous visitor.
const BookingPage = lazy(() => import('./pages/user/BookingPage').then((m) => ({ default: m.BookingPage })));
const Dashboard = lazy(() => import('./pages/user/Dashboard').then((m) => ({ default: m.Dashboard })));
const MyBookings = lazy(() => import('./pages/user/MyBookings').then((m) => ({ default: m.MyBookings })));
const Profile = lazy(() => import('./pages/user/Profile').then((m) => ({ default: m.Profile })));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const AdminFutsals = lazy(() => import('./pages/admin/AdminFutsals').then((m) => ({ default: m.AdminFutsals })));
const AdminSlots = lazy(() => import('./pages/admin/AdminSlots').then((m) => ({ default: m.AdminSlots })));
const AdminBookings = lazy(() => import('./pages/admin/AdminBookings').then((m) => ({ default: m.AdminBookings })));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers').then((m) => ({ default: m.AdminUsers })));

export default function App() {
  return (
    <ErrorBoundary>
      <AuthRedirectListener />
      <RouteTitle />
      <Suspense fallback={<div className="container-page py-16"><LoadingState label="Loading…" /></div>}>
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
      </Suspense>
    </ErrorBoundary>
  );
}

// Titles for the static routes. `/venues/:id` is deliberately absent: VenueDetails sets its own
// title from the venue name once it has loaded, and would otherwise be overwritten here.
const ROUTE_TITLES: ReadonlyArray<readonly [string, string]> = [
  ['/', ''],
  ['/login', 'Sign in'],
  ['/register', 'Create account'],
  ['/forgot-password', 'Reset password'],
  ['/venues', 'Futsal venues'],
  ['/payment/success', 'Payment'],
  ['/payment/failure', 'Payment'],
  ['/dashboard', 'My bookings'],
  ['/my-bookings', 'My bookings'],
  ['/profile', 'Profile'],
  ['/admin', 'Admin'],
  ['/admin/futsals', 'Venues · Admin'],
  ['/admin/slots', 'Schedule · Admin'],
  ['/admin/bookings', 'Bookings · Admin'],
  ['/admin/users', 'Users · Admin']
];

function RouteTitle() {
  const { pathname } = useLocation();
  const match = ROUTE_TITLES.find(([path]) => matchPath({ path, end: true }, pathname));
  const isVenueDetails = Boolean(matchPath({ path: '/venues/:id', end: true }, pathname));
  usePageTitle(match ? match[1] || undefined : isVenueDetails ? undefined : 'Page not found');
  return null;
}

function AuthRedirectListener() {
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    const handler = () => {
      // Carry the attempted location through, the same way ProtectedRoute does, so that an
      // expired token drops the user back where they were instead of on the dashboard.
      if (!['/login', '/register'].includes(location.pathname)) {
        navigate('/login', { replace: true, state: { from: location } });
      }
    };
    window.addEventListener('authrequired', handler);
    return () => window.removeEventListener('authrequired', handler);
  }, [location, navigate]);
  return null;
}
