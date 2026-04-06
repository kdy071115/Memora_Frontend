import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Sparkles, ArrowRight } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/50 via-purple-50/30 to-background pt-24 pb-20 md:pt-36 md:pb-28 text-center flex flex-col items-center">
      {/* Background soft blurs */}
      <div className="absolute top-0 right-1/4 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-200/40 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-purple-200/40 blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 max-w-screen-xl relative z-10 flex flex-col items-center">
        
        {/* Floating Mascot */}
        <div className="relative w-48 h-48 sm:w-64 sm:h-64 mb-6 animate-bounce" style={{ animationDuration: '4s' }}>
           <Image 
             src="/images/mascot_hero.png" 
             alt="Memora AI Mascot" 
             fill
             sizes="(max-width: 640px) 192px, 256px"
             className="object-contain drop-shadow-xl"
             priority
           />
        </div>

        <div className="inline-flex items-center rounded-2xl bg-white/60 border border-primary/20 px-4 py-2 text-sm font-bold text-primary shadow-sm backdrop-blur-md mb-8">
          <Sparkles className="mr-2 h-4 w-4" />
          <span>단 하나의 AI 코파일럿</span>
        </div>
        
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-slate-800 leading-[1.2] mb-6">
          이해와 기억을 최적화하는 <br className="hidden md:block" />
          <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent drop-shadow-sm">
            Memora
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-500 font-medium leading-relaxed max-w-2xl mx-auto mb-10">
          수업 자료를 넣기만 하면 요약, 질의응답, 문제 풀이가 한 번에 완성됩니다.<br className="hidden sm:block" />
          가장 똑똑하고 친절한 AI 파트너와 함께하세요.
        </p>

        <Link
          href="/signup"
          className="w-full sm:w-auto inline-flex items-center justify-center h-16 px-10 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-bold text-lg shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/50 hover:-translate-y-1 transition-all group border-b-4 border-indigo-800"
        >
          무료로 멤버십 가입하기
          <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Decorative Bottom Elements */}
      <div className="w-full absolute bottom-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  );
}
