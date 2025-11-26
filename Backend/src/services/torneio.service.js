const prisma = require('../lib/prisma');

class ServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Categorias válidas conforme RFC
const CATEGORIAS_VALIDAS = ['Sub-11', 'Sub-13', 'Sub-15', 'Sub-17', 'Sub-20', 'Adulto'];

// Formatos válidos conforme RFC
const FORMATOS_VALIDOS = ['Liga', 'Fase de grupos', 'Mata-mata', 'Grupos + Mata-mata'];

// Status válidos conforme RFC
const STATUS_VALIDOS = ['em configuração', 'publicado', 'encerrado'];

/**
 * Cadastrar torneio (RFS03.1)
 * payload: { organizacaoId, nome, edicao, categoria, formato, criteriosDesempate, capacidadeMaxima, dataInicio, dataFim }
 * Regras:
 * - Nome + Edição deve ser único por organização
 * - Organização deve existir
 * - Categoria e Formato devem ser válidos
 * - dataInicio obrigatória
 * - dataFim obrigatória e deve ser posterior à dataInicio
 */
const createTorneio = async (payload = {}) => {
  const organizacaoId = Number(payload.organizacaoId);
  const nome = (payload.nome || '').trim();
  const edicao = (payload.edicao || '').trim();
  const categoria = payload.categoria || null;
  const formato = payload.formato || null;
  const criteriosDesempate = (payload.criteriosDesempate || '').trim() || null;
  const capacidadeMaxima = payload.capacidadeMaxima ? Number(payload.capacidadeMaxima) : null;
  const dataInicio = payload.dataInicio ? new Date(payload.dataInicio) : null;
  const dataFim = payload.dataFim ? new Date(payload.dataFim) : null;

  // Validações obrigatórias
  if (!organizacaoId || !Number.isInteger(organizacaoId)) {
    throw new ServiceError('Organização é obrigatória');
  }

  if (!nome) {
    throw new ServiceError('Nome do torneio é obrigatório');
  }

  if (!edicao) {
    throw new ServiceError('Edição/Temporada é obrigatória');
  }

  // Validar formato da edição (AAAA)
  if (!/^\d{4}$/.test(edicao)) {
    throw new ServiceError('Edição deve estar no formato AAAA (ex: 2025)');
  }

  if (!categoria) {
    throw new ServiceError('Categoria é obrigatória');
  }

  if (!CATEGORIAS_VALIDAS.includes(categoria)) {
    throw new ServiceError(`Categoria inválida. Use: ${CATEGORIAS_VALIDAS.join(', ')}`);
  }

  if (!formato) {
    throw new ServiceError('Formato do torneio é obrigatório');
  }

  if (!FORMATOS_VALIDOS.includes(formato)) {
    throw new ServiceError(`Formato inválido. Use: ${FORMATOS_VALIDOS.join(', ')}`);
  }

  if (!dataInicio) {
    throw new ServiceError('Data de início é obrigatória');
  }

  if (!dataFim) {
    throw new ServiceError('Data de término é obrigatória');
  }

  // Validar datas
  if (isNaN(dataInicio.getTime())) {
    throw new ServiceError('Data de início inválida');
  }

  if (isNaN(dataFim.getTime())) {
    throw new ServiceError('Data de término inválida');
  }

  if (dataFim <= dataInicio) {
    throw new ServiceError('Data de término deve ser posterior à data de início');
  }

  // Validar capacidade máxima se fornecida
  if (capacidadeMaxima !== null && (!Number.isInteger(capacidadeMaxima) || capacidadeMaxima <= 0)) {
    throw new ServiceError('Capacidade máxima deve ser um número inteiro positivo');
  }

  // Verificar se organização existe
  const organizacao = await prisma.organizacao.findUnique({
    where: { id: organizacaoId },
  });

  if (!organizacao) {
    throw new ServiceError('Organização não encontrada', 404);
  }

  // Verificar unicidade de nome + edição por organização
  const existente = await prisma.torneio.findFirst({
    where: {
      nome,
      edicao,
      organizacaoId,
    },
  });

  if (existente) {
    throw new ServiceError('Já existe um torneio com este nome e edição para esta organização', 409);
  }

  // Criar torneio
  const created = await prisma.torneio.create({
    data: {
      organizacaoId,
      nome,
      edicao,
      categoria,
      formato,
      criteriosDesempate,
      capacidadeMaxima,
      dataInicio,
      dataFim,
      status: 'em configuração', // Status inicial padrão
    },
    include: {
      organizacao: {
        select: {
          id: true,
          nome: true,
        },
      },
    },
  });

  return created;
};

/**
 * Consultar torneios (RFS03.2)
 * filters: { organizacaoId?, nome?, categoria?, edicao?, status?, order?, requesterRole?, requesterOrgId? }
 * Regras:
 * - ADM vê todos os torneios
 * - ORG vê apenas torneios da própria organização
 * - Ordenação padrão por data de criação (decrescente), alternativa por data de início
 */
const listTorneios = async (filters = {}) => {
  const where = {};

  // Filtro de permissão baseado no papel
  if (filters.requesterRole === 'ORG' && filters.requesterOrgId) {
    where.organizacaoId = Number(filters.requesterOrgId);
  }

  // Filtros opcionais
  if (filters.organizacaoId) {
    where.organizacaoId = Number(filters.organizacaoId);
  }

  if (filters.nome) {
    where.nome = { contains: String(filters.nome), mode: 'insensitive' };
  }

  if (filters.categoria) {
    where.categoria = String(filters.categoria);
  }

  if (filters.edicao) {
    where.edicao = String(filters.edicao);
  }

  if (filters.status && STATUS_VALIDOS.includes(String(filters.status))) {
    where.status = String(filters.status);
  }

  // Ordenação
  let orderBy = { createdAt: 'desc' }; // Padrão: data de criação
  if (String(filters.order).toLowerCase() === 'datainicio') {
    orderBy = { dataInicio: 'asc' };
  }

  const list = await prisma.torneio.findMany({
    where,
    orderBy,
    include: {
      organizacao: {
        select: {
          id: true,
          nome: true,
        },
      },
      _count: {
        select: {
          equipes: true, // Conta quantas equipes estão inscritas
        },
      },
    },
  });

  return list;
};

/**
 * Obter torneio por id
 */
const getTorneioById = async (id) => {
  const torneio = await prisma.torneio.findUnique({
    where: { id: Number(id) },
    include: {
      organizacao: {
        select: {
          id: true,
          nome: true,
        },
      },
      equipes: {
        include: {
          equipe: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
      },
    },
  });

  return torneio;
};

/**
 * Editar torneio (RFS03.3)
 * id: number
 * payload: { status?, dataInicio?, dataFim?, formato?, categoria?, capacidadeMaxima?, criteriosDesempate? }
 * Regras:
 * - Apenas ORG pode editar torneios da própria organização ou ADM pode editar qualquer torneio
 * - Após o torneio ser publicado, não é permitido fazer edições
 */
const updateTorneio = async (id, payload = {}, requesterRole = '', requesterOrgId = null) => {
  const existing = await prisma.torneio.findUnique({
    where: { id: Number(id) },
  });

  if (!existing) {
    throw new ServiceError('Torneio não encontrado', 404);
  }

  // Verificar permissões
  if (requesterRole !== 'ADM') {
    if (requesterRole !== 'ORG' || existing.organizacaoId !== Number(requesterOrgId)) {
      throw new ServiceError('Você não tem permissão para editar este torneio', 403);
    }
  }

  // Regra: não pode editar torneio publicado
  if (existing.status === 'publicado' || existing.status === 'encerrado') {
    throw new ServiceError('Não é permitido editar torneios publicados ou encerrados', 403);
  }

  const data = {};

  // Status
  if (typeof payload.status !== 'undefined') {
    const st = String(payload.status);
    if (!STATUS_VALIDOS.includes(st)) {
      throw new ServiceError(`Status inválido. Use: ${STATUS_VALIDOS.join(', ')}`);
    }
    data.status = st;
  }

  // Formato
  if (typeof payload.formato !== 'undefined') {
    const f = String(payload.formato);
    if (!FORMATOS_VALIDOS.includes(f)) {
      throw new ServiceError(`Formato inválido. Use: ${FORMATOS_VALIDOS.join(', ')}`);
    }
    data.formato = f;
  }

  // Categoria
  if (typeof payload.categoria !== 'undefined') {
    const c = String(payload.categoria);
    if (!CATEGORIAS_VALIDAS.includes(c)) {
      throw new ServiceError(`Categoria inválida. Use: ${CATEGORIAS_VALIDAS.join(', ')}`);
    }
    data.categoria = c;
  }

  // Capacidade máxima
  if (typeof payload.capacidadeMaxima !== 'undefined') {
    const cap = payload.capacidadeMaxima ? Number(payload.capacidadeMaxima) : null;
    if (cap !== null && (!Number.isInteger(cap) || cap <= 0)) {
      throw new ServiceError('Capacidade máxima deve ser um número inteiro positivo');
    }
    data.capacidadeMaxima = cap;
  }

  // Critérios de desempate
  if (typeof payload.criteriosDesempate !== 'undefined') {
    data.criteriosDesempate = (payload.criteriosDesempate || '').trim() || null;
  }

  // Datas
  if (typeof payload.dataInicio !== 'undefined') {
    const dt = new Date(payload.dataInicio);
    if (isNaN(dt.getTime())) {
      throw new ServiceError('Data de início inválida');
    }
    data.dataInicio = dt;
  }

  if (typeof payload.dataFim !== 'undefined') {
    const dt = new Date(payload.dataFim);
    if (isNaN(dt.getTime())) {
      throw new ServiceError('Data de término inválida');
    }
    data.dataFim = dt;
  }

  // Validar que dataFim > dataInicio se ambas forem atualizadas
  const finalDataInicio = data.dataInicio || existing.dataInicio;
  const finalDataFim = data.dataFim || existing.dataFim;

  if (finalDataInicio && finalDataFim && finalDataFim <= finalDataInicio) {
    throw new ServiceError('Data de término deve ser posterior à data de início');
  }

  if (Object.keys(data).length === 0) {
    return existing;
  }

  const updated = await prisma.torneio.update({
    where: { id: Number(id) },
    data,
    include: {
      organizacao: {
        select: {
          id: true,
          nome: true,
        },
      },
    },
  });

  return updated;
};

/**
 * Excluir torneio (RFS03.4)
 * Regras:
 * - Só é permitido excluir torneios com status "em configuração" ou sem equipes inscritas
 * - Torneios publicados ou encerrados só podem ser inativados (exclusão lógica - mudar status para "encerrado")
 */
const deleteTorneio = async (id, requesterRole = '', requesterOrgId = null) => {
  const torneio = await prisma.torneio.findUnique({
    where: { id: Number(id) },
    include: {
      _count: {
        select: {
          equipes: true,
        },
      },
    },
  });

  if (!torneio) {
    throw new ServiceError('Torneio não encontrado', 404);
  }

  // Verificar permissões
  if (requesterRole !== 'ADM') {
    if (requesterRole !== 'ORG' || torneio.organizacaoId !== Number(requesterOrgId)) {
      throw new ServiceError('Você não tem permissão para excluir este torneio', 403);
    }
  }

  const temEquipes = torneio._count.equipes > 0;
  const statusPermiteExclusao = torneio.status === 'em configuração';

  // Se pode fazer exclusão física
  if (statusPermiteExclusao && !temEquipes) {
    const deleted = await prisma.torneio.delete({
      where: { id: Number(id) },
    });
    return { ...deleted, message: 'Torneio excluído com sucesso' };
  }

  // Se não pode excluir fisicamente mas torneio já está encerrado
  if (torneio.status === 'encerrado') {
    return { ...torneio, message: 'Torneio já está encerrado' };
  }

  // Exclusão lógica
  const updated = await prisma.torneio.update({
    where: { id: Number(id) },
    data: { status: 'encerrado' },
  });

  return { ...updated, message: 'Torneio encerrado (exclusão lógica)' };
};

/**
 * Sortear Chaveamento (RFS06.1)
 * Gera automaticamente o chaveamento conforme formato do torneio
 * Formatos suportados: Liga, Fase de grupos, Mata-mata, Grupos + Mata-mata
 */
const sortearChaveamento = async (torneioId) => {
  const id = Number(torneioId);

  const torneio = await prisma.torneio.findUnique({
    where: { id },
    include: {
      _count: {
        select: { equipes: true, partidas: true }
      }
    }
  });

  if (!torneio) {
    throw new ServiceError('Torneio não encontrado', 404);
  }

  if (torneio.status !== 'em configuração') {
    throw new ServiceError(`Não é permitido sortear chaveamento. Torneio está no status: ${torneio.status}`, 403);
  }

  // Verificar se já existe chaveamento (partidas criadas)
  if (torneio._count.partidas > 0) {
    throw new ServiceError('Já existe um chaveamento para este torneio. Use a reversão de sorteio para gerar um novo.', 409);
  }

  const equipesInscritas = await prisma.torneioEquipe.findMany({
    where: {
      torneioId: id,
      status: 'aprovada', // Apenas equipes aprovadas
    },
    select: {
      equipeId: true
    }
  });

  if (equipesInscritas.length < 2) {
    throw new ServiceError('É necessário no mínimo 2 equipes aprovadas para realizar o sorteio.', 400);
  }

  const equipeIds = equipesInscritas.map(te => te.equipeId);
  const equipesEmbaralhadas = shuffleArray([...equipeIds]);

  let partidasParaCriar = [];

  // Gerar partidas conforme formato do torneio
  switch (torneio.formato) {
    case 'Liga':
      partidasParaCriar = gerarPartidasLiga(id, equipesEmbaralhadas);
      break;

    case 'Fase de grupos':
      partidasParaCriar = gerarPartidasFaseGrupos(id, equipesEmbaralhadas);
      break;

    case 'Mata-mata':
      partidasParaCriar = gerarPartidasMataMata(id, equipesEmbaralhadas);
      break;

    case 'Grupos + Mata-mata':
      partidasParaCriar = gerarPartidasGruposMata(id, equipesEmbaralhadas);
      break;

    default:
      throw new ServiceError(`Formato de torneio não suportado: ${torneio.formato}`, 400);
  }

  // Criar partidas
  const partidasCriadas = await prisma.partida.createMany({
    data: partidasParaCriar
  });

  // Atualizar status do torneio
  const updatedTorneio = await prisma.torneio.update({
    where: { id },
    data: { status: 'publicado' }
  });

  return {
    ...updatedTorneio,
    partidasGeradas: partidasCriadas.count
  };
};

/**
 * Gerar partidas para formato Liga (todos contra todos)
 */
function gerarPartidasLiga(torneioId, equipes) {
  const partidas = [];
  let ordem = 1;

  // Round-robin: cada equipe joga contra todas as outras
  for (let i = 0; i < equipes.length; i++) {
    for (let j = i + 1; j < equipes.length; j++) {
      partidas.push({
        torneioId,
        fase: 'Turno Único',
        grupo: 'Único',
        ordemNaFase: ordem++,
        equipeAId: equipes[i],
        equipeBId: equipes[j],
      });
    }
  }

  return partidas;
}

/**
 * Gerar partidas para Fase de grupos
 * Divide equipes em grupos (A, B, C, D) e faz round-robin dentro de cada grupo
 */
function gerarPartidasFaseGrupos(torneioId, equipes) {
  const partidas = [];
  const numGrupos = Math.min(4, Math.ceil(equipes.length / 4)); // Máximo 4 grupos
  const grupos = ['A', 'B', 'C', 'D'];

  // Dividir equipes em grupos
  const equipesporGrupo = [];
  for (let i = 0; i < numGrupos; i++) {
    equipesporGrupo[i] = [];
  }

  equipes.forEach((equipeId, index) => {
    const grupoIndex = index % numGrupos;
    equipesporGrupo[grupoIndex].push(equipeId);
  });

  // Gerar partidas dentro de cada grupo (round-robin)
  equipesporGrupo.forEach((equipesGrupo, grupoIndex) => {
    const nomeGrupo = grupos[grupoIndex];
    let ordem = 1;

    for (let i = 0; i < equipesGrupo.length; i++) {
      for (let j = i + 1; j < equipesGrupo.length; j++) {
        partidas.push({
          torneioId,
          fase: 'Grupos',
          grupo: nomeGrupo,
          ordemNaFase: ordem++,
          equipeAId: equipesGrupo[i],
          equipeBId: equipesGrupo[j],
        });
      }
    }
  });

  return partidas;
}

/**
 * Gerar partidas para Mata-mata
 * Estrutura eliminatória: oitavas, quartas, semi, final
 */
function gerarPartidasMataMata(torneioId, equipes) {
  const partidas = [];
  const numEquipes = equipes.length;

  // Determinar fase inicial baseado no número de equipes
  let fase = '';
  let numPartidas = 0;

  if (numEquipes <= 2) {
    fase = 'Final';
    numPartidas = 1;
  } else if (numEquipes <= 4) {
    fase = 'Semifinal';
    numPartidas = 2;
  } else if (numEquipes <= 8) {
    fase = 'Quartas de Final';
    numPartidas = 4;
  } else {
    fase = 'Oitavas de Final';
    numPartidas = 8;
  }

  // Criar partidas da primeira fase
  for (let i = 0; i < numPartidas && i * 2 < equipes.length; i++) {
    partidas.push({
      torneioId,
      fase,
      grupo: 'Único',
      ordemNaFase: i + 1,
      equipeAId: equipes[i * 2] || null,
      equipeBId: equipes[i * 2 + 1] || null,
    });
  }

  return partidas;
}

/**
 * Gerar partidas para Grupos + Mata-mata
 * Combina fase de grupos seguida de mata-mata
 */
function gerarPartidasGruposMata(torneioId, equipes) {
  // Primeiro gera fase de grupos
  const partidasGrupos = gerarPartidasFaseGrupos(torneioId, equipes);

  // Nota: As partidas de mata-mata serão criadas após a conclusão da fase de grupos
  // Por enquanto, apenas criamos a fase de grupos
  // O sistema precisará de uma função para avançar para mata-mata após grupos

  return partidasGrupos;
}

/**
 * Reverter Sorteio (RFS06.1)
 * Deleta partidas e volta status para "em configuração"
 */
const reverterSorteio = async (torneioId, requesterRole = '', requesterOrgId = null) => {
  const id = Number(torneioId);

  const torneio = await prisma.torneio.findUnique({
    where: { id },
    include: {
      _count: {
        select: { partidas: true }
      }
    }
  });

  if (!torneio) {
    throw new ServiceError('Torneio não encontrado', 404);
  }

  // Verificar permissões
  if (requesterRole !== 'ADM') {
    if (requesterRole !== 'ORG' || torneio.organizacaoId !== Number(requesterOrgId)) {
      throw new ServiceError('Você não tem permissão para reverter o sorteio deste torneio', 403);
    }
  }

  if (torneio.status !== 'publicado') {
    throw new ServiceError('Apenas torneios publicados podem ter o sorteio revertido', 400);
  }

  // Verificar se há partidas com resultados registrados
  const partidasComResultado = await prisma.partida.count({
    where: {
      torneioId: id,
      status: 'Concluída'
    }
  });

  if (partidasComResultado > 0) {
    throw new ServiceError('Não é possível reverter o sorteio. Existem partidas com resultados registrados.', 409);
  }

  // Deletar todas as partidas do torneio
  await prisma.partida.deleteMany({
    where: { torneioId: id }
  });

  // Voltar status para "em configuração"
  const updatedTorneio = await prisma.torneio.update({
    where: { id },
    data: { status: 'em configuração' }
  });

  return updatedTorneio;
};

/**
 * Consultar Chaveamento (RFS06.2)
 * Retorna partidas agrupadas por fase e grupo com filtros
 */
const consultarChaveamento = async (torneioId, filters = {}) => {
  const id = Number(torneioId);

  const torneio = await prisma.torneio.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      formato: true,
      status: true,
    }
  });

  if (!torneio) {
    throw new ServiceError('Torneio não encontrado', 404);
  }

  const where = {
    torneioId: id,
  };

  // Filtro por equipe
  if (filters.equipe) {
    const equipeStr = String(filters.equipe);
    const equipeId = Number(equipeStr);

    if (Number.isInteger(equipeId)) {
      where.OR = [
        { equipeAId: equipeId },
        { equipeBId: equipeId },
      ];
    } else {
      where.OR = [
        { equipeA: { nome: { contains: equipeStr, mode: 'insensitive' } } },
        { equipeB: { nome: { contains: equipeStr, mode: 'insensitive' } } },
      ];
    }
  }

  // Ordenação
  let orderBy = [
    { fase: 'asc' },
    { grupo: 'asc' },
    { ordemNaFase: 'asc' },
  ];

  if (filters.ordenacao === 'grupo') {
    orderBy = [
      { grupo: 'asc' },
      { fase: 'asc' },
      { ordemNaFase: 'asc' },
    ];
  }

  const partidas = await prisma.partida.findMany({
    where,
    orderBy,
    include: {
      equipeA: { select: { id: true, nome: true } },
      equipeB: { select: { id: true, nome: true } },
      vencedor: { select: { id: true, nome: true } },
    },
  });

  // Agrupar partidas por fase e grupo
  const chaveamento = {};

  partidas.forEach(partida => {
    const chave = `${partida.fase}|${partida.grupo}`;

    if (!chaveamento[chave]) {
      chaveamento[chave] = {
        fase: partida.fase,
        grupo: partida.grupo,
        partidas: [],
        equipes: new Set(),
      };
    }

    chaveamento[chave].partidas.push({
      id: partida.id,
      equipeA: partida.equipeA,
      equipeB: partida.equipeB,
      placarA: partida.placarA,
      placarB: partida.placarB,
      vencedor: partida.vencedor,
      status: partida.status,
      dataJogo: partida.dataJogo,
    });

    // Adicionar equipes ao conjunto
    if (partida.equipeA) chaveamento[chave].equipes.add(JSON.stringify(partida.equipeA));
    if (partida.equipeB) chaveamento[chave].equipes.add(JSON.stringify(partida.equipeB));
  });

  // Converter Sets de equipes para arrays
  const resultado = Object.values(chaveamento).map(grupo => ({
    fase: grupo.fase,
    grupo: grupo.grupo,
    partidas: grupo.partidas,
    equipesNoGrupo: Array.from(grupo.equipes).map(e => JSON.parse(e)),
  }));

  return {
    torneio: {
      id: torneio.id,
      nome: torneio.nome,
      formato: torneio.formato,
      status: torneio.status,
    },
    chaveamento: resultado,
  };
};

module.exports = {
  createTorneio,
  listTorneios,
  getTorneioById,
  updateTorneio,
  deleteTorneio,
  sortearChaveamento,
  reverterSorteio,
  consultarChaveamento,
  ServiceError,
  CATEGORIAS_VALIDAS,
  FORMATOS_VALIDOS,
  STATUS_VALIDOS,
};
