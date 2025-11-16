const prisma = require('../lib/prisma');

// Validators
const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

class ServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

/**
 * RFS04.1 - Cadastrar Equipes
 * Atores: ORG, ADM
 * payload: { nome, responsavel, telefone, email, capacidadeMaxima, organizacaoId }
 * requester: { role, organizacaoId, equipeId }
 */
const createEquipe = async (payload, requester = {}) => {
  const { nome, responsavel, telefone, email, capacidadeMaxima, organizacaoId } = payload;

  // Validations
  if (!nome || !nome.trim()) throw new ServiceError('Nome da equipe é obrigatório');
  if (!responsavel || !responsavel.trim()) throw new ServiceError('Técnico/Responsável é obrigatório');
  if (!telefone || !telefone.trim()) throw new ServiceError('Telefone é obrigatório');
  if (!email || !emailRegex.test(email)) throw new ServiceError('E-mail inválido');

  // Business rules: nome único no sistema
  const existing = await prisma.equipe.findUnique({ where: { nome: nome.trim() } });
  if (existing) throw new ServiceError('Nome da equipe já existe no sistema', 409);

  // Authorization: only ORG and ADM can create equipes
  if (!requester.role || !['ADM', 'ORG'].includes(requester.role)) {
    throw new ServiceError('Apenas Organizadores e Administradores podem cadastrar equipes', 403);
  }

  // If ORG, must provide organizacaoId and it must match requester's org
  if (requester.role === 'ORG') {
    if (!organizacaoId) throw new ServiceError('OrganizaçãoId é obrigatório para Organizadores');
    if (organizacaoId !== requester.organizacaoId) {
      throw new ServiceError('Organizador só pode criar equipes na sua própria organização', 403);
    }
  }

  const equipe = await prisma.equipe.create({
    data: {
      nome: nome.trim(),
      responsavel: responsavel.trim(),
      telefone: telefone.trim(),
      email: email.toLowerCase().trim(),
      capacidadeMaxima: capacidadeMaxima ? Number(capacidadeMaxima) : null,
      organizacaoId: organizacaoId ? Number(organizacaoId) : null,
      status: 'ativo',
    },
  });

  return equipe;
};

/**
 * RFS04.2 - Consultar Equipes
 * Atores: ORG, ADM, TEC
 * filters: { nome, responsavel, status, orderBy }
 */
const listEquipes = async (filters = {}) => {
  const { nome, responsavel, status, orderBy } = filters;

  const where = {};
  if (nome) where.nome = { contains: nome, mode: 'insensitive' };
  if (responsavel) where.responsavel = { contains: responsavel, mode: 'insensitive' };
  if (status) where.status = status;

  const order = orderBy === 'createdAt' ? { createdAt: 'desc' } : { nome: 'asc' };

  const equipes = await prisma.equipe.findMany({
    where,
    orderBy: order,
    select: {
      id: true,
      nome: true,
      responsavel: true,
      status: true,
      createdAt: true,
    },
  });

  return equipes;
};

/**
 * RFS04.2 - Consultar uma equipe específica
 */
const getEquipe = async (id) => {
  const equipe = await prisma.equipe.findUnique({
    where: { id },
    include: {
      organizacao: { select: { id: true, nome: true } },
      atletas: { select: { id: true, nome: true, status: true } },
    },
  });

  if (!equipe) throw new ServiceError('Equipe não encontrada', 404);
  return equipe;
};

/**
 * RFS04.3 - Editar Equipes
 * Atores: ADM, ORG, TEC
 * payload: { nome, responsavel, telefone, email, capacidadeMaxima }
 * requester: { role, organizacaoId, equipeId }
 */
const updateEquipe = async (id, payload, requester = {}) => {
  const equipe = await prisma.equipe.findUnique({ where: { id } });
  if (!equipe) throw new ServiceError('Equipe não encontrada', 404);

  // Authorization
  if (!requester.role || !['ADM', 'ORG', 'TEC'].includes(requester.role)) {
    throw new ServiceError('Permissão negada', 403);
  }

  // TEC can only edit their own equipe
  if (requester.role === 'TEC' && requester.equipeId !== id) {
    throw new ServiceError('Técnico só pode editar sua própria equipe', 403);
  }

  // ORG can only edit equipes from their organizacao
  if (requester.role === 'ORG' && equipe.organizacaoId !== requester.organizacaoId) {
    throw new ServiceError('Organizador só pode editar equipes da sua organização', 403);
  }

  // Validate nome uniqueness if changing
  if (payload.nome && payload.nome.trim() !== equipe.nome) {
    const existing = await prisma.equipe.findUnique({ where: { nome: payload.nome.trim() } });
    if (existing) throw new ServiceError('Nome da equipe já existe no sistema', 409);
  }

  // Validate email if provided
  if (payload.email && !emailRegex.test(payload.email)) {
    throw new ServiceError('E-mail inválido');
  }

  const data = {};
  if (payload.nome) data.nome = payload.nome.trim();
  if (payload.responsavel) data.responsavel = payload.responsavel.trim();
  if (payload.telefone) data.telefone = payload.telefone.trim();
  if (payload.email) data.email = payload.email.toLowerCase().trim();
  if (payload.capacidadeMaxima !== undefined) data.capacidadeMaxima = payload.capacidadeMaxima ? Number(payload.capacidadeMaxima) : null;

  const updated = await prisma.equipe.update({ where: { id }, data });
  return updated;
};

/**
 * RFS04.4 - Excluir/Inativar Equipes
 * Atores: ADM, TEC
 * Business rules:
 * - Equipes com atletas ou inscrições em torneios só podem ser inativadas
 * - Exclusão física permitida apenas se não houver dependências
 */
const deleteEquipe = async (id, requester = {}) => {
  const equipe = await prisma.equipe.findUnique({
    where: { id },
    include: {
      atletas: true,
      torneios: true,
      perfis: true,
    },
  });

  if (!equipe) throw new ServiceError('Equipe não encontrada', 404);

  // Authorization: only ADM and TEC
  if (!requester.role || !['ADM', 'TEC'].includes(requester.role)) {
    throw new ServiceError('Apenas Administradores e Técnicos podem excluir equipes', 403);
  }

  // TEC can only delete their own equipe
  if (requester.role === 'TEC' && requester.equipeId !== id) {
    throw new ServiceError('Técnico só pode excluir sua própria equipe', 403);
  }

  // Check dependencies
  const hasDependencies = equipe.atletas.length > 0 || equipe.torneios.length > 0 || equipe.perfis.length > 0;

  if (hasDependencies) {
    // Can only inactivate
    const updated = await prisma.equipe.update({
      where: { id },
      data: { status: 'inativo' },
    });
    return { message: 'Equipe inativada (possui dependências)', equipe: updated };
  } else {
    // Physical deletion allowed
    await prisma.equipe.delete({ where: { id } });
    return { message: 'Equipe excluída com sucesso' };
  }
};

/**
 * RFS04.5 - Inscrição de Equipe em Torneio
 * Atores: ADM, TEC
 * payload: { equipeId, torneioId }
 * requester: { role, equipeId }
 * Business rules:
 * - Uma equipe pode se inscrever em vários torneios
 * - Um torneio pode ter várias equipes
 * - A categoria do torneio valida a idade dos atletas da equipe
 * - Responsável Técnico pode inscrever apenas suas equipes
 */
const inscreverEmTorneio = async (payload, requester = {}) => {
  const { equipeId, torneioId } = payload;

  if (!torneioId) throw new ServiceError('TorneioId é obrigatório');

  // Authorization: only ADM and TEC
  if (!requester.role || !['ADM', 'TEC'].includes(requester.role)) {
    throw new ServiceError('Apenas Administradores e Técnicos podem inscrever equipes em torneios', 403);
  }

  // TEC can only inscribe their own equipe
  if (requester.role === 'TEC' && requester.equipeId !== equipeId) {
    throw new ServiceError('Técnico só pode inscrever sua própria equipe', 403);
  }

  // Check if equipe and torneio exist
  const equipe = await prisma.equipe.findUnique({
    where: { id: equipeId },
    include: { atletas: { where: { status: 'ativo' } } },
  });
  if (!equipe) throw new ServiceError('Equipe não encontrada', 404);

  const torneio = await prisma.torneio.findUnique({ where: { id: Number(torneioId) } });
  if (!torneio) throw new ServiceError('Torneio não encontrado', 404);

  // Check if already inscribed
  const existing = await prisma.torneioEquipe.findFirst({
    where: { equipeId, torneioId: Number(torneioId) },
  });
  if (existing) throw new ServiceError('Equipe já inscrita neste torneio', 409);

  // Validate categoria/idade dos atletas (simplified: check if torneio has categoria and equipe has atletas)
  // For a real validation, you'd parse categoria (e.g., "Sub-17") and check atleta ages
  if (torneio.categoria && equipe.atletas.length > 0) {
    // Example: you could extract year from categoria and validate atletas birth dates
    // For now, we'll just log a warning or skip detailed validation
    // Implement age validation logic here if needed
  }

  // Create inscription
  const inscricao = await prisma.torneioEquipe.create({
    data: {
      equipeId,
      torneioId: Number(torneioId),
      status: 'inscrita',
    },
  });

  return inscricao;
};

module.exports = {
  createEquipe,
  listEquipes,
  getEquipe,
  updateEquipe,
  deleteEquipe,
  inscreverEmTorneio,
};
