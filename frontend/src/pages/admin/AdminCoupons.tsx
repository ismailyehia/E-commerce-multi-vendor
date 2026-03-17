import { useState, useEffect } from 'react';
import { HiOutlinePencil, HiOutlineTrash, HiOutlinePlus } from 'react-icons/hi';
import api from '../../api/axiosClient';
import type { Coupon } from '../../types';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const AdminCoupons = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editCoupon, setEditCoupon] = useState<Coupon | null>(null);
    const [form, setForm] = useState({ code: '', type: 'percentage', value: '', minOrderAmount: '', maxDiscount: '', usageLimit: '', startDate: '', endDate: '' });

    const fetchCoupons = async () => {
        setLoading(true);
        try { const { data } = await api.get('/coupons'); setCoupons(data); } catch { }
        setLoading(false);
    };

    useEffect(() => { fetchCoupons(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...form, value: Number(form.value), minOrderAmount: Number(form.minOrderAmount) || 0,
                maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
                usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined
            };
            if (editCoupon) await api.put(`/coupons/${editCoupon.id}`, payload);
            else await api.post('/coupons', payload);
            toast.success(editCoupon ? (t('updated_success') || 'Updated') : (t('created_success') || 'Created'));
            setShowForm(false); setEditCoupon(null); fetchCoupons();
        } catch (err: any) { toast.error(err.response?.data?.message || t('failed_generic') || 'Failed'); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t('delete_confirm') || 'Delete?')) return;
        try { await api.delete(`/coupons/${id}`); toast.success(t('deleted_success') || 'Deleted'); fetchCoupons(); } catch { toast.error(t('failed_generic') || 'Failed'); }
    };

    const isExpired = (c: Coupon) => new Date(c.endDate) < new Date();
    const isExhausted = (c: Coupon) => c.usageLimit ? c.usedCount >= c.usageLimit : false;

    return (
        <div>
            <div className={`flex items-center justify-between mb-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <h1 className="text-xl font-bold text-dark-800">{t('coupons')} ({coupons.length})</h1>
                <button onClick={() => { setEditCoupon(null); setForm({ code: '', type: 'percentage', value: '', minOrderAmount: '', maxDiscount: '', usageLimit: '', startDate: '', endDate: '' }); setShowForm(true); }}
                    className="btn-primary py-2 text-sm flex items-center gap-1"><HiOutlinePlus className="w-4 h-4" /> {t('new_coupon')}</button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className={`card p-6 mb-6 space-y-4 ${isRtl ? 'text-right' : ''}`}>
                    <h2 className="text-lg font-semibold">{editCoupon ? t('edit_coupon') : t('new_coupon')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="text-sm font-medium text-dark-600 mb-1 block">{t('code')} *</label>
                            <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} className={`input-field font-mono ${isRtl ? 'text-right' : ''}`} required placeholder="SAVE20" /></div>
                        <div><label className="text-sm font-medium text-dark-600 mb-1 block">{t('type')}</label>
                            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className={`input-field ${isRtl ? 'text-right' : ''}`}>
                                <option value="percentage">{t('percentage')}</option><option value="fixed">{t('fixed_amount')}</option></select></div>
                        <div><label className="text-sm font-medium text-dark-600 mb-1 block">{t('value')} *</label>
                            <input type="number" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} className={`input-field ${isRtl ? 'text-right' : ''}`} required placeholder={form.type === 'percentage' ? '10' : '20'} /></div>
                        <div><label className="text-sm font-medium text-dark-600 mb-1 block">{t('min_order_amount') || t('min_order')}</label>
                            <input type="number" value={form.minOrderAmount} onChange={e => setForm({ ...form, minOrderAmount: e.target.value })} className={`input-field ${isRtl ? 'text-right' : ''}`} /></div>
                        <div><label className="text-sm font-medium text-dark-600 mb-1 block">{t('max_discount')}</label>
                            <input type="number" value={form.maxDiscount} onChange={e => setForm({ ...form, maxDiscount: e.target.value })} className={`input-field ${isRtl ? 'text-right' : ''}`} /></div>
                        <div><label className="text-sm font-medium text-dark-600 mb-1 block">{t('usage_limit')}</label>
                            <input type="number" value={form.usageLimit} onChange={e => setForm({ ...form, usageLimit: e.target.value })} className={`input-field ${isRtl ? 'text-right' : ''}`} /></div>
                        <div><label className="text-sm font-medium text-dark-600 mb-1 block">{t('start_date')} *</label>
                            <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className={`input-field ${isRtl ? 'text-right' : ''}`} required /></div>
                        <div><label className="text-sm font-medium text-dark-600 mb-1 block">{t('end_date')} *</label>
                            <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className={`input-field ${isRtl ? 'text-right' : ''}`} required /></div>
                    </div>
                    <div className={`flex gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}><button type="submit" className="btn-primary">{t('save')}</button>
                        <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">{t('cancel')}</button></div>
                </form>
            )}

            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-dark-50 border-b border-dark-100">
                            <tr className={isRtl ? 'flex-row-reverse' : ''}>{['code', 'discount', 'min_order', 'usage', 'period', 'status', 'actions'].map(h => <th key={h} className={`${isRtl ? 'text-right' : 'text-left'} px-4 py-3 text-xs font-semibold text-dark-500 uppercase`}>{t(h)}</th>)}</tr>
                        </thead>
                        <tbody className="divide-y divide-dark-50">
                            {loading ? Array(3).fill(0).map((_, i) => <tr key={i}><td colSpan={7} className="px-4 py-4"><div className="h-4 skeleton" /></td></tr>)
                                : coupons.map(c => (
                                    <tr key={c.id} className="hover:bg-dark-50/50">
                                        <td className={`px-4 py-3 font-mono font-semibold text-primary-600 ${isRtl ? 'text-right font-mono' : ''}`}>{c.code}</td>
                                        <td className={`px-4 py-3 font-medium ${isRtl ? 'text-right' : ''}`}>{c.type === 'percentage' ? `${c.value}%` : `$${c.value}`}{c.maxDiscount ? <span className={`text-xs text-dark-400 ${isRtl ? 'mr-1' : 'ml-1'}`}>({t('max')} ${c.maxDiscount})</span> : ''}</td>
                                        <td className={`px-4 py-3 text-dark-600 ${isRtl ? 'text-right' : ''}`}>${c.minOrderAmount}</td>
                                        <td className={`px-4 py-3 text-dark-600 ${isRtl ? 'text-right font-mono' : ''}`}>{c.usedCount.toLocaleString(i18n.language)}{c.usageLimit ? `/${c.usageLimit.toLocaleString(i18n.language)}` : '/∞'}</td>
                                        <td className={`px-4 py-3 text-xs text-dark-400 ${isRtl ? 'text-right' : ''}`}>{new Date(c.startDate).toLocaleDateString(i18n.language)} - {new Date(c.endDate).toLocaleDateString(i18n.language)}</td>
                                        <td className={`px-4 py-3 ${isRtl ? 'text-right' : ''}`}>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isExpired(c) ? 'bg-red-100 text-red-700' : isExhausted(c) ? 'bg-yellow-100 text-yellow-700' : c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                                {isExpired(c) ? t('expired') : isExhausted(c) ? t('exhausted') : c.isActive ? t('active') : t('inactive')}
                                            </span>
                                        </td>
                                        <td className={`px-4 py-3 ${isRtl ? 'text-right' : ''}`}>
                                            <div className={`flex gap-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                                <button onClick={() => { setEditCoupon(c); setForm({ code: c.code, type: c.type, value: String(c.value), minOrderAmount: String(c.minOrderAmount), maxDiscount: c.maxDiscount ? String(c.maxDiscount) : '', usageLimit: c.usageLimit ? String(c.usageLimit) : '', startDate: c.startDate.split('T')[0], endDate: c.endDate.split('T')[0] }); setShowForm(true); }}
                                                    className="p-1.5 hover:bg-dark-100 rounded-lg"><HiOutlinePencil className="w-4 h-4 text-dark-400" /></button>
                                                <button onClick={() => handleDelete(c.id)} className="p-1.5 hover:bg-red-50 rounded-lg"><HiOutlineTrash className="w-4 h-4 text-red-400" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminCoupons;
