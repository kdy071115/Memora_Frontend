"use client";
import React, { use } from "react";
import MainLayout from "@/components/layout/MainLayout";
import AiSidebar from "@/components/domain/learn/AiSidebar";
import Link from "next/link";
import { ArrowLeft, BookOpen, Layers, CheckCircle } from "lucide-react";

export default function LearnPage({ params }: { params: Promise<{ lectureId: string }> }) {
  const resolvedParams = use(params);

  return (
    <div className="h-screen flex flex-col bg-background font-sans">
      {/* Top Header specific for learning view */}
      <header className="h-14 border-b border-slate-200 bg-white px-4 flex items-center justify-between shrink-0 shadow-sm z-20">
         <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="w-8 h-8 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-500 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center space-x-2">
               <span className="text-xs font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-md">인공지능 개론</span>
               <h1 className="font-bold text-slate-800">Chapter 4. 신경망의 구조와 원리</h1>
            </div>
         </div>
         <div className="flex items-center space-x-4">
            <Link href={`/learn/${resolvedParams.lectureId}/quiz`} className="px-5 h-9 bg-slate-800 text-white text-sm font-bold rounded-full hover:bg-slate-700 transition-all shadow-sm">
               복습 퀴즈 풀기
            </Link>
         </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 overflow-hidden flex w-full">
         
         {/* Left: Document/Material Area (60%) */}
         <div className="w-[60%] h-full bg-slate-100 overflow-y-auto p-4 md:p-8 flex flex-col items-center custom-scrollbar">
            {/* Mocked PDF / Notion-style document */}
            <div className="w-full max-w-[800px] bg-white border border-slate-200 rounded-[2rem] shadow-sm p-10 md:p-16 min-h-[1200px]">
               <h2 className="text-3xl font-black text-slate-800 mb-6">4.1 신경망(Neural Network)의 기초</h2>
               
               <p className="text-lg text-slate-600 leading-relaxed font-medium mb-8">
                 인공 신경망은 사람 두뇌의 신경 세포(뉴런)들이 연결되어 동작하는 방식을 모방하여 만든 수학적 모델입니다. 데이터를 입력받아 가중치(Weight)를 곱하고 편향(Bias)을 더한 후 활성화 함수(Activation Function)를 거쳐 출력값을 냅니다.
               </p>

               <div className="bg-blue-50 border border-blue-100 rounded-[1.5rem] p-6 mb-8 text-blue-900">
                  <h4 className="font-bold mb-2 flex items-center">
                    <BookOpen className="w-4 h-4 mr-2" />
                    주요 키워드
                  </h4>
                  <ul className="list-disc list-inside space-y-1 font-medium text-sm">
                    <li>입력층 (Input Layer)</li>
                    <li>은닉층 (Hidden Layer)</li>
                    <li>출력층 (Output Layer)</li>
                    <li>활성화 함수 (Activation Function)</li>
                  </ul>
               </div>

               <h3 className="text-2xl font-bold text-slate-800 mt-12 mb-4 drop-shadow-sm">은닉층의 역할</h3>
               <p className="text-lg text-slate-600 leading-relaxed font-medium mb-6">
                 은닉층은 입력된 데이터의 비선형적인 특징을 학습하는 구간입니다. 단순히 층이 하나일 때는 XOR 문제와 같은 복잡한 분류가 불가능하지만, 은닉층이 깊어지는 딥러닝(Deep Learning) 기술을 통해 복잡한 문제도 풀어낼 수 있게 되었습니다.
               </p>

               <div className="w-full h-80 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[1.5rem] flex items-center justify-center flex-col my-10">
                  <Layers className="w-12 h-12 text-slate-300 mb-4" />
                  <p className="text-slate-400 font-bold">도식화된 신경망 이미지 표출 영역</p>
               </div>

               <h3 className="text-2xl font-bold text-slate-800 mt-12 mb-4 drop-shadow-sm">Summary</h3>
               <div className="flex flex-col space-y-4">
                  <div className="flex items-start bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 shrink-0" />
                    <p className="font-medium text-slate-700">신경망은 입력값에 가중치를 곱하고 편향을 더해 판단을 내린다.</p>
                  </div>
                  <div className="flex items-start bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 shrink-0" />
                    <p className="font-medium text-slate-700">은닉층을 통해 비선형적인 문제(XOR 등)를 해결할 수 있다.</p>
                  </div>
               </div>

               {/* Add extra padding bottom for comfortable scrolling */}
               <div className="h-32" />
            </div>
         </div>

         {/* Right: AI Copilot Sidebar (40%) */}
         <div className="w-[40%] h-full shrink-0">
            <AiSidebar />
         </div>
         
      </div>
    </div>
  );
}
