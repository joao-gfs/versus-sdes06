-- Limpar banco de dados (CUIDADO: APAGA TUDO)
TRUNCATE TABLE "usuario", "organizacao", "equipe", "atleta", "torneio", "torneio_equipe", "perfil_usuario", "partida" RESTART IDENTITY CASCADE;

-- 1. Usuários
-- Senha padrão para todos: Senha123
-- Hash gerado: $2a$10$Fi8UP11/.8aRjbE71Kt4FORT0WwdNPf6lmIgW/7lcIl8jS5pRT5EC
INSERT INTO "usuario" (nome, email, "senha_hash", status, "created_at", "updated_at") VALUES
('Administrador Sistema', 'admin@versus.com', '$2a$10$Fi8UP11/.8aRjbE71Kt4FORT0WwdNPf6lmIgW/7lcIl8jS5pRT5EC', 'ativo', NOW(), NOW()),
('Carlos Organizador', 'carlos@liga.com', '$2a$10$Fi8UP11/.8aRjbE71Kt4FORT0WwdNPf6lmIgW/7lcIl8jS5pRT5EC', 'ativo', NOW(), NOW()),
('Roberto Diretor', 'roberto@associacao.com', '$2a$10$Fi8UP11/.8aRjbE71Kt4FORT0WwdNPf6lmIgW/7lcIl8jS5pRT5EC', 'ativo', NOW(), NOW()),
('Tite', 'tite@flamengo.com', '$2a$10$Fi8UP11/.8aRjbE71Kt4FORT0WwdNPf6lmIgW/7lcIl8jS5pRT5EC', 'ativo', NOW(), NOW()),
('Mano Menezes', 'mano@corinthians.com', '$2a$10$Fi8UP11/.8aRjbE71Kt4FORT0WwdNPf6lmIgW/7lcIl8jS5pRT5EC', 'ativo', NOW(), NOW()),
('Abel Ferreira', 'abel@palmeiras.com', '$2a$10$Fi8UP11/.8aRjbE71Kt4FORT0WwdNPf6lmIgW/7lcIl8jS5pRT5EC', 'ativo', NOW(), NOW()),
('Dorival Jr', 'dorival@saopaulo.com', '$2a$10$Fi8UP11/.8aRjbE71Kt4FORT0WwdNPf6lmIgW/7lcIl8jS5pRT5EC', 'ativo', NOW(), NOW()),
('Ramón Díaz', 'ramon@vasco.com', '$2a$10$Fi8UP11/.8aRjbE71Kt4FORT0WwdNPf6lmIgW/7lcIl8jS5pRT5EC', 'ativo', NOW(), NOW()),
('Tiago Nunes', 'tiago@botafogo.com', '$2a$10$Fi8UP11/.8aRjbE71Kt4FORT0WwdNPf6lmIgW/7lcIl8jS5pRT5EC', 'ativo', NOW(), NOW()),
('Fernando Diniz', 'diniz@fluminense.com', '$2a$10$Fi8UP11/.8aRjbE71Kt4FORT0WwdNPf6lmIgW/7lcIl8jS5pRT5EC', 'ativo', NOW(), NOW()),
('Fábio Carille', 'carille@santos.com', '$2a$10$Fi8UP11/.8aRjbE71Kt4FORT0WwdNPf6lmIgW/7lcIl8jS5pRT5EC', 'ativo', NOW(), NOW());

-- 2. Organizações
INSERT INTO "organizacao" (nome, cnpj, responsavel, telefone, email, endereco, status, "created_at", "updated_at") VALUES
('Liga Nacional de Futebol', '12.345.678/0001-90', 'Carlos Organizador', '11999999999', 'contato@liga.com', 'Av. Paulista, 1000, SP', 'ativo', NOW(), NOW()),
('Associação de Clubes', '98.765.432/0001-10', 'Roberto Diretor', '21988888888', 'contato@associacao.com', 'Av. Atlântica, 500, RJ', 'ativo', NOW(), NOW());

-- 3. Equipes
-- Org 1 (Liga Nacional)
INSERT INTO "equipe" (nome, "organizacao_id", status, telefone, email, "capacidade_maxima", "created_at", "updated_at") VALUES
('Flamengo', 1, 'ativo', '21999991111', 'futebol@flamengo.com', 22, NOW(), NOW()),
('Corinthians', 1, 'ativo', '11999992222', 'futebol@corinthians.com', 22, NOW(), NOW()),
('Palmeiras', 1, 'ativo', '11999993333', 'futebol@palmeiras.com', 22, NOW(), NOW()),
('São Paulo', 1, 'ativo', '11999994444', 'futebol@saopaulo.com', 22, NOW(), NOW());

-- Org 2 (Associação)
INSERT INTO "equipe" (nome, "organizacao_id", status, telefone, email, "capacidade_maxima", "created_at", "updated_at") VALUES
('Vasco da Gama', 2, 'ativo', '21999995555', 'futebol@vasco.com', 22, NOW(), NOW()),
('Botafogo', 2, 'ativo', '21999996666', 'futebol@botafogo.com', 22, NOW(), NOW()),
('Fluminense', 2, 'ativo', '21999997777', 'futebol@fluminense.com', 22, NOW(), NOW()),
('Santos', 2, 'ativo', '13999998888', 'futebol@santos.com', 22, NOW(), NOW());

-- 4. Perfis de Usuário
INSERT INTO "perfil_usuario" ("usuario_id", papel, "organizacao_id", "equipe_id", "created_at") VALUES
(1, 'ADM', NULL, NULL, NOW()), -- Admin
(2, 'ORG', 1, NULL, NOW()), -- Carlos (Liga)
(3, 'ORG', 2, NULL, NOW()), -- Roberto (Associação)
(4, 'TEC', NULL, 1, NOW()), -- Tite (Flamengo)
(5, 'TEC', NULL, 2, NOW()), -- Mano (Corinthians)
(6, 'TEC', NULL, 3, NOW()), -- Abel (Palmeiras)
(7, 'TEC', NULL, 4, NOW()), -- Dorival (São Paulo)
(8, 'TEC', NULL, 5, NOW()), -- Ramón (Vasco)
(9, 'TEC', NULL, 6, NOW()), -- Tiago (Botafogo)
(10, 'TEC', NULL, 7, NOW()), -- Diniz (Fluminense)
(11, 'TEC', NULL, 8, NOW()); -- Carille (Santos)

-- 5. Torneios
INSERT INTO "torneio" ("organizacao_id", nome, edicao, categoria, formato, "criterios_desempate", "capacidade_maxima", "data_inicio", "data_fim", status, "created_at", "updated_at") VALUES
(1, 'Copa dos Campeões', '2024', 'Adulto', 'Mata-mata', 'Saldo de gols', 4, '2024-01-10', '2024-02-20', 'publicado', NOW(), NOW()),
(2, 'Torneio Regional', '2024', 'Sub-20', 'Liga', 'Confronto direto', 8, '2024-03-01', '2024-06-01', 'em configuração', NOW(), NOW());

-- 6. Inscrição de Equipes (TorneioEquipe)
-- Copa dos Campeões (4 times)
INSERT INTO "torneio_equipe" ("torneio_id", "equipe_id", status) VALUES
(1, 1, 'aprovada'), -- Flamengo
(1, 2, 'aprovada'), -- Corinthians
(1, 3, 'aprovada'), -- Palmeiras
(1, 4, 'aprovada'); -- São Paulo

-- Torneio Regional (4 times)
INSERT INTO "torneio_equipe" ("torneio_id", "equipe_id", status) VALUES
(2, 5, 'aprovada'), -- Vasco
(2, 6, 'aprovada'), -- Botafogo
(2, 7, 'aprovada'), -- Fluminense
(2, 8, 'aprovada'); -- Santos

-- 7. Partidas
-- Copa dos Campeões (Mata-mata, 4 times -> Semifinal e Final)
-- Semifinais (Concluídas)
INSERT INTO "partida" ("torneio_id", fase, grupo, "ordem_na_fase", "equipe_a_id", "equipe_b_id", "vencedor_id", "placar_a", "placar_b", "data_jogo", "local_jogo", status, observacoes) VALUES
(1, 'Semifinal', 'Único', 1, 1, 2, 1, 2, 1, '2024-01-15 16:00:00', 'Maracanã', 'Concluída', 'Flamengo venceu'),
(1, 'Semifinal', 'Único', 2, 3, 4, 3, 1, 0, '2024-01-16 20:00:00', 'Allianz Parque', 'Concluída', 'Palmeiras venceu');

-- Final (Marcada) - Flamengo vs Palmeiras
INSERT INTO "partida" ("torneio_id", fase, grupo, "ordem_na_fase", "equipe_a_id", "equipe_b_id", "vencedor_id", "placar_a", "placar_b", "data_jogo", "local_jogo", status, observacoes) VALUES
(1, 'Final', 'Único', 1, 1, 3, NULL, NULL, NULL, '2024-02-20 16:00:00', 'Maracanã', 'Marcada', 'Grande final');

-- 8. Atletas (Alguns exemplos)
-- Flamengo
INSERT INTO "atleta" ("equipe_id", nome, "data_nascimento", documento, posicao, "numero_camisa", status, "created_at", "updated_at") VALUES
(1, 'Gabriel Barbosa', '1996-08-30', '12345678901', 'Atacante', 10, 'ativo', NOW(), NOW()),
(1, 'Giorgian De Arrascaeta', '1994-06-01', '98765432100', 'Meia', 14, 'ativo', NOW(), NOW()),
(1, 'Bruno Henrique', '1990-12-30', '11122233344', 'Atacante', 27, 'ativo', NOW(), NOW());

-- Palmeiras
INSERT INTO "atleta" ("equipe_id", nome, "data_nascimento", documento, posicao, "numero_camisa", status, "created_at", "updated_at") VALUES
(3, 'Raphael Veiga', '1995-06-19', '55566677788', 'Meia', 23, 'ativo', NOW(), NOW()),
(3, 'Rony', '1995-05-11', '99988877766', 'Atacante', 10, 'ativo', NOW(), NOW());