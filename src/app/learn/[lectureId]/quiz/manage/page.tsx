"use client";
import React, { use, useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getQuizzesForManagement,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  generateQuiz,
} from "@/lib/api/quiz";
import { useAuthStore } from "@/lib/store/useAuthStore";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Sparkles,
  Pencil,
  Trash2,
  Check,
  X,
  ListChecks,
  Lock,
  AlertCircle,
} from "lucide-react";
import type { QuizDetail, QuizCreateRequest } from "@/types/quiz";

type QuizType = "MULTIPLE_CHOICE" | "SHORT_ANSWER" | "ESSAY";
type Difficulty = "EASY" | "MEDIUM" | "HARD";

const EMPTY_FORM: QuizCreateRequest = {
  question: "",
  quizType: "MULTIPLE_CHOICE",
  options: ["", "", "", ""],
  correctAnswer: "",
  explanation: "",
  difficulty: "MEDIUM",
  conceptTag: "",
};

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  EASY: "쉬움",
  MEDIUM: "보통",
  HARD: "어려움",
};

const TYPE_LABEL: Record<QuizType, string> = {
  MULTIPLE_CHOICE: "객관식",
  SHORT_ANSWER: "단답형",
  ESSAY: "서술형",
};

export default function QuizManagePage({
  params,
}: {
  params: Promise<{ lectureId: string }>;
}) {
  const resolvedParams = use(params);
  const lectureId = Number(resolvedParams.lectureId);
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const isInstructor = user?.role === "INSTRUCTOR";

  // 학생 접근 차단
  useEffect(() => {
    if (user && !isInstructor) {
      router.replace(`/learn/${lectureId}/quiz`);
    }
  }, [user, isInstructor, router, lectureId]);

  // ───── 상태 ─────
  const [form, setForm] = useState<QuizCreateRequest>(EMPTY_FORM);
  const [editingQuizId, setEditingQuizId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  // AI 자동 생성 패널 상태
  const [aiCount, setAiCount] = useState(5);
  const [aiDifficulty, setAiDifficulty] = useState<Difficulty>("MEDIUM");
  const [aiType, setAiType] = useState<QuizType>("MULTIPLE_CHOICE");

  // ───── 데이터 ─────
  const { data: quizzes = [], isLoading } = useQuery({
    queryKey: ["quizzesManage", lectureId],
    queryFn: () => getQuizzesForManagement(lectureId),
    enabled: !!lectureId && isInstructor,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["quizzesManage", lectureId] });
    queryClient.invalidateQueries({ queryKey: ["quizzes", lectureId] });
  };

  // ───── 뮤테이션 ─────
  const createMutation = useMutation({
    mutationFn: (data: QuizCreateRequest) => createQuiz(lectureId, data),
    onSuccess: () => {
      invalidate();
      resetForm();
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || "문제 생성에 실패했습니다.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ quizId, data }: { quizId: number; data: QuizCreateRequest }) =>
      updateQuiz(quizId, data),
    onSuccess: () => {
      invalidate();
      resetForm();
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || "문제 수정에 실패했습니다.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (quizId: number) => deleteQuiz(quizId),
    onSuccess: () => invalidate(),
    onError: (err: any) => {
      alert(err?.response?.data?.message || "문제 삭제에 실패했습니다. 풀이 기록이 있는 문제는 삭제할 수 없습니다.");
    },
  });

  const generateMutation = useMutation({
    mutationFn: () =>
      generateQuiz(lectureId, {
        count: aiCount,
        difficulty: aiDifficulty,
        types: [aiType],
      }),
    onSuccess: () => invalidate(),
    onError: (err: any) => {
      alert(err?.response?.data?.message || "AI 자동 생성에 실패했습니다. 차시에 학습 자료가 업로드되어 있는지 확인해주세요.");
    },
  });

  // ───── 핸들러 ─────
  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingQuizId(null);
    setShowForm(false);
  };

  const startEdit = (quiz: QuizDetail) => {
    setEditingQuizId(quiz.id);
    setForm({
      question: quiz.question,
      quizType: quiz.quizType,
      options: quiz.options ?? ["", "", "", ""],
      correctAnswer: quiz.correctAnswer,
      explanation: quiz.explanation ?? "",
      difficulty: quiz.difficulty,
      conceptTag: quiz.conceptTag ?? "",
    });
    setShowForm(true);
    // 폼이 있는 위쪽으로 스크롤
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.question.trim()) {
      alert("질문 내용을 입력하세요.");
      return;
    }
    if (!form.correctAnswer.trim()) {
      alert("정답을 입력하세요.");
      return;
    }
    if (form.quizType === "MULTIPLE_CHOICE") {
      const opts = (form.options ?? []).filter((o) => o.trim() !== "");
      if (opts.length < 2) {
        alert("객관식 보기는 2개 이상 입력해야 합니다.");
        return;
      }
      if (!opts.includes(form.correctAnswer.trim())) {
        alert("정답은 보기 중 하나와 정확히 일치해야 합니다.");
        return;
      }
    }

    const payload: QuizCreateRequest = {
      ...form,
      question: form.question.trim(),
      correctAnswer: form.correctAnswer.trim(),
      explanation: form.explanation?.trim() || "",
      conceptTag: form.conceptTag?.trim() || "",
      options:
        form.quizType === "MULTIPLE_CHOICE"
          ? (form.options ?? []).filter((o) => o.trim() !== "")
          : undefined,
    };

    if (editingQuizId !== null) {
      updateMutation.mutate({ quizId: editingQuizId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (quizId: number, question: string) => {
    if (!confirm(`"${question.slice(0, 30)}..." 문제를 삭제하시겠습니까?`)) return;
    deleteMutation.mutate(quizId);
  };

  const handleOptionChange = (idx: number, value: string) => {
    setForm((prev) => {
      const next = [...(prev.options ?? ["", "", "", ""])];
      next[idx] = value;
      return { ...prev, options: next };
    });
  };

  // ───── 권한 차단 화면 ─────
  if (!user) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }
  if (!isInstructor) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Lock className="w-12 h-12 text-slate-300" />
          <p className="text-slate-500 font-medium">교강사만 접근할 수 있는 페이지입니다.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex flex-col w-full py-8 text-slate-800 max-w-5xl mx-auto">
        {/* ── 헤더 ── */}
        <Link
          href={`/learn/${lectureId}`}
          className="inline-flex items-center text-slate-500 font-bold hover:text-primary mb-6 transition-colors w-max"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          학습 뷰로 돌아가기
        </Link>

        <div className="mb-10">
          <span className="inline-flex px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-sm font-bold text-primary mb-3">
            교강사 전용
          </span>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">퀴즈 관리</h1>
          <p className="text-slate-500 font-medium text-lg">
            학생들이 풀 복습 퀴즈를 직접 출제하거나, AI가 자료에 맞춰 생성한 초안을 다듬어보세요.
          </p>
        </div>

        {/* ── AI 자동 생성 패널 ── */}
        <div className="bg-gradient-to-br from-primary/5 via-blue-50/50 to-indigo-50/50 border border-primary/15 rounded-[2rem] p-8 mb-8">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800">AI 자동 출제</h2>
              <p className="text-sm text-slate-500 font-medium">
                업로드된 자료를 분석해 문제 초안을 생성합니다. 생성 후 직접 수정/삭제할 수 있습니다.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">문제 수</label>
              <input
                type="number"
                min={1}
                max={20}
                value={aiCount}
                onChange={(e) => setAiCount(Math.max(1, Math.min(20, Number(e.target.value) || 5)))}
                className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">난이도</label>
              <select
                value={aiDifficulty}
                onChange={(e) => setAiDifficulty(e.target.value as Difficulty)}
                className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-bold"
              >
                <option value="EASY">쉬움</option>
                <option value="MEDIUM">보통</option>
                <option value="HARD">어려움</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">유형</label>
              <select
                value={aiType}
                onChange={(e) => setAiType(e.target.value as QuizType)}
                className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-bold"
              >
                <option value="MULTIPLE_CHOICE">객관식</option>
                <option value="SHORT_ANSWER">단답형</option>
                <option value="ESSAY">서술형</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending}
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-primary text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> 생성 중...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> AI로 생성
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── 새 문제 추가 / 수정 폼 ── */}
        {!showForm ? (
          <button
            type="button"
            onClick={() => {
              setForm(EMPTY_FORM);
              setEditingQuizId(null);
              setShowForm(true);
            }}
            className="mb-8 bg-white border-2 border-dashed border-slate-300 hover:border-primary hover:bg-primary/5 rounded-2xl p-6 flex items-center justify-center gap-3 text-slate-500 hover:text-primary font-bold transition-all"
          >
            <Plus className="w-5 h-5" />
            새 문제 직접 추가하기
          </button>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm mb-8 space-y-5"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-black text-slate-800">
                {editingQuizId !== null ? "문제 수정" : "새 문제 작성"}
              </h3>
              <button
                type="button"
                onClick={resetForm}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
                aria-label="닫기"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 질문 */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">질문 *</label>
              <textarea
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
                placeholder="예: 광합성에서 빛에너지를 화학에너지로 변환하는 단계는 무엇입니까?"
                className="w-full h-24 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-medium resize-none"
                required
              />
            </div>

            {/* 유형 + 난이도 + 개념 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">유형 *</label>
                <select
                  value={form.quizType}
                  onChange={(e) => setForm({ ...form, quizType: e.target.value as QuizType })}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-bold"
                >
                  <option value="MULTIPLE_CHOICE">객관식</option>
                  <option value="SHORT_ANSWER">단답형</option>
                  <option value="ESSAY">서술형</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">난이도</label>
                <select
                  value={form.difficulty}
                  onChange={(e) => setForm({ ...form, difficulty: e.target.value as Difficulty })}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-bold"
                >
                  <option value="EASY">쉬움</option>
                  <option value="MEDIUM">보통</option>
                  <option value="HARD">어려움</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">개념 태그</label>
                <input
                  type="text"
                  value={form.conceptTag ?? ""}
                  onChange={(e) => setForm({ ...form, conceptTag: e.target.value })}
                  placeholder="예: 광합성"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-medium"
                />
              </div>
            </div>

            {/* 객관식 보기 */}
            {form.quizType === "MULTIPLE_CHOICE" && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  보기 (최소 2개) *
                </label>
                <div className="space-y-2">
                  {(form.options ?? ["", "", "", ""]).map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-8 h-11 flex items-center justify-center text-slate-400 font-black">
                        {String.fromCharCode(65 + idx)}.
                      </span>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        placeholder={`보기 ${idx + 1}`}
                        className="flex-1 h-11 px-4 rounded-xl border border-slate-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-medium"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-2 font-medium">
                  ⚠️ 정답란에 보기와 정확히 일치하는 텍스트를 입력해야 합니다.
                </p>
              </div>
            )}

            {/* 정답 */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">정답 *</label>
              <input
                type="text"
                value={form.correctAnswer}
                onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}
                placeholder={
                  form.quizType === "MULTIPLE_CHOICE"
                    ? "보기 중 하나와 정확히 일치하는 텍스트"
                    : form.quizType === "SHORT_ANSWER"
                    ? "정답 키워드"
                    : "모범 답안"
                }
                className="w-full h-11 px-4 rounded-xl border border-green-200 bg-green-50/30 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 font-bold"
                required
              />
            </div>

            {/* 해설 */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">해설 (선택)</label>
              <textarea
                value={form.explanation ?? ""}
                onChange={(e) => setForm({ ...form, explanation: e.target.value })}
                placeholder="학생이 답을 맞추거나 틀렸을 때 보여줄 설명입니다."
                className="w-full h-20 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-medium resize-none"
              />
            </div>

            {/* 액션 */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 h-12 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="px-6 h-12 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {editingQuizId !== null ? "수정 저장" : "문제 추가"}
              </button>
            </div>
          </form>
        )}

        {/* ── 등록된 문제 목록 ── */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-black flex items-center gap-2">
            <ListChecks className="w-6 h-6 text-primary" />
            등록된 문제
          </h2>
          <span className="text-sm font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            총 {quizzes.length}문제
          </span>
        </div>

        {isLoading ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : quizzes.length === 0 ? (
          <div className="bg-slate-50 border border-slate-100 rounded-[2rem] py-16 px-6 flex flex-col items-center text-center">
            <AlertCircle className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-slate-500 font-bold mb-1">아직 등록된 퀴즈가 없습니다.</p>
            <p className="text-slate-400 text-sm font-medium">
              위 AI 자동 출제 또는 직접 추가로 첫 문제를 만들어보세요.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {quizzes.map((quiz, idx) => (
              <div
                key={quiz.id}
                className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black shrink-0">
                      {idx + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                          {TYPE_LABEL[quiz.quizType as QuizType] || quiz.quizType}
                        </span>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                            quiz.difficulty === "EASY"
                              ? "bg-green-100 text-green-600"
                              : quiz.difficulty === "HARD"
                              ? "bg-red-100 text-red-600"
                              : "bg-orange-100 text-orange-600"
                          }`}
                        >
                          {DIFFICULTY_LABEL[quiz.difficulty as Difficulty] || quiz.difficulty}
                        </span>
                        {quiz.conceptTag && (
                          <span className="text-xs font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md">
                            #{quiz.conceptTag}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-800 leading-relaxed mb-3">
                        {quiz.question}
                      </h3>

                      {quiz.options && quiz.options.length > 0 && (
                        <ul className="space-y-1 mb-3">
                          {quiz.options.map((opt, i) => (
                            <li
                              key={i}
                              className={`text-sm font-medium pl-3 py-1 rounded ${
                                opt === quiz.correctAnswer
                                  ? "bg-green-50 text-green-700 font-bold border-l-2 border-green-500"
                                  : "text-slate-500"
                              }`}
                            >
                              {String.fromCharCode(65 + i)}. {opt}
                            </li>
                          ))}
                        </ul>
                      )}

                      {(!quiz.options || quiz.options.length === 0) && (
                        <div className="bg-green-50 border-l-4 border-green-500 px-3 py-2 rounded text-sm text-green-700 font-bold mb-2">
                          정답: {quiz.correctAnswer}
                        </div>
                      )}

                      {quiz.explanation && (
                        <div className="text-sm text-slate-500 font-medium bg-slate-50 px-3 py-2 rounded-lg leading-relaxed">
                          💡 {quiz.explanation}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => startEdit(quiz)}
                      className="w-9 h-9 rounded-lg bg-slate-50 hover:bg-primary/10 hover:text-primary text-slate-400 flex items-center justify-center transition-colors"
                      aria-label="수정"
                      title="수정"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(quiz.id, quiz.question)}
                      disabled={deleteMutation.isPending}
                      className="w-9 h-9 rounded-lg bg-slate-50 hover:bg-red-50 hover:text-red-500 text-slate-400 flex items-center justify-center transition-colors disabled:opacity-50"
                      aria-label="삭제"
                      title="삭제"
                    >
                      {deleteMutation.isPending && deleteMutation.variables === quiz.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
