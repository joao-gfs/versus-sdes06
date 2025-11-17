import api from './axiosConfig';

/**
 * Cria uma nova equipe
 * @param {object} equipeData - dados da equipe
 * @returns {Promise<object>}
 */
export const createEquipe = async (equipeData) => {
  try {
    const payload = {
      nome: equipeData.nome,
      tecnicoId: equipeData.tecnicoId,
      telefone: equipeData.telefone,
      email: equipeData.email,
      capacidadeMaxima: equipeData.capacidadeMaxima || undefined,
      organizacaoId: equipeData.organizacaoId || undefined,
    };

    const response = await api.post('/equipes', payload);
    return response.data;
  } catch (error) {
    console.error('Erro ao criar equipe:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Falha ao criar equipe');
  }
};

/**
 * Lista equipes com filtros opcionais
 * @param {object} filters - { nome, tecnico, status, order }
 * @returns {Promise<Array>}
 */
export const listEquipes = async (filters = {}) => {
  try {
    const params = {};
    if (filters.nome) params.nome = filters.nome;
    if (filters.tecnico) params.tecnico = filters.tecnico;
    if (filters.status) params.status = filters.status;
    if (filters.order) params.order = filters.order;

    const response = await api.get('/equipes', { params });
    return response.data;
  } catch (error) {
    console.error('Erro ao listar equipes:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Falha ao listar equipes');
  }
};

/**
 * Obtém uma equipe pelo ID
 * @param {number} id - ID da equipe
 * @returns {Promise<object>}
 */
export const getEquipeById = async (id) => {
  try {
    const response = await api.get(`/equipes/${id}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao obter equipe:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Falha ao obter equipe');
  }
};

/**
 * Atualiza uma equipe
 * @param {number} id - ID da equipe
 * @param {object} equipeData - dados atualizados
 * @returns {Promise<object>}
 */
export const updateEquipe = async (id, equipeData) => {
  try {
    const payload = {};
    if (equipeData.nome !== undefined) payload.nome = equipeData.nome;
    if (equipeData.tecnicoId !== undefined) payload.tecnicoId = equipeData.tecnicoId;
    if (equipeData.telefone !== undefined) payload.telefone = equipeData.telefone;
    if (equipeData.email !== undefined) payload.email = equipeData.email;
    if (equipeData.capacidadeMaxima !== undefined) payload.capacidadeMaxima = equipeData.capacidadeMaxima;

    const response = await api.put(`/equipes/${id}`, payload);
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar equipe:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Falha ao atualizar equipe');
  }
};

/**
 * Exclui uma equipe
 * @param {number} id - ID da equipe
 * @returns {Promise<object>}
 */
export const deleteEquipe = async (id) => {
  try {
    const response = await api.delete(`/equipes/${id}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao excluir equipe:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Falha ao excluir equipe');
  }
};

/**
 * Inscreve uma equipe em um torneio
 * @param {number} torneioId - ID do torneio
 * @param {number} equipeId - ID da equipe
 * @returns {Promise<object>}
 */
export const inscreverEquipeEmTorneio = async (torneioId, equipeId) => {
  try {
    const payload = {
      torneioId,
      equipeId,
    };

    const response = await api.post('/equipes/inscrever', payload);
    return response.data;
  } catch (error) {
    console.error('Erro ao inscrever equipe:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Falha ao inscrever equipe em torneio');
  }
};
