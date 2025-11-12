import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  createOrganizacao,
  getOrganizacaoById,
  updateOrganizacao,
} from '../api/organizacaoApi';

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

function OrganizacaoFormPage() {
  const { id } = useParams(); // Se houver ID, é edição; senão, é criação
  const isEditMode = Boolean(id);

  const [nome, setNome] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [endereco, setEndereco] = useState('');
  const [status, setStatus] = useState('ATIVO');

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  const { hasRole, getPrimaryRole } = useAuth();
  const navigate = useNavigate();

  // Verificar permissões ao carregar a página
  useEffect(() => {
    const isAllowed = hasRole('ADM');
    if (!isAllowed) {
      navigate('/');
    }
  }, [hasRole, navigate]);

  // Carregar dados da organização se estiver em modo de edição
  useEffect(() => {
    if (isEditMode) {
      loadOrganizacao();
    }
  }, [id, isEditMode]);

  const loadOrganizacao = async () => {
    setLoadingData(true);
    setError(null);
    try {
      const org = await getOrganizacaoById(Number(id));
      setNome(org.nome || '');
      setCnpj(org.cnpj || '');
      setResponsavel(org.responsavel || '');
      setTelefone(org.telefone || '');
      setEmail(org.email || '');
      setEndereco(org.endereco || '');
      setStatus(org.status || 'ATIVO');
    } catch (err) {
      setError(err.message || 'Falha ao carregar organização');
    } finally {
      setLoadingData(false);
    }
  };

  // Função para formatar CNPJ enquanto digita
  const formatCNPJ = (value) => {
    // Remove tudo que não é dígito
    const numbers = value.replace(/\D/g, '');
    
    // Limita a 14 dígitos
    const limited = numbers.substring(0, 14);
    
    // Aplica a máscara NN.NNN.NNN/NNNN-NN
    let formatted = limited;
    if (limited.length > 2) {
      formatted = limited.substring(0, 2) + '.' + limited.substring(2);
    }
    if (limited.length > 5) {
      formatted = formatted.substring(0, 6) + '.' + formatted.substring(6);
    }
    if (limited.length > 8) {
      formatted = formatted.substring(0, 10) + '/' + formatted.substring(10);
    }
    if (limited.length > 12) {
      formatted = formatted.substring(0, 15) + '-' + formatted.substring(15);
    }
    
    return formatted;
  };

  const handleCNPJChange = (e) => {
    const formatted = formatCNPJ(e.target.value);
    setCnpj(formatted);
  };

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

  // Validação de CNPJ
  const validateCNPJ = (cnpj) => {
    const numbers = cnpj.replace(/\D/g, '');
    return numbers.length === 14;
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
      setError('Nome é obrigatório');
      return;
    }

    if (!cnpj.trim()) {
      setError('CNPJ é obrigatório');
      return;
    }

    if (!validateCNPJ(cnpj)) {
      setError('CNPJ inválido. Use o formato NN.NNN.NNN/NNNN-NN');
      return;
    }

    if (!responsavel.trim()) {
      setError('Responsável é obrigatório');
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

    setLoading(true);
    try {
      const organizacaoData = {
        nome: nome.trim(),
        cnpj: cnpj.trim(),
        responsavel: responsavel.trim(),
        telefone: telefone.trim(),
        email: email.trim(),
        endereco: endereco.trim() || undefined,
      };

      if (isEditMode) {
        // Modo de edição
        organizacaoData.status = status;
        await updateOrganizacao(Number(id), organizacaoData, getPrimaryRole());
        setSuccess('Organização atualizada com sucesso!');
      } else {
        // Modo de criação
        await createOrganizacao(organizacaoData);
        setSuccess('Organização criada com sucesso!');
      }

      // Redirecionar após 2 segundos
      setTimeout(() => {
        navigate('/organizacoes');
      }, 2000);
    } catch (err) {
      setError(err.message || `Falha ao ${isEditMode ? 'atualizar' : 'criar'} organização`);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-versus-background">
        <div className="text-xl text-muted-foreground">Carregando dados...</div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-versus-background p-4">
      <div className="w-full max-w-3xl p-8 space-y-6 bg-card text-card-foreground rounded-lg shadow-lg border">
        <div>
          <h2 className="text-3xl font-bold text-versus-yellow">
            {isEditMode ? 'Editar Organização' : 'Nova Organização'}
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            {isEditMode
              ? 'Atualize os dados da organização'
              : 'Preencha os dados para cadastrar uma nova organização esportiva'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="nome">Nome da Organização *</Label>
            <Input
              id="nome"
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Federação Paulista de Futebol"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Nome oficial e único da organização
            </p>
          </div>

          {/* CNPJ */}
          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ *</Label>
            <Input
              id="cnpj"
              type="text"
              required
              value={cnpj}
              onChange={handleCNPJChange}
              placeholder="00.000.000/0000-00"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              CNPJ no formato NN.NNN.NNN/NNNN-NN
            </p>
          </div>

          {/* Responsável e Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="responsavel">Responsável *</Label>
              <Input
                id="responsavel"
                type="text"
                required
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
                placeholder="Nome completo"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Nome do representante da organização
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
                placeholder="contato@organizacao.com"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Email válido do representante
              </p>
            </div>
          </div>

          {/* Telefone */}
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
              Telefone com DDD do representante
            </p>
          </div>

          {/* Endereço */}
          <div className="space-y-2">
            <Label htmlFor="endereco">Endereço / Localização</Label>
            <Input
              id="endereco"
              type="text"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              placeholder="Endereço físico da sede (opcional)"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Campo opcional - Endereço da sede da organização
            </p>
          </div>

          {/* Status - apenas em modo de edição */}
          {isEditMode && (
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={status} onValueChange={setStatus} disabled={loading}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="ATIVO">Ativo</SelectItem>
                  <SelectItem value="INATIVO">Inativo</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Status da organização no sistema
              </p>
            </div>
          )}

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
                : 'Criar Organização'}
            </Button>
            <Button
              type="button"
              onClick={() => navigate('/organizacoes')}
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

export default OrganizacaoFormPage;

