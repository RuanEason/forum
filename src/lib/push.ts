import { createHmac } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { getRichTextSummary, parseRichTextDocument } from "@/lib/rich-text/content";

const TPNS_HOST = process.env.TPNS_API_HOST?.trim() || "api.tpns.tencent.com";
const TPNS_ENDPOINT = `https://${TPNS_HOST}/v3/push/app`;
const TPNS_IOS_ENV = process.env.TPNS_IOS_ENV === "dev" ? "dev" : "product";
const TPNS_MAX_ATTEMPTS = Number.parseInt(process.env.TPNS_MAX_RETRY ?? "3", 10);

type PushStatus = "PENDING" | "RETRYING" | "SENT" | "FAILED" | "SKIPPED";
type PushPlatform = "IOS" | "ANDROID" | "HARMONY" | "OTHER";
type NotificationType = "REPLY_POST" | "REPLY_COMMENT" | "LIKE_POST" | "LIKE_COMMENT" | "FOLLOW_USER";

type NotificationRecord = {
  id: string;
  type: NotificationType;
  senderId: string;
  receiverId: string;
  postId: string | null;
  commentId: string | null;
  sender: {
    id: string;
    name: string | null;
  };
  post: {
    id: string;
    title: string | null;
    content: string;
    contentJson: unknown;
    contentFormat: "RICH_TEXT" | "PLAIN_TEXT";
  } | null;
};

type PushDeviceRecord = {
  id: string;
  userId: string;
  registrationId: string;
  platform: PushPlatform;
  appPackage: string;
  isActive: boolean;
};

type PushLogRecord = {
  id: string;
  notificationId: string;
  registrationId: string;
  status: PushStatus;
  attemptCount: number;
  nextRetryAt: Date | null;
};

type TpnsRuntimeConfig = {
  accessId: string;
  accessKey: string;
};

let cachedTpnsConfig: TpnsRuntimeConfig | null | undefined;

export function normalizePushPlatform(value: string): PushPlatform | null {
  const normalized = value.trim().toUpperCase();

  if (normalized === "IOS") {
    return "IOS";
  }

  if (normalized === "ANDROID") {
    return "ANDROID";
  }

  if (normalized === "HARMONY" || normalized === "HARMONYOS") {
    return "HARMONY";
  }

  if (normalized === "OTHER") {
    return "OTHER";
  }

  return null;
}

export function enqueueNotificationPush(notificationId: string) {
  if (process.env.TPNS_ENABLED === "false") {
    return;
  }

  setTimeout(() => {
    void dispatchPushForNotification(notificationId);
  }, 0);
}

export async function dispatchPushForNotification(notificationId: string) {
  try {
    const notification = await getNotificationForPush(notificationId);
    if (!notification) {
      return;
    }

    const devices = await prisma.pushDevice.findMany({
      where: {
        userId: notification.receiverId,
        isActive: true,
      },
      select: {
        id: true,
        userId: true,
        registrationId: true,
        platform: true,
        appPackage: true,
        isActive: true,
      },
    }) as PushDeviceRecord[];

    if (devices.length === 0) {
      return;
    }

    for (const device of devices) {
      const pushLog = await ensurePushLog(notification.id, device);
      await trySendPushLog(pushLog, notification, device);
    }

    await processPendingPushLogs(20);
  } catch (error) {
    console.error("Dispatch TPNS push failed:", error);
  }
}

export async function processPendingPushLogs(limit = 50) {
  const maxAttempts = Number.isNaN(TPNS_MAX_ATTEMPTS) ? 3 : Math.max(TPNS_MAX_ATTEMPTS, 1);
  const now = new Date();

  const pendingLogs = await prisma.pushLog.findMany({
    where: {
      status: {
        in: ["PENDING", "RETRYING"],
      },
      attemptCount: { lt: maxAttempts },
      OR: [
        {
          nextRetryAt: null,
        },
        {
          nextRetryAt: { lte: now },
        },
      ],
      device: {
        isActive: true,
      },
    },
    orderBy: {
      nextRetryAt: "asc",
    },
    take: limit,
    include: {
      device: {
        select: {
          id: true,
          userId: true,
          registrationId: true,
          platform: true,
          appPackage: true,
          isActive: true,
        },
      },
      notification: {
        select: {
          id: true,
          type: true,
          senderId: true,
          receiverId: true,
          postId: true,
          commentId: true,
          sender: {
            select: {
              id: true,
              name: true,
            },
          },
          post: {
            select: {
              id: true,
              title: true,
              content: true,
              contentJson: true,
              contentFormat: true,
            },
          },
        },
      },
    },
  });

  for (const pushLog of pendingLogs) {
    await trySendPushLog(
      {
        id: pushLog.id,
        notificationId: pushLog.notificationId,
        registrationId: pushLog.registrationId,
        status: pushLog.status as PushStatus,
        attemptCount: pushLog.attemptCount,
        nextRetryAt: pushLog.nextRetryAt,
      },
      pushLog.notification as NotificationRecord,
      pushLog.device as PushDeviceRecord,
    );
  }

  return pendingLogs.length;
}

async function getNotificationForPush(notificationId: string) {
  return prisma.notification.findUnique({
    where: { id: notificationId },
    select: {
      id: true,
      type: true,
      senderId: true,
      receiverId: true,
      postId: true,
      commentId: true,
      sender: {
        select: {
          id: true,
          name: true,
        },
      },
      post: {
        select: {
          id: true,
          title: true,
          content: true,
          contentJson: true,
          contentFormat: true,
        },
      },
    },
  }) as Promise<NotificationRecord | null>;
}

async function ensurePushLog(notificationId: string, device: PushDeviceRecord) {
  const existing = await prisma.pushLog.findUnique({
    where: {
      notificationId_registrationId: {
        notificationId,
        registrationId: device.registrationId,
      },
    },
    select: {
      id: true,
      notificationId: true,
      registrationId: true,
      status: true,
      attemptCount: true,
      nextRetryAt: true,
    },
  });

  if (existing) {
    await prisma.pushLog.update({
      where: { id: existing.id },
      data: {
        deviceId: device.id,
      },
    });

    return {
      id: existing.id,
      notificationId: existing.notificationId,
      registrationId: existing.registrationId,
      status: existing.status as PushStatus,
      attemptCount: existing.attemptCount,
      nextRetryAt: existing.nextRetryAt,
    } satisfies PushLogRecord;
  }

  const created = await prisma.pushLog.create({
    data: {
      notificationId,
      deviceId: device.id,
      registrationId: device.registrationId,
      status: "PENDING",
    },
    select: {
      id: true,
      notificationId: true,
      registrationId: true,
      status: true,
      attemptCount: true,
      nextRetryAt: true,
    },
  });

  return {
    id: created.id,
    notificationId: created.notificationId,
    registrationId: created.registrationId,
    status: created.status as PushStatus,
    attemptCount: created.attemptCount,
    nextRetryAt: created.nextRetryAt,
  } satisfies PushLogRecord;
}

async function trySendPushLog(
  pushLog: PushLogRecord,
  notification: NotificationRecord,
  device: PushDeviceRecord,
) {
  if (pushLog.status === "SENT" || pushLog.status === "SKIPPED") {
    return;
  }

  const now = new Date();
  const maxAttempts = Number.isNaN(TPNS_MAX_ATTEMPTS) ? 3 : Math.max(TPNS_MAX_ATTEMPTS, 1);

  if (pushLog.nextRetryAt && pushLog.nextRetryAt > now) {
    return;
  }

  if (pushLog.attemptCount >= maxAttempts) {
    if (pushLog.status !== "FAILED") {
      await prisma.pushLog.update({
        where: { id: pushLog.id },
        data: {
          status: "FAILED",
          nextRetryAt: null,
          error: pushLog.attemptCount > 0 ? "Retry attempts exhausted" : "Push skipped",
        },
      });
    }
    return;
  }

  const tpnsConfig = getTpnsConfig();
  if (!tpnsConfig) {
    await prisma.pushLog.update({
      where: { id: pushLog.id },
      data: {
        status: "SKIPPED",
        error: "TPNS credentials are not configured",
        nextRetryAt: null,
      },
    });
    return;
  }

  const attemptCount = pushLog.attemptCount + 1;

  try {
    const requestId = await sendTpnsNotification(tpnsConfig, notification, device);

    await prisma.pushLog.update({
      where: { id: pushLog.id },
      data: {
        status: "SENT",
        attemptCount,
        requestId,
        sentAt: now,
        error: null,
        nextRetryAt: null,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown TPNS error";
    const shouldRetry = attemptCount < maxAttempts;

    await prisma.pushLog.update({
      where: { id: pushLog.id },
      data: {
        status: shouldRetry ? "RETRYING" : "FAILED",
        attemptCount,
        error: errorMessage,
        nextRetryAt: shouldRetry ? new Date(Date.now() + getRetryDelayMs(attemptCount)) : null,
      },
    });
  }
}

async function sendTpnsNotification(
  config: TpnsRuntimeConfig,
  notification: NotificationRecord,
  device: PushDeviceRecord,
) {
  const message = buildPushMessage(notification);

  const payload: Record<string, unknown> = {
    audience_type: "token",
    token_list: [device.registrationId],
    message_type: "notify",
    message: {
      title: message.title,
      content: message.content,
      custom_content: JSON.stringify({
        notificationId: notification.id,
        type: notification.type,
        senderId: notification.senderId,
        receiverId: notification.receiverId,
        postId: notification.postId,
        commentId: notification.commentId,
      }),
    },
  };

  if (device.platform === "IOS") {
    payload.environment = TPNS_IOS_ENV;
  }

  const androidChannelId = process.env.TPNS_ANDROID_CHANNEL_ID?.trim();
  if (androidChannelId) {
    const messageBody = payload.message as Record<string, unknown>;
    messageBody.android = {
      channel_id: androidChannelId,
    };
  }

  const requestBody = JSON.stringify(payload);
  const timeStamp = Math.floor(Date.now() / 1000).toString();
  const signature = createHmac("sha256", config.accessKey)
    .update(`${timeStamp}${requestBody}`)
    .digest("base64");

  const response = await fetch(TPNS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      AccessId: config.accessId,
      TimeStamp: timeStamp,
      Sign: signature,
    },
    body: requestBody,
  });

  const rawText = await response.text();
  const responseData = parseJsonSafely(rawText);
  const retCode = typeof responseData?.ret_code === "number" ? responseData.ret_code : null;

  if (!response.ok || retCode !== 0) {
    const errorMessage = typeof responseData?.err_msg === "string"
      ? responseData.err_msg
      : rawText || `TPNS request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  return extractRequestId(responseData) ?? "";
}

function buildPushMessage(notification: NotificationRecord) {
  const senderName = notification.sender.name?.trim() || "有新动态";
  const postLabel = formatPostLabel(notification.post);

  switch (notification.type) {
    case "REPLY_POST":
      return {
        title: "帖子有新回复",
        content: `${senderName} 回复了你的帖子${postLabel}`,
      };
    case "REPLY_COMMENT":
      return {
        title: "评论有新回复",
        content: `${senderName} 回复了你的评论${postLabel}`,
      };
    case "LIKE_POST":
      return {
        title: "帖子收到新赞",
        content: `${senderName} 赞了你的帖子${postLabel}`,
      };
    case "LIKE_COMMENT":
      return {
        title: "评论收到新赞",
        content: `${senderName} 赞了你的评论${postLabel}`,
      };
    case "FOLLOW_USER":
      return {
        title: "你有新的关注",
        content: `${senderName} 关注了你`,
      };
    default:
      return {
        title: "站内通知",
        content: "你有一条新的通知",
      };
  }
}

function formatPostLabel(post: NotificationRecord["post"]) {
  if (!post) {
    return "";
  }

  const title = post.title?.trim();
  if (title) {
    return `《${clipText(title, 22)}》`;
  }

  const excerpt = post.contentFormat === "RICH_TEXT"
    ? getRichTextSummary(parseRichTextDocument(post.contentJson), 80)
    : post.content.replace(/\s+/g, " ").trim();
  if (!excerpt) {
    return "";
  }

  return `（${clipText(excerpt, 22)}）`;
}

function clipText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}...`;
}

function getRetryDelayMs(attemptCount: number) {
  if (attemptCount <= 1) {
    return 30_000;
  }

  if (attemptCount === 2) {
    return 2 * 60_000;
  }

  return 10 * 60_000;
}

function getTpnsConfig() {
  if (cachedTpnsConfig !== undefined) {
    return cachedTpnsConfig;
  }

  const envAccessId = process.env.TPNS_ACCESS_ID?.trim()
    || process.env.EXPO_PUBLIC_TPNS_ACCESS_ID?.trim();
  const envAccessKey = process.env.TPNS_ACCESS_KEY?.trim()
    || process.env.EXPO_PUBLIC_TPNS_ACCESS_KEY?.trim();

  if (envAccessId && envAccessKey) {
    cachedTpnsConfig = {
      accessId: envAccessId,
      accessKey: envAccessKey,
    };
    return cachedTpnsConfig;
  }

  const filePath = path.join(process.cwd(), "tpns-configs.json");
  if (!existsSync(filePath)) {
    cachedTpnsConfig = null;
    return cachedTpnsConfig;
  }

  try {
    const content = readFileSync(filePath, "utf8");
    const parsed = JSON.parse(content) as {
      tpns?: {
        access_id?: string | number;
        access_key?: string;
      };
    };

    const accessIdRaw = parsed.tpns?.access_id;
    const accessKeyRaw = parsed.tpns?.access_key;

    const accessId = typeof accessIdRaw === "number"
      ? accessIdRaw.toString()
      : accessIdRaw?.trim();
    const accessKey = accessKeyRaw?.trim();

    if (!accessId || !accessKey) {
      cachedTpnsConfig = null;
      return cachedTpnsConfig;
    }

    cachedTpnsConfig = {
      accessId,
      accessKey,
    };
    return cachedTpnsConfig;
  } catch (error) {
    console.error("Failed to load tpns-configs.json:", error);
    cachedTpnsConfig = null;
    return cachedTpnsConfig;
  }
}

function parseJsonSafely(value: string) {
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function extractRequestId(responseData: Record<string, unknown> | null) {
  if (!responseData) {
    return null;
  }

  if (typeof responseData.request_id === "string") {
    return responseData.request_id;
  }

  if (typeof responseData.push_id === "string") {
    return responseData.push_id;
  }

  const result = responseData.result;
  if (typeof result === "string") {
    const parsedResult = parseJsonSafely(result);
    if (parsedResult && typeof parsedResult.push_id === "string") {
      return parsedResult.push_id;
    }
    if (parsedResult && typeof parsedResult.request_id === "string") {
      return parsedResult.request_id;
    }
  }

  if (result && typeof result === "object") {
    const resultObj = result as Record<string, unknown>;
    if (typeof resultObj.push_id === "string") {
      return resultObj.push_id;
    }
    if (typeof resultObj.request_id === "string") {
      return resultObj.request_id;
    }
  }

  return null;
}
