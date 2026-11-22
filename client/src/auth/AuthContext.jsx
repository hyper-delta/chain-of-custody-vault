import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api, { clearTokens, getAccessToken, getRefreshToken, saveTokens } from '../api/axios.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const logoutHandler = () => setUser(null);
    window.addEventListener('auth:logout', logoutHandler);
    if (!getAccessToken()) { setLoading(false); return () => window.removeEventListener('auth:logout', logoutHandler); }
    api.get('/auth/me').then(({ data }) => setUser(data)).catch(() => clearTokens()).finally(() => setLoading(false));
    return () => window.removeEventListener('auth:logout', logoutHandler);
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    saveTokens(data); setUser(data.user); return data.user;
  };
  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    saveTokens(data); setUser(data.user); return data.user;
  };
  const logout = async () => {
    try { await api.post('/auth/logout'); } finally { clearTokens(); setUser(null); }
  };
  const hasPermission = (permission) => user?.permissions?.includes(permission) || false;
  const value = useMemo(() => ({ user, loading, login, register, logout, hasPermission }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }
