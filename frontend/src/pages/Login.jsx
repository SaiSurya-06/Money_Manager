import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { motion } from 'framer-motion';
import Icon from '../components/ui/Icon';

export const Login = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const tempErrors = {};
    if (!email) tempErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) tempErrors.email = 'Email is invalid';
    if (!password) tempErrors.password = 'Password is required';
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await login(email, password);
      showToast('Logged in successfully!', 'success');
      navigate('/dashboard');
    } catch (err) {
      showToast(err.message || 'Login failed. Please check your credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 mesh-gradient relative overflow-hidden">
      {/* Background Floating Ambient Blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary-500/10 blur-[120px] animate-pulse-slow pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-primary-600/5 blur-[120px] animate-pulse-slow pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md glass-card rounded-3xl shadow-2xl p-8 relative z-10"
      >
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary-600 to-primary-400 mx-auto flex items-center justify-center glow-red-lg text-white mb-4">
            <Icon name="Activity" size={32} />
          </div>
          <h2 className="text-2xl font-bold tracking-wider text-gray-800 dark:text-white">Welcome Back</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Access your premium finance control room
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Email Address
            </label>
            <div className="relative">
              <Icon
                name="Mail"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="email"
                placeholder="alex@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-input pl-12"
              />
            </div>
            {errors.email && (
              <p className="text-xs font-medium text-red-500 mt-1 flex items-center gap-1">
                <Icon name="AlertCircle" size={12} /> {errors.email}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Password
              </label>
            </div>
            <div className="relative">
              <Icon
                name="Lock"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass-input pl-12"
              />
            </div>
            {errors.password && (
              <p className="text-xs font-medium text-red-500 mt-1 flex items-center gap-1">
                <Icon name="AlertCircle" size={12} /> {errors.password}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg hover:shadow-primary-500/20 transition-all duration-200 transform active:scale-95 flex items-center justify-center gap-2 glow-red"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Sign In</span>
                <Icon name="ArrowRight" size={18} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-light-border dark:border-dark-border pt-6 text-sm text-gray-500 dark:text-gray-400">
          Don't have an account?{' '}
          <Link
            to="/signup"
            className="font-semibold text-primary-500 hover:text-primary-400 transition-colors"
          >
            Create an Account
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
