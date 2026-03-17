import { useState, useEffect } from 'react';
import { HiOutlinePencil, HiOutlineTrash, HiOutlinePlus, HiOutlineSearch } from 'react-icons/hi';
import api from '../../api/axiosClient';
import type { User, Pagination as PT } from '../../types';
import Pagination from '../../components/shared/Pagination';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const AdminUsers = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const [users, setUsers] = useState<User[]>([]);
    const [pagination, setPagination] = useState<PT>({ page: 1, limit: 10, total: 0, pages: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editUser, setEditUser] = useState<User | null>(null);
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'customer', phone: '' });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(pagination.page), limit: '10' });
            if (search) params.set('search', search);
            if (roleFilter) params.set('role', roleFilter);
            const { data } = await api.get(`/users?${params}`);
            setUsers(data.users || []);
            setPagination(data.pagination || { page: 1, limit: 10, total: 0, pages: 0 });
        } catch { }
        setLoading(false);
    };

    useEffect(() => { fetchUsers(); }, [pagination.page, search, roleFilter]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editUser) { await api.put(`/users/${editUser.id}`, form); toast.success(t('updated_success') || 'Updated'); }
            else { await api.post('/users', form); toast.success(t('created_success') || 'Created'); }
            setShowForm(false); setEditUser(null); fetchUsers();
        } catch (err: any) { toast.error(err.response?.data?.message || t('failed_generic') || 'Failed'); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t('delete_confirm') || 'Delete this user?')) return;
        try { await api.delete(`/users/${id}`); toast.success(t('deleted_success') || 'Deleted'); fetchUsers(); }
        catch { toast.error(t('failed_generic') || 'Failed'); }
    };

    const roleColors: Record<string, string> = { admin: 'bg-purple-100 text-purple-700', salesman: 'bg-blue-100 text-blue-700', deliveryman: 'bg-orange-100 text-orange-700', customer: 'bg-green-100 text-green-700' };

    return (
        <div>
            <div className={`flex items-center justify-between mb-6 flex-wrap gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <h1 className="text-xl font-bold text-dark-800">{t('users_count') || 'Users'} ({pagination.total})</h1>
                <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <div className="relative">
                        <HiOutlineSearch className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-dark-400 w-4 h-4`} />
                        <input value={search} onChange={e => { setSearch(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
                            placeholder={t('search_users') || "Search users..."} className={`${isRtl ? 'pr-9 pl-4 text-right' : 'pl-9 pr-4'} py-2 text-sm bg-dark-50 rounded-lg border-none focus:ring-2 focus:ring-primary-500 w-48`} />
                    </div>
                    <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
                        className={`px-3 py-2 text-sm bg-dark-50 rounded-lg border-none focus:ring-2 focus:ring-primary-500 ${isRtl ? 'text-right' : ''}`}>
                        <option value="">{t('all_roles') || 'All Roles'}</option>
                        <option value="customer">{t('role_customer') || 'Customer'}</option><option value="salesman">{t('role_salesman') || 'Salesman'}</option>
                        <option value="deliveryman">{t('role_deliveryman') || 'Deliveryman'}</option><option value="admin">{t('role_admin') || 'Admin'}</option>
                    </select>
                    <button onClick={() => { setEditUser(null); setForm({ name: '', email: '', password: '', role: 'customer', phone: '' }); setShowForm(true); }}
                        className="btn-primary py-2 text-sm flex items-center gap-1"><HiOutlinePlus className="w-4 h-4" /> {t('add_user') || 'Add User'}</button>
                </div>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className={`card p-6 mb-6 space-y-4 ${isRtl ? 'text-right' : ''}`}>
                    <h2 className="text-lg font-semibold">{editUser ? t('edit_user') : t('new_user')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="text-sm font-medium text-dark-600 mb-1 block">{t('name')} *</label>
                            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={`input-field ${isRtl ? 'text-right' : ''}`} required /></div>
                        <div><label className="text-sm font-medium text-dark-600 mb-1 block">{t('email')} *</label>
                            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={`input-field ${isRtl ? 'text-right' : ''}`} required /></div>
                        {!editUser && <div><label className="text-sm font-medium text-dark-600 mb-1 block">{t('password')} *</label>
                            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className={`input-field ${isRtl ? 'text-right' : ''}`} required minLength={6} /></div>}
                        <div><label className="text-sm font-medium text-dark-600 mb-1 block">{t('role')}</label>
                            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className={`input-field ${isRtl ? 'text-right' : ''}`}>
                                <option value="customer">{t('role_customer')}</option><option value="salesman">{t('role_salesman')}</option>
                                <option value="deliveryman">{t('role_deliveryman')}</option><option value="admin">{t('role_admin')}</option></select></div>
                        <div><label className="text-sm font-medium text-dark-600 mb-1 block">{t('phone')}</label>
                            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={`input-field ${isRtl ? 'text-right' : ''}`} /></div>
                    </div>
                    <div className={`flex gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}><button type="submit" className="btn-primary">{t('save')}</button>
                        <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">{t('cancel')}</button></div>
                </form>
            )}

            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-dark-50 border-b border-dark-100">
                            <tr className={isRtl ? 'flex-row-reverse' : ''}>{['user', 'email', 'role', 'status', 'joined', 'actions'].map(h => <th key={h} className={`${isRtl ? 'text-right' : 'text-left'} px-4 py-3 text-xs font-semibold text-dark-500 uppercase`}>{t(h)}</th>)}</tr>
                        </thead>
                        <tbody className="divide-y divide-dark-50">
                            {loading ? Array(5).fill(0).map((_, i) => <tr key={i}><td colSpan={6} className="px-4 py-4"><div className="h-4 skeleton" /></td></tr>)
                                : users.length === 0 ? <tr><td colSpan={6} className="text-center py-10 text-dark-400">{t('no_users_found')}</td></tr>
                                    : users.map(u => (
                                        <tr key={u.id} className="hover:bg-dark-50/50">
                                            <td className="px-4 py-3">
                                                <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse text-right' : ''}`}>
                                                    <div className="w-9 h-9 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center"><span className="text-white text-sm font-medium">{u.name?.[0]}</span></div>
                                                    <span className="font-medium text-dark-800">{u.name}</span>
                                                </div>
                                            </td>
                                            <td className={`px-4 py-3 text-dark-500 ${isRtl ? 'text-right' : ''}`}>{u.email}</td>
                                            <td className={`px-4 py-3 ${isRtl ? 'text-right' : ''}`}><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${roleColors[u.role] || ''}`}>{t(`role_${u.role}`) || u.role}</span></td>
                                            <td className={`px-4 py-3 ${isRtl ? 'text-right' : ''}`}><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{u.isActive ? t('active') : t('inactive')}</span></td>
                                            <td className={`px-4 py-3 text-dark-400 text-xs ${isRtl ? 'text-right' : ''}`}>{new Date(u.createdAt).toLocaleDateString(i18n.language)}</td>
                                            <td className={`px-4 py-3 ${isRtl ? 'text-right' : ''}`}>
                                                <div className={`flex gap-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                                    <button onClick={() => { setEditUser(u); setForm({ name: u.name, email: u.email, password: '', role: u.role, phone: u.phone || '' }); setShowForm(true); }} className="p-1.5 hover:bg-dark-100 rounded-lg"><HiOutlinePencil className="w-4 h-4 text-dark-400" /></button>
                                                    <button onClick={() => handleDelete(u.id)} className="p-1.5 hover:bg-red-50 rounded-lg"><HiOutlineTrash className="w-4 h-4 text-red-400" /></button>
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

export default AdminUsers;
