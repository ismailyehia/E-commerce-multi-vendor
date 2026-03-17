import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HiOutlineAdjustments, HiOutlineViewGrid, HiViewList } from 'react-icons/hi';
import api from '../../api/axiosClient';
import type { Product, Category, Pagination as PaginationType } from '../../types';
import ProductCard from '../../components/shared/ProductCard';
import LoadingSkeleton from '../../components/shared/LoadingSkeleton';
import Pagination from '../../components/shared/Pagination';

import { useTranslation } from 'react-i18next';

const ProductCatalog = () => {
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [pagination, setPagination] = useState<PaginationType>({ page: 1, limit: 12, total: 0, pages: 0 });
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [view, setView] = useState<'grid' | 'list'>('grid');

    const [filters, setFilters] = useState({
        category: searchParams.get('category') || '',
        minPrice: searchParams.get('minPrice') || '',
        maxPrice: searchParams.get('maxPrice') || '',
        minRating: searchParams.get('minRating') || '',
        inStock: searchParams.get('inStock') || '',
        sort: searchParams.get('sort') || 'newest',
        keyword: searchParams.get('q') || ''
    });

    useEffect(() => {
        api.get('/categories').then(r => setCategories(r.data)).catch(() => { });
    }, []);

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
                params.set('page', String(pagination.page));
                params.set('limit', '12');
                const { data } = await api.get(`/products?${params}`);
                setProducts(data.products || []);
                setPagination(data.pagination || { page: 1, limit: 12, total: 0, pages: 0 });
            } catch (err) { console.error(err); }
            setLoading(false);
        };
        fetchProducts();
    }, [filters, pagination.page]);

    const updateFilter = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, page: 1 }));
        const newParams = new URLSearchParams(searchParams);
        if (value) newParams.set(key, value); else newParams.delete(key);
        setSearchParams(newParams);
    };

    const clearFilters = () => {
        setFilters({ category: '', minPrice: '', maxPrice: '', minRating: '', inStock: '', sort: 'newest', keyword: '' });
        setSearchParams({});
    };

    return (
        <div className="page-container">
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar Filters */}
                <aside className={`lg:w-64 shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                    <div className="card p-5 space-y-6 sticky top-20">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-dark-800">{t('filters')}</h3>
                            <button onClick={clearFilters} className="text-xs text-primary-600 hover:underline">{t('clear_all')}</button>
                        </div>

                        {/* Categories */}
                        <div>
                            <h4 className="text-sm font-medium text-dark-700 mb-3">{t('categories')}</h4>
                            <div className="space-y-2">
                                <button onClick={() => updateFilter('category', '')}
                                    className={`block text-sm w-full text-left px-3 py-1.5 rounded-lg transition-colors ${!filters.category ? 'bg-primary-50 text-primary-700 font-medium' : 'text-dark-500 hover:bg-dark-50'}`}>
                                    {t('all_categories')}
                                </button>
                                {categories.map(cat => (
                                    <button key={cat.id} onClick={() => updateFilter('category', cat.id)}
                                        className={`flex items-center gap-3 text-sm w-full text-left px-3 py-2 rounded-xl transition-all ${filters.category === cat.id ? 'bg-primary-600 text-white shadow-lg shadow-primary-200' : 'text-dark-600 hover:bg-dark-50'}`}>
                                        <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-dark-100">
                                            <img src={cat.image} alt="" className="w-full h-full object-cover" />
                                        </div>
                                        <span className="font-medium">{cat.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Price Range */}
                        <div>
                            <h4 className="text-sm font-medium text-dark-700 mb-3">{t('price_range') || 'Price Range'}</h4>
                            <div className="flex gap-2">
                                <input type="number" placeholder={t('min') || 'Min'} value={filters.minPrice} onChange={e => updateFilter('minPrice', e.target.value)}
                                    className="w-full px-3 py-2 text-sm bg-dark-50 rounded-lg border-none focus:outline-none focus:ring-2 focus:ring-primary-500" />
                                <span className="text-dark-400 self-center">-</span>
                                <input type="number" placeholder={t('max') || 'Max'} value={filters.maxPrice} onChange={e => updateFilter('maxPrice', e.target.value)}
                                    className="w-full px-3 py-2 text-sm bg-dark-50 rounded-lg border-none focus:outline-none focus:ring-2 focus:ring-primary-500" />
                            </div>
                        </div>

                        {/* Rating */}
                        <div>
                            <h4 className="text-sm font-medium text-dark-700 mb-3">{t('min_rating') || 'Min Rating'}</h4>
                            <div className="space-y-1.5">
                                {[4, 3, 2, 1].map(r => (
                                    <button key={r} onClick={() => updateFilter('minRating', String(r))}
                                        className={`flex items-center gap-2 text-sm w-full px-3 py-1.5 rounded-lg transition-colors ${filters.minRating === String(r) ? 'bg-primary-50 text-primary-700' : 'text-dark-500 hover:bg-dark-50'}`}>
                                        {'⭐'.repeat(r)} {t('and_up') || '& up'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* In Stock */}
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={filters.inStock === 'true'} onChange={e => updateFilter('inStock', e.target.checked ? 'true' : '')}
                                className="w-4 h-4 rounded border-dark-300 text-primary-600 focus:ring-primary-500" />
                            <span className="text-sm text-dark-600">{t('in_stock_only') || 'In Stock Only'}</span>
                        </label>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex-1">
                    {/* Top Bar */}
                    <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-dark-900">{filters.keyword ? `${t('search') || 'Search'}: "${filters.keyword}"` : t('all_products') || 'All Products'}</h1>
                            <p className="text-sm text-dark-400">{pagination.total} {t('products_found') || 'products found'}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => setShowFilters(!showFilters)} className="lg:hidden btn-secondary py-2 px-3 flex items-center gap-2">
                                <HiOutlineAdjustments className="w-5 h-5" /> {t('filters')}
                            </button>
                            <select value={filters.sort} onChange={e => updateFilter('sort', e.target.value)}
                                className="px-3 py-2 text-sm bg-dark-50 rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-primary-500">
                                <option value="newest">{t('newest') || 'Newest'}</option>
                                <option value="price_asc">{t('price_low_high') || 'Price: Low to High'}</option>
                                <option value="price_desc">{t('price_high_low') || 'Price: High to Low'}</option>
                                <option value="rating">{t('top_rated') || 'Top Rated'}</option>
                                <option value="best_selling">{t('best_selling') || 'Best Selling'}</option>
                            </select>
                            <div className="hidden sm:flex border border-dark-200 rounded-xl overflow-hidden">
                                <button onClick={() => setView('grid')} className={`p-2 ${view === 'grid' ? 'bg-primary-50 text-primary-600' : 'text-dark-400'}`}>
                                    <HiOutlineViewGrid className="w-5 h-5" />
                                </button>
                                <button onClick={() => setView('list')} className={`p-2 ${view === 'list' ? 'bg-primary-50 text-primary-600' : 'text-dark-400'}`}>
                                    <HiViewList className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Products */}
                    {loading ? <LoadingSkeleton type="card" count={8} /> : products.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="text-6xl mb-4">🔍</div>
                            <h3 className="text-xl font-semibold text-dark-700 mb-2">No products found</h3>
                            <p className="text-dark-400">Try adjusting your filters or search criteria.</p>
                        </div>
                    ) : (
                        <div className={`grid ${view === 'grid' ? 'grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6' : 'grid-cols-1 gap-4'}`}>
                            {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
                        </div>
                    )}

                    <Pagination page={pagination.page} pages={pagination.pages}
                        onPageChange={(p) => setPagination(prev => ({ ...prev, page: p }))} />
                </div>
            </div>
        </div>
    );
};

export default ProductCatalog;
