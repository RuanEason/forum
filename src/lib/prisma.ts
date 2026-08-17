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

const hasRequiredSchemaFields = (client: PrismaClientSingleton) => {
  const runtimeDataModel = (client as unknown as {
    _runtimeDataModel?: {
      models?: Record<string, { fields?: Array<{ name?: string }> }>;
    };
  })._runtimeDataModel;

  const userFields = runtimeDataModel?.models?.User?.fields;
  const postFields = runtimeDataModel?.models?.Post?.fields;
  if (!Array.isArray(userFields) || !Array.isArray(postFields)) {
    return false;
  }

  const userFieldNames = new Set(
    userFields
      .map((field) => field.name)
      .filter((name): name is string => typeof name === "string"),
  );
  const postFieldNames = new Set(
    postFields
      .map((field) => field.name)
      .filter((name): name is string => typeof name === "string"),
  );

  return (
    userFieldNames.has("showUserData")
    && userFieldNames.has("experience")
    && userFieldNames.has("lastLoginRewardAt")
    && userFieldNames.has("dailyLikeRewardCount")
    && userFieldNames.has("lastLikeRewardAt")
    && userFieldNames.has("sessionVersion")
    && userFieldNames.has("deletionRequestedAt")
    && userFieldNames.has("deletionScheduledAt")
    && postFieldNames.has("deletedAt")
    && postFieldNames.has("deleteScheduledAt")
    && Boolean(runtimeDataModel?.models?.MediaCleanupTask)
  );
};

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

const getPrismaClient = () => {
  const existingClient = globalForPrisma.prisma;

  if (existingClient && hasRequiredSchemaFields(existingClient)) {
    return existingClient;
  }

  if (existingClient && !hasRequiredSchemaFields(existingClient)) {
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
