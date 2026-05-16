import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_NAME_LENGTH = 50;
const MAX_BIO_LENGTH = 500;
const MAX_URL_LENGTH = 500;
const VALID_POST_VIEW_MODES = ["both", "title", "content", "titleAndContent"] as const;

type UpdateSettingsBody = {
  name?: unknown;
  avatar?: unknown;
  bio?: unknown;
  postViewMode?: unknown;
  coverImage?: unknown;
  showUserData?: unknown;
};

function normalizeOptionalString(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = (session as { user?: { id?: string } } | null)?.user;

    if (!sessionUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as UpdateSettingsBody;
    const updateData: {
      name?: string;
      avatar?: string | null;
      bio?: string | null;
      postViewMode?: string;
      coverImage?: string | null;
      showUserData?: boolean;
    } = {};

    if (body.name !== undefined) {
      if (typeof body.name !== "string") {
        return NextResponse.json({ error: "name must be a string" }, { status: 400 });
      }
      const name = body.name.trim();
      if (!name) {
        return NextResponse.json({ error: "name is required" }, { status: 400 });
      }
      if (name.length > MAX_NAME_LENGTH) {
        return NextResponse.json(
          { error: `name must be less than ${MAX_NAME_LENGTH} characters` },
          { status: 400 },
        );
      }
      updateData.name = name;
    }

    if (body.avatar !== undefined) {
      const avatar = normalizeOptionalString(body.avatar);
      if (avatar === undefined) {
        return NextResponse.json({ error: "avatar must be a string or null" }, { status: 400 });
      }
      if (avatar && avatar.length > MAX_URL_LENGTH) {
        return NextResponse.json(
          { error: `avatar must be less than ${MAX_URL_LENGTH} characters` },
          { status: 400 },
        );
      }
      updateData.avatar = avatar;
    }

    if (body.bio !== undefined) {
      const bio = normalizeOptionalString(body.bio);
      if (bio === undefined) {
        return NextResponse.json({ error: "bio must be a string or null" }, { status: 400 });
      }
      if (bio && bio.length > MAX_BIO_LENGTH) {
        return NextResponse.json(
          { error: `bio must be less than ${MAX_BIO_LENGTH} characters` },
          { status: 400 },
        );
      }
      updateData.bio = bio;
    }

    if (body.coverImage !== undefined) {
      const coverImage = normalizeOptionalString(body.coverImage);
      if (coverImage === undefined) {
        return NextResponse.json({ error: "coverImage must be a string or null" }, { status: 400 });
      }
      if (coverImage && coverImage.length > MAX_URL_LENGTH) {
        return NextResponse.json(
          { error: `coverImage must be less than ${MAX_URL_LENGTH} characters` },
          { status: 400 },
        );
      }
      updateData.coverImage = coverImage;
    }

    if (body.postViewMode !== undefined) {
      if (typeof body.postViewMode !== "string") {
        return NextResponse.json({ error: "postViewMode must be a string" }, { status: 400 });
      }
      if (!VALID_POST_VIEW_MODES.includes(body.postViewMode as (typeof VALID_POST_VIEW_MODES)[number])) {
        return NextResponse.json(
          { error: `postViewMode must be one of: ${VALID_POST_VIEW_MODES.join(", ")}` },
          { status: 400 },
        );
      }
      updateData.postViewMode = body.postViewMode;
    }

    if (body.showUserData !== undefined) {
      if (typeof body.showUserData !== "boolean") {
        return NextResponse.json({ error: "showUserData must be a boolean" }, { status: 400 });
      }
      updateData.showUserData = body.showUserData;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: sessionUser.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        bio: true,
        postViewMode: true,
        coverImage: true,
        showUserData: true,
      },
    });

    return NextResponse.json({ message: "Settings updated successfully", user });
  } catch (error) {
    console.error("Web settings update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
