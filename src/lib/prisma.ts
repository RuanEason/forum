import { PrismaClient } from "../generated";

const prismaClientSingleton = () => {
  return new PrismaClient({
    // 连接池配置
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // 日志配置
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    // 连接池内部配置
    // 注意：这些配置需要在 DATABASE_URL 中通过查询参数设置
    // 例如: mysql://user:pass@host:port/db?connection_limit=20&pool_timeout=30
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const hasFollowDelegate = (client: PrismaClientSingleton) => {
  const followDelegate = (client as unknown as { follow?: { count?: unknown } }).follow;
  return typeof followDelegate?.count === "function";
};

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

const getPrismaClient = () => {
  const existingClient = globalForPrisma.prisma;

  if (existingClient && hasFollowDelegate(existingClient)) {
    return existingClient;
  }

  if (existingClient && !hasFollowDelegate(existingClient)) {
    void existingClient.$disconnect().catch(() => undefined);
  }

  return prismaClientSingleton();
};

export const prisma = getPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// 应用关闭时断开数据库连接
if (process.env.NODE_ENV === "production") {
  process.on("beforeExit", async () => {
    await prisma.$disconnect();
  });
}
