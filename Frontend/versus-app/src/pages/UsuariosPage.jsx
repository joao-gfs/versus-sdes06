import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listUsers, updateUser } from '../api/userApi';

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';

function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [filteredUsuarios, setFilteredUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Filtros
  const [filtroNome, setFiltroNome] = useState('');
  // --- REMOVIDO: filtroResponsavel ---
  const [filtroStatus, setFiltroStatus] = useState('');
  // --- ALTERAÇÃO: Ordenação padrão ---
  const [ordenacao, setOrdenacao] = useState('nome'); // 'nome' ou 'email'

  // --- ALTERAÇÃO: Pega o 'user' completo para o 'requester' ---
  const { user, hasRole, getPrimaryRole, getOrganizacaoId, getEquipeId } = useAuth();
  const navigate = useNavigate();

  // Verificar permissões ao carregar a página
  useEffect(() => {
    const isAllowed = hasRole('ADM');
    if (!isAllowed) {
      navigate('/');
    }
  }, [hasRole, navigate]);

  // Carregar usuários ao montar o componente
  useEffect(() => {
    if (user) {
      loadUsuarios();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Aplicar filtros e ordenação quando os dados ou filtros mudarem
  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarios, filtroNome, filtroStatus, ordenacao]);

  const loadUsuarios = async () => {
    setLoading(true);
    setError(null);
    if (!user) {
      setError("Usuário não autenticado.");
      setLoading(false);
      return;
    }
    try {
      // --- ALTERAÇÃO: Chama listUsers com o requester.role ---
      // Isso permite ao backend saber se deve (ADM) ou não enviar os inativos
      const requester = {
        id: user.id,
        role: getPrimaryRole(),
        organizacaoId: getOrganizacaoId(),
        equipeId: getEquipeId()
      };
      const data = await listUsers({}, requester);
      setUsuarios(data);
    } catch (err) {
      setError(err.message || 'Falha ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    // --- ALTERAÇÃO: Renomeado ---
    let filtered = [...usuarios];

    // Filtro por nome
    if (filtroNome.trim()) {
      filtered = filtered.filter((u) =>
        u.nome.toLowerCase().includes(filtroNome.toLowerCase())
      );
    }

    // --- REMOVIDO: Filtro por responsável ---

    // Filtro por status
    if (filtroStatus && filtroStatus !== 'ALL') {
      filtered = filtered.filter((u) => u.status === filtroStatus);
    }

    // Ordenação
    filtered.sort((a, b) => {
      // --- ALTERAÇÃO: 'createdAt' -> 'email' ---
      if (ordenacao === 'email') {
        return a.email.localeCompare(b.email);
      } else {
        return a.nome.localeCompare(b.nome);
      }
    });

    setFilteredUsuarios(filtered);
  };

  // --- ALTERAÇÃO: 'handleDelete' -> 'handleToggleStatus' ---
  const handleToggleStatus = async (usuario) => {
    const newStatus = usuario.status === 'ativo' ? 'inativo' : 'ativo';
    const actionText = newStatus === 'ativo' ? 'Reativar' : 'Inativar';
    
    if (!window.confirm(`Tem certeza que deseja ${actionText} o usuário "${usuario.nome}"?`)) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      // --- ALTERAÇÃO: Chama updateUser para alterar o status ---
      // Passa o 'user' (do AuthContext) como o 'requester'
      const requester = {
        id: user.id,
        role: getPrimaryRole(),
        organizacaoId: getOrganizacaoId(),
        equipeId: getEquipeId()
      };
      await updateUser(usuario.id, { status: newStatus }, requester);
      setSuccess(`Usuário ${actionText} com sucesso`);
      loadUsuarios(); // Recarregar lista
    } catch (err) {
      setError(err.message || 'Falha ao alterar status do usuário');
    }
  };

  // --- REMOVIDO: formatDate (não temos createdAt) ---

  const getStatusLabel = (status) => {
    // --- ALTERAÇÃO: Valores 'ativo'/'inativo' ---
    return status === 'ativo' ? 'Ativo' : 'Inativo';
  };

  const getStatusColor = (status) => {
    // --- ALTERAÇÃO: Valores 'ativo'/'inativo' ---
    return status === 'ativo' ? 'text-green-500' : 'text-red-500';
  };

  const handleLimparFiltros = () => {
    setFiltroNome('');
    // --- REMOVIDO: filtroResponsavel ---
    setFiltroStatus('');
    setOrdenacao('nome');
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <div>
          {/* --- ALTERAÇÃO: Títulos --- */}
          <h1 className="text-4xl font-bold text-versus-yellow">Usuários</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Gerencie os usuários do sistema
          </p>
        </div>
        <Button
          // --- ALTERAÇÃO: Rota e Texto ---
          onClick={() => navigate('/criar-usuario')}
          variant="default"
          className="font-bold"
        >
          + Novo Usuário
        </Button>
      </div>

        {/* Card de Filtros */}
        <div className="bg-card text-card-foreground p-6 rounded-lg shadow-lg border">
          <h3 className="text-lg font-semibold mb-4 text-versus-yellow">Filtros</h3>
          {/* --- ALTERAÇÃO: Grid com 3 colunas --- */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filtroNome">Nome</Label>
              <Input
                id="filtroNome"
                type="text"
                value={filtroNome}
                onChange={(e) => setFiltroNome(e.target.value)}
                placeholder="Buscar por nome..."
              />
            </div>


            <div className="space-y-2">
              <Label htmlFor="filtroStatus">Status</Label>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger id="filtroStatus">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent className="bg-background">
                    {/* --- ALTERAÇÃO: value="" --- */}
                  <SelectItem value="ALL">Todos</SelectItem> 
                    {/* --- ALTERAÇÃO: valores 'ativo'/'inativo' --- */}
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ordenacao">Ordenar por</Label>
              <Select value={ordenacao} onValueChange={setOrdenacao}>
                <SelectTrigger id="ordenacao">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="nome">Nome (A-Z)</SelectItem>
                    {/* --- ALTERAÇÃO: 'createdAt' -> 'email' --- */}
                  <SelectItem value="email">Email (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4">
            <Button
              onClick={handleLimparFiltros}
              variant="outline"
              size="sm"
            >
              Limpar Filtros
            </Button>
          </div>
        </div>

        {/* Mensagens de Erro/Sucesso */}
        {error && (
          <div className="p-4 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 text-sm text-green-500 bg-green-500/10 border border-green-500/20 rounded-md">
            {success}
          </div>
        )}

        {/* Tabela de Usuários */}
        <div className="bg-card text-card-foreground rounded-lg shadow-lg border overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              {/* --- ALTERAÇÃO: Texto --- */}
              Carregando usuários...
            </div>
          ) : filteredUsuarios.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {/* --- ALTERAÇÃO: Texto --- */}
              Nenhum usuário encontrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nome</TableHead>
                    {/* --- ALTERAÇÃO: Colunas --- */}
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    {/* --- REMOVIDO: Responsável, Telefone, Data de Criação --- */}
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* --- ALTERAÇÃO: map de 'filteredUsuarios' --- */}
                  {filteredUsuarios.map((usuario) => (
                    <TableRow key={usuario.id}>
                      <TableCell className="font-medium">{usuario.id}</TableCell>
                      <TableCell className="font-semibold">{usuario.nome}</TableCell>
                        {/* --- ALTERAÇÃO: Células --- */}
                      <TableCell>{usuario.email}</TableCell>
                      <TableCell>
                        <span className={getStatusColor(usuario.status)}>
                          {getStatusLabel(usuario.status)}
                        </span>
                      </TableCell>
                        {/* --- REMOVIDO: Células --- */}
                      <TableCell className="text-right">
              		        <div className="flex justify-end gap-2">
                          <Button
                            // --- ALTERAÇÃO: Rota de Edição ---
                            onClick={() => navigate(`/usuarios/editar/${usuario.id}`)}
                            variant="outline"
                            size="sm"
                          >
                            Editar
                          </Button>
                          <Button
                            // --- ALTERAÇÃO: Ação e Lógica do Botão ---
                            onClick={() => handleToggleStatus(usuario)}
                            variant={usuario.status === 'ativo' ? 'destructive' : 'outline'}
                            size="sm"
                          >
                	              {usuario.status === 'ativo' ? 'Inativar' : 'Ativar'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

      {/* Resumo */}
      {!loading && (
        <div className="text-sm text-muted-foreground text-center">
          {/* --- ALTERAÇÃO: Texto --- */}
          Mostrando {filteredUsuarios.length} de {usuarios.length} usuário(s)
        </div>
      )}
    </div>
  );
}

// --- ALTERAÇÃO: Export ---
export default UsuariosPage;