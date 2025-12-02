const prisma = require('../lib/prisma');

// Serviço de Relatórios
// Regras:
// - Apenas ADM pode acessar as métricas de dashboard
// - Consolida dados para gráficos simples no frontend
class ServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

function getMonthKey(date) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  return `${y}-${String(m).padStart(2, '0')}`;
}

// Retorna as chaves YYYY-MM dos últimos N meses (incluindo o mês atual)
function lastNMonths(n) {
  const res = [];
  const d = new Date();
  d.setDate(1);
  for (let i = 0; i < n; i++) {
    const dt = new Date(d.getFullYear(), d.getMonth() - i, 1);
    res.push(getMonthKey(dt));
  }
  return res.reverse();
}

/**
 * Retorna métricas para dashboard (gráficos no frontend)
 * Atores: ADM
 * Métricas:
 * - Novos atletas por mês (últimos 6 meses)
 * - Torneios por mês (data de início, últimos 6 meses)
 * - Total de atletas inscritos em torneios (via equipes)
 * - Distribuição de posições (entre atletas criados nos últimos 6 meses)
 */
const getDashboardMetrics = async (requester = {}) => {
  if (!requester || String(requester.role).toUpperCase() !== 'ADM') {
    throw new ServiceError('Apenas administradores podem acessar relatórios', 403);
  }

  const months = lastNMonths(6);

  // Atletas criados nos últimos meses (janela de 6 meses)
  const fromDate = new Date();
  fromDate.setMonth(fromDate.getMonth() - 5);
  fromDate.setDate(1);

  const atletasRecentes = await prisma.atleta.findMany({
    where: { createdAt: { gte: fromDate } },
    select: { id: true, createdAt: true, posicao: true, equipeId: true },
  });

  const atletasPorMes = Object.fromEntries(months.map(m => [m, 0]));
  for (const a of atletasRecentes) {
    const key = getMonthKey(a.createdAt);
    if (key in atletasPorMes) atletasPorMes[key]++;
  }

  // Torneios por mês (considerar dataInicio)
  const torneiosRecentes = await prisma.torneio.findMany({
    where: {
      dataInicio: { gte: fromDate },
    },
    select: { id: true, dataInicio: true },
  });

  const torneiosPorMes = Object.fromEntries(months.map(m => [m, 0]));
  for (const t of torneiosRecentes) {
    if (t.dataInicio) {
      const key = getMonthKey(t.dataInicio);
      if (key in torneiosPorMes) torneiosPorMes[key]++;
    }
  }

  // Total de atletas inscritos em qualquer torneio (via vínculo equipe->torneio)
  const atletasInscritos = await prisma.atleta.count({
    where: {
      equipe: {
        torneios: { some: {} },
      },
    },
  });

  // Gráfico extra: distribuição de posições
  const posCounts = { 'Goleiro': 0, 'Zagueiro': 0, 'Meio-campo': 0, 'Atacante': 0, 'N/A': 0 };
  for (const a of atletasRecentes) {
    const p = a.posicao || 'N/A';
    if (!(p in posCounts)) posCounts['N/A']++;
    else posCounts[p]++;
  }

  // Partidas por mês (últimos 6 meses)
  const partidasRecentes = await prisma.partida.findMany({
    where: {
      dataJogo: { gte: fromDate },
    },
    select: { id: true, dataJogo: true },
  });

  const partidasPorMes = Object.fromEntries(months.map(m => [m, 0]));
  for (const p of partidasRecentes) {
    if (p.dataJogo) {
      const key = getMonthKey(p.dataJogo);
      if (key in partidasPorMes) partidasPorMes[key]++;
    }
  }

  // Ranking de participação de equipes em torneios (top 10)
  const equipesComTorneios = await prisma.equipe.findMany({
    select: {
      id: true,
      nome: true,
      torneios: {
        select: { id: true },
      },
    },
  });

  const equipesRanking = equipesComTorneios
    .map(e => ({ nome: e.nome, count: e.torneios.length }))
    .filter(e => e.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    months,
    newAthletesByMonth: months.map(m => ({ month: m, count: atletasPorMes[m] })),
    tournamentsByMonth: months.map(m => ({ month: m, count: torneiosPorMes[m] })),
    totalAthletesEnrolled: atletasInscritos,
    positionsDistribution: Object.entries(posCounts).map(([pos, count]) => ({ pos, count })),
    matchesByMonth: months.map(m => ({ month: m, count: partidasPorMes[m] })),
    teamParticipationRanking: equipesRanking,
  };
};

// Métricas de sistema (contagens gerais)
const getSystemMetrics = async () => {
  try {
    const usuariosCount = await prisma.usuario.count();
    const organizacoesAtivasCount = await prisma.organizacao.count({
      where: { status: 'ativo' },
    });
    const torneiosCount = await prisma.torneio.count();
    const equipesCount = await prisma.equipe.count();
    const atletasCount = await prisma.atleta.count();
    const partidasTotalCount = await prisma.partida.count();
    const partidasConcluidasCount = await prisma.partida.count({
      where: { vencedorId: { not: null } },
    });

    const partidasPendentes = partidasTotalCount - partidasConcluidasCount;

    return {
      usuarios: usuariosCount,
      organizacoesAtivas: organizacoesAtivasCount,
      torneios: torneiosCount,
      equipes: equipesCount,
      atletas: atletasCount,
      partidas: {
        total: partidasTotalCount,
        concluidas: partidasConcluidasCount,
        pendentes: partidasPendentes,
      },
    };
  } catch (error) {
    console.error('Erro ao coletar métricas do sistema:', error);
    throw new ServiceError('Falha ao coletar dados do relatório.', 500);
  }
};

// Exportação das métricas em CSV
const exportMetricsToCsv = async () => {
  const metrics = await getSystemMetrics();

  const simpleMetrics = {
    Usuarios_Total: metrics.usuarios,
    Organizacoes_Ativas: metrics.organizacoesAtivas,
    Torneios_Total: metrics.torneios,
    Equipes_Total: metrics.equipes,
    Atletas_Total: metrics.atletas,
    Partidas_Total: metrics.partidas.total,
    Partidas_Concluidas: metrics.partidas.concluidas,
    Partidas_Pendentes: metrics.partidas.pendentes,
  };

  const keys = Object.keys(simpleMetrics);
  const values = Object.values(simpleMetrics);

  const header = keys.join(';') + '\n';
  const dataRow = values.join(';');

  return header + dataRow;
};

module.exports = {
  getDashboardMetrics,
  getSystemMetrics,
  exportMetricsToCsv,
  ServiceError,
};