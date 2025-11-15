import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';

function Header() {
  const { user, logout, hasRole, hasAnyRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Helper function to check if a path is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  // Navigation link component with active state styling
  const NavLink = ({ to, children, show = true }) => {
    if (!show) return null;
    
    return (
      <button
        onClick={() => navigate(to)}
        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          isActive(to)
            ? 'bg-versus-yellow text-versus-background'
            : 'text-versus-grey hover:bg-versus-yellow/10 hover:text-versus-yellow'
        }`}
      >
        {children}
      </button>
    );
  };

  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <button
              onClick={() => navigate('/')}
              className="text-2xl font-bold text-versus-yellow hover:text-versus-yellow/80 transition-colors"
            >
              Versus
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-2">
            <NavLink to="/">Home</NavLink>
            
            {/* Users management - only for ADM and ORG */}
            <NavLink to="/criar-usuario" show={hasAnyRole(['ADM', 'ORG'])}>
              Criar Usuário
            </NavLink>
            
            {/* View all users - only for ADM */}
            <NavLink to="/usuarios" show={hasRole('ADM')}>
              Usuários
            </NavLink>
            
            {/* Organizations - only for ADM */}
            <NavLink to="/organizacoes" show={hasRole('ADM')}>
              Organizações
            </NavLink>
          </nav>

          {/* User Info & Logout */}
          <div className="flex items-center space-x-4">
            {/* User Name */}
            <div className="hidden sm:block text-sm text-muted-foreground">
              <span className="font-medium text-versus-yellow">
                {user?.nome || 'Usuário'}
              </span>
            </div>

            {/* Logout Button */}
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="font-medium"
            >
              Sair
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <nav className="md:hidden pb-4 flex flex-wrap gap-2">
          <NavLink to="/">Home</NavLink>
          
          <NavLink to="/criar-usuario" show={hasAnyRole(['ADM', 'ORG'])}>
            Criar Usuário
          </NavLink>
          
          <NavLink to="/usuarios" show={hasRole('ADM')}>
            Usuários
          </NavLink>
          
          <NavLink to="/organizacoes" show={hasRole('ADM')}>
            Organizações
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

export default Header;

