"use client";
import React, { useState, use } from "react";
import MainLayout from "@/components/layout/MainLayout";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ChevronRight, Play } from "lucide-react";

export default function QuizPage({ params }: { params: Promise<{ lectureId: string }> }) {
  const resolvedParams = use(params);
  const [currentQuiz, setCurrentQuiz] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const quizzes = [
    {
      q: "인공 신경망에서 입력층에서 전달받은 데이터를 비선형적으로 변환하는 핵심 역할을 하는 층은?",
      opts: ["입력층", "은닉층", "출력층", "완전연결층"],
      answer: 1,
      explanation: "은닉층(Hidden Layer)은 전달받은 입력을 비선형 활성화 함수를 통해 변환하여 복잡한 패턴(예: XOR 문제)을 학습할 수 있게 합니다."
    },
    {
      q: "다음 중 활성화 함수로 주로 쓰이는 것이 아닌 것은?",
      opts: ["ReLU", "Sigmoid", "Softmax", "Linear Regression"],
      answer: 3,
      explanation: "Linear Regression(선형 회귀)은 머신러닝 알고리즘의 하나일 뿐, 그 자체로 뉴런의 출력값을 비선형적으로 만들어주는 활성화 함수는 아닙니다."
    }
  ];

  const handleSelect = (idx: number) => {
    if (showResult) return;
    setSelectedOpt(idx);
  };

  const handleSubmit = () => {
    if (selectedOpt === null) return;
    setShowResult(true);
  };

  const handleNext = () => {
    if (currentQuiz < quizzes.length - 1) {
      setCurrentQuiz(p => p + 1);
      setSelectedOpt(null);
      setShowResult(false);
    } else {
      window.location.href = "/analysis";
    }
  };

  const quiz = quizzes[currentQuiz];
  const isCorrect = selectedOpt === quiz.answer;

  return (
    <MainLayout>
       <div className="flex flex-col w-full py-8 text-slate-800 max-w-3xl mx-auto min-h-[80vh]">
          <Link href={`/learn/${resolvedParams.lectureId}`} className="inline-flex items-center text-slate-500 font-bold hover:text-primary mb-6 transition-colors w-max">
             <ArrowLeft className="w-4 h-4 mr-2" />
             학습 뷰로 돌아가기
          </Link>
          
          <div className="flex justify-between items-end mb-8">
             <div>
                <span className="inline-flex px-3 py-1 bg-orange-100 border border-orange-200 rounded-full text-sm font-bold text-orange-600 mb-3">
                  복습 타이밍!
                </span>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
                   인공지능 개론 <br/>1회독 마스터 점검
                </h1>
             </div>
             <div className="text-xl font-black text-slate-400 bg-slate-100 px-4 py-2 rounded-[1rem]">
                {currentQuiz + 1} / {quizzes.length}
             </div>
          </div>

          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden mb-10">
             <div className="bg-orange-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${((currentQuiz + 1) / quizzes.length) * 100}%` }} />
          </div>

          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 md:p-12 shadow-xl relative overflow-hidden flex-1 flex flex-col">
             
             {/* Decorative blob */}
             <div className="absolute right-0 top-0 w-64 h-64 bg-orange-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

             <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-10 leading-relaxed z-10 relative">
               <span className="text-orange-500 font-black mr-2">Q.</span>
               {quiz.q}
             </h2>

             <div className="space-y-4 mb-8 z-10 relative flex-1">
               {quiz.opts.map((opt, idx) => {
                 let btnClasses = "w-full text-left p-5 border-2 rounded-[1.5rem] font-bold text-lg transition-all ";
                 
                 if (!showResult) {
                   btnClasses += selectedOpt === idx 
                     ? "border-orange-500 bg-orange-50 text-orange-700 shadow-md scale-[1.02]" 
                     : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-600";
                 } else {
                   // Results mode
                   if (idx === quiz.answer) {
                     btnClasses += "border-green-500 bg-green-50 text-green-700";
                   } else if (idx === selectedOpt && selectedOpt !== quiz.answer) {
                     btnClasses += "border-red-400 bg-red-50 text-red-600";
                   } else {
                     btnClasses += "border-slate-100 bg-slate-50 text-slate-400 opacity-50";
                   }
                 }

                 return (
                   <button key={idx} onClick={() => handleSelect(idx)} disabled={showResult} className={btnClasses}>
                      {opt}
                   </button>
                 );
               })}
             </div>

             {/* Result Area */}
             <div className="mt-auto pt-6 z-10 relative">
               {!showResult ? (
                 <button 
                   onClick={handleSubmit} 
                   disabled={selectedOpt === null}
                   className="w-full h-16 bg-slate-800 text-white rounded-[1.5rem] font-bold text-lg shadow-lg disabled:opacity-50 disabled:bg-slate-300 transition-all hover:bg-slate-700 hover:-translate-y-1"
                 >
                   정답 확인하기
                 </button>
               ) : (
                 <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className={`p-6 rounded-[1.5rem] mb-6 flex items-start ${isCorrect ? 'bg-green-100 border border-green-200' : 'bg-red-50 border border-red-100'}`}>
                       <CheckCircle2 className={`w-8 h-8 mr-4 shrink-0 ${isCorrect ? 'text-green-600' : 'text-red-500'}`} />
                       <div>
                         <h3 className={`text-xl font-bold mb-2 ${isCorrect ? 'text-green-800' : 'text-red-700'}`}>
                           {isCorrect ? '정답입니다! 완벽해요✨' : '아쉽지만 오답이에요!'}
                         </h3>
                         <p className="text-slate-700 font-medium leading-relaxed">
                           {quiz.explanation}
                         </p>
                       </div>
                    </div>
                    
                    <button 
                      onClick={handleNext}
                      className="w-full h-16 bg-primary text-white rounded-[1.5rem] font-bold text-lg shadow-lg transition-all hover:shadow-xl hover:-translate-y-1 flex items-center justify-center group"
                    >
                      {currentQuiz < quizzes.length - 1 ? '다음 문제로 넘어가기' : '학습 분석 보러가기'}
                      <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </button>
                 </div>
               )}
             </div>

          </div>
       </div>
    </MainLayout>
  );
}
