const organizacaoService = require('../services/organizacao.service');

// POST /api/organizacoes - cadastra uma nova organização
async function handleCreateOrganizacao(req, res) {
  try {
    const data = req.body || {};
    const created = await organizacaoService.createOrganizacao(data);
    return res.status(201).json(created);
  } catch (err) {
    const code = err.statusCode || 400;
    return res.status(code).json({ error: err.message });
  }
}

// GET /api/organizacoes - consulta organizações (filtros e ordenação)
async function handleListOrganizacoes(req, res) {
  try {
    const {
      nome,
      responsavel,
      status,
      order, // 'createdAt' para ordenar por data; padrão por nome
    } = req.query;

    const list = await organizacaoService.listOrganizacoes({
      nome,
      responsavel,
      status,
      order,
    });

    return res.json(list);
  } catch (err) {
    const code = err.statusCode || 400;
    return res.status(code).json({ error: err.message });
  }
}

// GET /api/organizacoes/:id - obtém uma organização pelo id
async function handleGetOrganizacaoById(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'ID inválido.' });
    }
    const org = await organizacaoService.getOrganizacaoById(id);
    if (!org) {
      return res.status(404).json({ error: 'Organização não encontrada.' });
    }
    return res.json(org);
  } catch (err) {
    const code = err.statusCode || 400;
    return res.status(code).json({ error: err.message });
  }
}

// PUT /api/organizacoes/:id - edita uma organização (somente ADM)
async function handleUpdateOrganizacao(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'ID inválido.' });
    }

    const roleHeader = (req.headers['x-role'] || '').toString().toUpperCase();
    const requesterRole = roleHeader || (req.user && req.user.role ? String(req.user.role).toUpperCase() : '');

    const payload = req.body || {};
    const updated = await organizacaoService.updateOrganizacao(id, payload, requesterRole);
    return res.json(updated);
  } catch (err) {
    const code = err.statusCode || (err.message && err.message.includes('permiss') ? 403 : 400);
    return res.status(code).json({ error: err.message });
  }
}

// DELETE /api/organizacoes/:id - exclusão física ou lógica
async function handleDeleteOrganizacao(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'ID inválido.' });
    }
    const result = await organizacaoService.deleteOrganizacao(id);
    return res.json(result);
  } catch (err) {
    const code = err.statusCode || 400;
    return res.status(code).json({ error: err.message });
  }
}

module.exports = {
  handleCreateOrganizacao,
  handleListOrganizacoes,
  handleGetOrganizacaoById,
  handleUpdateOrganizacao,
  handleDeleteOrganizacao,
};
