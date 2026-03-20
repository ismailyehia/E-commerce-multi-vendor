import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineHeart, HiOutlineTrash } from 'react-icons/hi';
import api from '../../api/axiosClient';
import type { Product } from '../../types';
import { useAppDispatch } from '../../hooks/useRedux';
import { setUser } from '../../store/slices/authSlice';
import { addToCart } from '../../store/slices/cartSlice';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { getImageUrl } from '../../utils/imageUtils';

const WishlistPage = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const dispatch = useAppDispatch();

    const fetchWishlist = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/users/wishlist');
            setProducts(data);
        } catch { setProducts([]); }
        setLoading(false);
    };

    useEffect(() => { fetchWishlist(); }, []);

    const handleRemove = async (productId: string) => {
        console.log(`[Wishlist] Requesting removal for product: ${productId} at ${new Date().toISOString()}`);
        try {
            const { data } = await api.post(`/users/wishlist/${productId}`);
            console.log('[Wishlist] Success response:', data);
            setProducts(prev => prev.filter(p => p.id !== productId));
            dispatch(setUser(data));
            toast.success(t('removed_from_wishlist') || 'Removed from wishlist');
        } catch (err: any) {
            console.error('[Wishlist ERROR]', {
                message: err.message,
                status: err.response?.status,
                data: err.response?.data,
                stack: err.stack
            });
            toast.error(err.response?.data?.message || t('failed_to_update_wishlist') || 'Failed to update wishlist');
        }
    };

    const handleAddToCart = (product: Product) => {
        const v = product.variants?.[0];
        dispatch(addToCart({ productId: product.id, variant: v ? { size: v.size, color: v.color, sku: v.sku } : undefined }));
        toast.success(t('added_to_cart') || 'Added to cart!');
    };

    if (loading) return (
        <div className="page-container">
            <h1 className="text-2xl font-bold text-dark-900 mb-8">{t('wishlist')}</h1>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array(4).fill(0).map((_, i) => <div key={i} className="card overflow-hidden"><div className="aspect-square skeleton" /><div className="p-4 space-y-3"><div className="h-4 skeleton" /><div className="h-4 skeleton w-2/3" /></div></div>)}
            </div>
        </div>
    );

    return (
        <div className="page-container">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-dark-900">{t('wishlist')}</h1>
                    <p className="text-dark-400 mt-1">{products.length} {t('items')}</p>
                </div>
            </div>

            {products.length === 0 ? (
                <div className="text-center py-20">
                    <HiOutlineHeart className="w-16 h-16 text-dark-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-dark-700 mb-2">{t('your_wishlist_is_empty') || 'Your wishlist is empty'}</h3>
                    <p className="text-dark-400 mb-4">{t('browse_favorites_desc') || 'Browse products and add your favorites here'}</p>
                    <Link to="/products" className="btn-primary">{t('browse_products') || 'Browse Products'}</Link>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                    {products.map((product, i) => (
                        <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                            className="card overflow-hidden group">
                            <Link to={`/product/${product.slug}`} className="block">
                                <div className="relative aspect-square bg-dark-50 overflow-hidden">
                                    <img src={getImageUrl(product.thumbnail || product.images?.[0])} alt={product.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    {product.comparePrice && product.comparePrice > product.price && (
                                        <span className={`absolute top-3 ${isRtl ? 'right-3' : 'left-3'} px-2 py-1 bg-accent-500 text-white text-xs font-bold rounded-lg`}>
                                            -{Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)}%
                                        </span>
                                    )}
                                </div>
                            </Link>
                            <div className="p-4">
                                <Link to={`/product/${product.slug}`} className="text-sm font-medium text-dark-800 line-clamp-2 hover:text-primary-600 min-h-[2.5rem] block">{product.name}</Link>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-lg font-bold text-dark-900">${product.price.toFixed(2)}</span>
                                    {product.comparePrice && product.comparePrice > product.price && (
                                        <span className="text-sm text-dark-400 line-through">${product.comparePrice.toFixed(2)}</span>
                                    )}
                                </div>
                                <div className="flex gap-2 mt-3">
                                    <button onClick={() => handleAddToCart(product)} className="flex-1 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors">
                                        {t('add_to_cart')}
                                    </button>
                                    <button onClick={() => handleRemove(product.id)} className="p-2 border border-dark-200 rounded-xl hover:bg-red-50 hover:border-red-200 transition-colors">
                                        <HiOutlineTrash className="w-4 h-4 text-dark-400 hover:text-red-500" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default WishlistPage;
