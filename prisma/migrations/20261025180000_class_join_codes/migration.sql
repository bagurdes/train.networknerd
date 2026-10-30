-- AlterEnum
ALTER TYPE "EnrollmentSource" ADD VALUE 'JOIN_CODE';

-- AlterTable
ALTER TABLE "Class" ADD COLUMN     "joinCode" TEXT,
ADD COLUMN     "joinEnabled" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "EmailVerificationToken" ADD COLUMN     "pendingClassId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Class_joinCode_key" ON "Class"("joinCode");
