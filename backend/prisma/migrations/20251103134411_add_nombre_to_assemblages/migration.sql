-- AlterTable
ALTER TABLE "public"."Kit" ADD COLUMN     "nombre" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."Piece" ALTER COLUMN "nombre" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."SousAssemblage" ADD COLUMN     "nombre" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."SousSousAssemblage" ADD COLUMN     "nombre" INTEGER NOT NULL DEFAULT 0;
