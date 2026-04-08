"use client";
import React, { use, useMemo } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import { useQuery } from "@tanstack/react-query";
import { getStudentDetail } from "@/lib/api/analysis";
import { useAuthStore } from "@/lib/store/useAuthStore";
import {
  ArrowLeft,
  Loader2,
  Award,
  Target,
  Clock,
  ListChecks,
  AlertTriangle,
  TrendingUp,
  Mail,
  Calendar,
} from "lucide-react";
import type { StudentStatus } from "@/types/analysis";

const AnalysisLineChart = dynamic(
  () =>
    import("@/components/domain/analysis/AnalysisCharts").then((m) => ({
      default: m.AnalysisLineChart,
    })),
  { ssr: false }
);
const AnalysisRadarChart = dynamic(
  () =>
    import("@/components/domain/analysis/AnalysisCharts").then((m) => ({
      default: m.AnalysisRadarChart,
    })),
  { ssr: false }
);

const STATUS_META: Record<
  StudentStatus,
  { label: string; bg: string; text: string; ring: string }
> = {
  EXCELLENT: { label: "우수", bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200" },
  GOOD: { label: "양호", bg: "bg-blue-50", text: "text-blue-700", ring: "ring-blue-200" },
  AVERAGE: { label: "보통", bg: "bg-slate-50", text: "text-slate-600", ring: "ring-slate-200" },
  NEEDS_HELP: { label: "도움필요", bg: "bg-rose-50", text: "text-rose-700", ring: "ring-rose-200" },
};

function formatIsoWeekLabel(weekStr: string): string {
  const match = /^(\d{4})-W(\d{1,2})$/.exec(weekStr);
  if (!match) return weekStr;
  const year = Number(match[1]);
  const week = Number(match[2]);
  const jan4 = new Date(year, 0, 4);
  const jan4Day = jan4.getDay() || 7;
  const week1Monday = new Date(jan4);
  week1Monday.setDate(jan4.getDate() - jan4Day + 1);
  const target = new Date(week1Monday);
  target.setDate(week1Monday.getDate() + (week - 1) * 7);
  const month = target.getMonth() + 1;
  const firstOfMonth = new Date(target.getFullYear(), target.getMonth(), 1);
  const firstMonOffset = (8 - (firstOfMonth.getDay() || 7)) % 7;
  const firstMon = new Date(firstOfMonth);
  firstMon.setDate(1 + firstMonOffset);
  const weekOfMonth = Math.floor((target.getDate() - firstMon.getDate()) / 7) + 1;
  return `${month}월 ${weekOfMonth}주`;
}

function formatStudyTime(seconds: number): string {
  const minutes = Math.floor((seconds ?? 0) / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}시간 ${minutes % 60}분`;
  return `${minutes}분`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "활동 없음";
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate()
  ).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
}

export default function StudentDetailPage({
  params,
}: {
  params: Promise<{ courseId: string; userId: string }>;
}) {
  const resolvedParams = use(params);
  const courseId = Number(resolvedParams.courseId);
  const userId = Number(resolvedParams.userId);
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isInstructor = user?.role === "INSTRUCTOR";

  const { data, isLoading } = useQuery({
    queryKey: ["studentDetail", courseId, userId],
    queryFn: () => getStudentDetail(courseId, userId),
    enabled: isInstructor,
  });

  const lineData = useMemo(() => {
    if (!data?.weeklyProgress) return [];
    return data.weeklyProgress.map((w) => ({
      name: formatIsoWeekLabel(w.week),
      score: w.quizScore ?? 0,
    }));
  }, [data]);

  const radarData = useMemo(() => {
    if (!data?.competencies) return [];
    return Object.entries(data.competencies).map(([subject, value]) => ({
      subject,
      A: value,
      fullMark: 150,
    }));
  }, [data]);

  if (!isInstructor) {
    return (
      <MainLayout>
        <div className="py-20 text-center text-slate-500 font-medium">
          교강사만 접근할 수 있는 페이지입니다.
        </div>
      </MainLayout>
    );
  }

  if (isLoading || !data) {
    return (
      <MainLayout>
        <div className="py-32 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
          <p className="text-slate-500 font-medium">학생 정보를 불러오는 중...</p>
        </div>
      </MainLayout>
    );
  }

  const meta = STATUS_META[data.status];

  return (
    <MainLayout>
      <div className="w-full py-8">
        {/* 상단 네비 */}
        <button
          type="button"
          onClick={() => router.push(`/courses/${courseId}/students`)}
          className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          수강생 목록으로
        </button>

        {/* 학생 헤더 카드 */}
        <div className="bg-gradient-to-br from-blue-50 via-violet-50/40 to-white border border-blue-100 rounded-3xl p-6 md:p-8 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center gap-5">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-black text-3xl shrink-0">
              {data.userName?.charAt(0) || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1.5">
                <h1 className="text-2xl md:text-3xl font-black text-slate-800">{data.userName}</h1>
                <span
                  className={`text-xs font-black px-3 py-1 rounded-full ${meta.bg} ${meta.text} ring-1 ${meta.ring}`}
                >
                  {meta.label}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm font-medium text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> {data.userEmail}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> 마지막 활동 {formatDate(data.lastActiveAt)}
                </span>
                {data.courseTitle && (
                  <span className="text-blue-600 font-bold">{data.courseTitle}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 핵심 지표 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <MetricCard
            icon={<Award className="w-5 h-5 text-blue-500" />}
            label="종합 점수"
            value={`${data.overallScore ?? 0}점`}
          />
          <MetricCard
            icon={<Target className="w-5 h-5 text-emerald-500" />}
            label="정답률"
            value={`${Math.round((data.overallCorrectRate ?? 0) * 100)}%`}
          />
          <MetricCard
            icon={<ListChecks className="w-5 h-5 text-violet-500" />}
            label="퀴즈 시도"
            value={`${data.totalQuizAttempts ?? 0}회`}
          />
          <MetricCard
            icon={<Clock className="w-5 h-5 text-amber-500" />}
            label="누적 학습시간"
            value={formatStudyTime(data.totalStudyTime ?? 0)}
          />
        </div>

        {/* 차트 영역 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* 주차별 점수 추이 */}
          <div className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <h2 className="text-base font-black text-slate-800">주차별 점수 추이</h2>
              </div>
            </div>
            {lineData.length > 0 ? (
              <div className="h-72">
                <AnalysisLineChart data={lineData} />
              </div>
            ) : (
              <EmptyChart message="아직 주차별 활동 데이터가 없습니다." />
            )}
          </div>

          {/* 역량 레이더 */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <h2 className="text-base font-black text-slate-800 mb-5">학습 역량</h2>
            {radarData.length > 0 ? (
              <div className="h-72">
                <AnalysisRadarChart data={radarData} />
              </div>
            ) : (
              <EmptyChart message="역량 데이터가 부족합니다." />
            )}
          </div>
        </div>

        {/* 약점 개념 */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm mb-6">
          <div className="flex items-center gap-2 mb-5">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <h2 className="text-base font-black text-slate-800">약점 개념</h2>
          </div>
          {data.weakConcepts && data.weakConcepts.length > 0 ? (
            <ul className="space-y-3">
              {data.weakConcepts.map((wc, i) => {
                const rate = Math.round((wc.correctRate ?? 0) * 100);
                return (
                  <li key={i} className="bg-slate-50 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-rose-100 text-rose-600 text-xs font-black flex items-center justify-center shrink-0">
                          {i + 1}
                        </span>
                        <p className="text-sm font-black text-slate-700 truncate">
                          {wc.concept}
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className="text-sm font-black text-rose-600">{rate}%</p>
                        <p className="text-[10px] font-bold text-slate-400">
                          {wc.attemptCount}회 시도
                        </p>
                      </div>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-rose-400 to-rose-500"
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-slate-400 font-medium text-sm py-6 text-center">
              아직 충분한 데이터가 없습니다.
            </p>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-black text-slate-400 uppercase tracking-wider">{label}</p>
        {icon}
      </div>
      <p className="text-2xl font-black text-slate-800">{value}</p>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-56 flex items-center justify-center text-slate-400 font-medium text-sm">
      {message}
    </div>
  );
}
