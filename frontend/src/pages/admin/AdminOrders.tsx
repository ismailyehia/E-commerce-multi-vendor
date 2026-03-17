import { useState, useEffect } from 'react';
import { HiOutlinePencil } from 'react-icons/hi';
import api from '../../api/axiosClient';
import type { Order, Pagination as PT } from '../../types';
import Pagination from '../../components/shared/Pagination';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800', paid: 'bg-blue-100 text-blue-800',
    processing: 'bg-indigo-100 text-indigo-800', shipped: 'bg-purple-100 text-purple-800',
    out_for_delivery: 'bg-cyan-100 text-cyan-800', delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800', returned: 'bg-orange-100 text-orange-800'
};

const AdminOrders = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const [orders, setOrders] = useState<Order[]>([]);
    const [pagination, setPagination] = useState<PT>({ page: 1, limit: 10, total: 0, pages: 0 });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [editOrder, setEditOrder] = useState<string | null>(null);
    const [newStatus, setNewStatus] = useState('');

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(pagination.page), limit: '10' });
            if (filter) params.set('status', filter);
            const { data } = await api.get(`/orders?${params}`);
            setOrders(data.orders || []);
            setPagination(data.pagination || { page: 1, limit: 10, total: 0, pages: 0 });
        } catch { }
        setLoading(false);
    };

    useEffect(() => { fetchOrders(); }, [pagination.page, filter]);

    const handleUpdateStatus = async (id: string) => {
        try {
            await api.put(`/orders/${id}/status`, { status: newStatus });
            toast.success(t('updated_success') || 'Status updated'); setEditOrder(null); fetchOrders();
        } catch (err: any) { toast.error(err.response?.data?.message || t('failed_generic') || 'Failed'); }
    };

    return (
        <div>
            <div className={`flex items-center justify-between mb-6 flex-wrap gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <h1 className="text-xl font-bold text-dark-800">{t('orders_count') || 'Orders'} ({pagination.total})</h1>
                <div className={`flex gap-2 overflow-x-auto ${isRtl ? 'flex-row-reverse' : ''}`}>
                    {['', 'pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => (
                        <button key={s} onClick={() => { setFilter(s); setPagination(p => ({ ...p, page: 1 })); }}
                            className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors ${filter === s ? 'bg-primary-600 text-white' : 'bg-dark-100 text-dark-600 hover:bg-dark-200'}`}>
                            {s ? t(`status_${s}`) : t('all')}
                        </button>
                    ))}
                </div>
            </div>

            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-dark-50 border-b border-dark-100">
                            <tr className={isRtl ? 'flex-row-reverse' : ''}>{['order_number', 'customer', 'items', 'total', 'payment', 'status', 'date', 'actions'].map(h => <th key={h} className={`${isRtl ? 'text-right' : 'text-left'} px-4 py-3 text-xs font-semibold text-dark-500 uppercase`}>{t(h)}</th>)}</tr>
                        </thead>
                        <tbody className="divide-y divide-dark-50">
                            {loading ? Array(5).fill(0).map((_, i) => (
                                <tr key={i}><td colSpan={8} className="px-4 py-4"><div className="h-4 skeleton" /></td></tr>
                            )) : orders.length === 0 ? (
                                <tr><td colSpan={8} className="text-center py-10 text-dark-400">{t('no_orders_found')}</td></tr>
                            ) : orders.map(o => (
                                <tr key={o.id} className="hover:bg-dark-50/50">
                                    <td className={`px-4 py-3 font-medium text-primary-600 ${isRtl ? 'text-right' : ''}`}>{o.orderNumber}</td>
                                    <td className={`px-4 py-3 text-dark-700 ${isRtl ? 'text-right' : ''}`}>{typeof o.user === 'object' ? o.user.name : t('guest')}</td>
                                    <td className={`px-4 py-3 text-dark-600 ${isRtl ? 'text-right' : ''}`}>{o.items.length.toLocaleString(i18n.language)} {t('items')}</td>
                                    <td className={`px-4 py-3 font-semibold text-dark-800 ${isRtl ? 'text-right' : ''}`}>${o.totalPrice.toFixed(2)}</td>
                                    <td className={`px-4 py-3 ${isRtl ? 'text-right' : ''}`}><span className="badge capitalize">{t(`payment_${o.paymentMethod}`) || o.paymentMethod}</span></td>
                                    <td className={`px-4 py-3 ${isRtl ? 'text-right' : ''}`}>
                                        {editOrder === o.id ? (
                                            <div className={`flex gap-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                                <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className={`text-xs px-2 py-1 rounded border border-dark-200 ${isRtl ? 'text-right' : ''}`}>
                                                    {['pending', 'paid', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'].map(s => <option key={s} value={s}>{t(`status_${s}`)}</option>)}
                                                </select>
                                                <button onClick={() => handleUpdateStatus(o.id)} className="text-xs px-2 py-1 bg-primary-600 text-white rounded">{t('save')}</button>
                                                <button onClick={() => setEditOrder(null)} className="text-xs px-2 py-1 bg-dark-100 rounded">×</button>
                                            </div>
                                        ) : (
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[o.status] || 'bg-gray-100'}`}>{t(`status_${o.status}`) || o.status.replace(/_/g, ' ')}</span>
                                        )}
                                    </td>
                                    <td className={`px-4 py-3 text-dark-400 text-xs ${isRtl ? 'text-right' : ''}`}>{new Date(o.createdAt).toLocaleDateString(i18n.language)}</td>
                                    <td className={`px-4 py-3 ${isRtl ? 'text-right' : ''}`}>
                                        <button onClick={() => { setEditOrder(o.id); setNewStatus(o.status); }} className="p-1.5 hover:bg-dark-100 rounded-lg"><HiOutlinePencil className="w-4 h-4 text-dark-400" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <Pagination page={pagination.page} pages={pagination.pages} onPageChange={p => setPagination(prev => ({ ...prev, page: p }))} />
        </div>
    );
};

export default AdminOrders;
