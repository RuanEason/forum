-- CreateTable
CREATE TABLE `PostDraft` (
    `id` VARCHAR(191) NOT NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `postType` ENUM('TEXT', 'VIDEO') NOT NULL DEFAULT 'TEXT',
    `title` VARCHAR(191) NULL,
    `content` TEXT NOT NULL,
    `visibility` ENUM('PUBLIC', 'UNLISTED') NOT NULL DEFAULT 'PUBLIC',
    `topicId` VARCHAR(191) NULL,
    `persistMode` ENUM('EPHEMERAL', 'SAVED') NOT NULL DEFAULT 'EPHEMERAL',
    `status` ENUM('EDITING', 'UPLOADING', 'PROCESSING', 'FAILED', 'READY', 'PUBLISHED') NOT NULL DEFAULT 'EDITING',
    `lastError` TEXT NULL,
    `publishedPostId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PostDraft_publishedPostId_key`(`publishedPostId`),
    INDEX `PostDraft_authorId_persistMode_updatedAt_idx`(`authorId`, `persistMode`, `updatedAt`),
    INDEX `PostDraft_authorId_status_updatedAt_idx`(`authorId`, `status`, `updatedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DraftAsset` (
    `id` VARCHAR(191) NOT NULL,
    `draftId` VARCHAR(191) NOT NULL,
    `type` ENUM('IMAGE', 'ATTACHMENT', 'VIDEO', 'COVER') NOT NULL,
    `status` ENUM('PENDING', 'UPLOADING', 'PROCESSING', 'READY', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `progress` INTEGER NOT NULL DEFAULT 0,
    `url` VARCHAR(191) NULL,
    `fileName` VARCHAR(191) NULL,
    `fileSize` INTEGER NULL,
    `mimeType` VARCHAR(191) NULL,
    `videoAssetId` VARCHAR(191) NULL,
    `errorMessage` TEXT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DraftAsset_draftId_status_type_idx`(`draftId`, `status`, `type`),
    INDEX `DraftAsset_videoAssetId_idx`(`videoAssetId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PostDraft` ADD CONSTRAINT `PostDraft_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PostDraft` ADD CONSTRAINT `PostDraft_topicId_fkey` FOREIGN KEY (`topicId`) REFERENCES `Topic`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PostDraft` ADD CONSTRAINT `PostDraft_publishedPostId_fkey` FOREIGN KEY (`publishedPostId`) REFERENCES `Post`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DraftAsset` ADD CONSTRAINT `DraftAsset_draftId_fkey` FOREIGN KEY (`draftId`) REFERENCES `PostDraft`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DraftAsset` ADD CONSTRAINT `DraftAsset_videoAssetId_fkey` FOREIGN KEY (`videoAssetId`) REFERENCES `VideoAsset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
