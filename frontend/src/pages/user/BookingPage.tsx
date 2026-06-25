import { BookingFlow } from '../../design/BookingFlow';
import { useDesignNavigation } from '../../design/navigation';

export function BookingPage() {
  const onNavigate = useDesignNavigation();
  return <BookingFlow onNavigate={onNavigate} />;
}
