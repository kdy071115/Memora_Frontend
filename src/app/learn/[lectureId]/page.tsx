"use client";
import React, { use, useRef, useState, useCallback, useEffect } from "react";
import AiSidebar from "@/components/domain/learn/AiSidebar";
import Link from "next/link";
import { ArrowLeft, BookOpen, CheckCircle, Loader2, FileText, AlertCircle, GripVertical, UploadCloud, Plus, Settings } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDocuments, getDocumentSummary, uploadDocument } from "@/lib/api/lectures";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { DocumentItem } from "@/types/document";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useLearningHeartbeat } from "@/lib/hooks/useLearningHeartbeat";
import SelfExplanationPanel from "@/components/domain/learn/SelfExplanationPanel";
import AudioNotePanel from "@/components/domain/learn/AudioNotePanel";

const DocumentSummaryView = ({ document }: { document: DocumentItem }) => {
  const { data, isLoading } = useQuery({
    queryKey: ["documentSummary", document.id],
    queryFn: () => getDocumentSummary(document.id),
  });

  if (isLoading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
        <p className="text-muted-foreground text-sm font-medium">요약을 불러오는 중...</p>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="py-10 flex flex-col items-center justify-center text-center">
        <AlertCircle className="w-10 h-10 text-muted-foreground/60 mb-3" />
        <p className="text-muted-foreground font-medium">요약을 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="markdown-body text-foreground text-[15px] leading-[1.85]">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.summary || "문서 내용이 비어있습니다."}</ReactMarkdown>
    </div>
  );
};

const MIN_SIDEBAR_WIDTH = 320;
const MAX_SIDEBAR_WIDTH = 700;
const DEFAULT_SIDEBAR_WIDTH = 420;

export default function LearnPage({ params }: { params: Promise<{ lectureId: string }> }) {
  const resolvedParams = use(params);
  const lectureId = Number(resolvedParams.lectureId);
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const isInstructor = user?.role === "INSTRUCTOR";

  // 학생이 이 페이지를 보고 있는 동안 학습 시간 누적 (강사는 자동 무시됨)
  useLearningHeartbeat(lectureId, "LEARN");

  // 드래그 리사이즈 상태
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentScrollRef = useRef<HTMLDivElement>(null);
  const lastDocCardRef = useRef<HTMLDivElement>(null);
  const prevDocCountRef = useRef<number>(0);
  const shouldScrollOnNextLoadRef = useRef(false);

  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);

  const uploadDocumentMutation = useMutation({
    mutationFn: async (files: File[]) => {
      for (let i = 0; i < files.length; i++) {
        setUploadProgress({ current: i + 1, total: files.length });
        await uploadDocument(lectureId, files[i]);
      }
    },
    onSuccess: () => {
      // 다음 documents refetch 가 끝나면 새 카드로 스크롤 이동
      shouldScrollOnNextLoadRef.current = true;
      queryClient.invalidateQueries({ queryKey: ["documents", lectureId] });
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: (error: any) => {
      setUploadProgress(null);
      const msg = error?.response?.data?.message;
      alert(msg ? `자료 업로드 실패: ${msg}` : "자료 업로드에 실패했습니다.");
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
  });

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    uploadDocumentMutation.mutate(files);
  };

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

  // 새 자료 업로드 후 documents 가 늘어나면 마지막 카드로 부드럽게 스크롤
  useEffect(() => {
    const prev = prevDocCountRef.current;
    const curr = documents.length;
    if (shouldScrollOnNextLoadRef.current && curr > prev) {
      shouldScrollOnNextLoadRef.current = false;
      // DOM 반영 후 다음 프레임에 스크롤
      requestAnimationFrame(() => {
        lastDocCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
    prevDocCountRef.current = curr;
  }, [documents.length]);

  return (
    <div className="h-screen flex flex-col bg-background font-sans">
      {/* Top Header */}
      <header className="h-14 border-b border-border bg-card px-4 flex items-center justify-between shrink-0 shadow-sm z-20">
        <div className="flex items-center space-x-3">
          <Link
            href="/courses"
            className="w-8 h-8 hover:bg-muted rounded-full flex items-center justify-center text-muted-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold bg-blue-500/15 text-blue-600 px-2.5 py-1 rounded-full">
              학습 집중 모드
            </span>
            <h1 className="font-bold text-foreground">강의 상세 및 요약</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isInstructor && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadDocumentMutation.isPending}
              className="px-4 h-9 bg-card border border-primary/30 text-primary text-sm font-bold rounded-full hover:bg-primary/5 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              {uploadDocumentMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {uploadProgress
                    ? `업로드 중 (${uploadProgress.current}/${uploadProgress.total})`
                    : "업로드 중..."}
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  자료 추가
                </>
              )}
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt"
            multiple
            className="hidden"
            onChange={handleFilePick}
          />
          {isInstructor && (
            <Link
              href={`/learn/${resolvedParams.lectureId}/quiz/manage`}
              className="px-4 h-9 bg-card border border-border text-foreground text-sm font-bold rounded-full hover:bg-muted transition-all shadow-sm flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              퀴즈 관리
            </Link>
          )}
          <Link
            href={`/learn/${resolvedParams.lectureId}/quiz`}
            className="px-5 h-9 bg-gradient-to-r from-foreground to-foreground/80 text-white text-sm font-bold rounded-full hover:opacity-90 transition-all shadow-sm flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            {isInstructor ? "학생 시점 미리보기" : "복습 퀴즈 풀기"}
          </Link>
        </div>
      </header>

      {/* Main Body - flex row */}
      <div ref={containerRef} className="flex-1 overflow-hidden flex w-full relative">
        {/* Document Area (남은 공간 전체) */}
        <div ref={documentScrollRef} className="flex-1 h-full bg-muted overflow-y-auto custom-scrollbar min-w-0">
          <div className="max-w-[820px] mx-auto py-10 px-4 md:px-8">
            {/* AI 음성 노트 — 자료 위에 가장 먼저 노출 */}
            <div className="mb-8">
              <AudioNotePanel lectureId={lectureId} isInstructor={isInstructor} />
            </div>

            {docLoading ? (
              <div className="flex flex-col items-center justify-center py-32">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground font-medium">강의 자료를 불러오는 중입니다...</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="bg-card border border-border rounded-3xl p-16 flex flex-col items-center justify-center text-center shadow-sm">
                <BookOpen className="w-16 h-16 text-muted-foreground/40 mb-5" />
                <h2 className="text-xl font-bold text-foreground mb-2">등록된 학습 자료가 없습니다</h2>
                {isInstructor ? (
                  <>
                    <p className="text-muted-foreground font-medium mb-6">PDF 또는 텍스트 파일을 올려 AI 분석을 시작하세요.</p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadDocumentMutation.isPending}
                      className="px-6 h-12 bg-gradient-to-r from-blue-600 to-primary text-white font-bold rounded-full shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {uploadDocumentMutation.isPending ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          업로드 중...
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-5 h-5" />
                          자료 업로드하기
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <p className="text-muted-foreground font-medium">교강사가 아직 자료를 업로드하지 않았습니다.</p>
                )}
              </div>
            ) : (
              <div className="space-y-8">
                {documents.map((doc, idx) => (
                  <div
                    key={doc.id}
                    ref={idx === documents.length - 1 ? lastDocCardRef : undefined}
                    className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden scroll-mt-20"
                  >
                    {/* Document Header */}
                    <div className="flex items-center justify-between px-8 py-5 border-b border-border bg-muted/50">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <h2 className="text-base font-bold text-foreground truncate">{doc.originalName}</h2>
                      </div>
                      <span
                        className={`ml-4 shrink-0 px-3 py-1 rounded-full text-xs font-bold ${
                          doc.processingStatus === "COMPLETED"
                            ? "bg-emerald-500/15 text-emerald-700"
                            : doc.processingStatus === "FAILED"
                            ? "bg-red-500/15 text-red-700"
                            : "bg-blue-500/15 text-blue-700 animate-pulse"
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
                            <div className="w-16 h-16 border-4 border-border rounded-full" />
                            <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin" />
                          </div>
                          <h3 className="text-lg font-bold text-foreground mb-2">AI가 문서를 분석 중입니다</h3>
                          <p className="text-muted-foreground font-medium text-sm">
                            자동으로 요약본이 생성됩니다. 잠시만 기다려주세요.
                          </p>
                        </div>
                      ) : doc.processingStatus === "FAILED" ? (
                        <div className="py-16 flex flex-col items-center justify-center text-center">
                          <AlertCircle className="w-12 h-12 text-red-300 mb-4" />
                          <p className="text-red-500 font-bold">문서 분석에 실패했습니다.</p>
                          <p className="text-muted-foreground text-sm mt-1">파일을 다시 업로드해주세요.</p>
                        </div>
                      ) : (
                        <DocumentSummaryView document={doc} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 자기 설명 코칭 — 학생만, 분석 완료 자료가 있을 때만 노출 */}
            {!isInstructor && documents.some((d) => d.processingStatus === "COMPLETED") && (
              <div className="mt-10">
                <SelfExplanationPanel lectureId={lectureId} />
              </div>
            )}

            <div className="h-20" />
          </div>
        </div>

        {/* ── 드래그 핸들 ── */}
        <div
          onMouseDown={handleMouseDown}
          className="w-1.5 h-full bg-border hover:bg-primary/40 cursor-col-resize flex items-center justify-center shrink-0 transition-colors group relative z-10"
          title="드래그하여 너비 조정"
        >
          <div className="absolute flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>

        {/* AI Sidebar (너비 조절 가능) */}
        <div
          className="h-full border-l border-border bg-card shrink-0 overflow-hidden"
          style={{ width: sidebarWidth }}
        >
          <AiSidebar lectureId={lectureId} />
        </div>
      </div>
    </div>
  );
}
