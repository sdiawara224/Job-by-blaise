import { createContext, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken } from './api.js';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!getToken());

  useEffect(() => {
    if (!getToken()) return;
    api('/auth/me')
      .then((d) => setUser(d.user))
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password, { adminMode = false } = {}) => {
    const d = await api(adminMode ? '/auth/admin/login' : '/auth/login', { method: 'POST', body: { email, password } });
    if (!adminMode && (d.user?.role === 'super_admin' || d.user?.isAdmin)) throw new Error('Ce compte est réservé à la connexion administration.');
    setToken(d.token);
    setUser(d.user);
    return d.user;
  };

  const register = async (payload) => {
    const d = await api('/auth/register', { method: 'POST', body: payload });
    setToken(d.token);
    setUser(d.user);
    return d.user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const updateUser = (u) => setUser((prev) => ({ ...prev, ...u }));

  return (
    <AuthCtx.Provider value={{ user, setUser, loading, login, register, logout, updateUser }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
