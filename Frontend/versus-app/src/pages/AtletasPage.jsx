import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listAtletas, deleteAtleta } from '../api/atletaApi';
import { listEquipes } from '../api/equipeApi';
import { listTorneios } from '../api/torneioApi';

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

const POSICOES = ['Goleiro', 'Zagueiro', 'Meio-campo', 'Atacante'];

function AtletasPage() {
  const navigate = useNavigate();
  const { hasAnyRole, getEquipeId, hasRole } = useAuth();

  const [atletas, setAtletas] = useState([]);
  const [equipes, setEquipes] = useState([]);
  const [torneios, setTorneios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [filtroEquipeId, setFiltroEquipeId] = useState('');
  const [filtroTorneioId, setFiltroTorneioId] = useState('');
  const [filtroNome, setFiltroNome] = useState('');
  const [filtroPosicao, setFiltroPosicao] = useState('');
  const [ordenacao, setOrdenacao] = useState('nome');

  const loadData = async () => {
    setLoading(true); setError(null);
    try {
      const filters = { order: ordenacao };
      if (filtroEquipeId && filtroEquipeId !== 'ALL') filters.equipeId = filtroEquipeId;
      if (filtroTorneioId && filtroTorneioId !== 'ALL') filters.torneioId = filtroTorneioId;
      if (filtroNome) filters.nome = filtroNome;
      if (filtroPosicao && filtroPosicao !== 'ALL') filters.posicao = filtroPosicao;
      const list = await listAtletas(filters);
      setAtletas(list);
    } catch (err) {
      setError(err.message || 'Falha ao carregar atletas');
    } finally {
      setLoading(false);
    }
  };

  const loadRefs = async () => {
    try {
      const [eqs, tors] = await Promise.all([
        listEquipes(),
        listTorneios(),
      ]);
      setEquipes(eqs);
      setTorneios(tors);
    } catch (err) {
    }
  };

  useEffect(() => {
    if (!hasAnyRole(['ADM', 'ORG', 'TEC'])) {
      navigate('/');
      return;
    }
    loadRefs();
  }, [hasAnyRole, navigate]);

  useEffect(() => {
    loadData();
  }, [filtroEquipeId, filtroTorneioId, filtroNome, filtroPosicao, ordenacao]);

  useEffect(() => {
    const tecEquipeId = getEquipeId();
    if (tecEquipeId) setFiltroEquipeId(String(tecEquipeId));
  }, [getEquipeId]);

  const handleDelete = async (id, nome) => {
    if (!window.confirm(`Excluir/inativar atleta "${nome}"?`)) return;
    setError(null); setSuccess(null);
    try {
      const result = await deleteAtleta(id);
      setSuccess(result.message || 'Atleta removido');
      loadData();
    } catch (err) {
      setError(err.message || 'Falha ao excluir atleta');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-versus-yellow">Atletas</h1>
          <p className="text-sm text-muted-foreground mt-2">Gerencie os atletas cadastrados</p>
        </div>
        {hasAnyRole(['ADM', 'ORG', 'TEC', 'EMP']) && (
          <Button onClick={() => navigate('/atletas/novo')} className="font-bold">+ Novo Atleta</Button>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-card text-card-foreground p-6 rounded-lg shadow-lg border">
        <h3 className="text-lg font-semibold mb-4 text-versus-yellow">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fNome">Nome</Label>
            <Input id="fNome" value={filtroNome} onChange={e => setFiltroNome(e.target.value)} placeholder="Buscar por nome..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fPosicao">Posição</Label>
            <Select value={filtroPosicao} onValueChange={setFiltroPosicao}>
              <SelectTrigger id="fPosicao"><SelectValue placeholder="Todas" /></SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="ALL">Todas</SelectItem>
                {POSICOES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fEquipe">Equipe</Label>
            <Select value={filtroEquipeId} onValueChange={setFiltroEquipeId}>
              <SelectTrigger id="fEquipe"><SelectValue placeholder="Todas" /></SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="ALL">Todas</SelectItem>
                {equipes.map(eq => (
                  <SelectItem key={eq.id} value={String(eq.id)}>{eq.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fTorneio">Torneio</Label>
            <Select value={filtroTorneioId} onValueChange={setFiltroTorneioId}>
              <SelectTrigger id="fTorneio"><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="ALL">Todos</SelectItem>
                {torneios.map(t => (
                  <SelectItem key={t.id} value={String(t.id)}>{t.nome} - {t.edicao}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="orden">Ordenar por</Label>
            <Select value={ordenacao} onValueChange={setOrdenacao}>
              <SelectTrigger id="orden"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="nome">Nome (A-Z)</SelectItem>
                <SelectItem value="equipe">Equipe</SelectItem>
                <SelectItem value="torneio">Torneio</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-4">
          <Button variant="outline" size="sm" onClick={() => {
            setFiltroNome(''); setFiltroPosicao('ALL'); setFiltroEquipeId('ALL'); setFiltroTorneioId('ALL'); setOrdenacao('nome');
          }}>Limpar Filtros</Button>
        </div>
      </div>

      {error && <div className="p-4 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md">{error}</div>}
      {success && <div className="p-4 text-sm text-green-500 bg-green-500/10 border border-green-500/20 rounded-md">{success}</div>}

      <div className="bg-card text-card-foreground rounded-lg shadow-lg border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Carregando atletas...</div>
        ) : atletas.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">Nenhum atleta encontrado</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Equipe</TableHead>
                  <TableHead>Torneio(s)</TableHead>
                  <TableHead>Categoria(s)</TableHead>
                  <TableHead>Posição</TableHead>
                  <TableHead>Idade</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {atletas.map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.id}</TableCell>
                    <TableCell className="font-semibold">{a.nome}</TableCell>
                    <TableCell>{a.equipe}</TableCell>
                    <TableCell>{(a.torneios || []).join(', ') || '-'}</TableCell>
                    <TableCell>{(a.categorias || []).join(', ') || '-'}</TableCell>
                    <TableCell>{a.posicao || '-'}</TableCell>
                    <TableCell>{a.idade ?? '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {(hasRole('ADM') || hasRole('TEC')) && (
                          <Button variant="outline" size="sm" onClick={() => navigate(`/atletas/editar/${a.id}`)}>Editar</Button>
                        )}
                        {(hasRole('ADM') || hasRole('TEC')) && (
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(a.id, a.nome)}>Excluir</Button>
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

export default AtletasPage;
