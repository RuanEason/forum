ALTER TABLE `User`
  ADD COLUMN `editorImageBytesUsed` INTEGER NOT NULL DEFAULT 0;

CREATE TABLE `EditorImageAsset` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `objectKey` VARCHAR(191) NOT NULL,
  `url` VARCHAR(191) NOT NULL,
  `fileName` VARCHAR(191) NOT NULL,
  `fileSize` INTEGER NOT NULL,
  `mimeType` VARCHAR(191) NOT NULL,
  `status` ENUM('PENDING', 'READY') NOT NULL DEFAULT 'PENDING',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `EditorImageAsset_id_key`(`id`),
  UNIQUE INDEX `EditorImageAsset_objectKey_key`(`objectKey`),
  INDEX `EditorImageAsset_userId_status_createdAt_idx`(`userId`, `status`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `EditorImageAsset`
  ADD CONSTRAINT `EditorImageAsset_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
