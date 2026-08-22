import React, { createContext, useContext, useState } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('triageai_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = async (username, password) => {
    try {
      const data = await api.login(username, password);
      if (data.success && data.user) {
        const userObj = {
          id: data.user.id,
          username: data.user.username,
          name: data.user.name || (data.user.role === 'admin' ? 'Admin' : 'Karthik'),
          role: data.user.role === 'admin' ? 'admin' : 'client',
          roleLabel: data.user.role === 'admin' ? 'Administrator' : 'Support User'
        };
        // Store only safe user session data in localStorage (NO passwords or hashes)
        setCurrentUser(userObj);
        localStorage.setItem('triageai_user', JSON.stringify(userObj));
        return { success: true, user: userObj };
      }
      return { success: false, error: 'Invalid username or password' };
    } catch (err) {
      return { success: false, error: err.message || 'Invalid username or password' };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('triageai_user');
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, isAuthenticated: !!currentUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
