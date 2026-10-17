import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { storage } from '../storage/storage';
import { DARK_COLORS, LIGHT_COLORS } from '../constants/theme';
import { authService } from '../services/api';

export const ThemeContext = createContext({
  theme: 'dark',
  isDark: true,
  colors: DARK_COLORS,
  toggleTheme: () => {},
  setTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  const systemScheme = useColorScheme();
  const [theme, setThemeState] = useState('dark');
  const [isReady, setIsReady] = useState(false);

  // Restore saved theme on startup
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await storage.getTheme();
        if (saved === 'dark' || saved === 'light') {
          setThemeState(saved);
        } else if (systemScheme === 'light') {
          setThemeState('light');
        } else {
          setThemeState('dark');
        }
      } catch (e) {
        console.warn('Failed to load theme preference:', e);
      } finally {
        setIsReady(true);
      }
    };
    loadTheme();
  }, [systemScheme]);

  const setTheme = useCallback(async (newTheme) => {
    if (newTheme !== 'dark' && newTheme !== 'light') return;
    setThemeState(newTheme);
    await storage.setTheme(newTheme);

    // Sync with backend profile if authenticated
    try {
      const token = await storage.getToken();
      if (token) {
        authService.updateProfile({
          preferences: { darkMode: newTheme === 'dark' },
        }).catch(() => {});
      }
    } catch (e) {
      // Ignore background sync errors
    }
  }, []);

  const toggleTheme = useCallback(async () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    await setTheme(nextTheme);
  }, [theme, setTheme]);

  const isDark = theme === 'dark';
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  const value = {
    theme,
    isDark,
    colors,
    toggleTheme,
    setTheme,
    isReady,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: 'dark',
      isDark: true,
      colors: DARK_COLORS,
      toggleTheme: () => {},
      setTheme: () => {},
      isReady: true,
    };
  }
  return context;
};

export default ThemeContext;
