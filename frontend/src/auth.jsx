import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('ts_token');
    if (!token) { setLoading(false); return; }
    api('/api/auth/me').then(setUser).catch(() => localStorage.removeItem('ts_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const r = await api('/api/auth/login', { method: 'POST', body: { email, password }, auth: false });
    localStorage.setItem('ts_token', r.token);
    setUser({ name: r.name, email: r.email, role: r.role });
  };

  const register = async (name, email, password, role) => {
    const r = await api('/api/auth/register', { method: 'POST', body: { name, email, password, role }, auth: false });
    localStorage.setItem('ts_token', r.token);
    setUser({ name: r.name, email: r.email, role: r.role });
  };

  const logout = () => {
    localStorage.removeItem('ts_token');
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, loading, login, register, logout,
      isOrganizer: user && (user.role === 'ORGANIZER' || user.role === 'ADMIN') }}>
      {children}
    </AuthCtx.Provider>
  );
}
