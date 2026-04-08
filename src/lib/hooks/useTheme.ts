"use client";
import { useEffect, useState } from "react";

export type Theme = "light" | "dark";
const STORAGE_KEY = "memora-theme";

/**
 * 단순 다크모드 토글 훅.
 *  - localStorage 우선, 없으면 OS prefers-color-scheme
 *  - <html> 에 .dark 클래스 토글
 *  - SSR 첫 렌더에서는 light 로 가정 (hydration mismatch 회피)
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY)) as Theme | null;
    const initial: Theme =
      stored ??
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    apply(initial);
    setTheme(initial);
  }, []);

  const apply = (next: Theme) => {
    if (typeof document === "undefined") return;
    if (next === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  };

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    apply(next);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, next);
  };

  return { theme, toggle, mounted };
}
