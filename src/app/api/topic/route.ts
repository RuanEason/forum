import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// Maximum field lengths
const MAX_TOPIC_NAME_LENGTH = 50;
const MAX_TOPIC_DESCRIPTION_LENGTH = 500;
const MAX_TOPIC_ICON_LENGTH = 100;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    const topics = await prisma.topic.findMany({
      where: query
        ? {
            name: {
              contains: query,
              // mode: 'insensitive', // prisma mysql provider case sensitivity depends on collation usually
            },
          }
        : undefined,
      orderBy: {
        posts: {
          _count: "desc",
        },
      },
      take: 20,
    });

    return NextResponse.json(topics);
  } catch (error) {
    console.error("Get topics error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description, icon } = await request.json();

    // Validate name
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Topic name is required" },
        { status: 400 }
      );
    }

    if (name.trim().length > MAX_TOPIC_NAME_LENGTH) {
      return NextResponse.json(
        { error: `Topic name must be less than ${MAX_TOPIC_NAME_LENGTH} characters` },
        { status: 400 }
      );
    }

    // Validate description (optional)
    if (description !== undefined && description !== null) {
      if (typeof description !== 'string') {
        return NextResponse.json(
          { error: "Description must be a string" },
          { status: 400 }
        );
      }
      if (description.length > MAX_TOPIC_DESCRIPTION_LENGTH) {
        return NextResponse.json(
          { error: `Description must be less than ${MAX_TOPIC_DESCRIPTION_LENGTH} characters` },
          { status: 400 }
        );
      }
    }

    // Validate icon (optional)
    if (icon !== undefined && icon !== null) {
      if (typeof icon !== 'string') {
        return NextResponse.json(
          { error: "Icon must be a string" },
          { status: 400 }
        );
      }
      if (icon.length > MAX_TOPIC_ICON_LENGTH) {
        return NextResponse.json(
          { error: `Icon must be less than ${MAX_TOPIC_ICON_LENGTH} characters` },
          { status: 400 }
        );
      }
    }

    // Check if topic exists
    const existingTopic = await prisma.topic.findUnique({
        where: { name: name.trim() }
    });

    if (existingTopic) {
        return NextResponse.json(existingTopic, { status: 200 });
    }

    const topic = await prisma.topic.create({
      data: {
        name: name.trim(),
        description,
        icon,
        creatorId: session.user.id,
      },
    });

    return NextResponse.json(topic, { status: 201 });
  } catch (error) {
    console.error("Create topic error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
