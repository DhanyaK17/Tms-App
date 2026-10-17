import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@tms_token';
const USER_KEY = '@tms_user';
const THEME_KEY = '@tms_theme_mode';

export const storage = {
  async getTheme() {
    try {
      return await AsyncStorage.getItem(THEME_KEY);
    } catch (e) {
      console.error('Storage getTheme error', e);
      return null;
    }
  },

  async setTheme(theme) {
    try {
      if (theme) {
        await AsyncStorage.setItem(THEME_KEY, theme);
      } else {
        await AsyncStorage.removeItem(THEME_KEY);
      }
    } catch (e) {
      console.error('Storage setTheme error', e);
    }
  },

  async getToken() {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (e) {
      console.error('Storage getToken error', e);
      return null;
    }
  },

  async setToken(token) {
    try {
      if (token) {
        await AsyncStorage.setItem(TOKEN_KEY, token);
      } else {
        await AsyncStorage.removeItem(TOKEN_KEY);
      }
    } catch (e) {
      console.error('Storage setToken error', e);
    }
  },

  async removeToken() {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
    } catch (e) {
      console.error('Storage removeToken error', e);
    }
  },

  async getUser() {
    try {
      const data = await AsyncStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Storage getUser error', e);
      return null;
    }
  },

  async setUser(user) {
    try {
      if (user) {
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
      } else {
        await AsyncStorage.removeItem(USER_KEY);
      }
    } catch (e) {
      console.error('Storage setUser error', e);
    }
  },

  async removeUser() {
    try {
      await AsyncStorage.removeItem(USER_KEY);
    } catch (e) {
      console.error('Storage removeUser error', e);
    }
  },

  async clearAll() {
    try {
      await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    } catch (e) {
      console.error('Storage clearAll error', e);
    }
  },
};

export default storage;
