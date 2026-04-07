"use client";
import React, { useMemo, useState } from "react";
import Link from "next/link";
import MainLayout from "@/components/layout/MainLayout";
import { useQuery } from "@tanstack/react-query";
import {
  getMySelfExplainHistory,
  type SelfExplainHistoryItem,
} from "@/lib/api/selfExplain";
import {
  Brain,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  Sparkles,
  BookOpen,
  ArrowRight,
  ListChecks,
} from "lucide-react";
import { useAuthStore } from "@/lib/store/useAuthStore";

const GRADE_META: Record<
  "EXCELLENT" | "GOOD" | "NEEDS_WORK",
  { label: string; color: string; bg: string; ring: string }
> = {
  EXCELLENT: { label: "훌륭", color: "text-emerald-700", bg: "bg-emerald-50", ring: "ring-emerald-200" },
  GOOD: { label: "양호", color: "text-blue-700", bg: "bg-blue-50", ring: "ring-blue-200" },
  NEEDS_WORK: { label: "보완필요", color: "text-amber-700", bg: "bg-amber-50", ring: "ring-amber-200" },
};

export default function RetrospectivePage() {
  const user = useAuthStore((s) => s.user);
  const isStudent = user?.role === "STUDENT";

  const { data: history = [], isLoading } = useQuery({
    queryKey: ["mySelfExplainHistory"],
    queryFn: getMySelfExplainHistory,
    enabled: isStudent,
  });

  // 강의별 그룹핑 (lectureId 기준). 각 그룹 안은 최신순.
  const grouped = useMemo(() => {
    const map = new Map<number, { lectureId: number; lectureTitle: string; courseId: number | null; courseTitle: string | null; items: SelfExplainHistoryItem[] }>();
    for (const item of history) {
      const key = item.lectureId;
      if (!map.has(key)) {
        map.set(key, {
          lectureId: item.lectureId,
          lectureTitle: item.lectureTitle,
          courseId: item.courseId,
          courseTitle: item.courseTitle,
          items: [],
        });
      }
      map.get(key)!.items.push(item);
    }
    // history가 최신순이므로 items도 최신순. 그룹은 가장 최근 작성된 강의 순.
    return Array.from(map.values()).sort((a, b) => {
      const ta = new Date(a.items[0].createdAt).getTime();
      const tb = new Date(b.items[0].createdAt).getTime();
      return tb - ta;
    });
  }, [history]);

  const stats = useMemo(() => {
    if (history.length === 0) return null;
    const scores = history.map((h) => h.overallScore ?? 0);
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    // 시간순으로 정렬해서 최초 vs 최근
    const byTime = [...history].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    const first = byTime[0]?.overallScore ?? 0;
    const latest = byTime[byTime.length - 1]?.overallScore ?? 0;
    const lectureCount = new Set(history.map((h) => h.lectureId)).size;
    return { count: history.length, avg, first, latest, growth: latest - first, lectureCount };
  }, [history]);

  if (!isStudent) {
    return (
      <MainLayout>
        <div className="py-20 text-center text-slate-500 font-medium">
          학생 계정에서만 이용할 수 있는 페이지입니다.
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="w-full py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-2xl bg-violet-500/10 flex items-center justify-center">
              <Brain className="w-6 h-6 text-violet-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-800">
              학습 회고
            </h1>
          </div>
          <p className="text-slate-500 font-medium ml-14">
            자기 설명 기록을 모아서 보고, 내가 얼마나 성장했는지 돌아보세요.
          </p>
        </div>

        {isLoading ? (
          <div className="py-32 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-violet-500 animate-spin mb-4" />
            <p className="text-slate-500 font-medium">기록을 불러오는 중입니다...</p>
          </div>
        ) : history.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* 통계 카드 */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                <StatCard label="총 작성 횟수" value={`${stats.count}회`} icon={<ListChecks className="w-5 h-5" />} />
                <StatCard label="평균 점수" value={`${stats.avg}점`} icon={<Sparkles className="w-5 h-5" />} />
                <StatCard label="학습한 차시" value={`${stats.lectureCount}개`} icon={<BookOpen className="w-5 h-5" />} />
                <GrowthCard first={stats.first} latest={stats.latest} growth={stats.growth} />
              </div>
            )}

            {/* 강의별 그룹 */}
            <div className="space-y-6">
              {grouped.map((group) => (
                <LectureGroup key={group.lectureId} group={group} />
              ))}
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}

function EmptyState() {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-16 flex flex-col items-center justify-center text-center shadow-sm">
      <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mb-5">
        <Brain className="w-8 h-8 text-violet-400" />
      </div>
      <h2 className="text-xl font-black text-slate-700 mb-2">아직 자기 설명 기록이 없어요</h2>
      <p className="text-slate-400 font-medium mb-6">
        강의 학습 페이지에서 본인 말로 설명을 작성하면 여기에 모입니다.
      </p>
      <Link
        href="/courses"
        className="px-6 h-12 bg-gradient-to-r from-violet-600 to-blue-600 text-white font-bold rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center gap-2"
      >
        <BookOpen className="w-5 h-5" />
        강의 목록으로 가기
      </Link>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <div className="text-violet-400">{icon}</div>
      </div>
      <p className="text-2xl font-black text-slate-800">{value}</p>
    </div>
  );
}

function GrowthCard({ first, latest, growth }: { first: number; latest: number; growth: number }) {
  const positive = growth > 0;
  const negative = growth < 0;
  const colorClass = positive ? "text-emerald-600" : negative ? "text-rose-600" : "text-slate-500";
  const Icon = positive ? TrendingUp : negative ? TrendingDown : Minus;
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">성장 추이</p>
        <Icon className={`w-5 h-5 ${colorClass}`} />
      </div>
      <p className={`text-2xl font-black ${colorClass}`}>
        {positive ? "+" : ""}
        {growth}점
      </p>
      <p className="text-[11px] font-bold text-slate-400 mt-1">
        {first}점 → {latest}점
      </p>
    </div>
  );
}

function LectureGroup({
  group,
}: {
  group: {
    lectureId: number;
    lectureTitle: string;
    courseId: number | null;
    courseTitle: string | null;
    items: SelfExplainHistoryItem[];
  };
}) {
  const [open, setOpen] = useState(true);

  // 시간순(오래된 → 최신)으로 점수 시각화
  const chronological = useMemo(
    () => [...group.items].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [group.items]
  );
  const first = chronological[0]?.overallScore ?? 0;
  const latest = chronological[chronological.length - 1]?.overallScore ?? 0;
  const growth = latest - first;

  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-7 py-5 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-violet-500/10 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-violet-600" />
          </div>
          <div className="text-left min-w-0">
            {group.courseTitle && (
              <p className="text-xs font-bold text-violet-600 mb-0.5 truncate">{group.courseTitle}</p>
            )}
            <h2 className="text-lg font-black text-slate-800 truncate">{group.lectureTitle}</h2>
            <p className="text-xs font-bold text-slate-400 mt-0.5">
              {group.items.length}회 작성 · 평균 {Math.round(
                chronological.reduce((a, b) => a + (b.overallScore ?? 0), 0) / chronological.length
              )}점
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {chronological.length >= 2 && (
            <span
              className={`text-xs font-black px-3 py-1.5 rounded-full ${
                growth > 0
                  ? "bg-emerald-100 text-emerald-700"
                  : growth < 0
                  ? "bg-rose-100 text-rose-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {growth > 0 ? "▲" : growth < 0 ? "▼" : "—"} {Math.abs(growth)}점
            </span>
          )}
          <Link
            href={`/learn/${group.lectureId}`}
            onClick={(e) => e.stopPropagation()}
            className="text-xs font-bold text-violet-600 hover:underline flex items-center gap-1"
          >
            학습으로 <ArrowRight className="w-3 h-3" />
          </Link>
          <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      {open && (
        <div className="px-7 pb-7">
          {/* 점수 추이 미니 차트 */}
          {chronological.length >= 2 && <ScoreSparkline items={chronological} />}

          {/* 기록 목록 (최신순) */}
          <div className="mt-5 space-y-3">
            {group.items.map((item) => (
              <RecordCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreSparkline({ items }: { items: SelfExplainHistoryItem[] }) {
  const width = 100;
  const height = 36;
  const scores = items.map((i) => i.overallScore ?? 0);
  const max = Math.max(...scores, 100);
  const min = Math.min(...scores, 0);
  const range = max - min || 1;
  const points = scores
    .map((s, i) => {
      const x = (i / Math.max(scores.length - 1, 1)) * width;
      const y = height - ((s - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="bg-gradient-to-br from-violet-50 to-blue-50/50 rounded-2xl p-4 flex items-center gap-4">
      <div>
        <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider">점수 추이</p>
        <p className="text-xs font-bold text-slate-400 mt-0.5">
          {items.length}개의 기록 (오래된 순 →)
        </p>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="flex-1 h-10" preserveAspectRatio="none">
        <polyline
          fill="none"
          stroke="rgb(124 58 237)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
          vectorEffect="non-scaling-stroke"
        />
        {scores.map((s, i) => {
          const x = (i / Math.max(scores.length - 1, 1)) * width;
          const y = height - ((s - min) / range) * height;
          return <circle key={i} cx={x} cy={y} r="1.8" fill="rgb(124 58 237)" />;
        })}
      </svg>
    </div>
  );
}

function RecordCard({ item }: { item: SelfExplainHistoryItem }) {
  const meta = item.grade ? GRADE_META[item.grade] : GRADE_META.NEEDS_WORK;
  const date = new Date(item.createdAt);
  const dateStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(
    date.getDate()
  ).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

  return (
    <details className="bg-slate-50/60 border border-slate-100 rounded-2xl px-5 py-4 group">
      <summary className="cursor-pointer flex items-center justify-between gap-3">
        <div className="flex items-center gap-4 min-w-0">
          <div
            className={`w-12 h-12 rounded-xl ${meta.bg} ring-1 ${meta.ring} flex items-center justify-center shrink-0`}
          >
            <span className={`text-base font-black ${meta.color}`}>{item.overallScore ?? "-"}</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-400">{dateStr}</p>
            <p className="text-sm font-bold text-slate-700 truncate">
              {item.focusTopic || (item.explanation ? item.explanation.slice(0, 60) + "…" : "자기 설명")}
            </p>
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 group-open:rotate-180 transition-transform" />
      </summary>
      <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
        {item.explanation && (
          <div>
            <p className="text-xs font-black text-slate-400 mb-1.5">내가 작성한 설명</p>
            <p className="text-sm text-slate-600 font-medium whitespace-pre-wrap leading-relaxed">
              {item.explanation}
            </p>
          </div>
        )}
        {item.strengths.length > 0 && (
          <DetailList title="잘 이해한 부분" items={item.strengths} dot="bg-emerald-400" />
        )}
        {item.missingConcepts.length > 0 && (
          <DetailList title="빠뜨린 개념" items={item.missingConcepts} dot="bg-amber-400" />
        )}
        {item.misconceptions.length > 0 && (
          <DetailList title="오개념" items={item.misconceptions} dot="bg-rose-400" />
        )}
      </div>
    </details>
  );
}

function DetailList({ title, items, dot }: { title: string; items: string[]; dot: string }) {
  return (
    <div>
      <p className="text-xs font-black text-slate-400 mb-1.5">{title}</p>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="text-sm text-slate-600 font-medium pl-4 relative leading-relaxed">
            <span className={`absolute left-0 top-2 w-1.5 h-1.5 rounded-full ${dot}`} />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}
