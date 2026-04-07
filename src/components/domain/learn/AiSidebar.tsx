"use client";
import React, { useState, useEffect, useRef } from "react";
import { Send, Sparkles, User, RefreshCw, Loader2 } from "lucide-react";
import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSessions, createSession, getSession, sendMessage } from "@/lib/api/qa";
import type { QaSession, QaMessage } from "@/types/qa";
import ReactMarkdown from "react-markdown";

export default function AiSidebar({ lectureId }: { lectureId: number }) {
  const queryClient = useQueryClient();
  const [inputVal, setInputVal] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. 세션 목록 조회 및 현재 강의에 해당하는 세션 찾기
  const { data: sessions = [], isLoading: isSessionsLoading } = useQuery({
    queryKey: ['qaSessions'],
    queryFn: getSessions
  });

  const currentSession = sessions.find(s => s.lectureId === lectureId);

  // 2. 세션이 없다면 생성
  const createSessionMutation = useMutation({
    mutationFn: () => createSession(lectureId, `강의 ${lectureId} 질문 세션`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qaSessions'] });
    }
  });

  useEffect(() => {
    if (!isSessionsLoading && !currentSession && !createSessionMutation.isPending && !createSessionMutation.isSuccess) {
      createSessionMutation.mutate();
    }
  }, [isSessionsLoading, currentSession, lectureId]);

  // 3. 현재 세션 메시지 조회
  const { data: sessionData, isLoading: isSessionLoading } = useQuery({
    queryKey: ['qaSession', currentSession?.id],
    queryFn: () => getSession(currentSession!.id),
    enabled: !!currentSession?.id
  });

  const messages: QaMessage[] = sessionData?.messages || [];

  // 스크롤 하단 고정
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const sendMutation = useMutation({
    mutationFn: (text: string) => sendMessage(currentSession!.id, { content: text }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qaSession', currentSession?.id] });
    },
    onError: () => {
      alert("응답을 받아오는데 실패했습니다.");
    }
  });

  const handleSend = () => {
    if (!inputVal.trim() || !currentSession || sendMutation.isPending) return;
    const text = inputVal.trim();
    setInputVal("");
    
    // Optimistic UI 방식을 위해 쿼리 캐시를 직접 수정할 수 있지만 여기선 단순화하여 refetch 의존
    // 대신 로딩 바를 표시함
    sendMutation.mutate(text);
  };

  const suggestions = [
    "핵심 내용 요약해줘", 
    "이해가 안되는 부분이 있어", 
    "관련 문제 내줘"
  ];

  if (isSessionsLoading || createSessionMutation.isPending || (currentSession && isSessionLoading)) {
    return (
      <div className="w-full h-full bg-white border-l border-slate-200 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <span className="text-sm font-medium text-slate-500">AI 튜터 준비 중...</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white border-l border-slate-200 flex flex-col shadow-[0_0_40px_rgba(0,0,0,0.03)] relative">
       {/* Header */}
       <div className="h-14 flex items-center justify-between px-6 border-b border-slate-100 shrink-0 bg-white z-10">
          <div className="flex items-center space-x-2">
             <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
               <Sparkles className="w-4 h-4 text-primary" />
             </div>
             <span className="font-bold text-slate-800">Memora 튜터</span>
          </div>
          <button onClick={() => queryClient.invalidateQueries({ queryKey: ['qaSession', currentSession?.id] })} className="w-8 h-8 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
       </div>

       {/* Chat Area */}
       <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 relative custom-scrollbar">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 opacity-[0.03] pointer-events-none grayscale">
             <Image src="/images/logo.png" alt="watermark" fill sizes="192px" className="object-contain" />
          </div>

          <div className="text-center">
            <span className="text-xs font-bold bg-white border border-slate-200 text-slate-400 px-3 py-1 rounded-full shadow-sm">
              오늘
            </span>
          </div>

          {messages.length === 0 && (
             <div className="text-center py-10 text-slate-500 font-medium text-sm">
                궁금한 점을 자유롭게 질문해보세요!
             </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "USER" ? "justify-end" : "justify-start"} items-end space-x-2 relative z-10`}>
              {msg.role === "ASSISTANT" && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-md mb-1 shrink-0 text-white font-bold text-xs">
                   M
                </div>
              )}
              
              <div className={`max-w-[85%] rounded-[1.5rem] p-4 text-sm font-medium leading-relaxed shadow-sm
                ${msg.role === "USER" 
                  ? "bg-slate-800 text-white rounded-br-sm" 
                  : "bg-white border border-slate-200 text-slate-700 rounded-bl-sm"}
              `}>
                {msg.role === "ASSISTANT" ? (
                  <div className="prose prose-sm prose-slate max-w-none prose-p:my-1 prose-ul:my-1">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-1">
                        <span className="text-xs text-slate-400 font-bold">출처:</span>
                        {msg.sources.map((src, i) => (
                          <span key={i} className="text-xs bg-slate-50 text-slate-500 px-2 py-1 rounded border border-slate-100">
                            {src.documentName} (p.{src.pageNumber})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}

          {sendMutation.isPending && (
             <div className="flex justify-start items-end space-x-2 relative z-10">
               <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-md mb-1 shrink-0 text-white font-bold text-xs">
                   M
               </div>
               <div className="bg-white border border-slate-200 rounded-[1.5rem] rounded-bl-sm p-4 shadow-sm flex space-x-1 items-center h-[52px]">
                 <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                 <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                 <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
               </div>
             </div>
          )}
          <div ref={messagesEndRef} />
       </div>

       {/* Input Area */}
       <div className="p-4 bg-white border-t border-slate-100 shrink-0">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-4 pb-1 -mx-2 px-2">
            {suggestions.map((text, i) => (
              <button key={i} onClick={() => setInputVal(text)} className="whitespace-nowrap px-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-xs font-bold text-slate-600 hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all">
                {text}
              </button>
            ))}
          </div>

          <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-[1.5rem] p-2 focus-within:ring-2 ring-primary/20 focus-within:bg-white transition-all">
             <input 
               type="text" 
               className="flex-1 bg-transparent border-none outline-none px-4 text-sm font-medium text-slate-700 placeholder:text-slate-400 h-10"
               placeholder="무엇이든 물어보세요..."
               value={inputVal}
               onChange={(e) => setInputVal(e.target.value)}
               onKeyDown={(e) => e.key === "Enter" && handleSend()}
             />
             <button 
               onClick={handleSend}
               disabled={!inputVal.trim() || sendMutation.isPending || !currentSession}
               className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shrink-0 disabled:opacity-50 disabled:bg-slate-300 transition-colors shadow-md shadow-primary/20"
             >
               <Send className="w-4 h-4 ml-0.5" />
             </button>
          </div>
       </div>
    </div>
  );
}
