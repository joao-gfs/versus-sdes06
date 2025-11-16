const express = require('express');
const router = express.Router();
const equipeController = require('../controllers/equipe.controller');

// RFS04.1 - Cadastrar Equipes
router.post('/', equipeController.handleCreateEquipe);

// RFS04.2 - Consultar Equipes (com filtros)
router.get('/', equipeController.handleListEquipes);

// RFS04.2 - Consultar uma equipe específica
router.get('/:id', equipeController.handleGetEquipe);

// RFS04.3 - Editar Equipes
router.put('/:id', equipeController.handleUpdateEquipe);

// RFS04.4 - Excluir/Inativar Equipes
router.delete('/:id', equipeController.handleDeleteEquipe);

// RFS04.5 - Inscrever Equipe em Torneio
router.post('/:id/inscricoes', equipeController.handleInscricaoTorneio);

module.exports = router;
