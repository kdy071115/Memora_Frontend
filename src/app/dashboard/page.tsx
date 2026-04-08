"use client";
import MainLayout from "@/components/layout/MainLayout";
import Link from "next/link";
import { Plus, BookOpen, Clock, Activity, ArrowUpRight, Loader2, MessageSquareText, ClipboardList, AlarmClock, CheckCircle2, Target, Award } from "lucide-react";
import Image from "next/image";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useQuery } from "@tanstack/react-query";
import { getCourses } from "@/lib/api/courses";
import { getAnalysis, getStudentDashboardSummary } from "@/lib/api/analysis";
import { getStudentFeedback } from "@/lib/api/feedback";
import { getUpcomingAssignments } from "@/lib/api/assignments";
import { dueStatus } from "@/lib/dueDate";

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const isInstructor = user?.role === "INSTRUCTOR";
  const isStudent = user?.role === "STUDENT";

  const { data: courses = [], isLoading: isCoursesLoading } = useQuery({
    queryKey: ["courses"],
    queryFn: getCourses,
  });

  const { data: analysis, isLoading: isAnalysisLoading } = useQuery({
    queryKey: ["analysis"],
    queryFn: getAnalysis,
    enabled: isStudent,
  });

  const { data: feedbacks = [], isLoading: isFeedbacksLoading } = useQuery({
    queryKey: ["studentFeedback"],
    queryFn: getStudentFeedback,
    enabled: isStudent,
  });

  const { data: upcoming = [] } = useQuery({
    queryKey: ["upcomingAssignments"],
    queryFn: () => getUpcomingAssignments(5),
    enabled: isStudent,
  });

  const { data: dashboardSummary } = useQuery({
    queryKey: ["studentDashboardSummary"],
    queryFn: getStudentDashboardSummary,
    enabled: isStudent,
  });

  const isLoading = isCoursesLoading;
  const recentCourse = courses.length > 0 ? courses[0] : null;

  const formatTime = (seconds?: number) => {
    if (!seconds) return "0시간 0분";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}시간 ${m}분`;
  };

  const formatDueDateTime = (s: string) => {
    const d = new Date(s);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  return (
    <MainLayout>
      <div className="flex flex-col w-full py-8 text-slate-800">
        {/* ===== 헤더 ===== */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">
              환영합니다, {user?.name || "사용자"}님! ✨
            </h1>
            <p className="text-slate-500 font-medium text-lg">
              {isInstructor
                ? "오늘도 학생들을 위한 훌륭한 수업을 준비해보세요."
                : "새로운 배움을 시작할 준비가 되셨나요?"}
            </p>
          </div>
          <Link
            href="/courses/create"
            className="h-14 px-6 bg-gradient-to-r from-blue-600 to-primary text-white rounded-[2rem] font-bold shadow-lg shadow-primary/20 hover:-translate-y-1 hover:shadow-xl transition-all flex items-center group"
          >
            <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
            {isInstructor ? "새 강의 개설하기" : "새 학습 자료 추가하기"}
          </Link>
        </div>

        {/* ===== 학생 전용 — 학습 요약 카드 4개 ===== */}
        {isStudent && dashboardSummary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <SummaryCard
              icon={<Clock className="w-5 h-5 text-blue-500" />}
              label="이번 주 학습"
              value={formatTime(dashboardSummary.thisWeekStudyTime)}
            />
            <SummaryCard
              icon={<AlarmClock className="w-5 h-5 text-orange-500" />}
              label="남은 과제"
              value={`${dashboardSummary.pendingAssignments}건`}
              accent={dashboardSummary.pendingAssignments > 0 ? "text-orange-600" : "text-slate-800"}
            />
            <SummaryCard
              icon={<Award className="w-5 h-5 text-emerald-500" />}
              label="평균 점수"
              value={`${dashboardSummary.averageScore}점`}
            />
            <SummaryCard
              icon={<Target className="w-5 h-5 text-violet-500" />}
              label="정답률"
              value={`${dashboardSummary.overallCorrectRate}%`}
            />
          </div>
        )}

        {/* ===== 학생 전용 — 곧 마감되는 과제 ===== */}
        {isStudent && upcoming.length > 0 && (
          <div className="bg-white border border-orange-100 rounded-[2rem] p-6 shadow-sm mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center">
                  <AlarmClock className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-800">곧 마감되는 과제</h2>
                  <p className="text-xs font-bold text-slate-400">
                    {upcoming.length}건이 마감을 앞두고 있어요
                  </p>
                </div>
              </div>
            </div>
            <ul className="space-y-2">
              {upcoming.map((a) => {
                const due = dueStatus(a.dueDate);
                return (
                  <li key={a.id}>
                    <Link
                      href={`/courses/${a.courseId}/assignments/${a.id}`}
                      className="flex items-center justify-between gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <ClipboardList className="w-4 h-4 text-slate-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-black text-slate-800 truncate">{a.title}</p>
                          <p className="text-[11px] font-bold text-slate-400 truncate">
                            {a.courseTitle} · 마감 {formatDueDateTime(a.dueDate)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {a.mySubmissionExists && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            제출
                          </span>
                        )}
                        <span
                          className={`text-[11px] font-black px-2.5 py-1 rounded-full ring-1 ${due.bgClass} ${due.textClass} ${due.ringClass}`}
                        >
                          {due.label}
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* ===== 히어로 + 스탯 카드 ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {/* Hero Card */}
          <div className="lg:col-span-2 bg-gradient-to-br from-indigo-50 to-blue-50/50 border border-indigo-100 rounded-[2rem] p-8 shadow-sm relative overflow-hidden flex flex-col justify-center">
            <div className="absolute right-0 bottom-0 w-48 h-48 translate-x-10 translate-y-10 bg-white/40 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between z-10 relative">
              <div className="max-w-sm">
                <span className="inline-flex px-3 py-1 bg-white border border-slate-200 rounded-full text-sm font-bold text-primary mb-4">
                  {isInstructor ? "빠른 관리" : "현재 목표"}
                </span>
                {recentCourse ? (
                  <>
                    <h2 className="text-2xl font-black mb-3">
                      {recentCourse.title} <br />
                      {isInstructor ? "관리하기" : "마스터하기"}
                    </h2>
                    <p className="text-slate-600 font-medium mb-6">
                      {isInstructor
                        ? "가장 최근에 개설한 강의입니다. 학생 현황과 공지사항을 확인하세요."
                        : `진도율이 ${recentCourse.isEnrolled ? (recentCourse.progress ?? 0) : 0}%에 도달했습니다! 꾸준히 학습 중이시네요.`}
                    </p>
                    <Link
                      href={isInstructor ? `/courses/${recentCourse.id}` : `/learn/${recentCourse.id}`}
                      className="inline-flex items-center text-primary font-bold hover:text-primary/80 transition-colors"
                    >
                      {isInstructor ? "강의 관리하기" : "이어서 학습하기"}
                      <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center ml-3 border border-slate-100">
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                    </Link>
                  </>
                ) : (
                  <>
                    <h2 className="text-2xl font-black mb-3">
                      {isInstructor ? "새로운 강의를 개설하세요" : "당신만의 AI 튜터를 만들어보세요"}
                    </h2>
                    <p className="text-slate-600 font-medium mb-6">
                      {isInstructor
                        ? "학생들을 위한 자료를 업로드하고 공유하세요."
                        : "자료를 업로드하면 자동으로 학습 코스가 구성됩니다."}
                    </p>
                    <Link
                      href="/courses/create"
                      className="inline-flex items-center text-primary font-bold hover:text-primary/80 transition-colors"
                    >
                      {isInstructor ? "새 강의 만들기" : "새 학습 시작하기"}
                      <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center ml-3 border border-slate-100">
                        <Plus className="w-4 h-4" />
                      </div>
                    </Link>
                  </>
                )}
              </div>
              <div className="hidden sm:block relative w-40 h-40">
                <Image
                  src="/images/mascot_reading.png"
                  alt="Mascot"
                  fill
                  sizes="160px"
                  className="object-contain animate-pulse-slow"
                  style={{ animationDuration: "6s" }}
                />
              </div>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="flex flex-col gap-6">
            <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm flex-1 flex flex-col justify-center relative overflow-hidden">
              {!isInstructor && isAnalysisLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              )}
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-500" />
                </div>
                <span className="text-sm font-bold text-green-500 bg-green-50 px-2 py-1 rounded-lg">업데이트 됨</span>
              </div>
              <h3 className="text-slate-500 font-bold text-sm mb-1">
                {isInstructor ? "전체 운영 강의 수" : "총 누적 학습 시간"}
              </h3>
              <div className="text-2xl font-black">
                {isInstructor ? `${courses.length}개` : formatTime(analysis?.totalStudyTime)}
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm flex-1 flex flex-col justify-center relative overflow-hidden">
              {!isInstructor && isAnalysisLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              )}
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-purple-500" />
                </div>
                <span className="text-sm font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
                  {isInstructor ? "활성 상태" : "분석 완료"}
                </span>
              </div>
              <h3 className="text-slate-500 font-bold text-sm mb-1">
                {isInstructor ? "현재 활성화된 강의" : "테스트 평균 점수"}
              </h3>
              <div className="text-2xl font-black">
                {isInstructor
                  ? `${courses.filter((c: any) => c.status === "ACTIVE").length}개`
                  : `${analysis?.overallScore || 0}점`}
              </div>
            </div>
          </div>
        </div>

        {/* ===== 최근 강의 섹션 ===== */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black">
            {isInstructor ? "최근 개설한 강의" : "최근 수강 강의"}
          </h2>
          <Link href="/courses" className="text-primary font-bold hover:underline">
            모두 보기
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full py-10 flex justify-center items-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {courses.slice(0, 2).map((course: any, idx: number) => {
                const colorTheme =
                  idx % 2 === 0
                    ? { bg: "bg-blue-500", text: "text-blue-600", lightBg: "bg-blue-100", grad: "from-blue-50 to-indigo-50" }
                    : { bg: "bg-pink-500", text: "text-pink-500", lightBg: "bg-purple-100", grad: "from-purple-50 to-pink-50" };
                return (
                  <Link
                    key={course.id}
                    href={isInstructor ? `/courses/${course.id}` : `/learn/${course.id}`}
                    className="group bg-white border border-slate-100 rounded-[2rem] overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all"
                  >
                    <div className={`h-40 bg-gradient-to-br ${colorTheme.grad} flex items-center justify-center p-6 relative overflow-hidden`}>
                      <div className="w-32 h-32 absolute -right-4 -bottom-4 bg-white/40 rounded-full blur-xl mix-blend-overlay" />
                      <BookOpen className={`w-16 h-16 ${colorTheme.text} opacity-20 group-hover:scale-110 transition-transform duration-500`} />
                    </div>
                    <div className="p-6">
                      <span className={`text-xs font-bold ${colorTheme.lightBg} ${colorTheme.text} px-3 py-1 rounded-full mb-3 inline-block`}>
                        {course.status === "ACTIVE" ? "진행 중" : "보관됨"}
                      </span>
                      <h3 className="font-bold text-xl mb-1 truncate text-slate-800">{course.title}</h3>
                      <p className="text-sm text-slate-500 mb-4 truncate font-medium">{course.description || "설명 없음"}</p>
                      {!isInstructor ? (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm font-bold">
                            <span className="text-slate-700">진도율</span>
                            <span className={colorTheme.text}>
                              {course.isEnrolled ? `${course.progress ?? 0}%` : "미수강"}
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                            <div
                              className={`${colorTheme.bg} h-2.5 rounded-full`}
                              style={{ width: `${course.isEnrolled ? (course.progress ?? 0) : 0}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className={`text-center text-xs font-bold ${colorTheme.text} ${colorTheme.lightBg} px-4 py-2 rounded-xl`}>
                          강의 관리하기 →
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
              {/* 새 강의 추가 카드 */}
              <Link
                href="/courses/create"
                className="group bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] overflow-hidden hover:bg-slate-100 hover:border-primary/50 transition-all flex flex-col items-center justify-center p-8 min-h-[300px]"
              >
                <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:scale-110 group-hover:text-primary transition-all mb-4">
                  <Plus className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-xl text-slate-600 group-hover:text-primary transition-colors">
                  {isInstructor ? "새로운 강의 개설" : "새로운 강의 추가"}
                </h3>
                <p className="text-sm text-slate-400 mt-2 font-medium text-center">
                  {isInstructor ? "강의 자료를 업로드하고\n학생들에게 공유하세요" : "PDF나 자료를 업로드하고\nAI 튜터를 생성하세요"}
                </p>
              </Link>
            </>
          )}
        </div>

        {/* ===== 학생 전용: 받은 피드백 섹션 ===== */}
        {isStudent && (
          <>
            <div className="flex items-center justify-between mb-6 mt-12">
              <h2 className="text-2xl font-black flex items-center">
                <MessageSquareText className="w-6 h-6 mr-2 text-primary" />
                받은 피드백
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {isFeedbacksLoading ? (
                <div className="col-span-full py-10 flex justify-center items-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : feedbacks.length === 0 ? (
                <div className="col-span-full py-12 flex flex-col items-center justify-center bg-slate-50 border border-slate-100 rounded-[2rem]">
                  <MessageSquareText className="w-12 h-12 text-slate-300 mb-3" />
                  <p className="text-slate-500 font-medium">아직 선생님으로부터 도착한 피드백이 없습니다.</p>
                </div>
              ) : (
                feedbacks.map((fb, idx) => (
                  <div key={idx} className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm relative">
                    {!fb.readByStudent && (
                      <span className="absolute top-6 right-6 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    )}
                    <h3 className="font-bold text-slate-800 mb-2 truncate pr-6">{fb.courseTitle}</h3>
                    <p className="text-sm font-medium text-slate-500 mb-4 truncate">{fb.instructorName} 선생님</p>
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-slate-700 font-medium whitespace-pre-wrap text-sm leading-relaxed max-h-32 overflow-y-auto">
                      {fb.content}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-black text-slate-400 uppercase tracking-wider">{label}</p>
        {icon}
      </div>
      <p className={`text-2xl font-black ${accent ?? "text-slate-800"}`}>{value}</p>
    </div>
  );
}
