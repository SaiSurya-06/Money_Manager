import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import apiFetch from '../utils/api';
import Icon from '../components/ui/Icon';

export const Settings = () => {
  const { user, refreshProfile, showToast: contextShowToast } = useAuth();
  const { showToast } = useToast();

  // Profile Form States
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [password, setPassword] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Categories States
  const [categories, setCategories] = useState([]);
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('Tag');
  const [catColor, setCatColor] = useState('#2196F3');
  const [catsLoading, setCatsLoading] = useState(true);

  const currencyOptions = [
    { code: 'USD', name: 'US Dollar ($)' },
    { code: 'EUR', name: 'Euro (€)' },
    { code: 'GBP', name: 'Pound Sterling (£)' },
    { code: 'INR', name: 'Indian Rupee (₹)' },
    { code: 'JPY', name: 'Japanese Yen (¥)' },
    { code: 'AUD', name: 'Australian Dollar (A$)' },
    { code: 'CAD', name: 'Canadian Dollar (C$)' },
  ];

  const iconOptions = ['Tag', 'ShoppingBag', 'Coffee', 'Gift', 'HeartPulse', 'Home', 'Tv', 'TrendingUp', 'Compass', 'Gamepad2', 'Wine', 'Activity'];
  const colorOptions = ['#2196F3', '#4CAF50', '#E53935', '#FF9800', '#9C27B0', '#009688', '#FF5722', '#607D8B', '#00BCD4', '#E91E63', '#795548', '#FFC107'];

  useEffect(() => {
    if (user) {
      setName(user.name);
      setCurrency(user.preferred_currency);
    }
  }, [user]);

  const fetchCategories = async () => {
    try {
      const data = await apiFetch('/categories');
      setCategories(data);
    } catch (err) {
      showToast('Failed to load categories.', 'error');
    } finally {
      setCatsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Name cannot be empty', 'warning');
      return;
    }

    setProfileLoading(true);
    try {
      const payload = { name, preferred_currency: currency };
      if (password) {
        payload.password = password;
      }

      await apiFetch('/users/me', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      await refreshProfile();
      setPassword('');
      showToast('Profile configuration updated!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update profile.', 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!catName.trim()) {
      showToast('Category name is required', 'warning');
      return;
    }

    try {
      await apiFetch('/categories', {
        method: 'POST',
        body: JSON.stringify({
          name: catName,
          icon: catIcon,
          color: catColor,
        }),
      });

      setCatName('');
      setCatIcon('Tag');
      setCatColor('#2196F3');
      showToast('Custom category created!', 'success');
      fetchCategories();
    } catch (err) {
      showToast(err.message || 'Error creating category', 'error');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete this category? Transactions using this category will display as Uncategorized.')) {
      return;
    }
    try {
      await apiFetch(`/categories/${id}`, {
        method: 'DELETE',
      });
      showToast('Category deleted successfully', 'success');
      fetchCategories();
    } catch (err) {
      showToast(err.message || 'Error deleting category', 'error');
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Details */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuration Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Customize currency outputs, edit profile credentials, and shape custom categories
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Profile Card */}
        <div className="glass-card p-6 md:p-8 rounded-3xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-500/10 dark:bg-primary-500/20 text-primary-500 flex items-center justify-center">
              <Icon name="User" size={20} />
            </div>
            <h2 className="text-xl font-bold">User Profile Settings</h2>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-5">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Full Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="glass-input"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Primary Currency Preference
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="glass-input"
              >
                {currencyOptions.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Change Password (Leave blank to keep current)
              </label>
              <input
                type="password"
                placeholder="New Password (optional)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass-input"
              />
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg glow-red transition-all transform active:scale-95 flex items-center gap-2"
            >
              {profileLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Icon name="Save" size={16} />
                  <span>Update Profile</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Custom Categories Manager */}
        <div className="glass-card p-6 md:p-8 rounded-3xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-500/10 dark:bg-primary-500/20 text-primary-500 flex items-center justify-center">
              <Icon name="Tag" size={20} />
            </div>
            <h2 className="text-xl font-bold">Custom Categories</h2>
          </div>

          {/* Form to Create Custom Category */}
          <form onSubmit={handleCreateCategory} className="space-y-4 bg-black/5 dark:bg-white/5 p-4 rounded-2xl border border-light-border dark:border-dark-border">
            <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wider mb-2">
              Create Custom Category
            </h3>
            
            <div className="space-y-1">
              <input
                type="text"
                placeholder="Category Name (e.g. Subscriptions)"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                className="glass-input text-sm py-2.5"
                required
              />
            </div>

            {/* Icon Picker */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Icon
              </label>
              <div className="flex gap-2 flex-wrap max-h-[85px] overflow-y-auto p-1.5 bg-white/20 dark:bg-[#0a0a0f]/40 rounded-lg">
                {iconOptions.map((ic) => (
                  <button
                    type="button"
                    key={ic}
                    onClick={() => setCatIcon(ic)}
                    className={`p-2 rounded-lg border flex items-center justify-center transition-all ${
                      catIcon === ic
                        ? 'bg-primary-500 border-primary-500 text-white'
                        : 'border-transparent hover:bg-black/5 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    <Icon name={ic} size={14} />
                  </button>
                ))}
              </div>
            </div>

            {/* Color Picker */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Color
              </label>
              <div className="flex gap-2 flex-wrap">
                {colorOptions.map((col) => (
                  <button
                    type="button"
                    key={col}
                    onClick={() => setCatColor(col)}
                    className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                      catColor === col ? 'border-light-text dark:border-white scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: col }}
                  >
                    {catColor === col && <Icon name="Check" size={10} className="text-white" />}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
            >
              <Icon name="Plus" size={14} />
              <span>Add Category</span>
            </button>
          </form>

          {/* Categories Grid List */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wider">
              Category Directory
            </h3>

            {catsLoading ? (
              <div className="space-y-2">
                {[1, 2].map((n) => (
                  <div key={n} className="h-12 rounded-xl bg-gray-200/50 dark:bg-white/5 animate-pulse"></div>
                ))}
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/20 dark:bg-white/5 border border-light-border dark:border-dark-border"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                        style={{ backgroundColor: cat.color }}
                      >
                        <Icon name={cat.icon} size={16} />
                      </div>
                      <span className="font-medium text-sm">{cat.name}</span>
                    </div>

                    {cat.is_default ? (
                      <span className="text-[10px] uppercase font-bold text-gray-400 px-2 py-0.5 bg-black/5 dark:bg-white/10 rounded flex items-center gap-1">
                        <Icon name="Lock" size={10} />
                        Default
                      </span>
                    ) : (
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        <Icon name="Trash2" size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
