-- CreateTable
CREATE TABLE "public"."TaskTemplateLog" (
    "id" SERIAL NOT NULL,
    "taskTemplateId" INTEGER NOT NULL,
    "userId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "TaskTemplateLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaskTemplateLog_taskTemplateId_createdAt_idx" ON "public"."TaskTemplateLog"("taskTemplateId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."TaskTemplateLog" ADD CONSTRAINT "TaskTemplateLog_taskTemplateId_fkey" FOREIGN KEY ("taskTemplateId") REFERENCES "public"."TaskTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TaskTemplateLog" ADD CONSTRAINT "TaskTemplateLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
