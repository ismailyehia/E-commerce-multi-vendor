import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineTrash, HiMinus, HiPlus, HiOutlineArrowRight } from 'react-icons/hi';
import { useAppSelector, useAppDispatch } from '../../hooks/useRedux';
import { fetchCart, updateCartItem, removeFromCart } from '../../store/slices/cartSlice';
import toast from 'react-hot-toast';
import type { RootState } from '../../store';
import type { CartItem, Variant } from '../../types';

import { useTranslation } from 'react-i18next';

const CartPage = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const items = useAppSelector((s: RootState) => s.cart.items);
    const couponDiscount = useAppSelector((s: RootState) => s.cart.couponDiscount);
    const { isAuthenticated } = useAppSelector((s: RootState) => s.auth);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    useEffect(() => { dispatch(fetchCart()); }, [dispatch]);

    const subtotal = items.reduce((sum: number, item: CartItem) => {
        const price = item.variant?.sku
            ? (item.product.variants?.find((v: Variant) => v.sku === item.variant!.sku)?.price || item.product.price)
            : item.product.price;
        return sum + price * item.quantity;
    }, 0);

    const shipping = subtotal > 100 ? 0 : 9.99;
    const tax = subtotal * 0.08;
    const total = subtotal + shipping + tax - couponDiscount;

    if (items.length === 0) {
        return (
            <div className="page-container text-center py-20">
                <div className="text-8xl mb-6">🛒</div>
                <h2 className="text-2xl font-bold text-dark-800 mb-3">{t('your_cart_is_empty')}</h2>
                <p className="text-dark-400 mb-6">{t('looks_like_empty') || "Looks like you haven't added anything yet"}</p>
                <Link to="/products" className="btn-primary">{t('continue_shopping')}</Link>
            </div>
        );
    }

    return (
        <div className="page-container">
            <h1 className="text-2xl sm:text-3xl font-bold text-dark-900 mb-8">{t('cart')}</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Items */}
                <div className="lg:col-span-2 space-y-4">
                    {items.map((item: CartItem, i: number) => (
                        <motion.div key={`${item.product.id}-${item.variant?.sku || i}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className="card p-4 flex gap-4">
                            <img src={item.product.thumbnail || item.product.images?.[0] || '/placeholder.png'} alt={item.product.name}
                                className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-xl" />
                            <div className="flex-1 min-w-0">
                                <Link to={`/product/${item.product.slug}`} className="font-medium text-dark-800 hover:text-primary-600 line-clamp-1">{item.product.name}</Link>
                                {item.variant && <p className="text-sm text-dark-400 mt-1">{[item.variant.color, item.variant.size].filter(Boolean).join(' / ')}</p>}
                                <p className="text-lg font-bold text-dark-900 mt-2">${(item.variant?.sku ? (item.product.variants?.find((v: Variant) => v.sku === item.variant!.sku)?.price || item.product.price) : item.product.price).toFixed(2)}</p>
                                <div className="flex items-center gap-3 mt-3">
                                    <div className="flex items-center border border-dark-200 rounded-lg overflow-hidden">
                                        <button onClick={() => dispatch(updateCartItem({ productId: item.product.id, sku: item.variant?.sku, quantity: item.quantity - 1 }))}
                                            className="p-1.5 text-dark-400 hover:bg-dark-50"><HiMinus className="w-4 h-4" /></button>
                                        <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                                        <button onClick={() => dispatch(updateCartItem({ productId: item.product.id, sku: item.variant?.sku, quantity: item.quantity + 1 }))}
                                            className="p-1.5 text-dark-400 hover:bg-dark-50"><HiPlus className="w-4 h-4" /></button>
                                    </div>
                                    <button onClick={() => { dispatch(removeFromCart({ productId: item.product.id, sku: item.variant?.sku })); toast.success(t('removed') || 'Removed'); }}
                                        className="text-dark-400 hover:text-danger-500 transition-colors"><HiOutlineTrash className="w-5 h-5" /></button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Summary */}
                <div className="card p-6 h-fit sticky top-20 space-y-4">
                    <h3 className="font-semibold text-dark-800 text-lg">{t('order_summary')}</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-dark-500">{t('subtotal')} ({items.reduce((s: number, i: CartItem) => s + i.quantity, 0)} {t('items')})</span>
                            <span className="font-medium">${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-dark-500">{t('shipping')}</span>
                            <span className="font-medium">{shipping === 0 ? <span className="text-success-500 uppercase">{t('free') || 'FREE'}</span> : `$${shipping.toFixed(2)}`}</span>
                        </div>
                        <div className="flex justify-between"><span className="text-dark-500">Tax</span><span className="font-medium">${tax.toFixed(2)}</span></div>
                        {couponDiscount > 0 && <div className="flex justify-between text-success-500"><span>Discount</span><span className="font-medium">-${couponDiscount.toFixed(2)}</span></div>}
                    </div>
                    <hr className="border-dark-100" />
                    <div className="flex justify-between text-lg font-bold"><span>{t('total')}</span><span>${total.toFixed(2)}</span></div>
                    {subtotal < 100 && <p className="text-xs text-dark-400 bg-primary-50 p-2 rounded-lg">{t('add_more_for_free_shipping') || `Add $${(100 - subtotal).toFixed(2)} more for free shipping!`}</p>}
                    <button onClick={() => isAuthenticated ? navigate('/checkout') : navigate('/login', { state: { from: { pathname: '/checkout' } } })}
                        className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                        {t('checkout')} <HiOutlineArrowRight className={`${isRtl ? 'rotate-180' : ''}`} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CartPage;
