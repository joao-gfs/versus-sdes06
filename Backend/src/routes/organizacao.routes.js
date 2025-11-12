const express = require('express');
const router = express.Router();
const organizacaoController = require('../controllers/organizacao.controller');

// POST /api/organizacoes - cadastra uma nova organização
router.post('/', organizacaoController.handleCreateOrganizacao);

// GET /api/organizacoes - consulta organizações (filtros: nome, responsavel, status; ordenação: nome|data)
router.get('/', organizacaoController.handleListOrganizacoes);

// GET /api/organizacoes/:id - obtém uma organização pelo id
router.get('/:id', organizacaoController.handleGetOrganizacaoById);

// PUT /api/organizacoes/:id - edita uma organização (somente ADM)
router.put('/:id', organizacaoController.handleUpdateOrganizacao);

// DELETE /api/organizacoes/:id - exclui organização (física se sem dependências; senão lógica)
router.delete('/:id', organizacaoController.handleDeleteOrganizacao);

module.exports = router;
