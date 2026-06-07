/*
  Warnings:

  - A unique constraint covering the columns `[casdoorUserId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `user` ADD COLUMN `casdoorUserId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `User_casdoorUserId_key` ON `User`(`casdoorUserId`);
