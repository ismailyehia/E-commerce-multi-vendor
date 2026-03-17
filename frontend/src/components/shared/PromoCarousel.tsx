import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface Slide {
    image: string;
    title: string;
    subtitle: string;
    cta: string;
    link: string;
    color: string;
}

const slides: Slide[] = [
    {
        image: '/banner-electronics.png',
        title: 'Tech Deals',
        subtitle: 'Up to 40% off on electronics',
        cta: 'Shop Electronics',
        link: '/products?category=electronics',
        color: 'from-purple-600/80 to-blue-600/80',
    },
    {
        image: '/banner-fashion.png',
        title: 'New Season Arrivals',
        subtitle: 'Discover the latest fashion trends',
        cta: 'Shop Fashion',
        link: '/products?category=fashion',
        color: 'from-amber-600/80 to-orange-600/80',
    },
    {
        image: '/banner-fitness.png',
        title: 'Get Fit, Stay Strong',
        subtitle: 'Premium sports & fitness gear',
        cta: 'Shop Sports',
        link: '/products?category=sports',
        color: 'from-green-600/80 to-teal-600/80',
    },
    {
        image: '/banner-beauty.png',
        title: 'Glow Up Sale',
        subtitle: 'Luxury skincare & beauty essentials',
        cta: 'Shop Beauty',
        link: '/products?category=beauty',
        color: 'from-pink-600/80 to-rose-600/80',
    },
];

const AUTOPLAY_INTERVAL = 5000;

const PromoCarousel = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const [current, setCurrent] = useState(0);
    const [direction, setDirection] = useState(1);

    const next = useCallback(() => {
        setDirection(1);
        setCurrent((prev) => (prev + 1) % slides.length);
    }, []);

    const prev = useCallback(() => {
        setDirection(-1);
        setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
    }, []);

    const goTo = useCallback((index: number) => {
        setDirection(index > current ? 1 : -1);
        setCurrent(index);
    }, [current]);

    // Autoplay
    useEffect(() => {
        const timer = setInterval(next, AUTOPLAY_INTERVAL);
        return () => clearInterval(timer);
    }, [next]);

    const variants = {
        enter: () => ({ opacity: 0 }),
        center: { opacity: 1 },
        exit: () => ({ opacity: 0 }),
    };

    const slide = slides[current];

    return (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl" style={{ aspectRatio: '3 / 1', minHeight: '200px' }}>
                <AnimatePresence initial={false} custom={direction}>
                    <motion.div
                        key={current}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.6, ease: 'easeInOut' }}
                        className="absolute inset-0"
                    >
                        {/* Background Image */}
                        <img
                            src={slide.image}
                            alt={slide.title}
                            className="w-full h-full object-cover"
                        />
                        {/* Content */}
                        <div className="absolute inset-0 flex items-center px-8 sm:px-14">
                            <div>
                                <motion.h3
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 sm:mb-3 drop-shadow-lg"
                                >
                                    {t(slide.title.toLowerCase().replace(/ /g, '_')) || slide.title}
                                </motion.h3>
                                <motion.p
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-sm sm:text-lg text-white/90 mb-4 sm:mb-6 drop-shadow"
                                >
                                    {slide.subtitle}
                                </motion.p>
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                                    <Link
                                        to={slide.link}
                                        className="inline-block px-6 py-2.5 sm:px-8 sm:py-3 bg-white text-dark-800 font-semibold rounded-xl hover:bg-white/90 transition-colors text-sm sm:text-base shadow-lg"
                                    >
                                        {slide.cta}
                                    </Link>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Nav Arrows */}
                <button
                    onClick={prev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-colors z-10"
                    aria-label="Previous slide"
                >
                    {isRtl ? <HiChevronRight className="w-5 h-5 sm:w-6 sm:h-6" /> : <HiChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />}
                </button>
                <button
                    onClick={next}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-colors z-10"
                    aria-label="Next slide"
                >
                    {isRtl ? <HiChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" /> : <HiChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />}
                </button>

                {/* Dot Indicators */}
                <div className="absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
                    {slides.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => goTo(i)}
                            className={`rounded-full transition-all duration-300 ${i === current
                                ? 'w-8 h-2.5 bg-white'
                                : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/60'
                                }`}
                            aria-label={`Go to slide ${i + 1}`}
                        />
                    ))}
                </div>

                {/* Progress Bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-10">
                    <motion.div
                        key={current}
                        className="h-full bg-white/60"
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: AUTOPLAY_INTERVAL / 1000, ease: 'linear' }}
                    />
                </div>
            </div>
        </section>
    );
};

export default PromoCarousel;
