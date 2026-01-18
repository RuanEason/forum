import { NextRequest, NextResponse } from "next/server";
import { createPost, updatePost, deletePost, getPosts } from "@/lib/post";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma"; // 导入 prisma 实例

/**
 * 帖子字段最大长度限制
 */
// Maximum field lengths
/** @type {const} 帖子标题最大长度（字符数） */
const MAX_TITLE_LENGTH = 200;
/** @type {const} 帖子内容最大长度（字符数） */
const MAX_CONTENT_LENGTH = 10000;
/** @type {const} 帖子图片最大数量 */
const MAX_IMAGES = 10;

/**
 * 获取帖子列表
 * 根据 URL 查询参数中的 topicId 筛选帖子
 * @param {NextRequest} request - Next.js 请求对象
 * @returns {Promise<NextResponse>} 包含帖子列表的 JSON 响应
 * @throws {500} 服务器内部错误时返回
 * @example
 * // 获取所有帖子
 * GET /api/post
 * // 按话题筛选
 * GET /pi/post?topicId=123
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const topicId = searchParams.get('topicId');

    const posts = await getPosts(topicId || undefined);
    return NextResponse.json(posts);
  } catch (error) {
    console.error("Get posts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * 创建新帖子
 * 验证并创建新帖子，支持标题、内容、图片和话题关联
 *
 * @param {NextRequest} request - Next.js 请求对象
 * @param {Object} request.body - 包含帖子数据的请求体
 * @param {string} [request.body.title] - 帖子标题（可选）
 * @param {string} request.body.content - 帖子内容
 * @param {string[]} [request.body.images] - 图片 URL 数组（最多 10 张）
 * @param {string} [request.body.topicId] - 关联话题 ID
 * @returns {Promise<NextResponse>} 201 创建成功，包含创建的帖子数据
 * @throws {401} Unauthorized - 用户未登录
 * @throws {400} Bad Request - 请求参数无效或验证失败
 * @throws {500} Internal Server Error - 服务器内部错误
 *
 * @example
 * // 创建纯文本帖子
 * POST /api/post
 * {
 *   "content": "这是我的第一篇帖子"
 * }
 *
 * // 创建带标题和图片的帖子
 * POST /api/post
 * {
 *   "title": "标题",
 *   "content": "内容",
 *   "images": ["https://example.com/image1.jpg"],
 *   "topicId": "topic123"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, content, images, topicId } = await request.json();

    // Validate title (optional)
    if (title !== undefined && title !== null) {
      if (typeof title !== 'string') {
        return NextResponse.json({ error: "Title must be a string" }, { status: 400 });
      }
      if (title.length > MAX_TITLE_LENGTH) {
        return NextResponse.json(
          { error: `Title must be less than ${MAX_TITLE_LENGTH} characters` },
          { status: 400 }
        );
      }
    }

    // Validate content
    if (content !== undefined && content !== null) {
      if (typeof content !== 'string') {
        return NextResponse.json({ error: "Content must be a string" }, { status: 400 });
      }
      if (content.length > MAX_CONTENT_LENGTH) {
        return NextResponse.json(
          { error: `Content must be less than ${MAX_CONTENT_LENGTH} characters` },
          { status: 400 }
        );
      }
    }

    // Validate images (optional array of strings)
    if (images !== undefined && images !== null) {
      if (!Array.isArray(images)) {
        return NextResponse.json({ error: "Images must be an array" }, { status: 400 });
      }
      if (images.length > MAX_IMAGES) {
        return NextResponse.json(
          { error: `Maximum ${MAX_IMAGES} images allowed` },
          { status: 400 }
        );
      }
      for (const img of images) {
        if (typeof img !== 'string') {
          return NextResponse.json({ error: "Each image must be a string URL" }, { status: 400 });
        }
      }
    }

    // Require either content or images
    if ((!content || content.trim() === '') && (!images || images.length === 0)) {
      return NextResponse.json(
        { error: "Content or images are required" },
        { status: 400 }
      );
    }

    // 传入 title
    const post = await createPost(title, content, session.user.id, images, topicId);

    return NextResponse.json({ message: "Post created successfully", post }, { status: 201 });
  } catch (error) {
    console.error("Create post error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * 更新帖子
 * 只有帖子作者或管理员可以编辑帖子
 *
 * @param {NextRequest} request - Next.js 请求对象
 * @param {Object} request.body - 请求体
 * @param {string} request.body.id - 帖子 ID
 * @param {string} request.body.content - 更新的帖子内容
 * @param {string} [request.body.title] - 更新的帖子标题（可选）
 * @returns {Promise<NextResponse>} 200 更新成功，包含更新后的帖子数据
 * @throws {401} Unauthorized - 用户未登录
 * @throws {403} Forbidden - 无权限编辑（非作者且非管理员）
 * @throws {404} Not Found - 帖子不存在
 * @throws {400} Bad Request - 参数无效
 * @throws {500} Internal Server Error - 服务器内部错误
 *
 * @example
 * PUT /api/post
 * {
 *   "id": "post123",
 *   "title": "更新后的标题",
 *   "content": "更新后的内容"
 * }
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, title, content } = await request.json();

    if (!id || !content) {
      return NextResponse.json(
        { error: "Post ID and content are required" },
        { status: 400 }
      );
    }

    const existingPost = await prisma.post.findUnique({
      where: { id: id },
    });

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // 只有作者或管理员才能编辑帖子
    if (existingPost.authorId !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updatedPost = await updatePost(id, title, content);

    return NextResponse.json({ message: "Post updated successfully", post: updatedPost }, { status: 200 });
  } catch (error) {
    console.error("Update post error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * 删除帖子
 * 只有帖子作者或管理员可以删除帖子
 *
 * @param {NextRequest} request - Next.js 请求对象
 * @param {Object} request.body - 请求体
 * @param {string} request.body.id - 要删除的帖子 ID
 * @returns {Promise<NextResponse>} 200 删除成功
 * @throws {401} Unauthorized - 用户未登录
 * @throws {403} Forbidden - 无权限删除（非作者且非管理员）
 * @throws {404} Not Found - 帖子不存在
 * @throws {400} Bad Request - 参数无效
 * @throws {500} Internal Server Error - 服务器内部错误
 *
 * @example
 * DELETE /api/post
 * {
 *   "id": "post123"
 * }
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
    }

    const existingPost = await prisma.post.findUnique({
      where: { id: id },
    });

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // 只有作者或管理员才能删除帖子
    if (existingPost.authorId !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await deletePost(id);

    return NextResponse.json({ message: "Post deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Delete post error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}