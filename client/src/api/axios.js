import axios from 'axios';

const ACCESS_KEY = 'ccv_access_token';
const REFRESH_KEY = 'ccv_refresh_token';
const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1', headers: { 'Content-Type': 'application/json' } });

export function getAccessToken() { return localStorage.getItem(ACCESS_KEY); }
export function getRefreshToken() { return localStorage.getItem(REFRESH_KEY); }
export function saveTokens({ accessToken, refreshToken }) { if (accessToken) localStorage.setItem(ACCESS_KEY, accessToken); if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken); }
export function clearTokens() { localStorage.removeItem(ACCESS_KEY); localStorage.removeItem(REFRESH_KEY); }

api.interceptors.request.use((config) => { const token = getAccessToken(); if (token) config.headers.Authorization = `Bearer ${token}`; return config; });

let refreshPromise = null;
api.interceptors.response.use((response) => response, async (error) => {
  const original = error.config;
  if (error.response?.status === 401 && error.response?.data?.error?.code === 'TOKEN_EXPIRED' && !original._retry) {
    original._retry = true;
    try {
      if (!refreshPromise) {
        refreshPromise = api.post('/auth/refresh', { refreshToken: getRefreshToken() }).then((response) => { saveTokens(response.data); return response.data.accessToken; }).finally(() => { refreshPromise = null; });
      }
      const accessToken = await refreshPromise;
      original.headers.Authorization = `Bearer ${accessToken}`;
      return api(original);
    } catch (refreshError) {
      clearTokens();
      window.dispatchEvent(new Event('auth:logout'));
      return Promise.reject(refreshError);
    }
  }
  return Promise.reject(error);
});

export default api;
