import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import TopicContent from "./TopicContent";
import styles from "./TopicPage.module.css";

async function getTopic(id: string) {
  const topic = await prisma.topic.findUnique({
    where: { id },
    include: {
      _count: {
        select: { posts: true },
      },
      creator: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
  });

  if (!topic) {
    return null;
  }

  return topic;
}

export default async function TopicDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [topic, session] = await Promise.all([
    getTopic(id),
    getServerSession(authOptions) as Promise<Session | null>,
  ]);

  if (!topic) {
    notFound();
  }

  return (
    <div className={styles.topicPage}>
      {/* Banner Section */}
      <div className={styles.topicTopBand}>
        <div className={styles.topicBandFade} />
      </div>

      {/* Removed z-10 to prevent creating a stacking context that traps fixed overlays (like image zoom) below the Navbar */}
      <div className={styles.topicShell}>
        <div className={styles.topicLayout}>
          {/* Main Content Area */}
          <TopicContent topic={topic} currentUserId={session?.user?.id} />

        </div>
      </div>
    </div>
  );
}
