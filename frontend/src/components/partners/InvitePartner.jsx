import React, { useState } from 'react';
import Icon from '../ui/Icon';

export const InvitePartner = ({ onGenerate, onAccept, loading }) => {
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    try {
      const data = await onGenerate();
      setGeneratedCode(data.invite_code);
      setGeneratedLink(data.invite_link);
      setCopied(false);
    } catch (err) {
      // Handled in parent
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAcceptSubmit = (e) => {
    e.preventDefault();
    if (!inviteCodeInput.trim()) return;
    onAccept(inviteCodeInput.trim());
    setInviteCodeInput('');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Generate Invite Code */}
      <div className="glass-card p-6 rounded-3xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center">
            <Icon name="Link2" size={18} />
          </div>
          <h3 className="font-bold text-lg">Generate Invite Code</h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Create a unique invite code to share. Once your partner enters it, sharing will be enabled.
        </p>

        {generatedCode ? (
          <div className="space-y-3 pt-2">
            <div className="bg-black/5 dark:bg-white/5 border border-light-border dark:border-dark-border p-3.5 rounded-xl flex items-center justify-between gap-3">
              <div className="overflow-hidden">
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block">Invite Code</span>
                <span className="font-mono text-sm font-bold tracking-wider select-all">{generatedCode}</span>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-2 bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold rounded-lg transition-all"
              >
                <Icon name={copied ? "Check" : "Copy"} size={14} />
                <span>{copied ? "Copied" : "Copy Link"}</span>
              </button>
            </div>
            <button
              onClick={handleGenerate}
              className="text-xs text-primary-500 hover:text-primary-400 font-semibold"
            >
              Generate Another Code
            </button>
          </div>
        ) : (
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3 px-4 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg glow-red transition-all flex items-center justify-center gap-2 text-sm"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Icon name="Plus" size={18} />
                <span>Generate Invite Code</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Enter Invite Code */}
      <div className="glass-card p-6 rounded-3xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center">
            <Icon name="KeyRound" size={18} />
          </div>
          <h3 className="font-bold text-lg">Enter Invite Code</h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Paste an invite code received from your partner to accept their connection request.
        </p>

        <form onSubmit={handleAcceptSubmit} className="flex gap-2 items-end pt-2">
          <div className="flex-1 space-y-1">
            <input
              type="text"
              placeholder="e.g. abc123xyz"
              value={inviteCodeInput}
              onChange={(e) => setInviteCodeInput(e.target.value)}
              className="glass-input py-2.5 text-sm"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading || !inviteCodeInput.trim()}
            className="py-3 px-5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 disabled:opacity-50 text-white font-bold rounded-xl shadow transition-all duration-200 text-sm flex items-center gap-1.5 glow-red"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Icon name="Check" size={16} />
                <span>Accept</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default InvitePartner;
