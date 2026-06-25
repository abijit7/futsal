import { LandingPage } from '../../design/LandingPage';
import { useDesignNavigation } from '../../design/navigation';

export function Home() {
  const onNavigate = useDesignNavigation();
  return <LandingPage onNavigate={onNavigate} />;
}
