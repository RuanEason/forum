import { prisma } from "@/lib/prisma";

export const EXPERIENCE_REWARDS = {
  dailyLogin: 5,
  comment: 7,
  like: 5,
  post: 10,
} as const;

export const DAILY_EXPERIENCE_LIMITS = {
  like: 3,
  comment: 3,
  post: 3,
} as const;

type ExperienceAction = keyof typeof DAILY_EXPERIENCE_LIMITS;

export const LEVEL_THRESHOLDS = [
  { level: 1, requiredExperience: 50 },
  { level: 2, requiredExperience: 200 },
  { level: 3, requiredExperience: 800 },
  { level: 4, requiredExperience: 1500 },
  { level: 5, requiredExperience: 3000 },
  { level: 6, requiredExperience: 6666 },
] as const;

export function getUserLevel(experience: number): number {
  let level = 1;

  for (const threshold of LEVEL_THRESHOLDS) {
    if (experience >= threshold.requiredExperience) {
      level = threshold.level;
    } else {
      break;
    }
  }

  return level;
}

export async function addUserExperience(userId: string, amount: number) {
  if (amount <= 0) {
    return null;
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      experience: {
        increment: amount,
      },
    },
    select: {
      experience: true,
    },
  });

  return {
    experience: user.experience,
    level: getUserLevel(user.experience),
  };
}

export async function rewardDailyLoginExperience(userId: string) {
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  const rewardResult = await prisma.user.updateMany({
    where: {
      id: userId,
      OR: [
        { lastLoginRewardAt: null },
        { lastLoginRewardAt: { lt: startOfToday } },
      ],
    },
    data: {
      experience: {
        increment: EXPERIENCE_REWARDS.dailyLogin,
      },
      lastLoginRewardAt: now,
    },
  });

  if (rewardResult.count === 0) {
    return { awarded: false };
  }

  const updatedUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { experience: true },
  });

  const experience = updatedUser?.experience ?? 0;

  return {
    awarded: true,
    experience,
    level: getUserLevel(experience),
  };
}

function getStartOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export async function rewardActionExperience(userId: string, action: ExperienceAction) {
  const startOfToday = getStartOfToday();
  const dailyLimit = DAILY_EXPERIENCE_LIMITS[action];

  if (action === "like") {
    const now = new Date();

    const rewardAmount = EXPERIENCE_REWARDS.like;

    const resetAndRewardResult = await prisma.$executeRawUnsafe(
      `
      UPDATE \`User\`
      SET
        \`dailyLikeRewardCount\` = 1,
        \`lastLikeRewardAt\` = ?,
        \`experience\` = \`experience\` + ?
      WHERE
        \`id\` = ?
        AND (
          \`lastLikeRewardAt\` IS NULL
          OR \`lastLikeRewardAt\` < ?
        )
      `,
      now,
      rewardAmount,
      userId,
      startOfToday,
    );

    let awarded = resetAndRewardResult > 0;

    if (!awarded) {
      const increaseAndRewardResult = await prisma.$executeRawUnsafe(
        `
        UPDATE \`User\`
        SET
          \`dailyLikeRewardCount\` = \`dailyLikeRewardCount\` + 1,
          \`lastLikeRewardAt\` = ?,
          \`experience\` = \`experience\` + ?
        WHERE
          \`id\` = ?
          AND \`lastLikeRewardAt\` >= ?
          AND \`dailyLikeRewardCount\` < ?
        `,
        now,
        rewardAmount,
        userId,
        startOfToday,
        dailyLimit,
      );

      awarded = increaseAndRewardResult > 0;
    }

    const users = await prisma.$queryRawUnsafe<Array<{
      experience: number;
      dailyLikeRewardCount: number;
      lastLikeRewardAt: Date | null;
    }>>(
      `
      SELECT
        \`experience\`,
        \`dailyLikeRewardCount\`,
        \`lastLikeRewardAt\`
      FROM \`User\`
      WHERE \`id\` = ?
      LIMIT 1
      `,
      userId,
    );

    const user = users[0];

    const todayActionCount = user?.lastLikeRewardAt && user.lastLikeRewardAt >= startOfToday
      ? user.dailyLikeRewardCount
      : 0;

    if (!awarded || user == null) {
      return {
        awarded: false,
        todayActionCount,
        dailyLimit,
      };
    }

    return {
      awarded: true,
      todayActionCount,
      dailyLimit,
      experience: user.experience,
      level: getUserLevel(user.experience),
    };
  }

  let todayActionCount = 0;

  if (action === "comment") {
    todayActionCount = await prisma.comment.count({
      where: {
        authorId: userId,
        createdAt: { gte: startOfToday },
      },
    });
  } else {
    todayActionCount = await prisma.post.count({
      where: {
        authorId: userId,
        createdAt: { gte: startOfToday },
      },
    });
  }

  if (todayActionCount > dailyLimit) {
    return {
      awarded: false,
      todayActionCount,
      dailyLimit,
    };
  }

  const rewardResult = await addUserExperience(userId, EXPERIENCE_REWARDS[action]);

  if (!rewardResult) {
    return {
      awarded: false,
      todayActionCount,
      dailyLimit,
    };
  }

  return {
    awarded: true,
    todayActionCount,
    dailyLimit,
    experience: rewardResult.experience,
    level: rewardResult.level,
  };
}
