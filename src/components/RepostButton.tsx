"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface RepostButtonProps {
  postId: string;
  initialRepostsCount: number;
  initialRepostedByUser: boolean;
}

export default function RepostButton({
  postId,
  initialRepostsCount,
  initialRepostedByUser,
}: RepostButtonProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [repostsCount, setRepostsCount] = useState(initialRepostsCount);
  const [repostedByUser, setRepostedByUser] = useState(initialRepostedByUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRepostToggle = async () => {
    setError("");
    if (status !== "authenticated") {
      router.push("/auth/signin");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/repost", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ postId }),
      });

      const data = await response.json();

      if (response.ok) {
        setRepostedByUser(data.reposted);
        setRepostsCount((prevCount) => (data.reposted ? prevCount + 1 : prevCount - 1));
      } else {
        setError(data.error || "操作失败");
      }
    } catch (err) {
      setError("网络错误，操作失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleRepostToggle}
      className={`flex items-center space-x-1 group ${
        repostedByUser ? "text-green-500" : "text-gray-500 hover:text-green-500"
      } disabled:opacity-50`}
      disabled={loading || status === "loading"}
      title={repostedByUser ? "取消转发" : "转发"}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`transition-transform duration-200 ${repostedByUser ? "scale-110" : "group-hover:scale-110"}`}
      >
        <path d="M17 2.1l4 4-4 4" />
        <path d="M3 12.2v-2a4 4 0 0 1 4-4h12.8" />
        <path d="M7 21.9l-4-4 4-4" />
        <path d="M21 11.8v2a4 4 0 0 1-4 4H4.2" />
      </svg>
      <span className="text-sm font-medium">{repostsCount > 0 ? repostsCount : "转发"}</span>
      {error && <span className="text-red-500 text-sm ml-2">{error}</span>}
    </button>
  );
}