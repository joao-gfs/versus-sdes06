const prisma = require('../lib/prisma');

class ServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
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

module.exports = {
  createTorneio,
  listTorneios,
  getTorneioById,
  updateTorneio,
  deleteTorneio,
  ServiceError,
  CATEGORIAS_VALIDAS,
  FORMATOS_VALIDOS,
  STATUS_VALIDOS,
};
