export default function Pagination({ page, totalPages, onPageChange, className = '' }) {
  if (!totalPages || totalPages <= 1) return null;

  const prevDisabled = page <= 0;
  const nextDisabled = page >= totalPages - 1;

  return (
    <div className={`pagination ${className}`.trim()}>
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        disabled={prevDisabled}
        onClick={() => onPageChange(page - 1)}
      >
        Prev
      </button>
      <div className="text-muted text-sm">Page {page + 1} of {totalPages}</div>
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        disabled={nextDisabled}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </button>
    </div>
  );
}
