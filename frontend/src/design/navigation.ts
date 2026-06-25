import { useNavigate } from 'react-router-dom';

export type DesignView =
  | 'landing'
  | 'venues'
  | 'venue-detail'
  | 'booking'
  | 'confirmation'
  | 'user-dashboard'
  | 'admin-dashboard';

const viewPath: Record<DesignView, string> = {
  landing: '/',
  venues: '/venues',
  'venue-detail': '/venues/1',
  booking: '/booking',
  confirmation: '/confirmation',
  'user-dashboard': '/dashboard',
  'admin-dashboard': '/admin'
};

export function useDesignNavigation() {
  const navigate = useNavigate();
  return (view: DesignView) => {
    navigate(viewPath[view]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
}
