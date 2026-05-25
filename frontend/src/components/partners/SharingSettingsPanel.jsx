import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../ui/Icon';

export const SharingSettingsPanel = ({ partner, settings = [], onToggleSharing, onClose }) => {
  // Filter settings to only show those belonging to the selected partner
  const partnerSettings = settings.filter((s) => s.partner_id === partner.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-md glass-card rounded-3xl p-6 md:p-8 relative shadow-2xl"
      >
        <button
          onClick={onClose}
          className="absolute right-6 top-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <Icon name="X" size={20} />
        </button>

        <h2 className="text-2xl font-bold mb-1">Sharing Settings</h2>
        <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider mb-6">
          Partner: {partner.name}
        </p>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Control which accounts this partner can view. Hiding an account will immediately hide all its transactions.
        </p>

        {/* List of Accounts with switches */}
        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
          {partnerSettings.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">
              No accounts detected to share. Create accounts first.
            </p>
          ) : (
            partnerSettings.map((set) => {
              return (
                <div
                  key={set.account_id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-white/20 dark:bg-white/5 border border-light-border dark:border-dark-border"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary-500/10 text-primary-500 flex items-center justify-center">
                      <Icon name="Wallet" size={16} />
                    </div>
                    <span className="font-semibold text-sm">{set.account_name}</span>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    onClick={() => onToggleSharing(set.account_id, partner.id, !set.is_shared)}
                    className={`w-11 h-6 rounded-full transition-all duration-300 relative ${
                      set.is_shared ? 'bg-primary-500 shadow-md glow-red' : 'bg-gray-300 dark:bg-white/10'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all duration-300 ${
                        set.is_shared ? 'left-6' : 'left-1'
                      }`}
                    ></span>
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-6 border-t border-light-border dark:border-dark-border mt-6">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl text-sm transition-all"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default SharingSettingsPanel;
