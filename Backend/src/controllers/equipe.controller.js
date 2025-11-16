const equipeService = require('../services/equipe.service');

// RFS04.1 - Cadastrar Equipes
const handleCreateEquipe = async (req, res) => {
  try {
    const body = req.body || {};
    const requester = {
      role: (body.requester && body.requester.role) || body.requesterRole,
      organizacaoId: (body.requester && body.requester.organizacaoId) ?? (body.requesterOrganizacaoId ? Number(body.requesterOrganizacaoId) : undefined),
      equipeId: (body.requester && body.requester.equipeId) ?? (body.requesterEquipeId ? Number(body.requesterEquipeId) : undefined),
    };

    const payload = {
      nome: body.nome,
      responsavel: body.responsavel,
      telefone: body.telefone,
      email: body.email,
      capacidadeMaxima: body.capacidadeMaxima,
      organizacaoId: body.organizacaoId,
    };

    const created = await equipeService.createEquipe(payload, requester);
    res.status(201).json(created);
  } catch (error) {
    const status = error.statusCode || 400;
    res.status(status).json({ error: error.message });
  }
};

// RFS04.2 - Consultar Equipes (com filtros)
const handleListEquipes = async (req, res) => {
  try {
    const filters = {
      nome: req.query.nome,
      responsavel: req.query.responsavel,
      status: req.query.status,
      orderBy: req.query.orderBy || 'nome', // 'nome' ou 'createdAt'
    };

    const equipes = await equipeService.listEquipes(filters);
    res.status(200).json(equipes);
  } catch (error) {
    const status = error.statusCode || 400;
    res.status(status).json({ error: error.message });
  }
};

// RFS04.2 - Consultar uma equipe específica
const handleGetEquipe = async (req, res) => {
  try {
    const { id } = req.params;
    const equipe = await equipeService.getEquipe(Number(id));
    res.status(200).json(equipe);
  } catch (error) {
    const status = error.statusCode || 404;
    res.status(status).json({ error: error.message });
  }
};

// RFS04.3 - Editar Equipes
const handleUpdateEquipe = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};

    const requester = {
      role: (body.requester && body.requester.role) || body.requesterRole,
      organizacaoId: (body.requester && body.requester.organizacaoId) ?? (body.requesterOrganizacaoId ? Number(body.requesterOrganizacaoId) : undefined),
      equipeId: (body.requester && body.requester.equipeId) ?? (body.requesterEquipeId ? Number(body.requesterEquipeId) : undefined),
    };

    const payload = {
      nome: body.nome,
      responsavel: body.responsavel,
      telefone: body.telefone,
      email: body.email,
      capacidadeMaxima: body.capacidadeMaxima,
    };

    const updated = await equipeService.updateEquipe(Number(id), payload, requester);
    res.status(200).json(updated);
  } catch (error) {
    const status = error.statusCode || 400;
    res.status(status).json({ error: error.message });
  }
};

// RFS04.4 - Excluir/Inativar Equipes
const handleDeleteEquipe = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};

    const requester = {
      role: (body.requester && body.requester.role) || body.requesterRole,
      equipeId: (body.requester && body.requester.equipeId) ?? (body.requesterEquipeId ? Number(body.requesterEquipeId) : undefined),
    };

    const result = await equipeService.deleteEquipe(Number(id), requester);
    res.status(200).json(result);
  } catch (error) {
    const status = error.statusCode || 400;
    res.status(status).json({ error: error.message });
  }
};

// RFS04.5 - Inscrever Equipe em Torneio
const handleInscricaoTorneio = async (req, res) => {
  try {
    const { id } = req.params; // equipeId
    const body = req.body || {};

    const requester = {
      role: (body.requester && body.requester.role) || body.requesterRole,
      equipeId: (body.requester && body.requester.equipeId) ?? (body.requesterEquipeId ? Number(body.requesterEquipeId) : undefined),
    };

    const payload = {
      equipeId: Number(id),
      torneioId: body.torneioId,
    };

    const inscricao = await equipeService.inscreverEmTorneio(payload, requester);
    res.status(201).json(inscricao);
  } catch (error) {
    const status = error.statusCode || 400;
    res.status(status).json({ error: error.message });
  }
};

module.exports = {
  handleCreateEquipe,
  handleListEquipes,
  handleGetEquipe,
  handleUpdateEquipe,
  handleDeleteEquipe,
  handleInscricaoTorneio,
};
