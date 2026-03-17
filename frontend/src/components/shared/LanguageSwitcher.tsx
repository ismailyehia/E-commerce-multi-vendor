import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { HiOutlineTranslate, HiOutlineCheck } from 'react-icons/hi';

const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' }
];

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const currentLanguage = languages.find(l => l.code === i18n.language) || languages[0];

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
        setIsOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-dark-50 hover:bg-dark-100 transition-colors text-dark-700"
            >
                <HiOutlineTranslate className="w-5 h-5 text-primary-600" />
                <span className="text-sm font-medium hidden sm:block">{currentLanguage.name}</span>
                <span className="text-lg sm:hidden">{currentLanguage.flag}</span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-full mt-2 right-0 bg-white rounded-2xl shadow-xl border border-dark-100 py-2 min-w-[160px] z-50 overflow-hidden"
                    >
                        {languages.map((lng) => (
                            <button
                                key={lng.code}
                                onClick={() => changeLanguage(lng.code)}
                                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${i18n.language === lng.code
                                        ? 'bg-primary-50 text-primary-700 font-semibold'
                                        : 'text-dark-600 hover:bg-dark-50'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-lg">{lng.flag}</span>
                                    <span>{lng.name}</span>
                                </div>
                                {i18n.language === lng.code && (
                                    <HiOutlineCheck className="w-4 h-4 text-primary-600" />
                                )}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LanguageSwitcher;
