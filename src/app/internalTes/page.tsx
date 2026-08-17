import { notFound } from "next/navigation";
import { isDevToolboxEnabled } from "@/lib/dev-toolbox";
import { getCurrentUser } from "@/lib/server-auth";

const APK_DOWNLOAD_URL = "https://cdn.zyg2024.top/release/r_forum_app-release.apk";

export const dynamic = "force-dynamic";

export default async function InternalTesPage() {
  if (!isDevToolboxEnabled()) {
    notFound();
  }

  const user = await getCurrentUser();
  if (!user || user.banned) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-blue-50 px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md items-center">
        <section className="w-full rounded-3xl bg-white p-6 shadow-xl ring-1 ring-sky-100 sm:p-7">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">阮论坛</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">内测版 forum App 下载</p>

          <a
            href={APK_DOWNLOAD_URL}
            className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-sky-500 px-5 py-3 text-base font-semibold text-white transition hover:bg-sky-600 active:scale-[0.99]"
          >
            下载 APK
          </a>

          <div className="mt-6 rounded-2xl bg-sky-50 p-4">
            <h2 className="text-sm font-semibold text-sky-700">内测注意事项</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">此应用图标或许有点不对劲，不要紧，可以正常使用，只是打包的时候出了点问题，不必在意</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">安装时如果显示此应用未备案/未通过安全验证/未签名均为正常现象，直接点我已知道风险即可</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">每位内测成员都要有账号，没有请在此页面点击右上角的注册按钮注册，不注册的话不能使用app</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">有发现BUG可以私聊站长微信（名：阮），内测成员我会考虑如何奖赏你们</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">有BUG一定要提！！！！！！！！！！！！！！</p>
          </div>
        </section>
      </div>
    </main>
  );
}
