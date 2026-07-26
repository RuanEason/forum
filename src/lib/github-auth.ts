import { prisma } from "@/lib/prisma";
import type { GitHubIdentity } from "@/lib/github";
import { buildLoginUser, type LoginUser } from "@/lib/login-user";

export async function findGitHubLinkedLoginUser(identity: GitHubIdentity): Promise<LoginUser | null> {
  const existingByGitHubId = await prisma.user.findUnique({
    where: { githubUserId: identity.githubUserId },
  });

  if (!existingByGitHubId) {
    return null;
  }

  const updates: {
    email?: string;
    name?: string | null;
    avatar?: string | null;
  } = {};

  if (identity.email && existingByGitHubId.email !== identity.email) {
    const emailOwner = await prisma.user.findUnique({
      where: { email: identity.email },
      select: { id: true },
    });

    if (!emailOwner || emailOwner.id === existingByGitHubId.id) {
      updates.email = identity.email;
    }
  }

  if (!existingByGitHubId.name && identity.name) {
    updates.name = identity.name;
  }

  if (!existingByGitHubId.avatar && identity.avatar) {
    updates.avatar = identity.avatar;
  }

  if (Object.keys(updates).length > 0) {
    await prisma.user.update({
      where: { id: existingByGitHubId.id },
      data: updates,
    });
  }

  return buildLoginUser(existingByGitHubId.id);
}
