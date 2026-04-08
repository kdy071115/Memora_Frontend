"use client";
import React, { use, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Users,
  Plus,
  Loader2,
  X,
  UserPlus,
  Crown,
  Trash2,
  LogOut,
  Search,
  Send,
} from "lucide-react";
import {
  getCourseTeams,
  createTeam,
  disbandTeam,
  leaveTeam,
  inviteToTeam,
} from "@/lib/api/teams";
import { getCourseById, getCourseMembers, type CourseMember } from "@/lib/api/courses";
import { useAuthStore } from "@/lib/store/useAuthStore";
import type { Team } from "@/types/team";

export default function TeamsPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const resolvedParams = use(params);
  const courseId = Number(resolvedParams.courseId);
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const { data: course } = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => getCourseById(courseId),
  });

  const { data: teams = [], isLoading } = useQuery({
    queryKey: ["teams", courseId],
    queryFn: () => getCourseTeams(courseId),
  });

  const isInstructor =
    user?.role === "INSTRUCTOR" && course?.instructor.id === Number(user.id);

  // 생성 폼
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const createMutation = useMutation({
    mutationFn: () =>
      createTeam(courseId, { name: newName.trim(), description: newDesc.trim() || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams", courseId] });
      setShowCreate(false);
      setNewName("");
      setNewDesc("");
    },
    onError: (err: any) => alert(err?.response?.data?.message || "팀 생성에 실패했습니다."),
  });

  return (
    <MainLayout>
      <div className="w-full py-8">
        <button
          type="button"
          onClick={() => router.push(`/courses/${courseId}`)}
          className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          강의로 돌아가기
        </button>

        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-violet-500/10 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-violet-600" />
            </div>
            <div className="min-w-0">
              {course?.title && (
                <p className="text-xs font-bold text-violet-600 truncate">{course.title}</p>
              )}
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
                팀
              </h1>
            </div>
          </div>
          {!isInstructor && (
            <button
              type="button"
              onClick={() => setShowCreate((v) => !v)}
              className="px-5 h-11 bg-gradient-to-r from-violet-500 to-violet-600 text-white font-bold rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 shrink-0"
            >
              {showCreate ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showCreate ? "취소" : "팀 만들기"}
            </button>
          )}
        </div>

        {showCreate && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newName.trim()) return;
              createMutation.mutate();
            }}
            className="bg-card border border-border rounded-3xl p-6 shadow-sm mb-6"
          >
            <h2 className="text-base font-black text-foreground mb-3">새 팀</h2>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="팀 이름"
              className="w-full h-11 px-4 mb-3 rounded-xl border border-border focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 font-medium"
            />
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="팀 설명 (옵션)"
              rows={2}
              className="w-full px-4 py-3 mb-4 rounded-xl border border-border focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 font-medium resize-y"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={createMutation.isPending || !newName.trim()}
                className="px-5 h-11 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl flex items-center gap-2 disabled:opacity-50"
              >
                {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                팀 생성
              </button>
            </div>
          </form>
        )}

        {isLoading ? (
          <div className="py-32 flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
          </div>
        ) : teams.length === 0 ? (
          <div className="bg-card border border-border rounded-3xl p-16 flex flex-col items-center justify-center text-center shadow-sm">
            <Users className="w-16 h-16 text-muted-foreground/40 mb-5" />
            <h2 className="text-xl font-black text-foreground mb-2">아직 팀이 없습니다</h2>
            <p className="text-muted-foreground font-medium">
              {isInstructor ? "학생들이 팀을 생성하면 여기에 표시됩니다." : "위의 '팀 만들기' 버튼으로 새 팀을 시작해보세요."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {teams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                courseId={courseId}
                currentUserId={Number(user?.id)}
              />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

// ─────────────────────────────────────────────────────────────────
function TeamCard({
  team,
  courseId,
  currentUserId,
}: {
  team: Team;
  courseId: number;
  currentUserId: number;
}) {
  const queryClient = useQueryClient();
  const [showInvite, setShowInvite] = useState(false);
  const isLeader = team.leaderId === currentUserId;
  const isMember = team.members.some((m) => m.userId === currentUserId);

  const disbandMutation = useMutation({
    mutationFn: () => disbandTeam(team.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teams", courseId] }),
    onError: (err: any) => alert(err?.response?.data?.message || "해체 실패"),
  });

  const leaveMutation = useMutation({
    mutationFn: () => leaveTeam(team.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teams", courseId] }),
    onError: (err: any) => alert(err?.response?.data?.message || "탈퇴 실패"),
  });

  return (
    <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-black text-foreground truncate">{team.name}</h3>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {team.members.length}명
            </span>
          </div>
          {team.description && (
            <p className="text-sm text-muted-foreground font-medium">{team.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isMember && (
            <button
              type="button"
              onClick={() => setShowInvite((v) => !v)}
              className="px-3 h-9 bg-violet-500/10 hover:bg-violet-500/15 text-violet-700 font-bold rounded-xl text-xs flex items-center gap-1 transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              초대
            </button>
          )}
          {isLeader ? (
            <button
              type="button"
              onClick={() => {
                if (confirm("팀을 해체하시겠습니까? 모든 멤버와 초대장이 사라집니다."))
                  disbandMutation.mutate();
              }}
              className="px-3 h-9 bg-card border border-rose-500/30 hover:bg-rose-500/10 text-rose-500 font-bold rounded-xl text-xs flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              해체
            </button>
          ) : (
            isMember && (
              <button
                type="button"
                onClick={() => {
                  if (confirm("팀에서 나가시겠습니까?")) leaveMutation.mutate();
                }}
                className="px-3 h-9 bg-card border border-border hover:bg-muted text-muted-foreground font-bold rounded-xl text-xs flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                나가기
              </button>
            )
          )}
        </div>
      </div>

      {/* 멤버 목록 */}
      <div className="flex flex-wrap gap-2 mt-4">
        {team.members.map((m) => (
          <div
            key={m.userId}
            className="flex items-center gap-2 bg-muted rounded-full pl-1 pr-3 py-1"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-xs font-black">
              {m.name.charAt(0)}
            </div>
            <span className="text-xs font-bold text-foreground">{m.name}</span>
            {m.userId === team.leaderId && (
              <Crown className="w-3 h-3 text-amber-500" />
            )}
          </div>
        ))}
      </div>

      {/* 초대 패널 */}
      {showInvite && (
        <InvitePanel
          team={team}
          courseId={courseId}
          onClose={() => setShowInvite(false)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
function InvitePanel({
  team,
  courseId,
  onClose,
}: {
  team: Team;
  courseId: number;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: members = [] } = useQuery({
    queryKey: ["courseMembers", courseId],
    queryFn: () => getCourseMembers(courseId),
  });

  const memberIds = useMemo(() => new Set(team.members.map((m) => m.userId)), [team]);

  const candidates = useMemo(() => {
    return members
      .filter((u) => !memberIds.has(u.userId))
      .filter((u) => {
        if (!search.trim()) return true;
        const q = search.trim().toLowerCase();
        return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      });
  }, [members, memberIds, search]);

  const inviteMutation = useMutation({
    mutationFn: (userId: number) => inviteToTeam(team.id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams", courseId] });
    },
    onError: (err: any) => alert(err?.response?.data?.message || "초대 실패"),
  });

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-black text-foreground">팀원 초대</h4>
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:text-muted-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="relative mb-3">
        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="수강생 이름 또는 이메일 검색"
          className="w-full h-10 pl-9 pr-4 rounded-xl border border-border focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 font-medium text-sm"
        />
      </div>
      {candidates.length === 0 ? (
        <p className="text-xs font-medium text-muted-foreground py-3 text-center">
          초대 가능한 수강생이 없습니다.
        </p>
      ) : (
        <ul className="space-y-2 max-h-72 overflow-y-auto">
          {candidates.map((u: CourseMember) => (
            <li
              key={u.userId}
              className="flex items-center justify-between gap-3 p-3 bg-muted rounded-xl"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-xs font-black shrink-0">
                  {u.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{u.name}</p>
                  <p className="text-[11px] font-bold text-muted-foreground truncate">{u.email}</p>
                </div>
              </div>
              <button
                type="button"
                disabled={inviteMutation.isPending}
                onClick={() => inviteMutation.mutate(u.userId)}
                className="px-3 h-8 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 shrink-0 disabled:opacity-50"
              >
                <Send className="w-3 h-3" />
                초대
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
