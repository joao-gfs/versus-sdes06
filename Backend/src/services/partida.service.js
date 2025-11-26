const prisma = require('../lib/prisma');

class ServiceError extends Error {
    constructor(message, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
    }
}

/**
 * Registrar resultado de partida (RFS07.1)
 * Regras:
 * - Validar gols como inteiros >= 0
 * - Atualizar status, observações e data
 * - Apenas ADM pode editar partidas concluídas
 * - Não permitir empates em mata-mata
 */
const registrarPartida = async (partidaId, payload = {}, requesterRole = '') => {
    const id = Number(partidaId);

    if (!id || !Number.isInteger(id)) {
        throw new ServiceError('ID da Partida inválido.');
    }

    // Buscar partida com informações do torneio
    const partida = await prisma.partida.findUnique({
        where: { id },
        include: {
            torneio: {
                select: {
                    formato: true,
                    status: true,
                },
            },
        },
    });

    if (!partida) {
        throw new ServiceError('Partida não encontrada', 404);
    }

    // Verificar se torneio está publicado
    if (partida.torneio.status !== 'publicado') {
        throw new ServiceError('Só é permitido registrar resultados de partidas em torneios publicados', 403);
    }

    // Verificar se partida já está concluída e se usuário tem permissão
    if (partida.status === 'Concluída' && requesterRole !== 'ADM') {
        throw new ServiceError('Apenas administradores podem editar partidas concluídas', 403);
    }

    // Validar gols mandante
    const golsMandante = payload.golsMandante !== undefined ? Number(payload.golsMandante) : null;
    if (golsMandante === null) {
        throw new ServiceError('Gols do mandante são obrigatórios');
    }
    if (!Number.isInteger(golsMandante) || golsMandante < 0) {
        throw new ServiceError('Gols do mandante devem ser um número inteiro >= 0');
    }

    // Validar gols visitante
    const golsVisitante = payload.golsVisitante !== undefined ? Number(payload.golsVisitante) : null;
    if (golsVisitante === null) {
        throw new ServiceError('Gols do visitante são obrigatórios');
    }
    if (!Number.isInteger(golsVisitante) || golsVisitante < 0) {
        throw new ServiceError('Gols do visitante devem ser um número inteiro >= 0');
    }

    // Validar empates em mata-mata
    if ((partida.torneio.formato === 'Mata-mata' || partida.torneio.formato === 'Grupos + Mata-mata') &&
        golsMandante === golsVisitante &&
        partida.fase !== 'Grupos') {
        throw new ServiceError('Empates não são permitidos em partidas de mata-mata', 400);
    }

    // Validar status
    const statusValidos = ['Marcada', 'Concluída', 'Cancelada'];
    const status = payload.status || 'Concluída';
    if (!statusValidos.includes(status)) {
        throw new ServiceError(`Status inválido. Use: ${statusValidos.join(', ')}`);
    }

    // Validar data da partida
    let dataPartida = partida.dataJogo;
    if (payload.dataPartida) {
        dataPartida = new Date(payload.dataPartida);
        if (isNaN(dataPartida.getTime())) {
            throw new ServiceError('Data da partida inválida. Use formato DD/MM/AAAA ou AAAA-MM-DD');
        }
    }

    // Determinar vencedor
    let vencedorId = null;
    if (golsMandante > golsVisitante) {
        vencedorId = partida.equipeAId;
    } else if (golsVisitante > golsMandante) {
        vencedorId = partida.equipeBId;
    }

    // Validar que vencedor é uma das equipes participantes
    const equipesValidas = [partida.equipeAId, partida.equipeBId].filter(id => id !== null);
    if (vencedorId && !equipesValidas.includes(vencedorId)) {
        throw new ServiceError('O Vencedor ID deve ser uma das equipes participantes.', 400);
    }

    // Atualizar partida
    const updatedPartida = await prisma.partida.update({
        where: { id },
        data: {
            placarA: golsMandante,
            placarB: golsVisitante,
            vencedorId: vencedorId,
            status: status,
            observacoes: payload.observacoes || partida.observacoes,
            dataJogo: dataPartida,
        },
        include: {
            equipeA: { select: { id: true, nome: true } },
            equipeB: { select: { id: true, nome: true } },
            vencedor: { select: { id: true, nome: true } },
            torneio: { select: { id: true, nome: true } },
        },
    });

    return updatedPartida;
};

/**
 * Consultar partidas (RFS07.2)
 * Filtros: torneioId, equipe, status, dataPartida, fase
 * Controle de acesso:
 * - TEC: apenas partidas de suas equipes
 * - ORG: apenas partidas de torneios de sua organização
 * - ADM: todas as partidas
 */
const listPartidas = async (filters = {}) => {
    const where = {};

    // Filtro por torneio
    const torneioId = Number(filters.torneioId);
    if (torneioId && Number.isInteger(torneioId)) {
        where.torneioId = torneioId;
    }

    // Filtro por fase
    if (filters.fase) {
        where.fase = String(filters.fase);
    }

    // Filtro por status (usar campo status do schema)
    if (filters.status) {
        where.status = String(filters.status);
    }

    // Filtro por equipe (nome ou ID)
    if (filters.equipe) {
        const equipeStr = String(filters.equipe);
        // Tentar converter para número
        const equipeId = Number(equipeStr);

        if (Number.isInteger(equipeId)) {
            // Se for número, buscar por ID
            where.OR = [
                { equipeAId: equipeId },
                { equipeBId: equipeId },
            ];
        } else {
            // Se for texto, buscar por nome
            where.OR = [
                { equipeA: { nome: { contains: equipeStr, mode: 'insensitive' } } },
                { equipeB: { nome: { contains: equipeStr, mode: 'insensitive' } } },
            ];
        }
    }

    // Filtro por data da partida
    if (filters.dataPartida) {
        const data = new Date(filters.dataPartida);
        if (!isNaN(data.getTime())) {
            // Buscar partidas do dia inteiro
            const inicioDia = new Date(data.setHours(0, 0, 0, 0));
            const fimDia = new Date(data.setHours(23, 59, 59, 999));

            where.dataJogo = {
                gte: inicioDia,
                lte: fimDia,
            };
        }
    }

    // Controle de acesso por papel
    const requesterRole = String(filters.requesterRole || '').toUpperCase();

    // TEC: apenas partidas de suas equipes
    if (requesterRole === 'TEC' && filters.requesterEquipeId) {
        const equipeId = Number(filters.requesterEquipeId);
        if (Number.isInteger(equipeId)) {
            // Combinar com filtro OR existente se houver
            const equipeFilter = [
                { equipeAId: equipeId },
                { equipeBId: equipeId },
            ];

            if (where.OR) {
                // Se já tem OR, fazer AND com os dois
                where.AND = [
                    { OR: where.OR },
                    { OR: equipeFilter },
                ];
                delete where.OR;
            } else {
                where.OR = equipeFilter;
            }
        }
    }

    // ORG: apenas partidas de torneios de sua organização
    if (requesterRole === 'ORG' && filters.requesterOrgId) {
        const orgId = Number(filters.requesterOrgId);
        if (Number.isInteger(orgId)) {
            where.torneio = {
                organizacaoId: orgId,
            };
        }
    }

    // ADM: sem restrições adicionais

    // Ordenação
    let orderBy = [
        { fase: 'asc' },
        { ordemNaFase: 'asc' },
    ];

    if (filters.order === 'data') {
        orderBy = { dataJogo: 'asc' };
    }

    const list = await prisma.partida.findMany({
        where,
        orderBy,
        include: {
            equipeA: { select: { id: true, nome: true } },
            equipeB: { select: { id: true, nome: true } },
            vencedor: { select: { id: true, nome: true } },
            torneio: { select: { id: true, nome: true, edicao: true } },
        },
    });

    return list;
};

/**
 * Impedir criação manual de partidas
 * Partidas devem ser criadas apenas via sorteio de chaveamento
 */
const createPartida = async () => {
    throw new ServiceError('Partidas não podem ser criadas manualmente. Use o sorteio de chaveamento do torneio.', 403);
};

module.exports = {
    registrarPartida,
    listPartidas,
    createPartida,
    ServiceError,
};