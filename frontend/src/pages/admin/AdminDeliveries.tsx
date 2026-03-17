import { useState, useEffect } from 'react';
import api from '../../api/axiosClient';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const statusColors: Record<string, string> = {
    assigned: 'bg-yellow-100 text-yellow-800', accepted: 'bg-blue-100 text-blue-800',
    picked_up: 'bg-indigo-100 text-indigo-800', in_transit: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800', failed: 'bg-red-100 text-red-800'
};

const AdminDeliveries = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const [deliveries, setDeliveries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchDeliveries = async () => {
        setLoading(true);
        try { const { data } = await api.get('/delivery/all'); setDeliveries(data.deliveries || data || []); } catch { }
        setLoading(false);
    };

    useEffect(() => { fetchDeliveries(); }, []);

    return (
        <div>
            <h1 className={`text-xl font-bold text-dark-800 mb-6 ${isRtl ? 'text-right' : ''}`}>{t('deliveries')} ({deliveries.length})</h1>

            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-dark-50 border-b border-dark-100">
                            <tr className={isRtl ? 'flex-row-reverse' : ''}>{['order', 'deliveryman', 'status', 'location', 'created'].map(h => <th key={h} className={`${isRtl ? 'text-right' : 'text-left'} px-4 py-3 text-xs font-semibold text-dark-500 uppercase`}>{t(h)}</th>)}</tr>
                        </thead>
                        <tbody className="divide-y divide-dark-50">
                            {loading ? Array(3).fill(0).map((_, i) => <tr key={i}><td colSpan={5} className="px-4 py-4"><div className="h-4 skeleton" /></td></tr>)
                                : deliveries.length === 0 ? <tr><td colSpan={5} className="text-center py-10 text-dark-400">{t('no_deliveries') || 'No deliveries'}</td></tr>
                                    : deliveries.map(d => (
                                        <tr key={d.id} className={`hover:bg-dark-50/50 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                            <td className={`px-4 py-3 font-medium text-primary-600 ${isRtl ? 'text-right' : ''}`}>{d.order?.orderNumber || '—'}</td>
                                            <td className={`px-4 py-3 text-dark-700 ${isRtl ? 'text-right' : ''}`}>{d.deliveryman?.name || '—'}</td>
                                            <td className={`px-4 py-3 ${isRtl ? 'text-right' : ''}`}><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[d.status] || ''}`}>{t(d.status) || d.status?.replace(/_/g, ' ')}</span></td>
                                            <td className={`px-4 py-3 text-xs text-dark-400 ${isRtl ? 'text-right font-mono' : ''}`}>{d.currentLocation ? `${d.currentLocation.lat?.toFixed(4)}, ${d.currentLocation.lng?.toFixed(4)}` : '—'}</td>
                                            <td className={`px-4 py-3 text-xs text-dark-400 ${isRtl ? 'text-right' : ''}`}>{d.createdAt ? new Date(d.createdAt).toLocaleDateString(i18n.language) : '—'}</td>
                                        </tr>
                                    ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDeliveries;
