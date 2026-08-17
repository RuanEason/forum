import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRichTextSummary, parseRichTextDocument } from "@/lib/rich-text/content";

/**
 * 获取帖子列表（App 端专用）
 * 返回包含完整评论信息的帖子列表，与网站端的 /api/post 接口不同
 *
 * @param {NextRequest} request - Next.js 请求对象
 * @returns {Promise<NextResponse>} 包含帖子列表的 JSON 响应，comments 包含完整信息
 * @throws {500} 服务器内部错误时返回
 *
 * @example
 * // 获取所有帖子
 * GET /api/app/post
 * // 按话题筛选
 * GET /api/app/post?topicId=123
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const topicId = searchParams.get('topicId');

    const posts = await prisma.post.findMany({
      where: {
        ...(topicId ? { topicId } : {}),
        visibility: "PUBLIC",
        deletedAt: null,
        author: { deletionRequestedAt: null },
      },
      select: {
        id: true,
        title: true,
        content: true,
        contentJson: true,
        contentFormat: true,
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
        // App 端需要完整的评论信息
        comments: {
          select: {
            id: true,
            content: true,
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
            coverUrl: true,
          },
        },
      },
      orderBy: [
        { pinned: 'desc' },    // 置顶的帖子排在前面
        { pinnedAt: 'desc' },  // 按置顶时间降序
        { createdAt: 'desc' }, // 非置顶帖子按创建时间降序
      ],
    });

    const summarizedPosts = posts.map(({ contentJson, contentFormat, ...post }) => ({
      ...post,
      contentFormat,
      content: contentFormat === "RICH_TEXT"
        ? getRichTextSummary(parseRichTextDocument(contentJson), 300)
        : post.content,
    }));

    return NextResponse.json(summarizedPosts);
  } catch (error) {
    console.error("Get posts error (App):", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
