import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineUser, HiOutlineMail, HiOutlinePhone, HiOutlineTrash, HiOutlinePlus, HiOutlinePencil } from 'react-icons/hi';
import { useAppSelector, useAppDispatch } from '../../hooks/useRedux';
import { fetchMe, setUser } from '../../store/slices/authSlice';
import api from '../../api/axiosClient';
import toast from 'react-hot-toast';
import type { Address } from '../../types';

import { useTranslation } from 'react-i18next';

const ProfilePage = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const { user } = useAppSelector(s => s.auth);
    const dispatch = useAppDispatch();
    const [tab, setTab] = useState<'profile' | 'addresses' | 'security'>('profile');
    const [profile, setProfile] = useState({ name: '', email: '', phone: '' });
    const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [editAddress, setEditAddress] = useState<Partial<Address> | null>(null);
    const [editIdx, setEditIdx] = useState(-1);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) setProfile({ name: user.name, email: user.email, phone: user.phone || '' });
    }, [user]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault(); setLoading(true);
        try {
            const { data } = await api.put('/auth/profile', profile);
            dispatch(setUser(data));
            toast.success(t('profile_updated') || 'Profile updated');
        } catch { toast.error(t('failed_to_update_profile') || 'Failed to update profile'); }
        setLoading(false);
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) return toast.error(t('passwords_no_match') || 'Passwords do not match');
        setLoading(true);
        try {
            await api.put('/auth/change-password', { currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
            toast.success(t('password_changed') || 'Password changed');
        } catch (err: any) { toast.error(err.response?.data?.message || t('failed') || 'Failed'); }
        setLoading(false);
    };

    const handleSaveAddress = async () => {
        if (!editAddress) return;
        const addrs = [...(user?.addresses || [])];
        if (editIdx >= 0) addrs[editIdx] = editAddress as Address;
        else addrs.push(editAddress as Address);
        try {
            await api.put('/auth/profile', { addresses: addrs });
            await dispatch(fetchMe());
            setEditAddress(null); setEditIdx(-1);
            toast.success(t('address_saved') || 'Address saved');
        } catch { toast.error(t('failed')); }
    };

    const handleDeleteAddress = async (i: number) => {
        const addrs = (user?.addresses || []).filter((_, idx) => idx !== i);
        try {
            await api.put('/auth/profile', { addresses: addrs });
            await dispatch(fetchMe());
            toast.success(t('address_deleted') || 'Address deleted');
        } catch { toast.error(t('failed')); }
    };

    return (
        <div className="page-container">
            <h1 className="text-2xl sm:text-3xl font-bold text-dark-900 mb-8">{t('account_settings') || 'Account Settings'}</h1>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar */}
                <div className="card p-4 h-fit">
                    <div className="text-center mb-4 pb-4 border-b border-dark-100">
                        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center mb-3">
                            <span className="text-white text-3xl font-bold">{user?.name?.[0]}</span>
                        </div>
                        <p className="font-semibold text-dark-800">{user?.name}</p>
                        <p className="text-sm text-dark-400">{user?.email}</p>
                        <span className="badge-info mt-2 capitalize">{user?.role}</span>
                    </div>
                    {['profile', 'addresses', 'security'].map(t_key => (
                        <button key={t_key} onClick={() => setTab(t_key as any)}
                            className={`block w-full ${isRtl ? 'text-right' : 'text-left'} px-3 py-2.5 rounded-xl text-sm transition-all mb-1 capitalize
              ${tab === t_key ? 'bg-primary-50 text-primary-700 font-medium' : 'text-dark-500 hover:bg-dark-50'}`}>{t(t_key)}</button>
                    ))}
                </div>

                {/* Content */}
                <div className="lg:col-span-3">
                    {tab === 'profile' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-6">
                            <h2 className="text-lg font-semibold text-dark-800 mb-6">{t('personal_information') || 'Personal Information'}</h2>
                            <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-lg">
                                <div>
                                    <label className="text-sm font-medium text-dark-600 mb-1 block">{t('full_name')}</label>
                                    <div className="relative"><HiOutlineUser className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-dark-400`} />
                                        <input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} className={`input-field ${isRtl ? 'pr-12' : 'pl-12'}`} /></div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-dark-600 mb-1 block">{t('email')}</label>
                                    <div className="relative"><HiOutlineMail className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-dark-400`} />
                                        <input value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} className={`input-field ${isRtl ? 'pr-12' : 'pl-12'}`} /></div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-dark-600 mb-1 block">{t('phone')}</label>
                                    <div className="relative"><HiOutlinePhone className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-dark-400`} />
                                        <input value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} className={`input-field ${isRtl ? 'pr-12' : 'pl-12'}`} /></div>
                                </div>
                                <button type="submit" disabled={loading} className="btn-primary">{loading ? t('saving') || 'Saving...' : t('save_changes') || 'Save Changes'}</button>
                            </form>
                        </motion.div>
                    )}

                    {tab === 'addresses' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-dark-800">{t('saved_addresses')}</h2>
                                <button onClick={() => { setEditAddress({ label: 'Home', fullName: '', phone: '', street: '', city: '', state: '', zipCode: '', country: 'US', isDefault: false }); setEditIdx(-1); }}
                                    className="btn-primary py-2 text-sm flex items-center gap-1"><HiOutlinePlus className="w-4 h-4" /> {t('add') || 'Add'}</button>
                            </div>
                            {editAddress && (
                                <div className="card p-5 space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <input placeholder="Label (Home, Work...)" value={editAddress.label} onChange={e => setEditAddress({ ...editAddress, label: e.target.value })} className="input-field" />
                                        <input placeholder="Full Name" value={editAddress.fullName} onChange={e => setEditAddress({ ...editAddress, fullName: e.target.value })} className="input-field" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <input placeholder="Phone" value={editAddress.phone} onChange={e => setEditAddress({ ...editAddress, phone: e.target.value })} className="input-field" />
                                        <input placeholder="Country" value={editAddress.country} onChange={e => setEditAddress({ ...editAddress, country: e.target.value })} className="input-field" />
                                    </div>
                                    <input placeholder="Street Address" value={editAddress.street} onChange={e => setEditAddress({ ...editAddress, street: e.target.value })} className="input-field" />
                                    <div className="grid grid-cols-3 gap-3">
                                        <input placeholder="City" value={editAddress.city} onChange={e => setEditAddress({ ...editAddress, city: e.target.value })} className="input-field" />
                                        <input placeholder="State" value={editAddress.state} onChange={e => setEditAddress({ ...editAddress, state: e.target.value })} className="input-field" />
                                        <input placeholder="ZIP" value={editAddress.zipCode} onChange={e => setEditAddress({ ...editAddress, zipCode: e.target.value })} className="input-field" />
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={handleSaveAddress} className="btn-primary py-2 text-sm">{t('save') || 'Save'}</button>
                                        <button onClick={() => setEditAddress(null)} className="btn-secondary py-2 text-sm">{t('cancel') || 'Cancel'}</button>
                                    </div>
                                </div>
                            )}
                            {(user?.addresses || []).map((addr, i) => (
                                <div key={i} className="card p-4 flex items-start justify-between">
                                    <div>
                                        <p className="font-medium text-dark-800">{addr.fullName} <span className={`badge-info ${isRtl ? 'mr-2' : 'ml-2'}`}>{addr.label}</span>{addr.isDefault && <span className={`badge-success ${isRtl ? 'mr-2' : 'ml-2'}`}>{t('default') || 'Default'}</span>}</p>
                                        <p className="text-sm text-dark-500 mt-1">{addr.street}, {addr.city}, {addr.state} {addr.zipCode}, {addr.country}</p>
                                        <p className="text-sm text-dark-400">{addr.phone}</p>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => { setEditAddress(addr); setEditIdx(i); }} className="p-2 hover:bg-dark-50 rounded-lg"><HiOutlinePencil className="w-4 h-4 text-dark-400" /></button>
                                        <button onClick={() => handleDeleteAddress(i)} className="p-2 hover:bg-red-50 rounded-lg"><HiOutlineTrash className="w-4 h-4 text-red-400" /></button>
                                    </div>
                                </div>
                            ))}
                            {(user?.addresses || []).length === 0 && !editAddress && <p className="text-dark-400 text-center py-8">No saved addresses</p>}
                        </motion.div>
                    )}

                    {tab === 'security' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-6">
                            <h2 className="text-lg font-semibold text-dark-800 mb-6">{t('change_password')}</h2>
                            <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
                                <div><label className="text-sm font-medium text-dark-600 mb-1 block">{t('current_password')}</label>
                                    <input type="password" value={passwords.currentPassword} onChange={e => setPasswords({ ...passwords, currentPassword: e.target.value })} className="input-field" required /></div>
                                <div><label className="text-sm font-medium text-dark-600 mb-1 block">{t('new_password')}</label>
                                    <input type="password" value={passwords.newPassword} onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })} className="input-field" required minLength={6} /></div>
                                <div><label className="text-sm font-medium text-dark-600 mb-1 block">{t('confirm_password')}</label>
                                    <input type="password" value={passwords.confirmPassword} onChange={e => setPasswords({ ...passwords, confirmPassword: e.target.value })} className="input-field" required /></div>
                                <button type="submit" disabled={loading} className="btn-primary">{loading ? t('changing') || 'Changing...' : t('change_password')}</button>
                            </form>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
