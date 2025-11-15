const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Simple validators
const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/; // at least 8 chars, letters and numbers

class ServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

/**
 * Create a usuario and the initial perfil_usuario according to RFS01.1
 * payload: { nome, email, senha, papel, organizacaoId, equipeId }
 * requester: { role, organizacaoId, equipeId } - simulated auth via headers
 */
const createUsuario = async (payload, requester = {}) => {
  const { nome, email, senha, papel, organizacaoId, equipeId } = payload;

  // Basic validations
  if (!nome || !nome.trim()) throw new ServiceError('Nome completo é obrigatório');
  if (!email || !emailRegex.test(email)) throw new ServiceError('Email inválido');
  if (!senha || !passwordRegex.test(senha)) throw new ServiceError('Senha inválida. Mínimo 8 caracteres, pelo menos letras e números');
  if (!['ADM', 'ORG', 'TEC'].includes(papel)) throw new ServiceError('Papel inválido. Deve ser ADM, ORG ou TEC');

  // Business rules
  // Require requester role (now provided via request body)
  if (!requester || !requester.role) throw new ServiceError('Role do solicitante é obrigatório no corpo da requisição (requester.role)', 401);

  // 1) Email único
  const existing = await prisma.usuario.findUnique({ where: { email } });
  if (existing) throw new ServiceError('Email já cadastrado', 409);

  // 2) Papel ORG: only ADM can create
  const requesterRole = requester.role;
  if (papel === 'ORG' && requesterRole !== 'ADM') {
    throw new ServiceError('Apenas Administradores podem criar usuários com papel ORG', 403);
  }

  // 3) Papel TEC: equipe required
  if (papel === 'TEC' && !equipeId) {
    throw new ServiceError('Equipe é obrigatória para papel TEC');
  }

  // 4) If requester is ORG and creating TEC, ensure the equipe belongs to their organizacao
  if (papel === 'TEC' && requesterRole === 'ORG') {
    if (!requester.organizacaoId) throw new ServiceError('Informar organizacao do criador no corpo da requisição (requester.organizacaoId)');
    const equipe = await prisma.equipe.findUnique({ where: { id: Number(equipeId) } });
    if (!equipe) throw new ServiceError('Equipe informada não existe');
    if (equipe.organizacaoId !== Number(requester.organizacaoId)) {
      throw new ServiceError('Organização do criador não corresponde à organização da equipe', 403);
    }
  }

  // 5) Técnico só pode ter um perfil TEC (the unique contraint usuario_id+papel prevents duplicate profiles for same user)
  // For new user this isn't an issue, but if creating a profile for existing user, we'd check.

  // Hash password
  const senhaHash = await bcrypt.hash(senha, 10);

  // Transaction: create usuario and perfil_usuario
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.usuario.create({
      data: {
        nome: nome.trim(),
        email: email.toLowerCase().trim(),
        senhaHash,
        status: 'ativo',
      },
    });

    // create profile
    const perfilData = {
      usuarioId: user.id,
      papel,
      createdAt: new Date(),
    };
    if (organizacaoId) perfilData.organizacaoId = Number(organizacaoId);
    if (equipeId) perfilData.equipeId = Number(equipeId);

    const perfil = await tx.perfilUsuario.create({ data: perfilData });

    return {
      usuario: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        status: user.status,
        createdAt: user.createdAt,
      },
      perfil: {
        id: perfil.id,
        papel: perfil.papel,
        organizacaoId: perfil.organizacaoId,
        equipeId: perfil.equipeId,
      },
    };
  });

  return result;
};

/**
 * Authenticate a user (RFS01.2)
 * payload: { email, senha } or { email, password }
 * Business rules:
* - block login for inactive users
 * - block login after 4 failed attempts (lock for 15 minutes)
 * - return user with profiles, vinculos and JWT token on success
 */
const authenticateUsuario = async (payload) => {
  const { email, senha, password } = payload || {};
  // Accept both 'senha' (Portuguese) and 'password' (English) for flexibility
  const passwordValue = senha || password;
  
  if (!email || !emailRegex.test(email)) throw new ServiceError('Email ou senha inválidos');
  if (!passwordValue || !passwordRegex.test(passwordValue)) throw new ServiceError('Email ou senha inválidos');

  const user = await prisma.usuario.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user) throw new ServiceError('Email ou senha inválidos', 401);

  if (user.status === 'inativo') {
    throw new ServiceError('Usuário inativo. Contate o administrador.', 403);
  }

  // check lock
  const now = new Date();
  if (user.lockedUntil && user.lockedUntil > now) {
    throw new ServiceError('Conta bloqueada devido a múltiplas tentativas. Tente mais tarde.', 403);
  }

  const match = await bcrypt.compare(passwordValue, user.senhaHash);
  if (!match) {
    // increment failedAttempts; if reaches 4, set lock for 15 minutes
    const attempts = (user.failedAttempts || 0) + 1;
    const data = { failedAttempts: attempts };
    if (attempts >= 4) {
      const lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      data.lockedUntil = lockUntil;
    }
    await prisma.usuario.update({ where: { id: user.id }, data });
    throw new ServiceError('Email ou senha inválidos', 401);
  }

  // successful login: reset failedAttempts and lockedUntil, update last login if needed
  await prisma.usuario.update({ where: { id: user.id }, data: { failedAttempts: 0, lockedUntil: null } });

  // load profiles and vinculose
  const perfis = await prisma.perfilUsuario.findMany({
    where: { usuarioId: user.id },
    include: { organizacao: true, equipe: true },
  });

  // build permissions/vinculos structure
  const vinculos = perfis.map(p => ({ papel: p.papel, organizacao: p.organizacao ?? null, equipe: p.equipe ?? null }));

  // Generate JWT token
  const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  const token = jwt.sign(
    { 
      userId: user.id, 
      email: user.email,
      perfis: vinculos.map(v => v.papel) // Include roles in token
    },
    jwtSecret,
    { expiresIn: '24h' } // Token expires in 24 hours
  );

  return {
    user: { 
      id: user.id, 
      nome: user.nome, 
      email: user.email, 
      status: user.status, 
      createdAt: user.createdAt 
    },
    perfis: vinculos,
    token,
  };
};

/**
 * List users
 * - Non-Admins only see 'ativo' users.
 * - Admins can filter by 'ativo'/'inativo' or see all.
 * @param {object} filters - { nome, status }
 * @param {object} requester - { role }
 */
const listUsuarios = async (filters = {}, requester = {}) => {
  const where = {};

  const requesterRole = requester.role;

  if (requesterRole === 'ADM') {
    // ADM pode filtrar por status.
    // Se 'status' for passado no filtro (e.g., 'ativo' ou 'inativo'), use-o.
    if (filters.status && ['ativo', 'inativo'].includes(filters.status)) {
      where.status = filters.status;
    }
    // Se o ADM não passar 'status' no filtro, ele vê TODOS (ativos e inativos).
  } else {
    // Não-ADM (ORG, TEC) ou anônimo SÓ PODEM ver usuários ativos.
    where.status = 'ativo';
  }
  
  // Optional name filter
  if (filters.nome) {
    where.nome = { contains: String(filters.nome), mode: 'insensitive' };
  }
  
  const usuarios = await prisma.usuario.findMany({
    where,
    select: {
      id: true,
      nome: true,
      email: true,
      status: true,
    },
    orderBy: {
      nome: 'asc',
    },
  });
  
  return usuarios;
};

/**
 * Atualiza um usuário e seu perfil associado.
* (Código da sua resposta anterior, movido para antes do module.exports)
 *
 * @param {number | string} id - O ID do Usuário (prisma.usuario) a ser atualizado.
 * @param {object} payload - Dados a serem atualizados.
 * @param {object} requester - Objeto representando o solicitante da requisição.
 */
const updateUsuario = async (id, payload, requester = {}) => {
  const usuarioId = Number(id);
  if (isNaN(usuarioId)) throw new ServiceError('ID de usuário inválido', 400);

  // Extrai campos potenciais do payload
  const { nome, email, senha, status, papel, organizacaoId, equipeId } = payload;

  // --- 1. Validação do Solicitante (Requester) ---
  if (!requester || !requester.role) {
    throw new ServiceError('Role do solicitante é obrigatório (requester.role)', 401);
  }
  const requesterRole = requester.role;

  // --- 2. Transação: Ler, Validar e Atualizar ---
  const result = await prisma.$transaction(async (tx) => {
    // Busca o usuário e seu perfil
    const existingUser = await tx.usuario.findUnique({
      where: { id: usuarioId },
    });
    if (!existingUser) throw new ServiceError('Usuário não encontrado', 404);

    // Encontra o perfil associado.
    const existingPerfil = await tx.perfilUsuario.findFirst({
      where: { usuarioId: usuarioId },
    });
    if (!existingPerfil) {
      throw new ServiceError('Perfil do usuário não encontrado. Dados inconsistentes.', 404);
    }

    // --- 3. Preparar Dados para Atualização ---
    const usuarioData = {};
    const perfilData = {};

    // --- 4. Validar e Mapear Campos do Usuário ---

    // Atualizar Nome
    if (nome !== undefined && nome.trim() !== existingUser.nome) {
      if (!nome.trim()) throw new ServiceError('Nome completo é obrigatório');
      usuarioData.nome = nome.trim();
  D }

    // Atualizar Email
    if (email !== undefined && email.toLowerCase().trim() !== existingUser.email) {
      if (!emailRegex.test(email)) throw new ServiceError('Email inválido');
      // Regra 1: Email único
      const emailConflict = await tx.usuario.findUnique({
        where: { email: email.toLowerCase().trim() },
      });
      if (emailConflict && emailConflict.id !== existingUser.id) {
        throw new ServiceError('Email já cadastrado', 409);
      }
      usuarioData.email = email.toLowerCase().trim();
    }

    // Atualizar Senha
    if (senha !== undefined) {
      if (!passwordRegex.test(senha)) {
        throw new ServiceError('Senha inválida. Mínimo 8 caracteres, letras e números');
      }
      usuarioData.senhaHash = await bcrypt.hash(senha, 10);
    }

    // Atualizar Status
    if (status !== undefined && status !== existingUser.status) {
      if (!['ativo', 'inativo'].includes(status)) {
         throw new ServiceError('Status inválido. Deve ser "ativo" ou "inativo"');
      }
      // Um ADM pode inativar qualquer um.
      // Um ORG pode inativar um TEC da sua própria organização.
      // Ninguém pode se auto-inativar por esta rota (assumindo uma rota /profile/me separada)
      if (requester.id === existingUser.id) {
         throw new ServiceError('Não é possível alterar o próprio status por esta rota.', 403);
      }
      
      if (requesterRole === 'ORG') {
        if (existingPerfil.papel !== 'TEC') {
          throw new ServiceError('Organizador só pode alterar status de Técnicos.', 403);
        }
        if (existingPerfil.organizacaoId !== requester.organizacaoId) {
           throw new ServiceError('Organizador só pode alterar status de técnicos da sua própria organização.', 403);
        }
      }
      // ADM pode alterar qualquer um (sem 'else' explícito necessário)
      usuarioData.status = status;
    }

    // --- 5. Validar e Mapear Campos do Perfil ---

    // Determina o estado *final* do perfil para validar as regras de negócio
    const targetPapel = (papel !== undefined) ? papel : existingPerfil.papel;
    const targetEquipeId = (equipeId !== undefined) ? (equipeId ? Number(equipeId) : null) : existingPerfil.equipeId;
    const targetOrganizacaoId = (organizacaoId !== undefined) ? (organizacaoId ? Number(organizacaoId) : null) : existingPerfil.organizacaoId;

    // Se o papel (role) estiver sendo alterado
    if (papel !== undefined && papel !== existingPerfil.papel) {
      if (!['ADM', 'ORG', 'TEC'].includes(papel)) throw new ServiceError('Papel inválido. Deve ser ADM, ORG ou TEC');
      perfilData.papel = papel;

      // Regra 2: Papel ORG: only ADM can create/update *to* ORG
      if (targetPapel === 'ORG' && requesterRole !== 'ADM') {
         throw new ServiceError('Apenas Administradores podem definir um papel como ORG', 403);
      }
    }
    
    // Atualiza IDs se fornecidos
    if (organizacaoId !== undefined) {
      perfilData.organizacaoId = targetOrganizacaoId;
    }
    if (equipeId !== undefined) {
       perfilData.equipeId = targetEquipeId;
    }

    // Regra 3: Papel TEC: equipe required
    if (targetPapel === 'TEC' && !targetEquipeId) {
      throw new ServiceError('Equipe é obrigatória para papel TEC');
    }
    
    // Regra 4: Se requester é ORG e está alterando um perfil TEC (ou mudando para TEC)
    if (targetPapel === 'TEC' && requesterRole === 'ORG') {
      // Verifica se a equipe foi alterada ou se o papel foi alterado *para* TEC
      const equipeFoiAlterada = equipeId !== undefined && targetEquipeId !== existingPerfil.equipeId;
      const mudouParaTec = papel !== undefined && papel === 'TEC';

      if (equipeFoiAlterada || mudouParaTec) {
        if (!requester.organizacaoId) throw new ServiceError('Informar organizacao do criador no corpo da requisição (requester.organizacaoId)');
        
        const equipe = await tx.equipe.findUnique({ where: { id: targetEquipeId } });
        if (!equipe) throw new ServiceError('Equipe informada não existe');
        
        if (equipe.organizacaoId !== Number(requester.organizacaoId)) {
          throw new ServiceError('Organização do solicitante não corresponde à organização da equipe', 403);
        }
      }
    }

    // Limpeza: Se o papel mudou *deixando* de ser TEC, anula a equipe
    if (targetPapel !== 'TEC' && existingPerfil.papel === 'TEC') {
      perfilData.equipeId = null;
    }

    // --- 6. Executar Atualizações ---
    if (Object.keys(usuarioData).length === 0 && Object.keys(perfilData).length === 0) {
      throw new ServiceError('Nenhum dado fornecido para atualização', 400);
    }

    let updatedUser = existingUser;
    if (Object.keys(usuarioData).length > 0) {
      updatedUser = await tx.usuario.update({
        where: { id: usuarioId },
        data: usuarioData,
      });
    }

    let updatedPerfil = existingPerfil;
    if (Object.keys(perfilData).length > 0) {
      updatedPerfil = await tx.perfilUsuario.update({
        where: { id: existingPerfil.id }, // Atualiza o perfil pelo ID dele
        data: perfilData,
      });
    }

    // Retorna os dados atualizados de dentro da transação
    return { updatedUser, updatedPerfil };
  }); // Fim da transação

  // --- 7. Retornar Dados Formatados ---
  const { updatedUser, updatedPerfil } = result;

  return {
    usuario: {
      id: updatedUser.id,
      nome: updatedUser.nome,
      email: updatedUser.email,
      status: updatedUser.status,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt, // Inclui o updatedAt
    },
    perfil: {
      id: updatedPerfil.id,
      papel: updatedPerfil.papel,
      organizacaoId: updatedPerfil.organizacaoId,
      equipeId: updatedPerfil.equipeId,
    },
  };
};

// --- ALTERAÇÃO: MOVIDO 'module.exports' PARA O FIM DO ARQUIVO ---
module.exports = {
  createUsuario,
  authenticateUsuario,
  listUsuarios,
  updateUsuario, // <-- E 'updateUsuario' foi adicionado aqui
};