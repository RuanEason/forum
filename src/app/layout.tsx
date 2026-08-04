import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "../components/providers";
import ProfileCompletionCheck from "@/components/ProfileCompletionCheck";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Ad from "@/components/Ad";
import { PageLoadProgressProvider } from "@/components/PageLoadProgressProvider";
import { defaultMetadata } from "@/lib/seo";
import RouteChromeController from "@/components/RouteChromeController";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = defaultMetadata;

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal?: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <meta name="apple-mobile-web-app-title" content="Slept" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <RouteChromeController />
        <Providers>
          <PageLoadProgressProvider>
            <div className="flex flex-col min-h-screen">
              <div data-site-chrome="profile">
                <ProfileCompletionCheck />
              </div>
              <div className="sticky top-0 z-50" data-site-chrome="nav">
                <Navbar />
              </div>
              <div data-site-chrome="ad">
                <Ad />
              </div>
              <main className="flex-grow" data-site-main="app">
                {children}
              </main>
              <div data-site-chrome="footer">
                <Footer />
              </div>
            </div>
            {modal}
          </PageLoadProgressProvider>
        </Providers>
      </body>
    </html>
  );
}
