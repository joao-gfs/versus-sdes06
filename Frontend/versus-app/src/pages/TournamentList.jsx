import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listTorneios, deleteTorneio, sortearChaveamento, reverterSorteio } from '../api/torneioApi';
import { listOrganizacoes } from '../api/organizacaoApi';

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

function TournamentList() {
  const [torneios, setTorneios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Filtros
  const [filtroNome, setFiltroNome] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('ALL');
  const [filtroEdicao, setFiltroEdicao] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('ALL');
  const [filtroOrganizacao, setFiltroOrganizacao] = useState('ALL');
  const [ordenacao, setOrdenacao] = useState('createdAt');

  // Dados auxiliares
  const [organizacoes, setOrganizacoes] = useState([]);

  const { user, hasRole } = useAuth();
  const navigate = useNavigate();

  const isAdm = hasRole('ADM');
  const isOrg = hasRole('ORG');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Recarregar quando filtros de ordenação ou organização mudarem, 
    // ou aplicar filtro localmente?
    // A API suporta filtros, então vamos chamar a API novamente ou filtrar localmente?
    // O requisito diz "Consultar Torneios... Filtros disponíveis". 
    // O ideal é chamar a API com os filtros.
    loadTorneios();
  }, [ordenacao, filtroOrganizacao, filtroStatus, filtroCategoria]); // Chamando API para esses filtros mais "pesados" ou estruturais

  // Para nome e edição, talvez debounce ou filtro local se a lista for pequena.
  // Vamos filtrar localmente o que já veio da API para simplificar, 
  // mas se a API suporta, melhor usar.
  // O `torneioApi.js` suporta todos os filtros.
  // Vamos usar um botão "Filtrar" ou useEffect com debounce para inputs de texto.
  // Por simplicidade, vou usar useEffect com debounce para texto ou apenas no botão "Buscar".
  // Vou seguir o padrão da OrganizacoesPage que parece filtrar localmente (verify).
  // OrganizacoesPage: "applyFilters" filtra localmente.
  // Mas aqui a API tem suporte. Vou tentar usar a API para ser mais eficiente, 
  // mas manter consistência com o projeto se possível.
  // O `torneioApi.js` passa os filtros para o backend.
  // Vou fazer híbrido: carregar com filtros da API.

  const loadData = async () => {
    setLoading(true);
    try {
      if (isAdm) {
        const orgs = await listOrganizacoes();
        setOrganizacoes(orgs);
      }
      await loadTorneios();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTorneios = async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = {
        order: ordenacao,
        status: filtroStatus !== 'ALL' ? filtroStatus : undefined,
        categoria: filtroCategoria !== 'ALL' ? filtroCategoria : undefined,
        organizacaoId: filtroOrganizacao !== 'ALL' ? filtroOrganizacao : undefined,
        nome: filtroNome || undefined,
        edicao: filtroEdicao || undefined,
      };

      // Passar role e orgId para a API client lidar com headers se necessário
      // Mas o `torneioApi.js` pede role e orgId como argumentos separados
      const role = user?.role || '';
      const orgId = user?.organizacaoId || null;

      const data = await listTorneios(filters, role, orgId);
      setTorneios(data);
    } catch (err) {
      setError(err.message || 'Falha ao carregar torneios');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadTorneios();
  };

  const handleDelete = async (id, nome) => {
    if (!window.confirm(`Tem certeza que deseja excluir o torneio "${nome}"?`)) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const role = user?.role || '';
      const orgId = user?.organizacaoId || null;

      const result = await deleteTorneio(id, role, orgId);
      setSuccess(result.message || 'Torneio excluído com sucesso');
      loadTorneios();
    } catch (err) {
      setError(err.message || 'Falha ao excluir torneio');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'em configuração': return 'text-yellow-500';
      case 'publicado': return 'text-green-500';
      case 'encerrado': return 'text-gray-500';
      default: return 'text-foreground';
    }
  };

  const handleLimparFiltros = () => {
    setFiltroNome('');
    setFiltroCategoria('ALL');
    setFiltroEdicao('');
    setFiltroStatus('ALL');
    setFiltroOrganizacao('ALL');
    setOrdenacao('createdAt');
    // O useEffect vai disparar o reload
  };

  const handleSortearChaveamento = async (id, nome) => {
    if (!window.confirm(`Tem certeza que deseja sortear o chaveamento do torneio "${nome}"?`)) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const role = user?.role || '';
      const orgId = user?.organizacaoId || null;

      const result = await sortearChaveamento(id, role, orgId);
      setSuccess(result.message || 'Chaveamento sorteado com sucesso');
      loadTorneios();
    } catch (err) {
      setError(err.message || 'Falha ao sortear chaveamento');
    }
  };

  const handleReverterSorteio = async (id, nome) => {
    if (!window.confirm(`Tem certeza que deseja reverter o sorteio do torneio "${nome}"?`)) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const role = user?.role || '';
      const orgId = user?.organizacaoId || null;

      const result = await reverterSorteio(id, role, orgId);
      setSuccess(result.message || 'Sorteio revertido com sucesso');
      loadTorneios();
    } catch (err) {
      setError(err.message || 'Falha ao reverter sorteio');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-versus-yellow">Torneios</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Gerencie os torneios e suas edições
          </p>
        </div>
        {(isAdm || isOrg) && (
          <Button
            onClick={() => navigate('/torneios/novo')}
            variant="default"
            className="font-bold"
          >
            + Novo Torneio
          </Button>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-card text-card-foreground p-6 rounded-lg shadow-lg border">
        <h3 className="text-lg font-semibold mb-4 text-versus-yellow">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">

          {/* Filtro Organização (Apenas ADM) */}
          {isAdm && (
            <div className="space-y-2">
              <Label htmlFor="filtroOrg">Organização</Label>
              <Select value={filtroOrganizacao} onValueChange={setFiltroOrganizacao}>
                <SelectTrigger id="filtroOrg">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="ALL">Todas</SelectItem>
                  {organizacoes.map(org => (
                    <SelectItem key={org.id} value={String(org.id)}>{org.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="filtroNome">Nome</Label>
            <Input
              id="filtroNome"
              value={filtroNome}
              onChange={(e) => setFiltroNome(e.target.value)}
              placeholder="Nome do torneio..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="filtroEdicao">Edição (Ano)</Label>
            <Input
              id="filtroEdicao"
              value={filtroEdicao}
              onChange={(e) => setFiltroEdicao(e.target.value)}
              placeholder="Ex: 2025"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="filtroCategoria">Categoria</Label>
            <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
              <SelectTrigger id="filtroCategoria">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="ALL">Todas</SelectItem>
                <SelectItem value="Sub-11">Sub-11</SelectItem>
                <SelectItem value="Sub-13">Sub-13</SelectItem>
                <SelectItem value="Sub-15">Sub-15</SelectItem>
                <SelectItem value="Sub-17">Sub-17</SelectItem>
                <SelectItem value="Sub-20">Sub-20</SelectItem>
                <SelectItem value="Adulto">Adulto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="filtroStatus">Status</Label>
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger id="filtroStatus">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="em configuração">Em Configuração</SelectItem>
                <SelectItem value="publicado">Publicado</SelectItem>
                <SelectItem value="encerrado">Encerrado</SelectItem>
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
                <SelectItem value="createdAt">Criação (Recente)</SelectItem>
                <SelectItem value="dataInicio">Data de Início</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end gap-2">
            <Button onClick={handleSearch} variant="secondary" className="w-full">
              Buscar
            </Button>
            <Button onClick={handleLimparFiltros} variant="outline" className="w-full">
              Limpar
            </Button>
          </div>
        </div>
      </div>

      {/* Mensagens */}
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

      {/* Tabela */}
      <div className="bg-card text-card-foreground rounded-lg shadow-lg border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Carregando torneios...</div>
        ) : torneios.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">Nenhum torneio encontrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Edição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Formato</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Fim</TableHead>
                  <TableHead>Equipes</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {torneios.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-semibold">{t.nome}</TableCell>
                    <TableCell>{t.edicao}</TableCell>
                    <TableCell>{t.categoria}</TableCell>
                    <TableCell>{t.formato}</TableCell>
                    <TableCell className={getStatusColor(t.status)}>{t.status}</TableCell>
                    <TableCell>{formatDate(t.dataInicio)}</TableCell>
                    <TableCell>{formatDate(t.dataFim)}</TableCell>
                    <TableCell>{t._count?.equipes || 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2 flex-wrap">
                        {/* Botão Gerenciar Inscrições - apenas para torneios em configuração */}
                        {t.status === 'em configuração' && (isAdm || isOrg) && (
                          <Button
                            onClick={() => navigate(`/torneios/${t.id}/inscricoes`)}
                            variant="secondary"
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            📋 Inscrições ({t._count?.equipes || 0})
                          </Button>
                        )}

                        {/* Botão Sortear Chaveamento - apenas para torneios em configuração */}
                        {t.status === 'em configuração' && (isAdm || isOrg) && (
                          <Button
                            onClick={() => handleSortearChaveamento(t.id, t.nome)}
                            variant="default"
                            size="sm"
                          >
                            Sortear Chaveamento
                          </Button>
                        )}

                        {/* Botão Ver Chaveamento - para torneios publicados ou encerrados */}
                        {(t.status === 'publicado' || t.status === 'encerrado') && (
                          <Button
                            onClick={() => navigate(`/torneios/${t.id}/chaveamento`)}
                            variant="secondary"
                            size="sm"
                          >
                            Ver Chaveamento
                          </Button>
                        )}

                        {/* Botão Reverter Sorteio - apenas para torneios publicados */}
                        {t.status === 'publicado' && (isAdm || isOrg) && (
                          <Button
                            onClick={() => handleReverterSorteio(t.id, t.nome)}
                            variant="outline"
                            size="sm"
                          >
                            Reverter Sorteio
                          </Button>
                        )}

                        {(isAdm || isOrg) && (
                          <>
                            <Button
                              onClick={() => navigate(`/torneios/editar/${t.id}`)}
                              variant="outline"
                              size="sm"
                              disabled={t.status === 'encerrado' && !isAdm}
                            >
                              Editar
                            </Button>
                            <Button
                              onClick={() => handleDelete(t.id, t.nome)}
                              variant="destructive"
                              size="sm"
                            >
                              Excluir
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

export default TournamentList;
