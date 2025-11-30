/*
  Warnings:

  - You are about to drop the column `nombre` on the `Kit` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `Piece` table. All the data in the column will be lost.
  - You are about to drop the column `kitId` on the `Piece` table. All the data in the column will be lost.
  - You are about to drop the column `sousAssemblageId` on the `Piece` table. All the data in the column will be lost.
  - You are about to drop the column `sousSousAssemblageId` on the `Piece` table. All the data in the column will be lost.
  - You are about to drop the column `nombre` on the `SousAssemblage` table. All the data in the column will be lost.
  - You are about to drop the column `nombre` on the `SousSousAssemblage` table. All the data in the column will be lost.
  - Made the column `borneId` on table `Kit` required. This step will fail if there are existing NULL values in that column.
  - Made the column `borneId` on table `Piece` required. This step will fail if there are existing NULL values in that column.
  - Made the column `borneId` on table `SousAssemblage` required. This step will fail if there are existing NULL values in that column.
  - Made the column `borneId` on table `SousSousAssemblage` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."Kit" DROP CONSTRAINT "Kit_borneId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Piece" DROP CONSTRAINT "Piece_borneId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Piece" DROP CONSTRAINT "Piece_createdById_fkey";

-- DropForeignKey
ALTER TABLE "public"."Piece" DROP CONSTRAINT "Piece_kitId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Piece" DROP CONSTRAINT "Piece_sousAssemblageId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Piece" DROP CONSTRAINT "Piece_sousSousAssemblageId_fkey";

-- DropForeignKey
ALTER TABLE "public"."SousAssemblage" DROP CONSTRAINT "SousAssemblage_borneId_fkey";

-- DropForeignKey
ALTER TABLE "public"."SousSousAssemblage" DROP CONSTRAINT "SousSousAssemblage_borneId_fkey";

-- DropIndex
DROP INDEX "public"."Kit_nom_key";

-- DropIndex
DROP INDEX "public"."Piece_nom_key";

-- DropIndex
DROP INDEX "public"."SousAssemblage_nom_key";

-- DropIndex
DROP INDEX "public"."SousSousAssemblage_nom_key";

-- AlterTable
ALTER TABLE "public"."Kit" DROP COLUMN "nombre",
ALTER COLUMN "borneId" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."Piece" DROP COLUMN "createdById",
DROP COLUMN "kitId",
DROP COLUMN "sousAssemblageId",
DROP COLUMN "sousSousAssemblageId",
ALTER COLUMN "borneId" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."SousAssemblage" DROP COLUMN "nombre",
ALTER COLUMN "borneId" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."SousSousAssemblage" DROP COLUMN "nombre",
ALTER COLUMN "borneId" SET NOT NULL;

-- CreateTable
CREATE TABLE "public"."SousAssemblagePiece" (
    "id" SERIAL NOT NULL,
    "sousAssemblageId" INTEGER NOT NULL,
    "pieceId" INTEGER NOT NULL,
    "nombre" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "SousAssemblagePiece_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SousSousAssemblagePiece" (
    "id" SERIAL NOT NULL,
    "sousSousAssemblageId" INTEGER NOT NULL,
    "pieceId" INTEGER NOT NULL,
    "nombre" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "SousSousAssemblagePiece_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."KitPiece" (
    "id" SERIAL NOT NULL,
    "kitId" INTEGER NOT NULL,
    "pieceId" INTEGER NOT NULL,
    "nombre" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "KitPiece_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SousAssemblagePiece_sousAssemblageId_pieceId_key" ON "public"."SousAssemblagePiece"("sousAssemblageId", "pieceId");

-- CreateIndex
CREATE UNIQUE INDEX "SousSousAssemblagePiece_sousSousAssemblageId_pieceId_key" ON "public"."SousSousAssemblagePiece"("sousSousAssemblageId", "pieceId");

-- CreateIndex
CREATE UNIQUE INDEX "KitPiece_kitId_pieceId_key" ON "public"."KitPiece"("kitId", "pieceId");

-- AddForeignKey
ALTER TABLE "public"."Piece" ADD CONSTRAINT "Piece_borneId_fkey" FOREIGN KEY ("borneId") REFERENCES "public"."Borne"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SousAssemblage" ADD CONSTRAINT "SousAssemblage_borneId_fkey" FOREIGN KEY ("borneId") REFERENCES "public"."Borne"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SousSousAssemblage" ADD CONSTRAINT "SousSousAssemblage_borneId_fkey" FOREIGN KEY ("borneId") REFERENCES "public"."Borne"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Kit" ADD CONSTRAINT "Kit_borneId_fkey" FOREIGN KEY ("borneId") REFERENCES "public"."Borne"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SousAssemblagePiece" ADD CONSTRAINT "SousAssemblagePiece_sousAssemblageId_fkey" FOREIGN KEY ("sousAssemblageId") REFERENCES "public"."SousAssemblage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SousAssemblagePiece" ADD CONSTRAINT "SousAssemblagePiece_pieceId_fkey" FOREIGN KEY ("pieceId") REFERENCES "public"."Piece"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SousSousAssemblagePiece" ADD CONSTRAINT "SousSousAssemblagePiece_sousSousAssemblageId_fkey" FOREIGN KEY ("sousSousAssemblageId") REFERENCES "public"."SousSousAssemblage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SousSousAssemblagePiece" ADD CONSTRAINT "SousSousAssemblagePiece_pieceId_fkey" FOREIGN KEY ("pieceId") REFERENCES "public"."Piece"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."KitPiece" ADD CONSTRAINT "KitPiece_kitId_fkey" FOREIGN KEY ("kitId") REFERENCES "public"."Kit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."KitPiece" ADD CONSTRAINT "KitPiece_pieceId_fkey" FOREIGN KEY ("pieceId") REFERENCES "public"."Piece"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
