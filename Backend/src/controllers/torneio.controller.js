const torneioService = require('../services/torneio.service');

// POST /api/torneios - cadastra um novo torneio
async function handleCreateTorneio(req, res) {
  try {
    const data = req.body || {};
    const created = await torneioService.createTorneio(data);
    return res.status(201).json(created);
  } catch (err) {
    const code = err.statusCode || 400;
    return res.status(code).json({ error: err.message });
  }
}

// GET /api/torneios - consulta torneios (filtros e ordenação)
async function handleListTorneios(req, res) {
  try {
    const {
      organizacaoId,
      nome,
      categoria,
      edicao,
      status,
      order, // 'dataInicio' para ordenar por data de início; padrão por data de criação
    } = req.query;

    // Obter informações do usuário logado (se houver middleware de autenticação)
    const roleHeader = (req.headers['x-role'] || '').toString().toUpperCase();
    const requesterRole = roleHeader || (req.user && req.user.role ? String(req.user.role).toUpperCase() : '');
    const requesterOrgId = req.headers['x-org-id'] || (req.user && req.user.organizacaoId);

    const list = await torneioService.listTorneios({
      organizacaoId,
      nome,
      categoria,
      edicao,
      status,
      order,
      requesterRole,
      requesterOrgId,
    });

    return res.json(list);
  } catch (err) {
    const code = err.statusCode || 400;
    return res.status(code).json({ error: err.message });
  }
}

// GET /api/torneios/:id - obtém um torneio pelo id
async function handleGetTorneioById(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'ID inválido.' });
    }
    const torneio = await torneioService.getTorneioById(id);
    if (!torneio) {
      return res.status(404).json({ error: 'Torneio não encontrado.' });
    }
    return res.json(torneio);
  } catch (err) {
    const code = err.statusCode || 400;
    return res.status(code).json({ error: err.message });
  }
}

// PUT /api/torneios/:id - edita um torneio
async function handleUpdateTorneio(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'ID inválido.' });
    }

    const roleHeader = (req.headers['x-role'] || '').toString().toUpperCase();
    const requesterRole = roleHeader || (req.user && req.user.role ? String(req.user.role).toUpperCase() : '');
    const requesterOrgId = req.headers['x-org-id'] || (req.user && req.user.organizacaoId);

    const payload = req.body || {};
    const updated = await torneioService.updateTorneio(id, payload, requesterRole, requesterOrgId);
    return res.json(updated);
  } catch (err) {
    const code = err.statusCode || (err.message && err.message.includes('permiss') ? 403 : 400);
    return res.status(code).json({ error: err.message });
  }
}

// DELETE /api/torneios/:id - exclusão física ou lógica
async function handleDeleteTorneio(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'ID inválido.' });
    }

    const roleHeader = (req.headers['x-role'] || '').toString().toUpperCase();
    const requesterRole = roleHeader || (req.user && req.user.role ? String(req.user.role).toUpperCase() : '');
    const requesterOrgId = req.headers['x-org-id'] || (req.user && req.user.organizacaoId);

    const result = await torneioService.deleteTorneio(id, requesterRole, requesterOrgId);
    return res.json(result);
  } catch (err) {
    const code = err.statusCode || 400;
    return res.status(code).json({ error: err.message });
  }
}

async function handleSortearChaveamento(req, res) {
  try {
    const torneioId = Number(req.params.id);

    if (!Number.isInteger(torneioId) || torneioId <= 0) {
      return res.status(400).json({ error: 'ID do Torneio inválido.' });
    }

    const result = await torneioService.sortearChaveamento(torneioId);

    return res.status(200).json({
      message: `Chaveamento do torneio ${result.nome} sorteado com sucesso. Status atualizado para 'publicado'.`,
      partidasGeradas: result.partidasGeradas,
      torneio: {
        id: result.id,
        status: result.status,
        formato: result.formato
      }
    });

  } catch (err) {
    const code = err.statusCode || 400;
    return res.status(code).json({ error: err.message });
  }
}

// POST /api/torneios/:id/reverter-sorteio - reverte o sorteio de chaveamento
async function handleReverterSorteio(req, res) {
  try {
    const torneioId = Number(req.params.id);

    if (!Number.isInteger(torneioId) || torneioId <= 0) {
      return res.status(400).json({ error: 'ID do Torneio inválido.' });
    }

    const roleHeader = (req.headers['x-role'] || '').toString().toUpperCase();
    const requesterRole = roleHeader || (req.user && req.user.role ? String(req.user.role).toUpperCase() : '');
    const requesterOrgId = req.headers['x-org-id'] || (req.user && req.user.organizacaoId);

    const result = await torneioService.reverterSorteio(torneioId, requesterRole, requesterOrgId);

    return res.status(200).json({
      message: 'Sorteio revertido com sucesso. Torneio voltou para status "em configuração".',
      torneio: result
    });

  } catch (err) {
    const code = err.statusCode || 400;
    return res.status(code).json({ error: err.message });
  }
}

// GET /api/torneios/:id/chaveamento - consulta o chaveamento de um torneio
async function handleConsultarChaveamento(req, res) {
  try {
    const torneioId = Number(req.params.id);
    const { equipe, ordenacao } = req.query;

    if (!Number.isInteger(torneioId) || torneioId <= 0) {
      return res.status(400).json({ error: 'ID do Torneio inválido.' });
    }

    const chaveamento = await torneioService.consultarChaveamento(torneioId, {
      equipe,
      ordenacao,
    });

    return res.json(chaveamento);

  } catch (err) {
    const code = err.statusCode || 400;
    return res.status(code).json({ error: err.message });
  }
}

module.exports = {
  handleCreateTorneio,
  handleListTorneios,
  handleGetTorneioById,
  handleUpdateTorneio,
  handleDeleteTorneio,
  handleSortearChaveamento,
  handleReverterSorteio,
  handleConsultarChaveamento,
};
