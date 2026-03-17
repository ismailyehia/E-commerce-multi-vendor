import { useState, useEffect } from 'react';
import { HiOutlinePencil, HiOutlineTrash, HiOutlinePlus } from 'react-icons/hi';
import api from '../../api/axiosClient';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const AdminAds = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const [ads, setAds] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editAd, setEditAd] = useState<any>(null);
    const [form, setForm] = useState({ title: '', type: 'banner', link: '', placement: 'homepage', isActive: true, startDate: '', endDate: '', budget: '' });

    const fetchAds = async () => {
        setLoading(true);
        try { const { data } = await api.get('/ads/admin'); setAds(data); } catch { }
        setLoading(false);
    };

    useEffect(() => { fetchAds(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editAd) await api.put(`/ads/${editAd.id}`, form);
            else await api.post('/ads', form);
            toast.success(editAd ? (t('updated_success') || 'Updated') : (t('created_success') || 'Created'));
            setShowForm(false); setEditAd(null); fetchAds();
        } catch (err: any) { toast.error(err.response?.data?.message || t('failed_generic') || 'Failed'); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t('delete_confirm') || 'Delete?')) return;
        try { await api.delete(`/ads/${id}`); toast.success(t('deleted_success') || 'Deleted'); fetchAds(); } catch { toast.error(t('failed_generic') || 'Failed'); }
    };

    return (
        <div>
            <div className={`flex items-center justify-between mb-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <h1 className="text-xl font-bold text-dark-800">{t('advertisements')} ({ads.length})</h1>
                <button onClick={() => { setEditAd(null); setForm({ title: '', type: 'banner', link: '', placement: 'homepage', isActive: true, startDate: '', endDate: '', budget: '' }); setShowForm(true); }}
                    className="btn-primary py-2 text-sm flex items-center gap-1"><HiOutlinePlus className="w-4 h-4" /> {t('new_ad')}</button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className={`card p-6 mb-6 space-y-4 ${isRtl ? 'text-right' : ''}`}>
                    <h2 className="text-lg font-semibold">{editAd ? t('edit_ad') : t('new_ad')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="text-sm font-medium text-dark-600 mb-1 block">{t('title')} *</label>
                            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={`input-field ${isRtl ? 'text-right' : ''}`} required /></div>
                        <div><label className="text-sm font-medium text-dark-600 mb-1 block">{t('type')}</label>
                            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className={`input-field ${isRtl ? 'text-right' : ''}`}>
                                <option value="banner">{t('ad_type_banner')}</option><option value="video">{t('ad_type_video')}</option><option value="featured">{t('ad_type_featured')}</option></select></div>
                        <div><label className="text-sm font-medium text-dark-600 mb-1 block">{t('placement')}</label>
                            <select value={form.placement} onChange={e => setForm({ ...form, placement: e.target.value })} className={`input-field ${isRtl ? 'text-right' : ''}`}>
                                <option value="homepage">{t('homepage_placement')}</option><option value="category">{t('category_placement')}</option><option value="product">{t('product_placement')}</option></select></div>
                        <div><label className="text-sm font-medium text-dark-600 mb-1 block">{t('link_url')}</label>
                            <input value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} className={`input-field ${isRtl ? 'text-right' : ''}`} /></div>
                        <div><label className="text-sm font-medium text-dark-600 mb-1 block">{t('start_date')}</label>
                            <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className={`input-field ${isRtl ? 'text-right' : ''}`} /></div>
                        <div><label className="text-sm font-medium text-dark-600 mb-1 block">{t('end_date')}</label>
                            <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className={`input-field ${isRtl ? 'text-right' : ''}`} /></div>
                        <div><label className="text-sm font-medium text-dark-600 mb-1 block">{t('budget')} ($)</label>
                            <input type="number" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} className={`input-field ${isRtl ? 'text-right' : ''}`} /></div>
                    </div>
                    <label className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}><input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="rounded text-primary-600" /><span className="text-sm text-dark-600">{t('active')}</span></label>
                    <div className={`flex gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}><button type="submit" className="btn-primary">{t('save')}</button>
                        <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">{t('cancel')}</button></div>
                </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? Array(3).fill(0).map((_, i) => <div key={i} className="card p-4 animate-pulse"><div className="h-32 skeleton rounded-xl mb-3" /><div className="h-4 skeleton w-2/3" /></div>)
                    : ads.map(ad => (
                        <div key={ad.id} className="card overflow-hidden">
                            <div className="h-32 bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center">
                                <span className="text-4xl">{ad.type === 'banner' ? '🖼️' : ad.type === 'video' ? '🎬' : '⭐'}</span>
                            </div>
                            <div className={`p-4 ${isRtl ? 'text-right' : ''}`}>
                                <div className={`flex items-center justify-between mb-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                    <h3 className="font-semibold text-dark-800 truncate">{ad.title}</h3>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ad.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{ad.isActive ? t('active') : t('inactive')}</span>
                                </div>
                                <div className={`flex gap-2 text-xs text-dark-400 mb-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                    <span className="capitalize">{t(`ad_type_${ad.type}`) || ad.type}</span> • <span className="capitalize">{t(`${ad.placement}_placement`) || ad.placement}</span>
                                </div>
                                <div className={`flex gap-2 text-xs text-dark-400 mb-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                    <span>👁️ {ad.impressions?.toLocaleString(i18n.language) || 0} {t('impressions')}</span> • <span>👆 {ad.clicks?.toLocaleString(i18n.language) || 0} {t('clicks')}</span> • <span>💰 ${ad.spend?.toFixed(2) || '0.00'}</span>
                                </div>
                                <div className={`flex gap-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                    <button onClick={() => { setEditAd(ad); setForm({ title: ad.title, type: ad.type, link: ad.link || '', placement: ad.placement, isActive: ad.isActive, startDate: ad.startDate?.split('T')[0] || '', endDate: ad.endDate?.split('T')[0] || '', budget: ad.budget ? String(ad.budget) : '' }); setShowForm(true); }}
                                        className="flex-1 py-1.5 text-xs text-dark-600 border border-dark-200 rounded-lg hover:bg-dark-50 flex items-center justify-center gap-1"><HiOutlinePencil className="w-3.5 h-3.5" /> {t('edit')}</button>
                                    <button onClick={() => handleDelete(ad.id)} className="py-1.5 px-3 text-xs text-red-500 border border-red-200 rounded-lg hover:bg-red-50"><HiOutlineTrash className="w-3.5 h-3.5" /></button>
                                </div>
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    );
};

export default AdminAds;
