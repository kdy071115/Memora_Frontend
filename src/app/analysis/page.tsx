"use client";
import React, { useMemo } from "react";
import MainLayout from "@/components/layout/MainLayout";
import dynamic from "next/dynamic";
import { Target, TrendingUp, AlertTriangle, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getAnalysis } from "@/lib/api/analysis";

// SSR 문제를 피하기 위해 차트는 반드시 클라이언트에서만 렌더하도록 dynamic import 적용
const AnalysisLineChart = dynamic(
  () => import("@/components/domain/analysis/AnalysisCharts").then((m) => ({ default: m.AnalysisLineChart })),
  { ssr: false, loading: () => <div className="w-full h-full flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div> }
);
const AnalysisRadarChart = dynamic(
  () => import("@/components/domain/analysis/AnalysisCharts").then((m) => ({ default: m.AnalysisRadarChart })),
  { ssr: false, loading: () => <div className="w-full h-full flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div> }
);

export default function AnalysisPage() {
  const { data: analysis, isLoading } = useQuery({
    queryKey: ['analysis'],
    queryFn: getAnalysis,
  });

  // 꺾은선 차트 (Line Chart) 데이터 가공
  const lineData = useMemo(() => {
    if (!analysis?.weeklyProgress) return [];
    return analysis.weeklyProgress.map(w => ({
      name: w.week,
      score: w.quizScore
    }));
  }, [analysis]);

  // 방사형 차트 (Radar Chart) 역량 데이터 가공
  const radarData = useMemo(() => {
    if (!analysis?.competencies) return [];
    return Object.entries(analysis.competencies).map(([subject, value]) => ({
      subject,
      A: value,
      fullMark: 150
    }));
  }, [analysis]);

  const getGrade = (score?: number) => {
    if (!score) return { grade: "N/A", label: "분석 중" };
    if (score >= 95) return { grade: "A+", label: "최상위권" };
    if (score >= 90) return { grade: "A0", label: "상위 10%" };
    if (score >= 85) return { grade: "B+", label: "상위 30%" };
    if (score >= 80) return { grade: "B0", label: "평균 이상" };
    if (score >= 70) return { grade: "C+", label: "평균 수준" };
    return { grade: "C0", label: "노력 필요" };
  };

  const achievement = getGrade(analysis?.overallScore);

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

  return (
    <MainLayout>
      <div className="flex flex-col w-full py-8 text-slate-800 max-w-screen-xl mx-auto">
        
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">학습 분석 대시보드 📊</h1>
          <p className="text-slate-500 font-medium text-lg">AI가 분석한 나의 학습 패턴과 취약점을 확인하고 전략을 수정하세요.</p>
        </div>

        {/* 3 Top Highlight Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
           <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm flex flex-col justify-between">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-6">
                <Target className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-slate-500 font-bold mb-1">예측 최종 성취도</p>
                <div className="text-4xl font-black text-slate-800 flex items-end">
                  {achievement.grade} <span className="text-lg text-slate-400 font-medium ml-2 mb-1">{achievement.label}</span>
                </div>
              </div>
           </div>

           <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm flex flex-col justify-between">
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-slate-500 font-bold mb-1">추천 성장 지표</p>
                <div className="text-2xl font-black text-slate-800 leading-tight">
                  {analysis?.maxGrowthIndicator || "충분한 누적 데이터가 필요해요"}
                </div>
              </div>
           </div>

           <div className="bg-white border border-orange-200 rounded-[2.5rem] p-8 shadow-[0_10px_40px_-15px_rgba(249,115,22,0.15)] flex flex-col justify-between bg-gradient-to-br from-orange-50 to-amber-50/20">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mb-6 shadow-sm">
                <AlertTriangle className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="text-orange-700 font-bold mb-1">AI 맞춤 처방</p>
                <div className="text-lg font-black text-orange-950 leading-tight">
                  {analysis?.recommendations && analysis.recommendations.length > 0 
                    ? analysis.recommendations[0] 
                    : "아직 취합된 맞춤 처방 데이터가 없습니다."}
                </div>
              </div>
           </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           
           {/* Line Chart */}
           <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
              <h3 className="text-xl font-bold mb-6 text-slate-800">최근 5주간 성취도 추이</h3>
               <div className="w-full h-80">
                  <AnalysisLineChart data={lineData} />
               </div>
            </div>

           {/* Radar Chart */}
           <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
              <h3 className="text-xl font-bold mb-2 text-slate-800">학습 역량 헥사곤 분석</h3>
              <p className="text-sm font-medium text-slate-500 mb-6">AI가 진단한 6가지 다각형 역량 밸런스</p>
               <div className="w-full h-72">
                  <AnalysisRadarChart data={radarData} />
               </div>
            </div>

        </div>
      </div>
    </MainLayout>
  );
}
