import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineArrowRight, HiOutlineTruck, HiOutlineShieldCheck, HiOutlineCreditCard, HiOutlineSupport } from 'react-icons/hi';
import api from '../../api/axiosClient';
import type { Product, Category, Ad } from '../../types';
import ProductCard from '../../components/shared/ProductCard';
import LoadingSkeleton from '../../components/shared/LoadingSkeleton';
import PromoCarousel from '../../components/shared/PromoCarousel';

import { useTranslation } from 'react-i18next';

const HomePage = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const [featured, setFeatured] = useState<Product[]>([]);
    const [newArrivals, setNewArrivals] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [ads, setAds] = useState<Ad[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [featuredRes, newRes, catRes, adsRes] = await Promise.all([
                    api.get('/products/featured'),
                    api.get('/products/new-arrivals'),
                    api.get('/categories'),
                    api.get('/ads?placement=homepage')
                ]);
                setFeatured(featuredRes.data);
                setNewArrivals(newRes.data);
                setCategories(catRes.data);
                setAds(adsRes.data);
            } catch (err) { console.error(err); }
            setLoading(false);
        };
        fetchData();
    }, []);

    const features = [
        { icon: HiOutlineTruck, title: t('free_shipping'), desc: t('shipping_desc') },
        { icon: HiOutlineShieldCheck, title: t('secure_payment'), desc: t('payment_desc') },
        { icon: HiOutlineCreditCard, title: t('easy_returns'), desc: t('returns_desc') },
        { icon: HiOutlineSupport, title: t('support_247'), desc: t('support_desc') }
    ];


    return (
        <div className="min-h-screen bg-home-bg transition-colors duration-500">
            {/* Hero */}
            <section className="relative overflow-hidden min-h-[520px] sm:min-h-[700px] lg:min-h-[850px] flex items-center">
                {/* 3D Background */}
                <div className="absolute inset-0 z-0 select-none pointer-events-none">
                    <iframe 
                        src="https://my.spline.design/vrworldherocopycopy-tilx9wCCSMX4P2vZTy6zGnaj-TJi/" 
                        className="w-full h-full scale-[1.3] origin-center object-cover opacity-60"
                        style={{ border: 'none' }}
                        title="3D Background"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-r ${isRtl ? 'from-transparent via-black/20 to-black/80' : 'from-black/80 via-black/20 to-transparent'} z-10`} />
                </div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative z-10 w-full">
                    <motion.div initial={{ opacity: 0, x: isRtl ? 30 : -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="max-w-2xl">
                        <span className="inline-block px-4 py-1.5 bg-white/15 text-white rounded-full text-sm font-medium mb-6 backdrop-blur-sm border border-white/20">
                            ✨ {t('new_collection')}
                        </span>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                            {t('hero_title')} <span className="bg-gradient-to-r from-accent-400 to-yellow-300 bg-clip-text text-transparent">{t('hero_span')}</span>
                        </h1>
                        <p className="text-lg text-white/80 mb-8 max-w-lg">
                            {t('hero_subtitle')}
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link to="/products" className="btn-primary text-base px-8 py-3 flex items-center gap-2">
                                {t('shop_now')} <HiOutlineArrowRight className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
                            </Link>
                            <Link to="/products?sort=newest" className="btn-secondary bg-white/10 border-white/20 text-white hover:bg-white/20 px-8 py-3">
                                {t('new_arrival')}
                            </Link>
                        </div>
                        <div className="flex items-center gap-8 mt-10">
                            <div><p className="text-3xl font-bold text-white">10K+</p><p className="text-white/60 text-sm">{t('products_count')}</p></div>
                            <div className="w-px h-10 bg-white/20" />
                            <div><p className="text-3xl font-bold text-white">50K+</p><p className="text-white/60 text-sm">{t('customers_count')}</p></div>
                            <div className="w-px h-10 bg-white/20" />
                            <div><p className="text-3xl font-bold text-white">4.9</p><p className="text-white/60 text-sm">{t('rating')}</p></div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Features */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {features.map((f, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                            className="glass p-4 sm:p-5 flex items-center gap-3">
                            <div className="w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center shrink-0 border border-white/10">
                                <f.icon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="font-semibold text-white text-sm">{f.title}</p>
                                <p className="text-xs text-white/60">{f.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Categories */}
            <section className="page-container">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white">{t('shop_by_category')}</h2>
                        <p className="text-dark-200 mt-1">{t('browse_selection')}</p>
                    </div>
                    <Link to="/products" className="text-primary-600 font-medium text-sm hover:underline flex items-center gap-1">
                        {t('view_all')} <HiOutlineArrowRight className={`${isRtl ? 'rotate-180' : ''}`} />
                    </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
                    {(loading ? Array(5).fill(null) : categories).map((cat, i) => (
                        cat ? (
                            <Link key={cat.id} to={`/products?category=${cat.id}`}
                                className="group relative overflow-hidden rounded-2xl aspect-square sm:aspect-[4/5] bg-dark-100 hover:shadow-2xl transition-all duration-500">
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="w-full h-full">
                                    <img
                                        src={cat.image || '/placeholder-cat.png'}
                                        alt={cat.name}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-black/90 transition-all" />
                                    <div className="absolute bottom-0 left-0 right-0 p-4 text-center">
                                        <p className="font-bold text-white text-base sm:text-lg mb-1">{cat.name}</p>
                                        <span className="text-white/70 text-[10px] sm:text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300 block">
                                            {t('explore_more')}
                                        </span>
                                    </div>
                                </motion.div>
                            </Link>
                        ) : (
                            <div key={i} className="rounded-2xl aspect-square sm:aspect-[4/5] bg-dark-100 animate-pulse" />
                        )
                    ))}
                </div>
            </section>

            {/* Promo Carousel */}
            <PromoCarousel />

            {/* Banner Ad */}
            {ads.length > 0 && (
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
                    <Link to={ads[0].link || '#'} onClick={() => api.post(`/ads/${ads[0].id}/click`).catch(() => { })}
                        className="block relative overflow-hidden rounded-3xl bg-gradient-to-r from-accent-500 to-primary-600 p-8 sm:p-12">
                        <div className="relative z-10">
                            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">{ads[0].title}</h3>
                            <p className="text-white/80 mb-4">{t('limited_offer')}</p>
                            <span className="inline-flex items-center gap-2 bg-white text-primary-600 px-6 py-2.5 rounded-xl font-medium">{t('shop_now')} <HiOutlineArrowRight className={`${isRtl ? 'rotate-180' : ''}`} /></span>
                        </div>
                        <div className={`absolute top-0 ${isRtl ? 'left-0 -translate-x-1/2' : 'right-0 translate-x-1/2'} w-64 h-64 bg-white/10 rounded-full -translate-y-1/2`} />
                    </Link>
                </section>
            )}

            {/* Featured Products */}
            {featured.length > 0 && (
                <section className="page-container">
                    <div className="flex items-center justify-between mb-8">
                        <div><h2 className="text-2xl sm:text-3xl font-bold text-white">{t('featured_products')}</h2><p className="text-dark-200 mt-1">{t('handpicked_for_you')}</p></div>
                        <Link to="/products?featured=true" className="text-primary-400 font-medium text-sm hover:underline flex items-center gap-1">{t('view_all')} <HiOutlineArrowRight className={`${isRtl ? 'rotate-180' : ''}`} /></Link>
                    </div>
                    {loading ? <LoadingSkeleton type="card" count={4} /> : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                            {featured.slice(0, 8).map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
                        </div>
                    )}
                </section>
            )}

            {/* New Arrivals */}
            {newArrivals.length > 0 && (
                <section className="page-container">
                    <div className="flex items-center justify-between mb-8">
                        <div><h2 className="text-2xl sm:text-3xl font-bold text-white">{t('new_arrival')}</h2><p className="text-dark-200 mt-1">{t('fresh_off_shelf')}</p></div>
                        <Link to="/products?sort=newest" className="text-primary-400 font-medium text-sm hover:underline flex items-center gap-1">{t('view_all')} <HiOutlineArrowRight className={`${isRtl ? 'rotate-180' : ''}`} /></Link>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                        {newArrivals.slice(0, 4).map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
                    </div>
                </section>
            )}

            {/* Newsletter CTA */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10"><div className="absolute top-0 left-1/4 w-64 h-64 bg-white rounded-full blur-3xl" /></div>
                    <div className="relative z-10">
                        <h2 className="text-3xl font-bold text-white mb-3">{t('stay_in_loop')}</h2>
                        <p className="text-primary-200 mb-6 max-w-md mx-auto">{t('subscribe_desc')}</p>
                        <div className="flex max-w-md mx-auto gap-3">
                            <input type="email" placeholder={t('enter_email')} className="flex-1 px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/60 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/50" />
                            <button className="px-6 py-3 bg-white text-primary-700 rounded-xl font-semibold hover:bg-primary-50 transition-colors">{t('subscribe')}</button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default HomePage;
