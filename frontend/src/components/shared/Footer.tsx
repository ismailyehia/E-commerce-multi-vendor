import { Link } from 'react-router-dom';
import { HiOutlineMail } from 'react-icons/hi';
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

const Footer = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    return (
        <footer className="bg-dark-900 text-dark-300 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                                <span className="text-white font-bold text-lg">E</span>
                            </div>
                            <span className="text-xl font-bold text-white">{t('e_store') || 'E-Store'}</span>
                        </div>
                        <p className="text-sm text-dark-400 mb-4">{t('footer_desc') || 'Your premium online shopping destination. Quality products, fast delivery, and exceptional customer service.'}</p>
                        <div className="flex gap-3">
                            {[FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn].map((Icon, i) => (
                                <a key={i} href="#" className="w-9 h-9 bg-dark-800 rounded-lg flex items-center justify-center hover:bg-primary-600 transition-colors">
                                    <Icon className="w-4 h-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">{t('quick_links') || 'Quick Links'}</h3>
                        <ul className="space-y-2.5">
                            {[['/', t('home')], ['/products', t('all_products')], ['/products?sort=newest', t('new_arrivals') || 'New Arrivals'], ['/products?sort=best_selling', t('best_selling')]].map(([href, label]) => (
                                <li key={href}><Link to={href} className="text-sm text-dark-400 hover:text-primary-400 transition-colors">{label}</Link></li>
                            ))}
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">{t('support') || 'Support'}</h3>
                        <ul className="space-y-2.5">
                            {[t('help_center') || 'Help Center', t('shipping_info') || 'Shipping Info', t('returns_exchanges') || 'Returns & Exchanges', t('order_tracking') || 'Order Tracking', t('contact_us') || 'Contact Us'].map((item) => (
                                <li key={item}><a href="#" className="text-sm text-dark-400 hover:text-primary-400 transition-colors">{item}</a></li>
                            ))}
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">{t('newsletter') || 'Newsletter'}</h3>
                        <p className="text-sm text-dark-400 mb-3">{t('newsletter_desc') || 'Subscribe for exclusive deals and updates.'}</p>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <HiOutlineMail className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-dark-500`} />
                                <input type="email" placeholder={t('enter_email')} className={`w-full ${isRtl ? 'pr-10 pl-3' : 'pl-10 pr-3'} py-2.5 bg-dark-800 rounded-lg text-sm text-white border-none focus:outline-none focus:ring-2 focus:ring-primary-500`} />
                            </div>
                            <button className="px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">{t('subscribe')}</button>
                        </div>
                    </div>
                </div>

                <div className="border-t border-dark-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-dark-500">&copy; {new Date().getFullYear()} {t('e_store') || 'E-Store'}. {t('all_rights_reserved') || 'All rights reserved.'}</p>
                    <div className="flex gap-4 text-sm text-dark-500">
                        <a href="#" className="hover:text-primary-400 transition-colors">{t('privacy') || 'Privacy'}</a>
                        <a href="#" className="hover:text-primary-400 transition-colors">{t('terms') || 'Terms'}</a>
                        <a href="#" className="hover:text-primary-400 transition-colors">{t('cookies') || 'Cookies'}</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
