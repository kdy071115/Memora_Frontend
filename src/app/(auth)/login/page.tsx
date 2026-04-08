"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, BookOpen, Mail, Lock, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import Image from "next/image";
import { useMutation } from "@tanstack/react-query";
import { login } from "@/lib/api/auth";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const expired = searchParams.get("expired") === "1";
  const loginStore = useAuthStore((state) => state.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      loginStore(data.user, data.accessToken, data.refreshToken);
      router.push("/dashboard");
    },
    onError: (error) => {
      console.error(error);
      alert("로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.");
    }
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/20 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-xl overflow-hidden relative shadow-lg border border-border">
               <Image src="/images/logo.png" alt="Memora Logo" fill sizes="40px" className="object-cover" />
            </div>
            <span className="font-bold text-3xl tracking-tight text-foreground">
              Memora
            </span>
          </Link>
        </div>

        <div className="bg-card/80 backdrop-blur-xl border border-border/50 shadow-xl rounded-2xl p-8 transition-all hover:shadow-primary/5">
          <div className="flex flex-col space-y-2 text-center mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              다시 오신 것을 환영합니다
            </h1>
            <p className="text-sm text-muted-foreground">
              AI 학습 코파일럿과 함께 여정을 계속하세요.
            </p>
          </div>

          {expired && (
            <div className="mb-5 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-amber-800 font-medium leading-relaxed">
                로그인 세션이 만료되었습니다. 다시 로그인해주세요.
              </p>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="space-y-2 relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <input
                type="email"
                placeholder="이메일을 입력하세요"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 bg-background/50 border border-border rounded-lg pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground"
                required
              />
            </div>
            <div className="space-y-2 relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 bg-background/50 border border-border rounded-lg pl-10 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center space-x-2 text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                <input type="checkbox" className="rounded border-border bg-background focus:ring-primary" />
                <span>로그인 유지</span>
              </label>
              <Link href="#" className="text-primary hover:underline font-medium">
                비밀번호 찾기
              </Link>
            </div>
            
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full h-11 bg-gradient-to-r from-primary to-blue-600 text-primary-foreground rounded-lg font-medium shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/40 hover:-translate-y-0.5 transition-all text-sm flex justify-center items-center group disabled:opacity-50"
            >
              {loginMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "로그인"}
              {!loginMutation.isPending && <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            계정이 없으신가요?{" "}
            <Link href="/signup" className="text-primary font-medium hover:underline">
              회원가입
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
