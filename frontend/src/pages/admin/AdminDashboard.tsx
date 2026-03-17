import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineCurrencyDollar, HiOutlineShoppingCart, HiOutlineUsers, HiOutlineCube, HiOutlineTrendingUp } from 'react-icons/hi';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { DashboardStats } from '../../types';
import { useTranslation } from 'react-i18next';
import api from '../../api/axiosClient';

const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#22c55e', '#06b6d4', '#ef4444', '#6366f1', '#14b8a6'];

const AdminDashboard = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [salesData, setSalesData] = useState<any[]>([]);
    const [topProducts, setTopProducts] = useState<any[]>([]);
    const [orderStatus, setOrderStatus] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, salesRes, topRes, statusRes] = await Promise.all([
                    api.get('/analytics/dashboard'),
                    api.get('/analytics/sales-chart?days=30'),
                    api.get('/analytics/top-products'),
                    api.get('/analytics/order-status')
                ]);
                setStats(statsRes.data);
                setSalesData(salesRes.data);
                setTopProducts(topRes.data);
                setOrderStatus(statusRes.data.map((s: any) => ({ name: s.id?.replace(/_/g, ' ') || 'Unknown', value: s.count })));
            } catch (err) { console.error(err); }
            setLoading(false);
        };
        fetchData();
    }, []);

    const statCards = [
        { icon: HiOutlineCurrencyDollar, label: t('total_revenue'), value: `$${(stats?.totalRevenue || 0).toLocaleString(i18n.language)}`, color: 'from-primary-500 to-primary-700', bg: 'bg-primary-50' },
        { icon: HiOutlineTrendingUp, label: t('today_sales'), value: `$${(stats?.todaySales || 0).toLocaleString(i18n.language)}`, color: 'from-green-500 to-green-700', bg: 'bg-green-50' },
        { icon: HiOutlineShoppingCart, label: t('total_orders'), value: stats?.totalOrders?.toLocaleString(i18n.language) || '0', color: 'from-blue-500 to-blue-700', bg: 'bg-blue-50' },
        { icon: HiOutlineUsers, label: t('customers_count'), value: stats?.totalCustomers?.toLocaleString(i18n.language) || '0', color: 'from-amber-500 to-amber-700', bg: 'bg-amber-50' },
        { icon: HiOutlineCube, label: t('products_count'), value: stats?.totalProducts?.toLocaleString(i18n.language) || '0', color: 'from-pink-500 to-pink-700', bg: 'bg-pink-50' },
    ];

    if (loading) return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">{Array(5).fill(0).map((_, i) => <div key={i} className="card p-5 animate-pulse"><div className="h-4 skeleton w-1/2 mb-3" /><div className="h-8 skeleton w-2/3" /></div>)}</div>
            <div className="card p-6 h-80 animate-pulse"><div className="h-full skeleton rounded-xl" /></div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {statCards.map((card, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`card p-5 ${isRtl ? 'text-right' : ''}`}>
                        <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center mb-3 ${isRtl ? 'mr-0 ml-auto' : ''}`}>
                            <card.icon className="w-5 h-5 text-primary-600" />
                        </div>
                        <p className="text-sm text-dark-400">{card.label}</p>
                        <p className="text-2xl font-bold text-dark-900 mt-1">{card.value}</p>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sales Chart */}
                <div className="lg:col-span-2 card p-6">
                    <h3 className={`font-semibold text-dark-800 mb-4 ${isRtl ? 'text-right' : ''}`}>{t('sales_overview')}</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={salesData}>
                            <defs><linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} /><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} /></linearGradient></defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="id" tick={{ fontSize: 12 }} tickFormatter={v => v?.slice(-5) || ''} stroke="#94a3b8" />
                            <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" orientation={isRtl ? 'right' : 'left'} />
                            <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                            <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} fill="url(#colorRev)" name={t('total_revenue')} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Order Status Pie */}
                <div className="card p-6">
                    <h3 className={`font-semibold text-dark-800 mb-4 ${isRtl ? 'text-right' : ''}`}>{t('order_status_chart')}</h3>
                    {orderStatus.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie data={orderStatus} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" nameKey="name" paddingAngle={3}>
                                    {orderStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : <p className="text-dark-400 text-center py-10">{t('no_order_data')}</p>}
                    <div className="space-y-2 mt-2">
                        {orderStatus.map((s, i) => (
                            <div key={i} className={`flex items-center gap-2 text-sm ${isRtl ? 'flex-row-reverse' : ''}`}>
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                <span className="text-dark-500 capitalize">{t(`status_${s.name.toLowerCase().replace(/ /g, '_')}`) || s.name}</span>
                                <span className={`${isRtl ? 'mr-auto' : 'ml-auto'} font-medium text-dark-700`}>{s.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Top Products & Recent Orders */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card p-6">
                    <h3 className={`font-semibold text-dark-800 mb-4 ${isRtl ? 'text-right' : ''}`}>{t('top_selling_products')}</h3>
                    <div className="space-y-3">
                        {topProducts.slice(0, 5).map((p: any, i: number) => (
                            <div key={p.id} className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse text-right' : ''}`}>
                                <span className="w-6 h-6 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                                <img src={p.images?.[0] || '/placeholder.png'} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                                <div className="flex-1 min-w-0"><p className="text-sm font-medium text-dark-800 truncate">{p.name}</p><p className="text-xs text-dark-400">{p.totalSold} {t('sold_count')}</p></div>
                                <span className="text-sm font-semibold text-dark-700">${p.price}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card p-6">
                    <h3 className={`font-semibold text-dark-800 mb-4 ${isRtl ? 'text-right' : ''}`}>{t('recent_orders')}</h3>
                    <div className="space-y-3">
                        {(stats?.recentOrders || []).map((o: any) => (
                            <div key={o.id} className={`flex items-center justify-between py-2 border-b border-dark-50 last:border-0 ${isRtl ? 'flex-row-reverse text-right' : ''}`}>
                                <div><p className="text-sm font-medium text-dark-800">{o.orderNumber}</p><p className="text-xs text-dark-400">{o.user?.name || t('guest')}</p></div>
                                <div className={isRtl ? 'text-left' : 'text-right'}><p className="text-sm font-semibold text-dark-700">${o.totalPrice?.toFixed(2)}</p><span className={`badge text-xs capitalize ${o.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{t(`status_${o.status}`) || o.status}</span></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
