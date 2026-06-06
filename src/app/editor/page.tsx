import type { Metadata } from "next";
import { Suspense } from "react";
import EditorWorkspace from "@/components/editor/EditorWorkspace";
import EditorBootScreen from "@/components/editor/EditorBootScreen";

export const metadata: Metadata = {
  title: "Markdown 编辑器",
  description: "单文件 Markdown 编辑器工作台",
};

export default function EditorPage() {
  return (
    <Suspense fallback={<EditorBootScreen />}>
      <EditorWorkspace />
    </Suspense>
  );
}
