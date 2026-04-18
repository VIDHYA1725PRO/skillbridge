import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, register as apiRegister, getMe } from '../utils/api';
import { io } from 'socket.io-client';

const AuthContext = createContext();

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  const initSocket = useCallback((userId) => {
    const s = io(process.env.REACT_APP_SOCKET_URL || window.location.origin.replace(':3000', ':5001'), {
      transports: ['websocket', 'polling']
    });
    s.on('connect', () => {
      s.emit('user_connected', userId);
    });
    setSocket(s);
    return s;
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('sb_token');
    if (token) {
      getMe()
        .then(res => {
          setUser(res.data);
          initSocket(res.data._id);
        })
        .catch(() => {
          localStorage.removeItem('sb_token');
          localStorage.removeItem('sb_user');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [initSocket]);

  const login = async (email, password) => {
    const res = await apiLogin({ email, password });
    localStorage.setItem('sb_token', res.data.token);
    setUser(res.data.user);
    initSocket(res.data.user._id);
    return res.data.user;
  };

  const register = async (data) => {
    const res = await apiRegister(data);
    localStorage.setItem('sb_token', res.data.token);
    setUser(res.data.user);
    initSocket(res.data.user._id);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem('sb_token');
    localStorage.removeItem('sb_user');
    if (socket) { socket.disconnect(); setSocket(null); }
    setUser(null);
  };

  const refreshUser = async () => {
    const res = await getMe();
    setUser(res.data);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, socket, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
