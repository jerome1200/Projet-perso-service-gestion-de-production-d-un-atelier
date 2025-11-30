/*
  Warnings:

  - You are about to drop the column `dateInstallation` on the `Borne` table. All the data in the column will be lost.
  - You are about to drop the column `emplacement` on the `Borne` table. All the data in the column will be lost.
  - You are about to drop the column `etat` on the `Borne` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[nom]` on the table `Borne` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Borne" DROP COLUMN "dateInstallation",
DROP COLUMN "emplacement",
DROP COLUMN "etat";

-- AlterTable
ALTER TABLE "public"."Kit" ADD COLUMN     "borneId" INTEGER;

-- AlterTable
ALTER TABLE "public"."Piece" ADD COLUMN     "borneId" INTEGER;

-- AlterTable
ALTER TABLE "public"."SousAssemblage" ADD COLUMN     "borneId" INTEGER;

-- AlterTable
ALTER TABLE "public"."SousSousAssemblage" ADD COLUMN     "borneId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Borne_nom_key" ON "public"."Borne"("nom");

-- AddForeignKey
ALTER TABLE "public"."Piece" ADD CONSTRAINT "Piece_borneId_fkey" FOREIGN KEY ("borneId") REFERENCES "public"."Borne"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SousAssemblage" ADD CONSTRAINT "SousAssemblage_borneId_fkey" FOREIGN KEY ("borneId") REFERENCES "public"."Borne"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SousSousAssemblage" ADD CONSTRAINT "SousSousAssemblage_borneId_fkey" FOREIGN KEY ("borneId") REFERENCES "public"."Borne"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Kit" ADD CONSTRAINT "Kit_borneId_fkey" FOREIGN KEY ("borneId") REFERENCES "public"."Borne"("id") ON DELETE SET NULL ON UPDATE CASCADE;
