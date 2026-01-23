import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * 数据库连接测试端点
 * 用于验证生产环境数据库连接是否正常
 *
 * @example
 * GET /api/test-db
 */
export async function GET() {
  const startTime = Date.now();

  try {
    // 测试数据库连接
    await prisma.$connect();

    // 执行简单查询
    const postCount = await prisma.post.count();
    const userCount = await prisma.user.count();

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      data: {
        postCount,
        userCount,
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        databaseUrl: process.env.DATABASE_URL ? "Set" : "Not set",
      },
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;

    // 详细错误信息
    const errorDetails = {
      success: false,
      message: "Database connection failed",
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        code: (error as any).code,
      } : String(error),
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      databaseUrl: process.env.DATABASE_URL ? "Set" : "Not set",
    };

    console.error("Database test failed:", errorDetails);

    return NextResponse.json(errorDetails, { status: 500 });
  } finally {
    // 确保连接关闭
    await prisma.$disconnect();
  }
}
