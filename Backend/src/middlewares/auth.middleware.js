const jwt = require('jsonwebtoken');

/**
 * Middleware to verify JWT token and authenticate requests
 * Usage: Add this middleware to routes that require authentication
 * 
 * Example:
 * router.get('/protected', authenticateToken, controller.getProtectedData);
 */
const authenticateToken = (req, res, next) => {
  // Get token from Authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido' });
  }

  const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) {
      // Token is invalid or expired
      return res.status(403).json({ error: 'Token inválido ou expirado' });
    }

    // Token is valid, attach user info to request
    req.user = decoded; // Contains: { userId, email, perfis }
    next();
  });
};

/**
 * Middleware to check if user has required role(s)
 * Usage: authenticateToken must be used first
 * 
 * Example:
 * router.post('/admin', authenticateToken, requireRole(['ADM']), controller.adminAction);
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const userRoles = req.user.perfis || [];
    const hasRequiredRole = allowedRoles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      return res.status(403).json({ 
        error: `Acesso negado. Requer um dos seguintes papéis: ${allowedRoles.join(', ')}` 
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  requireRole,
};

