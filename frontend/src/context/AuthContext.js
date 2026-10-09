import React, { createContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/api';
import { storage } from '../storage/storage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await authService.getProfile();
      setUser(response.data);
      await storage.setUser(response.data);
    } catch (error) {
      console.warn('Failed to fetch profile on startup, clearing session:', error.message);
      await storage.clearAll();
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize persistent session on startup
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = await storage.getToken();
        const storedUser = await storage.getUser();
        if (storedToken) {
          setToken(storedToken);
          if (storedUser) {
            setUser(storedUser);
          }
          await fetchProfile();
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setLoading(false);
      }
    };

    initAuth();
  }, [fetchProfile]);

  const login = async (email, password) => {
    const response = await authService.login(email, password);
    const { token: newToken, user: userData } = response.data;
    await storage.setToken(newToken);
    await storage.setUser(userData);
    setToken(newToken);
    setUser(userData);
    return response.data;
  };

  const updateProfile = async (userData) => {
    const response = await authService.updateProfile(userData);
    setUser(response.data);
    await storage.setUser(response.data);
    return response.data;
  };

  const changePassword = async (passwordData) => {
    const response = await authService.changePassword(passwordData);
    return response.data;
  };

  const logout = async () => {
    await storage.clearAll();
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    updateProfile,
    changePassword,
    fetchProfile,
    isAuthenticated: !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
