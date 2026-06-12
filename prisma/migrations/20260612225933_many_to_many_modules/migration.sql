/*
  Warnings:

  - You are about to drop the column `courseId` on the `Module` table. All the data in the column will be lost.
  - You are about to drop the column `order` on the `Module` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Module" DROP CONSTRAINT "Module_courseId_fkey";

-- DropIndex
DROP INDEX "Module_courseId_idx";

-- DropIndex
DROP INDEX "Module_courseId_order_key";

-- AlterTable
ALTER TABLE "Module" DROP COLUMN "courseId",
DROP COLUMN "order";

-- CreateTable
CREATE TABLE "CourseModule" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "CourseModule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CourseModule_moduleId_idx" ON "CourseModule"("moduleId");

-- CreateIndex
CREATE INDEX "CourseModule_courseId_idx" ON "CourseModule"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseModule_courseId_moduleId_key" ON "CourseModule"("courseId", "moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseModule_courseId_order_key" ON "CourseModule"("courseId", "order");

-- AddForeignKey
ALTER TABLE "CourseModule" ADD CONSTRAINT "CourseModule_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseModule" ADD CONSTRAINT "CourseModule_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;
