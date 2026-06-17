import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

export function LoadingState({ label = 'Loading data' }: { label?: string }) {
  return <div className="panel flex min-h-48 items-center justify-center gap-3 p-8 text-slate-500"><Loader2 className="animate-spin text-green-600" /> {label}</div>;
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="panel flex min-h-56 flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 h-14 w-14 rounded-3xl bg-green-50 ring-1 ring-green-100" />
      <h3 className="text-lg font-black text-slate-950">{title}</h3>
      {description && <p className="mt-2 max-w-md text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="panel border-red-100 bg-red-50 p-6">
      <h3 className="font-black text-red-800">Something went wrong</h3>
      <p className="mt-2 text-sm text-red-700">{message}</p>
      {retry && <button className="btn-soft mt-4" onClick={retry}>Retry</button>}
    </div>
  );
}
