import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('gram_token');
    const savedUser = localStorage.getItem('gram_user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch {
        localStorage.removeItem('gram_token');
        localStorage.removeItem('gram_user');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password });
    const { access_token, user: userData } = res.data;
    localStorage.setItem('gram_token', access_token);
    localStorage.setItem('gram_user', JSON.stringify(userData));
    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    setUser(userData);
    return userData;
  }, []);

  const signup = useCallback(async (name, email, password, location, role) => {
    const res = await api.post('/api/auth/signup', { name, email, password, location, role });
    const { access_token, user: userData } = res.data;
    localStorage.setItem('gram_token', access_token);
    localStorage.setItem('gram_user', JSON.stringify(userData));
    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('gram_token');
    localStorage.removeItem('gram_user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  }, []);

  const updateUser = useCallback(async (updates) => {
    try {
      const res = await api.put('/api/auth/profile', updates);
      const updated = res.data;
      setUser(updated);
      localStorage.setItem('gram_user', JSON.stringify(updated));
      return updated;
    } catch (err) {
      // Local fallback if offline
      const updated = { ...user, ...updates };
      setUser(updated);
      localStorage.setItem('gram_user', JSON.stringify(updated));
      return updated;
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
