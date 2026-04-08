"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, X, Loader2, Users } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMyPendingInvitations,
  acceptInvitation,
  rejectInvitation,
} from "@/lib/api/teams";
import { useAuthStore } from "@/lib/store/useAuthStore";

/**
 * 헤더에 표시되는 팀 초대 알림 벨.
 * - 학생 계정에서만 fetch
 * - 30 초마다 자동 갱신
 */
export default function InvitationBell() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isStudent = user?.role === "STUDENT";

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const { data: invitations = [] } = useQuery({
    queryKey: ["myPendingInvitations"],
    queryFn: getMyPendingInvitations,
    enabled: isStudent,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  const acceptMutation = useMutation({
    mutationFn: (id: number) => acceptInvitation(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["myPendingInvitations"] });
      queryClient.invalidateQueries({ queryKey: ["teams", data.courseId] });
    },
    onError: (err: any) => alert(err?.response?.data?.message || "수락 실패"),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => rejectInvitation(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["myPendingInvitations"] }),
    onError: (err: any) => alert(err?.response?.data?.message || "거절 실패"),
  });

  if (!isStudent) return null;

  const count = invitations.length;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors"
        aria-label={`초대장 ${count}건`}
      >
        <Bell className="w-4 h-4 text-slate-600" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/60 z-50 animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-xs font-bold text-slate-400 mb-0.5">팀 초대</p>
            <p className="text-sm font-black text-slate-800">
              {count > 0 ? `${count}건의 새 초대` : "받은 초대가 없습니다"}
            </p>
          </div>

          {count === 0 ? (
            <div className="py-8 px-4 flex flex-col items-center text-center">
              <Users className="w-10 h-10 text-slate-200 mb-2" />
              <p className="text-xs font-medium text-slate-400">
                팀 초대가 오면 여기에 표시됩니다.
              </p>
            </div>
          ) : (
            <ul className="max-h-96 overflow-y-auto divide-y divide-slate-100">
              {invitations.map((inv) => {
                const busy = acceptMutation.isPending || rejectMutation.isPending;
                return (
                  <li key={inv.id} className="p-4">
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        router.push(`/courses/${inv.courseId}/teams`);
                      }}
                      className="w-full text-left mb-3"
                    >
                      <p className="text-xs font-bold text-violet-600 mb-0.5 truncate">
                        {inv.courseTitle}
                      </p>
                      <p className="text-sm font-black text-slate-800 truncate">
                        {inv.teamName}
                      </p>
                      <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                        <strong className="text-slate-700">{inv.inviterName}</strong> 님이 초대했습니다
                      </p>
                    </button>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => acceptMutation.mutate(inv.id)}
                        className="flex-1 h-9 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1 disabled:opacity-50"
                      >
                        {busy ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        수락
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => rejectMutation.mutate(inv.id)}
                        className="flex-1 h-9 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl flex items-center justify-center gap-1 disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" />
                        거절
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
