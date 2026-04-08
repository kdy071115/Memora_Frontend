"use client";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useRouter } from "next/navigation";
import { User, LogOut, ChevronDown, LayoutDashboard, BookOpen, BarChart2, Brain, Menu, X, Sun, Moon } from "lucide-react";
import { usePathname } from "next/navigation";
import InvitationBell from "./InvitationBell";
import { useTheme } from "@/lib/hooks/useTheme";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { theme, toggle: toggleTheme, mounted: themeMounted } = useTheme();

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // 라우팅이 바뀌면 모바일 nav 닫기
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex flex-col w-full bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center mx-auto px-4">
          {/* 모바일 햄버거 + 로고 */}
          <div className="flex md:hidden items-center gap-2 mr-2">
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => setMobileNavOpen((v) => !v)}
                className="w-9 h-9 rounded-xl hover:bg-muted flex items-center justify-center"
                aria-label="메뉴 열기"
              >
                {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-md overflow-hidden relative border border-border">
                <Image src="/images/logo.png" alt="Memora Logo" fill sizes="28px" className="object-cover" />
              </div>
              <span className="font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent text-lg tracking-tight">
                Memora
              </span>
            </Link>
          </div>

          {/* 데스크톱 Logo + Nav */}
          <div className="mr-4 hidden md:flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <div className="w-7 h-7 rounded-md overflow-hidden relative border border-border">
                <Image src="/images/logo.png" alt="Memora Logo" fill sizes="28px" className="object-cover" />
              </div>
              <span className="hidden font-bold sm:inline-block bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent text-xl tracking-tight">
                Memora
              </span>
            </Link>
            <nav className="flex items-center space-x-1 text-sm font-medium">
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors hover:bg-muted text-foreground/60 hover:text-foreground"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                대시보드
              </Link>
              <Link
                href="/courses"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors hover:bg-muted text-foreground/60 hover:text-foreground"
              >
                <BookOpen className="w-3.5 h-3.5" />
                강의
              </Link>
              <Link
                href="/analysis"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors hover:bg-muted text-foreground/60 hover:text-foreground"
              >
                <BarChart2 className="w-3.5 h-3.5" />
                분석
              </Link>
              {user?.role === "STUDENT" && (
                <Link
                  href="/retrospective"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors hover:bg-muted text-foreground/60 hover:text-foreground"
                >
                  <Brain className="w-3.5 h-3.5" />
                  회고
                </Link>
              )}
            </nav>
          </div>

          {/* Right side */}
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                {themeMounted && (
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="w-9 h-9 rounded-xl hover:bg-muted dark:hover:bg-muted flex items-center justify-center transition-colors"
                    aria-label={theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
                    title={theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
                  >
                    {theme === "dark" ? (
                      <Sun className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Moon className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                )}
                <InvitationBell />
                <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 h-9 px-3 rounded-xl hover:bg-muted transition-colors group"
                >
                  {/* Avatar */}
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center shadow-sm">
                    <span className="text-white text-xs font-black">
                      {user.name?.charAt(0) || "U"}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-foreground">{user.name}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Dropdown */}
                {menuOpen && (
                  <div className="absolute right-0 top-11 w-52 bg-card border border-border rounded-2xl shadow-xl shadow-slate-200/60 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-xs font-bold text-muted-foreground mb-0.5">로그인 계정</p>
                      <p className="text-sm font-bold text-foreground truncate">{user.email}</p>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/profile"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-bold text-foreground hover:bg-muted transition-colors"
                      >
                        <User className="w-4 h-4 text-muted-foreground" />
                        마이페이지
                      </Link>
                    </div>

                    <div className="border-t border-border py-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        로그아웃
                      </button>
                    </div>
                  </div>
                )}
                </div>
              </div>
            ) : (
              <nav className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="text-sm font-bold text-muted-foreground hover:text-foreground px-3 py-1.5 hover:bg-muted rounded-lg transition-colors"
                >
                  로그인
                </Link>
                <Link
                  href="/signup"
                  className="text-sm font-bold text-white bg-foreground hover:bg-foreground/90 px-4 py-1.5 rounded-lg transition-colors"
                >
                  회원가입
                </Link>
              </nav>
            )}
          </div>
        </div>

        {/* 모바일 펼침 nav */}
        {isAuthenticated && mobileNavOpen && (
          <nav className="md:hidden border-t border-border bg-card px-4 py-3 flex flex-col gap-1 animate-in slide-in-from-top-2 duration-150">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted text-sm font-bold text-foreground"
            >
              <LayoutDashboard className="w-4 h-4 text-muted-foreground" />
              대시보드
            </Link>
            <Link
              href="/courses"
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted text-sm font-bold text-foreground"
            >
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              강의
            </Link>
            <Link
              href="/analysis"
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted text-sm font-bold text-foreground"
            >
              <BarChart2 className="w-4 h-4 text-muted-foreground" />
              분석
            </Link>
            {user?.role === "STUDENT" && (
              <Link
                href="/retrospective"
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted text-sm font-bold text-foreground"
              >
                <Brain className="w-4 h-4 text-muted-foreground" />
                회고
              </Link>
            )}
          </nav>
        )}
      </header>
      <main className="flex-1 w-full max-w-screen-2xl mx-auto p-4 flex flex-col">
        {children}
      </main>
    </div>
  );
}
