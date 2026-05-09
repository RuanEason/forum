import { prisma } from "@/lib/prisma";

type PostAttachmentInput = {
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
};

type CreatePostOptions = {
  postType?: "TEXT" | "VIDEO";
  visibility?: "PUBLIC" | "UNLISTED";
  videoId?: string | null;
};

export async function getPosts(topicId?: string) {
  return prisma.post.findMany({
    where: {
      ...(topicId ? { topicId } : {}),
      visibility: "PUBLIC",
    },
    select: {
      id: true,
      title: true,
      content: true,
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
      authorId,
      postType: options.postType || "TEXT",
      visibility: options.visibility || "PUBLIC",
      videoId: options.videoId || null,
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
      postType: true,
      visibility: true,
      pinned: true,
      pinnedAt: true,
      createdAt: true,
      updatedAt: true,
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

export async function updatePost(id: string, title: string | undefined | null, content: string) {
  return prisma.post.update({
    where: { id },
    data: {
      content,
      title: title || null,
    },
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
