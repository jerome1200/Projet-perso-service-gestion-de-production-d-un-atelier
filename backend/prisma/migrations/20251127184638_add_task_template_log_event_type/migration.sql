/*
  Warnings:

  - Added the required column `eventType` to the `TaskTemplateLog` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."TaskTemplateLog" ADD COLUMN     "eventType" "public"."TaskEventType" NOT NULL;
