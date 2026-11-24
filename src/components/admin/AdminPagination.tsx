import styles from "./AdminShell.module.css";

export type PaginationLabels = {
    previous: string;
    next: string;
    of: string;
    label: string;
};

type AdminPaginationProps = {
    page: number;
    pageCount: number;
    total: number;
    size: number;
    labels: PaginationLabels;
    onChange: (page: number) => void;
    loading: boolean;
};

export function AdminPagination({ page, pageCount, total, size, labels, onChange, loading }: AdminPaginationProps) {
    const visible = [...new Set([
        0,
        pageCount - 1,
        ...Array.from({ length: 3 }, (_, index) => page - 1 + index)
            .filter(value => value > 0 && value < pageCount - 1),
    ])].sort((a, b) => a - b);
    const pages: (number | null)[] = [];
    visible.forEach((value, index) => {
        if (index > 0 && value - visible[index - 1] > 1) pages.push(null);
        pages.push(value);
    });
    const from = total === 0 ? 0 : page * size + 1;
    const to = Math.min(total, (page + 1) * size);

    return (
        <nav className={styles.pagination} aria-label={labels.label}>
            <span className={styles.paginationSummary}>{from}–{to} {labels.of} {total}</span>
            <div className={styles.paginationControls}>
                <button
                    type="button"
                    className={styles.pageButton}
                    disabled={loading || page === 0}
                    onClick={() => onChange(Math.max(0, page - 1))}
                >
                    {labels.previous}
                </button>
                {pages.map((value, index) => value === null
                    ? <span key={`ellipsis-${index}`} className={styles.paginationEllipsis}>…</span>
                    : (
                        <button
                            key={value}
                            type="button"
                            className={value === page ? styles.pageCurrent : styles.pageNumber}
                            aria-current={value === page ? "page" : undefined}
                            disabled={loading}
                            onClick={() => onChange(value)}
                        >
                            {value + 1}
                        </button>
                    ))}
                <button
                    type="button"
                    className={styles.pageButton}
                    disabled={loading || page >= pageCount - 1}
                    onClick={() => onChange(Math.min(pageCount - 1, page + 1))}
                >
                    {labels.next}
                </button>
            </div>
        </nav>
    );
}
