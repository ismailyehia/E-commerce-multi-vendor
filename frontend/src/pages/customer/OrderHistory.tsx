import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../api/axiosClient';
import type { Order, Pagination as PT } from '../../types';
import Pagination from '../../components/shared/Pagination';
import { useTranslation } from 'react-i18next';

const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800', paid: 'bg-blue-100 text-blue-800',
    processing: 'bg-indigo-100 text-indigo-800', shipped: 'bg-purple-100 text-purple-800',
    out_for_delivery: 'bg-cyan-100 text-cyan-800', delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800', returned: 'bg-orange-100 text-orange-800'
};

const OrderHistory = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const [orders, setOrders] = useState<Order[]>([]);
    const [pagination, setPagination] = useState<PT>({ page: 1, limit: 10, total: 0, pages: 0 });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams({ page: String(pagination.page), limit: '10' });
                if (filter) params.set('status', filter);
                const { data } = await api.get(`/orders/mine?${params}`);
                setOrders(data.orders || []);
                setPagination(data.pagination);
            } catch { }
            setLoading(false);
        };
        fetchOrders();
    }, [pagination.page, filter]);

    return (
        <div className="page-container">
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-dark-900">{t('orders')}</h1>
                <div className="flex gap-2 overflow-x-auto">
                    {['', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => (
                        <button key={s} onClick={() => { setFilter(s); setPagination(p => ({ ...p, page: 1 })); }}
                            className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${filter === s ? 'bg-primary-600 text-white' : 'bg-dark-100 text-dark-600 hover:bg-dark-200'}`}>
                            {s ? (t(`status_${s}`) || s.charAt(0).toUpperCase() + s.slice(1)) : t('all')}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="space-y-4">{Array(3).fill(0).map((_, i) => (
                    <div key={i} className="card p-5 animate-pulse"><div className="h-4 skeleton w-1/4 mb-3" /><div className="h-3 skeleton w-1/2 mb-2" /><div className="h-3 skeleton w-1/3" /></div>
                ))}</div>
            ) : orders.length === 0 ? (
                <div className="text-center py-20"><div className="text-6xl mb-4">📦</div><h3 className="text-xl font-semibold text-dark-700">{t('no_orders_yet') || 'No orders yet'}</h3>
                    <p className="text-dark-400 mt-2 mb-4">{t('start_shopping_desc') || 'Start shopping to see your orders here'}</p><Link to="/products" className="btn-primary">{t('shop_now')}</Link></div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order, i) => (
                        <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                            <Link to={`/orders/${order.id}`} className="card p-5 block hover:shadow-lg transition-shadow">
                                <div className="flex items-center justify-between flex-wrap gap-3">
                                    <div>
                                        <p className="font-semibold text-dark-800">{t('order_id')}: {order.orderNumber}</p>
                                        <p className="text-sm text-dark-400">{new Date(order.createdAt).toLocaleDateString(i18n.language, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                    </div>
                                    <div className={`${isRtl ? 'text-left' : 'text-right'}`}>
                                        <span className={`badge ${statusColors[order.status] || 'bg-gray-100'} capitalize`}>{t(`status_${order.status}`) || order.status.replace(/_/g, ' ')}</span>
                                        <p className="text-lg font-bold text-dark-900 mt-1">${order.totalPrice.toFixed(2)}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-3 overflow-x-auto">
                                    {order.items.slice(0, 4).map((item, j) => (
                                        <img key={j} src={item.image || '/placeholder.png'} alt={item.name} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                                    ))}
                                    {order.items.length > 4 && <div className="w-14 h-14 rounded-lg bg-dark-100 flex items-center justify-center text-sm text-dark-500 shrink-0">+{order.items.length - 4}</div>}
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            )}
            <Pagination page={pagination.page} pages={pagination.pages} onPageChange={p => setPagination(prev => ({ ...prev, page: p }))} />
        </div>
    );
};

export default OrderHistory;
