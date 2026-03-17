import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineUser, HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook } from 'react-icons/fa';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { login, register } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
    const [showPassword, setShowPassword] = useState(false);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { loading, error } = useAppSelector(s => s.auth);
    const from = (location.state as any)?.from?.pathname || '/';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLogin && formData.password !== formData.confirmPassword) {
            return toast.error('Passwords do not match');
        }
        try {
            if (isLogin) {
                await dispatch(login({ email: formData.email, password: formData.password })).unwrap();
            } else {
                await dispatch(register({ name: formData.name, email: formData.email, password: formData.password })).unwrap();
            }
            toast.success(isLogin ? 'Welcome back!' : 'Account created!');
            navigate(from, { replace: true });
        } catch (err: any) {
            toast.error(err || 'Authentication failed');
        }
    };

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });

    return (
        <div className="min-h-screen flex">
            {/* Left - Form */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
                    <div className="flex items-center gap-2 mb-8">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                            <span className="text-white font-bold text-xl">E</span>
                        </div>
                        <span className="text-2xl font-bold gradient-text">E-Store</span>
                    </div>

                    <h1 className="text-3xl font-bold text-dark-900 mb-2">{isLogin ? 'Welcome back' : 'Create account'}</h1>
                    <p className="text-dark-400 mb-8">{isLogin ? 'Sign in to continue shopping' : 'Join us and start shopping'}</p>

                    {/* Social Login */}
                    <div className="flex gap-3 mb-6">
                        <button className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-dark-200 rounded-xl hover:bg-dark-50 transition-colors">
                            <FcGoogle className="w-5 h-5" /> Google
                        </button>
                        <button className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-dark-200 rounded-xl hover:bg-dark-50 transition-colors">
                            <FaFacebook className="w-5 h-5 text-blue-600" /> Facebook
                        </button>
                    </div>

                    <div className="flex items-center gap-4 mb-6">
                        <hr className="flex-1 border-dark-200" /><span className="text-sm text-dark-400">or</span><hr className="flex-1 border-dark-200" />
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <div className="relative">
                                <HiOutlineUser className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400 w-5 h-5" />
                                <input name="name" type="text" placeholder="Full Name" value={formData.name} onChange={onChange} required className="input-field pl-12" />
                            </div>
                        )}
                        <div className="relative">
                            <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400 w-5 h-5" />
                            <input name="email" type="email" placeholder="Email address" value={formData.email} onChange={onChange} required className="input-field pl-12" />
                        </div>
                        <div className="relative">
                            <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400 w-5 h-5" />
                            <input name="password" type={showPassword ? 'text' : 'password'} placeholder="Password" value={formData.password} onChange={onChange} required minLength={6} className="input-field pl-12 pr-12" />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400">
                                {showPassword ? <HiOutlineEyeOff className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                            </button>
                        </div>
                        {!isLogin && (
                            <div className="relative">
                                <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400 w-5 h-5" />
                                <input name="confirmPassword" type="password" placeholder="Confirm Password" value={formData.confirmPassword} onChange={onChange} required className="input-field pl-12" />
                            </div>
                        )}

                        {isLogin && (
                            <div className="flex justify-end"><a href="#" className="text-sm text-primary-600 hover:underline">Forgot password?</a></div>
                        )}

                        <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base disabled:opacity-60">
                            {loading ? (
                                <span className="flex items-center justify-center gap-2"><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Please wait...</span>
                            ) : (isLogin ? 'Sign In' : 'Create Account')}
                        </button>
                    </form>

                    <p className="text-center text-sm text-dark-400 mt-6">
                        {isLogin ? "Don't have an account?" : 'Already have an account?'}
                        <button onClick={() => { setIsLogin(!isLogin); setFormData({ name: '', email: '', password: '', confirmPassword: '' }); }}
                            className="text-primary-600 font-medium ml-1 hover:underline">
                            {isLogin ? 'Sign Up' : 'Sign In'}
                        </button>
                    </p>
                </motion.div>
            </div>

            {/* Right - Visual */}
            <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 items-center justify-center p-12 relative overflow-hidden">
                <div className="absolute top-20 right-20 w-64 h-64 bg-accent-400/20 rounded-full blur-3xl" />
                <div className="absolute bottom-20 left-20 w-80 h-80 bg-primary-400/20 rounded-full blur-3xl" />
                <div className="relative z-10 text-center">
                    <div className="text-9xl mb-8">🛒</div>
                    <h2 className="text-4xl font-bold text-white mb-4">Start Shopping Now</h2>
                    <p className="text-primary-200 text-lg max-w-md">Discover thousands of products from top brands with exclusive deals.</p>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
