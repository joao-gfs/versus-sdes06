import api from './axiosConfig';

/**
 * Lista partidas com filtros opcionais
 * @param {object} filters - { torneioId, equipe, status, dataPartida }
 * @param {string} role - papel do usuário
 * @param {number} orgId - ID da organização do usuário
 * @param {number} equipeId - ID da equipe do usuário (para TEC)
 * @returns {Promise<Array>}
 */
export const listPartidas = async (filters = {}, role = '', orgId = null, equipeId = null) => {
    try {
        const params = {};
        if (filters.torneioId) params.torneioId = filters.torneioId;
        if (filters.equipe) params.equipe = filters.equipe;
        if (filters.status) params.status = filters.status;
        if (filters.dataPartida) params.dataPartida = filters.dataPartida;

        const config = {
            params,
            headers: {},
        };

        if (role) {
            config.headers['x-role'] = role;
        }
        if (orgId) {
            config.headers['x-org-id'] = orgId;
        }
        if (equipeId) {
            config.headers['x-equipe-id'] = equipeId;
        }

        const response = await api.get('/partidas', config);
        return response.data;
    } catch (error) {
        console.error('Erro ao listar partidas:', error.response?.data || error.message);
        throw new Error(error.response?.data?.error || 'Falha ao listar partidas');
    }
};

/**
 * Registra ou atualiza o resultado de uma partida
 * @param {number} id - ID da partida
 * @param {object} data - { golsMandante, golsVisitante, status, dataPartida, observacoes }
 * @param {string} role - papel do usuário
 * @returns {Promise<object>}
 */
export const registrarPartida = async (id, data, role = '') => {
    try {
        const payload = {};
        if (data.golsMandante !== undefined) payload.golsMandante = data.golsMandante;
        if (data.golsVisitante !== undefined) payload.golsVisitante = data.golsVisitante;
        if (data.status !== undefined) payload.status = data.status;
        if (data.dataPartida !== undefined) payload.dataPartida = data.dataPartida;
        if (data.observacoes !== undefined) payload.observacoes = data.observacoes;

        const config = {
            headers: {},
        };

        if (role) {
            config.headers['x-role'] = role;
        }

        const response = await api.put(`/partidas/${id}/registrar`, payload, config);
        return response.data;
    } catch (error) {
        console.error('Erro ao registrar partida:', error.response?.data || error.message);
        throw new Error(error.response?.data?.error || 'Falha ao registrar partida');
    }
};

/**
 * Obtém uma partida pelo ID
 * @param {number} id - ID da partida
 * @returns {Promise<object>}
 */
export const getPartidaById = async (id) => {
    try {
        const response = await api.get(`/partidas/${id}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao obter partida:', error.response?.data || error.message);
        throw new Error(error.response?.data?.error || 'Partida não encontrada');
    }
};
