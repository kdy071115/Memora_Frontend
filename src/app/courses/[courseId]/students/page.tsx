"use client";
import React, { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import { useQuery } from "@tanstack/react-query";
import { getCourseStudents } from "@/lib/api/analysis";
import { getCourseById } from "@/lib/api/courses";
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
} from "lucide-react";
import type { CourseStudentSummary, StudentStatus } from "@/types/analysis";

const STATUS_META: Record<
  StudentStatus,
  { label: string; bg: string; text: string; ring: string }
> = {
  EXCELLENT: { label: "우수", bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200" },
  GOOD: { label: "양호", bg: "bg-blue-50", text: "text-blue-700", ring: "ring-blue-200" },
  AVERAGE: { label: "보통", bg: "bg-slate-50", text: "text-slate-600", ring: "ring-slate-200" },
  NEEDS_HELP: { label: "도움필요", bg: "bg-rose-50", text: "text-rose-700", ring: "ring-rose-200" },
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
        <div className="py-20 text-center text-slate-500 font-medium">
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
            className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors mb-3"
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
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-800">
                수강생 관리
              </h1>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="py-32 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
            <p className="text-slate-500 font-medium">수강생 정보를 불러오는 중...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-16 flex flex-col items-center justify-center text-center shadow-sm">
            <Users className="w-16 h-16 text-slate-200 mb-5" />
            <h2 className="text-xl font-black text-slate-700 mb-2">아직 수강생이 없습니다</h2>
            <p className="text-slate-400 font-medium">초대 코드를 학생들에게 공유해보세요.</p>
          </div>
        ) : (
          <>
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
                    className={`bg-white border rounded-2xl p-5 text-left transition-all ${
                      active
                        ? "border-blue-400 shadow-md ring-2 ring-blue-100"
                        : "border-slate-100 hover:border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-[11px] font-black px-2 py-0.5 rounded-full ${meta.bg} ${meta.text}`}
                      >
                        {meta.label}
                      </span>
                    </div>
                    <p className="text-2xl font-black text-slate-800">
                      {distribution[status]}
                      <span className="text-sm font-bold text-slate-400 ml-1">명</span>
                    </p>
                  </button>
                );
              })}
            </div>

            {/* 검색 / 정렬 */}
            <div className="bg-white border border-slate-100 rounded-2xl p-4 mb-4 flex flex-col md:flex-row md:items-center gap-3 shadow-sm">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="이름 또는 이메일로 검색"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 font-medium text-sm"
                />
              </div>
              <div className="flex items-center gap-1 bg-slate-50 rounded-xl p-1">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setSortKey(opt.key)}
                    className={`text-xs font-bold px-3 h-8 rounded-lg transition-colors ${
                      sortKey === opt.key
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 학생 목록 */}
            {filtered.length === 0 ? (
              <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-400 font-medium">
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
    </MainLayout>
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
      className="block bg-white border border-slate-100 rounded-2xl p-5 hover:border-blue-200 hover:shadow-md transition-all group"
    >
      <div className="flex items-center justify-between gap-4">
        {/* 좌측: 프로필 */}
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-black text-lg shrink-0">
            {student.name?.charAt(0) || "?"}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-black text-slate-800 truncate">{student.name}</h3>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full ${meta.bg} ${meta.text} ring-1 ${meta.ring}`}
              >
                {meta.label}
              </span>
            </div>
            <p className="text-xs font-bold text-slate-400 truncate">{student.email}</p>
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

        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors shrink-0" />
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
      <div className="flex items-center justify-end gap-1 text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">
        {icon}
        {label}
      </div>
      <p className="text-sm font-black text-slate-700">{value}</p>
    </div>
  );
}

function MobileStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-xl px-3 py-2">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-black text-slate-700">{value}</p>
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
