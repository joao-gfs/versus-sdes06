const relatorioService = require('../services/relatorio.service');

// Controlador de Relatórios
// GET /api/relatorio/dashboard - retorna métricas agregadas para gráficos (ADM)
async function handleGetDashboard(req, res) {
  try {
    const roleHeader = (req.headers['x-role'] || '').toString().toUpperCase();
    const requester = { role: roleHeader || (req.user && req.user.perfis ? req.user.perfis[0] : '') };
    const data = await relatorioService.getDashboardMetrics(requester);
    return res.json(data);
  } catch (err) {
    const code = err.statusCode || 400;
    return res.status(code).json({ error: err.message });
  }
}

// GET /api/relatorio/metrics - Retorna as contagens do sistema (ADM)
async function handleGetSystemMetrics(req, res) {
  try {
    const roleHeader = (req.headers['x-role'] || '').toString().toUpperCase();
    const role = roleHeader || (req.user && req.user.perfis ? req.user.perfis[0] : '');
    if (String(role).toUpperCase() !== 'ADM') {
      return res.status(403).json({ error: 'Apenas administradores podem acessar relatórios' });
    }
    const metrics = await relatorioService.getSystemMetrics();
    return res.json(metrics);
  } catch (err) {
    const code = err.statusCode || 500;
    return res.status(code).json({ error: err.message });
  }
}

// GET /api/relatorio/metrics/csv - Exporta métricas para CSV (ADM)
async function handleExportMetricsCsv(req, res) {
  try {
    const roleHeader = (req.headers['x-role'] || '').toString().toUpperCase();
    const role = roleHeader || (req.user && req.user.perfis ? req.user.perfis[0] : '');
    if (String(role).toUpperCase() !== 'ADM') {
      return res.status(403).json({ error: 'Apenas administradores podem acessar relatórios' });
    }

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
  handleGetDashboard,
  handleGetSystemMetrics,
  handleExportMetricsCsv,
};