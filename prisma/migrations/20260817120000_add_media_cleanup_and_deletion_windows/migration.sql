ALTER TABLE `User`
    ADD COLUMN `deletionRequestedAt` DATETIME(3) NULL,
    ADD COLUMN `deletionScheduledAt` DATETIME(3) NULL;

ALTER TABLE `Post`
    ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `deleteScheduledAt` DATETIME(3) NULL,
    ADD COLUMN `deletionReason` ENUM('POST_REQUEST', 'ACCOUNT_REQUEST') NULL;

CREATE TABLE `MediaCleanupTask` (
    `id` VARCHAR(191) NOT NULL,
    `dedupeKey` CHAR(64) NOT NULL,
    `objectKey` VARCHAR(1024) NOT NULL,
    `resourceType` ENUM('POST_IMAGE', 'POST_ATTACHMENT', 'VIDEO_RAW', 'VIDEO_HLS', 'VIDEO_COVER', 'BACKGROUND_VIDEO_RAW', 'BACKGROUND_VIDEO_COVER', 'USER_AVATAR', 'USER_COVER', 'DRAFT_ASSET', 'EDITOR_IMAGE', 'ORPHAN') NOT NULL,
    `reason` ENUM('POST_DELETE', 'ACCOUNT_DELETE', 'UPLOAD_EXPIRED', 'MANUAL') NOT NULL DEFAULT 'MANUAL',
    `ownerId` VARCHAR(191) NULL,
    `postId` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'RETRYING', 'SUCCEEDED', 'FAILED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `executeAfter` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `retryCount` INTEGER NOT NULL DEFAULT 0,
    `maxRetries` INTEGER NOT NULL DEFAULT 5,
    `lastError` TEXT NULL,
    `lockedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `MediaCleanupTask_dedupeKey_key`(`dedupeKey`),
    INDEX `MediaCleanupTask_status_executeAfter_idx`(`status`, `executeAfter`),
    INDEX `MediaCleanupTask_ownerId_status_idx`(`ownerId`, `status`),
    INDEX `MediaCleanupTask_postId_status_idx`(`postId`, `status`),
    INDEX `MediaCleanupTask_resourceType_status_idx`(`resourceType`, `status`),
    INDEX `MediaCleanupTask_reason_status_idx`(`reason`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `MediaCleanupTask`
    ADD CONSTRAINT `MediaCleanupTask_ownerId_fkey`
      FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT `MediaCleanupTask_postId_fkey`
      FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `Post`
    ADD INDEX `Post_deletedAt_deleteScheduledAt_idx`(`deletedAt`, `deleteScheduledAt`);
