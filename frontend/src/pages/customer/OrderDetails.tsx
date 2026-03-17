import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlineTruck, HiOutlineCreditCard, HiOutlineClock } from 'react-icons/hi';
import api from '../../api/axiosClient';
import MapTracker from '../../components/MapTracker';
import type { Order } from '../../types';

const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800', paid: 'bg-blue-100 text-blue-800',
    processing: 'bg-indigo-100 text-indigo-800', shipped: 'bg-purple-100 text-purple-800',
    out_for_delivery: 'bg-cyan-100 text-cyan-800', delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800', returned: 'bg-orange-100 text-orange-800'
};

import { useTranslation } from 'react-i18next';

const OrderDetails = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const { id } = useParams<{ id: string }>();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [driverLocation, setDriverLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [destination, setDestination] = useState<{ lat: number, lng: number } | null>(null);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const { data } = await api.get(`/orders/${id}`);
                setOrder(data);

                // Initial sync from order data
                if (data.delivery && data.delivery.length > 0) {
                    const d = data.delivery[0];
                    if (d.currentLocationLat && d.currentLocationLng) {
                        setDriverLocation({ lat: d.currentLocationLat, lng: d.currentLocationLng });
                    }
                    if (d.deliveryLocationLat && d.deliveryLocationLng) {
                        setDestination({ lat: d.deliveryLocationLat, lng: d.deliveryLocationLng });
                    }
                    fetchDriverLocation();
                }
            } catch (err) {
                console.error(err);
            }
            setLoading(false);
        };

        const fetchDriverLocation = async () => {
            try {
                const { data } = await api.get(`/delivery/track/${id}`);
                if (data.currentLocation && typeof data.currentLocation.lat === 'number' && typeof data.currentLocation.lng === 'number') {
                    setDriverLocation({ lat: data.currentLocation.lat, lng: data.currentLocation.lng });
                }
                if (data.deliveryLocation && typeof data.deliveryLocation.lat === 'number' && typeof data.deliveryLocation.lng === 'number') {
                    setDestination({ lat: data.deliveryLocation.lat, lng: data.deliveryLocation.lng });
                }
            } catch (err) {
                console.error('Failed to fetch driver location', err);
            }
        };

        fetchOrder();

        let interval: any;
        // Poll for location updates if a delivery exists and is not yet delivered/cancelled
        const shouldPoll = order?.delivery && order.delivery.length > 0 &&
            !['delivered', 'cancelled', 'returned'].includes(order.status);

        if (shouldPoll) {
            interval = setInterval(fetchDriverLocation, 10000);
        }

        return () => clearInterval(interval);
    }, [id, order?.status, !!order?.delivery?.length]);

    if (loading) {
        return (
            <div className="page-container flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="page-container text-center py-20">
                <div className="text-6xl mb-4">⚠️</div>
                <h2 className="text-2xl font-bold text-dark-800 mb-2">Order Not Found</h2>
                <p className="text-dark-500 mb-6">We couldn't find the order you're looking for.</p>
                <Link to="/orders" className="btn-primary">Back to Orders</Link>
            </div>
        );
    }

    const isCOD = order.paymentMethod === 'cod';

    return (
        <div className="page-container max-w-4xl mx-auto">
            <Link to="/orders" className="inline-flex items-center gap-2 text-dark-500 hover:text-primary-600 mb-6 font-medium transition-colors">
                <HiOutlineArrowLeft className={isRtl ? 'rotate-180' : ''} /> {t('back_to_orders') || 'Back to Orders'}
            </Link>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-dark-900 mb-1">
                        {t('order_id')}: #{order.orderNumber}
                    </h1>
                    <p className="text-dark-500 flex items-center gap-2">
                        <HiOutlineClock className="w-4 h-4" />
                        {new Date(order.createdAt).toLocaleString('en-US', {
                            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                    </p>
                </div>
                <div className="flex gap-3 items-center">
                    <span className={`badge px-3 py-1.5 text-sm uppercase ${statusColors[order.status] || 'bg-gray-100 text-dark-800'}`}>
                        {order.status.replace(/_/g, ' ')}
                    </span>
                    {!order.paidAt && !isCOD && order.paymentMethod !== 'paypal' && (
                        <button className="btn-primary py-1.5 px-4 text-sm">Pay Now</button>
                    )}
                </div>
            </div>

            {/* Tracking Map & Shipping/Payment Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Shipping Details */}
                <div className="card p-5">
                    <h2 className="text-lg font-semibold text-dark-800 mb-4 flex items-center gap-2">
                        <HiOutlineTruck className="w-5 h-5 text-primary-600" /> {t('shipping_address')}
                    </h2>
                    <div className="bg-dark-50 rounded-xl p-4">
                        <p className="font-medium text-dark-800 text-lg mb-1">{order.shippingAddress.fullName}</p>
                        <p className="text-dark-600">{order.shippingAddress.street}</p>
                        <p className="text-dark-600">
                            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                        </p>
                        <p className="text-dark-600">{order.shippingAddress.country}</p>
                        <p className="text-dark-500 mt-2 text-sm flex items-center gap-2">
                            📞 {order.shippingAddress.phone}
                        </p>
                    </div>
                </div>

                {/* Tracking Map - Broadened Visibility */}
                <div className="card p-5 md:col-span-2">
                    <h2 className="text-lg font-semibold text-dark-800 mb-4 flex items-center gap-2">
                        <HiOutlineTruck className="w-5 h-5 text-primary-600" />
                        {['shipped', 'out_for_delivery'].includes(order.status) ? t('real_time_tracking') || 'Real-time Tracking' : t('delivery_destination') || 'Delivery Destination'}
                    </h2>
                    <MapTracker
                        driverLocation={driverLocation || { lat: 0, lng: 0 }}
                        destination={destination || { lat: 0, lng: 0 }}
                    />
                    {(!driverLocation || (driverLocation.lat === 0)) && ['shipped', 'out_for_delivery'].includes(order.status) && (
                        <p className="text-sm text-dark-400 mt-2 italic text-center">Waiting for driver to share location...</p>
                    )}
                    {(!destination || (destination.lat === 0)) && (
                        <p className="text-sm text-dark-400 mt-2 italic text-center">Destination marked on map will appear here.</p>
                    )}
                </div>

                {/* Payment Summary */}
                <div className="card p-5">
                    <h2 className="text-lg font-semibold text-dark-800 mb-4 flex items-center gap-2">
                        <HiOutlineCreditCard className="w-5 h-5 text-primary-600" /> {t('payment_details') || 'Payment Details'}
                    </h2>
                    <div className="space-y-3 mb-6">
                        <div className="flex justify-between items-center bg-dark-50 p-3 rounded-lg">
                            <span className="text-dark-600 font-medium">Method</span>
                            <span className="font-semibold text-dark-900 capitalize">
                                {isCOD ? 'Cash on Delivery' : order.paymentMethod}
                            </span>
                        </div>
                        <div className="flex justify-between items-center bg-dark-50 p-3 rounded-lg">
                            <span className="text-dark-600 font-medium">Status</span>
                            <span className={`badge ${order.paidAt ? 'bg-green-100 text-green-700' : isCOD ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                {order.paidAt ? 'Paid' : isCOD ? 'Pay on Delivery' : 'Unpaid'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Order Items */}
            <div className="card overflow-hidden">
                <div className="p-5 border-b border-dark-100 bg-dark-50/50">
                    <h2 className="text-lg font-semibold text-dark-800">{t('order_summary')}</h2>
                </div>
                <div className="p-5">
                    <div className="space-y-4 mb-6">
                        {order.items.map((item, i) => (
                            <div key={i} className="flex gap-4 p-3 rounded-xl hover:bg-dark-50 transition-colors border border-transparent hover:border-dark-100">
                                <img src={item.image || '/placeholder.png'} alt={item.name} className="w-20 h-20 rounded-lg object-cover bg-dark-100" />
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-dark-800 text-sm sm:text-base truncate">{item.name}</h3>
                                    {item.variant && (
                                        <p className="text-xs sm:text-sm text-dark-500 mt-1">
                                            {[item.variant.color, item.variant.size].filter(Boolean).join(' • ')}
                                        </p>
                                    )}
                                    <p className="text-xs text-dark-400 mt-1">Qty: {item.quantity}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-dark-900">${(item.price * item.quantity).toFixed(2)}</p>
                                    {item.quantity > 1 && <p className="text-xs text-dark-400 mt-1">${item.price.toFixed(2)} each</p>}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-dark-100 pt-4 space-y-2 max-w-sm ml-auto text-sm">
                        <div className="flex justify-between text-dark-600">
                            <span>Subtotal</span>
                            <span className="font-medium">${(order.itemsPrice || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-dark-600">
                            <span>Shipping</span>
                            <span className="font-medium">{order.shippingPrice === 0 ? 'Free' : `$${(order.shippingPrice || 0).toFixed(2)}`}</span>
                        </div>
                        <div className="flex justify-between text-dark-600">
                            <span>Tax</span>
                            <span className="font-medium">${(order.taxPrice || 0).toFixed(2)}</span>
                        </div>
                        {order.discountAmount > 0 && (
                            <div className="flex justify-between text-green-600">
                                <span>Discount</span>
                                <span className="font-medium">-${order.discountAmount.toFixed(2)}</span>
                            </div>
                        )}
                        <hr className="my-2 border-dark-100" />
                        <div className="flex justify-between text-lg font-bold text-dark-900">
                            <span>Total</span>
                            <span>${order.totalPrice.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetails;
