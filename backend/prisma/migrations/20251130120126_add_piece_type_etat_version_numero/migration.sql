-- CreateEnum
CREATE TYPE "public"."PieceType" AS ENUM ('COMMERCE', 'ELEC', 'PIECE_3D', 'CABLE_SM', 'TOLERIE', 'OUTIL', 'SSA', 'SA', 'KITS');

-- CreateEnum
CREATE TYPE "public"."PieceEtat" AS ENUM ('RD', 'PRODUCTION', 'MAINTENANCE');

-- AlterTable
ALTER TABLE "public"."Piece" ADD COLUMN     "etat" "public"."PieceEtat" NOT NULL DEFAULT 'PRODUCTION',
ADD COLUMN     "numero" TEXT,
ADD COLUMN     "type" "public"."PieceType" NOT NULL DEFAULT 'COMMERCE',
ADD COLUMN     "version" TEXT NOT NULL DEFAULT 'A';
