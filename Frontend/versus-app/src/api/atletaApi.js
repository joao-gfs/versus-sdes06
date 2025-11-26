import api from './axiosConfig';

// Cria um novo atleta
export const createAtleta = async (data) => {
  try {
    const payload = {
      equipeId: Number(data.equipeId),
      nome: data.nome,
      dataNascimento: data.dataNascimento, // DD/MM/AAAA
      documento: data.documento, // CPF
      posicao: data.posicao || undefined,
      numeroCamisa: data.numeroCamisa ? Number(data.numeroCamisa) : undefined,
    };
    const res = await api.post('/atletas', payload);
    return res.data;
  } catch (error) {
    console.error('Erro ao criar atleta:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Falha ao criar atleta');
  }
};

// Lista atletas com filtros
export const listAtletas = async (filters = {}) => {
  try {
    const params = {};
    if (filters.equipeId) params.equipeId = filters.equipeId;
    if (filters.torneioId) params.torneioId = filters.torneioId;
    if (filters.nome) params.nome = filters.nome;
    if (filters.posicao) params.posicao = filters.posicao;
    if (filters.order) params.order = filters.order; // nome|equipe|torneio
    const res = await api.get('/atletas', { params });
    return res.data;
  } catch (error) {
    console.error('Erro ao listar atletas:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Falha ao listar atletas');
  }
};

// Obtém atleta por id
export const getAtletaById = async (id) => {
  try {
    const res = await api.get(`/atletas/${id}`);
    return res.data;
  } catch (error) {
    console.error('Erro ao obter atleta:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Falha ao obter atleta');
  }
};

// Atualiza atleta
export const updateAtleta = async (id, data) => {
  try {
    const payload = {};
    if (data.nome !== undefined) payload.nome = data.nome;
    if (data.posicao !== undefined) payload.posicao = data.posicao || null;
    if (data.equipeId !== undefined) payload.equipeId = Number(data.equipeId);
    if (data.numeroCamisa !== undefined) payload.numeroCamisa = data.numeroCamisa ? Number(data.numeroCamisa) : null;
    if (data.status !== undefined) payload.status = data.status;
    const res = await api.put(`/atletas/${id}`, payload);
    return res.data;
  } catch (error) {
    console.error('Erro ao atualizar atleta:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Falha ao atualizar atleta');
  }
};

// Exclui/Inativa atleta
export const deleteAtleta = async (id) => {
  try {
    const res = await api.delete(`/atletas/${id}`);
    return res.data;
  } catch (error) {
    console.error('Erro ao excluir atleta:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Falha ao excluir atleta');
  }
};
