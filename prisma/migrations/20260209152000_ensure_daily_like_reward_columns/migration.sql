-- Self-heal migration: ensure daily like reward columns exist.
-- This fixes production databases where an older migration was marked as applied
-- via `migrate resolve` but did not actually alter the `User` table.

SET @db_name = DATABASE();

SET @has_daily_like_reward_count = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'User'
    AND COLUMN_NAME = 'dailyLikeRewardCount'
);

SET @sql_add_daily_like_reward_count = IF(
  @has_daily_like_reward_count = 0,
  'ALTER TABLE `User` ADD COLUMN `dailyLikeRewardCount` INTEGER NOT NULL DEFAULT 0',
  'SELECT 1'
);

PREPARE stmt_add_daily_like_reward_count FROM @sql_add_daily_like_reward_count;
EXECUTE stmt_add_daily_like_reward_count;
DEALLOCATE PREPARE stmt_add_daily_like_reward_count;

SET @has_last_like_reward_at = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'User'
    AND COLUMN_NAME = 'lastLikeRewardAt'
);

SET @sql_add_last_like_reward_at = IF(
  @has_last_like_reward_at = 0,
  'ALTER TABLE `User` ADD COLUMN `lastLikeRewardAt` DATETIME(3) NULL',
  'SELECT 1'
);

PREPARE stmt_add_last_like_reward_at FROM @sql_add_last_like_reward_at;
EXECUTE stmt_add_last_like_reward_at;
DEALLOCATE PREPARE stmt_add_last_like_reward_at;
