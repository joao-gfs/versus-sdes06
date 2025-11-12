import api from './axiosConfig'; // Usando a configuração centralizada

/**
 * Envia credenciais para a rota de login
 * @param {object} credentials - { email, password }
 * @returns {Promise<object>} - { user, token }
 */
export const loginUser = async (credentials) => {
  try {
    // Usando seu endpoint '/login'
    const response = await api.post('/usuarios/login', credentials);
    return response.data; // Espera-se { user, token }
  } catch (error) {
    console.error('Erro no login:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Falha no login');
  }
};

/**
 * Registra um novo usuário
 * @param {object} userData - { email, password, name }
 */
export const registerUser = async (userData) => {
  try {
    // Usando seu endpoint '/createUser'
    const response = await api.post('/usuarios/createUser', userData);
    return response.data;
  } catch (error) {
    console.error('Erro ao criar usuário:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Falha no registro');
  }
};
