-- CreateTable
CREATE TABLE "public"."SousAssemblageSousSousAssemblage" (
    "id" SERIAL NOT NULL,
    "sousAssemblageId" INTEGER NOT NULL,
    "sousSousAssemblageId" INTEGER NOT NULL,
    "nombre" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "SousAssemblageSousSousAssemblage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SousAssemblageSousSousAssemblage_sousAssemblageId_sousSousA_key" ON "public"."SousAssemblageSousSousAssemblage"("sousAssemblageId", "sousSousAssemblageId");

-- AddForeignKey
ALTER TABLE "public"."SousAssemblageSousSousAssemblage" ADD CONSTRAINT "SousAssemblageSousSousAssemblage_sousAssemblageId_fkey" FOREIGN KEY ("sousAssemblageId") REFERENCES "public"."SousAssemblage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SousAssemblageSousSousAssemblage" ADD CONSTRAINT "SousAssemblageSousSousAssemblage_sousSousAssemblageId_fkey" FOREIGN KEY ("sousSousAssemblageId") REFERENCES "public"."SousSousAssemblage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
