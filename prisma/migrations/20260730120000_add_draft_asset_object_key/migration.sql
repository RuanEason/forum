-- Add the COS object key used to validate and clean up attachment uploads.
ALTER TABLE `DraftAsset`
    ADD COLUMN `objectKey` VARCHAR(191) NULL;
