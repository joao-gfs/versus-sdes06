const prisma = require('../lib/prisma');

// Simple validators
const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const cnpjFormatRegex = /^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})-(\d{2})$/; // NN.NNN.NNN/NNNN-NN
const phoneRegex = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/; // (DD) 99999-9999 ou 9999-9999

class ServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

/**
 * Cadastrar organização
 * payload: { nome, cnpj, responsavel, telefone, email, endereco }
 * Regras:
 * - Nome obrigatório e único
 * - CNPJ obrigatório e no formato NN.NNN.NNN/NNNN-NN
 * - Responsável, Telefone (com DDD) e Email obrigatórios e válidos
 */
const createOrganizacao = async (payload = {}) => {
  const nome = (payload.nome || '').trim();
  const cnpj = (payload.cnpj || '').trim();
  const responsavel = (payload.responsavel || '').trim();
  const telefone = (payload.telefone || '').trim();
  const email = (payload.email || '').trim();
  const endereco = (payload.endereco || '').trim();

  if (!nome) throw new ServiceError('Nome é obrigatório');
  if (!cnpj) throw new ServiceError('CNPJ é obrigatório');
  if (!cnpjFormatRegex.test(cnpj)) throw new ServiceError('CNPJ inválido. Use o formato NN.NNN.NNN/NNNN-NN');
  if (!responsavel) throw new ServiceError('Responsável é obrigatório');
  if (!telefone || !phoneRegex.test(telefone)) throw new ServiceError('Telefone inválido. Informe DDD, ex: (11) 99999-9999');
  if (!email || !emailRegex.test(email)) throw new ServiceError('Email inválido');

  // Unicidade
  const byNome = await prisma.organizacao.findUnique({ where: { nome } });
  if (byNome) throw new ServiceError('Já existe uma organização com este nome', 409);
  const byCnpj = await prisma.organizacao.findUnique({ where: { cnpj } });
  if (byCnpj) throw new ServiceError('Já existe uma organização com este CNPJ', 409);

  const created = await prisma.organizacao.create({
    data: { nome, cnpj, responsavel, telefone, email, endereco: endereco || null, status: 'ATIVO' },
  });
  return created;
};

/**
 * Consultar organizações com filtros
 * filters: { nome?, responsavel?, status?, order? } // order: 'createdAt' para ordenar por data; padrão por nome
 */
const listOrganizacoes = async (filters = {}) => {
  const where = {};
  if (filters.nome) where.nome = { contains: String(filters.nome), mode: 'insensitive' };
  if (filters.responsavel) where.responsavel = { contains: String(filters.responsavel), mode: 'insensitive' };
  if (filters.status && ['ATIVO', 'INATIVO'].includes(String(filters.status).toUpperCase())) {
    where.status = String(filters.status).toUpperCase();
  }

  let orderBy = { nome: 'asc' };
  if (String(filters.order).toLowerCase() === 'createdat') {
    orderBy = { createdAt: 'desc' };
  }

  const list = await prisma.organizacao.findMany({ where, orderBy });
  return list;
};

/**
 * Obter organização por id
 */
const getOrganizacaoById = async (id) => {
  const org = await prisma.organizacao.findUnique({ where: { id: Number(id) } });
  return org;
};

/**
 * Editar organização (somente ADM)
 * id: number
 * payload: { nome?, responsavel?, telefone?, email?, endereco?, status? }
 * requesterRole: string - papel do usuário que está fazendo a requisição
 * Regras:
 * - Apenas ADM pode editar
 * - Nome só pode ser alterado se não houver torneios vinculados
 * - Status deve ser 'ativo' ou 'inativo'
 */
const updateOrganizacao = async (id, payload = {}, requesterRole = '') => {
  if (!requesterRole || requesterRole !== 'ADM') {
    throw new ServiceError('Apenas ADM pode editar organização', 403);
  }

  const existing = await prisma.organizacao.findUnique({ where: { id: Number(id) } });
  if (!existing) throw new ServiceError('Organização não encontrada', 404);

  const data = {};
  if (typeof payload.responsavel !== 'undefined') {
    const v = String(payload.responsavel || '').trim();
    if (!v) throw new ServiceError('Responsável não pode ser vazio');
    data.responsavel = v;
  }
  if (typeof payload.email !== 'undefined') {
    const v = String(payload.email || '').trim();
    if (!v || !emailRegex.test(v)) throw new ServiceError('Email inválido');
    data.email = v;
  }
  if (typeof payload.telefone !== 'undefined') {
    const v = String(payload.telefone || '').trim();
    if (!v || !phoneRegex.test(v)) throw new ServiceError('Telefone inválido. Informe DDD, ex: (11) 99999-9999');
    data.telefone = v;
  }
  if (typeof payload.endereco !== 'undefined') {
    const v = String(payload.endereco || '').trim();
    data.endereco = v || null;
  }
  if (typeof payload.status !== 'undefined') {
    const st = String(payload.status).toUpperCase();
    if (!['ATIVO', 'INATIVO'].includes(st)) throw new ServiceError('Status inválido. Use "ATIVO" ou "INATIVO"');
    data.status = st;
  }

  // Nome: só se não houver torneios vinculados e garantindo unicidade
  if (typeof payload.nome !== 'undefined') {
    const novoNome = String(payload.nome || '').trim();
    if (!novoNome) throw new ServiceError('Nome não pode ser vazio');
    if (novoNome !== existing.nome) {
      const torneiosCount = await prisma.torneio.count({ where: { organizacaoId: Number(id) } });
      if (torneiosCount > 0) throw new ServiceError('Não é permitido renomear organização com torneios vinculados');
      const byNome = await prisma.organizacao.findUnique({ where: { nome: novoNome } });
      if (byNome) throw new ServiceError('Já existe uma organização com este nome', 409);
      data.nome = novoNome;
    }
  }

  if (Object.keys(data).length === 0) return existing;

  const updated = await prisma.organizacao.update({ where: { id: Number(id) }, data });
  return updated;
};

/**
 * Excluir organização
 * Regras:
 * - Exclusão física apenas se NÃO houver torneios, equipes ou atletas vinculados
 * - Caso existam dependências, aplicar exclusão lógica (status = 'inativo')
 */
const deleteOrganizacao = async (id) => {
  const org = await prisma.organizacao.findUnique({ where: { id: Number(id) } });
  if (!org) throw new ServiceError('Organização não encontrada', 404);

  const [torneios, equipes, atletas] = await Promise.all([
    prisma.torneio.count({ where: { organizacaoId: Number(id) } }),
    prisma.equipe.count({ where: { organizacaoId: Number(id) } }),
    prisma.atleta.count({ where: { equipe: { organizacaoId: Number(id) } } }),
  ]);

  const hasDeps = (torneios + equipes + atletas) > 0;
  if (!hasDeps) {
    const deleted = await prisma.organizacao.delete({ where: { id: Number(id) } });
    return deleted;
  }

  if (org.status === 'INATIVO') return org;
  const updated = await prisma.organizacao.update({ where: { id: Number(id) }, data: { status: 'INATIVO' } });
  return updated;
};

module.exports = {
  createOrganizacao,
  listOrganizacoes,
  getOrganizacaoById,
  updateOrganizacao,
  deleteOrganizacao,
  ServiceError,
};
