-- =========================================================
-- 1 TABELAS PRINCIPAIS
-- =========================================================

-- USUÁRIO: Armazena dados de login e identificação
CREATE TABLE usuario (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  email VARCHAR(120) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'ativo',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ORGANIZAÇÃO: Entidades esportivas (federações, clubes-matriz, etc.)
CREATE TABLE organizacao (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(150) UNIQUE NOT NULL,
  cnpj VARCHAR(18) UNIQUE NOT NULL,
  responsavel VARCHAR(120) NOT NULL,
  telefone VARCHAR(20),
  email VARCHAR(120),
  endereco TEXT,
  status VARCHAR(20) DEFAULT 'ativo',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- EQUIPE: Times pertencentes a uma organização
CREATE TABLE equipe (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  organizacao_id INT REFERENCES organizacao(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'ativo',
  telefone VARCHAR(20),
  email VARCHAR(120),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ATLETA: Jogadores que pertencem a uma equipe
CREATE TABLE atleta (
  id SERIAL PRIMARY KEY,
  equipe_id INT NOT NULL REFERENCES equipe(id) ON DELETE CASCADE,
  nome VARCHAR(150) NOT NULL,
  data_nascimento DATE NOT NULL,
  documento VARCHAR(30) UNIQUE,
  posicao VARCHAR(50),
  numero_camisa INT,
  status VARCHAR(20) DEFAULT 'ativo',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- TORNEIO: Competições esportivas criadas por organizações
CREATE TABLE torneio (
  id SERIAL PRIMARY KEY,
  organizacao_id INT NOT NULL REFERENCES organizacao(id) ON DELETE CASCADE,
  nome VARCHAR(150) NOT NULL,
  edicao VARCHAR(10) NOT NULL,
  categoria VARCHAR(30),
  formato VARCHAR(50),
  criterios_desempate TEXT,
  capacidade_maxima INT,
  data_inicio DATE,
  data_fim DATE,
  status VARCHAR(30) DEFAULT 'em configuração',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT torneio_unico UNIQUE (nome, edicao, organizacao_id)
);

-- RELAÇÃO N:N ENTRE TORNEIO E EQUIPE
CREATE TABLE torneio_equipe (
  id SERIAL PRIMARY KEY,
  torneio_id INT NOT NULL REFERENCES torneio(id) ON DELETE CASCADE,
  equipe_id INT NOT NULL REFERENCES equipe(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'inscrita',
  CONSTRAINT equipe_unica_por_torneio UNIQUE (torneio_id, equipe_id)
);

-- PERFIL DE USUÁRIO: Define o papel (ADM, ORG, TEC) e seus vínculos
CREATE TABLE perfil_usuario (
  id SERIAL PRIMARY KEY,
  usuario_id INT NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  papel VARCHAR(10) CHECK (papel IN ('ADM','ORG','TEC')),
  organizacao_id INT REFERENCES organizacao(id),
  equipe_id INT REFERENCES equipe(id),
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT usuario_papel_unico UNIQUE (usuario_id, papel)
);

-- =========================================================
-- 2 TRIGGERS
-- =========================================================

-- Atualiza automaticamente o campo updated_at em alterações
CREATE OR REPLACE FUNCTION atualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_usuario
BEFORE UPDATE ON usuario
FOR EACH ROW EXECUTE FUNCTION atualizar_updated_at();

CREATE TRIGGER trg_update_organizacao
BEFORE UPDATE ON organizacao
FOR EACH ROW EXECUTE FUNCTION atualizar_updated_at();

CREATE TRIGGER trg_update_equipe
BEFORE UPDATE ON equipe
FOR EACH ROW EXECUTE FUNCTION atualizar_updated_at();

CREATE TRIGGER trg_update_torneio
BEFORE UPDATE ON torneio
FOR EACH ROW EXECUTE FUNCTION atualizar_updated_at();

CREATE TRIGGER trg_update_atleta
BEFORE UPDATE ON atleta
FOR EACH ROW EXECUTE FUNCTION atualizar_updated_at();


ALTER TABLE usuario ADD COLUMN failed_attempts integer NOT NULL DEFAULT 0;
ALTER TABLE usuario ADD COLUMN locked_until timestamptz;