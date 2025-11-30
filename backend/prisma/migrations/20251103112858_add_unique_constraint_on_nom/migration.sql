/*
  Warnings:

  - A unique constraint covering the columns `[nom]` on the table `Kit` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nom]` on the table `Piece` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nom]` on the table `SousAssemblage` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nom]` on the table `SousSousAssemblage` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Kit_nom_key" ON "public"."Kit"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "Piece_nom_key" ON "public"."Piece"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "SousAssemblage_nom_key" ON "public"."SousAssemblage"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "SousSousAssemblage_nom_key" ON "public"."SousSousAssemblage"("nom");
