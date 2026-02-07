import { prisma } from "@/lib/prisma";

export const EXPERIENCE_REWARDS = {
  dailyLogin: 5,
  comment: 10,
  like: 5,
  post: 15,
} as const;

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
