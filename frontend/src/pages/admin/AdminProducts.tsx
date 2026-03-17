import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlinePencil, HiOutlineTrash, HiOutlinePlus, HiOutlineSearch, HiOutlineEye, HiOutlinePhotograph, HiOutlineX } from 'react-icons/hi';
import type { Category } from '../../types';
import api from '../../api/axiosClient';
import { useAppSelector } from '../../hooks/useRedux';
import type { Product, Pagination as PT } from '../../types';
import Pagination from '../../components/shared/Pagination';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const AdminProducts = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const { user } = useAppSelector(s => s.auth);
    const [products, setProducts] = useState<Product[]>([]);
    const [pagination, setPagination] = useState<PT>({ page: 1, limit: 10, total: 0, pages: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editProduct, setEditProduct] = useState<Product | null>(null);
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [form, setForm] = useState({
        name: '', description: '', shortDescription: '', price: '', comparePrice: '',
        category: '', brand: '', tags: '', isFeatured: false,
        variants: [{ size: '', color: '', sku: '', stock: '0', price: '' }]
    });

    useEffect(() => {
        api.get('/categories').then(res => setCategories(res.data)).catch(() => { });
    }, []);

    const handleImageSelect = (files: FileList | null) => {
        if (!files) return;
        const newFiles = Array.from(files);
        setImageFiles(prev => [...prev, ...newFiles]);
        newFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => setImagePreviews(prev => [...prev, e.target?.result as string]);
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index: number) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(pagination.page), limit: '10' });
            if (search) params.set(user?.role === 'salesman' ? 'search' : 'keyword', search);

            const endpoint = user?.role === 'salesman' ? '/products/seller/me' : '/products';
            const { data } = await api.get(`${endpoint}?${params}`);

            setProducts(data.products || []);
            setPagination(data.pagination || { page: 1, limit: 10, total: 0, pages: 0 });
        } catch { }
        setLoading(false);
    };

    useEffect(() => { fetchProducts(); }, [pagination.page, search]);

    const handleDelete = async (id: string) => {
        if (!confirm(t('delete_confirm') || 'Delete this product?')) return;
        try { await api.delete(`/products/${id}`); toast.success(t('deleted_success') || 'Deleted'); fetchProducts(); }
        catch { toast.error(t('failed_generic') || 'Failed'); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('name', form.name);
            formData.append('description', form.description);
            if (form.shortDescription) formData.append('shortDescription', form.shortDescription);
            formData.append('price', form.price);
            if (form.comparePrice) formData.append('comparePrice', form.comparePrice);
            if (form.category) formData.append('category', form.category);
            if (form.brand) formData.append('brand', form.brand);
            formData.append('isFeatured', String(form.isFeatured));
            formData.append('tags', JSON.stringify(form.tags.split(',').map(t => t.trim()).filter(Boolean)));
            formData.append('variants', JSON.stringify(
                form.variants.map(v => ({ ...v, stock: Number(v.stock), price: v.price ? Number(v.price) : undefined }))
            ));
            imageFiles.forEach(file => formData.append('images', file));

            if (editProduct) {
                const updated = await api.put(`/products/${editProduct.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                console.log('Updated product:', updated.data);
            } else {
                await api.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            }
            toast.success(editProduct ? (t('updated_success') || 'Updated') : (t('created_success') || 'Created'));
            setShowForm(false);
            setEditProduct(null);
            setImageFiles([]);
            setImagePreviews([]);
            await fetchProducts();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed');
        }
    };

    const openEdit = (p: Product) => {
        setEditProduct(p);
        setForm({
            name: p.name, description: p.description, shortDescription: p.shortDescription || '',
            price: String(p.price), comparePrice: p.comparePrice ? String(p.comparePrice) : '',
            category: typeof p.category === 'object' ? p.category.id : p.category,
            brand: p.brand || '', tags: p.tags?.join(', ') || '', isFeatured: p.isFeatured,
            variants: p.variants?.length ? p.variants.map(v => ({ size: v.size || '', color: v.color || '', sku: v.sku, stock: String(v.stock), price: v.price ? String(v.price) : '' }))
                : [{ size: '', color: '', sku: '', stock: '0', price: '' }]
        });
        setShowForm(true);
    };

    const addVariant = () => setForm({ ...form, variants: [...form.variants, { size: '', color: '', sku: '', stock: '0', price: '' }] });
    const removeVariant = (i: number) => setForm({ ...form, variants: form.variants.filter((_, idx) => idx !== i) });

    return (
        <div>
            <div className={`flex items-center justify-between mb-6 flex-wrap gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <h1 className="text-xl font-bold text-dark-800">{t('products_list')} ({pagination.total})</h1>
                <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <div className="relative">
                        <HiOutlineSearch className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-dark-400 w-4 h-4`} />
                        <input value={search} onChange={e => { setSearch(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
                            placeholder={t('search_products') || "Search products..."} className={`${isRtl ? 'pr-9 pl-4 text-right' : 'pl-9 pr-4'} py-2 text-sm bg-dark-50 rounded-lg border-none focus:ring-2 focus:ring-primary-500 w-56`} />
                    </div>
                    <button onClick={() => { setEditProduct(null); setForm({ name: '', description: '', shortDescription: '', price: '', comparePrice: '', category: '', brand: '', tags: '', isFeatured: false, variants: [{ size: '', color: '', sku: '', stock: '0', price: '' }] }); setImageFiles([]); setImagePreviews([]); setShowForm(true); }}
                        className="btn-primary py-2 text-sm flex items-center gap-1"><HiOutlinePlus className="w-4 h-4" /> {t('add_product')}</button>
                </div>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className={`card p-6 mb-6 space-y-4 ${isRtl ? 'text-right' : ''}`}>
                    <h2 className="text-lg font-semibold text-dark-800">{editProduct ? t('edit_product') : t('new_product')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="text-sm font-medium text-dark-600 mb-1 block">{t('name')} *</label>
                            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={`input-field ${isRtl ? 'text-right' : ''}`} required /></div>
                        <div><label className="text-sm font-medium text-dark-600 mb-1 block">{t('brand')}</label>
                            <input value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} className={`input-field ${isRtl ? 'text-right' : ''}`} /></div>
                        <div><label className="text-sm font-medium text-dark-600 mb-1 block">{t('category')}</label>
                            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className={`input-field ${isRtl ? 'text-right' : ''}`}>
                                <option value="">{t('select_category')}</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select></div>
                        <div><label className="text-sm font-medium text-dark-600 mb-1 block">{t('price')} *</label>
                            <input type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className={`input-field ${isRtl ? 'text-right' : ''}`} required /></div>
                        <div><label className="text-sm font-medium text-dark-600 mb-1 block">{t('compare_price')}</label>
                            <input type="number" step="0.01" value={form.comparePrice} onChange={e => setForm({ ...form, comparePrice: e.target.value })} className={`input-field ${isRtl ? 'text-right' : ''}`} /></div>
                    </div>
                    <div><label className="text-sm font-medium text-dark-600 mb-1 block">{t('short_description')}</label>
                        <input value={form.shortDescription} onChange={e => setForm({ ...form, shortDescription: e.target.value })} className={`input-field ${isRtl ? 'text-right' : ''}`} /></div>
                    <div><label className="text-sm font-medium text-dark-600 mb-1 block">{t('description')} *</label>
                        <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={`input-field min-h-[100px] ${isRtl ? 'text-right' : ''}`} required /></div>
                    <div><label className="text-sm font-medium text-dark-600 mb-1 block">{t('tags_comma')}</label>
                        <input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} className={`input-field ${isRtl ? 'text-right' : ''}`} /></div>
                    <label className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}><input type="checkbox" checked={form.isFeatured} onChange={e => setForm({ ...form, isFeatured: e.target.checked })} className="rounded text-primary-600" /><span className="text-sm text-dark-600">{t('featured_product')}</span></label>

                    {/* Image Upload */}
                    <div>
                        <label className="text-sm font-medium text-dark-600 mb-2 block">{t('product_images')}</label>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleImageSelect(e.dataTransfer.files); }}
                            className="border-2 border-dashed border-dark-200 rounded-xl p-6 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-colors"
                        >
                            <HiOutlinePhotograph className="w-10 h-10 text-dark-300 mx-auto mb-2" />
                            <p className="text-sm text-dark-500">{t('click_to_upload')}</p>
                            <p className="text-xs text-dark-400 mt-1">{t('upload_hint')}</p>
                        </div>
                        <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={e => handleImageSelect(e.target.files)} />
                        {imagePreviews.length > 0 && (
                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 mt-3">
                                {imagePreviews.map((src, i) => (
                                    <div key={i} className="relative group rounded-lg overflow-hidden aspect-square">
                                        <img src={src} alt="" className="w-full h-full object-cover" />
                                        <button type="button" onClick={() => removeImage(i)}
                                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <HiOutlineX className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <div className={`flex items-center justify-between mb-2 ${isRtl ? 'flex-row-reverse' : ''}`}><h3 className="text-sm font-medium text-dark-700">{t('variants')}</h3>
                            <button type="button" onClick={addVariant} className="text-primary-600 text-sm font-medium hover:underline">+ {t('add_variant')}</button></div>
                        {form.variants.map((v, i) => (
                            <div key={i} className={`grid grid-cols-5 gap-2 mb-2 items-end ${isRtl ? 'flex-row-reverse text-right' : ''}`}>
                                <input placeholder={t('size') || "Size"} value={v.size} onChange={e => { const vs = [...form.variants]; vs[i].size = e.target.value; setForm({ ...form, variants: vs }); }} className={`input-field py-2 text-sm ${isRtl ? 'text-right' : ''}`} />
                                <input placeholder={t('color') || "Color"} value={v.color} onChange={e => { const vs = [...form.variants]; vs[i].color = e.target.value; setForm({ ...form, variants: vs }); }} className={`input-field py-2 text-sm ${isRtl ? 'text-right' : ''}`} />
                                <input placeholder={t('sku') || "SKU"} value={v.sku} onChange={e => { const vs = [...form.variants]; vs[i].sku = e.target.value; setForm({ ...form, variants: vs }); }} className={`input-field py-2 text-sm ${isRtl ? 'text-right' : ''}`} required />
                                <input type="number" placeholder={t('stock') || "Stock"} value={v.stock} onChange={e => { const vs = [...form.variants]; vs[i].stock = e.target.value; setForm({ ...form, variants: vs }); }} className={`input-field py-2 text-sm ${isRtl ? 'text-right' : ''}`} />
                                {form.variants.length > 1 && <button type="button" onClick={() => removeVariant(i)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg self-center"><HiOutlineTrash className="w-4 h-4" /></button>}
                            </div>
                        ))}
                    </div>
                    <div className={`flex gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}><button type="submit" className="btn-primary">{t('save')}</button>
                        <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">{t('cancel')}</button></div>
                </form>
            )}

            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-dark-50 border-b border-dark-100">
                            <tr className={isRtl ? 'flex-row-reverse' : ''}>{['product', 'price', 'stock', 'sales', 'rating', 'status', 'actions'].map(h => <th key={h} className={`${isRtl ? 'text-right' : 'text-left'} px-4 py-3 text-xs font-semibold text-dark-500 uppercase`}>{t(h)}</th>)}</tr>
                        </thead>
                        <tbody className="divide-y divide-dark-50">
                            {loading ? Array(5).fill(0).map((_, i) => (
                                <tr key={i}><td colSpan={7} className="px-4 py-4"><div className="h-4 skeleton w-full" /></td></tr>
                            )) : products.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-10 text-dark-400">{t('no_products_found')}</td></tr>
                            ) : products.map(p => (
                                <tr key={p.id} className="hover:bg-dark-50/50">
                                    <td className="px-4 py-3">
                                        <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse text-right' : ''}`}><img src={p.thumbnail || p.images?.[0] || '/placeholder.png'} className="w-10 h-10 rounded-lg object-cover" />
                                            <div><p className="font-medium text-dark-800 truncate max-w-[200px]">{p.name}</p><p className="text-xs text-dark-400">{p.brand || t('no_brand')}</p></div></div>
                                    </td>
                                    <td className={`px-4 py-3 font-medium ${isRtl ? 'text-right' : ''}`}>${p.price.toFixed(2)}{p.comparePrice ? <span className="text-xs text-dark-400 line-through ml-1">${p.comparePrice.toFixed(2)}</span> : ''}</td>
                                    <td className={`px-4 py-3 ${isRtl ? 'text-right' : ''}`}><span className={`text-sm ${p.totalStock > 10 ? 'text-green-600' : p.totalStock > 0 ? 'text-yellow-600' : 'text-red-600'}`}>{p.totalStock.toLocaleString(i18n.language)}</span></td>
                                    <td className={`px-4 py-3 text-dark-600 ${isRtl ? 'text-right' : ''}`}>{p.totalSold.toLocaleString(i18n.language)}</td>
                                    <td className={`px-4 py-3 ${isRtl ? 'text-right' : ''}`}><span className="text-dark-600">⭐ {p.avgRating?.toFixed(1) || '0.0'}</span></td>
                                    <td className={`px-4 py-3 ${isRtl ? 'text-right' : ''}`}><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{p.isActive ? t('active') : t('inactive')}</span></td>
                                    <td className={`px-4 py-3 ${isRtl ? 'text-right' : ''}`}>
                                        <div className={`flex gap-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                            <Link to={`/product/${p.slug}`} className="p-1.5 hover:bg-dark-100 rounded-lg"><HiOutlineEye className="w-4 h-4 text-dark-400" /></Link>
                                            <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-dark-100 rounded-lg"><HiOutlinePencil className="w-4 h-4 text-dark-400" /></button>
                                            <button onClick={() => handleDelete(p.id)} className="p-1.5 hover:bg-red-50 rounded-lg"><HiOutlineTrash className="w-4 h-4 text-red-400" /></button>
                                        </div>
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

export default AdminProducts;
