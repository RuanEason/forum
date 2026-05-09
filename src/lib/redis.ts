import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const createRedisClient = () => {
  const client = createClient({
    url: redisUrl,
  });

  client.on("error", (error) => {
    console.error("Redis Client Error:", error);
  });

  return client;
};

type RedisClient = ReturnType<typeof createRedisClient>;

const globalForRedis = globalThis as unknown as {
  redis: RedisClient | undefined;
  redisConnectPromise: Promise<RedisClient> | undefined;
};

export const redis = globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

export async function connectRedis() {
  if (redis.isOpen) {
    return redis;
  }

  if (!globalForRedis.redisConnectPromise) {
    globalForRedis.redisConnectPromise = redis.connect()
      .then(() => redis)
      .finally(() => {
        globalForRedis.redisConnectPromise = undefined;
      });
  }

  return globalForRedis.redisConnectPromise;
}
