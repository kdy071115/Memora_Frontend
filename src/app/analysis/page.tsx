"use client";
import React, { useMemo, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import dynamic from "next/dynamic";
import { Target, TrendingUp, AlertTriangle, Loader2, ChevronDown, Clock, BookOpen } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getAnalysis, getCourseOverview } from "@/lib/api/analysis";
import { getCourses } from "@/lib/api/courses";
import { useAuthStore } from "@/lib/store/useAuthStore";

const AnalysisLineChart = dynamic(
  () => import("@/components/domain/analysis/AnalysisCharts").then((m) => ({ default: m.AnalysisLineChart })),
  { ssr: false, loading: () => <div className="w-full h-full flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div> }
);
const AnalysisRadarChart = dynamic(
  () => import("@/components/domain/analysis/AnalysisCharts").then((m) => ({ default: m.AnalysisRadarChart })),
  { ssr: false, loading: () => <div className="w-full h-full flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div> }
);

export default function AnalysisPage() {
  const user = useAuthStore((state) => state.user);
  const isInstructor = user?.role === "INSTRUCTOR";

  // 교강사 - 강의 선택 상태
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);

  // 학생 분석 데이터
  const { data: analysis, isLoading: isStudentLoading } = useQuery({
    queryKey: ["analysis"],
    queryFn: getAnalysis,
    enabled: !isInstructor,
  });

  // 교강사 - 강의 목록
  const { data: courses = [], isLoading: isCoursesLoading } = useQuery({
    queryKey: ["courses"],
    queryFn: getCourses,
    enabled: isInstructor,
  });

  const targetCourseId = selectedCourseId ?? courses[0]?.id ?? null;

  // 교강사 - 선택된 강의 개요
  const { data: courseOverview, isLoading: isOverviewLoading } = useQuery({
    queryKey: ["courseOverview", targetCourseId],
    queryFn: () => getCourseOverview(targetCourseId!),
    enabled: isInstructor && !!targetCourseId,
  });

  const isLoading = isInstructor
    ? isCoursesLoading || isOverviewLoading
    : isStudentLoading;

  // "2026-W14" 같은 ISO week 문자열을 "4/1주" 처럼 한국 사용자가 읽기 쉬운 라벨로 변환
  const formatIsoWeekLabel = (weekStr: string): string => {
    const match = /^(\d{4})-W(\d{1,2})$/.exec(weekStr);
    if (!match) return weekStr;
    const year = Number(match[1]);
    const week = Number(match[2]);

    // ISO 8601: 1월 4일은 항상 1주차에 속한다 → 그 주의 월요일이 1주차 월요일
    const jan4 = new Date(year, 0, 4);
    const jan4Day = jan4.getDay() || 7; // 1=월 ~ 7=일
    const week1Monday = new Date(jan4);
    week1Monday.setDate(jan4.getDate() - jan4Day + 1);

    const target = new Date(week1Monday);
    target.setDate(week1Monday.getDate() + (week - 1) * 7);

    const month = target.getMonth() + 1;
    // 해당 월의 몇 번째 주인지 계산 (월요일 기준)
    const firstOfMonth = new Date(target.getFullYear(), target.getMonth(), 1);
    const firstMonOffset = ((8 - (firstOfMonth.getDay() || 7)) % 7);
    const firstMon = new Date(firstOfMonth);
    firstMon.setDate(1 + firstMonOffset);
    const weekOfMonth = Math.floor((target.getDate() - firstMon.getDate()) / 7) + 1;

    return `${month}월 ${weekOfMonth}주`;
  };

  // ===== 데이터 가공 =====
  const studentLineData = useMemo(() => {
    if (!analysis?.weeklyProgress) return [];
    return analysis.weeklyProgress.map((w) => ({ name: formatIsoWeekLabel(w.week), score: w.quizScore || 0 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysis]);

  const studentRadarData = useMemo(() => {
    if (!analysis?.weakConcepts) return [];
    return analysis.weakConcepts.map((wc) => ({
      subject: wc.concept,
      A: Math.round(wc.correctRate * 100),
      fullMark: 100,
    }));
  }, [analysis]);

  const instructorLineData = useMemo(() => {
    if (!courseOverview?.weeklyProgress) return [];
    return courseOverview.weeklyProgress.map((w) => ({ name: formatIsoWeekLabel(w.week), score: w.quizScore || 0 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseOverview]);

  const instructorRadarData = useMemo(() => {
    if (!courseOverview?.topWeakConcepts) return [];
    return courseOverview.topWeakConcepts.map((wc) => ({
      subject: wc.concept,
      A: Math.round(wc.correctRate * 100),
      fullMark: 100,
    }));
  }, [courseOverview]);

  const getGrade = (score?: number) => {
    if (!score) return { grade: "N/A", label: "분석 중", color: "text-slate-400" };
    if (score >= 95) return { grade: "A+", label: "최상위권", color: "text-blue-600" };
    if (score >= 90) return { grade: "A0", label: "상위 10%", color: "text-blue-500" };
    if (score >= 85) return { grade: "B+", label: "상위 30%", color: "text-emerald-600" };
    if (score >= 80) return { grade: "B0", label: "평균 이상", color: "text-emerald-500" };
    if (score >= 70) return { grade: "C+", label: "평균 수준", color: "text-amber-500" };
    return { grade: "C0", label: "노력 필요", color: "text-red-500" };
  };

  const achievement = getGrade(
    isInstructor ? courseOverview?.averageScore : analysis?.overallScore
  );

  const formatTime = (seconds?: number) => {
    if (!seconds) return "0시간 0분";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}시간 ${m}분`;
  };

  // 로딩
  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex flex-col w-full h-[60vh] items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
          <p className="text-slate-500 font-medium">AI가 학습 데이터를 분석하는 중입니다...</p>
        </div>
      </MainLayout>
    );
  }

  // 교강사 - 강의 없음
  if (isInstructor && courses.length === 0) {
    return (
      <MainLayout>
        <div className="flex flex-col w-full h-[60vh] items-center justify-center gap-4">
          <BookOpen className="w-16 h-16 text-slate-200" />
          <p className="text-slate-700 font-bold text-xl">운영 중인 강의가 없습니다</p>
          <p className="text-slate-500 font-medium">강의를 먼저 개설하면 학반 통계를 확인할 수 있습니다.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex flex-col w-full py-8 text-slate-800 max-w-screen-xl mx-auto">

        {/* ===== 헤더 ===== */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">
              {isInstructor ? "학급 통계 대시보드 📊" : "학습 분석 대시보드 📊"}
            </h1>
            <p className="text-slate-500 font-medium text-lg">
              {isInstructor
                ? "우리 반 학생들의 학습 상태와 취약 개념을 모니터링하세요."
                : "AI가 분석한 나의 학습 패턴과 취약점을 확인하고 전략을 수정하세요."}
            </p>
          </div>

          {/* 교강사 - 강의 선택 드롭다운 */}
          {isInstructor && courses.length > 0 && (
            <div className="relative shrink-0">
              <select
                value={targetCourseId ?? ""}
                onChange={(e) => setSelectedCourseId(Number(e.target.value))}
                className="h-12 pl-5 pr-10 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary appearance-none cursor-pointer min-w-[200px]"
              >
                {courses.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}
        </div>

        {/* ===== 상단 통계 카드 3개 ===== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* 카드 1: 성취도 / 학급 평균 */}
          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm flex flex-col justify-between">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-6">
              <Target className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-slate-500 font-bold text-sm mb-1">
                {isInstructor ? "학급 평균 성취도" : "나의 성취도"}
              </p>
              <div className={`text-4xl font-black flex items-end ${achievement.color}`}>
                {achievement.grade}
                <span className="text-lg text-slate-400 font-medium ml-2 mb-1">{achievement.label}</span>
              </div>
              {!isInstructor && (
                <p className="text-xs text-slate-400 font-medium mt-2">
                  총점 {analysis?.overallScore || 0}점 기준
                </p>
              )}
            </div>
          </div>

          {/* 카드 2: 정답률 / 총 수강생 */}
          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm flex flex-col justify-between">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mb-6">
              <TrendingUp className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-slate-500 font-bold text-sm mb-1">
                {isInstructor ? "총 수강생" : "누적 학습 시간"}
              </p>
              <div className="text-2xl font-black text-slate-800 leading-tight">
                {isInstructor
                  ? (
                    <>
                      <span className="text-3xl">{courseOverview?.totalStudents || 0}</span>
                      <span className="text-base font-bold text-slate-500 ml-1">명</span>
                      <span className="block text-sm font-medium text-emerald-500 mt-1">
                        활성 학생 {courseOverview?.activeStudents || 0}명
                      </span>
                    </>
                  )
                  : (
                    <>
                      <span className="text-2xl">{formatTime(analysis?.totalStudyTime)}</span>
                      <span className="block text-sm font-medium text-emerald-500 mt-1">
                        정답률 {Math.round((analysis?.overallCorrectRate || 0) * 100)}%
                      </span>
                    </>
                  )}
              </div>
            </div>
          </div>

          {/* 카드 3: 취약점 */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50/20 border border-orange-200 rounded-[2.5rem] p-8 shadow-sm flex flex-col justify-between">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mb-6 shadow-sm">
              <AlertTriangle className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-orange-700 font-bold text-sm mb-1">
                {isInstructor ? "가장 취약한 개념" : "AI 맞춤 처방"}
              </p>
              <div className="text-lg font-black text-orange-950 leading-tight">
                {isInstructor
                  ? courseOverview?.topWeakConcepts?.[0]?.concept ?? "데이터가 부족합니다."
                  : analysis?.recommendations?.[0] ?? "데이터가 부족합니다."}
              </div>
            </div>
          </div>
        </div>

        {/* ===== 차트 영역 ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 선 그래프 */}
          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
            <h3 className="text-xl font-bold mb-2 text-slate-800">
              {isInstructor ? "주차별 학급 평균 점수 추이" : "최근 5주간 내 점수 추이"}
            </h3>
            <p className="text-sm font-medium text-slate-500 mb-6">
              {isInstructor ? "강의 전체 학생의 주간 퀴즈 평균 점수입니다." : "퀴즈 점수 변화를 확인하세요."}
            </p>
            <div className="w-full h-80">
              {(isInstructor ? instructorLineData : studentLineData).length === 0 ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                  <Clock className="w-10 h-10 mb-2 opacity-30" />
                  <p className="font-medium text-sm">아직 충분한 데이터가 없습니다.</p>
                </div>
              ) : (
                <AnalysisLineChart data={isInstructor ? instructorLineData : studentLineData} />
              )}
            </div>
          </div>

          {/* 레이더 차트 */}
          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
            <h3 className="text-xl font-bold mb-2 text-slate-800">
              {isInstructor ? "학급 전체 취약 개념 정답률" : "나의 취약 개념 정답률 (%)"}
            </h3>
            <p className="text-sm font-medium text-slate-500 mb-6">
              AI가 진단한 부족한 개념들을 파악하세요 (100%에 가까울수록 우수)
            </p>
            <div className="w-full h-72">
              {(isInstructor ? instructorRadarData : studentRadarData).length === 0 ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                  <Target className="w-10 h-10 mb-2 opacity-30" />
                  <p className="font-medium text-sm">퀴즈를 더 풀면 분석 데이터가 쌓입니다.</p>
                </div>
              ) : (
                <AnalysisRadarChart data={isInstructor ? instructorRadarData : studentRadarData} />
              )}
            </div>
          </div>
        </div>

        {/* ===== 교강사 전용: 취약 개념 순위 테이블 ===== */}
        {isInstructor && courseOverview?.topWeakConcepts && courseOverview.topWeakConcepts.length > 0 && (
          <div className="mt-6 bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
            <h3 className="text-xl font-bold mb-6 text-slate-800">🔍 취약 개념 순위</h3>
            <div className="space-y-3">
              {courseOverview.topWeakConcepts.map((wc, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${
                    idx === 0 ? "bg-red-100 text-red-600" :
                    idx === 1 ? "bg-orange-100 text-orange-600" :
                    idx === 2 ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500"
                  }`}>{idx + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-bold text-slate-700">{wc.concept}</span>
                      <span className="text-sm font-bold text-slate-500">{Math.round(wc.correctRate * 100)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${Math.round(wc.correctRate * 100) >= 70 ? "bg-emerald-400" : "bg-red-400"}`}
                        style={{ width: `${Math.round(wc.correctRate * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== 학생 전용: AI 추천 학습 처방 ===== */}
        {!isInstructor && analysis?.recommendations && analysis.recommendations.length > 0 && (
          <div className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-[2.5rem] p-8 shadow-sm">
            <h3 className="text-xl font-bold mb-6 text-slate-800">💡 AI 맞춤 학습 처방</h3>
            <ul className="space-y-3">
              {analysis.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-3 bg-white rounded-2xl p-4 shadow-sm">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="text-slate-700 font-medium text-sm leading-relaxed">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
