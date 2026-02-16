import type { Metadata } from "next";
import { appRelease } from "@/release/appRelease";

export const metadata: Metadata = {
  title: "论坛 App 下载",
  description: "论坛 Android 安装包下载页面",
};

export default function ReleasePage() {
  return (
    <main className="relative isolate overflow-hidden bg-[radial-gradient(circle_at_top,_#fff6d6_0%,_#ffefb0_28%,_#fffdf7_60%,_#ffffff_100%)] px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 top-8 select-none text-[12rem] leading-none opacity-10 sm:text-[16rem]"
      >
        🐎
      </div>

      <div className="mx-auto flex min-h-[calc(100vh-12rem)] w-full max-w-xl items-center">
        <section className="w-full rounded-3xl border border-amber-200/70 bg-white/85 p-8 text-center shadow-[0_24px_70px_-30px_rgba(180,120,0,0.45)] backdrop-blur-sm sm:p-10">
          <p className="text-xs tracking-[0.35em] text-amber-700">阮论坛</p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
            论坛安装包下载
          </h1>
          <p className="mt-3 text-lg font-semibold text-amber-500 [font-family:'STKaiti','KaiTi','Songti_SC',serif]">
            祝大家马年快乐
          </p>

          <a
            href={appRelease.downloadUrl}
            className="mt-8 inline-flex w-full items-center justify-center rounded-2xl bg-amber-500 px-5 py-3 text-base font-semibold text-white transition hover:bg-amber-600 active:scale-[0.99]"
          >
            下载 APK
          </a>

          <p className="mt-4 text-xs text-stone-500">
            版本 {appRelease.version} · {appRelease.fileName}
          </p>
        </section>
      </div>
    </main>
  );
}
