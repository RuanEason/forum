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
  topicId: string | null = null
) {
  return prisma.post.create({
    data: {
      title: title || null,
      content,
      authorId,
      images: {
        create: images.map((url) => ({ url })),
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
          parentId: null, // 只获取顶层评论
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
  return prisma.post.update({
    where: { id },
    data: {
      viewCount: {
        increment: 1,
      },
    },
  });
}