-- AlterTable
ALTER TABLE "public"."Kit" ADD COLUMN     "etat" "public"."PieceEtat" NOT NULL DEFAULT 'PRODUCTION',
ADD COLUMN     "numero" TEXT,
ADD COLUMN     "type" "public"."PieceType" NOT NULL DEFAULT 'COMMERCE',
ADD COLUMN     "version" TEXT NOT NULL DEFAULT 'A';

-- AlterTable
ALTER TABLE "public"."SousAssemblage" ADD COLUMN     "etat" "public"."PieceEtat" NOT NULL DEFAULT 'PRODUCTION',
ADD COLUMN     "numero" TEXT,
ADD COLUMN     "type" "public"."PieceType" NOT NULL DEFAULT 'COMMERCE',
ADD COLUMN     "version" TEXT NOT NULL DEFAULT 'A';

-- AlterTable
ALTER TABLE "public"."SousSousAssemblage" ADD COLUMN     "etat" "public"."PieceEtat" NOT NULL DEFAULT 'PRODUCTION',
ADD COLUMN     "numero" TEXT,
ADD COLUMN     "type" "public"."PieceType" NOT NULL DEFAULT 'COMMERCE',
ADD COLUMN     "version" TEXT NOT NULL DEFAULT 'A';
