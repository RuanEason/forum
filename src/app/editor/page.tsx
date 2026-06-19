import type { Metadata } from "next";
import { Suspense } from "react";
import EditorBootScreen from "@/components/editor/EditorBootScreen";
import EditorWorkspace from "@/components/editor/EditorWorkspace";

export const metadata: Metadata = {
  title: "双模编辑器",
  description: "支持 Markdown 与视觉模式切换的论坛发帖工作台",
};

export default function EditorPage() {
  return (
    <Suspense fallback={<EditorBootScreen />}>
      <EditorWorkspace />
    </Suspense>
  );
}
