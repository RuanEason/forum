import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "../components/providers";
import ProfileCompletionCheck from "@/components/ProfileCompletionCheck";
import Navbar from "@/components/Navbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "同学论坛 - 校园生活分享平台",
  description: "同学论坛是一个专注于校园生活的分享平台，你可以在这里分享日常、讨论学术、结交朋友。",
  openGraph: {
    title: "同学论坛 - 校园生活分享平台",
    description: "同学论坛是一个专注于校园生活的分享平台，你可以在这里分享日常、讨论学术、结交朋友。",
    type: "website",
    locale: "zh_CN",
    siteName: "同学论坛",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <Providers>
          <ProfileCompletionCheck />
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
