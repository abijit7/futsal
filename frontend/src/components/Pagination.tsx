export function Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (page: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-6 flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-3">
      <button className="btn-soft px-4 py-2" disabled={page <= 0} onClick={() => onPage(page - 1)}>Previous</button>
      <span className="text-sm font-bold text-slate-500">Page {page + 1} of {totalPages}</span>
      <button className="btn-soft px-4 py-2" disabled={page >= totalPages - 1} onClick={() => onPage(page + 1)}>Next</button>
    </div>
  );
}
