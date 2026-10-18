"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { usePageLoadProgress } from "@/components/PageLoadProgressProvider";

export default function ProfileCompletionCheck() {
  const { data: session, status } = useSession();
  const { push: navigatePush } = usePageLoadProgress();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      // 如果用户已登录，但没有名字，且当前不在完善信息页面，则重定向
      if (!session.user.name && pathname !== "/auth/complete-profile") {
        // 排除一些不需要完善信息的页面，例如退出登录页面（如果有的话）
        // 这里简单处理，只要不是 complete-profile 页面就重定向
        navigatePush("/auth/complete-profile");
      }
    }
  }, [session, status, navigatePush, pathname]);

  return null;
}
