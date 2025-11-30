-- AlterTable
ALTER TABLE "public"."Kit" ADD COLUMN     "seuilAlerte" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."Piece" ADD COLUMN     "seuilAlerte" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."SousAssemblage" ADD COLUMN     "seuilAlerte" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."SousSousAssemblage" ADD COLUMN     "seuilAlerte" INTEGER NOT NULL DEFAULT 0;
