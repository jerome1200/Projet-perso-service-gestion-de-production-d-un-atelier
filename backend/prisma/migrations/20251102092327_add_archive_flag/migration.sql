-- AlterTable
ALTER TABLE "public"."Kit" ADD COLUMN     "archivé" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."Piece" ADD COLUMN     "archivé" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."SousAssemblage" ADD COLUMN     "archivé" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."SousSousAssemblage" ADD COLUMN     "archivé" BOOLEAN NOT NULL DEFAULT false;
