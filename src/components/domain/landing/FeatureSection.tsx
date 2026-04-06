import React from "react";
import Image from "next/image";
import { FolderKanban, MessageSquareText, PenTool, PieChart } from "lucide-react";

export default function FeatureSection() {
  const features = [
    {
      icon: <FolderKanban className="w-8 h-8 text-blue-500" />,
      title: "강의 자료 자동 구조화",
      description: "PDF나 텍스트를 업로드하면, AI가 문서의 핵심 개념을 스스로 추출하고 계층형 목차를 만듭니다.",
      bgColor: "bg-blue-50",
      iconBg: "bg-white",
      borderColor: "border-blue-100"
    },
    {
      icon: <MessageSquareText className="w-8 h-8 text-purple-500" />,
      title: "RAG 기반 AI 질의응답",
      description: "학습 중 모르는 부분이 생겼나요? 강의 자료 내용에 한정된 정확도 높은 실시간 답변을 제공합니다.",
      bgColor: "bg-purple-50",
      iconBg: "bg-white",
      borderColor: "border-purple-100"
    },
    {
      icon: <PenTool className="w-8 h-8 text-pink-500" />,
      title: "맞춤형 문제 생성",
      description: "학습 내용과 개인의 이해도 데이터를 바탕으로 난이도가 조절된 맞춤형 퀴즈를 자동으로 출제합니다.",
      bgColor: "bg-pink-50",
      iconBg: "bg-white",
      borderColor: "border-pink-100"
    },
    {
      icon: <PieChart className="w-8 h-8 text-indigo-500" />,
      title: "이해도 분석 및 추천",
      description: "문제를 푸는 과정에서 취약 개념을 도출하고, 어떻게 복습해야 할지 1:1 맞춤형 경로를 추천해 드립니다.",
      bgColor: "bg-indigo-50",
      iconBg: "bg-white",
      borderColor: "border-indigo-100"
    }
  ];

  return (
    <section className="py-24 bg-white relative">
      <div className="container mx-auto px-4 max-w-screen-xl">
        <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-8">
           <div className="text-left max-w-2xl">
             <span className="text-primary text-xl font-bold mb-2 block">Memora Core</span>
             <h2 className="text-4xl lg:text-5xl font-black tracking-tight text-slate-800 leading-[1.1]">
               학습 효율을 극대화하는 <br className="hidden sm:block"/> 
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">4가지 핵심 기능</span>
             </h2>
             <p className="mt-4 text-slate-500 text-lg font-medium">단순한 정보 제공을 넘어, 이해와 기억을 돕는 학습 파트너로 작동합니다.</p>
           </div>
           
           {/* Decorative Mascot */}
          <div className="hidden md:block relative w-40 h-40">
             <Image 
               src="/images/mascot_exam.png" 
               alt="A+ Mascot" 
               fill 
               sizes="160px"
               className="object-contain drop-shadow-xl"
             />
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feat, idx) => (
            <div key={idx} className={`relative overflow-hidden rounded-[2rem] border ${feat.borderColor} ${feat.bgColor} p-10 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group`}>
               <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${feat.iconBg} mb-6 shadow-sm group-hover:scale-110 transition-transform`}>
                 {feat.icon}
               </div>
               <h3 className="text-2xl font-black mb-3 text-slate-800 tracking-tight">{feat.title}</h3>
               <p className="text-slate-600 font-medium leading-relaxed max-w-sm">
                 {feat.description}
               </p>
               
               {/* Decorator for cards */}
               <div className="absolute -right-8 -bottom-8 w-40 h-40 opacity-5 pointer-events-none mix-blend-multiply transform group-hover:rotate-12 transition-transform">
                 {feat.icon}
               </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
