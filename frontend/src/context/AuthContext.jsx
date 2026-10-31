import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('maskoff_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('maskoff_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('maskoff_token');
      if (storedToken) {
        try {
          const res = await authAPI.getMe();
          setUser(res.data.user);
          localStorage.setItem('maskoff_user', JSON.stringify(res.data.user));
        } catch (err) {
          console.error("Auth check failed:", err);
          logout();
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { token: newToken, user: userData } = res.data;
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('maskoff_token', newToken);
    localStorage.setItem('maskoff_user', JSON.stringify(userData));
    return userData;
  };

  const register = async (name, email, password, primary_goals = []) => {
    const res = await authAPI.register({ name, email, password, primary_goals });
    const { token: newToken, user: userData } = res.data;
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('maskoff_token', newToken);
    localStorage.setItem('maskoff_user', JSON.stringify(userData));
    return userData;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('maskoff_token');
    localStorage.removeItem('maskoff_user');
  };

  const updatePreferences = async (prefs) => {
    const res = await authAPI.completeOnboarding(prefs);
    if (user) {
      const updatedUser = {
        ...user,
        preferences: res.data.preferences,
      };
      setUser(updatedUser);
      localStorage.setItem('maskoff_user', JSON.stringify(updatedUser));
    }
    return res.data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        loading,
        login,
        register,
        logout,
        updatePreferences,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

