import api from './axiosConfig';

/**
 * Cria um novo torneio
 * @param {object} torneioData - dados do torneio
 * @returns {Promise<object>}
 */
export const createTorneio = async (torneioData) => {
  try {
    const payload = {
      organizacaoId: torneioData.organizacaoId,
      nome: torneioData.nome,
      edicao: torneioData.edicao,
      categoria: torneioData.categoria,
      formato: torneioData.formato,
      criteriosDesempate: torneioData.criteriosDesempate || undefined,
      capacidadeMaxima: torneioData.capacidadeMaxima || undefined,
      dataInicio: torneioData.dataInicio,
      dataFim: torneioData.dataFim,
    };

    const response = await api.post('/torneios', payload);
    return response.data;
  } catch (error) {
    console.error('Erro ao criar torneio:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Falha ao criar torneio');
  }
};

/**
 * Lista torneios com filtros opcionais
 * @param {object} filters - { organizacaoId, nome, categoria, edicao, status, order }
 * @param {string} role - papel do usuário (para filtrar visualizações)
 * @param {number} orgId - ID da organização do usuário (para filtrar visualizações)
 * @returns {Promise<Array>}
 */
export const listTorneios = async (filters = {}, role = '', orgId = null) => {
  try {
    const params = {};
    if (filters.organizacaoId) params.organizacaoId = filters.organizacaoId;
    if (filters.nome) params.nome = filters.nome;
    if (filters.categoria) params.categoria = filters.categoria;
    if (filters.edicao) params.edicao = filters.edicao;
    if (filters.status) params.status = filters.status;
    if (filters.order) params.order = filters.order;

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

    const response = await api.get('/torneios', config);
    return response.data;
  } catch (error) {
    console.error('Erro ao listar torneios:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Falha ao listar torneios');
  }
};

/**
 * Obtém um torneio pelo ID
 * @param {number} id - ID do torneio
 * @returns {Promise<object>}
 */
export const getTorneioById = async (id) => {
  try {
    const response = await api.get(`/torneios/${id}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao obter torneio:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Torneio não encontrado');
  }
};

/**
 * Atualiza um torneio
 * @param {number} id - ID do torneio
 * @param {object} torneioData - dados a serem atualizados
 * @param {string} role - papel do usuário (para validações)
 * @param {number} orgId - ID da organização do usuário
 * @returns {Promise<object>}
 */
export const updateTorneio = async (id, torneioData, role = '', orgId = null) => {
  try {
    const payload = {};
    if (torneioData.status !== undefined) payload.status = torneioData.status;
    if (torneioData.formato !== undefined) payload.formato = torneioData.formato;
    if (torneioData.categoria !== undefined) payload.categoria = torneioData.categoria;
    if (torneioData.capacidadeMaxima !== undefined) payload.capacidadeMaxima = torneioData.capacidadeMaxima;
    if (torneioData.criteriosDesempate !== undefined) payload.criteriosDesempate = torneioData.criteriosDesempate;
    if (torneioData.dataInicio !== undefined) payload.dataInicio = torneioData.dataInicio;
    if (torneioData.dataFim !== undefined) payload.dataFim = torneioData.dataFim;

    const config = {
      headers: {},
    };

    if (role) {
      config.headers['x-role'] = role;
    }
    if (orgId) {
      config.headers['x-org-id'] = orgId;
    }

    const response = await api.put(`/torneios/${id}`, payload, config);
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar torneio:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Falha ao atualizar torneio');
  }
};

/**
 * Exclui um torneio (física ou lógica)
 * @param {number} id - ID do torneio
 * @param {string} role - papel do usuário
 * @param {number} orgId - ID da organização do usuário
 * @returns {Promise<object>}
 */
export const deleteTorneio = async (id, role = '', orgId = null) => {
  try {
    const config = {
      headers: {},
    };

    if (role) {
      config.headers['x-role'] = role;
    }
    if (orgId) {
      config.headers['x-org-id'] = orgId;
    }

    const response = await api.delete(`/torneios/${id}`, config);
    return response.data;
  } catch (error) {
    console.error('Erro ao excluir torneio:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Falha ao excluir torneio');
  }
};

/**
 * Sorteia o chaveamento de um torneio
 * @param {number} id - ID do torneio
 * @param {string} role - papel do usuário
 * @param {number} orgId - ID da organização do usuário
 * @returns {Promise<object>}
 */
export const sortearChaveamento = async (id, role = '', orgId = null) => {
  try {
    const config = {
      headers: {},
    };

    if (role) {
      config.headers['x-role'] = role;
    }
    if (orgId) {
      config.headers['x-org-id'] = orgId;
    }

    const response = await api.post(`/torneios/${id}/sorteio`, {}, config);
    return response.data;
  } catch (error) {
    console.error('Erro ao sortear chaveamento:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Falha ao sortear chaveamento');
  }
};

/**
 * Reverte o sorteio de chaveamento de um torneio
 * @param {number} id - ID do torneio
 * @param {string} role - papel do usuário
 * @param {number} orgId - ID da organização do usuário
 * @returns {Promise<object>}
 */
export const reverterSorteio = async (id, role = '', orgId = null) => {
  try {
    const config = {
      headers: {},
    };

    if (role) {
      config.headers['x-role'] = role;
    }
    if (orgId) {
      config.headers['x-org-id'] = orgId;
    }

    const response = await api.post(`/torneios/${id}/reverter-sorteio`, {}, config);
    return response.data;
  } catch (error) {
    console.error('Erro ao reverter sorteio:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Falha ao reverter sorteio');
  }
};

/**
 * Consulta o chaveamento de um torneio
 * @param {number} id - ID do torneio
 * @param {object} filters - { equipe, ordenacao }
 * @returns {Promise<object>}
 */
export const consultarChaveamento = async (id, filters = {}) => {
  try {
    const params = {};
    if (filters.equipe) params.equipe = filters.equipe;
    if (filters.ordenacao) params.ordenacao = filters.ordenacao;

    const response = await api.get(`/torneios/${id}/chaveamento`, { params });
    return response.data;
  } catch (error) {
    console.error('Erro ao consultar chaveamento:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Falha ao consultar chaveamento');
  }
};