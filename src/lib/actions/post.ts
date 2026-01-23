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
): Promise<{ success: boolean; message: string }> {
  try {
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
    cookieStore.set(cookieName, "true", {
      maxAge: VIEW_COOLDOWN_SECONDS,
      httpOnly: true,
      secure: isProduction,  // 生产环境必须为 true
      sameSite: isProduction ? "none" : "lax",  // 跨域场景使用 none
      path: "/",
      // 不设置 domain，使用默认值（自动适配当前域名）
    });

    revalidatePath(`/post/${postId}`);

    return {
      success: true,
      message: "View count incremented",
    };
  } catch (error) {
    // 详细记录错误信息，方便生产环境调试
    console.error("Failed to increment view count:", {
      postId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      env: process.env.NODE_ENV,
      databaseUrl: process.env.DATABASE_URL ? "Set" : "Not set",
    });
    return {
      success: false,
      message: "Failed to increment view count",
    };
  }
}
