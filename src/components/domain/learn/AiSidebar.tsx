"use client";
import React, { useState, useEffect, useRef } from "react";
import { Send, Sparkles, RefreshCw, Loader2, BookOpen, Lightbulb, HelpCircle, Brain } from "lucide-react";
import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSessions, createSession, getSession, sendMessage } from "@/lib/api/qa";
import type { QaMessage, QaMode } from "@/types/qa";
import ReactMarkdown from "react-markdown";

const SUGGESTIONS = [
  { icon: BookOpen, text: "핵심 내용 요약해줘" },
  { icon: HelpCircle, text: "이해가 안되는 부분이 있어" },
  { icon: Lightbulb, text: "관련 문제 내줘" },
];

export default function AiSidebar({ lectureId }: { lectureId: number }) {
  const queryClient = useQueryClient();
  const [inputVal, setInputVal] = useState("");
  const [qaMode, setQaMode] = useState<QaMode>("NORMAL");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // 낙관적 UI: 사용자 메시지가 즉시 표시되도록 로컬에 추가
  const [optimisticMessages, setOptimisticMessages] = useState<QaMessage[]>([]);
  // 세션이 없을 때 전송된 메시지를 임시 보관
  const pendingMessageRef = useRef<string | null>(null);

  // 1. 세션 목록 조회
  const { data: sessions = [], isLoading: isSessionsLoading } = useQuery({
    queryKey: ["qaSessions", lectureId],
    queryFn: () => getSessions(lectureId),
  });

  const currentSession = sessions.find((s) => s.lectureId === lectureId) ?? null;
  const currentSessionId = currentSession?.id ?? null;

  // 2. 세션 없으면 자동 생성 (한 번만)
  const createSessionMutation = useMutation({
    mutationFn: () => createSession(lectureId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qaSessions"] });
    },
  });

  useEffect(() => {
    if (
      !isSessionsLoading &&
      !currentSession &&
      !createSessionMutation.isPending &&
      !createSessionMutation.isSuccess
    ) {
      createSessionMutation.mutate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSessionsLoading, currentSession]);

  // 세션이 준비되면 대기 중인 메시지 자동 전송
  useEffect(() => {
    if (currentSessionId && pendingMessageRef.current) {
      const pending = pendingMessageRef.current;
      pendingMessageRef.current = null;
      sendMutation.mutate(pending);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSessionId]);

  // 3. 세션 메시지 조회
  const { data: sessionData, isLoading: isSessionLoading } = useQuery({
    queryKey: ["qaSession", currentSessionId],
    queryFn: () => getSession(currentSessionId!),
    enabled: !!currentSessionId,
  });

  // 서버 메시지 + 낙관적 메시지 머지
  const serverMessages: QaMessage[] = sessionData?.messages ?? [];
  const allMessages = [...serverMessages, ...optimisticMessages];

  // 스크롤 하단 고정
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages.length]);

  // 서버에서 새 메시지 오면 낙관적 메시지 제거
  useEffect(() => {
    if (optimisticMessages.length > 0 && serverMessages.length > 0) {
      setOptimisticMessages([]);
    }
  }, [serverMessages.length]);

  const sendMutation = useMutation({
    mutationFn: (text: string) => sendMessage(currentSessionId!, { content: text, mode: qaMode }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qaSession", currentSessionId] });
    },
    onError: () => {
      // 실패 시 낙관적 메시지 제거
      setOptimisticMessages([]);
      alert("응답을 받아오는데 실패했습니다. 다시 시도해주세요.");
    },
  });

  const handleSend = (text?: string) => {
    const content = (text ?? inputVal).trim();
    if (!content || sendMutation.isPending) return;

    // 세션이 아직 없으면 → 준비되는 즉시 자동 전송되도록 큐에 저장
    if (!currentSessionId) {
      pendingMessageRef.current = content;
      setInputVal("");
      // 낙관적으로 사용자 메시지 표시 (세션 준비 중 표시용)
      const tempId = Date.now();
      setOptimisticMessages((prev) => [
        ...prev,
        { id: tempId, role: "USER", content, sources: null, createdAt: new Date().toISOString() },
      ]);
      return;
    }

    // 낙관적 UI: 사용자 메시지 즉시 표시
    const tempId = Date.now();
    setOptimisticMessages((prev) => [
      ...prev,
      { id: tempId, role: "USER", content, sources: null, createdAt: new Date().toISOString() },
    ]);

    setInputVal("");
    sendMutation.mutate(content);
    inputRef.current?.focus();
  };

  const isInitializing = isSessionsLoading || createSessionMutation.isPending;
  const isSending = sendMutation.isPending;

  // 세션 준비 중이면 로딩 표시
  if (isInitializing) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
        <span className="text-sm font-medium text-muted-foreground">AI 튜터 준비 중...</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-card relative">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-5 border-b border-border shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center border border-primary/10">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <span className="font-bold text-foreground text-sm leading-none block">Memora 튜터</span>
            <span className={`text-[11px] font-medium ${
              currentSessionId ? "text-emerald-500" : "text-amber-400"
            }`}>
              {currentSessionId ? "온라인" : "세션 준비 중..."}
            </span>
          </div>
        </div>
        <button
          onClick={() => {
            if (currentSessionId) {
              queryClient.invalidateQueries({ queryKey: ["qaSession", currentSessionId] });
            }
          }}
          className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors"
          title="대화 새로고침"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-muted/60 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 opacity-[0.025] pointer-events-none grayscale">
          <Image src="/images/logo.png" alt="" fill sizes="160px" className="object-contain" />
        </div>

        <div className="p-4 space-y-4 relative z-10">
          {/* Date divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[11px] font-bold text-muted-foreground">오늘</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Welcome (empty state) */}
          {allMessages.length === 0 && !isSessionLoading && (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-blue-500/10 flex items-center justify-center border border-primary/10">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm mb-1">무엇이든 물어보세요!</p>
                <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                  이 강의 자료를 기반으로<br />AI가 답변해드립니다.
                </p>
              </div>
            </div>
          )}

          {isSessionLoading && (
            <div className="py-10 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground/60" />
            </div>
          )}

          {/* Messages */}
          {allMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "USER" ? "justify-end" : "justify-start"} items-end gap-2`}
            >
              {msg.role === "ASSISTANT" && (
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-sm shrink-0 mb-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
              )}

              <div
                className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                  msg.role === "USER"
                    ? "bg-foreground text-background rounded-br-sm font-medium"
                    : "bg-card border border-border text-foreground rounded-bl-sm"
                }`}
              >
                {msg.role === "ASSISTANT" ? (
                  <>
                    <div className="prose prose-sm prose-slate max-w-none prose-p:my-1 prose-p:text-foreground prose-ul:my-1 prose-li:my-0.5 prose-strong:text-foreground prose-headings:text-foreground prose-headings:font-bold">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-[11px] text-muted-foreground font-bold mb-1.5">📄 참고 자료</p>
                        <div className="flex flex-col gap-1">
                          {msg.sources.map((src, i) => (
                            <span
                              key={i}
                              className="text-[11px] bg-muted text-muted-foreground px-2.5 py-1 rounded-lg border border-border font-medium"
                            >
                              {src.documentName} · p.{src.pageNumber}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}

          {/* AI 응답 중 애니메이션 */}
          {isSending && (
            <div className="flex justify-start items-end gap-2">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-sm shrink-0 mb-0.5">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-1.5 h-11">
                <div className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="px-4 pb-4 pt-3 bg-card border-t border-border shrink-0 space-y-3">
        {/* 소크라테스 모드 토글 */}
        <button
          type="button"
          onClick={() => setQaMode((m) => (m === "NORMAL" ? "SOCRATIC" : "NORMAL"))}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
            qaMode === "SOCRATIC"
              ? "bg-violet-500/15 text-violet-700 border border-violet-500/30"
              : "bg-muted text-muted-foreground border border-border hover:bg-muted/80"
          }`}
        >
          <Brain className="w-3.5 h-3.5" />
          {qaMode === "SOCRATIC" ? "🧠 소크라테스 모드 ON — 역질문으로 생각을 끌어냅니다" : "💬 일반 모드 — 바로 답변합니다"}
        </button>

        {/* Suggestion chips */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-0.5">
          {SUGGESTIONS.map(({ icon: Icon, text }, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSend(text)}
              disabled={isSending}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-muted border border-border rounded-full text-xs font-bold text-muted-foreground hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Icon className="w-3 h-3" />
              {text}
            </button>
          ))}
        </div>

        {/* Text input */}
        <div className="flex items-center gap-2 bg-muted border border-border rounded-2xl px-4 py-2 focus-within:ring-2 ring-primary/20 focus-within:border-primary/30 focus-within:bg-card transition-all">
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-foreground placeholder:text-muted-foreground h-9"
            placeholder="무엇이든 물어보세요..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={isSending}
          />
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={!inputVal.trim() || isSending}
            className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 disabled:opacity-40 disabled:bg-muted-foreground/40 transition-all hover:bg-primary/90 shadow-sm shadow-primary/20 cursor-pointer"
          >
            {isSending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5 ml-0.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
