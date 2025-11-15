import api from './axiosConfig';

/**
 * Cria um novo usuário (requer autenticação)
 * @param {object} userData - dados do usuário
 * @param {object} requester - informações do solicitante (role, organizacaoId, equipeId)
 * @returns {Promise<object>}
 */
export const createUser = async (userData, requester) => {
  try {
    const payload = {
      nome: userData.name,
      email: userData.email,
      senha: userData.password,
      papel: userData.role,
      organizacaoId: userData.organizacaoId ? parseInt(userData.organizacaoId) : undefined,
      equipeId: userData.equipeId ? parseInt(userData.equipeId) : undefined,
      requesterId: requester.id,
      requesterRole: requester.role,
      requesterOrganizacaoId: requester.organizacaoId,
      requesterEquipeId: requester.equipeId,
    };

    const response = await api.post('/usuarios/createUser', payload);
    return response.data;
  } catch (error) {
    console.error('Erro ao criar usuário:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Falha ao criar usuário');
  }
};

/**
 * Lista usuários ativos (para seleção em formulários)
 * @param {object} filters - filtros opcionais (nome)
 * @param {object} requester - informações do solicitante (role)
 * @returns {Promise<Array>}
 */
export const listUsers = async (filters = {}, requester = {}) => {
  try {
    const params = {};
    if (filters.nome) params.nome = filters.nome;
    if (filters.status) params.status = filters.status;
    if (requester.role) params.requesterRole = requester.role;

    const response = await api.get('/usuarios', { params });
    return response.data;
  } catch (error) {
    console.error('Erro ao listar usuários:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Falha ao listar usuários');
  }
};

/**
 * Atualiza um usuário existente
 * @param {string|number} userId - ID do usuário a ser atualizado
 * @param {object} updateData - dados a serem atualizados (name, email, password, status, role, etc.)
 * @param {object} requester - informações do solicitante (id, role, organizacaoId, equipeId)
 * @returns {Promise<object>}
 */
export const updateUser = async (userId, updateData, requester) => {
  try {
    // Constrói o payload apenas com os campos fornecidos,
    // seguindo o padrão de mapeamento do 'createUser'
    const payload = {};
    if (updateData.name !== undefined) payload.nome = updateData.name;
    if (updateData.email !== undefined) payload.email = updateData.email;
    if (updateData.password !== undefined) payload.senha = updateData.password;
    if (updateData.status !== undefined) payload.status = updateData.status;
    if (updateData.role !== undefined) payload.papel = updateData.role;
    
    // Permite definir como null/undefined
    if (updateData.organizacaoId !== undefined) {
      payload.organizacaoId = updateData.organizacaoId ? parseInt(updateData.organizacaoId) : null;
    }
    if (updateData.equipeId !== undefined) {
      payload.equipeId = updateData.equipeId ? parseInt(updateData.equipeId) : null;
    }

    // Adiciona o 'requester' ao corpo da requisição, assim como no 'createUser'
    payload.requesterId = requester.id;
    payload.requesterRole = requester.role;
    payload.requesterOrganizacaoId = requester.organizacaoId;
    payload.requesterEquipeId = requester.equipeId;

    // Assumindo rota PUT /usuarios/:id
    const response = await api.put(`/usuarios/${userId}`, payload);
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Falha ao atualizar usuário');
  }
};