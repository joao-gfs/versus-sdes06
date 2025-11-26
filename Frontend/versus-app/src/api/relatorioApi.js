import api from './axiosConfig';

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

