"use client";
import React, { useState, use, useEffect, useMemo } from "react";
import MainLayout from "@/components/layout/MainLayout";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ChevronRight, Loader2, Settings, Sparkles } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getQuizzes, submitQuiz } from "@/lib/api/quiz";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useLearningHeartbeat } from "@/lib/hooks/useLearningHeartbeat";

// Fisher–Yates 셔플 (불변 — 새 배열 반환)
function shuffleArray<T>(arr: T[]): T[] {
  const next = [...arr];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

export default function QuizPage({ params }: { params: Promise<{ lectureId: string }> }) {
  const resolvedParams = use(params);
  const lectureId = Number(resolvedParams.lectureId);
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const isInstructor = user?.role === "INSTRUCTOR";

  // 퀴즈를 푸는 동안 학습 시간 누적 (학생만)
  useLearningHeartbeat(lectureId, "QUIZ");

  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedOptIndex, setSelectedOptIndex] = useState<number | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);

  const { data: quizzes = [], isLoading } = useQuery({
    queryKey: ['quizzes', lectureId],
    queryFn: () => getQuizzes(lectureId)
  });

  // 현재 문제가 바뀔 때마다 객관식 보기 순서를 새로 셔플 (정답 위치 편향 제거)
  const shuffledOptions = useMemo(() => {
    const quiz = quizzes[currentQuizIndex];
    if (!quiz || quiz.quizType !== "MULTIPLE_CHOICE" || !quiz.options) return null;
    return shuffleArray(quiz.options);
    // currentQuizIndex 가 바뀔 때 + quiz.id 가 바뀔 때만 재셔플
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizzes[currentQuizIndex]?.id, currentQuizIndex]);

  const submitMutation = useMutation({
    mutationFn: (args: { answer: string; timeSpent: number }) => 
      submitQuiz(quizzes[currentQuizIndex].id, { userAnswer: args.answer, timeSpent: args.timeSpent }),
    onSuccess: () => {
      setShowResult(true);
      // Refetch quizzes to get updated feedback/history if needed
      queryClient.invalidateQueries({ queryKey: ['analysis'] });
    },
    onError: () => {
      alert("답안 제출에 실패했습니다.");
    }
  });

  useEffect(() => {
    setStartTime(Date.now());
  }, [currentQuizIndex]);

  const handleSelect = (idx: number) => {
    if (showResult) return;
    setSelectedOptIndex(idx);
  };

  const handleSubmit = () => {
    const quiz = quizzes[currentQuizIndex];
    let answer = "";
    if (quiz.quizType === "MULTIPLE_CHOICE") {
      if (selectedOptIndex === null) return;
      // 셔플된 보기에서 사용자가 고른 텍스트
      answer = shuffledOptions?.[selectedOptIndex] || "";
    } else {
      if (!textAnswer.trim()) return;
      answer = textAnswer.trim();
    }

    const timeSpentSeconds = Math.floor((Date.now() - startTime) / 1000);
    submitMutation.mutate({ answer, timeSpent: timeSpentSeconds });
  };

  const handleNext = () => {
    if (currentQuizIndex < quizzes.length - 1) {
      setCurrentQuizIndex(p => p + 1);
      setSelectedOptIndex(null);
      setTextAnswer("");
      setShowResult(false);
    } else {
      window.location.href = "/analysis";
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[80vh]">
          <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
          <p className="text-slate-500 font-medium">퀴즈를 불러오는 중입니다...</p>
        </div>
      </MainLayout>
    );
  }

  if (quizzes.length === 0) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center max-w-lg mx-auto px-6">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-5">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">등록된 퀴즈가 없습니다</h2>
          {isInstructor ? (
            <>
              <p className="text-slate-500 font-medium mb-6">
                학생들이 풀 복습 퀴즈를 직접 출제하거나, AI 자동 출제로 빠르게 시작해보세요.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href={`/learn/${lectureId}/quiz/manage`}
                  className="px-6 h-12 bg-gradient-to-r from-blue-600 to-primary text-white font-bold rounded-full shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  퀴즈 관리 페이지로 이동
                </Link>
                <Link
                  href={`/learn/${lectureId}`}
                  className="px-6 h-12 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-full transition-colors flex items-center justify-center"
                >
                  학습 뷰로 돌아가기
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="text-slate-500 font-medium mb-6">
                담당 교강사가 아직 복습 문제를 출제하지 않았습니다. 곧 추가될 예정입니다!
              </p>
              <Link
                href={`/learn/${lectureId}`}
                className="text-primary font-bold hover:underline"
              >
                학습 뷰로 돌아가기
              </Link>
            </>
          )}
        </div>
      </MainLayout>
    );
  }

  const quiz = quizzes[currentQuizIndex];
  
  // 제출 후 결과 (임시로 프론트엔드에서 판단하거나, Mutation 응답 결과를 사용)
  // 백엔드 명세상 submitQuiz 응답(QuizResult)에 isCorrect, explanation이 들어있으므로 이를 참고해야 하지만 
  // 여기서는 빠른 UI 제공을 위해 mutation response를 기다리지 않고 바로 표시하는 형태였다면 수정 필요.
  // submitMutation.data 안에 QuizResult 가 들어있다.
  const resultData = submitMutation.data;

  return (
    <MainLayout>
       <div className="flex flex-col w-full py-8 text-slate-800 max-w-3xl mx-auto min-h-[80vh]">
          <Link href={`/learn/${lectureId}`} className="inline-flex items-center text-slate-500 font-bold hover:text-primary mb-6 transition-colors w-max">
             <ArrowLeft className="w-4 h-4 mr-2" />
             학습 뷰로 돌아가기
          </Link>
          
          <div className="flex justify-between items-end mb-8">
             <div>
                <span className="inline-flex px-3 py-1 bg-orange-100 border border-orange-200 rounded-full text-sm font-bold text-orange-600 mb-3">
                  복습 타이밍!
                </span>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
                   핵심 개념 마스터 점검
                </h1>
             </div>
             <div className="text-xl font-black text-slate-400 bg-slate-100 px-4 py-2 rounded-[1rem]">
                {currentQuizIndex + 1} / {quizzes.length}
             </div>
          </div>

          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden mb-10">
             <div className="bg-orange-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${((currentQuizIndex + 1) / quizzes.length) * 100}%` }} />
          </div>

          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 md:p-12 shadow-xl relative overflow-hidden flex-1 flex flex-col">
             
             {/* Decorative blob */}
             <div className="absolute right-0 top-0 w-64 h-64 bg-orange-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

             <div className="mb-10 z-10 relative">
               <span className="inline-block px-3 py-1 bg-slate-100 text-slate-500 font-bold text-xs rounded-full mb-4">
                  {quiz.difficulty === 'HARD' ? '어려움' : quiz.difficulty === 'MEDIUM' ? '보통' : '쉬움'} • {quiz.conceptTag || '일반'}
               </span>
               <h2 className="text-2xl md:text-3xl font-bold text-slate-800 leading-relaxed">
                 <span className="text-orange-500 font-black mr-2">Q.</span>
                 {quiz.question}
               </h2>
             </div>

             <div className="space-y-4 mb-8 z-10 relative flex-1">
               {quiz.quizType === "MULTIPLE_CHOICE" && shuffledOptions && shuffledOptions.map((opt, idx) => {
                 let btnClasses = "w-full text-left p-5 border-2 rounded-[1.5rem] font-bold text-lg transition-all ";
                 
                 if (!showResult) {
                   btnClasses += selectedOptIndex === idx 
                     ? "border-orange-500 bg-orange-50 text-orange-700 shadow-md scale-[1.02]" 
                     : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-600";
                 } else {
                    const isSelected = selectedOptIndex === idx;
                    // For multiple choice, if we don't have resultData yet, we show pending
                    if (resultData) {
                       const isCorrectAnswer = resultData.correctAnswer === opt;
                       if (isCorrectAnswer) {
                          btnClasses += "border-green-500 bg-green-50 text-green-700";
                       } else if (isSelected && !isCorrectAnswer) {
                          btnClasses += "border-red-400 bg-red-50 text-red-600";
                       } else {
                          btnClasses += "border-slate-100 bg-slate-50 text-slate-400 opacity-50";
                       }
                    } else {
                       btnClasses += "border-slate-100 bg-slate-50 text-slate-400 opacity-50";
                    }
                 }

                 return (
                   <button key={idx} onClick={() => handleSelect(idx)} disabled={showResult || submitMutation.isPending} className={btnClasses}>
                      {opt}
                   </button>
                 );
               })}

               {quiz.quizType !== "MULTIPLE_CHOICE" && (
                 <textarea
                    className="w-full h-40 p-5 border-2 border-slate-200 rounded-[1.5rem] font-medium text-lg focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-50 transition-all resize-none disabled:bg-slate-50 disabled:text-slate-500"
                    placeholder="여기에 답안을 작성해주세요..."
                    value={textAnswer}
                    onChange={(e) => setTextAnswer(e.target.value)}
                    disabled={showResult || submitMutation.isPending}
                 />
               )}
             </div>

             {/* Result Area */}
             <div className="mt-auto pt-6 z-10 relative">
               {!showResult ? (
                 <button 
                   onClick={handleSubmit} 
                   disabled={(quiz.quizType === "MULTIPLE_CHOICE" ? selectedOptIndex === null : textAnswer.trim() === "") || submitMutation.isPending}
                   className="w-full h-16 bg-slate-800 text-white rounded-[1.5rem] font-bold text-lg shadow-lg disabled:opacity-50 disabled:bg-slate-300 transition-all hover:bg-slate-700 hover:-translate-y-1 flex items-center justify-center"
                 >
                   {submitMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : "정답 제출하기"}
                 </button>
               ) : (
                 <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {resultData && (
                      <div className={`p-6 rounded-[1.5rem] mb-6 flex flex-col items-start ${resultData.isCorrect ? 'bg-green-100 border border-green-200' : 'bg-red-50 border border-red-100'}`}>
                         <div className="flex items-start mb-4">
                           <CheckCircle2 className={`w-8 h-8 mr-4 shrink-0 ${resultData.isCorrect ? 'text-green-600' : 'text-red-500'}`} />
                           <div>
                             <h3 className={`text-xl font-bold mb-2 ${resultData.isCorrect ? 'text-green-800' : 'text-red-700'}`}>
                               {resultData.isCorrect ? '정답입니다! 완벽해요✨' : '아쉽지만 오답이에요!'}
                             </h3>
                             <p className="text-slate-700 font-medium leading-relaxed mb-4">
                               {resultData.explanation}
                             </p>
                           </div>
                         </div>
                         {resultData.aiFeedback && (
                           <div className="w-full bg-white/60 p-4 rounded-xl border border-white/50 text-sm font-medium text-slate-700">
                             <strong>AI 튜터 피드백:</strong> {resultData.aiFeedback}
                           </div>
                         )}
                      </div>
                    )}
                    
                    <button 
                      onClick={handleNext}
                      className="w-full h-16 bg-primary text-white rounded-[1.5rem] font-bold text-lg shadow-lg transition-all hover:shadow-xl hover:-translate-y-1 flex items-center justify-center group"
                    >
                      {currentQuizIndex < quizzes.length - 1 ? '다음 문제로 넘어가기' : '학습 분석 보러가기'}
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
