-- AlterTable
ALTER TABLE "equipe" ADD COLUMN     "capacidade_maxima" INTEGER;

-- CreateTable
CREATE TABLE "partida" (
    "id" SERIAL NOT NULL,
    "torneio_id" INTEGER NOT NULL,
    "fase" VARCHAR(50) NOT NULL,
    "grupo" VARCHAR(50) NOT NULL,
    "ordem_na_fase" INTEGER NOT NULL,
    "equipe_a_id" INTEGER,
    "equipe_b_id" INTEGER,
    "vencedor_id" INTEGER,
    "placar_a" VARCHAR(10),
    "placar_b" VARCHAR(10),
    "data_jogo" TIMESTAMP(6),
    "local_jogo" VARCHAR(150),
    "status" TEXT NOT NULL DEFAULT 'Marcada',
    "observacoes" TEXT,

    CONSTRAINT "partida_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "partida_torneio_id_fase_grupo_ordem_na_fase_key" ON "partida"("torneio_id", "fase", "grupo", "ordem_na_fase");

-- AddForeignKey
ALTER TABLE "partida" ADD CONSTRAINT "partida_torneio_id_fkey" FOREIGN KEY ("torneio_id") REFERENCES "torneio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partida" ADD CONSTRAINT "partida_equipe_a_id_fkey" FOREIGN KEY ("equipe_a_id") REFERENCES "equipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partida" ADD CONSTRAINT "partida_equipe_b_id_fkey" FOREIGN KEY ("equipe_b_id") REFERENCES "equipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partida" ADD CONSTRAINT "partida_vencedor_id_fkey" FOREIGN KEY ("vencedor_id") REFERENCES "equipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;
