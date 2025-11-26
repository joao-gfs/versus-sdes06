const atletaService = require('../services/atleta.service');

// POST /api/atletas - cadastra um novo atleta
async function handleCreateAtleta(req, res) {
  try {
    const data = req.body || {};
    const roleHeader = (req.headers['x-role'] || '').toString().toUpperCase();
    const usuarioIdHeader = req.headers['x-usuario-id'] ? Number(req.headers['x-usuario-id']) : null;

    const requester = {
      role: roleHeader || (req.user && req.user.role ? String(req.user.role).toUpperCase() : ''),
      usuarioId: usuarioIdHeader || (req.user && req.user.userId ? Number(req.user.userId) : null),
    };

    const created = await atletaService.createAtleta(data, requester);
    return res.status(201).json(created);
  } catch (err) {
    const code = err.statusCode || 400;
    return res.status(code).json({ error: err.message });
  }
}

// GET /api/atletas - consulta atletas (filtros)
async function handleListAtletas(req, res) {
  try {
    const { equipeId, torneioId, nome, posicao, order } = req.query;
    const requester = {
      role: (req.headers['x-role'] || '').toString().toUpperCase(),
      usuarioId: req.headers['x-usuario-id'] ? Number(req.headers['x-usuario-id']) : null,
    };
    const list = await atletaService.listAtletas({ equipeId, torneioId, nome, posicao, order }, requester);
    return res.json(list);
  } catch (err) {
    const code = err.statusCode || 400;
    return res.status(code).json({ error: err.message });
  }
}

// GET /api/atletas/:id - obter atleta
async function handleGetAtletaById(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'ID inválido.' });
    }
    const requester = {
      role: (req.headers['x-role'] || '').toString().toUpperCase(),
      usuarioId: req.headers['x-usuario-id'] ? Number(req.headers['x-usuario-id']) : null,
    };
    const atleta = await atletaService.getAtletaById(id, requester);
    if (!atleta) return res.status(404).json({ error: 'Atleta não encontrado.' });
    return res.json(atleta);
  } catch (err) {
    const code = err.statusCode || 400;
    return res.status(code).json({ error: err.message });
  }
}

// PUT /api/atletas/:id - atualizar atleta
async function handleUpdateAtleta(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'ID inválido.' });
    }
    const roleHeader = (req.headers['x-role'] || '').toString().toUpperCase();
    const usuarioIdHeader = req.headers['x-usuario-id'] ? Number(req.headers['x-usuario-id']) : null;
    const requester = {
      role: roleHeader || (req.user && req.user.role ? String(req.user.role).toUpperCase() : ''),
      usuarioId: usuarioIdHeader || (req.user && req.user.userId ? Number(req.user.userId) : null),
    };
    const payload = req.body || {};
    const updated = await atletaService.updateAtleta(id, payload, requester);
    return res.json(updated);
  } catch (err) {
    const code = err.statusCode || 400;
    return res.status(code).json({ error: err.message });
  }
}

// DELETE /api/atletas/:id - excluir ou inativar
async function handleDeleteAtleta(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'ID inválido.' });
    }
    const roleHeader = (req.headers['x-role'] || '').toString().toUpperCase();
    const usuarioIdHeader = req.headers['x-usuario-id'] ? Number(req.headers['x-usuario-id']) : null;
    const requester = {
      role: roleHeader || (req.user && req.user.role ? String(req.user.role).toUpperCase() : ''),
      usuarioId: usuarioIdHeader || (req.user && req.user.userId ? Number(req.user.userId) : null),
    };
    const result = await atletaService.deleteAtleta(id, requester);
    return res.json(result);
  } catch (err) {
    const code = err.statusCode || 400;
    return res.status(code).json({ error: err.message });
  }
}

module.exports = {
  handleCreateAtleta,
  handleListAtletas,
  handleGetAtletaById,
  handleUpdateAtleta,
  handleDeleteAtleta,
};
