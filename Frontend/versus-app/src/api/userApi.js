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
