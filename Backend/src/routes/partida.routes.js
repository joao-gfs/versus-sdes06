const express = require('express');
const router = express.Router();
const partidaController = require('../controllers/partida.controller');

// PUT /api/partidas/:id/registrar - registra o resultado de uma partida
router.put('/:id/registrar', partidaController.handleRegistrarPartida);

// GET /api/partidas - consulta partidas (filtros por torneioId, fase, status)
router.get('/', partidaController.handleListPartidas);

module.exports = router;