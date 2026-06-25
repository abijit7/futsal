import { UserDashboard } from '../../design/UserDashboard';
import { useDesignNavigation } from '../../design/navigation';

export function Dashboard() {
  const onNavigate = useDesignNavigation();
  return <UserDashboard onNavigate={onNavigate} />;
}
