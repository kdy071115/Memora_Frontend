import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function CtaSection() {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4 max-w-screen-xl relative z-10">
         <div className="bg-gradient-to-br from-indigo-500/10 to-blue-500/10 border border-indigo-500/20 rounded-[2rem] p-10 md:p-20 text-center shadow-lg relative overflow-hidden">
            {/* Soft decorative elements inside the box */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6 text-indigo-950">
              학습의 패러다임을 바꿀 시간입니다
            </h2>
            <p className="text-lg text-indigo-900/70 mb-10 max-w-3xl mx-auto leading-relaxed break-keep">
              더 이상 두꺼운 전공서적을 부여잡고 혼자 고민하지 마세요. <br className="hidden md:block"/>
              가장 똑똑하고 친절한 나만의 AI 코파일럿, Memora와 시작하세요.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link 
                href="/signup" 
                className="w-full sm:w-auto h-14 px-8 rounded-full bg-primary text-primary-foreground font-semibold flex items-center justify-center hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/30 transition-all group"
              >
                지금 바로 Memora 탑승하기
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
         </div>
      </div>
    </section>
  );
}
