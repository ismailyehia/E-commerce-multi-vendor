import { useState, useEffect } from 'react';
import { HiOutlinePencil, HiOutlineTrash, HiOutlinePlus } from 'react-icons/hi';
import { useAppSelector } from '../../hooks/useRedux';
import api from '../../api/axiosClient';
import type { Category } from '../../types';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const AdminCategories = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const { user } = useAppSelector(s => s.auth);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editCat, setEditCat] = useState<Category | null>(null);
    const [form, setForm] = useState({ name: '', description: '', icon: '', parent: '' });

    const fetchCats = async () => {
        setLoading(true);
        try { const { data } = await api.get('/categories/all'); setCategories(data); } catch { }
        setLoading(false);
    };

    useEffect(() => { fetchCats(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = { ...form, parent: form.parent || undefined };
            if (editCat) await api.put(`/categories/${editCat.id}`, payload);
            else await api.post('/categories', payload);
            toast.success(editCat ? (t('updated_success') || 'Updated') : (t('created_success') || 'Created'));
            setShowForm(false); setEditCat(null); fetchCats();
        } catch (err: any) { toast.error(err.response?.data?.message || t('failed_generic') || 'Failed'); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t('delete_confirm') || 'Delete?')) return;
        try { await api.delete(`/categories/${id}`); toast.success(t('deleted_success') || 'Deleted'); fetchCats(); }
        catch { toast.error(t('failed_generic') || 'Failed'); }
    };

    const mainCats = categories.filter(c => !c.parent);
    const getSubcats = (parentId: string) => categories.filter(c => {
        const pid = typeof c.parent === 'object' ? c.parent?.id : c.parent;
        return pid === parentId;
    });

    return (
        <div>
            <div className={`flex items-center justify-between mb-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <h1 className="text-xl font-bold text-dark-800">{t('categories_count')} ({categories.length})</h1>
                {user?.role === 'admin' && (
                    <button onClick={() => { setEditCat(null); setForm({ name: '', description: '', icon: '', parent: '' }); setShowForm(true); }}
                        className="btn-primary py-2 text-sm flex items-center gap-1"><HiOutlinePlus className="w-4 h-4" /> {t('add')}</button>
                )}
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className={`card p-6 mb-6 space-y-4 ${isRtl ? 'text-right' : ''}`}>
                    <h2 className="text-lg font-semibold">{editCat ? t('edit_category') : t('new_category')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="text-sm font-medium text-dark-600 mb-1 block">{t('name')} *</label>
                            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={`input-field ${isRtl ? 'text-right' : ''}`} required /></div>
                        <div><label className="text-sm font-medium text-dark-600 mb-1 block">{t('icon_emoji') || 'Icon (emoji)'}</label>
                            <input value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} className={`input-field ${isRtl ? 'text-right' : ''}`} placeholder="💻" /></div>
                        <div><label className="text-sm font-medium text-dark-600 mb-1 block">{t('parent_category')}</label>
                            <select value={form.parent} onChange={e => setForm({ ...form, parent: e.target.value })} className={`input-field ${isRtl ? 'text-right' : ''}`}>
                                <option value="">{t('none')} ({t('top_level')})</option>
                                {mainCats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                            </select></div>
                    </div>
                    <div><label className="text-sm font-medium text-dark-600 mb-1 block">{t('description')}</label>
                        <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={`input-field min-h-[80px] ${isRtl ? 'text-right' : ''}`} /></div>
                    <div className={`flex gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}><button type="submit" className="btn-primary">{t('save')}</button>
                        <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">{t('cancel')}</button></div>
                </form>
            )}

            <div className="space-y-4">
                {loading ? Array(4).fill(0).map((_, i) => <div key={i} className="card p-4 animate-pulse"><div className="h-5 skeleton w-1/3" /></div>)
                    : mainCats.map(cat => (
                        <div key={cat.id} className="card overflow-hidden">
                            <div className={`p-4 flex items-center justify-between bg-dark-50/50 ${isRtl ? 'flex-row-reverse text-right' : ''}`}>
                                <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                    <span className="text-2xl">{cat.icon || '📂'}</span>
                                    <div><p className="font-semibold text-dark-800">{cat.name}</p>{cat.description && <p className="text-xs text-dark-400">{cat.description}</p>}</div>
                                </div>
                                {user?.role === 'admin' && (
                                    <div className={`flex gap-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                        <button onClick={() => { setEditCat(cat); setForm({ name: cat.name, description: cat.description || '', icon: cat.icon || '', parent: '' }); setShowForm(true); }} className="p-1.5 hover:bg-dark-100 rounded-lg"><HiOutlinePencil className="w-4 h-4 text-dark-400" /></button>
                                        <button onClick={() => handleDelete(cat.id)} className="p-1.5 hover:bg-red-50 rounded-lg"><HiOutlineTrash className="w-4 h-4 text-red-400" /></button>
                                    </div>
                                )}
                            </div>
                            {getSubcats(cat.id).length > 0 && (
                                <div className="divide-y divide-dark-50">
                                    {getSubcats(cat.id).map(sub => (
                                        <div key={sub.id} className={`px-4 py-3 ${isRtl ? 'pr-12 pl-4 flex-row-reverse text-right' : 'pl-12 pr-4'} flex items-center justify-between`}>
                                            <span className="text-sm text-dark-600">{sub.icon || '📁'} {sub.name}</span>
                                            {user?.role === 'admin' && (
                                                <div className={`flex gap-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                                    <button onClick={() => { setEditCat(sub); setForm({ name: sub.name, description: sub.description || '', icon: sub.icon || '', parent: cat.id }); setShowForm(true); }} className="p-1 hover:bg-dark-100 rounded"><HiOutlinePencil className="w-3.5 h-3.5 text-dark-400" /></button>
                                                    <button onClick={() => handleDelete(sub.id)} className="p-1 hover:bg-red-50 rounded"><HiOutlineTrash className="w-3.5 h-3.5 text-red-400" /></button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
            </div>
        </div>
    );
};

export default AdminCategories;
