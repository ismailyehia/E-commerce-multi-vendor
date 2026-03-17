import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineCube, HiOutlineCurrencyDollar, HiOutlineClipboardList, HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlinePhotograph, HiOutlineX } from 'react-icons/hi';
import api from '../../api/axiosClient';
import type { Product, Order, Category } from '../../types';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const SalesmanDashboard = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editProduct, setEditProduct] = useState<Product | null>(null);
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [form, setForm] = useState({
        name: '', description: '', shortDescription: '', price: '', comparePrice: '',
        category: '', brand: '', tags: '', variants: [{ size: '', color: '', sku: '', stock: '0', price: '' }]
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [prodsRes, ordersRes, catsRes] = await Promise.all([
                    api.get('/products/seller/me'),
                    api.get('/orders/salesman'),
                    api.get('/categories')
                ]);
                setProducts(prodsRes.data.products || prodsRes.data || []);
                setOrders(ordersRes.data.orders || ordersRes.data || []);
                setCategories(catsRes.data);
            } catch { }
            setLoading(false);
        };
        fetchData();
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

    const totalRevenue = orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => {
        return sum + (o.items?.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0) || 0);
    }, 0);
    const totalSold = products.reduce((sum, p) => sum + (p.totalSold || 0), 0);

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
            formData.append('tags', JSON.stringify(form.tags.split(',').map(t => t.trim()).filter(Boolean)));
            formData.append('variants', JSON.stringify(
                form.variants.map(v => ({ ...v, stock: Number(v.stock), price: v.price ? Number(v.price) : undefined }))
            ));
            imageFiles.forEach(file => formData.append('images', file));

            if (editProduct) await api.put(`/products/${editProduct.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            else await api.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

            toast.success(editProduct ? (t('updated_success') || 'Updated') : (t('created_success') || 'Created'));
            setShowForm(false); setEditProduct(null); setImageFiles([]); setImagePreviews([]);
            const { data } = await api.get('/products/seller/me');
            setProducts(data.products || data || []);
        } catch (err: any) { toast.error(err.response?.data?.message || t('failed_generic') || 'Failed'); }
    };

    const stats = [
        { icon: HiOutlineCube, label: t('my_products'), value: products.length, color: 'bg-blue-50' },
        { icon: HiOutlineCurrencyDollar, label: t('revenue'), value: `$${totalRevenue.toLocaleString(i18n.language)}`, color: 'bg-green-50' },
        { icon: HiOutlineClipboardList, label: t('orders'), value: orders.length, color: 'bg-purple-50' },
        { icon: HiOutlineCube, label: t('units_sold'), value: totalSold, color: 'bg-amber-50' }
    ];

    return (
        <div className={`space-y-6 ${isRtl ? 'text-right' : ''}`}>
            <div className={`flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                <h1 className="text-xl font-bold text-dark-800">{t('salesman_panel')}</h1>
                <button onClick={() => { setEditProduct(null); setForm({ name: '', description: '', shortDescription: '', price: '', comparePrice: '', category: '', brand: '', tags: '', variants: [{ size: '', color: '', sku: '', stock: '0', price: '' }] }); setShowForm(true); }}
                    className="btn-primary py-2 text-sm flex items-center gap-1"><HiOutlinePlus className="w-4 h-4" /> {t('add_product')}</button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-4">
                        <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center mb-3`}><s.icon className="w-5 h-5 text-primary-600" /></div>
                        <p className="text-sm text-dark-400">{s.label}</p>
                        <p className="text-2xl font-bold text-dark-900">{s.value}</p>
                    </motion.div>
                ))}
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className={`card p-6 space-y-4 ${isRtl ? 'text-right' : ''}`}>
                    <h2 className="text-lg font-semibold">{editProduct ? t('edit_product') : t('new_product')}</h2>
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
                            <button type="button" onClick={() => setForm({ ...form, variants: [...form.variants, { size: '', color: '', sku: '', stock: '0', price: '' }] })} className="text-primary-600 text-sm">{t('add')}</button></div>
                        {form.variants.map((v, i) => (
                            <div key={i} className={`grid grid-cols-5 gap-2 mb-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                <input placeholder={t('size')} value={v.size} onChange={e => { const vs = [...form.variants]; vs[i].size = e.target.value; setForm({ ...form, variants: vs }); }} className={`input-field py-2 text-sm ${isRtl ? 'text-right' : ''}`} />
                                <input placeholder={t('color')} value={v.color} onChange={e => { const vs = [...form.variants]; vs[i].color = e.target.value; setForm({ ...form, variants: vs }); }} className={`input-field py-2 text-sm ${isRtl ? 'text-right' : ''}`} />
                                <input placeholder={t('sku')} value={v.sku} onChange={e => { const vs = [...form.variants]; vs[i].sku = e.target.value; setForm({ ...form, variants: vs }); }} className={`input-field py-2 text-sm ${isRtl ? 'text-right' : ''}`} required />
                                <input type="number" placeholder={t('stock')} value={v.stock} onChange={e => { const vs = [...form.variants]; vs[i].stock = e.target.value; setForm({ ...form, variants: vs }); }} className={`input-field py-2 text-sm ${isRtl ? 'text-right' : ''}`} />
                                {form.variants.length > 1 && <button type="button" onClick={() => setForm({ ...form, variants: form.variants.filter((_, idx) => idx !== i) })} className="p-2 text-red-500"><HiOutlineTrash className="w-4 h-4" /></button>}
                            </div>
                        ))}
                    </div>
                    <div className={`flex gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}><button type="submit" className="btn-primary">{t('save')}</button>
                        <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">{t('cancel')}</button></div>
                </form>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Products */}
                <div className="card p-5">
                    <h2 className="font-semibold text-dark-800 mb-4">{t('my_products')}</h2>
                    <div className="space-y-3">
                        {loading ? Array(3).fill(0).map((_, i) => <div key={i} className="h-14 skeleton rounded-lg" />) :
                            products.length === 0 ? <p className="text-dark-400 text-center py-6">{t('no_products_found')}</p> :
                                products.slice(0, 8).map(p => (
                                    <div key={p.id} className={`flex items-center gap-3 py-2 border-b border-dark-50 last:border-0 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                        <img src={p.thumbnail || p.images?.[0] || '/placeholder.png'} className="w-10 h-10 rounded-lg object-cover" />
                                        <div className={`flex-1 min-w-0 ${isRtl ? 'text-right' : ''}`}><p className="text-sm font-medium text-dark-800 truncate">{p.name}</p>
                                            <p className="text-xs text-dark-400">{t('stock')}: {p.totalStock} · {t('sold')}: {p.totalSold}</p></div>
                                        <span className="text-sm font-semibold">${p.price.toFixed(2)}</span>
                                        <button onClick={() => { setEditProduct(p); setForm({ name: p.name, description: p.description, shortDescription: p.shortDescription || '', price: String(p.price), comparePrice: p.comparePrice ? String(p.comparePrice) : '', category: typeof p.category === 'object' ? p.category.id : p.category, brand: p.brand || '', tags: p.tags?.join(', ') || '', variants: p.variants?.map(v => ({ size: v.size || '', color: v.color || '', sku: v.sku, stock: String(v.stock), price: v.price ? String(v.price) : '' })) || [{ size: '', color: '', sku: '', stock: '0', price: '' }] }); setShowForm(true); }}
                                            className="p-1.5 hover:bg-dark-100 rounded-lg"><HiOutlinePencil className="w-4 h-4 text-dark-400" /></button>
                                    </div>
                                ))}
                    </div>
                </div>

                {/* Recent Orders */}
                <div className="card p-5">
                    <h2 className="font-semibold text-dark-800 mb-4">{t('recent_orders')}</h2>
                    <div className="space-y-3">
                        {loading ? Array(3).fill(0).map((_, i) => <div key={i} className="h-14 skeleton rounded-lg" />) :
                            orders.length === 0 ? <p className="text-dark-400 text-center py-6">{t('no_orders_yet')}</p> :
                                orders.slice(0, 8).map(o => (
                                    <div key={o.id} className={`flex items-center justify-between py-2 border-b border-dark-50 last:border-0 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                        <div className={isRtl ? 'text-right' : ''}><p className="text-sm font-medium text-dark-800">{o.orderNumber}</p>
                                            <p className="text-xs text-dark-400">{o.items.length} {t('items')}</p></div>
                                        <div className={isRtl ? 'text-left' : 'text-right'}><span className="text-sm font-semibold">${o.totalPrice.toFixed(2)}</span>
                                            <span className={`block text-xs capitalize mt-0.5 ${o.status === 'delivered' ? 'text-green-600' : 'text-blue-600'}`}>{t(o.status) || o.status.replace(/_/g, ' ')}</span></div>
                                    </div>
                                ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesmanDashboard;
