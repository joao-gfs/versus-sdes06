// src/services/userApi.js
import api from './api'; // Importa a instância base

/**
 * Cria um novo usuário.
 * @param {object} usuarioData - Os dados do usuário a ser criado.
 */
export const criarUsuario = async (usuarioData) => {
  try {
    const response = await api.post('/createUser', usuarioData);
    return response.data;
  } catch (error) {
    console.error('Erro ao criar usuário:', error.response?.data?.error || error.message);
    throw error.response?.data || new Error(error.message);
  }
};