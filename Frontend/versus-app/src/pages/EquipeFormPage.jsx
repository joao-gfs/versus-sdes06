import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  createEquipe,
  getEquipeById,
  updateEquipe,
} from '../api/equipeApi';
import { listUsers } from '../api/userApi';

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

function EquipeFormPage() {
  const { id } = useParams(); // Se houver ID, é edição; senão, é criação
  const isEditMode = Boolean(id);

  const [nome, setNome] = useState('');
  const [tecnicoId, setTecnicoId] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [capacidadeMaxima, setCapacidadeMaxima] = useState('');

  const [tecnicos, setTecnicos] = useState([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  const { hasRole } = useAuth();
  const navigate = useNavigate();

  // Verificar permissões ao carregar a página
  useEffect(() => {
    const isAllowed = hasRole('ADM') || hasRole('ORG');
    if (!isAllowed) {
      navigate('/');
    }
  }, [hasRole, navigate]);

  // Carregar dados necessários ao montar o componente
  useEffect(() => {
    const loadUsuarios = async () => {
      setLoadingUsuarios(true);
      try {
        const data = await listUsers();
        // Filtrar apenas usuários com perfil TEC
        // Como não temos essa informação direta na API de usuários, 
        // vamos mostrar todos e deixar o backend validar
        setTecnicos(data);
      } catch (err) {
        console.error('Falha ao carregar usuários:', err);
      } finally {
        setLoadingUsuarios(false);
      }
    };

    loadUsuarios();
  }, []);

  // Carregar dados da equipe se estiver em modo de edição
  useEffect(() => {
    const loadEquipe = async () => {
      setLoadingData(true);
      setError(null);
      try {
        const eq = await getEquipeById(Number(id));
        setNome(eq.nome || '');
        setTecnicoId(eq.tecnicoId ? String(eq.tecnicoId) : '');
        setTelefone(eq.telefone || '');
        setEmail(eq.email || '');
        setCapacidadeMaxima(eq.capacidadeMaxima ? String(eq.capacidadeMaxima) : '');
      } catch (err) {
        setError(err.message || 'Falha ao carregar equipe');
      } finally {
        setLoadingData(false);
      }
    };

    if (isEditMode) {
      loadEquipe();
    }
  }, [id, isEditMode]);

  // Função para formatar telefone enquanto digita
  const formatTelefone = (value) => {
    // Remove tudo que não é dígito
    const numbers = value.replace(/\D/g, '');
    
    // Limita a 11 dígitos (DDD + 9 dígitos)
    const limited = numbers.substring(0, 11);
    
    // Aplica a máscara (NN) NNNNN-NNNN ou (NN) NNNN-NNNN
    let formatted = limited;
    if (limited.length > 0) {
      formatted = '(' + limited;
    }
    if (limited.length > 2) {
      formatted = formatted.substring(0, 3) + ') ' + formatted.substring(3);
    }
    if (limited.length > 7) {
      formatted = formatted.substring(0, 10) + '-' + formatted.substring(10);
    }
    
    return formatted;
  };

  const handleTelefoneChange = (e) => {
    const formatted = formatTelefone(e.target.value);
    setTelefone(formatted);
  };

  // Validação de email
  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  // Validação de telefone
  const validateTelefone = (telefone) => {
    const numbers = telefone.replace(/\D/g, '');
    return numbers.length >= 10 && numbers.length <= 11;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validações
    if (!nome.trim()) {
      setError('Nome da equipe é obrigatório');
      return;
    }

    if (!tecnicoId) {
      setError('Técnico/Responsável é obrigatório');
      return;
    }

    if (!telefone.trim()) {
      setError('Telefone é obrigatório');
      return;
    }

    if (!validateTelefone(telefone)) {
      setError('Telefone inválido. Informe DDD e número com 8 ou 9 dígitos');
      return;
    }

    if (!email.trim()) {
      setError('Email é obrigatório');
      return;
    }

    if (!validateEmail(email)) {
      setError('Email inválido');
      return;
    }

    if (capacidadeMaxima && (!Number.isInteger(Number(capacidadeMaxima)) || Number(capacidadeMaxima) <= 0)) {
      setError('Capacidade máxima deve ser um número inteiro positivo');
      return;
    }

    setLoading(true);
    try {
      const equipeData = {
        nome: nome.trim(),
        tecnicoId: Number(tecnicoId),
        telefone: telefone.trim(),
        email: email.trim(),
        capacidadeMaxima: capacidadeMaxima ? Number(capacidadeMaxima) : undefined,
      };

      if (isEditMode) {
        // Modo de edição
        await updateEquipe(Number(id), equipeData);
        setSuccess('Equipe atualizada com sucesso!');
      } else {
        // Modo de criação
        await createEquipe(equipeData);
        setSuccess('Equipe criada com sucesso!');
      }

      // Redirecionar após 2 segundos
      setTimeout(() => {
        navigate('/equipes');
      }, 2000);
    } catch (err) {
      setError(err.message || `Falha ao ${isEditMode ? 'atualizar' : 'criar'} equipe`);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-xl text-muted-foreground">Carregando dados...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="p-8 space-y-6 bg-card text-card-foreground rounded-lg shadow-lg border">
        <div>
          <h2 className="text-3xl font-bold text-versus-yellow">
            {isEditMode ? 'Editar Equipe' : 'Nova Equipe'}
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            {isEditMode
              ? 'Atualize os dados da equipe'
              : 'Preencha os dados para cadastrar uma nova equipe esportiva'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="nome">Nome da Equipe *</Label>
            <Input
              id="nome"
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Corinthians Sub-20"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Nome oficial e único da equipe
            </p>
          </div>

          {/* Técnico/Responsável */}
          <div className="space-y-2">
            <Label htmlFor="tecnico">Técnico / Responsável *</Label>
            <Select 
              value={tecnicoId} 
              onValueChange={setTecnicoId}
              disabled={loading || loadingUsuarios}
            >
              <SelectTrigger id="tecnico">
                <SelectValue placeholder={loadingUsuarios ? "Carregando..." : "Selecione um técnico"} />
              </SelectTrigger>
              <SelectContent className="bg-background">
                {tecnicos.map((usuario) => (
                  <SelectItem key={usuario.id} value={String(usuario.id)}>
                    {usuario.nome} ({usuario.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Usuário com perfil TEC (Técnico) responsável pela equipe
            </p>
          </div>

          {/* Telefone e Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone *</Label>
              <Input
                id="telefone"
                type="text"
                required
                value={telefone}
                onChange={handleTelefoneChange}
                placeholder="(00) 00000-0000"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Telefone com DDD do responsável
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contato@equipe.com"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Email válido do responsável
              </p>
            </div>
          </div>

          {/* Capacidade Máxima */}
          <div className="space-y-2">
            <Label htmlFor="capacidadeMaxima">Capacidade Máxima de Atletas</Label>
            <Input
              id="capacidadeMaxima"
              type="number"
              min="1"
              value={capacidadeMaxima}
              onChange={(e) => setCapacidadeMaxima(e.target.value)}
              placeholder="Ex: 25"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Limite de atletas na equipe (opcional)
            </p>
          </div>

          {/* Mensagens de erro/sucesso */}
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

          {/* Botões */}
          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={loading}
              variant="default"
              className="flex-1 font-bold"
            >
              {loading
                ? isEditMode
                  ? 'Salvando...'
                  : 'Criando...'
                : isEditMode
                ? 'Salvar Alterações'
                : 'Criar Equipe'}
            </Button>
            <Button
              type="button"
              onClick={() => navigate('/equipes')}
              variant="outline"
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EquipeFormPage;
