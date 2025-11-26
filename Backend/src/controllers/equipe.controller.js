const equipeService = require('../services/equipe.service');

// POST /api/equipes - cadastra uma nova equipe
async function handleCreateEquipe(req, res) {
  try {
    const data = req.body || {};
    
    // Obter informações do solicitante
    const roleHeader = (req.headers['x-role'] || '').toString().toUpperCase();
    const usuarioIdHeader = req.headers['x-usuario-id'] ? Number(req.headers['x-usuario-id']) : null;
    const organizacaoIdHeader = req.headers['x-organizacao-id'] ? Number(req.headers['x-organizacao-id']) : null;
    
    const requester = {
      role: roleHeader || (req.user && req.user.role ? String(req.user.role).toUpperCase() : ''),
      usuarioId: usuarioIdHeader || (req.user && req.user.id ? Number(req.user.id) : null),
      organizacaoId: organizacaoIdHeader || (req.user && req.user.organizacaoId ? Number(req.user.organizacaoId) : null),
    };

    const created = await equipeService.createEquipe(data, requester);
    return res.status(201).json(created);
  } catch (err) {
    const code = err.statusCode || 400;
    return res.status(code).json({ error: err.message });
  }
}

// GET /api/equipes - consulta equipes (filtros e ordenação)
async function handleListEquipes(req, res) {
  try {
    const {
      nome,
      tecnico,
      status,
      order, // 'createdAt' para ordenar por data; padrão por nome
    } = req.query;

    const requester = {
      role: req.headers['x-role'] || '',
      usuarioId: req.headers['x-usuario-id'] ? Number(req.headers['x-usuario-id']) : null,
    };

    const list = await equipeService.listEquipes({
      nome,
      tecnico,
      status,
      order,
    }, requester);

    return res.json(list);
  } catch (err) {
    const code = err.statusCode || 400;
    return res.status(code).json({ error: err.message });
  }
}

// GET /api/equipes/:id - obtém uma equipe pelo id
async function handleGetEquipeById(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'ID inválido.' });
    }
    const equipe = await equipeService.getEquipeById(id);
    if (!equipe) {
      return res.status(404).json({ error: 'Equipe não encontrada.' });
    }
    return res.json(equipe);
  } catch (err) {
    const code = err.statusCode || 400;
    return res.status(code).json({ error: err.message });
  }
}

// PUT /api/equipes/:id - edita uma equipe
async function handleUpdateEquipe(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'ID inválido.' });
    }

    const roleHeader = (req.headers['x-role'] || '').toString().toUpperCase();
    const usuarioIdHeader = req.headers['x-usuario-id'] ? Number(req.headers['x-usuario-id']) : null;
    const organizacaoIdHeader = req.headers['x-organizacao-id'] ? Number(req.headers['x-organizacao-id']) : null;
    
    const requester = {
      role: roleHeader || (req.user && req.user.role ? String(req.user.role).toUpperCase() : ''),
      usuarioId: usuarioIdHeader || (req.user && req.user.id ? Number(req.user.id) : null),
      organizacaoId: organizacaoIdHeader || (req.user && req.user.organizacaoId ? Number(req.user.organizacaoId) : null),
    };

    const payload = req.body || {};
    const updated = await equipeService.updateEquipe(id, payload, requester);
    return res.json(updated);
  } catch (err) {
    const code = err.statusCode || (err.message && err.message.includes('permiss') ? 403 : 400);
    return res.status(code).json({ error: err.message });
  }
}

// DELETE /api/equipes/:id - exclusão física ou lógica
async function handleDeleteEquipe(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'ID inválido.' });
    }

    const roleHeader = (req.headers['x-role'] || '').toString().toUpperCase();
    const usuarioIdHeader = req.headers['x-usuario-id'] ? Number(req.headers['x-usuario-id']) : null;
    
    const requester = {
      role: roleHeader || (req.user && req.user.role ? String(req.user.role).toUpperCase() : ''),
      usuarioId: usuarioIdHeader || (req.user && req.user.id ? Number(req.user.id) : null),
    };

    const result = await equipeService.deleteEquipe(id, requester);
    return res.json(result);
  } catch (err) {
    const code = err.statusCode || 400;
    return res.status(code).json({ error: err.message });
  }
}

// POST /api/equipes/inscrever - inscreve uma equipe em um torneio
async function handleInscreverEquipeEmTorneio(req, res) {
  try {
    const data = req.body || {};
    
    const roleHeader = (req.headers['x-role'] || '').toString().toUpperCase();
    const usuarioIdHeader = req.headers['x-usuario-id'] ? Number(req.headers['x-usuario-id']) : null;
    const organizacaoIdHeader = req.headers['x-organizacao-id'] ? Number(req.headers['x-organizacao-id']) : null;
    
    const requester = {
      role: roleHeader || (req.user && req.user.role ? String(req.user.role).toUpperCase() : ''),
      usuarioId: usuarioIdHeader || (req.user && req.user.id ? Number(req.user.id) : null),
      organizacaoId: organizacaoIdHeader || (req.user && req.user.organizacaoId ? Number(req.user.organizacaoId) : null),
    };

    const inscricao = await equipeService.inscreverEquipeEmTorneio(data, requester);
    return res.status(201).json(inscricao);
  } catch (err) {
    const code = err.statusCode || 400;
    return res.status(code).json({ error: err.message });
  }
}

// PUT /api/equipes/inscricoes/:id - gerencia status de inscrição (aprovar/rejeitar)
async function handleGerenciarInscricao(req, res) {
  try {
    const inscricaoId = Number(req.params.id);
    const { status } = req.body;

    if (!inscricaoId || !Number.isInteger(inscricaoId)) {
      return res.status(400).json({ error: 'ID de inscrição inválido' });
    }

    if (!status) {
      return res.status(400).json({ error: 'Status é obrigatório' });
    }

    const roleHeader = (req.headers['x-role'] || '').toString().toUpperCase();
    const usuarioIdHeader = req.headers['x-usuario-id'] ? Number(req.headers['x-usuario-id']) : null;
    const organizacaoIdHeader = req.headers['x-organizacao-id'] ? Number(req.headers['x-organizacao-id']) : null;

    const requester = {
      role: roleHeader || (req.user && req.user.role ? String(req.user.role).toUpperCase() : ''),
      usuarioId: usuarioIdHeader || (req.user && req.user.id ? Number(req.user.id) : null),
      organizacaoId: organizacaoIdHeader || (req.user && req.user.organizacaoId ? Number(req.user.organizacaoId) : null),
    };

    const updated = await equipeService.gerenciarInscricao(inscricaoId, status, requester);
    return res.json(updated);
  } catch (err) {
    const code = err.statusCode || 400;
    return res.status(code).json({ error: err.message });
  }
}

module.exports = {
  handleCreateEquipe,
  handleListEquipes,
  handleGetEquipeById,
  handleUpdateEquipe,
  handleDeleteEquipe,
  handleInscreverEquipeEmTorneio,
  handleGerenciarInscricao,
};
