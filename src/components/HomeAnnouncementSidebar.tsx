import Avatar from "@/components/Avatar";
import {
  BookOpen,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";

const announcements = [
  {
    id: "welcome",
    author: "Slept 社区",
    meta: "官方公告 · 欢迎加入",
    title: "欢迎来到 Slept 论坛",
    description: "这里是分享想法、经验和灵感的地方，期待看到你的第一篇帖子。",
    footer: "社区公告",
  },
  {
    id: "posting-rules",
    author: "社区规范",
    meta: "长期有效 · 发帖前阅读",
    title: "发帖规范",
    description: "友善交流，尊重他人；内容清晰，尽量为帖子添加合适的话题。",
    footer: "发帖指南",
  },
] as const;

export default function HomeAnnouncementSidebar({
  collapsed,
  onToggleCollapsed,
}: {
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
            {announcements.map((announcement) => {
              return (
                <article
                  key={announcement.id}
                  className="border-b border-gray-100 px-3.5 py-4 last:border-b-0"
                >
                  <div className="flex items-start gap-2.5">
                    <Avatar
                      name={announcement.author}
                      size="sm"
                      className="mt-0.5 shrink-0"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-1 text-xs text-gray-400">
                        <span className="truncate font-medium text-gray-700">
                          {announcement.author}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">{announcement.meta}</span>
                      </div>

                      <h3 className="mt-2 line-clamp-2 text-sm font-medium leading-5 text-gray-800">
                        {announcement.title}
                      </h3>
                      <p className="mt-1.5 line-clamp-3 text-xs leading-5 text-gray-500">
                        {announcement.description}
                      </p>

                      <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
                        <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{announcement.footer}</span>
                      </div>
                    </div>

                  </div>
                </article>
              );
            })}
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
