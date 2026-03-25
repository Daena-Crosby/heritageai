import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { api } from './api';

const TOKEN_KEY = 'heritage_access_token';
const REFRESH_KEY = 'heritage_refresh_token';

// expo-secure-store is not supported on web — fall back to localStorage
const storage = {
  getItemAsync: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') return localStorage.getItem(key);
    return SecureStore.getItemAsync(key);
  },
  setItemAsync: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') { localStorage.setItem(key, value); return; }
    return SecureStore.setItemAsync(key, value);
  },
  deleteItemAsync: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') { localStorage.removeItem(key); return; }
    return SecureStore.deleteItemAsync(key);
  },
};

export interface AuthUser {
  id: string;
  email: string;
}

// Store tokens securely on device
export const saveTokens = async (accessToken: string, refreshToken: string) => {
  await storage.setItemAsync(TOKEN_KEY, accessToken);
  await storage.setItemAsync(REFRESH_KEY, refreshToken);
};

export const getAccessToken = async (): Promise<string | null> => {
  return storage.getItemAsync(TOKEN_KEY);
};

export const clearTokens = async () => {
  await storage.deleteItemAsync(TOKEN_KEY);
  await storage.deleteItemAsync(REFRESH_KEY);
};

// Attach token to all outgoing API requests
export const attachAuthInterceptor = () => {
  api.interceptors.request.use(async (config) => {
    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Auto-refresh on 401
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        const refreshToken = await storage.getItemAsync(REFRESH_KEY);
        if (refreshToken) {
          try {
            const { data } = await api.post('/auth/refresh', { refreshToken });
            await saveTokens(data.token, data.refreshToken);
            error.config.headers.Authorization = `Bearer ${data.token}`;
            return api.request(error.config);
          } catch {
            await clearTokens();
          }
        }
      }
      return Promise.reject(error);
    }
  );
};

export const login = async (email: string, password: string): Promise<AuthUser> => {
  const { data } = await api.post('/auth/login', { email, password });
  await saveTokens(data.token, data.refreshToken);
  return data.user;
};

export const register = async (email: string, password: string, displayName?: string): Promise<AuthUser> => {
  const { data } = await api.post('/auth/register', { email, password, displayName });
  return data.user;
};

export const logout = async () => {
  try {
    await api.post('/auth/logout');
  } catch { /* ignore errors on logout */ }
  await clearTokens();
};

export const getMyProfile = async () => {
  const { data } = await api.get('/users/me');
  return data;
};
