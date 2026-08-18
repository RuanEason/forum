"use client";

import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@/components/ui/Toast";
import { TopicHeaderProvider } from "@/components/TopicHeaderProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        <TopicHeaderProvider>{children}</TopicHeaderProvider>
      </ToastProvider>
    </SessionProvider>
  );
}
