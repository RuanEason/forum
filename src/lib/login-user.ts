import { prisma } from "@/lib/prisma";
import { getUserLevel, rewardDailyLoginExperience } from "@/lib/experience";

export type LoginUser = {
  id: string;
  email: string | null;
  name: string | null;
  role: string;
  banned: boolean;
  sessionVersion: number;
  deletionRequestedAt: Date | null;
  deletionScheduledAt: Date | null;
  avatar: string | null;
  postViewMode: string;
  showUserData: boolean;
  coverImage: string | null;
  experience: number;
  level: number;
};

export async function buildLoginUser(userId: string): Promise<LoginUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found after social login");
  }

  if (user.banned || user.deletionRequestedAt) {
    throw new Error("This account has been disabled");
  }

  let currentExperience = user.experience;

  try {
    const loginRewardResult = await rewardDailyLoginExperience(user.id);
    if (loginRewardResult.awarded && typeof loginRewardResult.experience === "number") {
      currentExperience = loginRewardResult.experience;
    }
  } catch (error) {
    console.error("Failed to reward daily login experience:", error);
  }

  return {
    id: user.id,
    email: user.email ?? null,
    name: user.name ?? null,
    role: user.role,
    banned: user.banned,
    sessionVersion: user.sessionVersion,
    deletionRequestedAt: user.deletionRequestedAt,
    deletionScheduledAt: user.deletionScheduledAt,
    avatar: user.avatar ?? null,
    postViewMode: user.postViewMode,
    showUserData: user.showUserData,
    coverImage: user.coverImage ?? null,
    experience: currentExperience,
    level: getUserLevel(currentExperience),
  };
}
