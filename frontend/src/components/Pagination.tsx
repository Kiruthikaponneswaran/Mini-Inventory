interface Props {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
  disabled?: boolean;
}

export function Pagination({ page, pageSize, total, onChange, disabled }: Props) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <nav className="pagination" aria-label="Pagination">
      <span className="muted">
        {from}–{to} of {total}
      </span>
      <div className="pagination-buttons">
        <button className="btn" onClick={() => onChange(page - 1)} disabled={disabled || page <= 1}>
          Previous
        </button>
        <span aria-current="page">
          Page {page} of {pages}
        </span>
        <button className="btn" onClick={() => onChange(page + 1)} disabled={disabled || page >= pages}>
          Next
        </button>
      </div>
    </nav>
  );
}
