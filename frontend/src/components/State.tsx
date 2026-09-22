import { AlertTriangle, Inbox, Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

export function LoadingState({ label = 'Loading data' }: { label?: string }) {
  return <div className="panel flex min-h-48 items-center justify-center gap-3 p-8 text-sm text-muted"><Loader2 className="animate-spin text-green-600" /> {label}</div>;
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="panel flex min-h-56 flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-green-50 text-green-600 ring-1 ring-green-100">
        <Inbox size={26} strokeWidth={2.4} />
      </div>
      <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
      {description && <p className="mt-2 max-w-md text-base text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="panel border-red-100 bg-red-50 p-6">
      <div className="flex items-center gap-2 font-semibold text-red-800">
        <AlertTriangle size={18} />
        <h3>Something went wrong</h3>
      </div>
      <p className="mt-2 text-sm text-red-700">{message}</p>
      {retry && <button className="btn-soft mt-4" onClick={retry}>Retry</button>}
    </div>
  );
}

/**
 * Mirrors {@link VenueCard}'s proportions so the grid does not jump when real venues arrive.
 * The spinner in {@link LoadingState} left a short box that every card then pushed down.
 */
export function VenueGridSkeleton({ count = 6, label = 'Loading venues' }: { count?: number; label?: string }) {
  return (
    <>
      <span className="sr-only" role="status">{label}</span>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
        {Array.from({ length: count }, (_, index) => (
          <div key={index} className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
            <div className="aspect-[4/3] animate-pulse bg-slate-100" />
            <div className="space-y-3 p-6">
              <div className="h-5 w-2/3 animate-pulse rounded-lg bg-slate-100" />
              <div className="h-4 w-full animate-pulse rounded-lg bg-slate-100" />
              <div className="h-4 w-1/2 animate-pulse rounded-lg bg-slate-100" />
              <div className="mt-6 h-10 w-1/3 animate-pulse rounded-lg bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
