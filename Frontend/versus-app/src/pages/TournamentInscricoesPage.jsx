import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTorneioById } from '../api/torneioApi';
import { gerenciarInscricao } from '../api/equipeApi';

import { Button } from '../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';

function TournamentInscricoesPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  const [torneio, setTorneio] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const isAdm = hasRole('ADM');
  const isOrg = hasRole('ORG');

  useEffect(() => {
    // Verificar permissões
    if (!isAdm && !isOrg) {
      navigate('/');
      return;
    }

    loadTorneio();
  }, [id, isAdm, isOrg, navigate]);

  const loadTorneio = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTorneioById(id);
      setTorneio(data);
    } catch (err) {
      setError(err.message || 'Erro ao carregar torneio');
    } finally {
      setLoading(false);
    }
  };

  const handleAprovarInscricao = async (inscricaoId, equipeNome) => {
    if (!window.confirm(`Tem certeza que deseja APROVAR a inscrição da equipe "${equipeNome}"?`)) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      await gerenciarInscricao(inscricaoId, 'aprovada');
      setSuccess(`Inscrição da equipe "${equipeNome}" aprovada com sucesso!`);
      loadTorneio(); // Recarregar dados
    } catch (err) {
      setError(err.message || 'Erro ao aprovar inscrição');
    }
  };

  const handleRejeitarInscricao = async (inscricaoId, equipeNome) => {
    if (!window.confirm(`Tem certeza que deseja REJEITAR a inscrição da equipe "${equipeNome}"?`)) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      await gerenciarInscricao(inscricaoId, 'rejeitada');
      setSuccess(`Inscrição da equipe "${equipeNome}" rejeitada.`);
      loadTorneio();
    } catch (err) {
      setError(err.message || 'Erro ao rejeitar inscrição');
    }
  };

  const handleReverterStatus = async (inscricaoId, equipeNome) => {
    if (!window.confirm(`Reverter o status da inscrição da equipe "${equipeNome}" para "inscrita"?`)) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      await gerenciarInscricao(inscricaoId, 'inscrita');
      setSuccess(`Status da equipe "${equipeNome}" revertido para "inscrita".`);
      loadTorneio();
    } catch (err) {
      setError(err.message || 'Erro ao reverter status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'aprovada': return 'text-green-500 font-semibold';
      case 'rejeitada': return 'text-red-500 font-semibold';
      case 'inscrita': return 'text-yellow-500 font-semibold';
      default: return 'text-foreground';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'aprovada': return '✅ Aprovada';
      case 'rejeitada': return '❌ Rejeitada';
      case 'inscrita': return '⏳ Pendente';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!torneio) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">Torneio não encontrado</p>
      </div>
    );
  }

  const equipesInscritas = torneio.equipes || [];
  const totalInscritas = equipesInscritas.length;
  const totalAprovadas = equipesInscritas.filter(e => e.status === 'aprovada').length;
  const totalPendentes = equipesInscritas.filter(e => e.status === 'inscrita').length;
  const totalRejeitadas = equipesInscritas.filter(e => e.status === 'rejeitada').length;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <div>
          <Button
            variant="outline"
            onClick={() => navigate('/torneios')}
            className="mb-2"
          >
            ← Voltar
          </Button>
          <h1 className="text-4xl font-bold text-versus-yellow">
            Gerenciar Inscrições
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            {torneio.nome} - {torneio.edicao}
          </p>
          <p className="text-sm text-muted-foreground">
            Categoria: {torneio.categoria} | Formato: {torneio.formato}
          </p>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded-lg shadow border">
          <p className="text-sm text-muted-foreground">Total de Inscrições</p>
          <p className="text-3xl font-bold">{totalInscritas}</p>
        </div>
        <div className="bg-card p-4 rounded-lg shadow border">
          <p className="text-sm text-muted-foreground">Aprovadas</p>
          <p className="text-3xl font-bold text-green-500">{totalAprovadas}</p>
        </div>
        <div className="bg-card p-4 rounded-lg shadow border">
          <p className="text-sm text-muted-foreground">Pendentes</p>
          <p className="text-3xl font-bold text-yellow-500">{totalPendentes}</p>
        </div>
        <div className="bg-card p-4 rounded-lg shadow border">
          <p className="text-sm text-muted-foreground">Rejeitadas</p>
          <p className="text-3xl font-bold text-red-500">{totalRejeitadas}</p>
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

      {/* Aviso sobre torneio publicado */}
      {torneio.status !== 'em configuração' && (
        <div className="p-4 text-sm text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
          ⚠️ Este torneio está com status "{torneio.status}". Não é possível gerenciar inscrições de torneios publicados ou encerrados.
        </div>
      )}

      {/* Tabela de Inscrições */}
      <div className="bg-card text-card-foreground rounded-lg shadow-lg border overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-versus-yellow">
            Equipes Inscritas ({totalInscritas})
          </h2>
        </div>

        {equipesInscritas.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Nenhuma equipe inscrita neste torneio ainda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Equipe</TableHead>
                  <TableHead>Status da Inscrição</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {equipesInscritas.map((inscricao, index) => (
                  <TableRow key={inscricao.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-semibold">
                      {inscricao.equipe?.nome || 'Nome não disponível'}
                    </TableCell>
                    <TableCell className={getStatusColor(inscricao.status)}>
                      {getStatusLabel(inscricao.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {torneio.status === 'em configuração' && (
                          <>
                            {inscricao.status !== 'aprovada' && (
                              <Button
                                onClick={() => handleAprovarInscricao(inscricao.id, inscricao.equipe?.nome)}
                                variant="default"
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                              >
                                ✅ Aprovar
                              </Button>
                            )}
                            {inscricao.status !== 'rejeitada' && (
                              <Button
                                onClick={() => handleRejeitarInscricao(inscricao.id, inscricao.equipe?.nome)}
                                variant="destructive"
                                size="sm"
                              >
                                ❌ Rejeitar
                              </Button>
                            )}
                            {(inscricao.status === 'aprovada' || inscricao.status === 'rejeitada') && (
                              <Button
                                onClick={() => handleReverterStatus(inscricao.id, inscricao.equipe?.nome)}
                                variant="outline"
                                size="sm"
                              >
                                ↩️ Reverter
                              </Button>
                            )}
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

      {/* Informações adicionais */}
      <div className="bg-card p-4 rounded-lg shadow border">
        <h3 className="font-semibold text-versus-yellow mb-2">ℹ️ Informações Importantes:</h3>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>Apenas equipes com status <span className="text-green-500 font-semibold">"Aprovada"</span> participarão do sorteio de chaveamento.</li>
          <li>Inscrições só podem ser gerenciadas enquanto o torneio está "em configuração".</li>
          <li>Após sortear o chaveamento, o torneio ficará "publicado" e não será mais possível aprovar/rejeitar inscrições.</li>
          <li>Você pode reverter o status de equipes aprovadas/rejeitadas para "inscrita" se necessário.</li>
        </ul>
      </div>
    </div>
  );
}

export default TournamentInscricoesPage;

