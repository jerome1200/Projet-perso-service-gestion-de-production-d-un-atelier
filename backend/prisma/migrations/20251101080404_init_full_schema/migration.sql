-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER', 'DEFAULT');

-- CreateTable
CREATE TABLE "Borne" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "emplacement" TEXT NOT NULL,
    "etat" TEXT NOT NULL,
    "dateInstallation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Borne_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'DEFAULT',
    "nom" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Piece" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "nombre" INTEGER NOT NULL,
    "photo" TEXT,
    "emplacement" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" INTEGER,
    "sousAssemblageId" INTEGER,
    "sousSousAssemblageId" INTEGER,
    "kitId" INTEGER,

    CONSTRAINT "Piece_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SousAssemblage" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "nombre" INTEGER NOT NULL,
    "photo" TEXT,
    "emplacement" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SousAssemblage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SousSousAssemblage" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "nombre" INTEGER NOT NULL,
    "photo" TEXT,
    "emplacement" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SousSousAssemblage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kit" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "nombre" INTEGER NOT NULL,
    "photo" TEXT,
    "emplacement" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Kit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Piece_reference_key" ON "Piece"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "SousAssemblage_reference_key" ON "SousAssemblage"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "SousSousAssemblage_reference_key" ON "SousSousAssemblage"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Kit_reference_key" ON "Kit"("reference");

-- AddForeignKey
ALTER TABLE "Piece" ADD CONSTRAINT "Piece_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Piece" ADD CONSTRAINT "Piece_sousAssemblageId_fkey" FOREIGN KEY ("sousAssemblageId") REFERENCES "SousAssemblage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Piece" ADD CONSTRAINT "Piece_sousSousAssemblageId_fkey" FOREIGN KEY ("sousSousAssemblageId") REFERENCES "SousSousAssemblage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Piece" ADD CONSTRAINT "Piece_kitId_fkey" FOREIGN KEY ("kitId") REFERENCES "Kit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
