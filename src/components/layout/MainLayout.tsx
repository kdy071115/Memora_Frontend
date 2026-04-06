import React from "react";
import Link from "next/link";
import Image from "next/image";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col w-full bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center mx-auto px-4">
          <div className="mr-4 hidden md:flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <div className="w-7 h-7 rounded-md overflow-hidden relative border border-slate-200">
                <Image src="/images/logo.png" alt="Memora Logo" fill sizes="28px" className="object-cover" />
              </div>
              <span className="hidden font-bold sm:inline-block bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent text-xl tracking-tight">
                Memora
              </span>
            </Link>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link href="/dashboard" className="transition-colors hover:text-foreground/80 text-foreground/60">
                대시보드
              </Link>
              <Link href="/courses" className="transition-colors hover:text-foreground/80 text-foreground/60">
                강의
              </Link>
              <Link href="/analysis" className="transition-colors hover:text-foreground/80 text-foreground/60">
                분석
              </Link>
            </nav>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <nav className="flex items-center space-x-2">
              <Link href="/login" className="text-sm font-medium hover:underline underline-offset-4">로그인</Link>
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1 w-full max-w-screen-2xl mx-auto p-4 flex flex-col">
        {children}
      </main>
    </div>
  );
}
