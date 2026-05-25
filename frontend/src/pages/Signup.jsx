import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { motion } from 'framer-motion';
import Icon from '../components/ui/Icon';

export const Signup = () => {
  const { signup } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const currencies = [
    { code: 'USD', name: 'US Dollar ($)' },
    { code: 'EUR', name: 'Euro (€)' },
    { code: 'GBP', name: 'Pound Sterling (£)' },
    { code: 'INR', name: 'Indian Rupee (₹)' },
    { code: 'JPY', name: 'Japanese Yen (¥)' },
    { code: 'AUD', name: 'Australian Dollar (A$)' },
    { code: 'CAD', name: 'Canadian Dollar (C$)' },
  ];

  const validate = () => {
    const tempErrors = {};
    if (!name.trim()) tempErrors.name = 'Full Name is required';
    if (!email) tempErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) tempErrors.email = 'Email is invalid';
    if (!password) tempErrors.password = 'Password is required';
    else if (password.length < 6) tempErrors.password = 'Password must be at least 6 characters';
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await signup(name, email, password, currency);
      showToast('Account registered successfully!', 'success');
      navigate('/dashboard');
    } catch (err) {
      showToast(err.message || 'Registration failed. Please try again.', 'error');
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
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary-600 to-primary-400 mx-auto flex items-center justify-center glow-red-lg text-white mb-4">
            <Icon name="Activity" size={32} />
          </div>
          <h2 className="text-2xl font-bold tracking-wider text-gray-800 dark:text-white">Create Account</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Build your personalized wealth dashboard
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Full Name
            </label>
            <div className="relative">
              <Icon
                name="User"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Alex Mercer"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="glass-input pl-12"
              />
            </div>
            {errors.name && (
              <p className="text-xs font-medium text-red-500 mt-1 flex items-center gap-1">
                <Icon name="AlertCircle" size={12} /> {errors.name}
              </p>
            )}
          </div>

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
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Password
            </label>
            <div className="relative">
              <Icon
                name="Lock"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="password"
                placeholder="Min 6 characters"
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

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Preferred Currency
            </label>
            <div className="relative">
              <Icon
                name="Coins"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="glass-input pl-12 appearance-none cursor-pointer"
              >
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
              <Icon
                name="ChevronDown"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                size={18}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg hover:shadow-primary-500/20 transition-all duration-200 transform active:scale-95 flex items-center justify-center gap-2 glow-red mt-6"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Register</span>
                <Icon name="UserPlus" size={18} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-light-border dark:border-dark-border pt-4 text-sm text-gray-500 dark:text-gray-400">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-primary-500 hover:text-primary-400 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;
