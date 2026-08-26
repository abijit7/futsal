import { Navigate, useParams } from 'react-router-dom';

export function BookingPage() {
  const { futsalId } = useParams();
  return <Navigate to={futsalId ? `/venues/${futsalId}` : '/venues'} replace />;
}
