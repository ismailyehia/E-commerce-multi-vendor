import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineShoppingBag, HiOutlineHeart, HiOutlineSearch, HiMenu, HiX } from 'react-icons/hi';
import { useAppSelector, useAppDispatch } from '../../hooks/useRedux';
import { logout } from '../../store/slices/authSlice';
import { closeMobileMenu, toggleMobileMenu } from '../../store/slices/uiSlice';
import api from '../../api/axiosClient';
import type { Product } from '../../types';

import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

const Navbar = () => {
    const { t } = useTranslation();
    const { user, isAuthenticated } = useAppSelector((s: any) => s.auth);
    const { items } = useAppSelector((s: any) => s.cart);
    const { mobileMenuOpen } = useAppSelector((s: any) => s.ui);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const isHomePage = location.pathname === '/';
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<Product[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSuggestions(false);
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length >= 2) {
                try {
                    const { data } = await api.get(`/products/autocomplete?q=${searchQuery}`);
                    setSuggestions(data);
                    setShowSuggestions(true);
                } catch { setSuggestions([]); }
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) { navigate(`/search?q=${encodeURIComponent(searchQuery)}`); setShowSuggestions(false); }
    };

    const handleLogout = () => { dispatch(logout()); setShowUserMenu(false); navigate('/'); };

    const getDashboardLink = () => {
        if (!user) return '/login';
        switch (user.role) {
            case 'admin': return '/admin';
            case 'salesman': return '/salesman';
            case 'deliveryman': return '/delivery';
            default: return '/profile';
        }
    };

    const cartCount = items.reduce((sum: number, item: any) => sum + item.quantity, 0);
    const wishlistCount = user?.wishlist?.length || 0;

    return (
        <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-home-bg/95 backdrop-blur-md shadow-lg border-b border-white/5' : isHomePage ? 'bg-home-bg' : 'bg-white/95 backdrop-blur-sm'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 lg:h-18">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3 shrink-0">
                        <img src="/logo.png" alt="LegendaryCommerce" className="w-14 h-14 object-contain" />
                        <span className={`hidden sm:block text-xl font-bold ${isHomePage && !scrolled ? 'text-white' : 'gradient-text'}`}>LegendaryCommerce</span>
                    </Link>

                    {/* Search */}
                    <div ref={searchRef} className="hidden md:block flex-1 max-w-xl mx-8 relative">
                        <form onSubmit={handleSearch} className="relative">
                            <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400 w-5 h-5" />
                            <input
                                type="text" value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t('search_placeholder')}
                                className={`w-full pl-12 pr-4 py-2.5 rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${isHomePage || scrolled ? 'bg-white/10 text-white placeholder-white/50' : 'bg-dark-50 text-dark-800'}`}
                            />
                        </form>
                        <AnimatePresence>
                            {showSuggestions && suggestions.length > 0 && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                    className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-xl border border-dark-100 overflow-hidden z-50">
                                    {suggestions.map((p) => (
                                        <Link key={p.id} to={`/product/${p.slug}`} onClick={() => { setShowSuggestions(false); setSearchQuery(''); }}
                                            className="flex items-center gap-3 p-3 hover:bg-dark-50 transition-colors">
                                            <img src={p.thumbnail || '/placeholder.png'} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-dark-800 truncate">{p.name}</p>
                                                <p className="text-sm text-primary-600 font-semibold">${p.price}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 sm:gap-2">
                        <div className="hidden md:block">
                            <LanguageSwitcher />
                        </div>
                        <Link to="/wishlist" className={`relative p-2 rounded-xl transition-colors hidden sm:flex ${isHomePage || scrolled ? 'hover:bg-white/10 text-white' : 'hover:bg-dark-50 text-dark-600'}`}>
                            <HiOutlineHeart className="w-6 h-6" />
                            {wishlistCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">{wishlistCount}</span>
                            )}
                        </Link>
                        <Link to="/cart" className={`relative p-2 rounded-xl transition-colors ${isHomePage || scrolled ? 'hover:bg-white/10 text-white' : 'hover:bg-dark-50 text-dark-600'}`}>
                            <HiOutlineShoppingBag className="w-6 h-6" />
                            {cartCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-accent-500 text-white text-xs rounded-full flex items-center justify-center font-bold">{cartCount}</span>
                            )}
                        </Link>

                        {isAuthenticated ? (
                            <div ref={userMenuRef} className="relative">
                                <button onClick={() => setShowUserMenu(!showUserMenu)} className={`flex items-center gap-2 p-1.5 rounded-xl transition-colors ${isHomePage || scrolled ? 'hover:bg-white/10' : 'hover:bg-dark-50'}`}>
                                    <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                                        <span className="text-white text-sm font-medium">{user?.name?.[0]}</span>
                                    </div>
                                    <span className={`hidden lg:block text-sm font-medium ${isHomePage && !scrolled ? 'text-white' : 'text-dark-700'}`}>{user?.name?.split(' ')[0]}</span>
                                </button>
                                <AnimatePresence>
                                    {showUserMenu && (
                                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                            className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-dark-100 py-2 z-50">
                                            <div className="px-4 py-2 border-b border-dark-100">
                                                <p className="font-medium text-dark-800">{user?.name}</p>
                                                <p className="text-xs text-dark-400">{user?.email}</p>
                                                <span className="badge-info mt-1 capitalize">{user?.role}</span>
                                            </div>
                                            <Link to={getDashboardLink()} onClick={() => setShowUserMenu(false)} className="block px-4 py-2 text-sm text-dark-600 hover:bg-dark-50">Dashboard</Link>
                                            <Link to="/orders" onClick={() => setShowUserMenu(false)} className="block px-4 py-2 text-sm text-dark-600 hover:bg-dark-50">{t('orders')}</Link>
                                            <Link to="/profile" onClick={() => setShowUserMenu(false)} className="block px-4 py-2 text-sm text-dark-600 hover:bg-dark-50">Settings</Link>
                                            <hr className="my-1 border-dark-100" />
                                            <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-danger-500 hover:bg-red-50">Sign Out</button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <Link to="/login" className="btn-primary text-sm py-2 px-4">{t('login')}</Link>
                        )}

                        <div className="md:hidden">
                            <LanguageSwitcher />
                        </div>
                        <button onClick={() => dispatch(toggleMobileMenu())} className={`md:hidden p-2 rounded-xl transition-colors ${isHomePage || scrolled ? 'hover:bg-white/10 text-white' : 'hover:bg-dark-50 text-dark-900'}`}>
                            {mobileMenuOpen ? <HiX className="w-6 h-6" /> : <HiMenu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            className="md:hidden overflow-hidden border-t border-dark-100">
                            <form onSubmit={handleSearch} className="p-3">
                                <div className="relative">
                                    <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400" />
                                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('search_placeholder')}
                                        className="w-full pl-10 pr-4 py-2.5 bg-dark-50 rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-primary-500" />
                                </div>
                            </form>
                            <div className="px-3 pb-3 space-y-1">
                                <Link to="/" onClick={() => dispatch(closeMobileMenu())} className="block px-3 py-2 rounded-lg hover:bg-dark-50 text-dark-700">{t('home')}</Link>
                                <Link to="/products" onClick={() => dispatch(closeMobileMenu())} className="block px-3 py-2 rounded-lg hover:bg-dark-50 text-dark-700">{t('products')}</Link>
                                <Link to="/wishlist" onClick={() => dispatch(closeMobileMenu())} className="block px-3 py-2 rounded-lg hover:bg-dark-50 text-dark-700">{t('wishlist')}</Link>
                                <Link to="/orders" onClick={() => dispatch(closeMobileMenu())} className="block px-3 py-2 rounded-lg hover:bg-dark-50 text-dark-700">{t('orders')}</Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </header>
    );
};

export default Navbar;
