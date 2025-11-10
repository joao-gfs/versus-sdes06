# Backend - Versus

Este é o backend do projeto Versus, responsável por toda a lógica de negócio e comunicação com o banco de dados.

## Pré-requisitos

Antes de começar, certifique-se de ter as seguintes ferramentas instaladas em seu ambiente de desenvolvimento:

-   [Node.js](https://nodejs.org/en/) (versão 20.x ou superior)
-   [pnpm](https://pnpm.io/installation) (gerenciador de pacotes)
-   [PostgreSQL](https://www.postgresql.org/download/) (banco de dados)
-   [DBeaver](https://dbeaver.io/download/) (ou outro cliente de banco de dados de sua preferência)

## Configuração do Ambiente

Siga os passos abaixo para configurar o ambiente de desenvolvimento local.

### 1. Clonar o Repositório

Se você ainda não o fez, clone o repositório para a sua máquina local.

### 2. Instalar Dependências

Navegue até a pasta `Backend` e instale as dependências do projeto utilizando o `pnpm`.

```bash
cd Backend
pnpm install
```

### 3. Configurar Variáveis de Ambiente

O projeto utiliza um arquivo `.env` para gerenciar as variáveis de ambiente. Use o arquivo `env.template` como referência e crie um arquivo chamado `.env` na raiz da pasta `Backend`.

**Variáveis necessárias:**

```env
# Database Configuration
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

# Server Configuration
PORT=3000

# JWT Configuration (IMPORTANTE!)
JWT_SECRET=your-secret-key-change-in-production

# Environment
NODE_ENV=development
```

Substitua `USER`, `PASSWORD`, `HOST`, `PORT` e `DATABASE` pelas suas credenciais do PostgreSQL.

**Exemplo:**
```env
DATABASE_URL="postgresql://docker:docker@localhost:5432/versus"
PORT=3000
JWT_SECRET=minha-chave-secreta-super-segura-123456789
NODE_ENV=development
```

⚠️ **IMPORTANTE:** O `JWT_SECRET` é usado para assinar os tokens de autenticação. Use uma chave forte e aleatória em produção! Você pode gerar uma usando:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Criar o Banco de Dados no PostgreSQL

Antes de executar as migrações, o banco de dados especificado na sua `DATABASE_URL` precisa existir. O Prisma irá gerenciar as tabelas, mas não a criação do banco de dados em si.

Você pode criar o banco de dados usando o DBeaver ou qualquer outro cliente SQL. Conecte-se ao seu servidor PostgreSQL e execute o seguinte comando, garantindo que o nome do banco (`versus` neste exemplo) seja o mesmo que você configurou no arquivo `.env`.

```sql
CREATE DATABASE versus;
```

### 5. Executar as Migrações do Banco de Dados

Com o banco de dados PostgreSQL em execução, o arquivo `.env` configurado e o banco de dados criado, execute as migrations para criar as tabelas necessárias.

```bash
pnpm run prisma:migrate
```

### 6. Iniciar o Servidor

Após configurar tudo, inicie o servidor de desenvolvimento:

```bash
pnpm run dev
```

O servidor estará rodando em `http://localhost:3000` (ou na porta especificada no seu `.env`).

---

## 🔐 Autenticação JWT

O sistema utiliza **JSON Web Tokens (JWT)** para autenticação de usuários. Aqui está como funciona:

### Como o Login Funciona

1. **Usuário faz login:** Envia `email` e `password` para `POST /api/usuarios/login`
2. **Backend valida:** Verifica credenciais no banco de dados
3. **Backend gera JWT:** Cria um token contendo `userId`, `email` e `perfis` (roles)
4. **Token retornado:** Frontend recebe `{ user, perfis, token }`
5. **Token armazenado:** Frontend guarda o token e o inclui em requisições futuras
6. **Requisições autenticadas:** Token é enviado no header `Authorization: Bearer <token>`

### Proteção de Rotas

Para proteger rotas que requerem autenticação, use o middleware `authenticateToken`:

```javascript
const { authenticateToken, requireRole } = require('../middlewares/auth.middleware');

// Rota protegida - requer apenas autenticação
router.get('/profile', authenticateToken, usuarioController.getProfile);

// Rota protegida - requer autenticação E papel específico
router.post('/admin/action', authenticateToken, requireRole(['ADM']), adminController.doAction);

// Rota protegida - requer um dos papéis especificados
router.post('/manage', authenticateToken, requireRole(['ADM', 'ORG']), controller.manage);
```

### Middlewares Disponíveis

#### `authenticateToken`
Verifica se o token JWT é válido e adiciona os dados do usuário em `req.user`.

**Uso:**
```javascript
router.get('/protected', authenticateToken, controller.getProtectedData);
```

**Dados disponíveis em `req.user`:**
```javascript
{
  userId: 1,
  email: "usuario@exemplo.com",
  perfis: ["ADM", "ORG"],
  iat: 1234567890,  // issued at
  exp: 1234654290   // expiration
}
```

#### `requireRole(allowedRoles)`
Verifica se o usuário tem um dos papéis permitidos. Deve ser usado **após** `authenticateToken`.

**Uso:**
```javascript
// Apenas administradores
router.post('/admin', authenticateToken, requireRole(['ADM']), controller.adminAction);

// Administradores ou organizadores
router.get('/manage', authenticateToken, requireRole(['ADM', 'ORG']), controller.manage);
```

### Segurança

- ✅ Senhas são hasheadas com bcrypt antes de serem armazenadas
- ✅ Tokens expiram após 24 horas
- ✅ Bloqueio de conta após 4 tentativas falhas de login (15 minutos)
- ✅ JWT_SECRET deve ser forte e aleatório em produção
- ✅ CORS configurado para aceitar apenas origem do frontend

### Papéis (Roles) do Sistema

O sistema possui 3 tipos de papéis:

- **ADM** (Administrador): Acesso total ao sistema
- **ORG** (Organizador): Pode gerenciar torneios e equipes de sua organização
- **TEC** (Técnico): Pode gerenciar atletas de sua equipe

Cada usuário pode ter múltiplos perfis com papéis diferentes.