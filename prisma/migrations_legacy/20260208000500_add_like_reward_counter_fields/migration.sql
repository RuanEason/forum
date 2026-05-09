-- Add atomic daily like reward counter fields for anti-abuse.
ALTER TABLE `User`
  ADD COLUMN `dailyLikeRewardCount` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `lastLikeRewardAt` DATETIME(3) NULL;

