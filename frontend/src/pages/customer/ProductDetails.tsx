import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiStar, HiOutlineStar, HiOutlineHeart, HiHeart, HiMinus, HiPlus, HiOutlineTruck, HiOutlineShieldCheck, HiOutlineRefresh } from 'react-icons/hi';
import api from '../../api/axiosClient';
import type { Product, Review } from '../../types';
import { useAppSelector, useAppDispatch } from '../../hooks/useRedux';
import { addToCart } from '../../store/slices/cartSlice';
import { setUser } from '../../store/slices/authSlice';
import ProductCard from '../../components/shared/ProductCard';
import LoadingSkeleton from '../../components/shared/LoadingSkeleton';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const ProductDetails = () => {
    const { t } = useTranslation();
    const { slug } = useParams();
    const [product, setProduct] = useState<Product | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [recommendations, setRecommendations] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedVariant, setSelectedVariant] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState<'description' | 'reviews'>('description');
    const { user, isAuthenticated } = useAppSelector(s => s.auth);
    const dispatch = useAppDispatch();
    const isWishlisted = isAuthenticated && user?.wishlist && product && (user.wishlist as any[]).some((p: any) => (typeof p === 'string' ? p : p.id) === product.id);

    useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true);
            try {
                const { data } = await api.get(`/products/${slug}`);
                setProduct(data);
                const [revRes, recRes] = await Promise.all([
                    api.get(`/reviews/product/${data.id}`),
                    api.get(`/products/${data.id}/recommendations`)
                ]);
                setReviews(revRes.data.reviews || []);
                setRecommendations(recRes.data || []);
            } catch { toast.error(t('product_not_found') || 'Product not found'); }
            setLoading(false);
        };
        if (slug) fetchProduct();
    }, [slug]);

    if (loading) return <div className="page-container"><LoadingSkeleton type="detail" /></div>;
    if (!product) return <div className="page-container text-center py-20"><h2 className="text-2xl font-bold">{t('product_not_found') || 'Product not found'}</h2></div>;

    const currentVariant = product.variants?.[selectedVariant];
    const currentPrice = currentVariant?.price || product.price;
    const inStock = currentVariant ? currentVariant.stock > 0 : product.totalStock > 0;
    const discount = product.comparePrice ? Math.round(((product.comparePrice - currentPrice) / product.comparePrice) * 100) : 0;

    const handleAddToCart = () => {
        dispatch(addToCart({ productId: product.id, variant: currentVariant ? { size: currentVariant.size, color: currentVariant.color, sku: currentVariant.sku } : undefined, quantity }));
        toast.success(t('added_to_cart') || 'Added to cart!');
    };

    const handleWishlist = async () => {
        if (!isAuthenticated) return toast.error('Please login first');
        console.log(`[Wishlist] Requesting toggle from Details for product: ${product.id} at ${new Date().toISOString()}`);
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

    const uniqueColors = [...new Set(product.variants?.map(v => v.color).filter(Boolean))];
    const uniqueSizes = [...new Set(product.variants?.map(v => v.size).filter(Boolean))];

    return (
        <div className="page-container">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                {/* Images */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <div className="aspect-square bg-dark-50 rounded-2xl overflow-hidden mb-4">
                        <img src={product.images?.[selectedImage] || '/placeholder.png'} alt={product.name}
                            className="w-full h-full object-cover" />
                    </div>
                    {product.images?.length > 1 && (
                        <div className="flex gap-3 overflow-x-auto pb-2">
                            {product.images.map((img, i) => (
                                <button key={i} onClick={() => setSelectedImage(i)}
                                    className={`w-20 h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-colors ${i === selectedImage ? 'border-primary-500' : 'border-transparent'}`}>
                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* Info */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                    <div>
                        {typeof product.category === 'object' && (
                            <Link to={`/products?category=${product.category.id}`} className="text-sm text-primary-600 hover:underline">{product.category.name}</Link>
                        )}
                        <h1 className="text-2xl sm:text-3xl font-bold text-dark-900 mt-1">{product.name}</h1>
                        {product.brand && <p className="text-dark-400 mt-1">by <span className="font-medium text-dark-600">{product.brand}</span></p>}
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-2">
                        <div className="flex">{[1, 2, 3, 4, 5].map(s => s <= Math.round(product.avgRating) ? <HiStar key={s} className="w-5 h-5 text-yellow-400" /> : <HiOutlineStar key={s} className="w-5 h-5 text-dark-300" />)}</div>
                        <span className="text-sm font-medium text-dark-600">{product.avgRating?.toFixed(1)}</span>
                        <span className="text-sm text-dark-400">({product.numReviews} {t('reviews')})</span>
                        <span className="text-sm text-dark-400 ms-2">{product.totalSold} {t('sold') || 'sold'}</span>
                    </div>

                    {/* Price */}
                    <div className="flex items-center gap-3">
                        <span className="text-3xl font-bold text-dark-900">${currentPrice.toFixed(2)}</span>
                        {product.comparePrice && product.comparePrice > currentPrice && (
                            <><span className="text-lg text-dark-400 line-through">${product.comparePrice.toFixed(2)}</span>
                                <span className="badge bg-accent-100 text-accent-600 font-semibold">-{discount}% OFF</span></>
                        )}
                    </div>

                    {/* Colors */}
                    {uniqueColors.length > 0 && (
                        <div>
                            <p className="text-sm font-medium text-dark-700 mb-2">Color: <span className="text-dark-500">{currentVariant?.color}</span></p>
                            <div className="flex gap-2">
                                {uniqueColors.map((color, i) => {
                                    const vi = product.variants.findIndex(v => v.color === color);
                                    return (
                                        <button key={i} onClick={() => setSelectedVariant(vi)}
                                            className={`px-4 py-2 rounded-xl text-sm border transition-colors ${vi === selectedVariant ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-dark-200 text-dark-600 hover:border-dark-400'}`}>
                                            {color}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Sizes */}
                    {uniqueSizes.length > 0 && (
                        <div>
                            <p className="text-sm font-medium text-dark-700 mb-2">{t('size') || 'Size'}: <span className="text-dark-500">{currentVariant?.size}</span></p>
                            <div className="flex flex-wrap gap-2">
                                {uniqueSizes.map((size, i) => {
                                    const vi = product.variants.findIndex(v => v.size === size && v.color === currentVariant?.color);
                                    if (vi === -1) return null;
                                    const variant = product.variants[vi];
                                    return (
                                        <button key={i} onClick={() => setSelectedVariant(vi)} disabled={variant.stock === 0}
                                            className={`min-w-[3rem] px-3 py-2 rounded-xl text-sm border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${vi === selectedVariant ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-dark-200 text-dark-600 hover:border-dark-400'}`}>
                                            {size}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Quantity & Add to Cart */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center border border-dark-200 rounded-xl overflow-hidden">
                            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2.5 text-dark-400 hover:bg-dark-50"><HiMinus className="w-4 h-4" /></button>
                            <span className="w-12 text-center font-medium text-dark-800">{quantity}</span>
                            <button onClick={() => setQuantity(quantity + 1)} className="p-2.5 text-dark-400 hover:bg-dark-50"><HiPlus className="w-4 h-4" /></button>
                        </div>
                        <button onClick={handleAddToCart} disabled={!inStock} className="btn-primary flex-1 py-3 disabled:bg-dark-300">
                            {inStock ? t('add_to_cart') : t('out_of_stock')}
                        </button>
                        <button onClick={handleWishlist} className="p-3 border border-dark-200 rounded-xl hover:bg-dark-50 transition-colors">
                            {isWishlisted ? <HiHeart className="w-6 h-6 text-accent-500" /> : <HiOutlineHeart className="w-6 h-6 text-dark-400" />}
                        </button>
                    </div>

                    {/* Features */}
                    <div className="grid grid-cols-3 gap-3 pt-4 border-t border-dark-100">
                        {[{ icon: HiOutlineTruck, text: 'Free Shipping' }, { icon: HiOutlineShieldCheck, text: 'Secure Payment' }, { icon: HiOutlineRefresh, text: '30-Day Return' }].map((f, i) => (
                            <div key={i} className="text-center">
                                <f.icon className="w-6 h-6 mx-auto text-primary-500 mb-1" />
                                <p className="text-xs text-dark-500">{f.text}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Tabs */}
            <div className="mt-12">
                <div className="flex gap-6 border-b border-dark-200 mb-6">
                    {['description', 'reviews'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab as any)}
                            className={`pb-3 text-sm font-medium capitalize transition-colors ${activeTab === tab ? 'text-primary-600 border-b-2 border-primary-600' : 'text-dark-400 hover:text-dark-600'}`}>
                            {tab} {tab === 'reviews' && `(${product.numReviews})`}
                        </button>
                    ))}
                </div>

                {activeTab === 'description' ? (
                    <div className="prose max-w-none text-dark-600 leading-relaxed"><p>{product.description}</p></div>
                ) : (
                    <div className="space-y-4">
                        {reviews.length === 0 ? <p className="text-dark-400">{t('no_reviews_yet') || 'No reviews yet.'}</p> :
                            reviews.map(r => (
                                <div key={r.id} className="card p-4 sm:p-5">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center"><span className="font-medium text-primary-700">{r.user?.name?.[0]}</span></div>
                                        <div>
                                            <p className="font-medium text-dark-800">{r.user?.name} {r.isVerifiedPurchase && <span className="badge-success text-xs ml-2">Verified</span>}</p>
                                            <div className="flex">{[1, 2, 3, 4, 5].map(s => s <= r.rating ? <HiStar key={s} className="w-4 h-4 text-yellow-400" /> : <HiOutlineStar key={s} className="w-4 h-4 text-dark-300" />)}</div>
                                        </div>
                                        <span className="ml-auto text-xs text-dark-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    {r.title && <p className="font-medium text-dark-700 mb-1">{r.title}</p>}
                                    <p className="text-dark-500 text-sm">{r.comment}</p>
                                </div>
                            ))}
                    </div>
                )}
            </div>

            {/* Recommendations */}
            {recommendations.length > 0 && (
                <section className="mt-16">
                    <h2 className="text-2xl font-bold text-dark-900 mb-6">{t('related_products')}</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                        {recommendations.slice(0, 4).map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
                    </div>
                </section>
            )}
        </div>
    );
};

export default ProductDetails;
