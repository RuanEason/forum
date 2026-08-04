import type { Metadata } from "next";
import { Suspense } from "react";
import EditorBootScreen from "@/components/editor/EditorBootScreen";
import EditorWorkspace from "@/components/editor/EditorWorkspace";

export const metadata: Metadata = {
  title: "富文本编辑器",
  description: "支持图文排版的论坛发帖工作台",
};

export default function EditorPage() {
  return (
    <Suspense fallback={<EditorBootScreen />}>
      <EditorWorkspace />
    </Suspense>
  );
}
