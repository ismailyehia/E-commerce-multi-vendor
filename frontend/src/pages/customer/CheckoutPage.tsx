import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineTruck, HiOutlineCreditCard, HiOutlineCheck, HiOutlinePlus } from 'react-icons/hi';
import { useAppSelector, useAppDispatch } from '../../hooks/useRedux';
import { fetchCart, clearCartState } from '../../store/slices/cartSlice';
import type { RootState } from '../../store';
import { fetchMe } from '../../store/slices/authSlice';
import api from '../../api/axiosClient';
import toast from 'react-hot-toast';
import type { Address, CartItem } from '../../types';
import { useTranslation } from 'react-i18next';

const CheckoutPage = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const { items, couponDiscount } = useAppSelector((s: RootState) => s.cart);
    const { user } = useAppSelector((s: RootState) => s.auth);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal' | 'cod'>('stripe');
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [newAddress, setNewAddress] = useState<Partial<Address>>({
        label: 'Home', fullName: '', phone: '', street: '', city: '', state: '', zipCode: '', country: 'US', isDefault: false
    });

    useEffect(() => { dispatch(fetchCart()); }, [dispatch]);

    const addresses = user?.addresses || [];
    const subtotal = items.reduce((sum: number, item: CartItem) => {
        const variantSku = item.variant?.sku;
        const price = variantSku ? (item.product.variants?.find((v: any) => v.sku === variantSku)?.price || item.product.price) : item.product.price;
        return sum + price * item.quantity;
    }, 0);
    const shipping = subtotal > 100 ? 0 : 9.99;
    const tax = subtotal * 0.08;
    const total = subtotal + shipping + tax - couponDiscount;

    const handleAddAddress = async () => {
        try {
            await api.put('/auth/profile', { addresses: [...addresses, { ...newAddress, isDefault: addresses.length === 0 }] });
            await dispatch(fetchMe());
            setShowAddressForm(false);
            toast.success(t('address_added') || 'Address added');
        } catch { toast.error(t('failed_to_add_address') || 'Failed to add address'); }
    };

    const handlePlaceOrder = async () => {
        if (addresses.length === 0) return toast.error(t('please_add_shipping_address') || 'Please add a shipping address');
        setLoading(true);
        try {
            const { data } = await api.post('/orders', {
                shippingAddress: addresses[selectedAddress],
                paymentMethod,
                couponCode: undefined
            });

            if (paymentMethod === 'stripe') {
                await api.post('/payments/stripe/create-intent', { orderId: data.id });
                toast.success(t('order_placed_redirecting') || 'Order placed! Redirecting to payment...');
                navigate(`/orders/${data.id}`);
            } else if (paymentMethod === 'paypal') {
                toast.success(t('order_placed_paypal') || 'Order placed! Complete PayPal payment.');
                navigate(`/orders/${data.id}`);
            } else {
                toast.success(t('order_placed_success') || 'Order placed successfully!');
                navigate(`/orders/${data.id}`);
            }
            dispatch(clearCartState());
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to place order');
        }
        setLoading(false);
    };

    if (items.length === 0) {
        return (
            <div className="page-container text-center py-20">
                <div className="text-8xl mb-6">🛒</div>
                <h2 className="text-2xl font-bold text-dark-800 mb-3">{t('your_cart_is_empty')}</h2>
                <button onClick={() => navigate('/products')} className="btn-primary">{t('continue_shopping')}</button>
            </div>
        );
    }

    return (
        <div className="page-container">
            <h1 className="text-2xl sm:text-3xl font-bold text-dark-900 mb-8">{t('checkout')}</h1>

            {/* Steps */}
            <div className={`flex items-center justify-center mb-10 gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                {['shipping', 'payment', 'review'].map((s_key, i) => (
                    <div key={s_key} className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
              ${step > i + 1 ? 'bg-green-500 text-white' : step === i + 1 ? 'bg-primary-600 text-white' : 'bg-dark-200 text-dark-400'}`}>
                            {step > i + 1 ? <HiOutlineCheck className="w-4 h-4" /> : i + 1}
                        </div>
                        <span className={`text-sm font-medium hidden sm:block ${step >= i + 1 ? 'text-dark-800' : 'text-dark-400'}`}>{t(s_key)}</span>
                        {i < 2 && <div className={`w-12 sm:w-20 h-0.5 ${step > i + 1 ? 'bg-green-500' : 'bg-dark-200'} ${isRtl ? 'hidden sm:block' : ''}`} />}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    {/* Step 1: Shipping */}
                    {step === 1 && (
                        <motion.div initial={isRtl ? { opacity: 0, x: 20 } : { opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="card p-6">
                            <h2 className={`text-lg font-semibold text-dark-800 mb-4 flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}><HiOutlineTruck className="w-5 h-5" /> {t('shipping_address')}</h2>
                            <div className="space-y-3">
                                {addresses.map((addr, i) => (
                                    <label key={i} className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedAddress === i ? 'border-primary-500 bg-primary-50' : 'border-dark-200 hover:border-dark-300'}`}>
                                        <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse text-right' : ''}`}>
                                            <input type="radio" name="address" checked={selectedAddress === i} onChange={() => setSelectedAddress(i)}
                                                className="w-4 h-4 text-primary-600" />
                                            <div>
                                                <p className="font-medium text-dark-800">{addr.fullName} <span className={`badge-info ${isRtl ? 'mr-2' : 'ml-2'}`}>{addr.label}</span></p>
                                                <p className="text-sm text-dark-500">{addr.street}, {addr.city}, {addr.state} {addr.zipCode}</p>
                                                <p className="text-sm text-dark-400">{addr.phone}</p>
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>

                            {showAddressForm ? (
                                <div className="mt-4 p-4 bg-dark-50 rounded-xl space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <input placeholder="Full Name" value={newAddress.fullName} onChange={e => setNewAddress({ ...newAddress, fullName: e.target.value })} className="input-field" />
                                        <input placeholder="Phone" value={newAddress.phone} onChange={e => setNewAddress({ ...newAddress, phone: e.target.value })} className="input-field" />
                                    </div>
                                    <input placeholder="Street Address" value={newAddress.street} onChange={e => setNewAddress({ ...newAddress, street: e.target.value })} className="input-field" />
                                    <div className="grid grid-cols-3 gap-3">
                                        <input placeholder="City" value={newAddress.city} onChange={e => setNewAddress({ ...newAddress, city: e.target.value })} className="input-field" />
                                        <input placeholder="State" value={newAddress.state} onChange={e => setNewAddress({ ...newAddress, state: e.target.value })} className="input-field" />
                                        <input placeholder="ZIP Code" value={newAddress.zipCode} onChange={e => setNewAddress({ ...newAddress, zipCode: e.target.value })} className="input-field" />
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={handleAddAddress} className="btn-primary py-2 text-sm">{t('save_address') || 'Save Address'}</button>
                                        <button onClick={() => setShowAddressForm(false)} className="btn-secondary py-2 text-sm">{t('cancel')}</button>
                                    </div>
                                </div>
                            ) : (
                                <button onClick={() => setShowAddressForm(true)} className={`mt-4 flex items-center gap-2 text-primary-600 text-sm font-medium hover:underline ${isRtl ? 'flex-row-reverse' : ''}`}>
                                    <HiOutlinePlus className="w-4 h-4" /> {t('add_new_address') || 'Add New Address'}
                                </button>
                            )}

                            <button onClick={() => { if (addresses.length === 0) return toast.error(t('please_add_shipping_address') || 'Please add a shipping address'); setStep(2); }}
                                className="btn-primary w-full mt-6 py-3">{t('continue_to_payment') || 'Continue to Payment'}</button>
                        </motion.div>
                    )}

                    {/* Step 2: Payment */}
                    {step === 2 && (
                        <motion.div initial={isRtl ? { opacity: 0, x: 20 } : { opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="card p-6">
                            <h2 className={`text-lg font-semibold text-dark-800 mb-4 flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}><HiOutlineCreditCard className="w-5 h-5" /> {t('payment_method')}</h2>
                            <div className="space-y-3">
                                {[
                                    { id: 'stripe' as const, icon: '💳', label: t('credit_debit_card') || 'Credit / Debit Card', desc: t('secure_stripe') || 'Secure payment via Stripe' },
                                    { id: 'paypal' as const, icon: '🅿️', label: 'PayPal', desc: t('pay_paypal_desc') || 'Pay with your PayPal account' },
                                    { id: 'cod' as const, icon: '💵', label: t('cash_on_delivery') || 'Cash on Delivery', desc: t('pay_on_receive') || 'Pay when you receive your order' }
                                ].map(m => (
                                    <label key={m.id} className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === m.id ? 'border-primary-500 bg-primary-50' : 'border-dark-200 hover:border-dark-300'}`}>
                                        <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse text-right' : ''}`}>
                                            <input type="radio" name="payment" checked={paymentMethod === m.id} onChange={() => setPaymentMethod(m.id)} className="w-4 h-4 text-primary-600" />
                                            <span className="text-2xl">{m.icon}</span>
                                            <div><p className="font-medium text-dark-800">{m.label}</p><p className="text-sm text-dark-400">{m.desc}</p></div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                            <div className={`flex gap-3 mt-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                <button onClick={() => setStep(1)} className="btn-secondary flex-1 py-3">{t('back') || 'Back'}</button>
                                <button onClick={() => setStep(3)} className="btn-primary flex-1 py-3">{t('review_order') || 'Review Order'}</button>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 3: Review */}
                    {step === 3 && (
                        <motion.div initial={isRtl ? { opacity: 0, x: 20 } : { opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className={`card p-6 ${isRtl ? 'text-right' : ''}`}>
                            <h2 className="text-lg font-semibold text-dark-800 mb-4">{t('review_your_order') || 'Review Your Order'}</h2>
                            <div className="mb-6">
                                <h3 className="text-sm font-medium text-dark-500 mb-2">{t('shipping_to') || 'Shipping to'}:</h3>
                                <p className="text-dark-800 font-medium">{addresses[selectedAddress]?.fullName}</p>
                                <p className="text-sm text-dark-500">{addresses[selectedAddress]?.street}, {addresses[selectedAddress]?.city}, {addresses[selectedAddress]?.state} {addresses[selectedAddress]?.zipCode}</p>
                            </div>
                            <div className="mb-6">
                                <h3 className="text-sm font-medium text-dark-500 mb-2">{t('payment')}: <span className="text-primary-600 capitalize">{paymentMethod === 'cod' ? t('cash_on_delivery') : paymentMethod}</span></h3>
                            </div>
                            <div className="space-y-3 mb-6">
                                {items.map((item: CartItem, i: number) => (
                                    <div key={i} className="flex items-center gap-3 py-2 border-b border-dark-50 last:border-0">
                                        <img src={item.product.thumbnail || item.product.images?.[0] || '/placeholder.png'} alt="" className="w-14 h-14 rounded-lg object-cover" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-dark-800 truncate">{item.product.name}</p>
                                            {item.variant && <p className="text-xs text-dark-400">{[item.variant.color, item.variant.size].filter(Boolean).join(' / ')}</p>}
                                        </div>
                                        <span className="text-sm text-dark-500">x{item.quantity}</span>
                                        <span className="text-sm font-semibold text-dark-800">${((item.variant?.sku ? (item.product.variants?.find((v: any) => v.sku === item.variant?.sku)?.price || item.product.price) : item.product.price) * item.quantity).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className={`flex gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                <button onClick={() => setStep(2)} className="btn-secondary flex-1 py-3">{t('back') || 'Back'}</button>
                                <button onClick={handlePlaceOrder} disabled={loading} className="btn-primary flex-1 py-3">
                                    {loading ? <span className="flex items-center justify-center gap-2"><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {t('placing_order') || 'Placing Order...'}</span> : `${t('place_order') || 'Place Order'} — $${total.toFixed(2)}`}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Order Summary Sidebar */}
                <div className={`card p-6 h-fit sticky top-20 ${isRtl ? 'text-right' : ''}`}>
                    <h3 className="font-semibold text-dark-800 text-lg mb-4">{t('order_summary')}</h3>
                    <div className="space-y-3 text-sm">
                        <div className={`flex justify-between ${isRtl ? 'flex-row-reverse' : ''}`}><span className="text-dark-500">{t('subtotal')} ({items.reduce((s: number, i: CartItem) => s + i.quantity, 0)} {t('items')})</span><span className="font-medium">${subtotal.toFixed(2)}</span></div>
                        <div className={`flex justify-between ${isRtl ? 'flex-row-reverse' : ''}`}><span className="text-dark-500">{t('shipping')}</span><span className="font-medium">{shipping === 0 ? <span className="text-green-500">{t('free')}</span> : `$${shipping.toFixed(2)}`}</span></div>
                        <div className={`flex justify-between ${isRtl ? 'flex-row-reverse' : ''}`}><span className="text-dark-500">{t('tax') || 'Tax'}</span><span className="font-medium">${tax.toFixed(2)}</span></div>
                        {couponDiscount > 0 && <div className={`flex justify-between text-green-500 ${isRtl ? 'flex-row-reverse' : ''}`}><span>{t('discount') || 'Discount'}</span><span>-${couponDiscount.toFixed(2)}</span></div>}
                    </div>
                    <hr className="my-4 border-dark-100" />
                    <div className={`flex justify-between text-lg font-bold ${isRtl ? 'flex-row-reverse' : ''}`}><span>{t('total')}</span><span>${total.toFixed(2)}</span></div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
