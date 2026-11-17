-- AlterTable
ALTER TABLE "Module" ADD COLUMN "archivedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Module_archivedAt_idx" ON "Module"("archivedAt");
