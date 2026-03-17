const LoadingSkeleton = ({ type = 'card', count = 1 }: { type?: 'card' | 'list' | 'detail' | 'text'; count?: number }) => {
    const items = Array.from({ length: count });

    if (type === 'card') {
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {items.map((_, i) => (
                    <div key={i} className="card overflow-hidden">
                        <div className="aspect-square skeleton" />
                        <div className="p-4 space-y-3">
                            <div className="h-3 skeleton w-1/3" />
                            <div className="h-4 skeleton w-full" />
                            <div className="h-4 skeleton w-2/3" />
                            <div className="h-3 skeleton w-1/2" />
                            <div className="h-6 skeleton w-1/3" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (type === 'detail') {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-pulse">
                <div className="aspect-square skeleton rounded-2xl" />
                <div className="space-y-4">
                    <div className="h-4 skeleton w-1/4" />
                    <div className="h-8 skeleton w-3/4" />
                    <div className="h-4 skeleton w-1/3" />
                    <div className="h-10 skeleton w-1/4" />
                    <div className="h-20 skeleton w-full" />
                    <div className="h-12 skeleton w-1/2" />
                </div>
            </div>
        );
    }

    if (type === 'list') {
        return (
            <div className="space-y-4">
                {items.map((_, i) => (
                    <div key={i} className="card p-4 flex gap-4 animate-pulse">
                        <div className="w-20 h-20 skeleton rounded-xl" />
                        <div className="flex-1 space-y-3">
                            <div className="h-4 skeleton w-1/2" />
                            <div className="h-3 skeleton w-1/3" />
                            <div className="h-3 skeleton w-1/4" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {items.map((_, i) => (<div key={i} className="h-4 skeleton" style={{ width: `${60 + Math.random() * 40}%` }} />))}
        </div>
    );
};

export default LoadingSkeleton;
