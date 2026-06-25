import { VenueDetail } from '../../design/VenueDetail';
import { useAuth } from '../../context/AuthContext';
import { useDesignNavigation } from '../../design/navigation';

export function VenueDetails() {
  const { user, isAdmin, setUser } = useAuth();
  const onNavigate = useDesignNavigation();
  const userRole = isAdmin ? 'admin' : user?.authToken ? 'user' : 'guest';

  return (
    <VenueDetail
      onNavigate={onNavigate}
      userRole={userRole}
      onRoleChange={(role) => {
        if (role === 'guest') setUser(null);
        if (role === 'admin') onNavigate('admin-dashboard');
      }}
    />
  );
}
