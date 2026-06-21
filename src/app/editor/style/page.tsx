import type { Metadata } from "next";
import { Suspense } from "react";
import EditorBootScreen from "@/components/editor/EditorBootScreen";
import StyleWorkspace from "@/components/editor/StyleWorkspace";

export const metadata: Metadata = {
  title: "样式工作区",
  description: "仅供高级用户手写帖子 CSS 的独立工作区",
};

export default function EditorStylePage() {
  return (
    <Suspense fallback={<EditorBootScreen />}>
      <StyleWorkspace />
    </Suspense>
  );
}
