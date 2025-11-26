import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSystemMetrics, exportMetricsToCsv } from '../api/relatorioApi';

import { Button } from '../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';

function RelatoriosPage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);

  const { hasRole } = useAuth();
  const isAdm = hasRole('ADM');

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSystemMetrics();
      setMetrics(data);
    } catch (err) {
      setError(err.message || 'Falha ao carregar métricas');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = async () => {
    setExportLoading(true);
    setError(null);
    try {
      const blob = await exportMetricsToCsv();
      
      // Criar link de download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio_metricas_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      
      // Limpar
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'Falha ao exportar métricas');
    } finally {
      setExportLoading(false);
    }
  };

  // Preparar dados para a tabela
  const getTableData = () => {
    if (!metrics) return [];
    
    return [
      { label: 'Usuários', value: metrics.usuarios || 0 },
      { label: 'Organizações Ativas', value: metrics.organizacoesAtivas || 0 },
      { label: 'Torneios', value: metrics.torneios || 0 },
      { label: 'Equipes', value: metrics.equipes || 0 },
      { label: 'Atletas', value: metrics.atletas || 0 },
      { label: 'Partidas (Total)', value: metrics.partidas?.total || 0 },
      { label: 'Partidas Pendentes', value: metrics.partidas?.pendentes || 0 },
      { label: 'Partidas Concluídas', value: metrics.partidas?.concluidas || 0 },
    ];
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-versus-yellow">Relatórios</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Visualize as métricas e estatísticas do sistema
          </p>
        </div>
        <Button
          onClick={handleExportCsv}
          disabled={exportLoading || loading}
          variant="default"
          className="font-bold"
        >
          {exportLoading ? 'Exportando...' : '📊 Exportar CSV'}
        </Button>
      </div>

      {/* Mensagens de erro */}
      {error && (
        <div className="p-4 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md">
          {error}
        </div>
      )}

      {/* Card de Métricas */}
      <div className="bg-card text-card-foreground rounded-lg shadow-lg border">
        <div className="p-6">
          <h2 className="text-2xl font-semibold mb-4 text-versus-yellow">
            Métricas do Sistema
          </h2>
          
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              Carregando métricas...
            </div>
          ) : !metrics ? (
            <div className="p-8 text-center text-muted-foreground">
              Nenhuma métrica disponível.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-2/3">Métrica</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getTableData().map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.label}</TableCell>
                      <TableCell className="text-right text-2xl font-bold text-versus-yellow">
                        {item.value}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* Card de Estatísticas Resumidas */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card: Total de Usuários */}
          <div className="bg-card text-card-foreground p-6 rounded-lg shadow-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Usuários</p>
                <p className="text-3xl font-bold text-versus-yellow">
                  {metrics.usuarios || 0}
                </p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </div>

          {/* Card: Total de Torneios */}
          <div className="bg-card text-card-foreground p-6 rounded-lg shadow-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Torneios</p>
                <p className="text-3xl font-bold text-versus-yellow">
                  {metrics.torneios || 0}
                </p>
              </div>
              <div className="text-4xl">🏆</div>
            </div>
          </div>

          {/* Card: Total de Equipes */}
          <div className="bg-card text-card-foreground p-6 rounded-lg shadow-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Equipes</p>
                <p className="text-3xl font-bold text-versus-yellow">
                  {metrics.equipes || 0}
                </p>
              </div>
              <div className="text-4xl">⚽</div>
            </div>
          </div>

          {/* Card: Total de Partidas */}
          <div className="bg-card text-card-foreground p-6 rounded-lg shadow-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Partidas</p>
                <p className="text-3xl font-bold text-versus-yellow">
                  {metrics.partidas?.total || 0}
                </p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>
        </div>
      )}

      {/* Informação Adicional */}
      {isAdm && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-4">
          <p className="text-sm text-blue-500">
            ℹ️ Como administrador, você tem acesso a todas as métricas do sistema. 
            Use o botão "Exportar CSV" para baixar um relatório completo.
          </p>
        </div>
      )}
    </div>
  );
}

export default RelatoriosPage;

