import React from "react";
import Image from "next/image";

export default function StepSection() {
  const steps = [
    { num: "01", title: "강의 자료 업로드하기", desc: "강의 PDF나 텍스트를 손쉽게 추가하세요. AI가 문서를 스캔합니다." },
    { num: "02", title: "지식화 및 목차 분석", desc: "AI가 문서를 분석하고 구조화된 학습 데이터를 구성합니다." },
    { num: "03", title: "묻고 답하기 (AI 튜터)", desc: "이해가 안 되는 부분은 RAG 기반 AI에게 실시간으로 질문하세요." },
    { num: "04", title: "자동 퀴즈 생성 및 풀이", desc: "자동화된 점검 퀴즈를 통해 완벽히 내 것으로 만들 수 있습니다." },
    { num: "05", title: "학습 분석 및 복습 추천", desc: "나의 취약점을 파악하고 최적화된 복습 경로를 안내받으세요." }
  ];

  return (
    <section className="py-32 bg-slate-50 relative overflow-hidden">
      <div className="container mx-auto px-4 max-w-screen-lg">
        <div className="text-center mb-20 relative z-10">
          <h2 className="text-4xl font-black tracking-tight text-slate-800 mb-4 text-center mx-auto flex flex-col items-center">
            <span className="text-primary text-xl font-bold mb-2">Memora 튜토리얼</span>
            너무나 쉬운 5가지 학습 흐름
          </h2>
        </div>

        <div className="flex flex-col md:flex-row gap-12 items-center">
           {/* Mascots Area */}
           <div className="md:w-1/3 flex justify-center sticky top-32">
             <div className="relative w-72 h-72">
                <Image 
                  src="/images/mascot_reading.png"
                  alt="Mascot Reading"
                  fill
                  sizes="(min-width: 768px) 288px, 100vw"
                  className="object-contain animate-pulse-slow drop-shadow-2xl"
                  style={{ animationDuration: '6s' }}
                />
             </div>
           </div>

           {/* Steps Area */}
           <div className="md:w-2/3 flex flex-col space-y-6 relative">
              <div className="absolute top-8 bottom-8 left-10 w-1 bg-gradient-to-b from-blue-300 via-purple-300 to-indigo-300 rounded-full hidden md:block" />
              
              {steps.map((step, idx) => (
                <div key={idx} className="relative z-10 flex bg-white p-6 rounded-3xl shadow-lg border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all group">
                   <div className="flex-shrink-0 w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-blue-500 text-white font-black text-2xl flex items-center justify-center mr-6 shadow-inner relative overflow-hidden">
                     <span className="relative z-10">{step.num}</span>
                     <div className="absolute inset-0 bg-white/20 transform rotate-45 scale-150 -translate-y-full group-hover:translate-y-full transition-transform duration-500" />
                   </div>
                   <div className="flex flex-col justify-center">
                     <h3 className="font-bold text-xl mb-2 text-slate-800">{step.title}</h3>
                     <p className="text-slate-500 font-medium">{step.desc}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </section>
  );
}
