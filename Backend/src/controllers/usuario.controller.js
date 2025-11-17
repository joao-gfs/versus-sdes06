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
      id: (body.requester && body.requester.id) ?? (body.requesterId ? Number(body.requesterId) : undefined),
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
    const { nome, status, requesterRole } = req.query || {};
    
    const filters = { nome, status };
    
    const requester = { role: requesterRole };

    const usuarios = await usuarioService.listUsuarios(filters, requester);
    res.status(200).json(usuarios);
  } catch (error) {
    const status = error.statusCode || 400;
    res.status(status).json({ error: error.message });
  }
}

const handleUpdateUsuario = async (req, res) => {
  try {
    const { id } = req.params; // ID do usuário a ser atualizado
    const body = req.body || {};

    // 1. Payload: O que será atualizado no usuário
    const payload = {
      nome: body.nome,
      email: body.email,
      senha: body.senha,
      status: body.status,
      papel: body.papel,
      organizacaoId: body.organizacaoId,
      equipeId: body.equipeId,
    };

    // 2. Requester: Quem está realizando a atualização (simulado)
    // (Segue o mesmo padrão do createUsuario)
    const requester = {
      id: (body.requester && body.requester.id) ?? (body.requesterId ? Number(body.requesterId) : undefined),
      role: (body.requester && body.requester.role) || body.requesterRole,
      organizacaoId: (body.requester && body.requester.organizacaoId) ?? (body.requesterOrganizacaoId ? Number(body.requesterOrganizacaoId) : undefined),
      equipeId: (body.requester && body.requester.equipeId) ?? (body.requesterEquipeId ? Number(body.requesterEquipeId) : undefined),
    };

    const updated = await usuarioService.updateUsuario(id, payload, requester);
    res.status(200).json(updated);
  } catch (error) {
    const status = error.statusCode || 400;
    res.status(status).json({ error: error.message });
  }
};

module.exports = {
  handleCreateUsuario,
  handleLogin,
  handleListUsuarios,
  handleUpdateUsuario,
};