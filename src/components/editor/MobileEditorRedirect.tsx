"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MonitorSmartphone } from "lucide-react";

export default function MobileEditorRedirect() {
  const router = useRouter();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      router.replace("/post/create");
    }, 1600);

    return () => {
      window.clearTimeout(timer);
    };
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-6">
      <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white/90 p-8 text-center shadow-[0_20px_60px_rgba(15,23,42,0.10)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-950 text-white">
          <MonitorSmartphone className="h-7 w-7" />
        </div>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-slate-950">
          编辑器暂不支持手机端访问
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          即将为你跳转到普通发帖页面
        </p>
      </div>
    </div>
  );
}
