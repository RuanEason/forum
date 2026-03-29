import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "../components/providers";
import ProfileCompletionCheck from "@/components/ProfileCompletionCheck";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { PageLoadProgressProvider } from "@/components/PageLoadProgressProvider";
import { defaultMetadata } from "@/lib/seo";
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
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <Providers>
          <PageLoadProgressProvider>
            <div className="flex flex-col min-h-screen">
              <ProfileCompletionCheck />
              <Navbar />
              <main className="flex-grow">
                {children}
              </main>
              <Footer />
            </div>
          </PageLoadProgressProvider>
        </Providers>
      </body>
    </html>
  );
}
