import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated";
import { buildLoginUser, type LoginUser } from "@/lib/login-user";
import type { WeChatIdentity } from "@/lib/wechat";

export async function findWeChatLinkedLoginUser(identity: WeChatIdentity): Promise<LoginUser | null> {
  const orConditions: Prisma.UserWhereInput[] = [{ wechatOpenId: identity.wechatOpenId }];

  if (identity.wechatUnionId) {
    orConditions.push({ wechatUnionId: identity.wechatUnionId });
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: orConditions,
    },
  });

  if (!existingUser) {
    return null;
  }

  const updates: {
    wechatOpenId?: string;
    wechatUnionId?: string | null;
    wechatNickname?: string | null;
    wechatAvatar?: string | null;
    wechatLastAuthAt?: Date;
    name?: string | null;
    avatar?: string | null;
  } = {
    wechatLastAuthAt: new Date(),
  };

  if (existingUser.wechatOpenId !== identity.wechatOpenId) {
    const openIdOwner = await prisma.user.findUnique({
      where: { wechatOpenId: identity.wechatOpenId },
      select: { id: true },
    });

    if (!openIdOwner || openIdOwner.id === existingUser.id) {
      updates.wechatOpenId = identity.wechatOpenId;
    }
  }

  if (identity.wechatUnionId && existingUser.wechatUnionId !== identity.wechatUnionId) {
    const unionIdOwner = await prisma.user.findUnique({
      where: { wechatUnionId: identity.wechatUnionId },
      select: { id: true },
    });

    if (!unionIdOwner || unionIdOwner.id === existingUser.id) {
      updates.wechatUnionId = identity.wechatUnionId;
    }
  }

  if (identity.name && existingUser.wechatNickname !== identity.name) {
    updates.wechatNickname = identity.name;
  }

  if (identity.avatar && existingUser.wechatAvatar !== identity.avatar) {
    updates.wechatAvatar = identity.avatar;
  }

  if (!existingUser.name && identity.name) {
    updates.name = identity.name;
  }

  if (!existingUser.avatar && identity.avatar) {
    updates.avatar = identity.avatar;
  }

  if (Object.keys(updates).length > 0) {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: updates,
    });
  }

  return buildLoginUser(existingUser.id);
}
