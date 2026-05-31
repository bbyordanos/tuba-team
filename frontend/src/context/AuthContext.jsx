import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('tuba_token');
    if (token) {
      API.get('/auth/me').then(r => setUser(r.data)).catch(() => localStorage.removeItem('tuba_token')).finally(() => setLoading(false));
    } else setLoading(false);
  }, []);

  const login = async (identifier, password) => {
    const r = await API.post('/auth/login', { identifier, password });
    localStorage.setItem('tuba_token', r.data.token);
    setUser(r.data.user);
    return r.data.user;
  };

  const register = async (data) => {
    const r = await API.post('/auth/register', data);
    localStorage.setItem('tuba_token', r.data.token);
    setUser(r.data.user);
    return r.data.user;
  };

  const logout = () => {
    localStorage.removeItem('tuba_token');
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
