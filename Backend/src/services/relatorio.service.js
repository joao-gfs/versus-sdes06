const prisma = require('../lib/prisma');

class ServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

const getSystemMetrics = async () => {
    try {
        const usuariosCount = await prisma.usuario.count();
        const organizacoesAtivasCount = await prisma.organizacao.count({
            where: { status: 'ativo' }
        });
        const torneiosCount = await prisma.torneio.count();
        const equipesCount = await prisma.equipe.count();
        const atletasCount = await prisma.atleta.count(); 
        const partidasTotalCount = await prisma.partida.count();
        const partidasConcluidasCount = await prisma.partida.count({
            where: { vencedorId: { not: null } }
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
                pendentes: partidasPendentes
            }
        };
    } catch (error) {
        console.error('Erro ao coletar métricas do sistema:', error);
        throw new ServiceError('Falha ao coletar dados do relatório.', 500); 
    }
};

const exportMetricsToCsv = async () => {
    const metrics = await getSystemMetrics(); 

    const simpleMetrics = {
        'Usuarios_Total': metrics.usuarios,
        'Organizacoes_Ativas': metrics.organizacoesAtivas,
        'Torneios_Total': metrics.torneios,
        'Equipes_Total': metrics.equipes,
        'Atletas_Total': metrics.atletas,
        'Partidas_Total': metrics.partidas.total,
        'Partidas_Concluidas': metrics.partidas.concluidas,
        'Partidas_Pendentes': metrics.partidas.pendentes,
    };

    const keys = Object.keys(simpleMetrics);
    const values = Object.values(simpleMetrics);

    const header = keys.join(';') + '\n';

    const dataRow = values.join(';');

    return header + dataRow;
};
module.exports = {
    getSystemMetrics,
    exportMetricsToCsv,
    ServiceError
};