import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Icon from '../ui/Icon';

export const MainLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
    { name: 'Accounts', path: '/accounts', icon: 'Wallet' },
    { name: 'Transactions', path: '/transactions', icon: 'ArrowLeftRight' },
    { name: 'Budgets', path: '/budgets', icon: 'PieChart' },
    { name: 'Partners', path: '/partners', icon: 'Users' },
    { name: 'Settings', path: '/settings', icon: 'Settings' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text transition-colors duration-300 flex">
      {/* Sidebar - Desktop (hidden on mobile/tablet) */}
      <aside className="hidden lg:flex flex-col w-64 glass-card border-r fixed h-full z-20">
        {/* Brand Logo */}
        <div className="p-6 border-b border-light-border dark:border-dark-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-primary-400 flex items-center justify-center glow-red text-white">
            <Icon name="Activity" size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-wider text-primary-500 dark:text-white">MONEY</h1>
            <p className="text-xs font-semibold text-gray-400 -mt-1 tracking-widest">MANAGER</p>
          </div>
        </div>

        {/* User Card */}
        {user && (
          <div className="p-4 mx-4 my-6 rounded-2xl bg-white/40 dark:bg-white/5 border border-light-border dark:border-dark-border flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-500/10 dark:bg-primary-500/20 text-primary-500 flex items-center justify-center font-bold text-lg border border-primary-500/30">
              {user.name[0].toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <h2 className="font-semibold text-sm truncate">{user.name}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">{user.preferred_currency}</p>
            </div>
          </div>
        )}

        {/* Menu Navigation */}
        <nav className="flex-1 px-4 space-y-2">
          {navigation.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                  active
                    ? 'bg-primary-500 text-white shadow-md glow-red'
                    : 'hover:bg-black/5 dark:hover:bg-white/5 text-gray-500 hover:text-light-text dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                <Icon name={item.icon} size={20} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-light-border dark:border-dark-border space-y-2">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
          >
            <div className="flex items-center gap-4">
              <Icon name={theme === 'dark' ? 'Sun' : 'Moon'} size={20} />
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </div>
          </button>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl font-medium text-red-500 hover:bg-red-500/10 transition-all"
          >
            <Icon name="LogOut" size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64 pb-20 lg:pb-0 min-h-screen">
        {/* Header - Mobile Only */}
        <header className="lg:hidden glass-card sticky top-0 z-30 px-6 py-4 flex items-center justify-between border-b border-light-border dark:border-dark-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center text-white glow-red">
              <Icon name="Activity" size={18} />
            </div>
            <h1 className="font-bold text-md tracking-widest text-primary-500 dark:text-white">MONEYMGR</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center text-gray-500 dark:text-gray-400"
            >
              <Icon name={theme === 'dark' ? 'Sun' : 'Moon'} size={18} />
            </button>
            <button
              onClick={handleLogout}
              className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500"
            >
              <Icon name="LogOut" size={18} />
            </button>
          </div>
        </header>

        {/* Inner Content Window */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Bottom Nav Bar - Mobile Only */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-[#0a0a0f]/90 border-t border-light-border dark:border-dark-border backdrop-blur-md px-4 py-2 flex justify-around">
        {navigation.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all duration-200 ${
                active
                  ? 'text-primary-500 dark:text-white font-semibold'
                  : 'text-gray-400'
              }`}
            >
              <div className={`p-1.5 rounded-lg ${active ? 'bg-primary-500/10 dark:bg-primary-500/20 text-primary-500' : ''}`}>
                <Icon name={item.icon} size={20} />
              </div>
              <span className="text-[10px]">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default MainLayout;
