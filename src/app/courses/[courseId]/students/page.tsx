"use client";
import React, { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getCourseStudents } from "@/lib/api/analysis";
import { getCourseById } from "@/lib/api/courses";
import {
  getAtRiskStudents,
  generateCareMessage,
  type AtRiskStudent,
  type CareMessage,
} from "@/lib/api/aiCoach";
import { useAuthStore } from "@/lib/store/useAuthStore";
import {
  ArrowLeft,
  Users,
  Loader2,
  Search,
  ChevronRight,
  Clock,
  Target,
  Award,
  AlertTriangle,
  Sparkles,
  X,
  ClipboardCopy,
  Heart,
} from "lucide-react";
import type { CourseStudentSummary, StudentStatus } from "@/types/analysis";

const STATUS_META: Record<
  StudentStatus,
  { label: string; bg: string; text: string; ring: string }
> = {
  EXCELLENT: { label: "우수", bg: "bg-emerald-500/10", text: "text-emerald-700", ring: "ring-emerald-500/30" },
  GOOD: { label: "양호", bg: "bg-blue-500/10", text: "text-blue-700", ring: "ring-blue-500/30" },
  AVERAGE: { label: "보통", bg: "bg-muted", text: "text-muted-foreground", ring: "ring-border" },
  NEEDS_HELP: { label: "도움필요", bg: "bg-rose-500/10", text: "text-rose-700", ring: "ring-rose-500/30" },
};

const SORT_OPTIONS = [
  { key: "name", label: "이름" },
  { key: "score", label: "점수" },
  { key: "studyTime", label: "학습시간" },
  { key: "lastActive", label: "최근활동" },
] as const;

type SortKey = (typeof SORT_OPTIONS)[number]["key"];

export default function CourseStudentsPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const resolvedParams = use(params);
  const courseId = Number(resolvedParams.courseId);
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isInstructor = user?.role === "INSTRUCTOR";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StudentStatus | "ALL">("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("score");

  const { data: course } = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => getCourseById(courseId),
  });

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["courseStudents", courseId],
    queryFn: () => getCourseStudents(courseId),
    enabled: isInstructor,
  });

  const { data: atRiskStudents = [] } = useQuery({
    queryKey: ["atRiskStudents", courseId],
    queryFn: () => getAtRiskStudents(courseId, 10),
    enabled: isInstructor,
  });

  const [careTarget, setCareTarget] = useState<AtRiskStudent | null>(null);

  const filtered = useMemo(() => {
    let list = [...students];
    if (statusFilter !== "ALL") {
      list = list.filter((s) => s.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      switch (sortKey) {
        case "name":
          return a.name.localeCompare(b.name, "ko");
        case "score":
          return (b.averageScore ?? 0) - (a.averageScore ?? 0);
        case "studyTime":
          return (b.totalStudyTime ?? 0) - (a.totalStudyTime ?? 0);
        case "lastActive": {
          const ta = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : 0;
          const tb = b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : 0;
          return tb - ta;
        }
      }
    });
    return list;
  }, [students, statusFilter, search, sortKey]);

  const distribution = useMemo(() => {
    const dist: Record<StudentStatus, number> = {
      EXCELLENT: 0,
      GOOD: 0,
      AVERAGE: 0,
      NEEDS_HELP: 0,
    };
    students.forEach((s) => {
      dist[s.status] = (dist[s.status] ?? 0) + 1;
    });
    return dist;
  }, [students]);

  if (!isInstructor) {
    return (
      <MainLayout>
        <div className="py-20 text-center text-muted-foreground font-medium">
          교강사만 접근할 수 있는 페이지입니다.
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="w-full py-8">
        {/* 헤더 */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => router.push(`/courses/${courseId}`)}
            className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            강의로 돌아가기
          </button>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-11 h-11 rounded-2xl bg-blue-500/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              {course?.title && (
                <p className="text-xs font-bold text-blue-600 mb-0.5">{course.title}</p>
              )}
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
                수강생 관리
              </h1>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="py-32 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
            <p className="text-muted-foreground font-medium">수강생 정보를 불러오는 중...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="bg-card border border-border rounded-3xl p-16 flex flex-col items-center justify-center text-center shadow-sm">
            <Users className="w-16 h-16 text-muted-foreground/40 mb-5" />
            <h2 className="text-xl font-black text-foreground mb-2">아직 수강생이 없습니다</h2>
            <p className="text-muted-foreground font-medium">초대 코드를 학생들에게 공유해보세요.</p>
          </div>
        ) : (
          <>
            {/* AI — 케어가 필요한 학생 */}
            {atRiskStudents.length > 0 && (
              <AtRiskPanel
                items={atRiskStudents}
                onCare={(s) => setCareTarget(s)}
              />
            )}

            {/* 분포 카드 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {(Object.keys(STATUS_META) as StudentStatus[]).map((status) => {
                const meta = STATUS_META[status];
                const active = statusFilter === status;
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(active ? "ALL" : status)}
                    className={`bg-card border rounded-2xl p-5 text-left transition-all ${
                      active
                        ? "border-blue-400 shadow-md ring-2 ring-blue-100"
                        : "border-border hover:border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-[11px] font-black px-2 py-0.5 rounded-full ${meta.bg} ${meta.text}`}
                      >
                        {meta.label}
                      </span>
                    </div>
                    <p className="text-2xl font-black text-foreground">
                      {distribution[status]}
                      <span className="text-sm font-bold text-muted-foreground ml-1">명</span>
                    </p>
                  </button>
                );
              })}
            </div>

            {/* 검색 / 정렬 */}
            <div className="bg-card border border-border rounded-2xl p-4 mb-4 flex flex-col md:flex-row md:items-center gap-3 shadow-sm">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="이름 또는 이메일로 검색"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-10 pl-9 pr-4 rounded-xl border border-border bg-card focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 font-medium text-sm"
                />
              </div>
              <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setSortKey(opt.key)}
                    className={`text-xs font-bold px-3 h-8 rounded-lg transition-colors ${
                      sortKey === opt.key
                        ? "bg-card text-blue-600 shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 학생 목록 */}
            {filtered.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground font-medium">
                조건에 맞는 수강생이 없습니다.
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((student) => (
                  <StudentRow key={student.userId} student={student} courseId={courseId} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* AI 케어 메시지 모달 */}
      {careTarget && (
        <CareMessageModal
          courseId={courseId}
          target={careTarget}
          onClose={() => setCareTarget(null)}
        />
      )}
    </MainLayout>
  );
}

// ─────────────────────────────────────────────────────────────────
// At-Risk 패널 — 강사 진입 시 자동 표시
// ─────────────────────────────────────────────────────────────────
function AtRiskPanel({
  items,
  onCare,
}: {
  items: AtRiskStudent[];
  onCare: (s: AtRiskStudent) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const high = items.filter((i) => i.riskLevel === "HIGH").length;

  return (
    <div className="bg-gradient-to-br from-rose-500/10 to-amber-500/10 border border-rose-500/20 rounded-3xl p-6 mb-6 shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-rose-500/15 flex items-center justify-center shrink-0">
            <Heart className="w-5 h-5 text-rose-600" />
          </div>
          <div className="text-left">
            <p className="text-sm font-black text-foreground">
              케어가 필요한 학생 {items.length}명
              {high > 0 && (
                <span className="ml-2 text-[11px] font-black text-rose-700">
                  (위험 {high}명)
                </span>
              )}
            </p>
            <p className="text-[11px] font-bold text-muted-foreground mt-0.5">
              AI 가 학습 활동·정답률·과제 제출 등을 종합해 진단했어요
            </p>
          </div>
        </div>
        <span className="text-xs font-bold text-rose-600">
          {expanded ? "접기" : "펼치기"}
        </span>
      </button>

      {expanded && (
        <ul className="mt-4 space-y-2">
          {items.map((s) => (
            <AtRiskRow key={s.userId} student={s} onCare={() => onCare(s)} />
          ))}
        </ul>
      )}
    </div>
  );
}

function AtRiskRow({
  student,
  onCare,
}: {
  student: AtRiskStudent;
  onCare: () => void;
}) {
  const levelMeta =
    student.riskLevel === "HIGH"
      ? { label: "위험", bg: "bg-rose-500/15", text: "text-rose-700", ring: "ring-rose-500/30" }
      : { label: "주의", bg: "bg-amber-500/15", text: "text-amber-700", ring: "ring-amber-500/30" };

  return (
    <li className="flex items-center justify-between gap-3 p-3 bg-card border border-border rounded-2xl">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center text-white font-black shrink-0">
          {student.name.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <p className="text-sm font-black text-foreground truncate">
              {student.name}
            </p>
            <span
              className={`text-[10px] font-black px-2 py-0.5 rounded-full ring-1 ${levelMeta.bg} ${levelMeta.text} ${levelMeta.ring}`}
            >
              {levelMeta.label} · {student.riskScore}점
            </span>
          </div>
          {student.reasons.length > 0 && (
            <p className="text-[11px] font-medium text-muted-foreground line-clamp-1">
              {student.reasons.join(" · ")}
            </p>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onCare}
        className="shrink-0 inline-flex items-center gap-1 px-3 h-9 bg-gradient-to-r from-violet-500 to-blue-500 text-white text-xs font-bold rounded-xl hover:shadow-md transition-all"
      >
        <Sparkles className="w-3.5 h-3.5" />
        AI 케어 메시지
      </button>
    </li>
  );
}

// ─────────────────────────────────────────────────────────────────
// 케어 메시지 모달 — AI 가 즉석에서 초안 생성
// ─────────────────────────────────────────────────────────────────
function CareMessageModal({
  courseId,
  target,
  onClose,
}: {
  courseId: number;
  target: AtRiskStudent;
  onClose: () => void;
}) {
  const [result, setResult] = useState<CareMessage | null>(null);
  const [copied, setCopied] = useState(false);

  const mutation = useMutation({
    mutationFn: () => generateCareMessage(courseId, target.userId),
    onSuccess: (data) => setResult(data),
    onError: (err: any) => alert(err?.response?.data?.message || "생성 실패"),
  });

  // 모달 열리는 순간 자동 호출
  React.useEffect(() => {
    mutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopy = async () => {
    if (!result?.message) return;
    try {
      await navigator.clipboard.writeText(result.message);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      alert("복사 실패");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-foreground/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-3xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-border flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-violet-500/15 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-violet-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-violet-600">AI 케어 메시지 초안</p>
              <p className="text-sm font-black text-foreground truncate">
                {target.name}님께 보낼 메시지
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* 위험 사유 컨텍스트 */}
          {target.reasons.length > 0 && (
            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <p className="text-[11px] font-black text-amber-700 mb-1.5 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                관찰된 어려움
              </p>
              <ul className="space-y-1">
                {target.reasons.map((r, i) => (
                  <li key={i} className="text-xs font-medium text-amber-800">
                    · {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {mutation.isPending || !result ? (
            <div className="py-12 flex flex-col items-center text-center">
              <Loader2 className="w-8 h-8 text-violet-500 animate-spin mb-3" />
              <p className="text-sm font-bold text-muted-foreground">
                AI 가 따뜻한 메시지를 작성 중입니다...
              </p>
            </div>
          ) : (
            <>
              <div className="bg-muted rounded-2xl p-4 mb-4">
                <p className="text-sm text-foreground font-medium whitespace-pre-wrap leading-relaxed">
                  {result.message}
                </p>
              </div>

              {result.suggestedActions.length > 0 && (
                <div className="mb-4">
                  <p className="text-[11px] font-black text-muted-foreground uppercase tracking-wider mb-2">
                    추가로 할 수 있는 액션
                  </p>
                  <ul className="space-y-1">
                    {result.suggestedActions.map((a, i) => (
                      <li key={i} className="text-xs font-medium text-foreground pl-3 relative">
                        <span className="absolute left-0 top-1.5 w-1 h-1 rounded-full bg-violet-500" />
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex-1 h-10 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <ClipboardCopy className="w-3.5 h-3.5" />
                  {copied ? "복사됨!" : "메시지 복사하기"}
                </button>
                <button
                  type="button"
                  onClick={() => mutation.mutate()}
                  className="px-4 h-10 bg-card border border-border hover:bg-muted text-muted-foreground text-xs font-bold rounded-xl"
                >
                  재생성
                </button>
              </div>

              <p className="text-[11px] font-medium text-muted-foreground mt-3 leading-relaxed">
                ※ AI 초안입니다. 검토·수정 후 학생에게 직접 전달하세요.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StudentRow({
  student,
  courseId,
}: {
  student: CourseStudentSummary;
  courseId: number;
}) {
  const meta = STATUS_META[student.status];
  const studyMinutes = Math.floor((student.totalStudyTime ?? 0) / 60);
  const studyHours = Math.floor(studyMinutes / 60);
  const studyTimeLabel =
    studyHours > 0 ? `${studyHours}시간 ${studyMinutes % 60}분` : `${studyMinutes}분`;

  const lastActive = student.lastActiveAt
    ? formatRelative(new Date(student.lastActiveAt))
    : "활동 없음";

  return (
    <Link
      href={`/courses/${courseId}/students/${student.userId}`}
      className="block bg-card border border-border rounded-2xl p-5 hover:border-blue-500/30 hover:shadow-md transition-all group"
    >
      <div className="flex items-center justify-between gap-4">
        {/* 좌측: 프로필 */}
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-black text-lg shrink-0">
            {student.name?.charAt(0) || "?"}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-black text-foreground truncate">{student.name}</h3>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full ${meta.bg} ${meta.text} ring-1 ${meta.ring}`}
              >
                {meta.label}
              </span>
            </div>
            <p className="text-xs font-bold text-muted-foreground truncate">{student.email}</p>
          </div>
        </div>

        {/* 중앙: 통계 */}
        <div className="hidden md:flex items-center gap-7 shrink-0">
          <Stat
            icon={<Award className="w-3.5 h-3.5" />}
            label="평균 점수"
            value={`${student.averageScore ?? 0}점`}
          />
          <Stat
            icon={<Target className="w-3.5 h-3.5" />}
            label="정답률"
            value={`${Math.round((student.correctRate ?? 0) * 100)}%`}
          />
          <Stat icon={<Clock className="w-3.5 h-3.5" />} label="학습시간" value={studyTimeLabel} />
          <Stat label="최근활동" value={lastActive} />
        </div>

        <ChevronRight className="w-5 h-5 text-muted-foreground/60 group-hover:text-blue-500 transition-colors shrink-0" />
      </div>

      {/* 모바일 통계 */}
      <div className="grid grid-cols-2 gap-3 mt-4 md:hidden">
        <MobileStat label="평균 점수" value={`${student.averageScore ?? 0}점`} />
        <MobileStat
          label="정답률"
          value={`${Math.round((student.correctRate ?? 0) * 100)}%`}
        />
        <MobileStat label="학습시간" value={studyTimeLabel} />
        <MobileStat label="최근활동" value={lastActive} />
      </div>
    </Link>
  );
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="text-right">
      <div className="flex items-center justify-end gap-1 text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-0.5">
        {icon}
        {label}
      </div>
      <p className="text-sm font-black text-foreground">{value}</p>
    </div>
  );
}

function MobileStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted rounded-xl px-3 py-2">
      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-sm font-black text-foreground">{value}</p>
    </div>
  );
}

function formatRelative(date: Date): string {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return `${date.getMonth() + 1}/${date.getDate()}`;
}
