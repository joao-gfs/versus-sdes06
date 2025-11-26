const express = require('express');
const router = express.Router();
const atletaController = require('../controllers/atleta.controller');

// POST /api/atletas - cadastra um novo atleta
router.post('/', atletaController.handleCreateAtleta);

// GET /api/atletas - consulta atletas (filtros: equipeId, torneioId, nome, posicao, order)
router.get('/', atletaController.handleListAtletas);

// GET /api/atletas/:id - obter atleta por id
router.get('/:id', atletaController.handleGetAtletaById);

// PUT /api/atletas/:id - atualizar atleta
router.put('/:id', atletaController.handleUpdateAtleta);

// DELETE /api/atletas/:id - excluir/inativar atleta
router.delete('/:id', atletaController.handleDeleteAtleta);

module.exports = router;
