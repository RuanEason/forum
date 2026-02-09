-- Add mobile push device binding table.
CREATE TABLE `push_devices` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `registrationId` VARCHAR(191) NOT NULL,
  `platform` ENUM('IOS', 'ANDROID', 'HARMONY', 'OTHER') NOT NULL,
  `appPackage` VARCHAR(191) NOT NULL,
  `appVersion` VARCHAR(191) NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `lastSeenAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `push_devices_registrationId_key`(`registrationId`),
  INDEX `push_devices_userId_isActive_idx`(`userId`, `isActive`),
  INDEX `push_devices_platform_idx`(`platform`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Add push delivery logs for idempotency and retries.
CREATE TABLE `push_logs` (
  `id` VARCHAR(191) NOT NULL,
  `notificationId` VARCHAR(191) NOT NULL,
  `deviceId` VARCHAR(191) NOT NULL,
  `registrationId` VARCHAR(191) NOT NULL,
  `requestId` VARCHAR(191) NULL,
  `status` ENUM('PENDING', 'RETRYING', 'SENT', 'FAILED', 'SKIPPED') NOT NULL DEFAULT 'PENDING',
  `attemptCount` INTEGER NOT NULL DEFAULT 0,
  `error` TEXT NULL,
  `sentAt` DATETIME(3) NULL,
  `nextRetryAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `push_logs_notificationId_registrationId_key`(`notificationId`, `registrationId`),
  INDEX `push_logs_status_nextRetryAt_idx`(`status`, `nextRetryAt`),
  INDEX `push_logs_deviceId_idx`(`deviceId`),
  INDEX `push_logs_notificationId_idx`(`notificationId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Foreign keys.
ALTER TABLE `push_devices`
  ADD CONSTRAINT `push_devices_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `push_logs`
  ADD CONSTRAINT `push_logs_notificationId_fkey`
  FOREIGN KEY (`notificationId`) REFERENCES `Notification`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `push_logs`
  ADD CONSTRAINT `push_logs_deviceId_fkey`
  FOREIGN KEY (`deviceId`) REFERENCES `push_devices`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
