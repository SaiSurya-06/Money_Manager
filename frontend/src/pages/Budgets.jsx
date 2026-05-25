import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import apiFetch from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../components/ui/Icon';

export const Budgets = () => {
  const { formatCurrency } = useAuth();
  const { showToast } = useToast();

  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    return new Date().toISOString().split('T')[0].substring(0, 7); // YYYY-MM
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [categoryId, setCategoryId] = useState('');
  const [limitAmount, setLimitAmount] = useState('');

  const fetchBudgets = async () => {
    try {
      const data = await apiFetch(`/budgets?month=${selectedMonth}`);
      setBudgets(data);

      // Trigger toast warnings for budgets > 80%
      data.forEach((b) => {
        const ratio = b.spent_amount / b.limit_amount;
        if (ratio >= 1.0) {
          showToast(`Budget for ${b.category.name} completely exhausted! (${Math.round(ratio * 100)}%)`, 'error');
        } else if (ratio >= 0.8) {
          showToast(`Warning: Budget for ${b.category.name} is at ${Math.round(ratio * 100)}% capacity.`, 'warning');
        }
      });
    } catch (err) {
      showToast('Error loading budgets.', 'error');
    }
  };

  const fetchCategories = async () => {
    try {
      const cats = await apiFetch('/categories');
      setCategories(cats);
      if (cats.length > 0) {
        setCategoryId(cats[0].id.toString());
      }
    } catch (err) {
      showToast('Error loading categories.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [selectedMonth]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    if (categories.length > 0) {
      setCategoryId(categories[0].id.toString());
    }
    setLimitAmount('');
    setIsModalOpen(true);
  };

  const openEditModal = (budget) => {
    setEditingId(budget.id);
    setCategoryId(budget.category_id.toString());
    setLimitAmount(budget.limit_amount.toString());
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!limitAmount || parseFloat(limitAmount) <= 0) {
      showToast('Please enter a positive limit amount.', 'warning');
      return;
    }

    const payload = {
      category_id: parseInt(categoryId),
      month: selectedMonth,
      limit_amount: parseFloat(limitAmount)
    };

    try {
      if (editingId) {
        await apiFetch(`/budgets/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify({ limit_amount: parseFloat(limitAmount) })
        });
        showToast('Budget updated successfully!', 'success');
      } else {
        await apiFetch('/budgets', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        showToast('Budget created successfully!', 'success');
      }
      setIsModalOpen(false);
      fetchBudgets();
    } catch (err) {
      showToast(err.message || 'Error saving budget', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this budget?')) return;
    try {
      await apiFetch(`/budgets/${id}`, {
        method: 'DELETE'
      });
      showToast('Budget deleted successfully', 'success');
      setIsModalOpen(false);
      fetchBudgets();
    } catch (err) {
      showToast('Error deleting budget', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Category Budgets</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Establish and track monthly spending targets by category
          </p>
        </div>

        <div className="flex gap-3 self-start sm:self-auto">
          {/* Month selector */}
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="glass-input py-2 text-sm max-w-[160px]"
          />
          
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl shadow-lg glow-red transition-all transform active:scale-95 text-sm"
          >
            <Icon name="Plus" size={18} />
            <span>Set Target</span>
          </button>
        </div>
      </div>

      {/* Target Budgets Cards/List */}
      {loading && budgets.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((n) => (
            <div key={n} className="h-40 rounded-3xl glass-card animate-pulse bg-gray-200/50 dark:bg-white/5"></div>
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-3xl">
          <Icon name="PieChart" className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-bold">No Budgets Formulated</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-sm mx-auto text-sm">
            Setting target limits helps optimize savings. Create your first target budget using the button above!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {budgets.map((b) => {
            const ratio = b.spent_amount / b.limit_amount;
            const percentage = Math.min(Math.round(ratio * 100), 100);
            const isDanger = ratio >= 1.0;
            const isWarning = ratio >= 0.8 && ratio < 1.0;

            let progressColor = 'bg-primary-500';
            if (isDanger) progressColor = 'bg-red-600';
            else if (isWarning) progressColor = 'bg-amber-500';
            else progressColor = 'bg-green-500';

            return (
              <motion.div
                key={b.id}
                layout
                onClick={() => openEditModal(b)}
                className="glass-card p-6 rounded-3xl flex flex-col justify-between cursor-pointer relative overflow-hidden group hover:scale-[1.01]"
              >
                {/* Background glow in warning state */}
                {isDanger && (
                  <div className="absolute inset-0 bg-red-600/5 pointer-events-none"></div>
                )}
                {isWarning && (
                  <div className="absolute inset-0 bg-amber-500/5 pointer-events-none"></div>
                )}

                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                      style={{ backgroundColor: b.category.color }}
                    >
                      <Icon name={b.category.icon} size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">
                        {b.category.name}
                      </h3>
                      <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                        Limit target
                      </span>
                    </div>
                  </div>
                  
                  {/* Alert Badges */}
                  {isDanger ? (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded">
                      Exceeded
                    </span>
                  ) : isWarning ? (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded">
                      &ge; 80% capacity
                    </span>
                  ) : (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-green-500/10 text-green-500 border border-green-500/20 rounded">
                      On Track
                    </span>
                  )}
                </div>

                {/* Progress bar and details */}
                <div className="mt-6 space-y-2">
                  <div className="flex items-end justify-between text-sm">
                    <div className="font-bold">
                      {formatCurrency(b.spent_amount)}{' '}
                      <span className="text-gray-400 font-normal">spent</span>
                    </div>
                    <div className="text-gray-500 font-medium">
                      of {formatCurrency(b.limit_amount)}
                    </div>
                  </div>

                  {/* Progress Line */}
                  <div className="w-full h-3 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>

                  {/* Bottom metrics */}
                  <div className="flex justify-between items-center text-xs pt-1">
                    <span className="text-gray-400">
                      {isDanger 
                        ? `${formatCurrency(b.spent_amount - b.limit_amount)} over budget`
                        : `${formatCurrency(b.limit_amount - b.spent_amount)} remaining`}
                    </span>
                    <span className="font-semibold">{percentage}% spent</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add / Edit target Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md glass-card rounded-3xl p-6 md:p-8 relative shadow-2xl"
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute right-6 top-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <Icon name="X" size={20} />
              </button>

              <h2 className="text-2xl font-bold mb-6">
                {editingId ? 'Edit Budget Limit' : 'Formulate Monthly Target'}
              </h2>

              <form onSubmit={handleSave} className="space-y-5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Category target
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="glass-input"
                    disabled={!!editingId} // Category lock on edits
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Target Limit Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 500"
                    value={limitAmount}
                    onChange={(e) => setLimitAmount(e.target.value)}
                    className="glass-input"
                    required
                  />
                </div>

                <div className="flex items-center gap-3 pt-6 border-t border-light-border dark:border-dark-border mt-6">
                  {editingId && (
                    <button
                      type="button"
                      onClick={() => handleDelete(editingId)}
                      className="px-5 py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white font-bold rounded-xl transition-all mr-auto flex items-center gap-2"
                    >
                      <Icon name="Trash2" size={18} />
                      <span>Remove</span>
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
                    Save Target
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

export default Budgets;
