import React, { createContext, useContext, useState, useEffect } from 'react';

// 1. Criar o Contexto
const AuthContext = createContext(null);

// 2. Criar o Provedor (Provider)
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // 3. Efeito para carregar dados do localStorage na inicialização
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
  }, []);

  // 4. Função de Login
  const login = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', userToken);
  };

  // 5. Função de Logout
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  // 6. O valor fornecido pelo contexto
  const value = {
    user,
    token,
    isAuthenticated: !!token, // Verdadeiro se houver um token
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 7. Criar um hook customizado para facilitar o uso do contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};