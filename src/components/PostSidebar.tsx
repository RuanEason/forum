"use client";

import type { Heading } from "@/lib/markdown";
import TableOfContents from "./TableOfContents";

interface PostSidebarProps {
  headings: Heading[];
}

export default function PostSidebar({ headings }: PostSidebarProps) {
  const hasToc = headings.length > 0;

  // 如果没有目录，不显示侧边栏
  if (!hasToc) {
    return null;
  }

  return (
    <div className="post-sidebar">
      <div className="sidebar-content">
        {/* TOC 目录视图 */}
        <div className="sidebar-panel sidebar-panel-active">
          <TableOfContents headings={headings} />
        </div>
      </div>
    </div>
  );
}
