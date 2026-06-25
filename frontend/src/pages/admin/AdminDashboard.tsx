import { AdminDashboard as DesignAdminDashboard } from '../../design/AdminDashboard';
import { useDesignNavigation } from '../../design/navigation';
import { useLocation } from 'react-router-dom';

export function AdminDashboard() {
  const onNavigate = useDesignNavigation();
  const { pathname } = useLocation();
  const initialSection =
    pathname.includes('/futsals') ? 'venues'
    : pathname.includes('/bookings') ? 'bookings'
    : pathname.includes('/users') ? 'users'
    : pathname.includes('/slots') ? 'reports'
    : 'overview';

  return <DesignAdminDashboard onNavigate={onNavigate} initialSection={initialSection} />;
}
