const relatorioService = require('../services/relatorio.service');

// GET /api/relatorios/metrics - Retorna as contagens do sistema
async function handleGetSystemMetrics(req, res) {
    try {
        const metrics = await relatorioService.getSystemMetrics();
        return res.json(metrics);
    } catch (err) {
        const code = err.statusCode || 500; 
        return res.status(code).json({ error: err.message });
    }
}

// GET /api/relatorios/equipes/csv - Exporta equipes para CSV
async function handleExportMetricsCsv(req, res) {
    try {
        const csvData = await relatorioService.exportMetricsToCsv();

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=relatorio_metricas_${new Date().toISOString().slice(0, 10)}.csv`);

        return res.status(200).send(csvData);
        
    } catch (err) {
        const code = err.statusCode || 500;
        return res.status(code).json({ error: err.message });
    }
}

module.exports = {
    handleGetSystemMetrics,
    handleExportMetricsCsv
};