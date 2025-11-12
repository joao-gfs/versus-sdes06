import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Este componente verifica se o usuário está autenticado.
 * Se estiver, renderiza o componente filho (a página).
 * Se não, redireciona para a página de login.
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redireciona para /login, mas guarda a página que
    // o usuário tentou acessar (location.pathname)
    // para que possamos redirecioná-lo de volta após o login.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se estiver autenticado, apenas renderiza a página solicitada
  return children;
};

export default ProtectedRoute;