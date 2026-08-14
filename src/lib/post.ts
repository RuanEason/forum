import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated";
import type { JSONContent } from "@tiptap/core";
import type { PostStyleConfig } from "@/types/post-style";
import {
  getRichTextSummary,
  getRichTextSummaryWithMentions,
  parseRichTextDocument,
} from "@/lib/rich-text/content";

type PostAttachmentInput = {
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
};

type PostStyleInput = {
  styleConfig?: PostStyleConfig | null;
  styleCss?: string | null;
};

type ContentInput = {
  contentJson?: JSONContent | null;
  contentFormat?: "RICH_TEXT" | "PLAIN_TEXT";
};

type UpdatePostAttachmentInput = PostAttachmentInput & {
  id?: string | null;
};

type CreatePostOptions = {
  postType?: "TEXT" | "VIDEO";
  visibility?: "PUBLIC" | "UNLISTED";
  videoId?: string | null;
  isAnnouncement?: boolean;
} & PostStyleInput & ContentInput;

type UpdatePostInput = {
  title?: string | null;
  content: string;
  styleConfig?: PostStyleConfig | null;
  styleCss?: string | null;
  visibility?: "PUBLIC" | "UNLISTED";
  images?: string[];
  attachments?: UpdatePostAttachmentInput[];
  topicId?: string | null;
  isAnnouncement?: boolean;
} & ContentInput;

type PostEditActor = {
  id: string;
  name?: string | null;
};

function toNullableJsonInput(
  value: PostStyleConfig | null | undefined,
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return Prisma.JsonNull;
  }

  return value as Prisma.InputJsonValue;
}

function normalizeTitle(value: string | null | undefined): string | null {
  return value?.trim() ? value.trim() : null;
}

function stableJson(value: unknown): string {
  if (value === undefined) {
    return "undefined";
  }
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(",")}]`;
  }

  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`)
    .join(",")}}`;
}

function sameUrlSet(existing: Array<{ url: string }>, next: string[]): boolean {
  const existingUrls = new Set(existing.map((image) => image.url));
  return existingUrls.size === next.length && next.every((url) => existingUrls.has(url));
}

function sameAttachments(
  existing: Array<{
    id: string;
    url: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  }>,
  next: UpdatePostAttachmentInput[],
): boolean {
  if (existing.length !== next.length) {
    return false;
  }

  const existingById = new Map(existing.map((attachment) => [attachment.id, attachment]));
  const seenIds = new Set<string>();

  return next.every((attachment) => {
    if (!attachment.id || seenIds.has(attachment.id)) {
      return false;
    }
    seenIds.add(attachment.id);

    const current = existingById.get(attachment.id);
    return Boolean(
      current
      && current.url === attachment.url
      && current.fileName === attachment.fileName
      && current.fileSize === attachment.fileSize
      && current.mimeType === attachment.mimeType,
    );
  });
}

export async function getPosts(topicId?: string) {
  const posts = await prisma.post.findMany({
    where: {
      ...(topicId ? { topicId } : {}),
      visibility: "PUBLIC",
    },
    select: {
      id: true,
      title: true,
      content: true,
      contentJson: true,
      contentFormat: true,
      styleConfig: true,
      styleCss: true,
      postType: true,
      visibility: true,
      viewCount: true,
      pinned: true,
      pinnedAt: true,
      createdAt: true,
      author: {
        select: {
          id: true,
          name: true,
          avatar: true,
          experience: true,
        },
      },
      likes: {
        select: {
          userId: true,
        },
      },
      reposts: {
        select: {
          userId: true,
        },
      },
      comments: {
        select: {
          id: true,
        },
      },
      images: {
        select: {
          url: true,
        },
      },
      attachments: {
        select: {
          id: true,
          url: true,
          fileName: true,
          fileSize: true,
          mimeType: true,
          downloadCount: true,
        },
      },
      topic: {
        select: {
          id: true,
          name: true,
        },
      },
      video: {
        select: {
          id: true,
          status: true,
          hlsMasterUrl: true,
          coverUrl: true,
          durationSec: true,
          width: true,
          height: true,
        },
      },
    },
    orderBy: [
      { pinned: 'desc' },    // 置顶的帖子排在前面
      { pinnedAt: 'desc' },  // 按置顶时间降序
      { createdAt: 'desc' }, // 非置顶帖子按创建时间降序
    ],
  });

  return posts.map(({ contentJson, contentFormat, ...post }) => ({
    ...post,
    contentFormat,
    content: contentFormat === "RICH_TEXT"
      ? (parseRichTextDocument(contentJson)
        ? getRichTextSummaryWithMentions(parseRichTextDocument(contentJson), 300)
        : "")
      : post.content,
  }));
}

export async function getForumAnnouncements(limit = 5) {
  const take = Math.max(1, Math.min(5, Math.trunc(limit)));
  const announcements = await prisma.post.findMany({
    where: {
      isAnnouncement: true,
      announcementAt: { not: null },
      postType: "TEXT",
      visibility: "PUBLIC",
    },
    select: {
      id: true,
      title: true,
      content: true,
      contentJson: true,
      contentFormat: true,
      announcementAt: true,
      createdAt: true,
      author: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
    orderBy: [
      { announcementAt: "desc" },
      { createdAt: "desc" },
    ],
    take,
  });

  return announcements.map(({ contentJson, contentFormat, announcementAt, createdAt, ...announcement }) => ({
    ...announcement,
    contentFormat,
    content: contentFormat === "RICH_TEXT"
      ? (parseRichTextDocument(contentJson)
        ? getRichTextSummary(parseRichTextDocument(contentJson), 300)
        : "")
      : announcement.content,
    announcementAt: announcementAt ?? createdAt,
  }));
}

export async function createPost(
  title: string | undefined | null,
  content: string,
  authorId: string,
  images: string[] = [],
  topicId: string | null = null,
  attachments: PostAttachmentInput[] = [],
  options: CreatePostOptions = {},
) {
  return prisma.post.create({
    data: {
      title: title || null,
      content,
      contentJson: options.contentJson === undefined || options.contentJson === null
        ? Prisma.JsonNull
        : options.contentJson as Prisma.InputJsonValue,
      contentFormat: options.contentFormat ?? (options.postType === "TEXT" ? "RICH_TEXT" : "PLAIN_TEXT"),
      styleConfig: toNullableJsonInput(options.styleConfig),
      styleCss: options.styleCss ?? null,
      authorId,
      postType: options.postType || "TEXT",
      visibility: options.visibility || "PUBLIC",
      videoId: options.videoId || null,
      isAnnouncement: options.isAnnouncement === true,
      announcementAt: options.isAnnouncement === true ? new Date() : null,
      images: {
        create: images.map((url) => ({ url })),
      },
      attachments: {
        create: attachments.map((att) => ({
          url: att.url,
          fileName: att.fileName,
          fileSize: att.fileSize,
          mimeType: att.mimeType,
        })),
      },
      topicId: topicId,
    },
  });
}

export async function getPostById(id: string) {
  return prisma.post.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      content: true,
      contentJson: true,
      contentFormat: true,
      styleConfig: true,
      styleCss: true,
      postType: true,
      visibility: true,
      isAnnouncement: true,
      announcementAt: true,
      pinned: true,
      pinnedAt: true,
      createdAt: true,
      updatedAt: true,
      editHistory: {
        select: {
          id: true,
          editorName: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      viewCount: true,
      author: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      likes: {
        select: {
          userId: true,
        },
      },
      reposts: {
        select: {
          userId: true,
        },
      },
      images: {
        select: {
          url: true,
        },
      },
      attachments: {
        select: {
          id: true,
          url: true,
          fileName: true,
          fileSize: true,
          mimeType: true,
          downloadCount: true,
          },
      },
      topic: {
        select: {
          id: true,
          name: true,
        },
      },
      video: {
        select: {
          id: true,
          status: true,
          hlsMasterUrl: true,
          coverUrl: true,
          durationSec: true,
          width: true,
          height: true,
        },
      },
      comments: {
        select: {
          id: true,
          content: true,
          postId: true,
          createdAt: true,
          pinned: true,
          pinnedAt: true,
          parentId: true,
          replyToId: true,
          author: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          likes: {
            select: {
              userId: true,
            },
          },
          replies: {
            select: {
              id: true,
              content: true,
              postId: true,
              createdAt: true,
              parentId: true,
              replyToId: true,
              author: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                },
              },
              likes: {
                select: {
                  userId: true,
                },
              },
              replyTo: {
                select: {
                  id: true,
                  author: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
        where: {
          parentId: null,
        },
        orderBy: [
          { pinned: 'desc' },
          { pinnedAt: 'desc' },
          { createdAt: 'desc' },
        ],
      },
    },
  });
}

export async function updatePost(id: string, input: UpdatePostInput, editor: PostEditActor) {
  return prisma.$transaction(async (tx) => {
    const existingPost = await tx.post.findUnique({
      where: { id },
      include: {
        images: true,
        attachments: true,
      },
    });

    if (!existingPost) {
      throw new Error("Post not found");
    }

    const nextImages = input.images !== undefined
      ? Array.from(new Set(input.images.map((url) => url.trim()).filter(Boolean)))
      : null;
    const nextAttachments = input.attachments !== undefined
      ? input.attachments.map((attachment) => ({
          ...attachment,
          id: attachment.id || null,
          url: attachment.url.trim(),
          fileName: attachment.fileName.trim(),
          mimeType: attachment.mimeType.trim(),
        }))
      : null;
    const nextTitle = input.title === undefined ? existingPost.title : normalizeTitle(input.title);
    const nextVisibility = input.visibility ?? existingPost.visibility;
    const requestedIsAnnouncement = input.isAnnouncement === undefined
      ? existingPost.isAnnouncement
      : input.isAnnouncement;

    if (requestedIsAnnouncement && existingPost.postType !== "TEXT") {
      throw new Error("Only text posts can be announcements");
    }
    if (requestedIsAnnouncement && nextVisibility !== "PUBLIC") {
      throw new Error("Announcements must be public");
    }

    const nextIsAnnouncement = nextVisibility === "UNLISTED"
      ? false
      : requestedIsAnnouncement;

    const nextAnnouncementAt = nextIsAnnouncement
      ? (existingPost.isAnnouncement && existingPost.announcementAt) || new Date()
      : null;
    const hasAnnouncementChanges = (
      existingPost.isAnnouncement !== nextIsAnnouncement
      || (nextIsAnnouncement && !existingPost.announcementAt)
    );
    const hasImageChanges = nextImages !== null && !sameUrlSet(existingPost.images, nextImages);
    const hasAttachmentChanges = nextAttachments !== null && !sameAttachments(existingPost.attachments, nextAttachments);
    const hasPostChanges = (
      existingPost.content !== input.content
      || (input.contentJson !== undefined && stableJson(existingPost.contentJson) !== stableJson(input.contentJson))
      || (input.contentFormat !== undefined && existingPost.contentFormat !== input.contentFormat)
      || existingPost.title !== nextTitle
      || (input.styleConfig !== undefined && stableJson(existingPost.styleConfig) !== stableJson(input.styleConfig))
      || (input.styleCss !== undefined && existingPost.styleCss !== input.styleCss)
      || (input.visibility !== undefined && existingPost.visibility !== input.visibility)
      || (input.topicId !== undefined && existingPost.topicId !== input.topicId)
      || hasAnnouncementChanges
      || hasImageChanges
      || hasAttachmentChanges
    );

    if (!hasPostChanges) {
      return tx.post.findUnique({
        where: { id },
        include: {
          images: true,
          attachments: true,
          topic: true,
        },
      });
    }

    const postData: Prisma.PostUncheckedUpdateInput = {
      content: input.content,
      ...(input.contentJson !== undefined
        ? { contentJson: input.contentJson === null ? Prisma.JsonNull : input.contentJson as Prisma.InputJsonValue }
        : {}),
      ...(input.contentFormat !== undefined ? { contentFormat: input.contentFormat } : {}),
      ...(input.styleConfig !== undefined ? { styleConfig: toNullableJsonInput(input.styleConfig) } : {}),
      ...(input.styleCss !== undefined ? { styleCss: input.styleCss } : {}),
      title: nextTitle,
      ...(input.visibility ? { visibility: input.visibility } : {}),
      ...(input.topicId !== undefined ? { topicId: input.topicId } : {}),
      isAnnouncement: nextIsAnnouncement,
      announcementAt: nextAnnouncementAt,
    };

    await tx.post.update({
      where: { id },
      data: postData,
    });

    if (hasImageChanges && nextImages) {
      const existingImageUrls = new Set(existingPost.images.map((image) => image.url));

      if (nextImages.length > 0) {
        await tx.postImage.deleteMany({
          where: {
            postId: id,
            url: {
              notIn: nextImages,
            },
          },
        });
      } else {
        await tx.postImage.deleteMany({
          where: { postId: id },
        });
      }

      for (const url of nextImages) {
        if (!existingImageUrls.has(url)) {
          await tx.postImage.create({
            data: {
              postId: id,
              url,
            },
          });
        }
      }
    }

    if (hasAttachmentChanges && nextAttachments) {
      const existingAttachmentsById = new Map(
        existingPost.attachments.map((attachment) => [attachment.id, attachment])
      );
      const keptAttachmentIds = nextAttachments
        .map((attachment) => attachment.id)
        .filter((attachmentId): attachmentId is string =>
          Boolean(attachmentId && existingAttachmentsById.has(attachmentId))
        );

      if (keptAttachmentIds.length > 0) {
        await tx.postAttachment.deleteMany({
          where: {
            postId: id,
            id: {
              notIn: keptAttachmentIds,
            },
          },
        });
      } else {
        await tx.postAttachment.deleteMany({
          where: { postId: id },
        });
      }

      for (const attachment of nextAttachments) {
        const attachmentData = {
          url: attachment.url,
          fileName: attachment.fileName,
          fileSize: attachment.fileSize,
          mimeType: attachment.mimeType,
        };

        if (attachment.id && existingAttachmentsById.has(attachment.id)) {
          await tx.postAttachment.update({
            where: { id: attachment.id },
            data: attachmentData,
          });
        } else {
          await tx.postAttachment.create({
            data: {
              postId: id,
              ...attachmentData,
            },
          });
        }
      }
    }

    await tx.postEditHistory.create({
      data: {
        postId: id,
        editorId: editor.id,
        editorName: editor.name?.trim() || "匿名用户",
      },
    });

    return tx.post.findUnique({
      where: { id },
      include: {
        images: true,
        attachments: true,
        topic: true,
      },
    });
  });
}

export async function deletePost(id: string) {
  return prisma.post.delete({
    where: { id },
  });
}

/**
 * 增加帖子的阅读量
 * 这个操作是非阻塞的，不需要等待结果
 */
export async function incrementViewCount(id: string) {
  try {
    await prisma.post.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });
  } catch (error) {
    // Log error but don't throw - view count increment is not critical
    console.error('Failed to increment view count:', error);
  }
}
