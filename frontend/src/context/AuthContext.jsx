import React, { createContext, useContext, useState, useEffect } from 'react';
import apiFetch from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      if (token) {
        const profile = await apiFetch('/users/me');
        setUser(profile);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem('token', data.access_token);
      setToken(data.access_token);
      // fetchProfile will be triggered by token change, but we can do a reload/profile fetch
      const profile = await apiFetch('/users/me', {
        headers: { Authorization: `Bearer ${data.access_token}` }
      });
      setUser(profile);
      return profile;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const signup = async (name, email, password, preferred_currency) => {
    setLoading(true);
    try {
      const data = await apiFetch('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, preferred_currency }),
      });
      localStorage.setItem('token', data.access_token);
      setToken(data.access_token);
      
      const profile = await apiFetch('/users/me', {
        headers: { Authorization: `Bearer ${data.access_token}` }
      });
      setUser(profile);
      return profile;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setLoading(false);
  };

  const refreshProfile = async () => {
    try {
      const profile = await apiFetch('/users/me');
      setUser(profile);
      return profile;
    } catch (err) {
      console.error('Error refreshing profile:', err);
    }
  };

  const formatCurrency = (amount) => {
    const currency = user?.preferred_currency || 'USD';
    const formatter = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency,
    });
    return formatter.format(amount);
  };

  const getCurrencySymbol = () => {
    const currency = user?.preferred_currency || 'USD';
    const formatter = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return formatter.format(0).replace(/\d/g, '').trim();
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    login,
    signup,
    logout,
    refreshProfile,
    formatCurrency,
    getCurrencySymbol
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
