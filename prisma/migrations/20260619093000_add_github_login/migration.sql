ALTER TABLE `User`
  ADD COLUMN `githubUserId` VARCHAR(191) NULL;

CREATE UNIQUE INDEX `User_githubUserId_key` ON `User`(`githubUserId`);
