-- CreateEnum
CREATE TYPE "public"."TaskEventType" AS ENUM ('CREATED', 'ASSIGNED', 'STARTED', 'PAUSED', 'COMPLETED', 'REOPENED');

-- CreateEnum
CREATE TYPE "public"."ProductionStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'DONE', 'CANCELED');

-- CreateTable
CREATE TABLE "public"."TaskTemplate" (
    "id" SERIAL NOT NULL,
    "borneId" INTEGER,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER,
    "estimatedMinutesPerUnit" INTEGER,
    "pieceId" INTEGER,
    "sousAssemblageId" INTEGER,
    "sousSousAssemblageId" INTEGER,
    "kitId" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "TaskTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Production" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "reference" TEXT,
    "description" TEXT,
    "status" "public"."ProductionStatus" NOT NULL DEFAULT 'PLANNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),

    CONSTRAINT "Production_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductionLine" (
    "id" SERIAL NOT NULL,
    "productionId" INTEGER NOT NULL,
    "borneId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "ProductionLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductionTask" (
    "id" SERIAL NOT NULL,
    "productionId" INTEGER NOT NULL,
    "taskTemplateId" INTEGER,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "isDone" BOOLEAN NOT NULL DEFAULT false,
    "totalSeconds" INTEGER NOT NULL DEFAULT 0,
    "running" BOOLEAN NOT NULL DEFAULT false,
    "lastStartedAt" TIMESTAMP(3),
    "assignedToId" INTEGER,

    CONSTRAINT "ProductionTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductionTaskLog" (
    "id" SERIAL NOT NULL,
    "productionTaskId" INTEGER NOT NULL,
    "userId" INTEGER,
    "eventType" "public"."TaskEventType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "ProductionTaskLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Production_reference_key" ON "public"."Production"("reference");

-- CreateIndex
CREATE INDEX "ProductionTask_assignedToId_idx" ON "public"."ProductionTask"("assignedToId");

-- CreateIndex
CREATE INDEX "ProductionTaskLog_productionTaskId_createdAt_idx" ON "public"."ProductionTaskLog"("productionTaskId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."TaskTemplate" ADD CONSTRAINT "TaskTemplate_pieceId_fkey" FOREIGN KEY ("pieceId") REFERENCES "public"."Piece"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TaskTemplate" ADD CONSTRAINT "TaskTemplate_sousAssemblageId_fkey" FOREIGN KEY ("sousAssemblageId") REFERENCES "public"."SousAssemblage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TaskTemplate" ADD CONSTRAINT "TaskTemplate_sousSousAssemblageId_fkey" FOREIGN KEY ("sousSousAssemblageId") REFERENCES "public"."SousSousAssemblage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TaskTemplate" ADD CONSTRAINT "TaskTemplate_kitId_fkey" FOREIGN KEY ("kitId") REFERENCES "public"."Kit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TaskTemplate" ADD CONSTRAINT "TaskTemplate_borneId_fkey" FOREIGN KEY ("borneId") REFERENCES "public"."Borne"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductionLine" ADD CONSTRAINT "ProductionLine_productionId_fkey" FOREIGN KEY ("productionId") REFERENCES "public"."Production"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductionLine" ADD CONSTRAINT "ProductionLine_borneId_fkey" FOREIGN KEY ("borneId") REFERENCES "public"."Borne"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductionTask" ADD CONSTRAINT "ProductionTask_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductionTask" ADD CONSTRAINT "ProductionTask_productionId_fkey" FOREIGN KEY ("productionId") REFERENCES "public"."Production"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductionTask" ADD CONSTRAINT "ProductionTask_taskTemplateId_fkey" FOREIGN KEY ("taskTemplateId") REFERENCES "public"."TaskTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductionTaskLog" ADD CONSTRAINT "ProductionTaskLog_productionTaskId_fkey" FOREIGN KEY ("productionTaskId") REFERENCES "public"."ProductionTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductionTaskLog" ADD CONSTRAINT "ProductionTaskLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
