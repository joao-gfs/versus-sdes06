import React, { createContext, useContext, useState, useEffect } from 'react';

// 1. Criar o Contexto
const AuthContext = createContext(null);
    
// 2. Criar o Provedor (Provider)
export const AuthProvider = ({ children }) => {
  // initialize from localStorage synchronously to avoid a render where auth is false
  const [user, setUser] = useState(() => {
    const s = localStorage.getItem('user');
    return s ? JSON.parse(s) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [perfis, setPerfis] = useState(() => {
    const s = localStorage.getItem('perfis');
    return s ? JSON.parse(s) : [];
  });

  // flag to indicate restoration finished (useful for route guards)
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // ensure consistency (in case some values were missing)
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    const storedPerfis = localStorage.getItem('perfis');

    if (storedUser && storedToken) {
      if (!user) setUser(JSON.parse(storedUser));
      if (!token) setToken(storedToken);
      if (!perfis.length) setPerfis(storedPerfis ? JSON.parse(storedPerfis) : []);
    } else {
      // if token exists but user doesn't, you might want to fetch the user with the token here
      // or clear inconsistent state:
      if (!storedUser && storedToken) {
        // optional: attempt to re-hydrate user from API, else clear token
        // setToken(null); localStorage.removeItem('token');
      }
    }

    setInitializing(false);
  }, []); // run once

  // 4. Função de Login
  const login = (userData, userToken, userPerfis = []) => {
    setUser(userData);
    setToken(userToken);
    setPerfis(userPerfis);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', userToken);
    localStorage.setItem('perfis', JSON.stringify(userPerfis));
  };

  // 5. Função de Logout
  const logout = () => {
    setUser(null);
    setToken(null);
    setPerfis([]);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('perfis');
  };

  // Helper function to check if user has a specific role
  const hasRole = (role) => {
    return perfis.some(perfil => perfil.papel === role);
  };

  // Helper function to check if user has any of the specified roles
  const hasAnyRole = (roles) => {
    return perfis.some(perfil => roles.includes(perfil.papel));
  };

  // Get user's primary role (first in the list)
  const getPrimaryRole = () => {
    return perfis.length > 0 ? perfis[0].papel : null;
  };

  // Get organization ID if user is ORG
  const getOrganizacaoId = () => {
    const orgPerfil = perfis.find(p => p.papel === 'ORG');
    return orgPerfil?.organizacao?.id || null;
  };

  // Get team ID if user is TEC
  const getEquipeId = () => {
    const tecPerfil = perfis.find(p => p.papel === 'TEC');
    return tecPerfil?.equipe?.id || null;
  };

  // 6. O valor fornecido pelo contexto
  const value = {
    user,
    token,
    perfis,
    isAuthenticated: !!token, // Verdadeiro se houver um token
    initializing, // expose the flag
    login,
    logout,
    hasRole,
    hasAnyRole,
    getPrimaryRole,
    getOrganizacaoId,
    getEquipeId,
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