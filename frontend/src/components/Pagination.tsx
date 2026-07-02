export function Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (page: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-6 flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
      <button className="btn-soft w-full px-4 py-2 sm:w-auto" disabled={page <= 0} onClick={() => onPage(page - 1)}>Previous</button>
      <span className="text-center text-sm font-bold text-slate-500">Page {page + 1} of {totalPages}</span>
      <button className="btn-soft w-full px-4 py-2 sm:w-auto" disabled={page >= totalPages - 1} onClick={() => onPage(page + 1)}>Next</button>
    </div>
  );
}
