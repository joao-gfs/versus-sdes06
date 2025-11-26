const express = require('express');
const router = express.Router();
const relatorioController = require('../controllers/relatorio.controller');

// GET /api/relatorios/metrics
router.get('/metrics', relatorioController.handleGetSystemMetrics);

// GET /api/relatorios/equipes/csv - Exportação de Equipes (CSV)
router.get('/metrics/csv', relatorioController.handleExportMetricsCsv);

module.exports = router;