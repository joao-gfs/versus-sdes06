const express = require('express');
const router = express.Router();
const torneioController = require('../controllers/torneio.controller');

// POST /api/torneios - cadastra um novo torneio
router.post('/', torneioController.handleCreateTorneio);

// GET /api/torneios - consulta torneios (filtros: organizacaoId, nome, categoria, edicao, status; ordenação: createdAt|dataInicio)
router.get('/', torneioController.handleListTorneios);

// GET /api/torneios/:id - obtém um torneio pelo id
router.get('/:id', torneioController.handleGetTorneioById);

// PUT /api/torneios/:id - edita um torneio (somente ORG da própria organização ou ADM)
router.put('/:id', torneioController.handleUpdateTorneio);

// DELETE /api/torneios/:id - exclui torneio (física se "em configuração" sem equipes; senão lógica)
router.delete('/:id', torneioController.handleDeleteTorneio);

// POST /api/torneios/:id/sorteio - sorteia o chaveamento do torneio
router.post('/:id/sorteio', torneioController.handleSortearChaveamento);

// POST /api/torneios/:id/reverter-sorteio - reverte o sorteio do chaveamento
router.post('/:id/reverter-sorteio', torneioController.handleReverterSorteio);

// GET /api/torneios/:id/chaveamento - consulta o chaveamento do torneio
router.get('/:id/chaveamento', torneioController.handleConsultarChaveamento);

module.exports = router;
