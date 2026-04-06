"use client";
import React, { useState } from "react";
import { User, Presentation, Briefcase, CheckCircle2 } from "lucide-react";

export default function BenefitSection() {
  const [activeTab, setActiveTab] = useState(0);

  const benefits = [
    {
      id: "student",
      icon: <User className="w-5 h-5" />,
      title: "수강생",
      subtitle: "막막함 없는 즉각적인 피드백",
      points: [
        "강의 내용을 이해하지 못해도 즉시 질문하고 해답 얻기",
        "자신의 수준에 맞는 설명이나 보충 학습 자료 제공",
        "무엇을 어떻게 복습해야 하는지 명확한 가이드라인 확보"
      ]
    },
    {
      id: "instructor",
      icon: <Presentation className="w-5 h-5" />,
      title: "교강사",
      subtitle: "반복적인 업무 감소, 질 높은 교육",
      points: [
        "단순 반복 질문 대응에 소모되는 시간의 획기적 단축",
        "개별 학생의 이해도 상태를 데이터 기반으로 파악",
        "모두의 수준에 맞춘 자동화된 퀴즈 생성 및 과제 배포 지원"
      ]
    },
    {
      id: "operator",
      icon: <Briefcase className="w-5 h-5" />,
      title: "교육 운영자",
      subtitle: "성과 증빙과 손쉬운 대시보드",
      points: [
        "학습 성과를 객관적인 추이 데이터로 한눈에 파악",
        "교육 프로그램 품질 개선을 위한 근거 높은 리포트 확보",
        "수강생 이탈을 방지하는 실시간 분석 모니터링 적용"
      ]
    }
  ];

  return (
    <section className="py-32 bg-white border-y border-border/30 overflow-hidden relative">
       {/* Decorative */}
      <div className="absolute top-1/2 right-0 w-[800px] h-[800px] bg-blue-50/50 rounded-full blur-[100px] pointer-events-none translate-x-1/3 -translate-y-1/2" />
      
      <div className="container mx-auto px-4 max-w-screen-xl relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-primary text-xl font-bold mb-2 block">Memora Value</span>
          <h2 className="text-4xl lg:text-5xl font-black tracking-tight text-slate-800">
            누구에게 필요한가요?
          </h2>
          <p className="mt-4 text-slate-500 text-lg font-medium">Memora는 학습 현장에 참여하는 모두에게 각기 다른 폭발적인 가치를 선사합니다.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-12 max-w-5xl mx-auto items-center">
          {/* Tabs */}
          <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-visible md:w-1/3 hide-scrollbar p-2 w-full">
             {benefits.map((b, idx) => (
               <button
                 key={b.id}
                 onClick={() => setActiveTab(idx)}
                 className={`flex items-center space-x-4 text-left w-full p-5 rounded-[2rem] transition-all whitespace-nowrap md:whitespace-normal border-2
                   ${activeTab === idx ? "bg-white border-primary shadow-lg shadow-primary/10 text-slate-800 scale-105" : "bg-slate-50 border-transparent hover:bg-slate-100 text-slate-500"}
                 `}
               >
                 <div className={`p-3 rounded-2xl transition-colors ${activeTab === idx ? "bg-primary text-white" : "bg-slate-200 text-slate-400"}`}>
                   {b.icon}
                 </div>
                 <span className="text-xl font-bold">{b.title}</span>
               </button>
             ))}
          </div>

          {/* Tab Content */}
          <div className="md:w-2/3 bg-slate-50/80 backdrop-blur-sm border border-slate-200 rounded-[3rem] p-10 md:p-14 shadow-xl transition-all duration-500 hover:shadow-2xl">
             <div className="inline-block px-4 py-1.5 bg-white border border-slate-200 text-primary font-bold text-sm rounded-full mb-8 shadow-sm">
                For {benefits[activeTab].title}
             </div>
             <h3 className="text-3xl md:text-4xl font-black mb-10 text-slate-800 leading-tight">
               {benefits[activeTab].subtitle}
             </h3>
             <ul className="space-y-6">
               {benefits[activeTab].points.map((point, i) => (
                 <li key={i} className="flex items-start group">
                   <div className="flex-shrink-0 mt-1 transform group-hover:scale-110 transition-transform">
                     <CheckCircle2 className="w-7 h-7 text-primary" />
                   </div>
                   <p className="ml-5 text-xl font-medium text-slate-600 leading-relaxed">
                     {point}
                   </p>
                 </li>
               ))}
             </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
