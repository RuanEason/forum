import { prisma } from "@/lib/prisma";
import { getUserLevel, rewardDailyLoginExperience } from "@/lib/experience";
import {
  type CasdoorIdentity,
} from "@/lib/casdoor";

type LoginUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  avatar: string | null;
  postViewMode: string;
  showUserData: boolean;
  coverImage: string | null;
  experience: number;
  level: number;
};

async function buildLoginUser(userId: string): Promise<LoginUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found after third-party login");
  }

  if (user.banned) {
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
    email: user.email,
    name: user.name ?? null,
    role: user.role,
    avatar: user.avatar ?? null,
    postViewMode: user.postViewMode,
    showUserData: user.showUserData,
    coverImage: user.coverImage ?? null,
    experience: currentExperience,
    level: getUserLevel(currentExperience),
  };
}

export async function findCasdoorLinkedLoginUser(identity: CasdoorIdentity): Promise<LoginUser | null> {
  const existingByCasdoorId = await prisma.user.findUnique({
    where: { casdoorUserId: identity.casdoorUserId },
  });

  if (!existingByCasdoorId) {
    return null;
  }

  const updates: {
    email?: string;
    name?: string | null;
    avatar?: string | null;
  } = {};

  if (identity.email && existingByCasdoorId.email !== identity.email) {
    const emailOwner = await prisma.user.findUnique({
      where: { email: identity.email },
      select: { id: true },
    });

    if (!emailOwner || emailOwner.id === existingByCasdoorId.id) {
      updates.email = identity.email;
    }
  }

  if (!existingByCasdoorId.name && identity.name) {
    updates.name = identity.name;
  }

  if (!existingByCasdoorId.avatar && identity.avatar) {
    updates.avatar = identity.avatar;
  }

  if (Object.keys(updates).length > 0) {
    await prisma.user.update({
      where: { id: existingByCasdoorId.id },
      data: updates,
    });
  }

  return buildLoginUser(existingByCasdoorId.id);
}
