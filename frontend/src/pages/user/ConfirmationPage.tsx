import { Confirmation } from '../../design/Confirmation';
import { useDesignNavigation } from '../../design/navigation';

export function ConfirmationPage() {
  const onNavigate = useDesignNavigation();
  return <Confirmation onNavigate={onNavigate} />;
}
