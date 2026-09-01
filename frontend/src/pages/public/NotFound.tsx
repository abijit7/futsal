import { Home, Search } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export function NotFound() {
  const location = useLocation();
  return (
    <main className="container-page grid place-items-center py-16">
      <div className="panel w-full max-w-md text-center p-8">
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <Search size={32} />
          </div>
        </div>
        <h1 className="mb-2 text-4xl font-black text-slate-950">404</h1>
        <p className="mb-2 text-lg font-semibold text-slate-600">Page Not Found</p>
        <p className="mb-6 text-sm text-slate-500">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. The path <code className="bg-slate-100 px-1.5 py-0.5 rounded text-red-600 font-mono text-xs">{location.pathname}</code> doesn&apos;t exist.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link to="/" className="btn-primary flex items-center justify-center gap-2">
            <Home size={18} />
            Go Home
          </Link>
          <Link to="/venues" className="btn-soft flex items-center justify-center gap-2">
            <Search size={18} />
            Browse Venues
          </Link>
        </div>
      </div>
    </main>
  );
}