"use client";
import React, { useState } from "react";
import { Send, Sparkles, User, RefreshCw, ChevronDown } from "lucide-react";
import Image from "next/image";

export default function AiSidebar() {
  const [messages, setMessages] = useState([
    { role: "ai", content: "안녕하세요! '인공지능 개론' 학습을 시작하셨네요. 이번 챕터인 '신경망의 구조'와 관련해 궁금한 점이 있다면 무엇이든 물어보세요!" }
  ]);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = () => {
    if (!inputVal.trim()) return;
    setMessages((prev) => [...prev, { role: "user", content: inputVal }]);
    setInputVal("");
    setIsTyping(true);

    // Mock response
    setTimeout(() => {
      setMessages((prev) => [...prev, { 
        role: "ai", 
        content: "좋은 질문이에요! 신경망의 은닉층(Hidden Layer)은 입력층에서 전달받은 데이터를 비선형적으로 변환하는 핵심 역할을 합니다. 교재 14페이지에 시각화된 구조를 보시면 이해가 빠를 거예요." 
      }]);
      setIsTyping(false);
    }, 1500);
  };

  const suggestions = [
    "은닉층이 왜 필요한가요?", 
    "활성화 함수란 무엇인가요?", 
    "이전 내용 요약해줘"
  ];

  return (
    <div className="w-full h-full bg-white border-l border-slate-200 flex flex-col shadow-[0_0_40px_rgba(0,0,0,0.03)] relative">
       {/* Header */}
       <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 shrink-0 bg-white z-10">
          <div className="flex items-center space-x-2">
             <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
               <Sparkles className="w-4 h-4 text-primary" />
             </div>
             <span className="font-bold text-slate-800">Memora 튜터</span>
          </div>
          <button className="w-8 h-8 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
       </div>

       {/* Chat Area */}
       <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 opacity-[0.03] pointer-events-none grayscale">
             <Image src="/images/logo.png" alt="watermark" fill sizes="192px" className="object-contain" />
          </div>

          <div className="text-center">
            <span className="text-xs font-bold bg-white border border-slate-200 text-slate-400 px-3 py-1 rounded-full shadow-sm">
              오늘
            </span>
          </div>

          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} items-end space-x-2 relative z-10`}>
              {msg.role === "ai" && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-md mb-1 shrink-0 text-white font-bold text-xs">
                   M
                </div>
              )}
              
              <div className={`max-w-[80%] rounded-[1.5rem] p-4 text-sm font-medium leading-relaxed shadow-sm
                ${msg.role === "user" 
                  ? "bg-slate-800 text-white rounded-br-sm" 
                  : "bg-white border border-slate-200 text-slate-700 rounded-bl-sm"}
              `}>
                {msg.content}
              </div>
            </div>
          ))}

          {isTyping && (
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
               disabled={!inputVal.trim() || isTyping}
               className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shrink-0 disabled:opacity-50 disabled:bg-slate-300 transition-colors shadow-md shadow-primary/20"
             >
               <Send className="w-4 h-4 ml-0.5" />
             </button>
          </div>
       </div>
    </div>
  );
}
