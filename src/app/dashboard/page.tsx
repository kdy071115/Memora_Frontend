"use client";
import MainLayout from "@/components/layout/MainLayout";
import Link from "next/link";
import { Plus, BookOpen, Clock, Activity, ArrowUpRight, Loader2 } from "lucide-react";
import Image from "next/image";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useQuery } from "@tanstack/react-query";
import { getCourses } from "@/lib/api/courses";
import { getAnalysis } from "@/lib/api/analysis";

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  
  // Courses array
  const { data: courses = [], isLoading: isCoursesLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: getCourses,
  });

  // Analysis data
  const { data: analysis, isLoading: isAnalysisLoading } = useQuery({
    queryKey: ['analysis'],
    queryFn: getAnalysis,
  });

  const isLoading = isCoursesLoading || isAnalysisLoading;
  const recentCourse = courses.length > 0 ? courses[0] : null;

  // Formatting helpers
  const formatTime = (seconds?: number) => {
    if (!seconds) return "0시간 0분";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}시간 ${m}분`;
  };

  return (
    <MainLayout>
      <div className="flex flex-col w-full py-8 text-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">환영합니다, {user?.name || "사용자"}님! ✨</h1>
            <p className="text-slate-500 font-medium text-lg">새로운 배움을 시작할 준비가 되셨나요?</p>
          </div>
          <Link href="/courses/create" className="h-14 px-6 bg-gradient-to-r from-blue-600 to-primary text-white rounded-[2rem] font-bold shadow-lg shadow-primary/20 hover:-translate-y-1 hover:shadow-xl transition-all flex items-center group">
            <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
            새 학습 자료 추가하기
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {/* Main Hero Card */}
          <div className="lg:col-span-2 bg-gradient-to-br from-indigo-50 to-blue-50/50 border border-indigo-100 rounded-[2rem] p-8 shadow-sm relative overflow-hidden flex flex-col justify-center">
            <div className="absolute right-0 bottom-0 w-48 h-48 translate-x-10 translate-y-10 bg-white/40 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between z-10 relative">
               <div className="max-w-sm">
                 <span className="inline-flex px-3 py-1 bg-white border border-slate-200 rounded-full text-sm font-bold text-primary mb-4">현재 목표</span>
                 {recentCourse ? (
                   <>
                     <h2 className="text-2xl font-black mb-3">{recentCourse.title} <br/>마스터하기</h2>
                     <p className="text-slate-600 font-medium mb-6">진도율이 {recentCourse.progress || 0}%에 도달했습니다! 꾸준히 학습 중이시네요.</p>
                     <Link href={`/learn/${recentCourse.id}`} className="inline-flex items-center text-primary font-bold hover:text-primary/80 transition-colors">
                       이어서 학습하기 
                       <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center ml-3 border border-slate-100">
                         <ArrowUpRight className="w-4 h-4" />
                       </div>
                     </Link>
                   </>
                 ) : (
                   <>
                     <h2 className="text-2xl font-black mb-3">당신만의 AI 튜터를 <br/>만들어보세요</h2>
                     <p className="text-slate-600 font-medium mb-6">자료를 업로드하면 자동으로 학습 코스가 구성됩니다.</p>
                     <Link href="/courses/create" className="inline-flex items-center text-primary font-bold hover:text-primary/80 transition-colors">
                       새 학습 시작하기
                       <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center ml-3 border border-slate-100">
                         <Plus className="w-4 h-4" />
                       </div>
                     </Link>
                   </>
                 )}
               </div>
               
               <div className="hidden sm:block relative w-40 h-40">
                  <Image src="/images/mascot_reading.png" alt="Mascot" fill sizes="160px" className="object-contain animate-pulse-slow" style={{ animationDuration: '6s' }} />
               </div>
            </div>
          </div>

          {/* Quick Stats Column */}
          <div className="flex flex-col gap-6">
             <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm flex-1 flex flex-col justify-center relative overflow-hidden">
               {isAnalysisLoading ? (
                 <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10"><Loader2 className="w-6 h-6 animate-spin text-primary"/></div>
               ) : null}
               <div className="flex items-center justify-between mb-2">
                 <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                   <Clock className="w-5 h-5 text-orange-500" />
                 </div>
                 <span className="text-sm font-bold text-green-500 bg-green-50 px-2 py-1 rounded-lg">업데이트 됨</span>
               </div>
               <h3 className="text-slate-500 font-bold text-sm mb-1">총 누적 학습 시간</h3>
               <div className="text-2xl font-black">{formatTime(analysis?.totalStudyTime)}</div>
             </div>

             <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm flex-1 flex flex-col justify-center relative overflow-hidden">
               {isAnalysisLoading ? (
                 <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10"><Loader2 className="w-6 h-6 animate-spin text-primary"/></div>
               ) : null}
               <div className="flex items-center justify-between mb-2">
                 <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                   <Activity className="w-5 h-5 text-purple-500" />
                 </div>
                 <span className="text-sm font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">분석 완료</span>
               </div>
               <h3 className="text-slate-500 font-bold text-sm mb-1">테스트 평균 점수</h3>
               <div className="text-2xl font-black">{analysis?.overallScore || 0}점</div>
             </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black">최근 수강 강의</h2>
          <Link href="/courses" className="text-primary font-bold hover:underline">모두 보기</Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full py-10 flex justify-center items-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {courses.slice(0, 2).map((course: any, idx: number) => {
                const colorTheme = idx % 2 === 0 
                  ? { bg: "bg-blue-500", text: "text-blue-600", lightBg: "bg-blue-100", grad: "from-blue-50 to-indigo-50" }
                  : { bg: "bg-pink-500", text: "text-pink-500", lightBg: "bg-purple-100", grad: "from-purple-50 to-pink-50" };
                  
                return (
                  <Link key={course.id} href={`/learn/${course.id}`} className="group bg-white border border-slate-100 rounded-[2rem] overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all">
                    <div className={`h-40 bg-gradient-to-br ${colorTheme.grad} flex items-center justify-center p-6 relative overflow-hidden`}>
                       <div className="w-32 h-32 absolute -right-4 -bottom-4 bg-white/40 rounded-full blur-xl mix-blend-overlay" />
                       <BookOpen className={`w-16 h-16 ${colorTheme.text} opacity-20 group-hover:scale-110 transition-transform duration-500`} />
                    </div>
                    <div className="p-6">
                      <span className={`text-xs font-bold ${colorTheme.lightBg} ${colorTheme.text} px-3 py-1 rounded-full mb-3 inline-block`}>
                        {course.category || "기본 카테고리"}
                      </span>
                      <h3 className="font-bold text-xl mb-1 truncate text-slate-800">{course.title}</h3>
                      <p className="text-sm text-slate-500 mb-6 truncate font-medium">{course.description || "설명 없음"}</p>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm font-bold">
                          <span className="text-slate-700">진도율</span>
                          <span className={colorTheme.text}>{course.progress || 0}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                           <div className={`${colorTheme.bg} h-2.5 rounded-full`} style={{ width: `${course.progress || 0}%` }} />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
              {/* New Course Placeholder */}
              <Link href="/courses/create" className="group bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] overflow-hidden hover:bg-slate-100 hover:border-primary/50 transition-all flex flex-col items-center justify-center p-8 min-h-[300px]">
                 <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:scale-110 group-hover:text-primary transition-all mb-4">
                   <Plus className="w-8 h-8" />
                 </div>
                 <h3 className="font-bold text-xl text-slate-600 group-hover:text-primary transition-colors">새로운 강의 추가</h3>
                 <p className="text-sm text-slate-400 mt-2 font-medium text-center">PDF나 자료를 업로드하고<br/>AI 튜터를 생성하세요</p>
              </Link>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
