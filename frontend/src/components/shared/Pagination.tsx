interface Props {
    page: number; pages: number;
    onPageChange: (page: number) => void;
}

const Pagination = ({ page, pages, onPageChange }: Props) => {
    if (pages <= 1) return null;

    const getVisiblePages = () => {
        const visible: (number | string)[] = [];
        if (pages <= 7) {
            for (let i = 1; i <= pages; i++) visible.push(i);
        } else {
            visible.push(1);
            if (page > 3) visible.push('...');
            for (let i = Math.max(2, page - 1); i <= Math.min(pages - 1, page + 1); i++) visible.push(i);
            if (page < pages - 2) visible.push('...');
            visible.push(pages);
        }
        return visible;
    };

    return (
        <div className="flex items-center justify-center gap-1.5 mt-8">
            <button onClick={() => onPageChange(page - 1)} disabled={page === 1}
                className="px-3 py-2 rounded-lg text-sm font-medium text-dark-600 hover:bg-dark-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Prev
            </button>
            {getVisiblePages().map((p, i) =>
                typeof p === 'string' ? (
                    <span key={`dots-${i}`} className="px-2 text-dark-400">...</span>
                ) : (
                    <button key={p} onClick={() => onPageChange(p)}
                        className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${p === page ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20' : 'text-dark-600 hover:bg-dark-100'}`}>
                        {p}
                    </button>
                )
            )}
            <button onClick={() => onPageChange(page + 1)} disabled={page === pages}
                className="px-3 py-2 rounded-lg text-sm font-medium text-dark-600 hover:bg-dark-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Next
            </button>
        </div>
    );
};

export default Pagination;
