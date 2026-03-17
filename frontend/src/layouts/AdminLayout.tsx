import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineChartBar, HiOutlineCube, HiOutlineTag, HiOutlineClipboardList, HiOutlineUsers, HiOutlineSpeakerphone, HiOutlineCog, HiOutlineLogout, HiOutlineBell, HiMenu, HiX, HiOutlineTruck, HiOutlineTicket } from 'react-icons/hi';
import { useAppSelector, useAppDispatch } from '../hooks/useRedux';
import { logout } from '../store/slices/authSlice';
import LanguageSwitcher from '../components/shared/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

const AdminLayout = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileOpen, setMobileOpen] = useState(false);
    const { user } = useAppSelector(s => s.auth);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const baseUrl = user?.role === 'admin' ? '/admin' : user?.role === 'salesman' ? '/salesman' : '/delivery';

    const links = [
        { href: `${baseUrl}`, icon: HiOutlineChartBar, label: t('dashboard') },
        { href: `${baseUrl}/products`, icon: HiOutlineCube, label: t('products'), roles: ['admin', 'salesman'] },
        { href: `${baseUrl}/categories`, icon: HiOutlineTag, label: t('categories_menu'), roles: ['admin', 'salesman'] },
        { href: `${baseUrl}/orders`, icon: HiOutlineClipboardList, label: t('orders'), roles: ['admin', 'salesman'] },
        { href: '/admin/users', icon: HiOutlineUsers, label: t('users_menu'), roles: ['admin'] },
        { href: '/admin/ads', icon: HiOutlineSpeakerphone, label: t('ads_menu'), roles: ['admin'] },
        { href: `/admin/deliveries`, icon: HiOutlineTruck, label: t('deliveries_menu'), roles: ['admin'] },
        { href: '/admin/coupons', icon: HiOutlineTicket, label: t('coupons_menu'), roles: ['admin'] },
    ].filter(link => !link.roles || (user && link.roles.includes(user.role)));

    const handleLogout = () => { dispatch(logout()); navigate('/'); };

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            <div className="p-5 flex items-center gap-3 border-b border-dark-800">
                <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold">E</span>
                </div>
                {sidebarOpen && <span className="text-white font-bold text-lg capitalize">{t(`${user?.role}_panel`)}</span>}
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {links.map(link => {
                    const active = location.pathname === link.href || (link.href !== baseUrl && location.pathname.startsWith(link.href));
                    return (
                        <Link key={link.href} to={link.href} onClick={() => setMobileOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${active ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20' : 'text-dark-400 hover:text-white hover:bg-dark-800'}`}>
                            <link.icon className="w-5 h-5 shrink-0" />
                            {sidebarOpen && <span>{link.label}</span>}
                        </Link>
                    );
                })}
            </nav>
            <div className="p-3 border-t border-dark-800">
                <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-dark-400 hover:text-white hover:bg-dark-800 w-full transition-all">
                    <HiOutlineLogout className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />{sidebarOpen && <span>{t('logout')}</span>}
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-dark-50">
            {/* Desktop Sidebar */}
            <aside className={`hidden lg:block bg-dark-900 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'} shrink-0`}>
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} className="fixed inset-0 bg-black/50 z-40 lg:hidden" />
                        <motion.aside initial={{ x: isRtl ? 280 : -280 }} animate={{ x: 0 }} exit={{ x: isRtl ? 280 : -280 }}
                            className={`fixed ${isRtl ? 'right-0' : 'left-0'} top-0 bottom-0 w-64 bg-dark-900 z-50 lg:hidden`}>
                            <SidebarContent />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white border-b border-dark-100 px-4 sm:px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => { if (window.innerWidth < 1024) setMobileOpen(true); else setSidebarOpen(!sidebarOpen); }}
                            className="p-2 rounded-xl hover:bg-dark-50"><HiMenu className="w-5 h-5" /></button>
                        <h2 className="text-lg font-semibold text-dark-800 hidden sm:block capitalize">{location.pathname.split('/').pop() || 'Dashboard'}</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <LanguageSwitcher />
                        <button className="relative p-2 rounded-xl hover:bg-dark-50"><HiOutlineBell className="w-5 h-5 text-dark-500" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-accent-500 rounded-full" /></button>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center"><span className="text-white text-sm font-medium">{user?.name?.[0]}</span></div>
                            <span className="text-sm font-medium text-dark-700 hidden sm:block">{user?.name}</span>
                        </div>
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto p-4 sm:p-6"><Outlet /></main>
            </div>
        </div>
    );
};

export default AdminLayout;
