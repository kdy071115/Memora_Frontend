"use client";
import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  // QueryClient는 항상 컴포넌트 스코프 내에서 useState 등으로 관리하여 
  // 여러 사용자가 요청을 보낼 때 캐시가 공유되지 않게 방지합니다. (Next.js 가이드라인)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 캐시 최적화 5분
            refetchOnWindowFocus: false, // 탭 전환시 무조건적 리패칭 방지 
            retry: 1, // 실패시 1회까지만 재시도
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
