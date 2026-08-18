"use client";

import { Pen } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface Topic {
  id: string;
  name: string;
}

interface TopicParticipationEditorProps {
  topic: Topic;
}

export default function TopicParticipationEditor({
  topic,
}: TopicParticipationEditorProps) {
  const { status } = useSession();
  const router = useRouter();

  const openEditor = () => {
    const editorPath = `/post/create?topicId=${encodeURIComponent(topic.id)}`;

    if (status !== "authenticated") {
      router.push(`/auth/signin?redirect=${encodeURIComponent(editorPath)}`);
      return;
    }

    router.push(editorPath);
  };

  return (
    <button
      type="button"
      onClick={openEditor}
      disabled={status === "loading"}
      aria-label={`参与 #${topic.name} 的讨论`}
      className="inline-flex items-center justify-center rounded-lg border border-transparent bg-blue-600 px-6 py-3 text-base font-medium text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Pen className="mr-2 h-4 w-4" />
      参与讨论
    </button>
  );
}
