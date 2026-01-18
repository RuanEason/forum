import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import TopicContent from "./TopicContent";

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
  const topic = await getTopic(id);

  if (!topic) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-8">
      {/* Banner Section */}
      <div className="bg-gradient-to-r from-blue-100 to-white h-48 md:h-28 relative">
        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-background to-transparent" />
      </div>

      {/* Removed z-10 to prevent creating a stacking context that traps fixed overlays (like image zoom) below the Navbar */}
      <div className="container mx-auto max-w-6xl px-4 -mt-20 relative">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Main Content Area */}
          <TopicContent topic={topic} />

          {/* Sidebar */}
          <div className="hidden md:block md:col-span-1 space-y-6">
             <div className="bg-card rounded-xl p-4 shadow-sm sticky top-20">
                <h3 className="font-semibold mb-4 text-lg">关于话题</h3>
                <div className="text-sm text-muted-foreground space-y-3">
                   <p>在这里讨论关于 #{topic.name} </p>
                   <div className="h-px bg-border" />
                   <div className="flex justify-between">
                      <span>讨论</span>
                      <span>{topic._count.posts}</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
