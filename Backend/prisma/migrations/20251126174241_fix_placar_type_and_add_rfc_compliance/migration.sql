/*
  Warnings:

  - The `placar_a` column on the `partida` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `placar_b` column on the `partida` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "partida" DROP COLUMN "placar_a",
ADD COLUMN     "placar_a" INTEGER,
DROP COLUMN "placar_b",
ADD COLUMN     "placar_b" INTEGER;
