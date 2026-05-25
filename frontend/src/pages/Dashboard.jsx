import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useCountUp } from '../hooks/useCountUp';
import apiFetch from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid
} from 'recharts';
import { useTheme } from '../context/ThemeContext';
import Icon from '../components/ui/Icon';

export const Dashboard = () => {
  const { formatCurrency } = useAuth();
  const { showToast } = useToast();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Metrics States
  const [summary, setSummary] = useState({
    total_balance: 0,
    monthly_income: 0,
    monthly_expenses: 0,
    net_savings: 0,
  });

  // Chart States
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [netWorthData, setNetWorthData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Calendar States
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarTransactions, setCalendarTransactions] = useState([]);
  
  // Date modal state
  const [selectedDayVal, setSelectedDayVal] = useState(null); // specific Date object
  const [dayTxs, setDayTxs] = useState([]);
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);

  // Quick transaction form states (inside calendar day modal)
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [txTitle, setTxTitle] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txType, setTxType] = useState('expense');
  const [txAccountId, setTxAccountId] = useState('');
  const [txCategoryId, setTxCategoryId] = useState('');

  const fetchDashboardData = async () => {
    try {
      const [sum, monthly, cats, netWorth, accs, allCats] = await Promise.all([
        apiFetch('/analytics/summary'),
        apiFetch('/analytics/monthly'),
        apiFetch('/analytics/categories'),
        apiFetch('/analytics/networth'),
        apiFetch('/accounts'),
        apiFetch('/categories')
      ]);

      setSummary(sum);
      setMonthlyData(monthly);
      setCategoryData(cats);
      setNetWorthData(netWorth);
      setAccounts(accs);
      setCategories(allCats);
      if (accs.length > 0) setTxAccountId(accs[0].id.toString());
      if (allCats.length > 0) setTxCategoryId(allCats[0].id.toString());

    } catch (err) {
      showToast('Error fetching dashboard statistics.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCalendarTransactions = async () => {
    try {
      // Fetch transactions for the current calendar month view
      const year = calendarDate.getFullYear();
      const month = calendarDate.getMonth() + 1;
      const start = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      const data = await apiFetch(`/transactions?start_date=${start}&end_date=${end}`);
      setCalendarTransactions(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    fetchCalendarTransactions();
  }, [calendarDate]);

  // Calendar Logic
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));
  };

  const renderCalendarCells = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const cells = [];

    // Empty cells for offset
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="h-10 sm:h-12 border border-light-border dark:border-dark-border opacity-20"></div>);
    }

    // Days cells
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayTxsFiltered = calendarTransactions.filter((tx) => tx.date === dateStr);
      const hasTransactions = dayTxsFiltered.length > 0;

      cells.push(
        <div
          key={`day-${day}`}
          onClick={() => handleDayClick(new Date(year, month, day), dayTxsFiltered)}
          className={`h-10 sm:h-12 border border-light-border dark:border-dark-border flex flex-col justify-between p-1.5 sm:p-2 cursor-pointer hover:bg-primary-500/10 dark:hover:bg-primary-500/20 transition-all relative ${
            new Date().toDateString() === new Date(year, month, day).toDateString()
              ? 'bg-primary-500/5 font-bold border-primary-500/50'
              : ''
          }`}
        >
          <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-300 select-none">
            {day}
          </span>
          {hasTransactions && (
            <div className="flex gap-1 justify-center pb-0.5">
              {dayTxsFiltered.slice(0, 3).map((tx, idx) => (
                <span
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full ${
                    tx.type === 'income'
                      ? 'bg-green-500 shadow-green-500/50'
                      : tx.type === 'expense'
                      ? 'bg-red-500 shadow-red-500/50'
                      : 'bg-blue-500 shadow-blue-500/50'
                  }`}
                  style={{ boxShadow: '0 0 4px currentColor' }}
                ></span>
              ))}
            </div>
          )}
        </div>
      );
    }

    return cells;
  };

  const handleDayClick = (dayDate, txs) => {
    setSelectedDayVal(dayDate);
    setDayTxs(txs);
    setIsDayModalOpen(true);
  };

  const handleQuickTxSave = async (e) => {
    e.preventDefault();
    if (!txTitle.trim() || !txAmount || !txAccountId) {
      showToast('Title, Amount and Account are required.', 'warning');
      return;
    }

    const dateStr = selectedDayVal.toISOString().split('T')[0];
    const payload = {
      title: txTitle,
      amount: parseFloat(txAmount),
      type: txType,
      account_id: parseInt(txAccountId),
      category_id: parseInt(txCategoryId),
      date: dateStr,
      note: 'Added via calendar cell',
      recurrence: 'none'
    };

    try {
      const newTx = await apiFetch('/transactions', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      showToast('Transaction saved successfully!', 'success');
      
      // Reset form
      setTxTitle('');
      setTxAmount('');
      setIsTxModalOpen(false);

      // Refresh calendar date transactions
      const updatedTxs = await apiFetch(`/transactions/by-date/${dateStr}`);
      setDayTxs(updatedTxs);
      
      // Refresh dashboard analytics
      fetchDashboardData();
      fetchCalendarTransactions();
    } catch (err) {
      showToast(err.message || 'Error saving transaction', 'error');
    }
  };

  const handleDeleteDayTx = async (txId) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await apiFetch(`/transactions/${txId}`, {
        method: 'DELETE'
      });
      showToast('Transaction deleted', 'success');
      
      const dateStr = selectedDayVal.toISOString().split('T')[0];
      const updatedTxs = await apiFetch(`/transactions/by-date/${dateStr}`);
      setDayTxs(updatedTxs);

      fetchDashboardData();
      fetchCalendarTransactions();
    } catch (err) {
      showToast('Error deleting transaction', 'error');
    }
  };

  // Countup summaries
  const animatedBalance = useCountUp(summary.total_balance);
  const animatedIncome = useCountUp(summary.monthly_income);
  const animatedExpense = useCountUp(summary.monthly_expenses);
  const animatedSavings = useCountUp(summary.net_savings);

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Real-time aggregates, transactional calendar, and visual financial reports
        </p>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Assets */}
        <div className="glass-card p-6 rounded-3xl flex items-center justify-between relative overflow-hidden group">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Net Worth</span>
            <div className="text-3xl font-black tracking-tight">{formatCurrency(animatedBalance)}</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-primary-500/10 text-primary-500 flex items-center justify-center border border-primary-500/20">
            <Icon name="Wallet" size={24} />
          </div>
        </div>

        {/* Monthly Income */}
        <div className="glass-card p-6 rounded-3xl flex items-center justify-between relative overflow-hidden group">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Monthly Inflow</span>
            <div className="text-3xl font-black tracking-tight text-green-500">{formatCurrency(animatedIncome)}</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-green-500/10 text-green-500 flex items-center justify-center border border-green-500/20">
            <Icon name="TrendingUp" size={24} />
          </div>
        </div>

        {/* Monthly Expenses */}
        <div className="glass-card p-6 rounded-3xl flex items-center justify-between relative overflow-hidden group">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Monthly Outflow</span>
            <div className="text-3xl font-black tracking-tight text-red-500">{formatCurrency(animatedExpense)}</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20">
            <Icon name="TrendingDown" size={24} />
          </div>
        </div>

        {/* Net Savings */}
        <div className="glass-card p-6 rounded-3xl flex items-center justify-between relative overflow-hidden group">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Net Flow Savings</span>
            <div className="text-3xl font-black tracking-tight text-blue-500">{formatCurrency(animatedSavings)}</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
            <Icon name="PiggyBank" size={24} />
          </div>
        </div>
      </div>

      {/* Main Grid: Charts & Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Income vs Expenses Bar Chart */}
        <div className="lg:col-span-2 glass-card p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between border-b border-light-border dark:border-dark-border pb-3">
            <h3 className="font-bold text-lg">Income vs Expense trends</h3>
            <span className="text-xs text-gray-400 font-semibold uppercase">Last 6 Months</span>
          </div>
          <div className="h-72 w-full">
            {loading ? (
              <div className="h-full w-full bg-gray-100 dark:bg-white/5 animate-pulse rounded-2xl"></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(128,128,128,0.08)" vertical={false} />
                  <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{
                      background: isDark ? '#14141e' : '#ffffff',
                      border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                      borderRadius: '16px',
                      boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.05)',
                      backdropFilter: 'blur(8px)'
                    }}
                    labelStyle={{ color: isDark ? '#9ca3af' : '#6b7280' }}
                  />
                  <Legend verticalAlign="top" height={36} />
                  <Bar name="Inflow" dataKey="income" fill="#4CAF50" radius={[4, 4, 0, 0]} />
                  <Bar name="Outflow" dataKey="expense" fill="#E53935" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Categories Breakdown Doughnut */}
        <div className="glass-card p-6 rounded-3xl space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-light-border dark:border-dark-border pb-3">
            <h3 className="font-bold text-lg">Category Spending</h3>
            <span className="text-xs text-gray-400 font-semibold uppercase">Current Month</span>
          </div>
          <div className="h-56 w-full flex items-center justify-center">
            {loading ? (
              <div className="w-40 h-40 rounded-full border-8 border-t-primary-500 border-gray-100 dark:border-white/5 animate-spin"></div>
            ) : categoryData.length === 0 ? (
              <div className="text-gray-500 text-sm">No expenses logged this month</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="amount"
                    nameKey="category_name"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.category_color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{
                      background: isDark ? '#14141e' : '#ffffff',
                      border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                      borderRadius: '16px',
                      boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.05)',
                      backdropFilter: 'blur(8px)'
                    }}
                    labelStyle={{ color: isDark ? '#9ca3af' : '#6b7280' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          {/* Scrollable Legends list */}
          <div className="max-h-24 overflow-y-auto pr-2 space-y-1.5 mt-2">
            {categoryData.slice(0, 4).map((entry, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.category_color }}></span>
                  <span className="font-medium truncate max-w-[120px]">{entry.category_name}</span>
                </div>
                <span className="font-semibold">{entry.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Net Worth Trend Line Chart */}
        <div className="lg:col-span-2 glass-card p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between border-b border-light-border dark:border-dark-border pb-3">
            <h3 className="font-bold text-lg">Net Worth timeline</h3>
            <span className="text-xs text-gray-400 font-semibold uppercase">Last 90 Days</span>
          </div>
          <div className="h-72 w-full">
            {loading ? (
              <div className="h-full w-full bg-gray-100 dark:bg-white/5 animate-pulse rounded-2xl"></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={netWorthData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="netWorthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e53935" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#e53935" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(128,128,128,0.08)" vertical={false} />
                  <XAxis dataKey="date" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{
                      background: isDark ? '#14141e' : '#ffffff',
                      border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                      borderRadius: '16px',
                      boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.05)',
                      backdropFilter: 'blur(8px)'
                    }}
                    labelStyle={{ color: isDark ? '#9ca3af' : '#6b7280' }}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#e53935" strokeWidth={3} fill="url(#netWorthGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Interactive Custom Calendar component */}
        <div className="glass-card p-6 rounded-3xl space-y-4 flex flex-col justify-between h-[420px]">
          <div className="flex items-center justify-between border-b border-light-border dark:border-dark-border pb-3">
            <h3 className="font-bold text-lg">Finance Calendar</h3>
            <div className="flex items-center gap-1.5">
              <button onClick={handlePrevMonth} className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg">
                <Icon name="ChevronLeft" size={16} />
              </button>
              <span className="text-xs font-bold uppercase tracking-wider">
                {calendarDate.toLocaleString('default', { month: 'short', year: 'numeric' })}
              </span>
              <button onClick={handleNextMonth} className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg">
                <Icon name="ChevronRight" size={16} />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="flex-1 flex flex-col justify-between mt-2">
            {/* Weekdays */}
            <div className="grid grid-cols-7 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest pb-1 border-b border-light-border dark:border-dark-border">
              <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
            </div>

            {/* Days Cells wrapper */}
            <div className="grid grid-cols-7 gap-px bg-light-border/20 dark:bg-white/5 mt-1 border-l border-t border-light-border dark:border-dark-border">
              {renderCalendarCells()}
            </div>
          </div>
        </div>

      </div>

      {/* Date transactions view Modal */}
      <AnimatePresence>
        {isDayModalOpen && selectedDayVal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg glass-card rounded-3xl p-6 md:p-8 relative shadow-2xl"
            >
              <button
                onClick={() => setIsDayModalOpen(false)}
                className="absolute right-6 top-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <Icon name="X" size={20} />
              </button>

              <h2 className="text-2xl font-bold mb-1">
                {selectedDayVal.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h2>
              <p className="text-xs text-gray-400 uppercase font-semibold tracking-widest mb-6">
                Transactions Directory
              </p>

              {/* Transactions List */}
              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 mb-6">
                {dayTxs.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-6">
                    No transactions entered on this day.
                  </p>
                ) : (
                  dayTxs.map((tx) => (
                    <div
                      key={`${tx.id}-${tx.date}`}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/20 dark:bg-white/5 border border-light-border dark:border-dark-border"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${
                          tx.type === 'income' ? 'bg-green-500' : tx.type === 'expense' ? 'bg-red-500' : 'bg-blue-500'
                        }`}>
                          <Icon name={tx.type === 'income' ? 'TrendingUp' : tx.type === 'expense' ? 'TrendingDown' : 'ArrowLeftRight'} size={14} />
                        </div>
                        <div>
                          <p className="font-semibold text-sm line-clamp-1">{tx.title}</p>
                          <span className="text-[10px] text-gray-500">{tx.account_name}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`font-bold text-sm ${
                          tx.type === 'income' ? 'text-green-500' : tx.type === 'expense' ? 'text-red-500' : 'text-blue-400'
                        }`}>
                          {tx.type === 'expense' ? '-' : tx.type === 'income' ? '+' : ''}
                          {formatCurrency(tx.amount)}
                        </span>
                        
                        {!tx.is_projected && (
                          <button
                            onClick={() => handleDeleteDayTx(tx.id)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                          >
                            <Icon name="Trash2" size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-light-border dark:border-dark-border">
                <button
                  onClick={() => setIsTxModalOpen(true)}
                  className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl shadow-lg glow-red transition-all flex items-center justify-center gap-2"
                >
                  <Icon name="Plus" size={18} />
                  <span>Quick Add Transaction</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick Add Modal inside Day Modal */}
      <AnimatePresence>
        {isTxModalOpen && selectedDayVal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md glass-card rounded-3xl p-6 relative shadow-2xl"
            >
              <button
                onClick={() => setIsTxModalOpen(false)}
                className="absolute right-6 top-6 text-gray-400 hover:text-gray-600"
              >
                <Icon name="X" size={20} />
              </button>

              <h3 className="text-xl font-bold mb-4">
                Add Transaction for {selectedDayVal.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </h3>

              <form onSubmit={handleQuickTxSave} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400 uppercase">Title</label>
                  <input
                    type="text"
                    placeholder="Lunch run, salary..."
                    value={txTitle}
                    onChange={(e) => setTxTitle(e.target.value)}
                    className="glass-input text-sm py-2"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-400 uppercase">Amount</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={txAmount}
                      onChange={(e) => setTxAmount(e.target.value)}
                      className="glass-input text-sm py-2"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-400 uppercase">Type</label>
                    <select
                      value={txType}
                      onChange={(e) => setTxType(e.target.value)}
                      className="glass-input text-sm py-2"
                    >
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-400 uppercase">Account</label>
                    <select
                      value={txAccountId}
                      onChange={(e) => setTxAccountId(e.target.value)}
                      className="glass-input text-sm py-2"
                      required
                    >
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-400 uppercase">Category</label>
                    <select
                      value={txCategoryId}
                      onChange={(e) => setTxCategoryId(e.target.value)}
                      className="glass-input text-sm py-2"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-light-border dark:border-dark-border justify-end">
                  <button
                    type="button"
                    onClick={() => setIsTxModalOpen(false)}
                    className="px-4 py-2 bg-black/5 dark:bg-white/5 rounded-xl font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-500 text-white rounded-xl font-bold text-xs shadow glow-red"
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

export default Dashboard;
