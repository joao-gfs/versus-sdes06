const prisma = require('../lib/prisma');

class ServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Posições válidas
const POSICOES_VALIDAS = ['Goleiro', 'Zagueiro', 'Meio-campo', 'Atacante'];

// Mapeamento simplificado de categorias -> idade máxima (inclusive)
// Adulto: sem limite superior (>= 18 é aceito). Regras podem ser refinadas futuramente.
const CATEGORIA_MAX_IDADE = {
  'Sub-11': 11,
  'Sub-13': 13,
  'Sub-15': 15,
  'Sub-17': 17,
  'Sub-20': 20,
  'Adulto': 99, // usar 99 como "sem limite" prático
};

// Regex CPF simples (somente dígitos) + validação de dígitos verificadores
const cpfDigitsRegex = /^\d{11}$/;

function validarCPF(cpfRaw) {
  const cpf = (cpfRaw || '').replace(/\D/g, '');
  if (!cpfDigitsRegex.test(cpf)) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false; // todos iguais
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(cpf.charAt(i), 10) * (10 - i);
  let dig1 = 11 - (soma % 11);
  if (dig1 >= 10) dig1 = 0;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(cpf.charAt(i), 10) * (11 - i);
  let dig2 = 11 - (soma % 11);
  if (dig2 >= 10) dig2 = 0;
  return dig1 === parseInt(cpf.charAt(9), 10) && dig2 === parseInt(cpf.charAt(10), 10);
}

function parseDataNascimento(str) {
  // Espera formato DD/MM/AAAA
  if (!str || typeof str !== 'string') return null;
  const parts = str.split('/');
  if (parts.length !== 3) return null;
  const [dd, mm, yyyy] = parts.map(p => p.trim());
  if (!/^\d{2}$/.test(dd) || !/^\d{2}$/.test(mm) || !/^\d{4}$/.test(yyyy)) return null;
  const day = Number(dd);
  const month = Number(mm) - 1; // Date usa 0-11
  const year = Number(yyyy);
  const d = new Date(year, month, day);
  if (isNaN(d.getTime()) || d.getDate() !== day || d.getMonth() !== month || d.getFullYear() !== year) return null;
  return d;
}

function calcularIdade(dataNascimento) {
  const hoje = new Date();
  let idade = hoje.getFullYear() - dataNascimento.getFullYear();
  const m = hoje.getMonth() - dataNascimento.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < dataNascimento.getDate())) {
    idade--;
  }
  return idade;
}

async function validarIdadeVsCategorias(equipeId, dataNascimento) {
  // Carrega torneios inscritos da equipe com categoria
  const equipe = await prisma.equipe.findUnique({
    where: { id: Number(equipeId) },
    include: {
      torneios: {
        include: {
          torneio: true,
        },
      },
    },
  });
  if (!equipe) throw new ServiceError('Equipe não encontrada', 404);
  const idade = calcularIdade(dataNascimento);
  // Validar contra cada categoria existente dos torneios inscritos publicados ou em configuração
  for (const te of equipe.torneios) {
    const categoria = te.torneio.categoria; // pode ser null
    if (!categoria) continue;
    const maxIdade = CATEGORIA_MAX_IDADE[categoria];
    if (typeof maxIdade === 'number') {
      if (categoria === 'Adulto') {
        // Para Adulto exigir pelo menos 18 anos (regra comum). Pode ser ajustado.
        if (idade < 18) {
          throw new ServiceError('Atleta não atende idade mínima para categoria Adulto');
        }
      } else if (idade > maxIdade) {
        throw new ServiceError(`Idade do atleta (${idade}) excede limite da categoria ${categoria}`);
      }
    }
  }
  return true;
}

/**
 * Cadastrar atleta
 * payload: { equipeId, nome, dataNascimento (DD/MM/AAAA), documento (CPF), posicao, numeroCamisa, telefone }
 * Regras:
 * - Equipe obrigatória e existente
 * - Nome obrigatório
 * - Data nascimento obrigatória (DD/MM/AAAA)
 * - CPF obrigatório, válido e único
 * - Posição deve ser uma das POSICOES_VALIDAS
 * - Número camisa inteiro 1..99
 * - Idade deve respeitar categorias dos torneios em que a equipe está inscrita
 */
const createAtleta = async (payload = {}, requester = {}) => {
  const equipeId = payload.equipeId ? Number(payload.equipeId) : null;
    // Permissões: ORG, TEC, EMP, ADM
    if (!requester || !requester.role) {
      throw new ServiceError('Role do solicitante é obrigatório', 401);
    }
    const requesterRole = String(requester.role).toUpperCase();
    if (!['ORG', 'TEC', 'EMP', 'ADM'].includes(requesterRole)) {
      throw new ServiceError('Acesso negado para cadastro de atleta', 403);
    }
  const nome = (payload.nome || '').trim();
  const dataNascimentoStr = payload.dataNascimento || '';
  const documentoRaw = (payload.documento || '').replace(/\D/g, '');
  const posicao = payload.posicao || null;
  const numeroCamisa = payload.numeroCamisa ? Number(payload.numeroCamisa) : null;
    // telefone não está no schema atual

  if (!equipeId) throw new ServiceError('Equipe é obrigatória');
  if (!nome) throw new ServiceError('Nome completo é obrigatório');
  const dataNascimento = parseDataNascimento(dataNascimentoStr);
  if (!dataNascimento) throw new ServiceError('Data de nascimento inválida. Use DD/MM/AAAA');
  if (!documentoRaw) throw new ServiceError('CPF é obrigatório');
  if (!validarCPF(documentoRaw)) throw new ServiceError('CPF inválido');
  if (posicao && !POSICOES_VALIDAS.includes(posicao)) {
    throw new ServiceError(`Posição inválida. Use: ${POSICOES_VALIDAS.join(', ')}`);
  }
  if (numeroCamisa !== null) {
    if (!Number.isInteger(numeroCamisa) || numeroCamisa < 1 || numeroCamisa > 99) {
      throw new ServiceError('Número da camisa deve ser um inteiro entre 1 e 99');
    }
  }

  // Equipe existente
  const equipe = await prisma.equipe.findUnique({ where: { id: equipeId } });
  if (!equipe) throw new ServiceError('Equipe não encontrada', 404);
  if (equipe.status === 'inativo') throw new ServiceError('Equipe inativa');

  // Regras de escopo por papel
  if (requesterRole === 'TEC') {
    // TEC só pode criar para sua própria equipe
    if (!requester.usuarioId) throw new ServiceError('Usuário (técnico) não informado', 401);
    const perfilTec = await prisma.perfilUsuario.findFirst({
      where: { usuarioId: Number(requester.usuarioId), papel: 'TEC' },
    });
    if (!perfilTec || perfilTec.equipeId !== equipeId) {
      throw new ServiceError('Técnico só pode cadastrar atletas da sua própria equipe', 403);
    }
  }
  if (requesterRole === 'ORG') {
    // ORG só pode criar atletas para equipes da sua organização
    if (!requester.organizacaoId) throw new ServiceError('Organização do solicitante não informada', 401);
    if (equipe.organizacaoId && Number(equipe.organizacaoId) !== Number(requester.organizacaoId)) {
      throw new ServiceError('Organizador só pode cadastrar atletas para equipes da sua organização', 403);
    }
  }
  // EMP e ADM: permitido sem escopo adicional

  // CPF único
  const cpfExistente = await prisma.atleta.findFirst({ where: { documento: documentoRaw } });
  if (cpfExistente) throw new ServiceError('CPF já cadastrado para outro atleta', 409);

  // Idade vs categorias
  await validarIdadeVsCategorias(equipeId, dataNascimento);

  const created = await prisma.atleta.create({
    data: {
      equipeId,
      nome,
      dataNascimento,
      documento: documentoRaw,
      posicao,
      numeroCamisa,
        // telefone não suportado no schema
      status: 'ativo',
    },
  });

  return created;
};

/**
 * Consultar atletas
 * filters: { equipeId?, torneioId?, nome?, posicao?, order? }
 * Regras:
 * - TEC vê apenas atletas da sua equipe
 * - ADM vê todos
 * - Ordenação padrão: nome asc | alternativa: equipe | torneio
 */
const listAtletas = async (filters = {}, requester = {}) => {
  const where = {};

  // Filtro por equipe explícito
  if (filters.equipeId) {
    where.equipeId = Number(filters.equipeId);
  }
  // Filtro por nome
  if (filters.nome) {
    where.nome = { contains: String(filters.nome), mode: 'insensitive' };
  }
  // Filtro por posição
  if (filters.posicao && POSICOES_VALIDAS.includes(String(filters.posicao))) {
    where.posicao = String(filters.posicao);
  }

  // Restrição por role TEC
  if (requester && requester.role && String(requester.role).toUpperCase() === 'TEC' && requester.usuarioId) {
    // Encontrar perfil TEC do usuário para obter equipe
    const perfilTec = await prisma.perfilUsuario.findFirst({
      where: { usuarioId: Number(requester.usuarioId), papel: 'TEC' },
    });
    if (perfilTec && perfilTec.equipeId) {
      where.equipeId = perfilTec.equipeId; // sobrepõe qualquer filtro de equipe
    } else {
      // TEC sem equipe -> retorna vazio
      return [];
    }
  }

  // Filtro por torneio (via relação da equipe)
  if (filters.torneioId) {
    const torneioId = Number(filters.torneioId);
    where.equipe = { torneios: { some: { torneioId } } };
  }

  // Ordenação
  let orderBy = { nome: 'asc' };
  if (filters.order) {
    const ord = String(filters.order).toLowerCase();
    if (ord === 'equipe') orderBy = { equipe: { nome: 'asc' } }; // Prisma permite nested order
    else if (ord === 'torneio') orderBy = { nome: 'asc' }; // manter nome; ordenação por torneio não direta (ajuste pós-processamento)
  }

  const atletas = await prisma.atleta.findMany({
    where,
    orderBy,
    include: {
      equipe: {
        include: {
          torneios: { include: { torneio: true } },
        },
      },
    },
  });

  // Formatar retorno
  const result = atletas.map(a => {
    const idade = calcularIdade(a.dataNascimento);
    const torneios = (a.equipe?.torneios || []).map(t => t.torneio.nome);
    const categorias = (a.equipe?.torneios || []).map(t => t.torneio.categoria).filter(Boolean);
    return {
      id: a.id,
      nome: a.nome,
      equipe: a.equipe?.nome || 'N/A',
      equipeId: a.equipeId,
      torneios,
      categorias: [...new Set(categorias)],
      posicao: a.posicao,
      idade,
      status: a.status,
      numeroCamisa: a.numeroCamisa,
    };
  });

  // Ordenação alternativa por torneio (primeiro torneio alfabético) se order=torneio
  if (filters.order && String(filters.order).toLowerCase() === 'torneio') {
    result.sort((a, b) => {
      const ta = a.torneios[0] || '';
      const tb = b.torneios[0] || '';
      return ta.localeCompare(tb) || a.nome.localeCompare(b.nome);
    });
  }

  return result;
};

/** Obter atleta por ID */
const getAtletaById = async (id, requester = {}) => {
  const atleta = await prisma.atleta.findUnique({
    where: { id: Number(id) },
    include: {
      equipe: {
        include: {
          torneios: { include: { torneio: true } },
        },
      },
    },
  });
  if (!atleta) return null;

  // Restrição TEC
  if (requester && requester.role && String(requester.role).toUpperCase() === 'TEC' && requester.usuarioId) {
    const perfilTec = await prisma.perfilUsuario.findFirst({
      where: { usuarioId: Number(requester.usuarioId), papel: 'TEC' },
    });
    if (perfilTec && perfilTec.equipeId !== atleta.equipeId) {
      throw new ServiceError('Técnico só pode acessar atletas da sua equipe', 403);
    }
  }

  const idade = calcularIdade(atleta.dataNascimento);
  const torneios = (atleta.equipe?.torneios || []).map(t => t.torneio.nome);
  const categorias = (atleta.equipe?.torneios || []).map(t => t.torneio.categoria).filter(Boolean);
  return {
    id: atleta.id,
    nome: atleta.nome,
    equipe: atleta.equipe?.nome || 'N/A',
    equipeId: atleta.equipeId,
    torneios,
    categorias: [...new Set(categorias)],
    posicao: atleta.posicao,
    idade,
    status: atleta.status,
    numeroCamisa: atleta.numeroCamisa,
      // telefone não suportado no schema
    documento: atleta.documento,
  };
};

/**
 * Atualizar atleta
 * Campos editáveis: nome, posicao, equipeId, numeroCamisa, status, telefone
 * Não permitir alteração de CPF (documento) nem dataNascimento.
 */
const updateAtleta = async (id, payload = {}, requester = {}) => {
  // Permissões: TEC, ADM
  if (!requester || !requester.role) {
    throw new ServiceError('Role do solicitante é obrigatório', 401);
  }
  const requesterRole = String(requester.role).toUpperCase();
  if (!['TEC', 'ADM'].includes(requesterRole)) {
    throw new ServiceError('Apenas Técnicos ou Administradores podem editar atletas', 403);
  }
  const atleta = await prisma.atleta.findUnique({ where: { id: Number(id) } });
  if (!atleta) throw new ServiceError('Atleta não encontrado', 404);

  // Restrição TEC
  if (requesterRole === 'TEC' && requester.usuarioId) {
    const perfilTec = await prisma.perfilUsuario.findFirst({
      where: { usuarioId: Number(requester.usuarioId), papel: 'TEC' },
    });
    if (!perfilTec || perfilTec.equipeId !== atleta.equipeId) {
      throw new ServiceError('Técnico só pode editar atletas da sua equipe', 403);
    }
  }

  const data = {};

  if (typeof payload.nome !== 'undefined') {
    const novoNome = String(payload.nome || '').trim();
    if (!novoNome) throw new ServiceError('Nome não pode ser vazio');
    data.nome = novoNome;
  }
  if (typeof payload.posicao !== 'undefined') {
    const p = payload.posicao;
    if (p && !POSICOES_VALIDAS.includes(p)) {
      throw new ServiceError(`Posição inválida. Use: ${POSICOES_VALIDAS.join(', ')}`);
    }
    data.posicao = p || null;
  }
  if (typeof payload.numeroCamisa !== 'undefined') {
    const num = payload.numeroCamisa ? Number(payload.numeroCamisa) : null;
    if (num !== null && (!Number.isInteger(num) || num < 1 || num > 99)) {
      throw new ServiceError('Número da camisa deve ser um inteiro entre 1 e 99');
    }
    data.numeroCamisa = num;
  }
  if (typeof payload.status !== 'undefined') {
    const st = String(payload.status).toLowerCase();
    if (!['ativo', 'inativo'].includes(st)) {
      throw new ServiceError('Status inválido. Use ativo ou inativo');
    }
    data.status = st;
  }
  if (typeof payload.telefone !== 'undefined') {
      // telefone não suportado no schema
  }
  if (typeof payload.equipeId !== 'undefined') {
    const novaEquipeId = payload.equipeId ? Number(payload.equipeId) : null;
    if (!novaEquipeId) throw new ServiceError('Equipe destino inválida');
    // Validar nova equipe
    const novaEquipe = await prisma.equipe.findUnique({
      where: { id: novaEquipeId },
      include: { torneios: { include: { torneio: true } } },
    });
    if (!novaEquipe) throw new ServiceError('Nova equipe não encontrada', 404);
    // Validar idade vs categorias da nova equipe
    await validarIdadeVsCategorias(novaEquipeId, atleta.dataNascimento);
    data.equipeId = novaEquipeId;
  }

  // Impedir alteração de documento ou dataNascimento
  if (typeof payload.documento !== 'undefined') {
    throw new ServiceError('CPF não pode ser alterado');
  }
  if (typeof payload.dataNascimento !== 'undefined') {
    throw new ServiceError('Data de nascimento não pode ser alterada');
  }

  if (Object.keys(data).length === 0) {
    return atleta;
  }

  const updated = await prisma.atleta.update({
    where: { id: Number(id) },
    data,
  });
  return updated;
};

/**
 * Excluir atleta
 * - Se equipe está inscrita em torneio publicado -> inativar apenas
 */
const deleteAtleta = async (id, requester = {}) => {
  // Permissões: TEC, ADM
  if (!requester || !requester.role) {
    throw new ServiceError('Role do solicitante é obrigatório', 401);
  }
  const requesterRole = String(requester.role).toUpperCase();
  if (!['TEC', 'ADM'].includes(requesterRole)) {
    throw new ServiceError('Apenas Técnicos ou Administradores podem excluir/inativar atletas', 403);
  }
  const atleta = await prisma.atleta.findUnique({
    where: { id: Number(id) },
    include: {
      equipe: {
        include: {
          torneios: { include: { torneio: true } },
        },
      },
    },
  });
  if (!atleta) throw new ServiceError('Atleta não encontrado', 404);

  // Restrição TEC
  if (requesterRole === 'TEC' && requester.usuarioId) {
    const perfilTec = await prisma.perfilUsuario.findFirst({
      where: { usuarioId: Number(requester.usuarioId), papel: 'TEC' },
    });
    if (!perfilTec || perfilTec.equipeId !== atleta.equipeId) {
      throw new ServiceError('Técnico só pode excluir/inativar atletas da sua equipe', 403);
    }
  }

  const publicados = (atleta.equipe?.torneios || []).some(t => t.torneio.status === 'publicado');
  if (publicados) {
    if (atleta.status === 'inativo') {
      return { message: 'Atleta já está inativo devido a torneios publicados', atleta };
    }
    const inativado = await prisma.atleta.update({
      where: { id: atleta.id },
      data: { status: 'inativo' },
    });
    return { message: 'Atleta inativado (equipe inscrita em torneio publicado)', atleta: inativado };
  }

  await prisma.atleta.delete({ where: { id: atleta.id } });
  return { message: 'Atleta excluído com sucesso' };
};

module.exports = {
  createAtleta,
  listAtletas,
  getAtletaById,
  updateAtleta,
  deleteAtleta,
  ServiceError,
  POSICOES_VALIDAS,
};
