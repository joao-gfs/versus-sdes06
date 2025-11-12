-- CreateTable
CREATE TABLE "usuario" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "failed_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizacao" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "responsavel" TEXT NOT NULL,
    "telefone" TEXT,
    "email" TEXT,
    "endereco" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipe" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "organizacao_id" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "telefone" TEXT,
    "email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atleta" (
    "id" SERIAL NOT NULL,
    "equipe_id" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "data_nascimento" TIMESTAMP(3) NOT NULL,
    "documento" TEXT,
    "posicao" TEXT,
    "numero_camisa" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "atleta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "torneio" (
    "id" SERIAL NOT NULL,
    "organizacao_id" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "edicao" TEXT NOT NULL,
    "categoria" TEXT,
    "formato" TEXT,
    "criterios_desempate" TEXT,
    "capacidade_maxima" INTEGER,
    "data_inicio" TIMESTAMP(3),
    "data_fim" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'em configuração',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "torneio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "torneio_equipe" (
    "id" SERIAL NOT NULL,
    "torneio_id" INTEGER NOT NULL,
    "equipe_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'inscrita',

    CONSTRAINT "torneio_equipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perfil_usuario" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "papel" VARCHAR(10) NOT NULL,
    "organizacao_id" INTEGER,
    "equipe_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "perfil_usuario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "organizacao_nome_key" ON "organizacao"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "organizacao_cnpj_key" ON "organizacao"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "atleta_documento_key" ON "atleta"("documento");

-- CreateIndex
CREATE UNIQUE INDEX "torneio_nome_edicao_organizacao_id_key" ON "torneio"("nome", "edicao", "organizacao_id");

-- CreateIndex
CREATE UNIQUE INDEX "torneio_equipe_torneio_id_equipe_id_key" ON "torneio_equipe"("torneio_id", "equipe_id");

-- CreateIndex
CREATE UNIQUE INDEX "perfil_usuario_usuario_id_papel_key" ON "perfil_usuario"("usuario_id", "papel");

-- AddForeignKey
ALTER TABLE "equipe" ADD CONSTRAINT "equipe_organizacao_id_fkey" FOREIGN KEY ("organizacao_id") REFERENCES "organizacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atleta" ADD CONSTRAINT "atleta_equipe_id_fkey" FOREIGN KEY ("equipe_id") REFERENCES "equipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "torneio" ADD CONSTRAINT "torneio_organizacao_id_fkey" FOREIGN KEY ("organizacao_id") REFERENCES "organizacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "torneio_equipe" ADD CONSTRAINT "torneio_equipe_torneio_id_fkey" FOREIGN KEY ("torneio_id") REFERENCES "torneio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "torneio_equipe" ADD CONSTRAINT "torneio_equipe_equipe_id_fkey" FOREIGN KEY ("equipe_id") REFERENCES "equipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perfil_usuario" ADD CONSTRAINT "perfil_usuario_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perfil_usuario" ADD CONSTRAINT "perfil_usuario_organizacao_id_fkey" FOREIGN KEY ("organizacao_id") REFERENCES "organizacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perfil_usuario" ADD CONSTRAINT "perfil_usuario_equipe_id_fkey" FOREIGN KEY ("equipe_id") REFERENCES "equipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;
