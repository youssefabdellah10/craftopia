import React, { createContext, useContext, useState, useEffect } from 'react';

function decodeJWT(token) {
  try {
    const payload = token.split('.')[1];
    const decodedJson = window.atob(payload);
    return JSON.parse(decodedJson);
  } catch {
    return {};
  }
}

const AuthContext = createContext({
  user: null,
  login: () => {},
  logout: () => {},
  authLoaded: false 
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authLoaded, setAuthLoaded] = useState(false); 

  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
        setAuthLoaded(true); 
        return;
      }

      const decoded = decodeJWT(token);
      if (decoded.exp && decoded.exp * 1000 > Date.now()) {
        setUser({
          id: decoded.id || decoded.sub,
          email: decoded.email,
          role: decoded.role
        });
      } else {
        localStorage.removeItem('token');
        setUser(null);
      }
      setAuthLoaded(true);
    };

    handleStorageChange(); 
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = (token) => {
    localStorage.setItem('token', token);
    const decoded = decodeJWT(token);
    setUser({
      id: decoded.id || decoded.sub,
      email: decoded.email,
      role: decoded.role
    });
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("activeTab");
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, authLoaded }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
