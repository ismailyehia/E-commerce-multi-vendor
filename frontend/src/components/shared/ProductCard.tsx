import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineHeart, HiHeart, HiOutlineStar, HiStar } from 'react-icons/hi';
import type { Product } from '../../types';
import { useAppSelector, useAppDispatch } from '../../hooks/useRedux';
import { addToCart } from '../../store/slices/cartSlice';
import api from '../../api/axiosClient';
import { setUser } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { getImageUrl } from '../../utils/imageUtils';

interface Props { product: Product; index?: number; }

const ProductCard = ({ product, index = 0 }: Props) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const { user, isAuthenticated } = useAppSelector(s => s.auth);
    const dispatch = useAppDispatch();
    const isWishlisted = isAuthenticated && user?.wishlist && (user.wishlist as any[]).some((p: any) => (typeof p === 'string' ? p : p.id) === product.id);
    const discount = product.comparePrice ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100) : 0;
    const inStock = product.totalStock > 0 || product.variants?.some(v => v.stock > 0);

    const handleWishlist = async (e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        if (!isAuthenticated) return toast.error(t('please_login_first') || 'Please login first');
        console.log(`[Wishlist] Requesting toggle for product: ${product.id} at ${new Date().toISOString()}`);
        try {
            const { data } = await api.post(`/users/wishlist/${product.id}`);
            console.log('[Wishlist] Success response:', data);
            dispatch(setUser(data));
            toast.success(isWishlisted ? (t('removed_from_wishlist') || 'Removed from wishlist') : (t('added_to_wishlist') || 'Added to wishlist'));
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

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        const defaultVariant = product.variants?.[0];
        dispatch(addToCart({ productId: product.id, variant: defaultVariant ? { size: defaultVariant.size, color: defaultVariant.color, sku: defaultVariant.sku } : undefined }));
        toast.success(t('added_to_cart') || 'Added to cart!');
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05, duration: 0.3 }}>
            <Link to={`/product/${product.slug}`} className="group card block overflow-hidden">
                {/* Image */}
                <div className="relative aspect-square bg-dark-50 overflow-hidden">
                    <img src={getImageUrl(product.thumbnail || product.images?.[0])} alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    {discount > 0 && (
                        <span className={`absolute top-3 ${isRtl ? 'right-3' : 'left-3'} px-2.5 py-1 bg-accent-500 text-white text-xs font-bold rounded-lg shadow-sm z-10`}>-{discount}%</span>
                    )}
                    {!inStock && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px] z-10">
                            <span className="text-white font-bold tracking-wide uppercase text-sm">{t('out_of_stock')}</span>
                        </div>
                    )}
                    <button onClick={handleWishlist} className={`absolute top-3 ${isRtl ? 'left-3' : 'right-3'} w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-transform z-10 backdrop-blur-sm`}>
                        {isWishlisted ? <HiHeart className="w-5 h-5 text-red-500" /> : <HiOutlineHeart className="w-5 h-5 text-dark-400" />}
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-10">
                        <button onClick={handleAddToCart} disabled={!inStock}
                            className="w-full py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:bg-dark-300 disabled:cursor-not-allowed transition-all shadow-lg active:scale-[0.98]">
                            {t('add_to_cart')}
                        </button>
                    </div>
                </div>

                {/* Info */}
                <div className="p-4">
                    <p className="text-xs text-dark-400 mb-1">{typeof product.category === 'object' ? product.category.name : ''}</p>
                    <h3 className="text-sm font-medium text-dark-800 line-clamp-2 mb-2 group-hover:text-primary-600 transition-colors min-h-[2.5rem]">{product.name}</h3>
                    <div className="flex items-center gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map(star => (
                            star <= Math.round(product.avgRating)
                                ? <HiStar key={star} className="w-3.5 h-3.5 text-yellow-400" />
                                : <HiOutlineStar key={star} className="w-3.5 h-3.5 text-dark-300" />
                        ))}
                        <span className="text-xs text-dark-400 ml-1">({product.numReviews})</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-dark-900">${product.price.toFixed(2)}</span>
                        {product.comparePrice && product.comparePrice > product.price && (
                            <span className="text-sm text-dark-400 line-through">${product.comparePrice.toFixed(2)}</span>
                        )}
                    </div>
                </div>
            </Link>
        </motion.div>
    );
};

export default ProductCard;
