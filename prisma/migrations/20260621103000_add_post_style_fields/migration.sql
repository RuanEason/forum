-- AlterTable
ALTER TABLE `Post` ADD COLUMN `styleConfig` JSON NULL,
    ADD COLUMN `styleCss` TEXT NULL;

-- AlterTable
ALTER TABLE `PostDraft` ADD COLUMN `styleConfig` JSON NULL,
    ADD COLUMN `styleCss` TEXT NULL;
