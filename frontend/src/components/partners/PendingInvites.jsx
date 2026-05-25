import React from 'react';
import Icon from '../ui/Icon';

export const PendingInvites = ({ invites, onCancel, onAccept, onReject, loading }) => {
  const { incoming = [], outgoing = [] } = invites;

  if (incoming.length === 0 && outgoing.length === 0) {
    return null;
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Outgoing Invites */}
      {outgoing.length > 0 && (
        <div className="glass-card p-6 rounded-3xl space-y-4">
          <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wider">
            Sent Pending Invites ({outgoing.length})
          </h3>
          <div className="space-y-3">
            {outgoing.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-white/20 dark:bg-white/5 border border-light-border dark:border-dark-border"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold tracking-wider">{inv.invite_code}</span>
                    <span className="text-[10px] bg-primary-500/10 text-primary-500 border border-primary-500/20 px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider">
                      Pending
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 block mt-1">
                    Generated: {formatDate(inv.created_at)}
                  </span>
                </div>
                <button
                  onClick={() => onCancel(inv.invite_code)}
                  disabled={loading}
                  className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1"
                >
                  <Icon name="Trash2" size={12} />
                  <span>Cancel</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Incoming Invites */}
      {incoming.length > 0 && (
        <div className="glass-card p-6 rounded-3xl space-y-4">
          <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wider">
            Incoming Invites Awaiting Action ({incoming.length})
          </h3>
          <div className="space-y-3">
            {incoming.map((inv) => (
              <div
                key={inv.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-white/20 dark:bg-white/5 border border-light-border dark:border-dark-border gap-3"
              >
                <div>
                  <span className="font-bold text-sm text-gray-800 dark:text-gray-100">{inv.requester_name}</span>
                  <span className="text-xs text-gray-400 block">{inv.requester_email}</span>
                  <span className="text-[10px] text-gray-500 mt-1 block">
                    Received: {formatDate(inv.created_at)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onReject(inv.invite_code)}
                    disabled={loading}
                    className="px-3 py-1.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 font-bold rounded-xl text-xs transition-all"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => onAccept(inv.invite_code)}
                    disabled={loading}
                    className="px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl text-xs transition-all glow-red"
                  >
                    Accept
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingInvites;
