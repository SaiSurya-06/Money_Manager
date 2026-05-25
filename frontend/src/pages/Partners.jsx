import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import usePartners from '../hooks/usePartners';
import usePartnerTransactions from '../hooks/usePartnerTransactions';
import apiFetch from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../components/ui/Icon';

// Sub-components
import PartnerList from '../components/partners/PartnerList';
import PendingInvites from '../components/partners/PendingInvites';
import InvitePartner from '../components/partners/InvitePartner';
import SharingSettingsPanel from '../components/partners/SharingSettingsPanel';
import PartnerTransactionsView from '../components/partners/PartnerTransactionsView';

export const Partners = () => {
  const { formatCurrency } = useAuth();
  const { showToast } = useToast();

  // Tab management: 'partners' | 'invites'
  const [activeTab, setActiveTab] = useState('partners');
  const [categories, setCategories] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [sharingPartner, setSharingPartner] = useState(null);

  // Filters for selected partner's transactions
  const [partnerFilters, setPartnerFilters] = useState({
    search: '',
    type: '',
    category_id: '',
    start_date: '',
    end_date: ''
  });

  const {
    partners,
    pendingInvites,
    sharingSettings,
    loading: partnersLoading,
    getPartners,
    getPendingInvites,
    generateInvite,
    acceptInvite,
    rejectInvite,
    removePartner,
    getSharingSettings,
    toggleSharingSetting
  } = usePartners();

  const {
    partnerAccounts,
    partnerTransactions,
    loading: txLoading,
    getPartnerAccounts,
    getPartnerTransactions
  } = usePartnerTransactions();

  // Load baseline configurations
  useEffect(() => {
    const init = async () => {
      try {
        await Promise.all([
          getPartners(),
          getPendingInvites(),
          getSharingSettings()
        ]);
        const cats = await apiFetch('/categories');
        setCategories(cats);
      } catch (err) {
        showToast('Error loading partner information.', 'error');
      }
    };
    init();
  }, [getPartners, getPendingInvites, getSharingSettings]);

  // Load partner accounts when selected
  useEffect(() => {
    if (selectedPartner) {
      getPartnerAccounts(selectedPartner.id).catch(() => {
        showToast('Error loading partner accounts.', 'error');
      });
    }
  }, [selectedPartner, getPartnerAccounts]);

  // Load partner transactions when selected partner or filters change
  useEffect(() => {
    if (selectedPartner) {
      getPartnerTransactions(selectedPartner.id, partnerFilters).catch(() => {
        showToast('Error loading partner transactions.', 'error');
      });
    }
  }, [selectedPartner, partnerFilters, getPartnerTransactions]);

  const handleGenerateInvite = async () => {
    try {
      const data = await generateInvite();
      showToast('Invite code generated!', 'success');
      getPendingInvites();
      return data;
    } catch (err) {
      showToast('Failed to generate invite code.', 'error');
      throw err;
    }
  };

  const handleAcceptInvite = async (code) => {
    try {
      await acceptInvite(code);
      showToast('Partner connection established successfully!', 'success');
      await Promise.all([
        getPartners(),
        getPendingInvites(),
        getSharingSettings()
      ]);
    } catch (err) {
      showToast(err.message || 'Failed to accept invite code.', 'error');
    }
  };

  const handleRejectInvite = async (code) => {
    try {
      await rejectInvite(code);
      showToast('Invite code rejected/cancelled.', 'info');
      getPendingInvites();
    } catch (err) {
      showToast('Failed to reject invite code.', 'error');
    }
  };

  const handleRemovePartner = async (partner) => {
    if (!window.confirm(`Are you sure you want to disconnect from ${partner.name}? This will instantly revoke mutual sharing access.`)) {
      return;
    }
    try {
      await removePartner(partner.id);
      showToast(`Successfully disconnected from ${partner.name}.`, 'success');
      await Promise.all([
        getPartners(),
        getPendingInvites(),
        getSharingSettings()
      ]);
      if (selectedPartner?.id === partner.id) {
        setSelectedPartner(null);
      }
    } catch (err) {
      showToast('Failed to revoke partnership.', 'error');
    }
  };

  const handleToggleSharing = async (accountId, partnerId, isShared) => {
    try {
      await toggleSharingSetting(accountId, partnerId, isShared);
      showToast('Sharing setting updated!', 'success');
    } catch (err) {
      showToast('Failed to modify sharing settings.', 'error');
    }
  };

  // Compute pending invite count
  const pendingCount = (pendingInvites.incoming?.length || 0) + (pendingInvites.outgoing?.length || 0);

  return (
    <div className="space-y-6">
      {/* Title Header */}
      {!selectedPartner && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Partner Transactions Sharing</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Mutually link wallets and share transactions securely with read-only partner visibility.
            </p>
          </div>
        </div>
      )}

      {/* Conditional View: Selected Partner Transactions OR Dashboard Tab Layout */}
      {selectedPartner ? (
        <PartnerTransactionsView
          partner={selectedPartner}
          accounts={partnerAccounts}
          transactions={partnerTransactions}
          categories={categories}
          loading={txLoading}
          filters={partnerFilters}
          setFilters={setPartnerFilters}
          onClose={() => setSelectedPartner(null)}
          formatCurrency={formatCurrency}
        />
      ) : (
        <div className="space-y-6">
          {/* Tab Navigation Switches */}
          <div className="flex border-b border-light-border dark:border-dark-border gap-6">
            <button
              onClick={() => setActiveTab('partners')}
              className={`pb-4 text-sm font-semibold tracking-wide border-b-2 transition-all flex items-center gap-2 relative ${
                activeTab === 'partners'
                  ? 'border-primary-500 text-primary-500 dark:text-white'
                  : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
              }`}
            >
              <Icon name="Users" size={16} />
              <span>Connected Partners</span>
              {partners.length > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary-500/10 text-primary-500 dark:bg-primary-500/20">
                  {partners.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('invites')}
              className={`pb-4 text-sm font-semibold tracking-wide border-b-2 transition-all flex items-center gap-2 relative ${
                activeTab === 'invites'
                  ? 'border-primary-500 text-primary-500 dark:text-white'
                  : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
              }`}
            >
              <Icon name="Send" size={16} />
              <span>Invitations & Setup</span>
              {pendingCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary-500 text-white shadow-md glow-red">
                  {pendingCount}
                </span>
              )}
            </button>
          </div>

          {/* Tab Contents */}
          <AnimatePresence mode="wait">
            {activeTab === 'partners' ? (
              <motion.div
                key="partners-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {partnersLoading && partners.length === 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2].map((n) => (
                      <div
                        key={n}
                        className="h-48 rounded-3xl glass-card animate-pulse bg-gray-200/50 dark:bg-white/5"
                      ></div>
                    ))}
                  </div>
                ) : (
                  <PartnerList
                    partners={partners}
                    onViewTransactions={setSelectedPartner}
                    onConfigureSharing={setSharingPartner}
                    onRemove={handleRemovePartner}
                    loading={partnersLoading}
                  />
                )}
              </motion.div>
            ) : (
              <motion.div
                key="invites-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Invite generation and Acceptance panel */}
                <InvitePartner
                  onGenerate={handleGenerateInvite}
                  onAccept={handleAcceptInvite}
                  loading={partnersLoading}
                />

                {/* Pending incoming and outgoing invites */}
                <PendingInvites
                  invites={pendingInvites}
                  onCancel={handleRejectInvite}
                  onAccept={handleAcceptInvite}
                  onReject={handleRejectInvite}
                  loading={partnersLoading}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Account Sharing Configuration Overlay Modal */}
      <AnimatePresence>
        {sharingPartner && (
          <SharingSettingsPanel
            partner={sharingPartner}
            settings={sharingSettings}
            onToggleSharing={handleToggleSharing}
            onClose={() => setSharingPartner(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Partners;
