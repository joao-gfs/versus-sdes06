const usuarioService = require('../services/usuario.service');

const handleCreateUsuario = async (req, res) => {
  try {
    // requester info is expected in the request body (see RFS01.1)
    // Accept either a nested `requester` object or flattened fields: requesterRole, requesterOrganizacaoId, requesterEquipeId
    const body = req.body || {};

    const payload = {
      nome: body.nome,
      email: body.email,
      senha: body.senha,
      papel: body.papel,
      organizacaoId: body.organizacaoId,
      equipeId: body.equipeId,
    };

    const requester = {
      role: (body.requester && body.requester.role) || body.requesterRole,
      organizacaoId: (body.requester && body.requester.organizacaoId) ?? (body.requesterOrganizacaoId ? Number(body.requesterOrganizacaoId) : undefined),
      equipeId: (body.requester && body.requester.equipeId) ?? (body.requesterEquipeId ? Number(body.requesterEquipeId) : undefined),
    };

    const created = await usuarioService.createUsuario(payload, requester);
    res.status(201).json(created);
  } catch (error) {
    const status = error.statusCode || 400;
    res.status(status).json({ error: error.message });
  }
};

const handleLogin = async (req, res) => {
  try {
    const { email, senha, password } = req.body || {};
    // Accept both 'senha' and 'password' for compatibility
    const result = await usuarioService.authenticateUsuario({ email, senha, password });
    res.status(200).json(result);
  } catch (error) {
    const status = error.statusCode || 400;
    res.status(status).json({ error: error.message });
  }
};

const handleListUsuarios = async (req, res) => {
  try {
    const { nome } = req.query || {};
    const usuarios = await usuarioService.listUsuarios({ nome });
    res.status(200).json(usuarios);
  } catch (error) {
    const status = error.statusCode || 400;
    res.status(status).json({ error: error.message });
  }
};

module.exports = {
  handleCreateUsuario,
  handleLogin,
  handleListUsuarios,
};
