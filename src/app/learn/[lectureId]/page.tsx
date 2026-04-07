"use client";
import React, { use, useRef, useState, useCallback } from "react";
import AiSidebar from "@/components/domain/learn/AiSidebar";
import Link from "next/link";
import { ArrowLeft, BookOpen, CheckCircle, Loader2, FileText, AlertCircle, GripVertical } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getDocuments, getDocumentSummary } from "@/lib/api/lectures";
import ReactMarkdown from "react-markdown";
import type { DocumentItem } from "@/types/document";

const DocumentSummaryView = ({ document }: { document: DocumentItem }) => {
  const { data, isLoading } = useQuery({
    queryKey: ["documentSummary", document.id],
    queryFn: () => getDocumentSummary(document.id),
  });

  if (isLoading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
        <p className="text-slate-400 text-sm font-medium">요약을 불러오는 중...</p>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="py-10 flex flex-col items-center justify-center text-center">
        <AlertCircle className="w-10 h-10 text-slate-300 mb-3" />
        <p className="text-slate-500 font-medium">요약을 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="
      prose prose-slate max-w-none
      prose-h1:text-2xl prose-h1:font-black prose-h1:text-slate-800 prose-h1:mb-4 prose-h1:mt-6
      prose-h2:text-xl prose-h2:font-bold prose-h2:text-slate-800 prose-h2:mt-8 prose-h2:mb-3
      prose-h3:text-lg prose-h3:font-bold prose-h3:text-slate-700 prose-h3:mt-5 prose-h3:mb-2
      prose-p:text-base prose-p:leading-relaxed prose-p:text-slate-600 prose-p:font-medium prose-p:my-2
      prose-ul:text-slate-600 prose-ul:font-medium prose-ul:my-2
      prose-ol:text-slate-600 prose-ol:font-medium prose-ol:my-2
      prose-li:my-1 prose-li:text-slate-600
      prose-strong:text-slate-800 prose-strong:font-bold
      prose-blockquote:border-l-4 prose-blockquote:border-primary/30 prose-blockquote:bg-blue-50/50 prose-blockquote:rounded-r-lg prose-blockquote:pl-4 prose-blockquote:py-1 prose-blockquote:text-slate-600 prose-blockquote:not-italic
      [&>*:first-child]:mt-0
    ">
      <ReactMarkdown>{data.summary || "문서 내용이 비어있습니다."}</ReactMarkdown>
    </div>
  );
};

const MIN_SIDEBAR_WIDTH = 320;
const MAX_SIDEBAR_WIDTH = 700;
const DEFAULT_SIDEBAR_WIDTH = 420;

export default function LearnPage({ params }: { params: Promise<{ lectureId: string }> }) {
  const resolvedParams = use(params);
  const lectureId = Number(resolvedParams.lectureId);

  // 드래그 리사이즈 상태
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onMouseMove = (ev: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      // 오른쪽(사이드바)의 너비 = 컨테이너 오른쪽 끝 - 마우스 위치
      const newWidth = containerRect.right - ev.clientX;
      setSidebarWidth(Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, newWidth)));
    };

    const onMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, []);

  const { data: documents = [], isLoading: docLoading } = useQuery({
    queryKey: ["documents", lectureId],
    queryFn: () => getDocuments(lectureId),
    refetchInterval: (query: any) => {
      const data = query.state?.data as DocumentItem[] | undefined;
      return data?.some(
        (d) => d.processingStatus === "PENDING" || d.processingStatus === "PROCESSING"
      )
        ? 3000
        : false;
    },
  });

  return (
    <div className="h-screen flex flex-col bg-background font-sans">
      {/* Top Header */}
      <header className="h-14 border-b border-slate-200 bg-white px-4 flex items-center justify-between shrink-0 shadow-sm z-20">
        <div className="flex items-center space-x-3">
          <Link
            href="/courses"
            className="w-8 h-8 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold bg-blue-100 text-blue-600 px-2.5 py-1 rounded-full">
              학습 집중 모드
            </span>
            <h1 className="font-bold text-slate-800">강의 상세 및 요약</h1>
          </div>
        </div>
        <Link
          href={`/learn/${resolvedParams.lectureId}/quiz`}
          className="px-5 h-9 bg-gradient-to-r from-slate-700 to-slate-900 text-white text-sm font-bold rounded-full hover:opacity-90 transition-all shadow-sm flex items-center gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          복습 퀴즈 풀기
        </Link>
      </header>

      {/* Main Body - flex row */}
      <div ref={containerRef} className="flex-1 overflow-hidden flex w-full relative">
        {/* Document Area (남은 공간 전체) */}
        <div className="flex-1 h-full bg-slate-50 overflow-y-auto custom-scrollbar min-w-0">
          <div className="max-w-[820px] mx-auto py-10 px-4 md:px-8">
            {docLoading ? (
              <div className="flex flex-col items-center justify-center py-32">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                <p className="text-slate-500 font-medium">강의 자료를 불러오는 중입니다...</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-16 flex flex-col items-center justify-center text-center shadow-sm">
                <BookOpen className="w-16 h-16 text-slate-200 mb-5" />
                <h2 className="text-xl font-bold text-slate-700 mb-2">등록된 학습 자료가 없습니다</h2>
                <p className="text-slate-400 font-medium">교강사가 아직 자료를 업로드하지 않았습니다.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {documents.map((doc) => (
                  <div key={doc.id} className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                    {/* Document Header */}
                    <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-slate-50/50">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <h2 className="text-base font-bold text-slate-800 truncate">{doc.originalName}</h2>
                      </div>
                      <span
                        className={`ml-4 shrink-0 px-3 py-1 rounded-full text-xs font-bold ${
                          doc.processingStatus === "COMPLETED"
                            ? "bg-emerald-100 text-emerald-700"
                            : doc.processingStatus === "FAILED"
                            ? "bg-red-100 text-red-700"
                            : "bg-blue-100 text-blue-700 animate-pulse"
                        }`}
                      >
                        {doc.processingStatus === "COMPLETED"
                          ? "✓ 분석 완료"
                          : doc.processingStatus === "FAILED"
                          ? "✕ 분석 실패"
                          : "⋯ AI 분석 중"}
                      </span>
                    </div>

                    {/* Document Body */}
                    <div className="px-8 py-8">
                      {doc.processingStatus === "PENDING" || doc.processingStatus === "PROCESSING" ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                          <div className="relative mb-6">
                            <div className="w-16 h-16 border-4 border-slate-100 rounded-full" />
                            <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin" />
                          </div>
                          <h3 className="text-lg font-bold text-slate-800 mb-2">AI가 문서를 분석 중입니다</h3>
                          <p className="text-slate-400 font-medium text-sm">
                            자동으로 요약본이 생성됩니다. 잠시만 기다려주세요.
                          </p>
                        </div>
                      ) : doc.processingStatus === "FAILED" ? (
                        <div className="py-16 flex flex-col items-center justify-center text-center">
                          <AlertCircle className="w-12 h-12 text-red-300 mb-4" />
                          <p className="text-red-500 font-bold">문서 분석에 실패했습니다.</p>
                          <p className="text-slate-400 text-sm mt-1">파일을 다시 업로드해주세요.</p>
                        </div>
                      ) : (
                        <DocumentSummaryView document={doc} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="h-20" />
          </div>
        </div>

        {/* ── 드래그 핸들 ── */}
        <div
          onMouseDown={handleMouseDown}
          className="w-1.5 h-full bg-slate-200 hover:bg-primary/40 cursor-col-resize flex items-center justify-center shrink-0 transition-colors group relative z-10"
          title="드래그하여 너비 조정"
        >
          <div className="absolute flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <GripVertical className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        {/* AI Sidebar (너비 조절 가능) */}
        <div
          className="h-full border-l border-slate-200 bg-white shrink-0 overflow-hidden"
          style={{ width: sidebarWidth }}
        >
          <AiSidebar lectureId={lectureId} />
        </div>
      </div>
    </div>
  );
}
