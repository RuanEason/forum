CREATE TABLE `HiddenCustomEmoji` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `objectKey` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `HiddenCustomEmoji_userId_objectKey_key`(`userId`, `objectKey`),
    INDEX `HiddenCustomEmoji_userId_createdAt_idx`(`userId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `HiddenCustomEmoji`
    ADD CONSTRAINT `HiddenCustomEmoji_userId_fkey`
      FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
