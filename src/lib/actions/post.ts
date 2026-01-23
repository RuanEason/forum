"use server";

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * 冷却时间（秒）：同一用户在此时间内重复访问不会增加阅读量
 * 设置为 1 小时 = 3600 秒
 */
const VIEW_COOLDOWN_SECONDS = 3600;

/**
 * 增加帖子阅读量（带防刷机制）
 * 使用 Cookie 记录用户最近的访问，避免刷新页面重复增加阅读量
 *
 * @param postId - 帖子 ID
 * @returns 操作结果
 */
export async function incrementViewCount(
  postId: string
): Promise<{ success: boolean; message: string; debug?: any }> {
  try {
    // 验证输入
    if (!postId || typeof postId !== "string") {
      console.error("Invalid postId:", { postId, type: typeof postId });
      return {
        success: false,
        message: "Invalid post ID",
        debug: { postId, type: typeof postId },
      };
    }

    const cookieStore = await cookies();
    const cookieName = `viewed_post_${postId}`;

    // 检查是否已有该帖子的阅读记录 Cookie
    const hasViewed = cookieStore.get(cookieName);

    if (hasViewed) {
      // Cookie 存在，说明用户最近已看过此帖子，不增加阅读量
      return {
        success: true,
        message: "Already viewed recently, skipping increment",
      };
    }

    // Cookie 不存在，增加阅读量
    // 先检查帖子是否存在
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, viewCount: true },
    });

    if (!post) {
      console.error("Post not found:", { postId });
      return {
        success: false,
        message: "Post not found",
        debug: { postId },
      };
    }

    // 更新阅读量
    await prisma.post.update({
      where: { id: postId },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });

    // 设置 Cookie，标记用户已阅读此帖子
    // 在生产环境（HTTPS）必须设置 secure: true
    const isProduction = process.env.NODE_ENV === "production";

    // 确定当前域名
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || "localhost:3000";

    try {
      cookieStore.set(cookieName, "true", {
        maxAge: VIEW_COOLDOWN_SECONDS,
        httpOnly: true,
        secure: isProduction,  // 生产环境必须为 true
        sameSite: isProduction ? "lax" : "lax",  // 使用 lax 更安全
        path: "/",
      });
    } catch (cookieError) {
      // Cookie 设置失败不应该影响阅读量更新
      console.error("Failed to set cookie:", {
        error: cookieError instanceof Error ? cookieError.message : String(cookieError),
        isProduction,
        baseUrl,
      });
    }

    revalidatePath(`/post/${postId}`);

    return {
      success: true,
      message: "View count incremented",
      debug: {
        postId,
        newCount: post.viewCount + 1,
        isProduction,
        baseUrl,
      },
    };
  } catch (error) {
    // 详细记录错误信息，方便生产环境调试
    const errorDetails = {
      postId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      env: process.env.NODE_ENV,
      databaseUrl: process.env.DATABASE_URL ? "Set" : "Not set",
      hasPrisma: !!prisma,
      timestamp: new Date().toISOString(),
    };

    console.error("Failed to increment view count:", errorDetails);

    // 在开发环境，抛出错误以便看到完整堆栈
    if (process.env.NODE_ENV === "development") {
      throw error;
    }

    return {
      success: false,
      message: "Failed to increment view count",
      debug: errorDetails,
    };
  }
}
