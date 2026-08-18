import Link from "next/link";
import type { Metadata } from "next";
import SearchResultSwitcher from "@/components/SearchResultSwitcher";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";

  if (!query) {
    return (
      <div className="min-h-screen bg-gray-50 pb-16 sm:pb-0">
        <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="mb-6 text-2xl font-bold text-gray-900">搜索</h1>
          <div className="rounded-lg bg-white py-12 text-center text-gray-500 shadow-sm">
            请输入关键词进行搜索
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16 sm:pb-0">
      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <Link href="/" className="mb-4 inline-flex text-sm text-gray-500 hover:text-gray-700">
          ← 返回首页
        </Link>
        <h1 className="mb-6 text-2xl font-bold text-gray-900">“{query}” 的搜索结果</h1>
        <SearchResultSwitcher query={query} />
      </main>
    </div>
  );
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const query = params.q?.trim();

  if (!query) {
    return {
      title: "搜索",
      description: "在论坛中搜索帖子和用户",
    };
  }

  return {
    title: `"${query}" 的搜索结果`,
    description: `搜索与“${query}”相关的帖子和用户`,
  };
}
