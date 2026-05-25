import React from 'react';
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

export const PartnerList = ({ partners, onViewTransactions, onConfigureSharing, onRemove, loading }) => {
  if (partners.length === 0) {
    return (
      <div className="glass-card p-12 text-center rounded-3xl">
        <Icon name="Users" className="mx-auto text-gray-400 mb-4 animate-pulse-slow" size={48} />
        <h3 className="text-lg font-bold">No Partners Connected</h3>
        <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-sm mx-auto text-sm">
          Collaborate on budgets and expenses by generating a connection invite code above.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {partners.map((partner) => {
        const initials = partner.name
          ? partner.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
          : 'P';
        const avatarColor = getAvatarColor(partner.name);

        return (
          <div
            key={partner.id}
            className="glass-card p-6 rounded-3xl flex flex-col justify-between h-48 relative overflow-hidden"
          >
            {/* Top Row: User Avatar and Badging */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-full text-white font-bold text-md flex items-center justify-center border border-white/20 shadow-md"
                  style={{ backgroundColor: avatarColor }}
                >
                  {initials}
                </div>
                <div className="overflow-hidden max-w-[150px]">
                  <h3 className="font-bold text-md truncate text-gray-800 dark:text-gray-100">
                    {partner.name}
                  </h3>
                  <span className="text-xs text-gray-400 truncate block">
                    {partner.email}
                  </span>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-green-500/15 text-green-500 border border-green-500/30 rounded-md">
                Active
              </span>
            </div>

            {/* Bottom Actions Menu */}
            <div className="flex gap-2 pt-4 border-t border-light-border dark:border-dark-border mt-4">
              <button
                onClick={() => onViewTransactions(partner)}
                className="flex-1 py-2 px-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1 glow-red"
              >
                <Icon name="Eye" size={14} />
                <span>Shared Feed</span>
              </button>

              <button
                onClick={() => onConfigureSharing(partner)}
                className="py-2 px-3.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 font-bold rounded-xl text-xs transition-colors"
                title="Configure Sharing Settings"
              >
                <Icon name="Settings" size={14} />
              </button>

              <button
                onClick={() => onRemove(partner)}
                disabled={loading}
                className="py-2 px-3.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white font-bold rounded-xl text-xs transition-colors"
                title="Revoke Partnership Connection"
              >
                <Icon name="UserMinus" size={14} />
              </button>
            </div>

            {/* Glow design details */}
            <div
              className="absolute right-0 bottom-0 w-16 h-16 rounded-full blur-xl opacity-10 pointer-events-none"
              style={{ backgroundColor: avatarColor }}
            ></div>
          </div>
        );
      })}
    </div>
  );
};

export default PartnerList;
