import React, { useState, useEffect } from 'react';
import Icon from '../ui/Icon';

const getAvatarColor = (name = '') => {
  const colors = ['#2196F3', '#4CAF50', '#E53935', '#FF9800', '#9C27B0', '#00BCD4', '#E91E63', '#607D8B'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

export const PartnerTransactionsView = ({
  partner,
  accounts = [],
  transactions = [],
  categories = [],
  loading,
  filters,
  setFilters,
  onClose,
  formatCurrency
}) => {
  const avatarColor = getAvatarColor(partner.name);

  const totalSharedWealth = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  const handleFilterChange = (key, val) => {
    setFilters((prev) => ({ ...prev, [key]: val }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      type: '',
      category_id: '',
      start_date: '',
      end_date: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Header and Close controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/20 dark:bg-white/5 border border-light-border dark:border-dark-border p-6 rounded-3xl relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full text-white font-bold text-lg flex items-center justify-center border border-white/20 shadow"
            style={{ backgroundColor: avatarColor }}
          >
            {partner.name[0].toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">{partner.name}'s Shared Vault</h2>
              <span className="text-[10px] bg-primary-500/10 text-primary-500 border border-primary-500/20 px-2 py-0.5 rounded font-bold uppercase">
                Read-Only
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Total shared assets: <span className="font-bold text-gray-800 dark:text-gray-200">{formatCurrency(totalSharedWealth)}</span>
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-4 py-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 font-bold rounded-xl text-xs transition-colors self-start sm:self-auto"
        >
          <Icon name="ArrowLeft" size={14} />
          <span>Back to Partners</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="glass-card p-5 rounded-3xl space-y-3">
        <div className="flex items-center justify-between text-xs text-gray-400 uppercase font-bold tracking-wider">
          <span>Filter Transactions</span>
          <button onClick={clearFilters} className="text-primary-500 hover:text-primary-400 lowercase">
            clear filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <input
            type="text"
            placeholder="Search titles..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="glass-input py-2 text-xs"
          />

          <select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="glass-input py-2 text-xs appearance-none"
          >
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
            <option value="transfer">Transfer</option>
          </select>

          <select
            value={filters.category_id}
            onChange={(e) => handleFilterChange('category_id', e.target.value)}
            className="glass-input py-2 text-xs appearance-none"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={filters.start_date}
            onChange={(e) => handleFilterChange('start_date', e.target.value)}
            className="glass-input py-2 text-xs"
          />

          <input
            type="date"
            value={filters.end_date}
            onChange={(e) => handleFilterChange('end_date', e.target.value)}
            className="glass-input py-2 text-xs"
          />
        </div>
      </div>

      {/* Shared Accounts Grid */}
      <div className="space-y-2">
        <h3 className="font-bold text-xs text-gray-400 uppercase tracking-widest pl-1">
          Shared Funding Accounts ({accounts.length})
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="p-3 bg-white/20 dark:bg-white/5 border border-light-border dark:border-dark-border rounded-2xl flex flex-col justify-between"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center text-white"
                  style={{ backgroundColor: acc.color }}
                >
                  <Icon name={acc.icon} size={12} />
                </div>
                <span className="font-bold text-xs truncate max-w-[100px]">{acc.name}</span>
              </div>
              <span className="text-xs font-black mt-2 text-gray-700 dark:text-gray-300">
                {formatCurrency(acc.balance)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Transactions Table/List */}
      <div className="glass-card rounded-3xl overflow-hidden border-t-2" style={{ borderColor: avatarColor }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/5 dark:bg-white/5 border-b border-light-border dark:border-dark-border text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <th className="p-4 pl-6">Transaction</th>
                <th className="p-4">Account</th>
                <th className="p-4">Category</th>
                <th className="p-4">Date</th>
                <th className="p-4">Recurrence</th>
                <th className="p-4 text-right pr-6">Amount</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2].map((n) => (
                  <tr key={n} className="border-b border-light-border dark:border-dark-border animate-pulse">
                    <td colSpan="6" className="p-6">
                      <div className="h-4 bg-gray-300 dark:bg-white/5 rounded w-1/3"></div>
                    </td>
                  </tr>
                ))
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500 text-sm">
                    No shared transactions found matching these filters.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const isExpense = tx.type === 'expense';
                  const isTransfer = tx.type === 'transfer';
                  const isIncome = tx.type === 'income';

                  return (
                    <tr
                      key={`${tx.id}-${tx.date}`}
                      className="border-b border-light-border dark:border-dark-border bg-primary-500/[0.01] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                      {/* Name Badge */}
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${
                            isIncome ? 'bg-green-500' : isExpense ? 'bg-red-500' : 'bg-blue-500'
                          }`}>
                            <Icon name={isIncome ? 'TrendingUp' : isExpense ? 'TrendingDown' : 'ArrowLeftRight'} size={16} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm line-clamp-1">{tx.title}</p>
                              {/* Partner tag */}
                              <span
                                className="text-[8px] text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider"
                                style={{ backgroundColor: avatarColor }}
                              >
                                {partner.name.split(' ')[0]}
                              </span>
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
    </div>
  );
};

export default PartnerTransactionsView;
