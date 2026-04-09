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
import { getMyDailyMissions, type DailyMission } from "@/lib/api/aiCoach";
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

  // 데일리 미션 — 5분간 staleTime 으로 부담 줄임
  const { data: dailyMissions, isLoading: isMissionsLoading } = useQuery({
    queryKey: ["myDailyMissions"],
    queryFn: getMyDailyMissions,
    enabled: isStudent,
    staleTime: 5 * 60 * 1000,
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
      <div className="flex flex-col w-full py-8 text-foreground">
        {/* ===== 헤더 ===== */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">
              환영합니다, {user?.name || "사용자"}님! ✨
            </h1>
            <p className="text-muted-foreground font-medium text-lg">
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
              accent={dashboardSummary.pendingAssignments > 0 ? "text-orange-600" : "text-foreground"}
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

        {/* ===== 학생 전용 — AI 데일리 미션 ===== */}
        {isStudent && (isMissionsLoading || dailyMissions) && (
          <DailyMissionsWidget
            data={dailyMissions ?? null}
            loading={isMissionsLoading}
          />
        )}

        {/* ===== 학생 전용 — 곧 마감되는 과제 ===== */}
        {isStudent && upcoming.length > 0 && (
          <div className="bg-card border border-orange-500/20 rounded-[2rem] p-6 shadow-sm mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-500/10 flex items-center justify-center">
                  <AlarmClock className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <h2 className="text-base font-black text-foreground">곧 마감되는 과제</h2>
                  <p className="text-xs font-bold text-muted-foreground">
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
                      className="flex items-center justify-between gap-3 p-3 bg-muted hover:bg-muted rounded-2xl transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <ClipboardList className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-black text-foreground truncate">{a.title}</p>
                          <p className="text-[11px] font-bold text-muted-foreground truncate">
                            {a.courseTitle} · 마감 {formatDueDateTime(a.dueDate)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {a.mySubmissionExists && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/30 flex items-center gap-1">
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
          <div className="lg:col-span-2 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 border border-indigo-500/20 rounded-[2rem] p-8 shadow-sm relative overflow-hidden flex flex-col justify-center">
            <div className="absolute right-0 bottom-0 w-48 h-48 translate-x-10 translate-y-10 bg-card/40 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between z-10 relative">
              <div className="max-w-sm">
                <span className="inline-flex px-3 py-1 bg-card border border-border rounded-full text-sm font-bold text-primary mb-4">
                  {isInstructor ? "빠른 관리" : "현재 목표"}
                </span>
                {recentCourse ? (
                  <>
                    <h2 className="text-2xl font-black mb-3">
                      {recentCourse.title} <br />
                      {isInstructor ? "관리하기" : "마스터하기"}
                    </h2>
                    <p className="text-muted-foreground font-medium mb-6">
                      {isInstructor
                        ? "가장 최근에 개설한 강의입니다. 학생 현황과 공지사항을 확인하세요."
                        : `진도율이 ${recentCourse.isEnrolled ? (recentCourse.progress ?? 0) : 0}%에 도달했습니다! 꾸준히 학습 중이시네요.`}
                    </p>
                    <Link
                      href={isInstructor ? `/courses/${recentCourse.id}` : `/learn/${recentCourse.id}`}
                      className="inline-flex items-center text-primary font-bold hover:text-primary/80 transition-colors"
                    >
                      {isInstructor ? "강의 관리하기" : "이어서 학습하기"}
                      <div className="w-8 h-8 rounded-full bg-card shadow-sm flex items-center justify-center ml-3 border border-border">
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                    </Link>
                  </>
                ) : (
                  <>
                    <h2 className="text-2xl font-black mb-3">
                      {isInstructor ? "새로운 강의를 개설하세요" : "당신만의 AI 튜터를 만들어보세요"}
                    </h2>
                    <p className="text-muted-foreground font-medium mb-6">
                      {isInstructor
                        ? "학생들을 위한 자료를 업로드하고 공유하세요."
                        : "자료를 업로드하면 자동으로 학습 코스가 구성됩니다."}
                    </p>
                    <Link
                      href="/courses/create"
                      className="inline-flex items-center text-primary font-bold hover:text-primary/80 transition-colors"
                    >
                      {isInstructor ? "새 강의 만들기" : "새 학습 시작하기"}
                      <div className="w-8 h-8 rounded-full bg-card shadow-sm flex items-center justify-center ml-3 border border-border">
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
            <div className="bg-card border border-border rounded-[2rem] p-6 shadow-sm flex-1 flex flex-col justify-center relative overflow-hidden">
              {!isInstructor && isAnalysisLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-card/50 backdrop-blur-sm z-10">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              )}
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-500" />
                </div>
                <span className="text-sm font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-lg">업데이트 됨</span>
              </div>
              <h3 className="text-muted-foreground font-bold text-sm mb-1">
                {isInstructor ? "전체 운영 강의 수" : "총 누적 학습 시간"}
              </h3>
              <div className="text-2xl font-black">
                {isInstructor ? `${courses.length}개` : formatTime(analysis?.totalStudyTime)}
              </div>
            </div>

            <div className="bg-card border border-border rounded-[2rem] p-6 shadow-sm flex-1 flex flex-col justify-center relative overflow-hidden">
              {!isInstructor && isAnalysisLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-card/50 backdrop-blur-sm z-10">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              )}
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-purple-500" />
                </div>
                <span className="text-sm font-bold text-muted-foreground bg-muted px-2 py-1 rounded-lg">
                  {isInstructor ? "활성 상태" : "분석 완료"}
                </span>
              </div>
              <h3 className="text-muted-foreground font-bold text-sm mb-1">
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
                    ? { bg: "bg-blue-500", text: "text-blue-600", lightBg: "bg-blue-500/15", grad: "from-blue-500/10 to-indigo-500/10" }
                    : { bg: "bg-pink-500", text: "text-pink-500", lightBg: "bg-purple-500/15", grad: "from-purple-500/10 to-pink-500/10" };
                return (
                  <Link
                    key={course.id}
                    href={isInstructor ? `/courses/${course.id}` : `/learn/${course.id}`}
                    className="group bg-card border border-border rounded-[2rem] overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all"
                  >
                    <div className={`h-40 bg-gradient-to-br ${colorTheme.grad} flex items-center justify-center p-6 relative overflow-hidden`}>
                      <div className="w-32 h-32 absolute -right-4 -bottom-4 bg-card/40 rounded-full blur-xl mix-blend-overlay" />
                      <BookOpen className={`w-16 h-16 ${colorTheme.text} opacity-20 group-hover:scale-110 transition-transform duration-500`} />
                    </div>
                    <div className="p-6">
                      <span className={`text-xs font-bold ${colorTheme.lightBg} ${colorTheme.text} px-3 py-1 rounded-full mb-3 inline-block`}>
                        {course.status === "ACTIVE" ? "진행 중" : "보관됨"}
                      </span>
                      <h3 className="font-bold text-xl mb-1 truncate text-foreground">{course.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4 truncate font-medium">{course.description || "설명 없음"}</p>
                      {!isInstructor ? (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm font-bold">
                            <span className="text-foreground">진도율</span>
                            <span className={colorTheme.text}>
                              {course.isEnrolled ? `${course.progress ?? 0}%` : "미수강"}
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
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
                className="group bg-muted border-2 border-dashed border-border rounded-[2rem] overflow-hidden hover:bg-muted hover:border-primary/50 transition-all flex flex-col items-center justify-center p-8 min-h-[300px]"
              >
                <div className="w-16 h-16 rounded-full bg-card shadow-sm flex items-center justify-center text-muted-foreground group-hover:scale-110 group-hover:text-primary transition-all mb-4">
                  <Plus className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-xl text-muted-foreground group-hover:text-primary transition-colors">
                  {isInstructor ? "새로운 강의 개설" : "새로운 강의 추가"}
                </h3>
                <p className="text-sm text-muted-foreground mt-2 font-medium text-center">
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
                <div className="col-span-full py-12 flex flex-col items-center justify-center bg-muted border border-border rounded-[2rem]">
                  <MessageSquareText className="w-12 h-12 text-muted-foreground/60 mb-3" />
                  <p className="text-muted-foreground font-medium">아직 선생님으로부터 도착한 피드백이 없습니다.</p>
                </div>
              ) : (
                feedbacks.map((fb, idx) => (
                  <div key={idx} className="bg-card border border-border rounded-[2rem] p-6 shadow-sm relative">
                    {!fb.readByStudent && (
                      <span className="absolute top-6 right-6 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    )}
                    <h3 className="font-bold text-foreground mb-2 truncate pr-6">{fb.courseTitle}</h3>
                    <p className="text-sm font-medium text-muted-foreground mb-4 truncate">{fb.instructorName} 선생님</p>
                    <div className="bg-muted border border-border p-4 rounded-xl text-foreground font-medium whitespace-pre-wrap text-sm leading-relaxed max-h-32 overflow-y-auto">
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
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-black text-muted-foreground uppercase tracking-wider">{label}</p>
        {icon}
      </div>
      <p className={`text-2xl font-black ${accent ?? "text-foreground"}`}>{value}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// 학생 — AI 데일리 미션 위젯
// ─────────────────────────────────────────────────────────────────
const MISSION_TYPE_META: Record<string, { label: string; icon: string; color: string }> = {
  READ: { label: "읽기", icon: "📖", color: "bg-blue-500/15 text-blue-700" },
  QUIZ: { label: "퀴즈", icon: "❓", color: "bg-orange-500/15 text-orange-700" },
  SELF_EXPLAIN: { label: "자기 설명", icon: "💭", color: "bg-violet-500/15 text-violet-700" },
  SUBMIT: { label: "과제 제출", icon: "📝", color: "bg-emerald-500/15 text-emerald-700" },
  REVIEW: { label: "회고", icon: "🌱", color: "bg-amber-500/15 text-amber-700" },
};

function DailyMissionsWidget({
  data,
  loading,
}: {
  data: { summary: string; motivation: string; missions: DailyMission[] } | null;
  loading: boolean;
}) {
  return (
    <div className="bg-gradient-to-br from-violet-500/10 to-blue-500/10 border border-violet-500/20 rounded-[2rem] p-6 mb-8 shadow-sm">
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-violet-500/15 flex items-center justify-center shrink-0">
            <span className="text-xl">✨</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black text-violet-600">AI 학습 코치</p>
            <p className="text-base font-black text-foreground truncate">
              {data?.summary || "오늘의 학습 미션"}
            </p>
          </div>
        </div>
      </div>

      {loading || !data ? (
        <div className="py-10 flex flex-col items-center text-center">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin mb-3" />
          <p className="text-xs font-bold text-muted-foreground">
            AI 가 오늘의 미션을 큐레이션 중이에요...
          </p>
        </div>
      ) : (
        <>
          <ul className="space-y-2">
            {data.missions.map((m, i) => {
              const meta = MISSION_TYPE_META[m.type] || MISSION_TYPE_META.REVIEW;
              return (
                <li
                  key={i}
                  className="bg-card border border-border rounded-2xl p-4 flex items-start gap-3"
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base ${meta.color}`}
                  >
                    {meta.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-sm font-black text-foreground">{m.title}</p>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {m.estimatedMinutes}분
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium leading-relaxed mb-1">
                      {m.description}
                    </p>
                    {m.why && (
                      <p className="text-[11px] text-violet-600 font-bold">💡 {m.why}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          {data.motivation && (
            <p className="text-xs font-bold text-violet-700 mt-4 text-center">
              {data.motivation}
            </p>
          )}
        </>
      )}
    </div>
  );
}
