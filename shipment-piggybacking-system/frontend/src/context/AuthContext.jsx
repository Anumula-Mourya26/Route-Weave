import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const STORAGE_KEY_TOKEN = 'routeweave_auth_token';
const STORAGE_KEY_USER = 'routeweave_auth_user';

export const DEMO_CREDENTIALS = {
  ADMIN: {
    email: 'admin@routeweave.com',
    password: 'admin123',
    roleLabel: 'Logistics Administrator'
  },
  DISPATCHER: {
    email: 'admin@routeweave.com',
    password: 'admin123',
    roleLabel: 'Route Dispatcher'
  }
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(STORAGE_KEY_TOKEN) || localStorage.getItem(STORAGE_KEY_TOKEN);
    }
    return null;
  });

  const [user, setUser] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(STORAGE_KEY_USER) || localStorage.getItem(STORAGE_KEY_USER);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { return null; }
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (token) {
        sessionStorage.setItem(STORAGE_KEY_TOKEN, token);
      } else {
        sessionStorage.removeItem(STORAGE_KEY_TOKEN);
        localStorage.removeItem(STORAGE_KEY_TOKEN);
      }
    }
  }, [token]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (user) {
        sessionStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
      } else {
        sessionStorage.removeItem(STORAGE_KEY_USER);
        localStorage.removeItem(STORAGE_KEY_USER);
      }
    }
  }, [user]);

  /**
   * Hardcoded Authentication Gate
   * Strictly accepts only admin@routeweave.com / admin123
   */
  const login = async (email, password) => {
    setLoading(true);
    setError(null);

    // Subtle authentic response latency
    await new Promise(r => setTimeout(r, 200));

    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    if (cleanEmail === 'admin@routeweave.com' && cleanPassword === 'admin123') {
      const authUser = {
        id: 'routeweave_admin_01',
        name: 'Route Weave Admin',
        email: 'admin@routeweave.com',
        role: 'admin',
        roleLabel: 'Central Route Controller'
      };
      const authToken = 'session_routeweave_auth_' + Date.now();

      setToken(authToken);
      setUser(authUser);
      setLoading(false);
      return { success: true, user: authUser };
    }

    const errorMsg = 'Invalid credentials. Access restricted to authorized personnel.';
    setError(errorMsg);
    setLoading(false);
    return { success: false, error: errorMsg };
  };

  /**
   * Terminate active session
   */
  const logout = () => {
    setToken(null);
    setUser(null);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(STORAGE_KEY_TOKEN);
      sessionStorage.removeItem(STORAGE_KEY_USER);
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      localStorage.removeItem(STORAGE_KEY_USER);
    }
  };

  const value = {
    user,
    token,
    role: user?.role || null,
    isAuthenticated: Boolean(token && user),
    loading,
    error,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
