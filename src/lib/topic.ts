import { prisma } from "@/lib/prisma";
import { connectRedis } from "@/lib/redis";
import type { HomeTopic, HomeTopicsResponse } from "@/types/topic";

const HOT_TOPIC_KEY = "forum:topics:hot";
const HOME_TOPIC_LIMIT = 20;
const REDIS_TIMEOUT_MS = 800;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Redis request timed out"));
    }, timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

async function readHotTopicIds(): Promise<string[] | null> {
  try {
    const client = await withTimeout(connectRedis(), REDIS_TIMEOUT_MS);
    const topicIds = await withTimeout(
      client.zRange(HOT_TOPIC_KEY, 0, HOME_TOPIC_LIMIT - 1, { REV: true }),
      REDIS_TIMEOUT_MS,
    );

    return topicIds;
  } catch {
    return null;
  }
}

async function getTopicsByIds(ids: string[]): Promise<HomeTopic[]> {
  if (ids.length === 0) {
    return [];
  }

  const topics = await prisma.topic.findMany({
    where: { id: { in: ids } },
    include: {
      _count: {
        select: { posts: true },
      },
    },
  });

  const topicsById = new Map(topics.map((topic) => [topic.id, topic]));

  return ids.flatMap((id) => {
    const topic = topicsById.get(id);
    return topic
      ? [{ id: topic.id, name: topic.name, postCount: topic._count.posts }]
      : [];
  });
}

async function getDatabaseTopics(limit?: number): Promise<HomeTopic[]> {
  const topics = await prisma.topic.findMany({
    ...(limit === undefined ? {} : { take: limit }),
    orderBy: [{ posts: { _count: "desc" } }, { name: "asc" }],
    include: {
      _count: {
        select: { posts: true },
      },
    },
  });

  return topics.map((topic) => ({
    id: topic.id,
    name: topic.name,
    postCount: topic._count.posts,
  }));
}

export async function getHomeTopics({
  expanded = false,
}: {
  expanded?: boolean;
} = {}): Promise<HomeTopicsResponse> {
  if (!expanded) {
    const hotTopicIds = await readHotTopicIds();

    if (hotTopicIds && hotTopicIds.length > 0) {
      const redisTopics = await getTopicsByIds(hotTopicIds);

      if (redisTopics.length >= HOME_TOPIC_LIMIT) {
        const totalTopicCount = await prisma.topic.count();

        return {
          topics: redisTopics.slice(0, HOME_TOPIC_LIMIT),
          hasMore: totalTopicCount > HOME_TOPIC_LIMIT,
          source: "redis",
        };
      }
    }
  }

  const databaseTopics = await getDatabaseTopics(
    expanded ? undefined : HOME_TOPIC_LIMIT + 1,
  );

  return {
    topics: expanded
      ? databaseTopics
      : databaseTopics.slice(0, HOME_TOPIC_LIMIT),
    hasMore: !expanded && databaseTopics.length > HOME_TOPIC_LIMIT,
    source: "database",
  };
}
