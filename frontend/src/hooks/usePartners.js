import { useState, useCallback } from 'react';
import apiFetch from '../utils/api';

export const usePartners = () => {
  const [partners, setPartners] = useState([]);
  const [pendingInvites, setPendingInvites] = useState({ incoming: [], outgoing: [] });
  const [sharingSettings, setSharingSettings] = useState([]);
  const [loading, setLoading] = useState(false);

  const getPartners = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/partners');
      setPartners(data);
      return data;
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPendingInvites = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/partners/invites/pending');
      setPendingInvites(data);
      return data;
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const generateInvite = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/partners/invite', {
        method: 'POST'
      });
      return data; // returns { invite_code, invite_link }
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const acceptInvite = useCallback(async (code) => {
    setLoading(true);
    try {
      const data = await apiFetch('/partners/accept', {
        method: 'POST',
        body: JSON.stringify({ invite_code: code })
      });
      return data;
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const rejectInvite = useCallback(async (code) => {
    setLoading(true);
    try {
      await apiFetch('/partners/reject', {
        method: 'POST',
        body: JSON.stringify({ invite_code: code })
      });
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const removePartner = useCallback(async (partnerId) => {
    setLoading(true);
    try {
      await apiFetch(`/partners/${partnerId}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getSharingSettings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/partners/sharing-settings');
      setSharingSettings(data);
      return data;
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleSharingSetting = useCallback(async (accountId, partnerId, isShared) => {
    try {
      const updated = await apiFetch(`/partners/sharing-settings/${accountId}`, {
        method: 'PUT',
        body: JSON.stringify({ partner_id: partnerId, is_shared: isShared })
      });
      
      // Update local state
      setSharingSettings((prev) =>
        prev.map((s) =>
          s.account_id === accountId && s.partner_id === partnerId
            ? { ...s, is_shared: isShared }
            : s
        )
      );
      return updated;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }, []);

  return {
    partners,
    pendingInvites,
    sharingSettings,
    loading,
    getPartners,
    getPendingInvites,
    generateInvite,
    acceptInvite,
    rejectInvite,
    removePartner,
    getSharingSettings,
    toggleSharingSetting
  };
};

export default usePartners;
