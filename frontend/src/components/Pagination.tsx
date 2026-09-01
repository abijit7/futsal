export function Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (page: number) => void }) {
  if (totalPages <= 1) return null;
  const pages = pageWindow(page, totalPages);

  return (
    <nav className="mt-6 flex flex-wrap items-center justify-center gap-2 rounded-3xl border border-slate-200 bg-white p-3" aria-label="Pagination">
      <button className="btn-soft min-h-10 px-4 py-2 text-sm" disabled={page <= 0} onClick={() => onPage(page - 1)} aria-label="Previous page">Previous</button>
      <div className="flex flex-wrap justify-center gap-2">
        {pages.map((item) => {
          const active = item === page;
          const pageNumber = item + 1;
          return (
            <button
              key={item}
              type="button"
              aria-current={active ? 'page' : undefined}
              aria-label={`Page ${pageNumber}`}
              className={`inline-flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-black transition focus:outline-none focus:ring-4 focus:ring-green-100 ${
                active
                  ? 'bg-slate-950 text-white shadow-lg shadow-slate-950/15'
                  : 'border border-slate-200 bg-white text-slate-700 hover:border-green-200 hover:text-green-700'
              }`}
              onClick={() => onPage(item)}
            >
              {pageNumber}
            </button>
          );
        })}
      </div>
      <button className="btn-soft min-h-10 px-4 py-2 text-sm" disabled={page >= totalPages - 1} onClick={() => onPage(page + 1)} aria-label="Next page">Next</button>
    </nav>
  );
}

function pageWindow(page: number, totalPages: number) {
  const windowSize = 5;
  const maxStart = Math.max(0, totalPages - windowSize);
  const start = Math.min(Math.max(0, page - Math.floor(windowSize / 2)), maxStart);
  const length = Math.min(windowSize, totalPages);
  return Array.from({ length }, (_, index) => start + index);
}
