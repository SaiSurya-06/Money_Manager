import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import apiFetch from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../components/ui/Icon';

// Custom 3D Tilt Wrapper
const TiltCard = ({ children, color, className = '', onClick }) => {
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const xc = rect.width / 2;
    const yc = rect.height / 2;
    
    const rotateY = ((x - xc) / xc) * 12;
    const rotateX = -((y - yc) / yc) * 12;
    
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`;
    card.style.boxShadow = `0 20px 40px rgba(0, 0, 0, 0.25), 0 0 20px ${color}40`;
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    card.style.boxShadow = '';
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`transition-all duration-300 ease-out preserve-3d cursor-pointer ${className}`}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <div style={{ transform: 'translateZ(20px)' }} className="h-full">
        {children}
      </div>
    </div>
  );
};

export const Accounts = () => {
  const { formatCurrency } = useAuth();
  const { showToast } = useToast();
  
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // CRUD form states
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [type, setType] = useState('Bank');
  const [balance, setBalance] = useState('');
  const [icon, setIcon] = useState('Wallet');
  const [color, setColor] = useState('#2196F3');

  const accountTypes = ['Bank', 'Cash', 'Credit Card', 'Savings', 'Investment', 'Custom'];
  const iconList = ['Wallet', 'PiggyBank', 'CreditCard', 'Coins', 'Briefcase', 'TrendingUp', 'CircleDollarSign', 'Gem'];
  const colorList = ['#2196F3', '#4CAF50', '#E53935', '#FF9800', '#9C27B0', '#00BCD4', '#E91E63', '#607D8B'];

  const fetchAccounts = async () => {
    try {
      const data = await apiFetch('/accounts');
      setAccounts(data);
    } catch (err) {
      showToast('Failed to load accounts.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setName('');
    setType('Bank');
    setBalance('');
    setIcon('Wallet');
    setColor('#2196F3');
    setIsModalOpen(true);
  };

  const openEditModal = (acc) => {
    setEditingId(acc.id);
    setName(acc.name);
    setType(acc.type);
    setBalance(acc.balance.toString());
    setIcon(acc.icon);
    setColor(acc.color);
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Account name is required', 'warning');
      return;
    }

    const payload = {
      name,
      type,
      balance: parseFloat(balance) || 0.0,
      icon,
      color
    };

    try {
      if (editingId) {
        await apiFetch(`/accounts/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        showToast('Account updated successfully!', 'success');
      } else {
        await apiFetch('/accounts', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        showToast('Account created successfully!', 'success');
      }
      setIsModalOpen(false);
      fetchAccounts();
    } catch (err) {
      showToast(err.message || 'Error saving account', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this account? This will permanently delete all linked transactions.')) {
      return;
    }
    try {
      await apiFetch(`/accounts/${id}`, {
        method: 'DELETE'
      });
      showToast('Account deleted successfully', 'success');
      setIsModalOpen(false);
      fetchAccounts();
    } catch (err) {
      showToast('Error deleting account', 'error');
    }
  };

  const totalWealth = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Accounts</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Track and manage your diverse funding accounts and portfolios
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl shadow-lg glow-red transition-all transform active:scale-95 self-start"
        >
          <Icon name="Plus" size={20} />
          <span>Add Account</span>
        </button>
      </div>

      {/* Aggregate Balance Indicator */}
      <div className="glass-card p-6 md:p-8 rounded-3xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-primary-500/10 rounded-full blur-3xl"></div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Combined Balance Assets
        </h2>
        <div className="text-4xl md:text-5xl font-black mt-2 tracking-tight text-primary-500 dark:text-white">
          {formatCurrency(totalWealth)}
        </div>
      </div>

      {/* Grid of Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-48 rounded-3xl glass-card animate-pulse bg-gray-200/50 dark:bg-white/5"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((acc) => (
            <TiltCard
              key={acc.id}
              color={acc.color}
              onClick={() => openEditModal(acc)}
              className="h-48 glass-card rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between border-t-4"
            >
              {/* Top Details */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                    style={{ backgroundColor: acc.color }}
                  >
                    <Icon name={acc.icon} size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 line-clamp-1">
                      {acc.name}
                    </h3>
                    <span className="text-xs uppercase tracking-wider font-semibold text-gray-400">
                      {acc.type}
                    </span>
                  </div>
                </div>
                <div className="text-xs font-semibold px-2.5 py-1 bg-black/5 dark:bg-white/10 rounded-lg text-gray-500 dark:text-gray-300">
                  Manage
                </div>
              </div>

              {/* Bottom details - Balance */}
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Balance</span>
                <div className="text-2xl font-black tracking-tight" style={{ color: acc.balance < 0 ? '#E53935' : undefined }}>
                  {formatCurrency(acc.balance)}
                </div>
              </div>

              {/* Glow Accent */}
              <div
                className="absolute right-0 bottom-0 w-24 h-24 rounded-full blur-2xl pointer-events-none opacity-20"
                style={{ backgroundColor: acc.color }}
              ></div>
            </TiltCard>
          ))}
        </div>
      )}

      {/* Modal - Add/Edit */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg glass-card rounded-3xl p-6 md:p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute right-6 top-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <Icon name="X" size={20} />
              </button>

              <h2 className="text-2xl font-bold mb-6">
                {editingId ? 'Edit Account' : 'Add Financial Account'}
              </h2>

              <form onSubmit={handleSave} className="space-y-5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Account Name
                  </label>
                  <input
                    type="text"
                    placeholder="Chase Checking, Cash, etc."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="glass-input"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Account Type
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="glass-input appearance-none"
                    >
                      {accountTypes.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Balance
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={balance}
                      onChange={(e) => setBalance(e.target.value)}
                      className="glass-input"
                    />
                  </div>
                </div>

                {/* Icon Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Select Icon
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {iconList.map((ic) => (
                      <button
                        type="button"
                        key={ic}
                        onClick={() => setIcon(ic)}
                        className={`p-3 rounded-xl border flex items-center justify-center transition-all ${
                          icon === ic
                            ? 'bg-primary-500 border-primary-500 text-white shadow-md glow-red'
                            : 'border-light-border dark:border-dark-border hover:bg-black/5 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        <Icon name={ic} size={18} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Theme Color Label
                  </label>
                  <div className="flex gap-3 flex-wrap">
                    {colorList.map((col) => (
                      <button
                        type="button"
                        key={col}
                        onClick={() => setColor(col)}
                        className={`w-9 h-9 rounded-full transition-all border-2 flex items-center justify-center ${
                          color === col ? 'border-light-text dark:border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: col }}
                      >
                        {color === col && <Icon name="Check" size={14} className="text-white drop-shadow" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-light-border dark:border-dark-border mt-6">
                  {editingId && (
                    <button
                      type="button"
                      onClick={() => handleDelete(editingId)}
                      className="px-5 py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white font-bold rounded-xl transition-all mr-auto flex items-center gap-2"
                    >
                      <Icon name="Trash2" size={18} />
                      <span>Delete</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-3 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 font-bold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl shadow-lg glow-red transition-all"
                  >
                    Save
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Accounts;
