const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth.middleware');
const relatorioController = require('../controllers/relatorio.controller');

// Rotas de Relatório (prefixadas por /relatorio)
// Todas protegidas por JWT e com verificação de papel no controller/service

// GET /api/relatorio/dashboard - métricas agregadas (ADM)
router.get('/dashboard', authenticateToken, relatorioController.handleGetDashboard);

// GET /api/relatorio/metrics - métricas de sistema (ADM)
router.get('/metrics', authenticateToken, relatorioController.handleGetSystemMetrics);

// GET /api/relatorio/metrics/csv - exporta métricas em CSV (ADM)
router.get('/metrics/csv', authenticateToken, relatorioController.handleExportMetricsCsv);

module.exports = router;