DROP INDEX `User_casdoorUserId_key` ON `User`;

ALTER TABLE `User`
  DROP COLUMN `casdoorUserId`;
