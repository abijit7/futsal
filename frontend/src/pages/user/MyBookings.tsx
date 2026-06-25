import { UserDashboard } from '../../design/UserDashboard';
import { useDesignNavigation } from '../../design/navigation';

export function MyBookings() {
  const onNavigate = useDesignNavigation();
  return <UserDashboard onNavigate={onNavigate} />;
}
