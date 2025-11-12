import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createUser } from '../api/userApi';

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

function CreateUserPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('');
  const [organizacaoId, setOrganizacaoId] = useState('');
  const [equipeId, setEquipeId] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const { hasRole, hasAnyRole, getPrimaryRole, getOrganizacaoId, getEquipeId } = useAuth();
  const navigate = useNavigate();

  // Verificar permissões ao carregar a página
  useEffect(() => {
    const isAllowed = hasAnyRole(['ADM', 'ORG']);
    if (!isAllowed) {
      navigate('/');
    }
  }, [hasAnyRole, navigate]);

  const handleRoleChange = (value) => {
    setRole(value);
    setOrganizacaoId('');
    setEquipeId('');
  };

  const validatePassword = (pwd) => {
    // Mínimo 8 caracteres, deve conter letras e números
    const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    return regex.test(pwd);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validações
    if (!name.trim()) {
      setError('Nome completo é obrigatório');
      return;
    }

    if (!email.trim()) {
      setError('Email é obrigatório');
      return;
    }

    if (!validatePassword(password)) {
      setError('Senha inválida. Mínimo 8 caracteres, deve conter letras e números');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (!role) {
      setError('Papel é obrigatório');
      return;
    }

    // Validações específicas por papel
    if (role === 'ORG' && !hasRole('ADM')) {
      setError('Apenas Administradores podem criar usuários Organizadores');
      return;
    }

    if (role === 'ORG' && !organizacaoId) {
      setError('Organização é obrigatória para papel ORG');
      return;
    }

    if (role === 'TEC' && !equipeId) {
      setError('Equipe é obrigatória para papel TEC');
      return;
    }

    setLoading(true);
    try {
      const userData = {
        name,
        email,
        password,
        role,
        organizacaoId: role === 'ORG' ? organizacaoId : (role === 'TEC' ? null : null),
        equipeId: role === 'TEC' ? equipeId : null,
      };

      const requester = {
        role: getPrimaryRole(),
        organizacaoId: getOrganizacaoId(),
        equipeId: getEquipeId(),
      };

      await createUser(userData, requester);
      setSuccess('Usuário criado com sucesso!');
      
      // Limpar o formulário
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setRole('');
      setOrganizacaoId('');
      setEquipeId('');
      
      // Redirecionar após 2 segundos
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Falha ao criar usuário');
    } finally {
      setLoading(false);
    }
  };

  // Determinar quais papéis o usuário pode criar
  const getAvailableRoles = () => {
    if (hasRole('ADM')) {
      return ['ADM', 'ORG', 'TEC'];
    } else if (hasRole('ORG')) {
      return ['TEC'];
    }
    return [];
  };

  const availableRoles = getAvailableRoles();
  const roleLabels = {
    'ADM': 'Administrador',
    'ORG': 'Organizador',
    'TEC': 'Técnico'
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-versus-background p-4">
      <div className="w-full max-w-2xl p-8 space-y-6 bg-card text-card-foreground rounded-lg shadow-lg border">
        <div>
          <h2 className="text-3xl font-bold text-versus-yellow">Criar Novo Usuário</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Preencha os dados para criar um novo usuário no sistema
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo *</Label>
            <Input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome completo do usuário"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="usuario@email.com"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">Senha *</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="Mínimo 8 caracteres"
              />
              <p className="text-xs text-muted-foreground">
                Deve conter letras e números
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="Repita a senha"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Papel *</Label>
            <Select value={role} onValueChange={handleRoleChange} required>
              <SelectTrigger id="role">
                <SelectValue placeholder="Selecione o papel do usuário" />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map((r) => (
                  <SelectItem key={r} value={r}>
                    {roleLabels[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Campo Organização - apenas para ORG */}
          {role === 'ORG' && (
            <div className="space-y-2">
              <Label htmlFor="organizacao">
                ID da Organização *
              </Label>
              <Input
                id="organizacao"
                type="number"
                required
                value={organizacaoId}
                onChange={(e) => setOrganizacaoId(e.target.value)}
                placeholder="Digite o ID da organização"
                min="1"
              />
              <p className="text-xs text-muted-foreground">
                Digite o ID numérico da organização
              </p>
            </div>
          )}

          {/* Campo Equipe - apenas para TEC */}
          {role === 'TEC' && (
            <div className="space-y-2">
              <Label htmlFor="equipe">
                ID da Equipe *
              </Label>
              <Input
                id="equipe"
                type="number"
                required
                value={equipeId}
                onChange={(e) => setEquipeId(e.target.value)}
                placeholder="Digite o ID da equipe"
                min="1"
              />
              <p className="text-xs text-muted-foreground">
                Digite o ID numérico da equipe
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 text-sm text-green-500 bg-green-500/10 border border-green-500/20 rounded-md">
              {success}
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={loading}
              variant="default"
              className="flex-1 font-bold"
            >
              {loading ? 'Criando...' : 'Criar Usuário'}
            </Button>
            <Button
              type="button"
              onClick={() => navigate('/')}
              variant="outline"
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateUserPage;

