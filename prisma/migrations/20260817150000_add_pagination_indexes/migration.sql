CREATE INDEX `Post_feed_page_idx`
    ON `Post`(`visibility`, `deletedAt`, `pinned`, `pinnedAt`, `createdAt`, `id`);

CREATE INDEX `Post_topic_feed_idx`
    ON `Post`(`topicId`, `visibility`, `deletedAt`, `pinned`, `pinnedAt`, `createdAt`, `id`);

CREATE INDEX `Comment_page_idx`
    ON `Comment`(`postId`, `parentId`, `pinned`, `pinnedAt`, `createdAt`, `id`);

CREATE INDEX `Notification_page_idx`
    ON `Notification`(`receiverId`, `createdAt`, `id`);

CREATE INDEX `Follow_follower_page_idx`
    ON `Follow`(`followerId`, `createdAt`, `id`);

CREATE INDEX `Follow_following_page_idx`
    ON `Follow`(`followingId`, `createdAt`, `id`);
