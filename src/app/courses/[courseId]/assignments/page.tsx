"use client";
import React, { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ClipboardList,
  Plus,
  Loader2,
  Calendar,
  Users as UsersIcon,
  CheckCircle2,
  Clock,
  X,
} from "lucide-react";
import { getCourseAssignments, createAssignment } from "@/lib/api/assignments";
import { getCourseById } from "@/lib/api/courses";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { dueStatus } from "@/lib/dueDate";
import type { AssignmentInput } from "@/types/assignment";

export default function AssignmentsListPage({
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

  const isInstructor =
    user?.role === "INSTRUCTOR" && course?.instructor.id === Number(user.id);

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ["assignments", courseId],
    queryFn: () => getCourseAssignments(courseId),
  });

  // 필터 — 학생: 미제출 / 제출완료 / 마감 임박,  강사: 진행 중 / 마감
  type FilterKey = "ALL" | "PENDING" | "DONE" | "URGENT" | "OPEN" | "CLOSED";
  const [filter, setFilter] = useState<FilterKey>("ALL");

  const filtered = useMemo(() => {
    return assignments.filter((a) => {
      if (filter === "ALL") return true;
      const dueMs = a.dueDate ? new Date(a.dueDate).getTime() : null;
      const now = Date.now();
      const urgent = dueMs !== null && dueMs - now <= 2 * 24 * 60 * 60 * 1000 && dueMs - now > 0;
      switch (filter) {
        case "PENDING":
          return !a.mySubmissionExists && !a.closed;
        case "DONE":
          return a.mySubmissionExists;
        case "URGENT":
          return !a.closed && urgent;
        case "OPEN":
          return !a.closed;
        case "CLOSED":
          return a.closed;
        default:
          return true;
      }
    });
  }, [assignments, filter]);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState<AssignmentInput>({
    title: "",
    description: "",
    dueDate: "",
    allowTeamSubmission: false,
  });

  const createMutation = useMutation({
    mutationFn: (normalizedDueDate: string | null) =>
      createAssignment(courseId, {
        title: form.title.trim(),
        description: form.description.trim(),
        dueDate: normalizedDueDate,
        allowTeamSubmission: form.allowTeamSubmission,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments", courseId] });
      setShowCreateForm(false);
      setForm({ title: "", description: "", dueDate: "", allowTeamSubmission: false });
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || "과제 생성에 실패했습니다.");
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      alert("제목과 설명을 입력해주세요.");
      return;
    }
    const normalized = normalizeDateInput(form.dueDate);
    if (form.dueDate && normalized === null) {
      alert("마감일 형식이 올바르지 않습니다. 예: 2026-04-20 23:59");
      return;
    }
    createMutation.mutate(normalized);
  };

  return (
    <MainLayout>
      <div className="w-full py-8">
        <button
          type="button"
          onClick={() => router.push(`/courses/${courseId}`)}
          className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          강의로 돌아가기
        </button>

        {/* 헤더 */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <ClipboardList className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="min-w-0">
              {course?.title && (
                <p className="text-xs font-bold text-emerald-600 truncate">{course.title}</p>
              )}
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
                과제
              </h1>
            </div>
          </div>
          {isInstructor && (
            <button
              type="button"
              onClick={() => setShowCreateForm((v) => !v)}
              className="px-5 h-11 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 shrink-0"
            >
              {showCreateForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showCreateForm ? "취소" : "과제 만들기"}
            </button>
          )}
        </div>

        {/* 생성 폼 */}
        {showCreateForm && isInstructor && (
          <form
            onSubmit={handleCreate}
            className="bg-card border border-border rounded-3xl p-6 shadow-sm mb-6"
          >
            <h2 className="text-lg font-black text-foreground mb-4">새 과제</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-black text-muted-foreground mb-1 block">제목</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="예: 5장 보고서"
                  className="w-full h-11 px-4 rounded-xl border border-border focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-black text-muted-foreground mb-1 block">설명 (markdown 가능)</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="과제 안내를 작성해주세요..."
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 font-medium resize-y"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-muted-foreground mb-1 block">
                    마감일 (옵션) <span className="text-muted-foreground font-medium">— 예: 2026-04-20 23:59</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={form.dueDate ?? ""}
                      onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                      placeholder="2026-04-20 23:59"
                      className="flex-1 h-11 px-4 rounded-xl border border-border focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 font-medium"
                    />
                    <input
                      type="datetime-local"
                      value={toDatetimeLocalValue(form.dueDate)}
                      onChange={(e) => setForm({ ...form, dueDate: e.target.value.replace("T", " ") })}
                      className="h-11 w-11 px-2 rounded-xl border border-border focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 cursor-pointer"
                      aria-label="달력에서 선택"
                      title="달력에서 선택"
                    />
                  </div>
                </div>
                <div>
                  <span className="text-xs font-black text-muted-foreground mb-1 block">제출 옵션</span>
                  <label className="w-full h-11 flex items-center gap-3 px-4 rounded-xl border border-border cursor-pointer hover:bg-muted">
                    <input
                      type="checkbox"
                      checked={form.allowTeamSubmission ?? false}
                      onChange={(e) => setForm({ ...form, allowTeamSubmission: e.target.checked })}
                      className="w-4 h-4 accent-emerald-500"
                    />
                    <span className="text-sm font-bold text-foreground">팀 단위 제출 허용</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-5 h-11 bg-muted hover:bg-border text-foreground font-bold rounded-xl transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-5 h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  생성
                </button>
              </div>
            </div>
          </form>
        )}

        {/* 필터 칩 */}
        {!isLoading && assignments.length > 0 && (
          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
            <FilterChip current={filter} value="ALL" onClick={setFilter}>
              전체 ({assignments.length})
            </FilterChip>
            {!isInstructor && (
              <>
                <FilterChip current={filter} value="PENDING" onClick={setFilter}>
                  미제출 ({assignments.filter((a) => !a.mySubmissionExists && !a.closed).length})
                </FilterChip>
                <FilterChip current={filter} value="DONE" onClick={setFilter}>
                  제출 완료 ({assignments.filter((a) => a.mySubmissionExists).length})
                </FilterChip>
              </>
            )}
            <FilterChip current={filter} value="URGENT" onClick={setFilter}>
              마감 임박
            </FilterChip>
            {isInstructor && (
              <>
                <FilterChip current={filter} value="OPEN" onClick={setFilter}>
                  진행 중 ({assignments.filter((a) => !a.closed).length})
                </FilterChip>
                <FilterChip current={filter} value="CLOSED" onClick={setFilter}>
                  마감 ({assignments.filter((a) => a.closed).length})
                </FilterChip>
              </>
            )}
          </div>
        )}

        {/* 목록 */}
        {isLoading ? (
          <div className="py-32 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
            <p className="text-muted-foreground font-medium">과제를 불러오는 중...</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="bg-card border border-border rounded-3xl p-16 flex flex-col items-center justify-center text-center shadow-sm">
            <ClipboardList className="w-16 h-16 text-muted-foreground/40 mb-5" />
            <h2 className="text-xl font-black text-foreground mb-2">아직 과제가 없습니다</h2>
            <p className="text-muted-foreground font-medium">
              {isInstructor
                ? "위의 '과제 만들기' 버튼으로 첫 과제를 생성해보세요."
                : "강사님이 과제를 출제하면 여기에 표시됩니다."}
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-3xl p-12 text-center text-muted-foreground font-medium">
            조건에 맞는 과제가 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((assignment) => {
              const due = dueStatus(assignment.dueDate);
              const showDueBadge =
                !assignment.closedEarly &&
                due.kind !== "NONE" &&
                !(isInstructor === false && assignment.mySubmissionExists);
              return (
                <Link
                  key={assignment.id}
                  href={`/courses/${courseId}/assignments/${assignment.id}`}
                  className="block bg-card border border-border rounded-2xl p-5 hover:border-emerald-500/30 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <h3 className="font-black text-foreground truncate">{assignment.title}</h3>
                        {assignment.allowTeamSubmission && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-700 ring-1 ring-violet-500/30">
                            팀 제출
                          </span>
                        )}
                        {!isInstructor && assignment.mySubmissionExists && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            제출 완료
                          </span>
                        )}
                        {assignment.closedEarly && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-700 ring-1 ring-rose-500/30">
                            조기 마감
                          </span>
                        )}
                        {showDueBadge && (
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full ring-1 ${due.bgClass} ${due.textClass} ${due.ringClass}`}
                          >
                            {due.label}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground font-medium line-clamp-2">
                        {assignment.description}
                      </p>
                      <div className="flex items-center gap-4 mt-3 text-xs font-bold text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <UsersIcon className="w-3.5 h-3.5" />
                          제출 {assignment.submissionCount}건
                        </span>
                        {assignment.dueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            마감 {formatDateTime(assignment.dueDate)}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDate(assignment.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

function formatDateTime(s: string) {
  const d = new Date(s);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function formatDate(s: string) {
  const d = new Date(s);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/**
 * 사용자가 입력한 자유 형식의 마감일 문자열을 백엔드(LocalDateTime, ISO local) 형식으로 변환.
 *  - 빈 문자열 → null
 *  - 허용: "2026-04-20 23:59", "2026-04-20T23:59", "2026/04/20 23:59", "2026-04-20" (시각 생략 시 23:59:59)
 *  - 파싱 실패 → null (호출 측에서 빈 입력과 구분해 에러 처리)
 */
function normalizeDateInput(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // 구분자 통일: '/' → '-', 'T' / 다중 공백 → 단일 공백
  let s = trimmed.replace(/\//g, "-").replace("T", " ").replace(/\s+/g, " ");

  // 시각 생략 시 마감일 종료시각 (23:59:59)
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)) {
    s = `${s} 23:59:59`;
  }
  // 초 생략 시 :00 추가
  if (/^\d{4}-\d{1,2}-\d{1,2} \d{1,2}:\d{1,2}$/.test(s)) {
    s = `${s}:00`;
  }
  // 최종 형식 검사
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2}) (\d{1,2}):(\d{2}):(\d{2})$/.exec(s);
  if (!match) return null;
  const [, y, mo, d, h, mi, se] = match;
  const date = new Date(
    Number(y),
    Number(mo) - 1,
    Number(d),
    Number(h),
    Number(mi),
    Number(se)
  );
  if (isNaN(date.getTime())) return null;
  // 백엔드 LocalDateTime 형식: 2026-04-20T23:59:00 (타임존 없음)
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/**
 * 자유 형식 입력값을 datetime-local input 이 받을 수 있는 "YYYY-MM-DDTHH:mm" 형식으로 변환.
 * 파싱 불가 시 빈 문자열 → 빈 picker.
 */
function toDatetimeLocalValue(raw: string | null | undefined): string {
  const normalized = normalizeDateInput(raw);
  if (!normalized) return "";
  // "2026-04-20T23:59:00" → "2026-04-20T23:59"
  return normalized.slice(0, 16);
}

function FilterChip<T extends string>({
  current,
  value,
  onClick,
  children,
}: {
  current: T;
  value: T;
  onClick: (v: T) => void;
  children: React.ReactNode;
}) {
  const active = current === value;
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`shrink-0 h-9 px-4 rounded-full text-xs font-bold transition-colors ${
        active
          ? "bg-emerald-600 text-white shadow-sm"
          : "bg-card border border-border text-muted-foreground hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}
