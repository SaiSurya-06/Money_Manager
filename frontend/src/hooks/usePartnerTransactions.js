import { useState, useCallback } from 'react';
import apiFetch from '../utils/api';

export const usePartnerTransactions = () => {
  const [partnerAccounts, setPartnerAccounts] = useState([]);
  const [partnerTransactions, setPartnerTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  const getPartnerAccounts = useCallback(async (partnerId) => {
    setLoading(true);
    try {
      const data = await apiFetch(`/partners/${partnerId}/accounts`);
      setPartnerAccounts(data);
      return data;
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPartnerTransactions = useCallback(async (partnerId, filters = {}) => {
    setLoading(true);
    try {
      const { search, type, category_id, start_date, end_date } = filters;
      let query = '';
      const params = [];
      if (search) params.push(`search=${encodeURIComponent(search)}`);
      if (type) params.push(`type=${type}`);
      if (category_id) params.push(`category_id=${category_id}`);
      if (start_date) params.push(`start_date=${start_date}`);
      if (end_date) params.push(`end_date=${end_date}`);

      if (params.length > 0) {
        query = `?${params.join('&')}`;
      }

      const data = await apiFetch(`/partners/${partnerId}/transactions${query}`);
      setPartnerTransactions(data);
      return data;
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    partnerAccounts,
    partnerTransactions,
    loading,
    getPartnerAccounts,
    getPartnerTransactions
  };
};

export default usePartnerTransactions;
