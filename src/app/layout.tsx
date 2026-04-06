import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Memora - AI 학습 코파일럿",
  description: "이해와 기억을 최적화하는 AI Learning Copilot",
};

import QueryProvider from "@/components/providers/QueryProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${nunito.variable} antialiased h-full`}
    >
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground tracking-tight">
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
