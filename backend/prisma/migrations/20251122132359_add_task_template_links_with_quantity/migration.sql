/*
  Warnings:

  - You are about to drop the column `kitId` on the `TaskTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `pieceId` on the `TaskTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `sousAssemblageId` on the `TaskTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `sousSousAssemblageId` on the `TaskTemplate` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."TaskTemplate" DROP CONSTRAINT "TaskTemplate_kitId_fkey";

-- DropForeignKey
ALTER TABLE "public"."TaskTemplate" DROP CONSTRAINT "TaskTemplate_pieceId_fkey";

-- DropForeignKey
ALTER TABLE "public"."TaskTemplate" DROP CONSTRAINT "TaskTemplate_sousAssemblageId_fkey";

-- DropForeignKey
ALTER TABLE "public"."TaskTemplate" DROP CONSTRAINT "TaskTemplate_sousSousAssemblageId_fkey";

-- AlterTable
ALTER TABLE "public"."TaskTemplate" DROP COLUMN "kitId",
DROP COLUMN "pieceId",
DROP COLUMN "sousAssemblageId",
DROP COLUMN "sousSousAssemblageId";

-- CreateTable
CREATE TABLE "public"."TaskTemplatePiece" (
    "id" SERIAL NOT NULL,
    "taskTemplateId" INTEGER NOT NULL,
    "pieceId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "TaskTemplatePiece_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TaskTemplateSousAssemblage" (
    "id" SERIAL NOT NULL,
    "taskTemplateId" INTEGER NOT NULL,
    "sousAssemblageId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "TaskTemplateSousAssemblage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TaskTemplateSousSousAssemblage" (
    "id" SERIAL NOT NULL,
    "taskTemplateId" INTEGER NOT NULL,
    "sousSousAssemblageId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "TaskTemplateSousSousAssemblage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TaskTemplatePiece_taskTemplateId_pieceId_key" ON "public"."TaskTemplatePiece"("taskTemplateId", "pieceId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskTemplateSousAssemblage_taskTemplateId_sousAssemblageId_key" ON "public"."TaskTemplateSousAssemblage"("taskTemplateId", "sousAssemblageId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskTemplateSousSousAssemblage_taskTemplateId_sousSousAssem_key" ON "public"."TaskTemplateSousSousAssemblage"("taskTemplateId", "sousSousAssemblageId");

-- AddForeignKey
ALTER TABLE "public"."TaskTemplatePiece" ADD CONSTRAINT "TaskTemplatePiece_taskTemplateId_fkey" FOREIGN KEY ("taskTemplateId") REFERENCES "public"."TaskTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TaskTemplatePiece" ADD CONSTRAINT "TaskTemplatePiece_pieceId_fkey" FOREIGN KEY ("pieceId") REFERENCES "public"."Piece"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TaskTemplateSousAssemblage" ADD CONSTRAINT "TaskTemplateSousAssemblage_taskTemplateId_fkey" FOREIGN KEY ("taskTemplateId") REFERENCES "public"."TaskTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TaskTemplateSousAssemblage" ADD CONSTRAINT "TaskTemplateSousAssemblage_sousAssemblageId_fkey" FOREIGN KEY ("sousAssemblageId") REFERENCES "public"."SousAssemblage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TaskTemplateSousSousAssemblage" ADD CONSTRAINT "TaskTemplateSousSousAssemblage_taskTemplateId_fkey" FOREIGN KEY ("taskTemplateId") REFERENCES "public"."TaskTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TaskTemplateSousSousAssemblage" ADD CONSTRAINT "TaskTemplateSousSousAssemblage_sousSousAssemblageId_fkey" FOREIGN KEY ("sousSousAssemblageId") REFERENCES "public"."SousSousAssemblage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
