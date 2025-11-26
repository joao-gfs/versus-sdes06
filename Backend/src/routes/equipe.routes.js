const express = require('express');
const router = express.Router();
const equipeController = require('../controllers/equipe.controller');

// POST /api/equipes - cadastra uma nova equipe
router.post('/', equipeController.handleCreateEquipe);

// GET /api/equipes - consulta equipes (filtros: nome, tecnico, status; ordenação: nome|data)
router.get('/', equipeController.handleListEquipes);

// GET /api/equipes/:id - obtém uma equipe pelo id
router.get('/:id', equipeController.handleGetEquipeById);

// PUT /api/equipes/:id - edita uma equipe
router.put('/:id', equipeController.handleUpdateEquipe);

// DELETE /api/equipes/:id - exclui equipe (física se sem dependências; senão lógica)
router.delete('/:id', equipeController.handleDeleteEquipe);

// POST /api/equipes/inscrever - inscreve uma equipe em um torneio
router.post('/inscrever', equipeController.handleInscreverEquipeEmTorneio);

// PUT /api/equipes/inscricoes/:id - gerencia status de inscrição (aprovar/rejeitar)
router.put('/inscricoes/:id', equipeController.handleGerenciarInscricao);

module.exports = router;
