import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listEquipes, deleteEquipe } from '../api/equipeApi';
import { listTorneios } from '../api/torneioApi';
import { inscreverEquipeEmTorneio } from '../api/equipeApi';

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

function EquipesPage() {
  const [equipes, setEquipes] = useState([]);
  const [filteredEquipes, setFilteredEquipes] = useState([]);
  const [torneios, setTorneios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Filtros
  const [filtroNome, setFiltroNome] = useState('');
  const [filtroTecnico, setFiltroTecnico] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [ordenacao, setOrdenacao] = useState('nome'); // 'nome' ou 'createdAt'

  // Modal de inscrição em torneio
  const [showInscricaoModal, setShowInscricaoModal] = useState(false);
  const [selectedEquipe, setSelectedEquipe] = useState(null);
  const [selectedTorneio, setSelectedTorneio] = useState('');

  const { hasRole } = useAuth();
  const navigate = useNavigate();

  // Verificar permissões ao carregar a página
  useEffect(() => {
    const isAllowed = hasRole('ADM') || hasRole('ORG') || hasRole('TEC');
    if (!isAllowed) {
      navigate('/');
    }
  }, [hasRole, navigate]);

  const loadEquipes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listEquipes({ order: ordenacao });
      setEquipes(data);
    } catch (err) {
      setError(err.message || 'Falha ao carregar equipes');
    } finally {
      setLoading(false);
    }
  };

  const loadTorneios = async () => {
    try {
      const data = await listTorneios();
      setTorneios(data);
    } catch (err) {
      console.error('Falha ao carregar torneios:', err);
    }
  };

  // Carregar equipes ao montar o componente
  useEffect(() => {
    loadEquipes();
    loadTorneios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Aplicar filtros e ordenação quando os dados ou filtros mudarem
  useEffect(() => {
    let filtered = [...equipes];

    // Filtro por nome
    if (filtroNome.trim()) {
      filtered = filtered.filter((eq) =>
        eq.nome.toLowerCase().includes(filtroNome.toLowerCase())
      );
    }

    // Filtro por técnico
    if (filtroTecnico.trim()) {
      filtered = filtered.filter((eq) =>
        eq.tecnico.toLowerCase().includes(filtroTecnico.toLowerCase())
      );
    }

    // Filtro por status
    if (filtroStatus && filtroStatus !== 'ALL') {
      filtered = filtered.filter((eq) => eq.status === filtroStatus);
    }

    // Ordenação
    filtered.sort((a, b) => {
      if (ordenacao === 'createdAt') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else {
        return a.nome.localeCompare(b.nome);
      }
    });

    setFilteredEquipes(filtered);
  }, [equipes, filtroNome, filtroTecnico, filtroStatus, ordenacao]);

  const handleDelete = async (id, nome) => {
    if (!window.confirm(`Tem certeza que deseja excluir a equipe "${nome}"?`)) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const result = await deleteEquipe(id);
      setSuccess(result.message || 'Equipe excluída com sucesso');
      loadEquipes(); // Recarregar lista
    } catch (err) {
      setError(err.message || 'Falha ao excluir equipe');
    }
  };

  const handleInscreverClick = (equipe) => {
    setSelectedEquipe(equipe);
    setSelectedTorneio('');
    setShowInscricaoModal(true);
  };

  const handleInscreverSubmit = async () => {
    if (!selectedTorneio) {
      setError('Selecione um torneio');
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      await inscreverEquipeEmTorneio(Number(selectedTorneio), selectedEquipe.id);
      setSuccess(`Equipe "${selectedEquipe.nome}" inscrita no torneio com sucesso`);
      setShowInscricaoModal(false);
      setSelectedEquipe(null);
      setSelectedTorneio('');
    } catch (err) {
      setError(err.message || 'Falha ao inscrever equipe no torneio');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const getStatusLabel = (status) => {
    return status === 'ativo' ? 'Ativo' : 'Inativo';
  };

  const getStatusColor = (status) => {
    return status === 'ativo' ? 'text-green-500' : 'text-red-500';
  };

  const handleLimparFiltros = () => {
    setFiltroNome('');
    setFiltroTecnico('');
    setFiltroStatus('');
    setOrdenacao('nome');
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-versus-yellow">Equipes</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Gerencie as equipes esportivas do sistema
          </p>
        </div>
        {(hasRole('ADM') || hasRole('ORG')) && (
          <Button
            onClick={() => navigate('/equipes/nova')}
            variant="default"
            className="font-bold"
          >
            + Nova Equipe
          </Button>
        )}
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
            <Label htmlFor="filtroTecnico">Técnico</Label>
            <Input
              id="filtroTecnico"
              type="text"
              value={filtroTecnico}
              onChange={(e) => setFiltroTecnico(e.target.value)}
              placeholder="Buscar por técnico..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="filtroStatus">Status</Label>
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger id="filtroStatus">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="ALL">Todos</SelectItem>
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

      {/* Tabela de Equipes */}
      <div className="bg-card text-card-foreground rounded-lg shadow-lg border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">
            Carregando equipes...
          </div>
        ) : filteredEquipes.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Nenhuma equipe encontrada
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Técnico</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEquipes.map((eq) => (
                  <TableRow key={eq.id}>
                    <TableCell className="font-medium">{eq.id}</TableCell>
                    <TableCell className="font-semibold">{eq.nome}</TableCell>
                    <TableCell>{eq.tecnico}</TableCell>
                    <TableCell>{eq.email}</TableCell>
                    <TableCell>{eq.telefone}</TableCell>
                    <TableCell>
                      <span className={getStatusColor(eq.status)}>
                        {getStatusLabel(eq.status)}
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(eq.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {(hasRole('ADM') || hasRole('ORG') || hasRole('TEC')) && (
                          <Button
                            onClick={() => navigate(`/equipes/editar/${eq.id}`)}
                            variant="outline"
                            size="sm"
                          >
                            Editar
                          </Button>
                        )}
                        {(hasRole('ADM') || hasRole('TEC')) && (
                          <>
                            <Button
                              onClick={() => handleDelete(eq.id, eq.nome)}
                              variant="destructive"
                              size="sm"
                            >
                              Excluir
                            </Button>
                            <Button
                              onClick={() => handleInscreverClick(eq)}
                              variant="default"
                              size="sm"
                            >
                              Inscrever em Torneio
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

      {/* Resumo */}
      {!loading && (
        <div className="text-sm text-muted-foreground text-center">
          Mostrando {filteredEquipes.length} de {equipes.length} equipe(s)
        </div>
      )}

      {/* Modal de Inscrição em Torneio */}
      {showInscricaoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-versus-yellow">
              Inscrever Equipe em Torneio
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Equipe: <span className="font-semibold">{selectedEquipe?.nome}</span>
            </p>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="torneio">Selecione o Torneio</Label>
                <Select value={selectedTorneio} onValueChange={setSelectedTorneio}>
                  <SelectTrigger id="torneio">
                    <SelectValue placeholder="Escolha um torneio" />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    {torneios.map((torneio) => (
                      <SelectItem key={torneio.id} value={String(torneio.id)}>
                        {torneio.nome} - {torneio.edicao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 justify-end mt-6">
                <Button
                  onClick={() => {
                    setShowInscricaoModal(false);
                    setSelectedEquipe(null);
                    setSelectedTorneio('');
                  }}
                  variant="outline"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleInscreverSubmit}
                  variant="default"
                >
                  Inscrever
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EquipesPage;
