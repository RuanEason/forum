import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserLevel } from "@/lib/experience";
import { getSessionUser } from "@/app/api/app/_shared/auth";
import {
  MAX_BIO_LENGTH,
  MAX_NAME_LENGTH,
  MAX_URL_LENGTH,
  validPostViewModes,
} from "@/app/api/app/_shared/user";

type UpdateSettingsBody = {
  name?: unknown;
  avatar?: unknown;
  bio?: unknown;
  postViewMode?: unknown;
  coverImage?: unknown;
  showUserData?: unknown;
};

function normalizeOptionalString(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        bio: true,
        coverImage: true,
        postViewMode: true,
        showUserData: true,
        experience: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...user,
      level: getUserLevel(user.experience),
    });
  } catch (error) {
    console.error("App settings get error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as UpdateSettingsBody;
    const data: {
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
      data.name = name;
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
      data.avatar = avatar;
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
      data.bio = bio;
    }

    if (body.coverImage !== undefined) {
      const coverImage = normalizeOptionalString(body.coverImage);
      if (coverImage === undefined) {
        return NextResponse.json(
          { error: "coverImage must be a string or null" },
          { status: 400 },
        );
      }
      if (coverImage && coverImage.length > MAX_URL_LENGTH) {
        return NextResponse.json(
          { error: `coverImage must be less than ${MAX_URL_LENGTH} characters` },
          { status: 400 },
        );
      }
      data.coverImage = coverImage;
    }

    if (body.postViewMode !== undefined) {
      if (typeof body.postViewMode !== "string") {
        return NextResponse.json({ error: "postViewMode must be a string" }, { status: 400 });
      }
      if (!validPostViewModes.includes(body.postViewMode as (typeof validPostViewModes)[number])) {
        return NextResponse.json(
          {
            error: `postViewMode must be one of: ${validPostViewModes.join(", ")}`,
          },
          { status: 400 },
        );
      }
      data.postViewMode = body.postViewMode;
    }

    if (body.showUserData !== undefined) {
      if (typeof body.showUserData !== "boolean") {
        return NextResponse.json({ error: "showUserData must be a boolean" }, { status: 400 });
      }
      data.showUserData = body.showUserData;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: sessionUser.id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        bio: true,
        coverImage: true,
        postViewMode: true,
        showUserData: true,
        experience: true,
      },
    });

    return NextResponse.json({
      message: "Settings updated successfully",
      user: {
        ...user,
        level: getUserLevel(user.experience),
      },
    });
  } catch (error) {
    console.error("App settings update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

