ALTER TABLE `Post`
  ADD COLUMN `isAnnouncement` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `announcementAt` DATETIME(3) NULL,
  ADD INDEX `Post_isAnnouncement_announcementAt_idx`(`isAnnouncement`, `announcementAt`);

ALTER TABLE `PostDraft`
  ADD COLUMN `isAnnouncement` BOOLEAN NOT NULL DEFAULT false;
