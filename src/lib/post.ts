import { prisma } from "@/lib/prisma";

export async function getPosts() {
  return prisma.post.findMany({
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
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function createPost(content: string, authorId: string, images: string[] = []) {
  return prisma.post.create({
    data: {
      content,
      authorId,
      images: {
        create: images.map((url) => ({ url })),
      },
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

export async function updatePost(id: string, content: string) {
  return prisma.post.update({
    where: { id },
    data: { content },
  });
}

export async function deletePost(id: string) {
  return prisma.post.delete({
    where: { id },
  });
}