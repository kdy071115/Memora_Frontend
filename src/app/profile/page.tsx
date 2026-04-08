"use client";
import React, { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useMutation } from "@tanstack/react-query";
import { updateProfile } from "@/lib/api/auth";
import { useRouter } from "next/navigation";
import {
  User, Mail, Shield, Pen, LogOut,
  CheckCircle2, Loader2, ChevronRight
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const updateUser = useAuthStore((state) => state.updateUser);

  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.name || "");
  const [saved, setSaved] = useState(false);

  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      updateUser({ name: newName });
      setIsEditingName(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
    onError: () => {
      alert("이름 변경에 실패했습니다. 다시 시도해주세요.");
    }
  });

  const handleSaveName = () => {
    if (!newName.trim() || newName === user?.name) {
      setIsEditingName(false);
      return;
    }
    updateMutation.mutate({ name: newName.trim() });
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const roleLabel = user?.role === "INSTRUCTOR"
    ? { text: "교강사", bg: "bg-purple-500/15", color: "text-purple-700" }
    : { text: "학생", bg: "bg-blue-500/15", color: "text-blue-700" };

  return (
    <MainLayout>
      <div className="flex flex-col w-full py-10 max-w-2xl mx-auto text-foreground">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">
            마이페이지 👤
          </h1>
          <p className="text-muted-foreground font-medium text-lg">
            내 계정 정보를 확인하고 관리하세요.
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-card border border-border rounded-[2rem] shadow-sm overflow-hidden mb-6">
          {/* Avatar header */}
          <div className="h-32 bg-gradient-to-br from-indigo-500/10 via-blue-500/10 to-purple-500/10 relative">
            <div className="absolute -bottom-8 left-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center shadow-lg border-4 border-white">
                <span className="text-white text-2xl font-black">
                  {user?.name?.charAt(0) || "U"}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-12 pb-8 px-8">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-black text-foreground">{user?.name || "사용자"}</h2>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${roleLabel.bg} ${roleLabel.color}`}>
                {roleLabel.text}
              </span>
            </div>
            <p className="text-muted-foreground font-medium">{user?.email}</p>
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-card border border-border rounded-[2rem] shadow-sm divide-y divide-border mb-6">
          {/* 이름 수정 */}
          <div className="px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground mb-0.5">이름</p>
                  {isEditingName ? (
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveName();
                        if (e.key === "Escape") setIsEditingName(false);
                      }}
                      autoFocus
                      className="text-base font-bold bg-transparent border-b-2 border-primary outline-none text-foreground w-48 pb-0.5"
                    />
                  ) : (
                    <p className="text-base font-bold text-foreground">{user?.name || "—"}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {saved && (
                  <div className="flex items-center gap-1.5 text-green-500 text-sm font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    저장됨
                  </div>
                )}
                {isEditingName ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsEditingName(false)}
                      className="h-8 px-3 text-sm font-bold text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleSaveName}
                      disabled={updateMutation.isPending}
                      className="h-8 px-3 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-1.5 disabled:opacity-60"
                    >
                      {updateMutation.isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : null}
                      저장
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setNewName(user?.name || "");
                      setIsEditingName(true);
                    }}
                    className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
                  >
                    <Pen className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 이메일 */}
          <div className="px-8 py-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <Mail className="w-4 h-4 text-orange-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground mb-0.5">이메일</p>
              <p className="text-base font-bold text-foreground">{user?.email || "—"}</p>
            </div>
          </div>

          {/* 역할 */}
          <div className="px-8 py-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Shield className="w-4 h-4 text-purple-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground mb-0.5">계정 유형</p>
              <p className="text-base font-bold text-foreground">{roleLabel.text}</p>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-card border border-border rounded-[2rem] shadow-sm divide-y divide-border mb-6">
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full px-8 py-5 flex items-center justify-between hover:bg-muted transition-colors rounded-t-[2rem]"
          >
            <span className="font-bold text-foreground">대시보드로 이동</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={() => router.push("/courses")}
            className="w-full px-8 py-5 flex items-center justify-between hover:bg-muted transition-colors rounded-b-[2rem]"
          >
            <span className="font-bold text-foreground">내 강의 목록</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-500/10 border border-red-500/20 rounded-[2rem] px-8 py-6">
          <p className="text-sm font-bold text-red-400 mb-4">위험 구역</p>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 font-bold text-red-600 hover:text-red-700 transition-colors group"
          >
            <div className="w-9 h-9 rounded-xl bg-red-500/15 group-hover:bg-red-200 flex items-center justify-center transition-colors">
              <LogOut className="w-4 h-4 text-red-500" />
            </div>
            로그아웃
          </button>
        </div>
      </div>
    </MainLayout>
  );
}
