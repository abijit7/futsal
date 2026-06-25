import { VenueList } from '../../design/VenueList';
import { useDesignNavigation } from '../../design/navigation';

export function Venues() {
  const onNavigate = useDesignNavigation();
  return <VenueList onNavigate={onNavigate} />;
}
