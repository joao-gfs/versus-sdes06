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

O projeto utiliza um arquivo `.env` para gerenciar as variáveis de ambiente. Crie um arquivo chamado `.env` na raiz da pasta `Backend` e adicione a seguinte variável:

```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
```

Substitua `USER`, `PASSWORD`, `HOST`, `PORT` e `DATABASE` pelas suas credenciais do PostgreSQL.

**Exemplo:**
```
DATABASE_URL="postgresql://docker:docker@localhost:5432/versus"
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