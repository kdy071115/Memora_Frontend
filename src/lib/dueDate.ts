/**
 * 과제 마감일 관련 헬퍼.
 *
 * - daysUntil(): 양수 = 남은 일수, 0 = 오늘, 음수 = 마감 후
 * - dueStatus(): 카드/뱃지에 사용할 정규화 상태와 라벨/색상
 *
 * "오늘"은 자정 기준으로 오늘이 마감인 경우 + 임박 (24h 이내) 도 포함.
 */

export interface DueStatus {
  /** "OVERDUE" | "TODAY" | "URGENT" | "SOON" | "NORMAL" | "NONE" */
  kind: "OVERDUE" | "TODAY" | "URGENT" | "SOON" | "NORMAL" | "NONE";
  /** "마감", "오늘 마감", "D-2", "D-7" 등 */
  label: string;
  /** Tailwind 색 토큰 — 카드 / 뱃지 / 막대에 사용 */
  textClass: string;
  bgClass: string;
  ringClass: string;
}

export function daysUntil(dueDate: string | null | undefined): number | null {
  if (!dueDate) return null;
  const due = new Date(dueDate).getTime();
  if (isNaN(due)) return null;
  const now = Date.now();
  const msPerDay = 24 * 60 * 60 * 1000;
  // 일수 차이를 일 단위로 round (오늘 자정 기준이 아닌 24h 단위 — 시간이 빠뜨려지지 않도록)
  return Math.ceil((due - now) / msPerDay);
}

export function dueStatus(dueDate: string | null | undefined): DueStatus {
  if (!dueDate) {
    return {
      kind: "NONE",
      label: "마감 없음",
      textClass: "text-slate-400",
      bgClass: "bg-slate-50",
      ringClass: "ring-slate-200",
    };
  }
  const days = daysUntil(dueDate);
  if (days === null) {
    return {
      kind: "NONE",
      label: "마감 없음",
      textClass: "text-slate-400",
      bgClass: "bg-slate-50",
      ringClass: "ring-slate-200",
    };
  }
  if (days < 0) {
    return {
      kind: "OVERDUE",
      label: "마감",
      textClass: "text-rose-700",
      bgClass: "bg-rose-50",
      ringClass: "ring-rose-200",
    };
  }
  if (days === 0) {
    return {
      kind: "TODAY",
      label: "오늘 마감",
      textClass: "text-rose-700",
      bgClass: "bg-rose-50",
      ringClass: "ring-rose-200",
    };
  }
  if (days <= 2) {
    return {
      kind: "URGENT",
      label: `D-${days}`,
      textClass: "text-orange-700",
      bgClass: "bg-orange-50",
      ringClass: "ring-orange-200",
    };
  }
  if (days <= 7) {
    return {
      kind: "SOON",
      label: `D-${days}`,
      textClass: "text-amber-700",
      bgClass: "bg-amber-50",
      ringClass: "ring-amber-200",
    };
  }
  return {
    kind: "NORMAL",
    label: `D-${days}`,
    textClass: "text-slate-500",
    bgClass: "bg-slate-50",
    ringClass: "ring-slate-200",
  };
}
