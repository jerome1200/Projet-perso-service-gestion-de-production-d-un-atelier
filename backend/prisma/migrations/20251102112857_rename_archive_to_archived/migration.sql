/*
  Warnings:

  - You are about to drop the column `archivé` on the `Kit` table. All the data in the column will be lost.
  - You are about to drop the column `archivé` on the `Piece` table. All the data in the column will be lost.
  - You are about to drop the column `archivé` on the `SousAssemblage` table. All the data in the column will be lost.
  - You are about to drop the column `archivé` on the `SousSousAssemblage` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Kit" DROP COLUMN "archivé",
ADD COLUMN     "archived" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."Piece" DROP COLUMN "archivé",
ADD COLUMN     "archived" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."SousAssemblage" DROP COLUMN "archivé",
ADD COLUMN     "archived" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."SousSousAssemblage" DROP COLUMN "archivé",
ADD COLUMN     "archived" BOOLEAN NOT NULL DEFAULT false;
