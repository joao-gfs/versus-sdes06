import api from './axiosConfig';

// API de Relatórios
// - GET /relatorio/dashboard: métricas agregadas para gráficos (ADM)
// - GET /relatorio/metrics: contagens gerais (ADM)
// - GET /relatorio/metrics/csv: exportação CSV (ADM)

export const getDashboardMetrics = async () => {
  try {
    const res = await api.get('/relatorio/dashboard');
    return res.data;
  } catch (error) {
    console.error('Erro ao obter métricas de relatório:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Falha ao carregar relatório');
  }
};

/**
 * Obtém as métricas do sistema (contagens)
 * @returns {Promise<object>} Objeto com as contagens de usuários, organizações, torneios, etc.
 */
export const getSystemMetrics = async () => {
  try {
    const response = await api.get('/relatorio/metrics');
    return response.data;
  } catch (error) {
    console.error('Erro ao obter métricas do sistema:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Falha ao obter métricas do sistema');
  }
};

/**
 * Exporta as métricas do sistema para CSV
 * @returns {Promise<Blob>} Arquivo CSV como Blob
 */
export const exportMetricsToCsv = async () => {
  try {
    const response = await api.get('/relatorio/metrics/csv', {
      responseType: 'blob', // Importante para receber arquivo
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao exportar métricas para CSV:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Falha ao exportar métricas para CSV');
  }
};

