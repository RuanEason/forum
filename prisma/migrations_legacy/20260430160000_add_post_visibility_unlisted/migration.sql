-- Add visibility for link-only post access control
ALTER TABLE `Post`
  ADD COLUMN `visibility` ENUM('PUBLIC', 'UNLISTED') NOT NULL DEFAULT 'PUBLIC';

CREATE INDEX `Post_visibility_idx` ON `Post`(`visibility`);
