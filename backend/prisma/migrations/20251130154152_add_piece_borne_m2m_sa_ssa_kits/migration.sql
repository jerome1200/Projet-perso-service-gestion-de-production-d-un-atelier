/*
  Warnings:

  - You are about to drop the column `borneId` on the `Kit` table. All the data in the column will be lost.
  - You are about to drop the column `borneId` on the `SousAssemblage` table. All the data in the column will be lost.
  - You are about to drop the column `borneId` on the `SousSousAssemblage` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Kit" DROP CONSTRAINT "Kit_borneId_fkey";

-- DropForeignKey
ALTER TABLE "public"."SousAssemblage" DROP CONSTRAINT "SousAssemblage_borneId_fkey";

-- DropForeignKey
ALTER TABLE "public"."SousSousAssemblage" DROP CONSTRAINT "SousSousAssemblage_borneId_fkey";

-- AlterTable
ALTER TABLE "public"."Kit" DROP COLUMN "borneId";

-- AlterTable
ALTER TABLE "public"."SousAssemblage" DROP COLUMN "borneId";

-- AlterTable
ALTER TABLE "public"."SousSousAssemblage" DROP COLUMN "borneId";

-- CreateTable
CREATE TABLE "public"."_BorneKits" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_BorneKits_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_BorneSousAssemblages" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_BorneSousAssemblages_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_BorneSousSousAssemblages" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_BorneSousSousAssemblages_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_BorneKits_B_index" ON "public"."_BorneKits"("B");

-- CreateIndex
CREATE INDEX "_BorneSousAssemblages_B_index" ON "public"."_BorneSousAssemblages"("B");

-- CreateIndex
CREATE INDEX "_BorneSousSousAssemblages_B_index" ON "public"."_BorneSousSousAssemblages"("B");

-- AddForeignKey
ALTER TABLE "public"."_BorneKits" ADD CONSTRAINT "_BorneKits_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Borne"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_BorneKits" ADD CONSTRAINT "_BorneKits_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Kit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_BorneSousAssemblages" ADD CONSTRAINT "_BorneSousAssemblages_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Borne"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_BorneSousAssemblages" ADD CONSTRAINT "_BorneSousAssemblages_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."SousAssemblage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_BorneSousSousAssemblages" ADD CONSTRAINT "_BorneSousSousAssemblages_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Borne"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_BorneSousSousAssemblages" ADD CONSTRAINT "_BorneSousSousAssemblages_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."SousSousAssemblage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
