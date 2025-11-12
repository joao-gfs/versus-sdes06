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
 * List all active users
 * Returns a list of users that can be used for selection (e.g., as responsavel)
 */
const listUsuarios = async (filters = {}) => {
  const where = {};
  
  // Only active users by default
  where.status = 'ativo';
  
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

module.exports = {
  createUsuario,
  authenticateUsuario,
  listUsuarios,
};
