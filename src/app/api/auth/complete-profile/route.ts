import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// Maximum field lengths
const MAX_NAME_LENGTH = 50;
const MAX_BIO_LENGTH = 500;
const MAX_URL_LENGTH = 500;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, avatar, bio, postViewMode } = await request.json();

    // Validate name
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (name.length > MAX_NAME_LENGTH) {
      return NextResponse.json(
        { error: `Name must be less than ${MAX_NAME_LENGTH} characters` },
        { status: 400 }
      );
    }

    // Validate avatar (optional)
    if (avatar !== undefined && avatar !== null) {
      if (typeof avatar !== 'string') {
        return NextResponse.json({ error: "Avatar must be a string" }, { status: 400 });
      }
      if (avatar.length > MAX_URL_LENGTH) {
        return NextResponse.json(
          { error: `Avatar URL must be less than ${MAX_URL_LENGTH} characters` },
          { status: 400 }
        );
      }
    }

    // Validate bio (optional)
    if (bio !== undefined && bio !== null) {
      if (typeof bio !== 'string') {
        return NextResponse.json({ error: "Bio must be a string" }, { status: 400 });
      }
      if (bio.length > MAX_BIO_LENGTH) {
        return NextResponse.json(
          { error: `Bio must be less than ${MAX_BIO_LENGTH} characters` },
          { status: 400 }
        );
      }
    }

    // Validate postViewMode (optional)
    if (postViewMode !== undefined && postViewMode !== null) {
      const validModes = ['both', 'title', 'content', 'titleAndContent'];
      if (!validModes.includes(postViewMode)) {
        return NextResponse.json(
          { error: `postViewMode must be one of: ${validModes.join(', ')}` },
          { status: 400 }
        );
      }
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        avatar,
        bio,
        postViewMode,
      }
    });

    return NextResponse.json({ message: "Profile updated successfully", user }, { status: 200 });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}