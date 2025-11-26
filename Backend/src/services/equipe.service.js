const prisma = require('../lib/prisma');

// Simple validators
const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const phoneRegex = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/; // (DD) 99999-9999 ou 9999-9999

class ServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

/**
 * Cadastrar equipe (RFS04.1)
 * payload: { nome, tecnicoId, telefone, email, capacidadeMaxima, organizacaoId }
 * requester: { role, usuarioId, organizacaoId, equipeId }
 * Atores: ORG, ADM
 * Regras:
 * - Nome obrigatório e único no sistema
 * - Técnico/Responsável (usuário TEC já cadastrado)
 * - Telefone obrigatório com DDD
 * - Email obrigatório e válido
 * - Capacidade máxima de atletas (número inteiro)
 * - Status padrão: ativo
 */
const createEquipe = async (payload = {}, requester = {}) => {
  const nome = (payload.nome || '').trim();
  const tecnicoId = payload.tecnicoId ? Number(payload.tecnicoId) : null;
  const telefone = (payload.telefone || '').trim();
  const email = (payload.email || '').trim();
  const capacidadeMaxima = payload.capacidadeMaxima ? Number(payload.capacidadeMaxima) : null;
  const organizacaoId = payload.organizacaoId ? Number(payload.organizacaoId) : null;

  // Validar permissões (apenas ORG e ADM)
  if (!requester || !requester.role) {
    throw new ServiceError('Role do solicitante é obrigatório', 401);
  }
  const requesterRole = String(requester.role).toUpperCase();
  if (!['ORG', 'ADM'].includes(requesterRole)) {
    throw new ServiceError('Apenas Organizadores e Administradores podem cadastrar equipes', 403);
  }

  // Validações de campos obrigatórios
  if (!nome) throw new ServiceError('Nome da equipe é obrigatório');
  if (!tecnicoId) throw new ServiceError('Técnico/Responsável é obrigatório');
  if (!telefone || !phoneRegex.test(telefone)) {
    throw new ServiceError('Telefone inválido. Informe DDD, ex: (11) 99999-9999');
  }
  if (!email || !emailRegex.test(email)) {
    throw new ServiceError('Email inválido');
  }
  if (capacidadeMaxima && (!Number.isInteger(capacidadeMaxima) || capacidadeMaxima <= 0)) {
    throw new ServiceError('Capacidade máxima deve ser um número inteiro positivo');
  }

  // Verificar se o técnico existe e tem perfil TEC
  const tecnico = await prisma.usuario.findUnique({
    where: { id: tecnicoId },
    include: {
      perfis: true,
    },
  });

  if (!tecnico) {
    throw new ServiceError('Técnico/Responsável não encontrado', 404);
  }

  const perfilTec = tecnico.perfis.find((p) => p.papel === 'TEC');
  if (!perfilTec) {
    throw new ServiceError('Usuário informado não possui perfil de Técnico (TEC)');
  }

  // Se ORG está criando e informou uma organização, validar que a organização corresponde
  if (requesterRole === 'ORG' && organizacaoId) {
    if (!requester.organizacaoId) {
      throw new ServiceError('Organizador deve estar vinculado a uma organização');
    }
    if (organizacaoId !== requester.organizacaoId) {
      throw new ServiceError('Organizador só pode criar equipes para sua própria organização', 403);
    }
  }

  // Verificar unicidade do nome no sistema
  const nomeExistente = await prisma.equipe.findFirst({
    where: { nome },
  });
  if (nomeExistente) {
    throw new ServiceError('Já existe uma equipe com este nome', 409);
  }

  // Criar a equipe (sem organização por padrão)
  const equipe = await prisma.equipe.create({
    data: {
      nome,
      telefone,
      email,
      capacidadeMaxima,
      organizacaoId: null,
      status: 'ativo',
    },
  });

  // Vincular o técnico à equipe através de perfil_usuario
  await prisma.perfilUsuario.updateMany({
    where: {
      usuarioId: tecnicoId,
      papel: 'TEC',
    },
    data: {
      equipeId: equipe.id,
    },
  });

  return equipe;
};

/**
 * Consultar equipes (RFS04.2)
 * filters: { nome?, tecnico?, status?, order? }
 * Atores: ORG, ADM, TEC
 * Ordenação: padrão alfabética por nome, alternativa por data de criação
 */
const listEquipes = async (filters = {}, requester = {}) => {
  // Qualquer usuário autenticado pode consultar equipes
  const where = {};

  // Filtro por nome (pesquisa parcial)
  if (filters.nome) {
    where.nome = { contains: String(filters.nome), mode: 'insensitive' };
  }

  // Filtro por status
  if (filters.status && ['ativo', 'inativo'].includes(String(filters.status).toLowerCase())) {
    where.status = String(filters.status).toLowerCase();
  }

  let orderBy = { nome: 'asc' };
  if (String(filters.order).toLowerCase() === 'createdat') {
    orderBy = { createdAt: 'desc' };
  }

  const equipes = await prisma.equipe.findMany({
    where,
    orderBy,
    include: {
      perfis: {
        where: { papel: 'TEC' },
        include: {
          usuario: {
            select: { id: true, nome: true, email: true },
          },
        },
      },
      organizacao: {
        select: { id: true, nome: true },
      },
    },
  });

  // Formatar retorno
  let result = equipes.map((eq) => ({
    id: eq.id,
    nome: eq.nome,
    tecnico: eq.perfis[0]?.usuario?.nome || 'N/A',
    tecnicoId: eq.perfis[0]?.usuario?.id || null,
    status: eq.status,
    createdAt: eq.createdAt,
    telefone: eq.telefone,
    email: eq.email,
    capacidadeMaxima: eq.capacidadeMaxima,
    organizacao: eq.organizacao?.nome || 'N/A',
    organizacaoId: eq.organizacaoId,
  }));

  // Filtro por técnico (aplicado após a busca, já que é relação indireta)
  if (filters.tecnico) {
    const tecnicoFilter = String(filters.tecnico).toLowerCase();
    result = result.filter((eq) => 
      eq.tecnico.toLowerCase().includes(tecnicoFilter)
    );
  }

  return result;
};

/**
 * Obter equipe por ID
 */
const getEquipeById = async (id) => {
  const equipe = await prisma.equipe.findUnique({
    where: { id: Number(id) },
    include: {
      perfis: {
        where: { papel: 'TEC' },
        include: {
          usuario: {
            select: { id: true, nome: true, email: true },
          },
        },
      },
      organizacao: {
        select: { id: true, nome: true },
      },
      atletas: true,
    },
  });

  if (!equipe) return null;

  return {
    id: equipe.id,
    nome: equipe.nome,
    tecnico: equipe.perfis[0]?.usuario?.nome || 'N/A',
    tecnicoId: equipe.perfis[0]?.usuario?.id || null,
    status: equipe.status,
    createdAt: equipe.createdAt,
    telefone: equipe.telefone,
    email: equipe.email,
    capacidadeMaxima: equipe.capacidadeMaxima,
    organizacao: equipe.organizacao?.nome || 'N/A',
    organizacaoId: equipe.organizacaoId,
    atletas: equipe.atletas,
  };
};

/**
 * Editar equipe (RFS04.3)
 * Atores: ADM, ORG, TEC
 * Campos editáveis: nome, tecnicoId, telefone, email, capacidadeMaxima
 * Regras:
 * - Nome não pode duplicar outro nome no sistema
 */
const updateEquipe = async (id, payload = {}, requester = {}) => {
  // Validar permissões
  if (!requester || !requester.role) {
    throw new ServiceError('Role do solicitante é obrigatório', 401);
  }
  const requesterRole = String(requester.role).toUpperCase();
  if (!['ADM', 'ORG', 'TEC'].includes(requesterRole)) {
    throw new ServiceError('Apenas Administradores, Organizadores e Técnicos podem editar equipes', 403);
  }

  const equipe = await prisma.equipe.findUnique({
    where: { id: Number(id) },
    include: {
      perfis: {
        where: { papel: 'TEC' },
      },
    },
  });

  if (!equipe) {
    throw new ServiceError('Equipe não encontrada', 404);
  }

  // TEC só pode editar sua própria equipe
  if (requesterRole === 'TEC') {
    const tecnicoDaEquipe = equipe.perfis.find((p) => p.usuarioId === requester.usuarioId);
    if (!tecnicoDaEquipe) {
      throw new ServiceError('Técnico só pode editar suas próprias equipes', 403);
    }
  }

  // ORG só pode editar equipes de sua organização
  if (requesterRole === 'ORG') {
    if (!requester.organizacaoId || equipe.organizacaoId !== requester.organizacaoId) {
      throw new ServiceError('Organizador só pode editar equipes de sua organização', 403);
    }
  }

  const data = {};

  // Nome
  if (typeof payload.nome !== 'undefined') {
    const novoNome = String(payload.nome || '').trim();
    if (!novoNome) throw new ServiceError('Nome não pode ser vazio');
    if (novoNome !== equipe.nome) {
      const nomeExistente = await prisma.equipe.findFirst({
        where: { nome: novoNome, NOT: { id: Number(id) } },
      });
      if (nomeExistente) {
        throw new ServiceError('Já existe uma equipe com este nome', 409);
      }
      data.nome = novoNome;
    }
  }

  // Telefone
  if (typeof payload.telefone !== 'undefined') {
    const tel = String(payload.telefone || '').trim();
    if (!tel || !phoneRegex.test(tel)) {
      throw new ServiceError('Telefone inválido. Informe DDD, ex: (11) 99999-9999');
    }
    data.telefone = tel;
  }

  // Email
  if (typeof payload.email !== 'undefined') {
    const em = String(payload.email || '').trim();
    if (!em || !emailRegex.test(em)) {
      throw new ServiceError('Email inválido');
    }
    data.email = em;
  }

  // Capacidade máxima
  if (typeof payload.capacidadeMaxima !== 'undefined') {
    const cap = payload.capacidadeMaxima ? Number(payload.capacidadeMaxima) : null;
    if (cap && (!Number.isInteger(cap) || cap <= 0)) {
      throw new ServiceError('Capacidade máxima deve ser um número inteiro positivo');
    }
    data.capacidadeMaxima = cap;
  }

  // Técnico/Responsável
  if (typeof payload.tecnicoId !== 'undefined') {
    const novoTecnicoId = Number(payload.tecnicoId);
    if (!novoTecnicoId) {
      throw new ServiceError('Técnico/Responsável é obrigatório');
    }

    const novoTecnico = await prisma.usuario.findUnique({
      where: { id: novoTecnicoId },
      include: { perfis: true },
    });

    if (!novoTecnico) {
      throw new ServiceError('Técnico/Responsável não encontrado', 404);
    }

    const perfilTec = novoTecnico.perfis.find((p) => p.papel === 'TEC');
    if (!perfilTec) {
      throw new ServiceError('Usuário informado não possui perfil de Técnico (TEC)');
    }

    // Remover técnico anterior
    await prisma.perfilUsuario.updateMany({
      where: { equipeId: Number(id), papel: 'TEC' },
      data: { equipeId: null },
    });

    // Vincular novo técnico
    await prisma.perfilUsuario.updateMany({
      where: { usuarioId: novoTecnicoId, papel: 'TEC' },
      data: { equipeId: Number(id) },
    });
  }

  if (Object.keys(data).length === 0) {
    return equipe;
  }

  const updated = await prisma.equipe.update({
    where: { id: Number(id) },
    data,
  });

  return updated;
};

/**
 * Excluir equipe (RFS04.4)
 * Atores: ADM, TEC
 * Regras:
 * - Equipes com atletas ou inscrições em torneios só podem ser inativadas (status = inativo)
 * - Exclusão física permitida apenas se não houver dependências
 */
const deleteEquipe = async (id, requester = {}) => {
  // Validar permissões
  if (!requester || !requester.role) {
    throw new ServiceError('Role do solicitante é obrigatório', 401);
  }
  const requesterRole = String(requester.role).toUpperCase();
  if (!['ADM', 'TEC'].includes(requesterRole)) {
    throw new ServiceError('Apenas Administradores e Técnicos podem excluir equipes', 403);
  }

  const equipe = await prisma.equipe.findUnique({
    where: { id: Number(id) },
    include: {
      perfis: {
        where: { papel: 'TEC' },
      },
    },
  });

  if (!equipe) {
    throw new ServiceError('Equipe não encontrada', 404);
  }

  // TEC só pode excluir sua própria equipe
  if (requesterRole === 'TEC') {
    const tecnicoDaEquipe = equipe.perfis.find((p) => p.usuarioId === requester.usuarioId);
    if (!tecnicoDaEquipe) {
      throw new ServiceError('Técnico só pode excluir suas próprias equipes', 403);
    }
  }

  // Verificar dependências
  const atletasCount = await prisma.atleta.count({ where: { equipeId: Number(id) } });
  const torneiosCount = await prisma.torneioEquipe.count({ where: { equipeId: Number(id) } });

  if (atletasCount > 0 || torneiosCount > 0) {
    // Exclusão lógica (inativar)
    const updated = await prisma.equipe.update({
      where: { id: Number(id) },
      data: { status: 'inativo' },
    });
    return { message: 'Equipe inativada (existem atletas ou inscrições em torneios)', equipe: updated };
  }

  // Exclusão física
  // Primeiro, remover vínculos de perfil_usuario
  await prisma.perfilUsuario.updateMany({
    where: { equipeId: Number(id) },
    data: { equipeId: null },
  });

  await prisma.equipe.delete({ where: { id: Number(id) } });
  return { message: 'Equipe excluída com sucesso' };
};

/**
 * Inscrever equipe em torneio (RFS04.5)
 * payload: { torneioId, equipeId }
 * requester: { role, usuarioId, organizacaoId }
 * Atores: ADM, TEC
 * Regras:
 * - Uma equipe pode se inscrever em vários torneios
 * - Um torneio pode ter várias equipes
 * - Responsável Técnico pode inscrever apenas suas equipes nos torneios
 */
const inscreverEquipeEmTorneio = async (payload = {}, requester = {}) => {
  const torneioId = payload.torneioId ? Number(payload.torneioId) : null;
  const equipeId = payload.equipeId ? Number(payload.equipeId) : null;

  // Validar permissões
  if (!requester || !requester.role) {
    throw new ServiceError('Role do solicitante é obrigatório', 401);
  }
  const requesterRole = String(requester.role).toUpperCase();
  if (!['ADM', 'TEC'].includes(requesterRole)) {
    throw new ServiceError('Apenas Administradores e Técnicos podem inscrever equipes em torneios', 403);
  }

  if (!torneioId || !equipeId) {
    throw new ServiceError('Torneio e Equipe são obrigatórios');
  }

  // Verificar se o torneio existe
  const torneio = await prisma.torneio.findUnique({
    where: { id: torneioId },
  });
  if (!torneio) {
    throw new ServiceError('Torneio não encontrado', 404);
  }

  // Verificar se a equipe existe
  const equipe = await prisma.equipe.findUnique({
    where: { id: equipeId },
    include: {
      perfis: {
        where: { papel: 'TEC' },
      },
      atletas: true,
    },
  });
  if (!equipe) {
    throw new ServiceError('Equipe não encontrada', 404);
  }

  // TEC só pode inscrever suas próprias equipes
  if (requesterRole === 'TEC') {
    const tecnicoDaEquipe = equipe.perfis.find((p) => p.usuarioId === requester.usuarioId);
    if (!tecnicoDaEquipe) {
      throw new ServiceError('Técnico só pode inscrever suas próprias equipes', 403);
    }
  }

  // Verificar se a equipe já está inscrita no torneio
  const inscricaoExistente = await prisma.torneioEquipe.findFirst({
    where: { torneioId, equipeId },
  });
  if (inscricaoExistente) {
    throw new ServiceError('Equipe já está inscrita neste torneio', 409);
  }

  // Validar categoria do torneio com idade dos atletas
  // (Implementação simplificada - pode ser expandida)
  if (torneio.categoria) {
    // Exemplo: categoria "Sub-20" valida se todos os atletas têm menos de 20 anos
    // Esta validação pode ser mais complexa dependendo das regras de negócio
    // Por enquanto, apenas registramos a inscrição
  }

  // Criar a inscrição
  const inscricao = await prisma.torneioEquipe.create({
    data: {
      torneioId,
      equipeId,
      status: 'inscrita',
    },
  });

  return inscricao;
};

/**
 * Aprovar/Rejeitar/Gerenciar inscrição de equipe em torneio
 * inscricaoId: ID da inscrição (registro torneio_equipe)
 * novoStatus: 'aprovada' | 'rejeitada' | 'inscrita'
 * requester: { role, usuarioId, organizacaoId }
 * Atores: ADM, ORG (da organização do torneio)
 * Regras:
 * - ORG só pode gerenciar inscrições de torneios da própria organização
 * - Não pode alterar inscrições de torneios publicados ou encerrados
 */
const gerenciarInscricao = async (inscricaoId, novoStatus, requester = {}) => {
  // Validar permissões
  if (!requester || !requester.role) {
    throw new ServiceError('Role do solicitante é obrigatório', 401);
  }
  const requesterRole = String(requester.role).toUpperCase();
  if (!['ADM', 'ORG'].includes(requesterRole)) {
    throw new ServiceError('Apenas Administradores e Organizadores podem gerenciar inscrições', 403);
  }

  // Validar ID
  const id = Number(inscricaoId);
  if (!id || !Number.isInteger(id)) {
    throw new ServiceError('ID de inscrição inválido');
  }

  // Validar status
  const statusValidos = ['inscrita', 'aprovada', 'rejeitada'];
  if (!statusValidos.includes(novoStatus)) {
    throw new ServiceError(`Status inválido. Use: ${statusValidos.join(', ')}`);
  }

  // Buscar inscrição com dados do torneio e equipe
  const inscricao = await prisma.torneioEquipe.findUnique({
    where: { id },
    include: {
      torneio: {
        select: {
          id: true,
          nome: true,
          organizacaoId: true,
          status: true,
        }
      },
      equipe: {
        select: {
          id: true,
          nome: true,
        }
      }
    }
  });

  if (!inscricao) {
    throw new ServiceError('Inscrição não encontrada', 404);
  }

  // ORG só pode gerenciar inscrições de torneios da própria organização
  if (requesterRole === 'ORG') {
    if (inscricao.torneio.organizacaoId !== Number(requester.organizacaoId)) {
      throw new ServiceError('Organizador só pode gerenciar inscrições de torneios da própria organização', 403);
    }
  }

  // Não pode alterar inscrições de torneios publicados ou encerrados
  if (inscricao.torneio.status !== 'em configuração') {
    throw new ServiceError('Não é possível gerenciar inscrições de torneios publicados ou encerrados', 403);
  }

  // Atualizar status da inscrição
  const updated = await prisma.torneioEquipe.update({
    where: { id },
    data: { status: novoStatus },
    include: {
      torneio: { select: { id: true, nome: true } },
      equipe: { select: { id: true, nome: true } }
    }
  });

  return updated;
};

module.exports = {
  createEquipe,
  listEquipes,
  getEquipeById,
  updateEquipe,
  deleteEquipe,
  inscreverEquipeEmTorneio,
  gerenciarInscricao,
};
