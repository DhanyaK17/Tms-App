import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { storage } from '../storage/storage';

const getHostFromExpo = () => {
  try {
    const hostUri = Constants?.expoConfig?.hostUri || Constants?.manifest?.debuggerHost;
    if (hostUri) {
      return hostUri.split(':')[0];
    }
  } catch (e) {
    // Ignore error
  }
  return null;
};

const getApiUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1') && !envUrl.startsWith('http://10.')) {
    return envUrl;
  }
  if (Platform.OS === 'web') {
    const host = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'localhost';
    return `http://${host}:5000/api`;
  }
  const expoHost = getHostFromExpo();
  if (expoHost) {
    return `http://${expoHost}:5000/api`;
  }
  return envUrl || 'http://localhost:5000/api';
};

const getFileUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_FILE_URL;
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1') && !envUrl.startsWith('http://10.')) {
    return envUrl;
  }
  if (Platform.OS === 'web') {
    const host = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'localhost';
    return `http://${host}:5000`;
  }
  const expoHost = getHostFromExpo();
  if (expoHost) {
    return `http://${expoHost}:5000`;
  }
  return envUrl || 'http://localhost:5000';
};

export const API_BASE_URL = getApiUrl();
export const FILE_BASE_URL = getFileUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Interceptor to attach Authorization Bearer token from AsyncStorage
api.interceptors.request.use(async (config) => {
  const token = await storage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor to handle unauthorized / expired tokens
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token on 401 unauthorized response
      await storage.clearAll();
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  changePassword: (passwordData) => api.put('/auth/profile/password', passwordData),
};

export const departmentService = {
  create: (data) => api.post('/departments', data),
  getAll: () => api.get('/departments'),
  getById: (id) => api.get(`/departments/${id}`),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`),
};

export const programmeService = {
  create: (data) => api.post('/programmes', data),
  getAll: (params) => api.get('/programmes', { params }),
  getById: (id) => api.get(`/programmes/${id}`),
  update: (id, data) => api.put(`/programmes/${id}`, data),
  delete: (id) => api.delete(`/programmes/${id}`),
};

export const blockService = {
  create: (data) => api.post('/blocks', data),
  getAll: (params) => api.get('/blocks', { params }),
  getById: (id) => api.get(`/blocks/${id}`),
  update: (id, data) => api.put(`/blocks/${id}`, data),
  delete: (id) => api.delete(`/blocks/${id}`),
};

export const roomService = {
  create: (data) => api.post('/rooms', data),
  getAll: (params) => api.get('/rooms', { params }),
  getById: (id) => api.get(`/rooms/${id}`),
  update: (id, data) => api.put(`/rooms/${id}`, data),
  delete: (id) => api.delete(`/rooms/${id}`),
};

export const roleService = {
  create: (data) => api.post('/roles', data),
  getAll: () => api.get('/roles'),
  getById: (id) => api.get(`/roles/${id}`),
  update: (id, data) => api.put(`/roles/${id}`, data),
  delete: (id) => api.delete(`/roles/${id}`),
};

export const userService = {
  create: (data) => api.post('/users', data),
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

export const complaintService = {
  create: (formData) =>
    api.post('/complaints', formData, {
      headers: {
        ...(Platform.OS !== 'web' ? { 'Content-Type': 'multipart/form-data' } : {}),
      },
    }),
  getAll: (params) => api.get('/complaints', { params }),
  getById: (id) => api.get(`/complaints/${id}`),
  getStats: () => api.get('/complaints/stats'),
  assign: (id, assignedTo) =>
    api.patch(`/complaints/${id}/assign`, { assignedTo }),
  updateStatus: (id, status) =>
    api.patch(`/complaints/${id}/status`, { status }),
  delete: (id) => api.delete(`/complaints/${id}`),
  report: (params) => api.get('/complaints/report', { params }),
};

export default api;
