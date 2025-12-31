import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description, icon } = await request.json();

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Topic name is required" },
        { status: 400 }
      );
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
