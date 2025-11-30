/*
  Warnings:

  - You are about to drop the column `borneId` on the `Piece` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Piece" DROP CONSTRAINT "Piece_borneId_fkey";

-- AlterTable
ALTER TABLE "public"."Piece" DROP COLUMN "borneId";

-- CreateTable
CREATE TABLE "public"."_BornePieces" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_BornePieces_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_BornePieces_B_index" ON "public"."_BornePieces"("B");

-- AddForeignKey
ALTER TABLE "public"."_BornePieces" ADD CONSTRAINT "_BornePieces_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Borne"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_BornePieces" ADD CONSTRAINT "_BornePieces_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Piece"("id") ON DELETE CASCADE ON UPDATE CASCADE;
