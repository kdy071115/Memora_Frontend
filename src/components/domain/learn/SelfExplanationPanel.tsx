"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Brain,
  Loader2,
  Send,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Sparkles,
  RotateCcw,
  ListChecks,
  History,
  ChevronDown,
  TrendingUp,
} from "lucide-react";
import {
  submitSelfExplanation,
  getLectureSelfExplainHistory,
  type SelfExplainResult,
  type SelfExplainHistoryItem,
} from "@/lib/api/selfExplain";

interface Props {
  lectureId: number;
}

const GRADE_META: Record<
  SelfExplainResult["grade"],
  { label: string; color: string; bg: string; ring: string }
> = {
  EXCELLENT: {
    label: "훌륭해요!",
    color: "text-emerald-700",
    bg: "bg-emerald-500/10",
    ring: "ring-emerald-500/30",
  },
  GOOD: {
    label: "잘하고 있어요",
    color: "text-blue-700",
    bg: "bg-blue-500/10",
    ring: "ring-blue-500/30",
  },
  NEEDS_WORK: {
    label: "조금 더 보완해보세요",
    color: "text-amber-700",
    bg: "bg-amber-500/10",
    ring: "ring-amber-500/30",
  },
};

export default function SelfExplanationPanel({ lectureId }: Props) {
  const [text, setText] = useState("");
  const [focusTopic, setFocusTopic] = useState("");
  const [showFocus, setShowFocus] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: history = [] } = useQuery({
    queryKey: ["selfExplainHistory", lectureId],
    queryFn: () => getLectureSelfExplainHistory(lectureId),
  });

  const mutation = useMutation({
    mutationFn: () =>
      submitSelfExplanation(lectureId, text.trim(), focusTopic.trim() || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["selfExplainHistory", lectureId] });
      queryClient.invalidateQueries({ queryKey: ["mySelfExplainHistory"] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      alert(msg || "AI 코치 호출에 실패했습니다. 잠시 후 다시 시도해주세요.");
    },
  });

  const result = mutation.data;
  const isPending = mutation.isPending;
  const charCount = text.trim().length;
  const tooShort = charCount > 0 && charCount < 20;
  const canSubmit = charCount >= 20 && !isPending;

  const handleReset = () => {
    setText("");
    setFocusTopic("");
    setShowFocus(false);
    mutation.reset();
  };

  return (
    <div className="bg-gradient-to-br from-violet-500/10 via-blue-500/10 to-card border border-violet-500/20 rounded-3xl shadow-sm overflow-hidden">
      {/* 헤더 */}
      <div className="px-8 py-6 border-b border-violet-500/20 bg-card/40">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center shrink-0">
            <Brain className="w-6 h-6 text-violet-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-black text-foreground flex items-center gap-2">
              자기 설명 코칭
              <span className="text-xs font-bold bg-violet-500/15 text-violet-700 px-2 py-0.5 rounded-full">
                AI 메타인지 학습
              </span>
            </h2>
            <p className="text-sm font-medium text-muted-foreground mt-1 leading-relaxed">
              방금 학습한 내용을 <strong className="text-foreground">본인 말로</strong> 설명해보세요. AI가
              잘 이해한 부분과 빠뜨린 개념, 오개념을 짚어줍니다. 진짜로 이해했는지 스스로 확인하는 가장 강력한
              방법이에요.
            </p>
          </div>
        </div>
      </div>

      {/* 입력 영역 */}
      <div className="p-8">
        {!result ? (
          <>
            {showFocus && (
              <div className="mb-4">
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                  특정 주제에 집중하고 싶다면 (선택)
                </label>
                <input
                  type="text"
                  value={focusTopic}
                  onChange={(e) => setFocusTopic(e.target.value)}
                  placeholder="예: 광합성의 명반응"
                  disabled={isPending}
                  className="w-full h-11 px-4 rounded-xl border border-border bg-card focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 font-medium text-sm"
                />
              </div>
            )}

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="여기에 본인의 말로 자유롭게 설명해보세요. 마치 친구에게 가르쳐주듯이 작성하면 가장 효과가 좋아요. (최소 20자)"
              disabled={isPending}
              rows={7}
              className="w-full p-4 rounded-2xl border border-border bg-card focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 font-medium text-foreground leading-relaxed resize-none disabled:opacity-50"
            />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-bold ${
                    tooShort
                      ? "text-amber-600"
                      : charCount === 0
                      ? "text-muted-foreground"
                      : "text-emerald-600"
                  }`}
                >
                  {charCount} / 20자 이상
                </span>
                {!showFocus && (
                  <button
                    type="button"
                    onClick={() => setShowFocus(true)}
                    className="text-xs font-bold text-violet-600 hover:underline"
                  >
                    + 특정 주제 설정
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => mutation.mutate()}
                disabled={!canSubmit}
                className="h-12 px-6 bg-gradient-to-r from-violet-600 to-blue-600 text-white font-bold rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:shadow-none"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    AI 코치 분석 중...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    AI 코치에게 보여주기
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <ResultView result={result} explanation={text} onRetry={handleReset} />
        )}

        {/* ── 이전 기록 요약 ── */}
        {history.length > 0 && (
          <div className="mt-6 border-t border-violet-500/20 pt-5">
            <button
              type="button"
              onClick={() => setHistoryOpen((v) => !v)}
              className="w-full flex items-center justify-between gap-2 group"
            >
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-violet-500" />
                <span className="text-sm font-black text-foreground">
                  내 자기 설명 기록 ({history.length}회)
                </span>
                {history.length >= 2 && <GrowthBadge history={history} />}
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/retrospective"
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs font-bold text-violet-600 hover:underline flex items-center gap-1"
                >
                  <TrendingUp className="w-3 h-3" />
                  전체 회고 보기
                </Link>
                <ChevronDown
                  className={`w-4 h-4 text-muted-foreground transition-transform ${
                    historyOpen ? "rotate-180" : ""
                  }`}
                />
              </div>
            </button>

            {historyOpen && (
              <div className="mt-4 space-y-3">
                {history.map((item) => (
                  <HistoryRow key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function GrowthBadge({ history }: { history: SelfExplainHistoryItem[] }) {
  // history는 최신순 → 최신 점수 vs 최초 점수
  const latest = history[0]?.overallScore;
  const first = history[history.length - 1]?.overallScore;
  if (latest == null || first == null) return null;
  const diff = latest - first;
  if (diff === 0) return null;
  const positive = diff > 0;
  return (
    <span
      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
        positive ? "bg-emerald-500/15 text-emerald-700" : "bg-rose-500/15 text-rose-700"
      }`}
    >
      {positive ? "▲" : "▼"} {Math.abs(diff)}점
    </span>
  );
}

function HistoryRow({ item }: { item: SelfExplainHistoryItem }) {
  const meta = item.grade ? GRADE_META[item.grade] : GRADE_META.NEEDS_WORK;
  const date = new Date(item.createdAt);
  const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(
    2,
    "0"
  )}:${String(date.getMinutes()).padStart(2, "0")}`;

  return (
    <details className="bg-card border border-border rounded-2xl px-4 py-3 group">
      <summary className="cursor-pointer flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-xl ${meta.bg} ring-1 ${meta.ring} flex items-center justify-center shrink-0`}
          >
            <span className={`text-sm font-black ${meta.color}`}>{item.overallScore ?? "-"}</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-muted-foreground">{dateStr}</p>
            <p className="text-sm font-bold text-foreground truncate">
              {item.focusTopic || (item.explanation ? item.explanation.slice(0, 40) + "…" : "자기 설명")}
            </p>
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 group-open:rotate-180 transition-transform" />
      </summary>
      <div className="mt-3 pt-3 border-t border-border space-y-3">
        {item.explanation && (
          <div>
            <p className="text-[11px] font-black text-muted-foreground mb-1">내가 작성한 설명</p>
            <p className="text-xs text-muted-foreground font-medium whitespace-pre-wrap leading-relaxed">
              {item.explanation}
            </p>
          </div>
        )}
        {item.strengths.length > 0 && (
          <MiniList title="잘 이해한 부분" items={item.strengths} dot="bg-emerald-400" />
        )}
        {item.missingConcepts.length > 0 && (
          <MiniList title="빠뜨린 개념" items={item.missingConcepts} dot="bg-amber-400" />
        )}
        {item.misconceptions.length > 0 && (
          <MiniList title="오개념" items={item.misconceptions} dot="bg-rose-400" />
        )}
      </div>
    </details>
  );
}

function MiniList({ title, items, dot }: { title: string; items: string[]; dot: string }) {
  return (
    <div>
      <p className="text-[11px] font-black text-muted-foreground mb-1">{title}</p>
      <ul className="space-y-1">
        {items.map((it, i) => (
          <li key={i} className="text-xs text-muted-foreground font-medium pl-3 relative leading-relaxed">
            <span className={`absolute left-0 top-1.5 w-1 h-1 rounded-full ${dot}`} />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ResultView({
  result,
  explanation,
  onRetry,
}: {
  result: SelfExplainResult;
  explanation: string;
  onRetry: () => void;
}) {
  const meta = GRADE_META[result.grade] ?? GRADE_META.NEEDS_WORK;

  return (
    <div className="space-y-5">
      {/* 점수 / 등급 */}
      <div className={`rounded-2xl ${meta.bg} ring-1 ${meta.ring} px-6 py-5 flex items-center justify-between`}>
        <div>
          <p className={`text-xs font-bold uppercase tracking-wider ${meta.color}`}>{result.grade}</p>
          <p className={`text-2xl font-black ${meta.color}`}>{meta.label}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-muted-foreground">종합 점수</p>
          <p className={`text-4xl font-black ${meta.color}`}>{result.overallScore}</p>
        </div>
      </div>

      {/* 피드백 */}
      {result.feedback && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <h3 className="text-sm font-black text-foreground">코치의 한 마디</h3>
          </div>
          <p className="text-muted-foreground font-medium leading-relaxed">{result.feedback}</p>
        </div>
      )}

      {/* 강점 */}
      {result.strengths.length > 0 && (
        <Section
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          title="잘 이해한 부분"
          color="emerald"
          items={result.strengths}
        />
      )}

      {/* 누락된 개념 */}
      {result.missingConcepts.length > 0 && (
        <Section
          icon={<Lightbulb className="w-4 h-4 text-amber-500" />}
          title="빠뜨린 핵심 개념"
          color="amber"
          items={result.missingConcepts}
        />
      )}

      {/* 오개념 */}
      {result.misconceptions.length > 0 && (
        <Section
          icon={<AlertTriangle className="w-4 h-4 text-rose-500" />}
          title="다시 생각해볼 부분 (오개념)"
          color="rose"
          items={result.misconceptions}
        />
      )}

      {/* 다음 단계 */}
      {result.suggestedNextSteps.length > 0 && (
        <Section
          icon={<ListChecks className="w-4 h-4 text-blue-500" />}
          title="추천 다음 단계"
          color="blue"
          items={result.suggestedNextSteps}
        />
      )}

      {/* 내가 쓴 글 (접힌 형태) */}
      <details className="bg-muted border border-border rounded-2xl px-5 py-4 group">
        <summary className="text-sm font-bold text-muted-foreground cursor-pointer">
          내가 작성한 설명 보기
        </summary>
        <p className="mt-3 text-sm text-muted-foreground font-medium whitespace-pre-wrap leading-relaxed">
          {explanation}
        </p>
      </details>

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={onRetry}
          className="h-11 px-5 bg-card border border-border hover:border-violet-300 hover:text-violet-600 text-muted-foreground font-bold rounded-xl flex items-center gap-2 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          다시 작성하기
        </button>
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  items,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
  color: "emerald" | "amber" | "rose" | "blue";
}) {
  const colorMap = {
    emerald: "border-emerald-500/20 bg-emerald-500/10",
    amber: "border-amber-500/20 bg-amber-500/10",
    rose: "border-rose-500/20 bg-rose-500/10",
    blue: "border-blue-500/20 bg-blue-500/10",
  };
  return (
    <div className={`rounded-2xl border ${colorMap[color]} p-5`}>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="text-sm font-black text-foreground">{title}</h3>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-muted-foreground font-medium leading-relaxed pl-4 relative">
            <span className="absolute left-0 top-2 w-1.5 h-1.5 rounded-full bg-muted-foreground" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
