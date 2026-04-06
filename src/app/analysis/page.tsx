"use client";
import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Target, TrendingUp, AlertTriangle } from "lucide-react";

export default function AnalysisPage() {
  const lineData = [
    { name: '1주차', score: 65 },
    { name: '2주차', score: 72 },
    { name: '3주차', score: 68 },
    { name: '4주차', score: 85 },
    { name: '이번주', score: 92 },
  ];

  const radarData = [
    { subject: '개념 이해력', A: 120, fullMark: 150 },
    { subject: '수학적 사고', A: 98, fullMark: 150 },
    { subject: '비판적 추론', A: 86, fullMark: 150 },
    { subject: '암기력', A: 99, fullMark: 150 },
    { subject: '응용력', A: 85, fullMark: 150 },
    { subject: '문제 해결', A: 65, fullMark: 150 },
  ];

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
                  A- <span className="text-lg text-slate-400 font-medium ml-2 mb-1">상위 15%</span>
                </div>
              </div>
           </div>

           <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm flex flex-col justify-between">
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-slate-500 font-bold mb-1">최대 성장 지표</p>
                <div className="text-2xl font-black text-slate-800 leading-tight">
                  개념 이해력이<br/>지난주 대비 30% 상승
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
                  문제 해결 및 응용 능력이 부족해요.<br/>심화 문제를 위주로 복습을 세팅할게요.
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
                 <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                      />
                      <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={4} dot={{ r: 6, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 8, strokeWidth: 0, fill: '#6366f1' }} />
                    </LineChart>
                 </ResponsiveContainer>
              </div>
           </div>

           {/* Radar Chart */}
           <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
              <h3 className="text-xl font-bold mb-2 text-slate-800">학습 역량 헥사곤 분석</h3>
              <p className="text-sm font-medium text-slate-500 mb-6">AI가 진단한 6가지 다각형 역량 밸런스</p>
              <div className="w-full h-72">
                 <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" tick={{fill: '#64748b', fontSize: 13, fontWeight: 'bold'}} />
                      <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                      <Radar name="나의 역량" dataKey="A" stroke="#8b5cf6" strokeWidth={3} fill="#8b5cf6" fillOpacity={0.4} />
                      <Tooltip />
                    </RadarChart>
                 </ResponsiveContainer>
              </div>
           </div>

        </div>
      </div>
    </MainLayout>
  );
}
