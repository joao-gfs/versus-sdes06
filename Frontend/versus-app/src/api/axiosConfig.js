import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});


// Interceptor para adicionar o token e headers customizados
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Adicionar headers customizados do usuário autenticado
  const userStr = localStorage.getItem('user');
  const perfisStr = localStorage.getItem('perfis');
  
  if (userStr && perfisStr) {
    try {
      const user = JSON.parse(userStr);
      const perfis = JSON.parse(perfisStr);
      
      // Adicionar ID do usuário
      if (user.id) {
        config.headers['x-usuario-id'] = user.id;
      }
      
      // Adicionar role primário (primeiro perfil)
      if (perfis.length > 0) {
        config.headers['x-role'] = perfis[0].papel;
        
        // Adicionar organizacaoId se for ORG
        const orgPerfil = perfis.find(p => p.papel === 'ORG');
        if (orgPerfil?.organizacao?.id) {
          config.headers['x-organizacao-id'] = orgPerfil.organizacao.id;
        }
        
        // Adicionar equipeId se for TEC
        const tecPerfil = perfis.find(p => p.papel === 'TEC');
        if (tecPerfil?.equipe?.id) {
          config.headers['x-equipe-id'] = tecPerfil.equipe.id;
        }
      }
    } catch (error) {
      console.error('Erro ao adicionar headers customizados:', error);
    }
  }
  
  return config;
});


export default api;