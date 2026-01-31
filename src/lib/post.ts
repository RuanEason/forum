import { prisma } from "@/lib/prisma";

export async function getPosts(topicId?: string) {
  return prisma.post.findMany({
    where: topicId ? { topicId } : undefined,
    select: {
      id: true,
      title: true,
      content: true,
      viewCount: true,
      createdAt: true,
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
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function createPost(
  title: string | undefined | null,
  content: string,
  authorId: string,
  images: string[] = [],
  topicId: string | null = null,
  attachments: Array<{ url: string; fileName: string; fileSize: number; mimeType: string }> = []
) {
  return prisma.post.create({
    data: {
      title: title || null,
      content,
      authorId,
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
    include: {
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
      comments: {
        include: {
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
            include: {
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
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
        where: {
          parentId: null,
        },
        orderBy: {
          createdAt: "desc",
        },
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