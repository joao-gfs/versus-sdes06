import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listOrganizacoes, deleteOrganizacao } from '../api/organizacaoApi';

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

function OrganizacoesPage() {
  const [organizacoes, setOrganizacoes] = useState([]);
  const [filteredOrganizacoes, setFilteredOrganizacoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Filtros
  const [filtroNome, setFiltroNome] = useState('');
  const [filtroResponsavel, setFiltroResponsavel] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [ordenacao, setOrdenacao] = useState('nome'); // 'nome' ou 'createdAt'

  const { hasRole } = useAuth();
  const navigate = useNavigate();

  // Verificar permissões ao carregar a página
  useEffect(() => {
    const isAllowed = hasRole('ADM');
    if (!isAllowed) {
      navigate('/');
    }
  }, [hasRole, navigate]);

  // Carregar organizações ao montar o componente
  useEffect(() => {
    loadOrganizacoes();
  }, []);

  // Aplicar filtros e ordenação quando os dados ou filtros mudarem
  useEffect(() => {
    applyFilters();
  }, [organizacoes, filtroNome, filtroResponsavel, filtroStatus, ordenacao]);

  const loadOrganizacoes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listOrganizacoes({ order: ordenacao });
      setOrganizacoes(data);
    } catch (err) {
      setError(err.message || 'Falha ao carregar organizações');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...organizacoes];

    // Filtro por nome
    if (filtroNome.trim()) {
      filtered = filtered.filter((org) =>
        org.nome.toLowerCase().includes(filtroNome.toLowerCase())
      );
    }

    // Filtro por responsável
    if (filtroResponsavel.trim()) {
      filtered = filtered.filter((org) =>
        org.responsavel.toLowerCase().includes(filtroResponsavel.toLowerCase())
      );
    }

    // Filtro por status
    if (filtroStatus) {
      filtered = filtered.filter((org) => org.status === filtroStatus);
    }

    // Ordenação
    filtered.sort((a, b) => {
      if (ordenacao === 'createdAt') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else {
        return a.nome.localeCompare(b.nome);
      }
    });

    setFilteredOrganizacoes(filtered);
  };

  const handleDelete = async (id, nome) => {
    if (!window.confirm(`Tem certeza que deseja excluir a organização "${nome}"?`)) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const result = await deleteOrganizacao(id);
      setSuccess(result.message || 'Organização excluída com sucesso');
      loadOrganizacoes(); // Recarregar lista
    } catch (err) {
      setError(err.message || 'Falha ao excluir organização');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const getStatusLabel = (status) => {
    return status === 'ATIVO' ? 'Ativo' : 'Inativo';
  };

  const getStatusColor = (status) => {
    return status === 'ATIVO' ? 'text-green-500' : 'text-red-500';
  };

  const handleLimparFiltros = () => {
    setFiltroNome('');
    setFiltroResponsavel('');
    setFiltroStatus('');
    setOrdenacao('nome');
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-versus-yellow">Organizações</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Gerencie as organizações esportivas do sistema
          </p>
        </div>
        <Button
          onClick={() => navigate('/organizacoes/nova')}
          variant="default"
          className="font-bold"
        >
          + Nova Organização
        </Button>
      </div>

        {/* Card de Filtros */}
        <div className="bg-card text-card-foreground p-6 rounded-lg shadow-lg border">
          <h3 className="text-lg font-semibold mb-4 text-versus-yellow">Filtros</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <Label htmlFor="filtroResponsavel">Responsável</Label>
              <Input
                id="filtroResponsavel"
                type="text"
                value={filtroResponsavel}
                onChange={(e) => setFiltroResponsavel(e.target.value)}
                placeholder="Buscar por responsável..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="filtroStatus">Status</Label>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger id="filtroStatus">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value=" ">Todos</SelectItem>
                  <SelectItem value="ATIVO">Ativo</SelectItem>
                  <SelectItem value="INATIVO">Inativo</SelectItem>
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
                  <SelectItem value="createdAt">Data de Criação</SelectItem>
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

        {/* Tabela de Organizações */}
        <div className="bg-card text-card-foreground rounded-lg shadow-lg border overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              Carregando organizações...
            </div>
          ) : filteredOrganizacoes.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Nenhuma organização encontrada
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data de Criação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrganizacoes.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell className="font-medium">{org.id}</TableCell>
                      <TableCell className="font-semibold">{org.nome}</TableCell>
                      <TableCell>{org.responsavel}</TableCell>
                      <TableCell>{org.email}</TableCell>
                      <TableCell>{org.telefone}</TableCell>
                      <TableCell>
                        <span className={getStatusColor(org.status)}>
                          {getStatusLabel(org.status)}
                        </span>
                      </TableCell>
                      <TableCell>{formatDate(org.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={() => navigate(`/organizacoes/editar/${org.id}`)}
                            variant="outline"
                            size="sm"
                          >
                            Editar
                          </Button>
                          <Button
                            onClick={() => handleDelete(org.id, org.nome)}
                            variant="destructive"
                            size="sm"
                          >
                            Excluir
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
          Mostrando {filteredOrganizacoes.length} de {organizacoes.length} organização(ões)
        </div>
      )}
    </div>
  );
}

export default OrganizacoesPage;

