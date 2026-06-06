"use client";

import { FileText, Loader2 } from "lucide-react";

export default function EditorBootScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_42%),linear-gradient(180deg,_#eef4fb_0%,_#e6edf6_100%)] px-6">
      <div className="w-full max-w-xl rounded-[28px] border border-white/60 bg-white/70 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg">
          <FileText className="h-7 w-7" />
        </div>

        <div className="mt-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
            正在为你打开编辑器，请稍等
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            正在完成编辑器初始化...
          </p>
        </div>

        <div className="mt-8 overflow-hidden rounded-full bg-slate-200">
          <div className="h-2 w-2/3 animate-pulse rounded-full bg-blue-500" />
        </div>

        <div className="mt-6 rounded-3xl border border-slate-200/80 bg-slate-950 p-4 text-slate-200 shadow-inner">
          <div className="mb-3 flex items-center gap-2 text-xs text-slate-400">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <span className="ml-3">Markdown 编辑器</span>
          </div>
          <div className="space-y-2 font-mono text-sm leading-6">
            <div className="text-slate-500"># 准备工作台...</div>
            <div className="flex items-center gap-2 text-slate-300">
              <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
              <span>正在读取草稿与历史记录</span>
            </div>
            <div className="text-slate-500">正在初始化写作环境</div>
          </div>
        </div>
      </div>
    </div>
  );
}
