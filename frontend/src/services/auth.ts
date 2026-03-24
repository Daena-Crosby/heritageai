import * as SecureStore from 'expo-secure-store';
import { api } from './api';

const TOKEN_KEY = 'heritage_access_token';
const REFRESH_KEY = 'heritage_refresh_token';

export interface AuthUser {
  id: string;
  email: string;
}

// Store tokens securely on device
export const saveTokens = async (accessToken: string, refreshToken: string) => {
  await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
  await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
};

export const getAccessToken = async (): Promise<string | null> => {
  return SecureStore.getItemAsync(TOKEN_KEY);
};

export const clearTokens = async () => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
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
        const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
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
