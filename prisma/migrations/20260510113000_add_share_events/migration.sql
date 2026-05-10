CREATE TABLE `share_events` (
    `id` VARCHAR(191) NOT NULL,
    `postId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `channel` VARCHAR(32) NOT NULL,
    `shareSource` VARCHAR(64) NOT NULL,
    `vdSource` VARCHAR(64) NOT NULL,
    `shareUrl` TEXT NOT NULL,
    `userAgent` TEXT NULL,
    `referer` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `share_events_postId_createdAt_idx`(`postId`, `createdAt`),
    INDEX `share_events_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `share_events_vdSource_createdAt_idx`(`vdSource`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `share_events` ADD CONSTRAINT `share_events_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `share_events` ADD CONSTRAINT `share_events_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
