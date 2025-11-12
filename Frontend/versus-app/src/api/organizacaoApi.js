import api from './axiosConfig';

/**
 * Cria uma nova organização
 * @param {object} organizacaoData - dados da organização
 * @returns {Promise<object>}
 */
export const createOrganizacao = async (organizacaoData) => {
  try {
    const payload = {
      nome: organizacaoData.nome,
      cnpj: organizacaoData.cnpj,
      responsavel: organizacaoData.responsavel,
      telefone: organizacaoData.telefone,
      email: organizacaoData.email,
      endereco: organizacaoData.endereco || undefined,
    };

    const response = await api.post('/organizacoes', payload);
    return response.data;
  } catch (error) {
    console.error('Erro ao criar organização:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Falha ao criar organização');
  }
};

/**
 * Lista organizações com filtros opcionais
 * @param {object} filters - { nome, responsavel, status, order }
 * @returns {Promise<Array>}
 */
export const listOrganizacoes = async (filters = {}) => {
  try {
    const params = {};
    if (filters.nome) params.nome = filters.nome;
    if (filters.responsavel) params.responsavel = filters.responsavel;
    if (filters.status) params.status = filters.status;
    if (filters.order) params.order = filters.order;

    const response = await api.get('/organizacoes', { params });
    return response.data;
  } catch (error) {
    console.error('Erro ao listar organizações:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Falha ao listar organizações');
  }
};

/**
 * Obtém uma organização pelo ID
 * @param {number} id - ID da organização
 * @returns {Promise<object>}
 */
export const getOrganizacaoById = async (id) => {
  try {
    const response = await api.get(`/organizacoes/${id}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao obter organização:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Organização não encontrada');
  }
};

/**
 * Atualiza uma organização
 * @param {number} id - ID da organização
 * @param {object} organizacaoData - dados a serem atualizados
 * @param {string} role - papel do usuário (para validações)
 * @returns {Promise<object>}
 */
export const updateOrganizacao = async (id, organizacaoData, role = 'ADM') => {
  try {
    const payload = {};
    if (organizacaoData.nome !== undefined) payload.nome = organizacaoData.nome;
    if (organizacaoData.responsavel !== undefined) payload.responsavel = organizacaoData.responsavel;
    if (organizacaoData.telefone !== undefined) payload.telefone = organizacaoData.telefone;
    if (organizacaoData.email !== undefined) payload.email = organizacaoData.email;
    if (organizacaoData.endereco !== undefined) payload.endereco = organizacaoData.endereco;
    if (organizacaoData.status !== undefined) payload.status = organizacaoData.status;

    const config = {
      headers: {
        'x-role': role,
      },
    };

    const response = await api.put(`/organizacoes/${id}`, payload, config);
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar organização:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Falha ao atualizar organização');
  }
};

/**
 * Exclui uma organização (física ou lógica)
 * @param {number} id - ID da organização
 * @returns {Promise<object>}
 */
export const deleteOrganizacao = async (id) => {
  try {
    const response = await api.delete(`/organizacoes/${id}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao excluir organização:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Falha ao excluir organização');
  }
};

