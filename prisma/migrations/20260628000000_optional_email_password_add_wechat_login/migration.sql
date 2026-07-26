ALTER TABLE `User`
  MODIFY `email` VARCHAR(191) NULL,
  MODIFY `password` VARCHAR(191) NULL,
  ADD COLUMN `wechatOpenId` VARCHAR(191) NULL,
  ADD COLUMN `wechatUnionId` VARCHAR(191) NULL,
  ADD COLUMN `wechatNickname` VARCHAR(191) NULL,
  ADD COLUMN `wechatAvatar` VARCHAR(191) NULL,
  ADD COLUMN `wechatLastAuthAt` DATETIME(3) NULL;

CREATE UNIQUE INDEX `User_wechatOpenId_key` ON `User`(`wechatOpenId`);
CREATE UNIQUE INDEX `User_wechatUnionId_key` ON `User`(`wechatUnionId`);
