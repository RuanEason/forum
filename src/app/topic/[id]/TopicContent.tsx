"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Avatar from "@/components/Avatar";
import TopicParticipationEditor from "@/components/TopicParticipationEditor";
import TopicPostList from "./TopicPostList";

interface Topic {
  id: string;
  name: string;
  description: string | null;
  _count: {
    posts: number;
  };
  creator: {
    id: string;
    name: string | null;
    avatar: string | null;
  } | null;
}

export default function TopicContent({ topic }: { topic: Topic }) {
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);

  const handlePostSuccess = () => {
    setRefreshKey((prev) => prev + 1);
    router.refresh();
  };

  const handlePostDeleted = () => {
    setRefreshKey((prev) => prev + 1);
    router.refresh();
  };

  return (
    <div className="md:col-span-3 space-y-6">
      {/* Header Card */}
      <div className="bg-card rounded-xl p-6 shadow-sm">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
               <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                 <span className="text-primary">#</span>
                 {topic.name}
               </h1>
               {topic.description && (
                   <p className="text-muted-foreground mb-4 max-w-2xl">{topic.description}</p>
               )}
               <div className="flex items-center gap-4 text-sm text-muted-foreground">
                 <span>{topic._count.posts} 帖子</span>
                 <span>•</span>
                 {topic.creator && (
                   <Link 
                     href={`/user/${topic.creator.id}`}
                     className="flex items-center gap-2 hover:text-foreground transition-colors"
                   >
                     <span>创建者</span>
                     <div className="flex items-center gap-1">
                        <Avatar
                          src={topic.creator.avatar}
                          name={topic.creator.name}
                          className="w-5 h-5 text-[10px]"
                          size="sm"
                        />
                        <span className="font-medium">{topic.creator.name}</span>
                     </div>
                   </Link>
                 )}
               </div>
            </div>
            
            <TopicParticipationEditor topic={topic} onPostSuccess={handlePostSuccess} />
         </div>
      </div>

      {/* Posts List */}
      <div>
        <div className="flex items-center justify-between mb-4 px-2">
           <h2 className="text-xl font-semibold">最新讨论</h2>
        </div>
        <TopicPostList
          key={refreshKey}
          topicId={topic.id}
          onPostDeleted={handlePostDeleted}
        />
      </div>
    </div>
  );
}
