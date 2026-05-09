-- Add reply target relation for comments (replying to a specific reply/user)
ALTER TABLE `Comment`
  ADD COLUMN `replyToId` VARCHAR(191) NULL;

ALTER TABLE `Comment`
  ADD INDEX `Comment_replyToId_idx` (`replyToId`);

ALTER TABLE `Comment`
  ADD CONSTRAINT `Comment_replyToId_fkey`
  FOREIGN KEY (`replyToId`) REFERENCES `Comment`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
