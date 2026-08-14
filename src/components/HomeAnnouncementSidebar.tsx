import Avatar from "@/components/Avatar";
import {
  BookOpen,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import Link from "next/link";

export type HomeAnnouncement = {
  id: string;
  title: string | null;
  content: string;
  announcementAt: string;
  author: {
    id: string;
    name: string | null;
    avatar: string | null;
  };
};

export default function HomeAnnouncementSidebar({
  announcements,
  collapsed,
  onToggleCollapsed,
}: {
  announcements: HomeAnnouncement[];
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  return (
    <>
      <div
        className={`home-announcement-sidebar-shell absolute inset-y-0 hidden h-full min-w-0 overflow-hidden transition-[opacity,transform] duration-300 ease-out 2xl:block ${
          collapsed
            ? "pointer-events-none translate-x-4 opacity-0"
            : "translate-x-0 opacity-100"
        }`}
      >
        <aside
          className="scrollbar-pretty h-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-sm"
          aria-label="社区公告"
        >
          <div className="relative border-b border-gray-100 px-4 py-3.5">
            {!collapsed && (
              <button
                type="button"
                onClick={onToggleCollapsed}
                className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                aria-label="收起公告栏"
                title="收起公告栏"
              >
                <PanelRightClose className="h-4 w-4" />
              </button>
            )}
            <h2 className="text-sm font-semibold text-gray-900">社区公告</h2>
          </div>

          <div>
            {announcements.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-gray-400">
                暂无社区公告
              </div>
            ) : announcements.map((announcement) => (
              <article
                key={announcement.id}
                className="border-b border-gray-100 last:border-b-0"
              >
                <Link
                  href={`/post/${announcement.id}`}
                  className="block px-3.5 py-4 transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-start gap-2.5">
                    <Avatar
                      src={announcement.author.avatar}
                      name={announcement.author.name}
                      size="sm"
                      className="mt-0.5 shrink-0"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-1 text-xs text-gray-400">
                        <span className="truncate font-medium text-gray-700">
                          {announcement.author.name || "管理员"}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">社区公告</span>
                      </div>

                      <h3 className="mt-2 line-clamp-2 text-sm font-medium leading-5 text-gray-800">
                        {announcement.title || "社区公告"}
                      </h3>
                      <p className="mt-1.5 line-clamp-3 whitespace-pre-wrap text-xs leading-5 text-gray-500">
                        {announcement.content || "暂无公告内容"}
                      </p>

                      <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
                        <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>查看公告</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </aside>
      </div>

      {collapsed && (
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="home-announcement-sidebar-toggle fixed right-3 top-24 z-30 hidden h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-md transition-transform duration-300 ease-out 2xl:inline-flex"
          aria-label="展开公告栏"
          title="展开公告栏"
        >
          <PanelRightOpen className="h-5 w-5" />
        </button>
      )}
    </>
  );
}
