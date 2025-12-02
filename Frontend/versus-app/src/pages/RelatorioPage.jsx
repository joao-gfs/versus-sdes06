import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardMetrics } from '../api/relatorioApi';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';

function BarChart({ data = [], labelKey = 'label', valueKey = 'value', title }) {
  const max = Math.max(1, ...data.map(d => d[valueKey]));
  const height = 140;
  const width = Math.max(320, data.length * 48);
  return (
    <Card className="p-4">
      <div className="text-sm font-semibold mb-2">{title}</div>
      <svg width={width} height={height}>
        {data.map((d, i) => {
          const barH = (d[valueKey] / max) * (height - 40);
          const x = i * 48 + 20;
          const y = height - barH - 20;
          return (
            <g key={i}>
              <rect x={x} y={y} width={24} height={barH} fill="#f5d90a" rx={4} />
              <text x={x + 12} y={height - 6} textAnchor="middle" fontSize="10" fill="#9aa1a9">{d[labelKey]}</text>
              <text x={x + 12} y={y - 4} textAnchor="middle" fontSize="10" fill="#9aa1a9">{d[valueKey]}</text>
            </g>
          );
        })}
      </svg>
    </Card>
  );
}

function RelatorioPage() {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!hasRole('ADM')) {
      navigate('/');
    }
  }, [hasRole, navigate]);

  useEffect(() => {
    const load = async () => {
      setError(null);
      try {
        const m = await getDashboardMetrics();
        console.log('Métricas recebidas:', m);
        setMetrics(m);
      } catch (err) {
        setError(err.message || 'Falha ao carregar relatório');
      }
    };
    load();
  }, []);

  const monthLabel = (m) => {
    const [y, mm] = m.split('-');
    return `${mm}/${y}`;
  };

  const athletesData = (metrics?.newAthletesByMonth || []).map(x => ({ label: monthLabel(x.month), value: x.count }));
  const tournamentsData = (metrics?.tournamentsByMonth || []).map(x => ({ label: monthLabel(x.month), value: x.count }));
  const positionsData = (metrics?.positionsDistribution || []).map(x => ({ label: x.pos, value: x.count }));
  const matchesData = (metrics?.matchesByMonth || []).map(x => ({ label: monthLabel(x.month), value: x.count }));
  const teamRankingData = (metrics?.teamParticipationRanking || []).map(x => ({ label: x.nome, value: x.count }));

  console.log('matchesData:', matchesData);
  console.log('teamRankingData:', teamRankingData);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-versus-yellow">Relatórios</h1>
          <p className="text-sm text-muted-foreground mt-2">Visão geral do sistema (apenas administradores)</p>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>Atualizar</Button>
      </div>

      {error && (
        <div className="p-4 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md">{error}</div>
      )}

      {!metrics ? (
        <div className="p-8 text-center text-muted-foreground">Carregando métricas...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BarChart title="Novos atletas por mês (últimos 6)" data={athletesData} />
          <BarChart title="Torneios por mês (últimos 6)" data={tournamentsData} />
          <BarChart title="Partidas por mês (últimos 6)" data={matchesData} />
          <BarChart title="Ranking de participação em torneios (top 10)" data={teamRankingData} labelKey="label" valueKey="value" />
          <Card className="p-6">
            <div className="text-sm font-semibold mb-2">Total de atletas inscritos</div>
            <div className="text-3xl font-bold text-versus-yellow">{metrics.totalAthletesEnrolled}</div>
            <div className="text-xs text-muted-foreground mt-2">Atletas com equipes vinculadas a torneios</div>
          </Card>
          <BarChart title="Distribuição por posição (últimos 6 meses)" data={positionsData} />
        </div>
      )}
    </div>
  );
}

export default RelatorioPage;
