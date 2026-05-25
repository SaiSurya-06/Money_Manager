import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import apiFetch from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../components/ui/Icon';

export const Transactions = () => {
  const { formatCurrency } = useAuth();
  const { showToast } = useToast();

  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter States
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterAccount, setFilterAccount] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');

  // Form States (CRUD)
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [accountId, setAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [dateVal, setDateVal] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [recurrence, setRecurrence] = useState('none');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  const fetchTransactions = async () => {
    try {
      let query = `?search=${encodeURIComponent(search)}`;
      if (filterType) query += `&type=${filterType}`;
      if (filterAccount) query += `&account_id=${filterAccount}`;
      if (filterCategory) query += `&category_id=${filterCategory}`;
      if (startDate) query += `&start_date=${startDate}`;
      if (endDate) query += `&end_date=${endDate}`;

      const data = await apiFetch(`/transactions${query}`);
      setTransactions(data);
    } catch (err) {
      showToast('Error loading transactions.', 'error');
    }
  };

  const fetchDependencies = async () => {
    try {
      const [accs, cats] = await Promise.all([
        apiFetch('/accounts'),
        apiFetch('/categories')
      ]);
      setAccounts(accs);
      setCategories(cats);
      if (accs.length > 0) {
        setAccountId(accs[0].id.toString());
      }
      if (cats.length > 0) {
        setCategoryId(cats[0].id.toString());
      }
    } catch (err) {
      showToast('Failed to load accounts and categories.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [search, filterType, filterAccount, filterCategory, startDate, endDate]);

  const openAddModal = () => {
    setEditingId(null);
    setTitle('');
    setAmount('');
    setType('expense');
    if (accounts.length > 0) setAccountId(accounts[0].id.toString());
    setToAccountId('');
    if (categories.length > 0) setCategoryId(categories[0].id.toString());
    setDateVal(new Date().toISOString().split('T')[0]);
    setNote('');
    setRecurrence('none');
    setRecurrenceEndDate('');
    setIsPrivate(false);
    setIsModalOpen(true);
  };

  const openEditModal = (tx) => {
    if (tx.is_projected) {
      // If user clicks on a projected occurrence, we instantiate a new transaction pre-filled with this projected data.
      setEditingId(null);
      setTitle(tx.title);
      setAmount(tx.amount.toString());
      setType(tx.type);
      setAccountId(tx.account_id.toString());
      setToAccountId(tx.to_account_id ? tx.to_account_id.toString() : '');
      setCategoryId(tx.category_id ? tx.category_id.toString() : '');
      setDateVal(tx.date); // uses the projected date
      setNote(tx.note || '');
      setRecurrence('none');
      setRecurrenceEndDate('');
      showToast('Instantiating occurrence as new transaction...', 'info');
    } else {
      setEditingId(tx.id);
      setTitle(tx.title);
      setAmount(tx.amount.toString());
      setType(tx.type);
      setAccountId(tx.account_id.toString());
      setToAccountId(tx.to_account_id ? tx.to_account_id.toString() : '');
      setCategoryId(tx.category_id ? tx.category_id.toString() : '');
      setDateVal(tx.date);
      setNote(tx.note || '');
      setRecurrence(tx.recurrence);
      setRecurrenceEndDate(tx.recurrence_end_date || '');
      setIsPrivate(tx.is_private || false);
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim() || !amount || !accountId) {
      showToast('Title, Amount and Account are required fields.', 'warning');
      return;
    }
    if (type === 'transfer' && !toAccountId) {
      showToast('Destination account is required for transfers.', 'warning');
      return;
    }

    const payload = {
      title,
      amount: parseFloat(amount),
      type,
      account_id: parseInt(accountId),
      to_account_id: type === 'transfer' ? parseInt(toAccountId) : null,
      category_id: type !== 'transfer' && categoryId ? parseInt(categoryId) : null,
      date: dateVal,
      note,
      recurrence,
      recurrence_end_date: recurrence !== 'none' && recurrenceEndDate ? recurrenceEndDate : null,
      is_private: isPrivate
    };

    try {
      if (editingId) {
        await apiFetch(`/transactions/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        showToast('Transaction updated successfully!', 'success');
      } else {
        await apiFetch('/transactions', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        showToast('Transaction saved successfully!', 'success');
      }
      setIsModalOpen(false);
      fetchTransactions();
      // Reload accounts in case balance changed
      fetchDependencies();
    } catch (err) {
      showToast(err.message || 'Failed to save transaction', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction? The corresponding account balances will be adjusted.')) {
      return;
    }
    try {
      await apiFetch(`/transactions/${id}`, {
        method: 'DELETE'
      });
      showToast('Transaction deleted', 'success');
      setIsModalOpen(false);
      fetchTransactions();
      fetchDependencies();
    } catch (err) {
      showToast('Error deleting transaction', 'error');
    }
  };

  const handleTogglePrivacy = async (txId, e) => {
    e.stopPropagation();
    try {
      await apiFetch(`/transactions/${txId}/privacy`, {
        method: 'PATCH'
      });
      showToast('Transaction privacy toggled!', 'success');
      fetchTransactions();
    } catch (err) {
      showToast('Failed to update transaction privacy.', 'error');
    }
  };

  const clearFilters = () => {
    setSearch('');
    setFilterType('');
    setFilterAccount('');
    setFilterCategory('');
    setStartDate('');
    setEndDate('');
  };

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
  };

  const sortedTransactions = [...transactions].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    if (sortOrder === 'desc') {
      return dateB - dateA || b.id - a.id;
    } else {
      return dateA - dateB || a.id - b.id;
    }
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Search, filter, and audit your complete transaction history
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl shadow-lg glow-red transition-all transform active:scale-95"
        >
          <Icon name="Plus" size={20} />
          <span>New Transaction</span>
        </button>
      </div>

      {/* Filters Glass Card */}
      <div className="glass-card p-6 rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-gray-400 uppercase tracking-wider">
            Search Filters
          </h3>
          <button
            onClick={clearFilters}
            className="text-xs text-primary-500 hover:text-primary-400 font-semibold"
          >
            Clear Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Keyword Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="glass-input pl-10 py-2.5 text-sm"
            />
            <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="glass-input py-2.5 text-sm appearance-none"
          >
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
            <option value="transfer">Transfer</option>
          </select>

          {/* Account Filter */}
          <select
            value={filterAccount}
            onChange={(e) => setFilterAccount(e.target.value)}
            className="glass-input py-2.5 text-sm appearance-none"
          >
            <option value="">All Accounts</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="glass-input py-2.5 text-sm appearance-none"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Start Date */}
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="glass-input py-2.5 text-sm"
          />

          {/* End Date */}
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="glass-input py-2.5 text-sm"
          />
        </div>
      </div>

      {/* Transactions Table/List */}
      <div className="glass-card rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/5 dark:bg-white/5 border-b border-light-border dark:border-dark-border text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <th className="p-4 pl-6">Transaction</th>
                <th className="p-4">Account</th>
                <th className="p-4">Category</th>
                <th
                  className="p-4 cursor-pointer hover:text-primary-500 transition-colors select-none"
                  onClick={toggleSortOrder}
                >
                  <div className="flex items-center gap-1">
                    <span>Date</span>
                    <Icon name={sortOrder === 'desc' ? 'ArrowDown' : 'ArrowUp'} size={14} className="text-primary-500" />
                  </div>
                </th>
                <th className="p-4">Recurrence</th>
                <th className="p-4 text-center">Privacy</th>
                <th className="p-4 text-right pr-6">Amount</th>
              </tr>
            </thead>
            <tbody>
              {sortedTransactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-500">
                    No transactions found. Make sure to seed or create some.
                  </td>
                </tr>
              ) : (
                sortedTransactions.map((tx) => {
                  const isExpense = tx.type === 'expense';
                  const isTransfer = tx.type === 'transfer';
                  const isIncome = tx.type === 'income';

                  return (
                    <tr
                      key={`${tx.id}-${tx.date}`}
                      onClick={() => openEditModal(tx)}
                      className="border-b border-light-border dark:border-dark-border hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                    >
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${
                            isIncome ? 'bg-green-500' : isExpense ? 'bg-red-500' : 'bg-blue-500'
                          }`}>
                            <Icon
                              name={isIncome ? 'TrendingUp' : isExpense ? 'TrendingDown' : 'ArrowLeftRight'}
                              size={16}
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-semibold text-sm line-clamp-1">{tx.title}</p>
                              {tx.is_private && (
                                <span className="text-[9px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1 rounded flex items-center gap-0.5 font-bold uppercase tracking-wider">
                                  <Icon name="Lock" size={8} /> Private
                                </span>
                              )}
                            </div>
                            {tx.note && <span className="text-xs text-gray-500 line-clamp-1">{tx.note}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm font-medium">
                        {isTransfer ? (
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="font-semibold">{tx.account_name}</span>
                            <Icon name="ArrowRight" size={10} className="text-gray-400" />
                            <span className="font-semibold text-primary-500">{tx.to_account_name}</span>
                          </div>
                        ) : (
                          tx.account_name
                        )}
                      </td>
                      <td className="p-4 text-sm font-medium text-gray-600 dark:text-gray-300">
                        {isTransfer ? (
                          <span className="text-xs text-gray-400 uppercase italic">Transfer</span>
                        ) : tx.category ? (
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: tx.category.color }}
                            ></span>
                            <span>{tx.category.name}</span>
                          </div>
                        ) : (
                          'Uncategorized'
                        )}
                      </td>
                      <td className="p-4 text-sm text-gray-500 dark:text-gray-400">
                        {tx.date}
                        {tx.is_projected && (
                          <span className="ml-2 text-[10px] bg-primary-500/10 text-primary-500 border border-primary-500/20 px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider">
                            Projected
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-sm font-medium">
                        {tx.recurrence !== 'none' ? (
                          <span className="flex items-center gap-1.5 text-xs text-gray-400 capitalize bg-gray-100 dark:bg-white/5 py-1 px-2.5 rounded-lg w-max">
                            <Icon name="RefreshCw" size={12} className="animate-spin-slow text-primary-500" />
                            {tx.recurrence}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">One-time</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {!tx.is_projected && (
                          <button
                            onClick={(e) => handleTogglePrivacy(tx.id, e)}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              tx.is_private
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20'
                                : 'border-transparent text-gray-400 hover:bg-black/5 dark:hover:bg-white/10'
                            }`}
                            title={tx.is_private ? 'Make Public' : 'Make Private'}
                          >
                            <Icon name={tx.is_private ? 'Lock' : 'Unlock'} size={14} />
                          </button>
                        )}
                      </td>
                      <td className={`p-4 text-right pr-6 font-bold text-sm ${
                        isIncome ? 'text-green-500' : isExpense ? 'text-red-500' : 'text-blue-400'
                      }`}>
                        {isExpense ? '-' : isIncome ? '+' : ''}
                        {formatCurrency(tx.amount)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CRUD Modal */}
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
                {editingId ? 'Edit Transaction' : 'New Transaction'}
              </h2>

              <form onSubmit={handleSave} className="space-y-5">
                {/* Title */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Title
                  </label>
                  <input
                    type="text"
                    placeholder="Whole Foods grocery run, Netflix, etc."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="glass-input"
                    required
                  />
                </div>

                {/* Amount and Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="glass-input"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Transaction Type
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="glass-input"
                    >
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                      <option value="transfer">Transfer</option>
                    </select>
                  </div>
                </div>

                {/* Accounts mapping */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      {type === 'transfer' ? 'Source Account' : 'Account'}
                    </label>
                    <select
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                      className="glass-input"
                      required
                    >
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {type === 'transfer' ? (
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Destination Account
                      </label>
                      <select
                        value={toAccountId}
                        onChange={(e) => setToAccountId(e.target.value)}
                        className="glass-input"
                        required
                      >
                        <option value="">Select Destination...</option>
                        {accounts
                          .filter((acc) => acc.id.toString() !== accountId)
                          .map((acc) => (
                            <option key={acc.id} value={acc.id}>
                              {acc.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Category
                      </label>
                      <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="glass-input"
                      >
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Date and Notes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Date
                    </label>
                    <input
                      type="date"
                      value={dateVal}
                      onChange={(e) => setDateVal(e.target.value)}
                      className="glass-input"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Note
                    </label>
                    <input
                      type="text"
                      placeholder="Optional memo..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="glass-input"
                    />
                  </div>
                </div>

                {/* Recurrence Fields */}
                <div className="border-t border-light-border dark:border-dark-border pt-4 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeIn">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Recurrence Schedule
                    </label>
                    <select
                      value={recurrence}
                      onChange={(e) => setRecurrence(e.target.value)}
                      className="glass-input"
                    >
                      <option value="none">One-Time (None)</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>

                  {recurrence !== 'none' && (
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                        End Recurrence Date
                      </label>
                      <input
                        type="date"
                        value={recurrenceEndDate}
                        onChange={(e) => setRecurrenceEndDate(e.target.value)}
                        className="glass-input"
                      />
                    </div>
                  )}
                </div>

                {/* Privacy Checkbox */}
                <div className="flex items-center gap-3 bg-black/5 dark:bg-white/5 p-3.5 rounded-xl border border-light-border dark:border-dark-border">
                  <input
                    type="checkbox"
                    id="isPrivate"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    className="w-4 h-4 text-primary-500 border-light-border dark:border-dark-border rounded focus:ring-primary-500 cursor-pointer"
                  />
                  <label htmlFor="isPrivate" className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 cursor-pointer select-none">
                    Private transaction (Hide from partner)
                  </label>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center gap-3 pt-6 border-t border-light-border dark:border-dark-border mt-6">
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

export default Transactions;
