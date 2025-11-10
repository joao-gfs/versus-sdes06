# Frontend - Versus App

Frontend do sistema de gestão de torneios esportivos, desenvolvido com React, Vite e Tailwind CSS.

## 🚀 Tecnologias

- **React 19** - Biblioteca para construção da interface
- **Vite 7** - Build tool e dev server
- **React Router DOM** - Roteamento
- **Axios** - Cliente HTTP
- **Tailwind CSS** - Framework de estilização
- **Context API** - Gerenciamento de estado de autenticação

## 📋 Pré-requisitos

- [Node.js](https://nodejs.org/) (versão 20.x ou superior)
- [npm](https://www.npmjs.com/) ou [pnpm](https://pnpm.io/)
- Backend rodando em `http://localhost:3000`

## ⚙️ Configuração

### 1. Instalar Dependências

```bash
cd Frontend/versus-app
npm install
# ou
pnpm install
```

### 2. Configurar Variáveis de Ambiente

Use o arquivo `env.template` como referência e crie um arquivo `.env` na raiz de `Frontend/versus-app/`:

```env
# Backend API URL
VITE_API_BASE_URL=http://localhost:3000/api

# Environment
NODE_ENV=development
```

⚠️ **IMPORTANTE:** O prefixo `VITE_` é obrigatório para que o Vite exponha a variável no código.

### 3. Iniciar o Servidor de Desenvolvimento

```bash
npm run dev
# ou
pnpm run dev
```

O app estará disponível em `http://localhost:5173`

---

## 🔐 Sistema de Autenticação

O frontend implementa um sistema completo de autenticação com as seguintes features:

### Context API - AuthContext

O `AuthContext` gerencia o estado de autenticação global da aplicação:

```javascript
import { useAuth } from './context/AuthContext';

function MyComponent() {
  const { user, token, isAuthenticated, login, logout } = useAuth();
  
  // user: dados do usuário logado
  // token: JWT token
  // isAuthenticated: boolean indicando se está autenticado
  // login(userData, token): função para fazer login
  // logout(): função para fazer logout
}
```

### Fluxo de Autenticação

1. **Login:**
   - Usuário preenche email e senha
   - Dados são enviados para `POST /api/usuarios/login`
   - Backend retorna `{ user, perfis, token }`
   - Token e dados do usuário são salvos no `localStorage` e no Context
   - Usuário é redirecionado para a página inicial

2. **Persistência:**
   - Token e dados do usuário são salvos no `localStorage`
   - Ao recarregar a página, o AuthContext restaura os dados automaticamente

3. **Requisições Autenticadas:**
   - O axios interceptor adiciona automaticamente o header `Authorization: Bearer <token>` em todas as requisições
   - Configurado em `src/api/axiosConfig.js`

4. **Logout:**
   - Remove token e dados do usuário do `localStorage` e Context
   - Redireciona para a página de login

### Rotas Protegidas

Use o componente `ProtectedRoute` para proteger páginas que requerem autenticação:

```javascript
import ProtectedRoute from './components/common/ProtectedRoute';

<Route 
  path="/dashboard" 
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  } 
/>
```

Se o usuário não estiver autenticado, será redirecionado automaticamente para `/login`.

### Estrutura de Arquivos - Autenticação

```
src/
├── api/
│   ├── axiosConfig.js      # Configuração do Axios + interceptors
│   └── authApi.js          # Funções de autenticação (login, register)
├── context/
│   └── AuthContext.jsx     # Context API para autenticação
├── components/
│   └── common/
│       └── ProtectedRoute.jsx  # HOC para rotas protegidas
└── pages/
    └── LoginPage.jsx       # Página de login
```

---

## 📁 Estrutura do Projeto

```
Frontend/versus-app/
├── public/             # Arquivos estáticos
├── src/
│   ├── api/           # Configuração de API e chamadas HTTP
│   ├── components/    # Componentes reutilizáveis
│   ├── context/       # Contexts (AuthContext, etc)
│   ├── pages/         # Páginas da aplicação
│   ├── styles/        # Arquivos de estilo globais
│   ├── App.jsx        # Componente principal com rotas
│   └── main.jsx       # Entry point da aplicação
├── .env               # Variáveis de ambiente (não comitado)
├── env.template       # Template de variáveis de ambiente
├── package.json       # Dependências e scripts
├── vite.config.js     # Configuração do Vite
└── tailwind.config.js # Configuração do Tailwind CSS
```

---

## 🛠️ Scripts Disponíveis

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build de produção
npm run preview

# Lint do código
npm run lint
```

---

## 🎨 Estilização com Tailwind CSS

O projeto usa Tailwind CSS v4 para estilização. Classes utilitárias podem ser usadas diretamente nos componentes:

```javascript
<button className="w-full px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
  Entrar
</button>
```

---

## 🔗 Integração com Backend

### Configuração da API

A URL base da API é configurada através da variável de ambiente `VITE_API_BASE_URL`:

```javascript
// src/api/axiosConfig.js
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // http://localhost:3000/api
});
```

### Exemplo de Chamada à API

```javascript
import api from './api/axiosConfig';

// GET request (token adicionado automaticamente)
const response = await api.get('/usuarios/profile');

// POST request
const response = await api.post('/usuarios/createUser', {
  nome: 'João Silva',
  email: 'joao@exemplo.com',
  senha: 'senha123',
  papel: 'TEC'
});
```

---

## 📝 Notas Importantes

1. **Token Storage:** O token JWT é armazenado no `localStorage` com a chave `token`
2. **Token Auto-Refresh:** Atualmente não implementado - tokens expiram em 24h
3. **CORS:** Certifique-se de que o backend está configurado para aceitar requisições de `http://localhost:5173`
4. **Environment Variables:** Sempre use o prefixo `VITE_` para variáveis que precisam ser acessadas no código

---

## 🐛 Troubleshooting

### Erro: "Network Error" ao fazer requisições

- Verifique se o backend está rodando em `http://localhost:3000`
- Verifique se o CORS está configurado corretamente no backend
- Confirme que a variável `VITE_API_BASE_URL` está definida no `.env`

### Erro: "Token inválido ou expirado"

- Faça logout e login novamente
- Verifique se o `JWT_SECRET` no backend está configurado
- Confirme que o token não expirou (24h de validade)

### Página recarrega e perde autenticação

- Verifique se o `localStorage` está funcionando
- Confirme que o `AuthContext` está envolvendo toda a aplicação no `main.jsx`

