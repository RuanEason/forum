import { prisma } from "@/lib/prisma";
import { enqueueNotificationPush } from "@/lib/push";

export type UserNotificationType =
  | "REPLY_POST"
  | "REPLY_COMMENT"
  | "LIKE_POST"
  | "LIKE_COMMENT"
  | "FOLLOW_USER";

type NotificationInput = {
  type: UserNotificationType;
  senderId: string;
  receiverId: string;
  postId?: string;
  commentId?: string;
};

const preferenceFieldByType: Record<
  UserNotificationType,
  "notifyReplies" | "notifyLikes" | "notifyFollows"
> = {
  REPLY_POST: "notifyReplies",
  REPLY_COMMENT: "notifyReplies",
  LIKE_POST: "notifyLikes",
  LIKE_COMMENT: "notifyLikes",
  FOLLOW_USER: "notifyFollows",
};

export async function createUserNotificationIfEnabled(input: NotificationInput) {
  if (input.senderId === input.receiverId) {
    return null;
  }

  const receiver = await prisma.user.findUnique({
    where: { id: input.receiverId },
    select: {
      notifyReplies: true,
      notifyLikes: true,
      notifyFollows: true,
    },
  });

  if (!receiver || !receiver[preferenceFieldByType[input.type]]) {
    return null;
  }

  const notification = await prisma.notification.create({
    data: input,
    select: { id: true },
  });

  enqueueNotificationPush(notification.id);
  return notification;
}
