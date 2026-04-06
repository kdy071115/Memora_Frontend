import React from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Mail, Lock, User, GraduationCap } from "lucide-react";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center shadow-lg shadow-primary/20">
              <BookOpen className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-3xl tracking-tight bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
              Memora
            </span>
          </Link>
        </div>

        <div className="bg-card/80 backdrop-blur-xl border border-border/50 shadow-xl rounded-2xl p-8 transition-all hover:shadow-primary/5">
          <div className="flex flex-col space-y-2 text-center mb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              계정 만들기
            </h1>
            <p className="text-sm text-muted-foreground">
              몇 가지 정보만 입력하면 학습의 질이 달라집니다.
            </p>
          </div>

          <form className="space-y-4">
            <div className="flex space-x-4 mb-2">
               <label className="flex-1 cursor-pointer">
                 <input type="radio" name="role" value="STUDENT" className="peer sr-only" defaultChecked />
                 <div className="w-full h-11 flex items-center justify-center border border-border rounded-lg peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary transition-all text-sm text-muted-foreground font-medium">
                   학생
                 </div>
               </label>
               <label className="flex-1 cursor-pointer">
                 <input type="radio" name="role" value="INSTRUCTOR" className="peer sr-only" />
                 <div className="w-full h-11 flex items-center justify-center border border-border rounded-lg peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary transition-all text-sm text-muted-foreground font-medium">
                   교강사
                 </div>
               </label>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="이름"
                  className="w-full h-11 bg-background/50 border border-border rounded-lg pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground"
                  required
                />
              </div>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="이메일"
                  className="w-full h-11 bg-background/50 border border-border rounded-lg pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground"
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <input
                  type="password"
                  placeholder="비밀번호"
                  className="w-full h-11 bg-background/50 border border-border rounded-lg pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground"
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <input
                  type="password"
                  placeholder="비밀번호 확인"
                  className="w-full h-11 bg-background/50 border border-border rounded-lg pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground"
                  required
                />
              </div>
            </div>
            
            <button
              type="submit"
              className="w-full h-11 mt-4 bg-gradient-to-r from-primary to-blue-600 text-primary-foreground rounded-lg font-medium shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/40 hover:-translate-y-0.5 transition-all text-sm flex justify-center items-center group"
            >
              시작하기
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">
              로그인
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
