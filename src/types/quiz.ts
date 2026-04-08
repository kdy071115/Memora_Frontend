export interface Quiz {
  id: number;
  question: string;
  quizType: 'MULTIPLE_CHOICE' | 'SHORT_ANSWER' | 'ESSAY';
  options: string[] | null;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  conceptTag: string;
}

// 강사 관리용: 정답/해설 포함
export interface QuizDetail extends Quiz {
  correctAnswer: string;
  explanation: string;
}

export interface QuizGenerateRequest {
  count: number;
  types: string[];
  difficulty: string;
}

export interface QuizCreateRequest {
  question: string;
  quizType: 'MULTIPLE_CHOICE' | 'SHORT_ANSWER' | 'ESSAY';
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  conceptTag?: string;
}

export interface QuizUpdateRequest {
  question?: string;
  quizType?: string;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  difficulty?: string;
  conceptTag?: string;
}

export interface QuizSubmitRequest {
  userAnswer: string;
  timeSpent: number;
}

export interface QuizResult {
  attemptId: number;
  isCorrect: boolean;
  score: number;
  correctAnswer: string;
  explanation: string;
  aiFeedback: string;
  timeSpent: number;
}

/**
 * 학생용 안전 풀이 기록 — 점수/일시만 노출, 정답·해설은 미포함.
 * 백엔드 GET /api/lectures/{lectureId}/quizzes/history 응답 형태.
 */
export interface QuizAttemptHistoryItem {
  attemptId: number;
  quizId: number;
  question: string;
  conceptTag: string | null;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | string;
  score: number;
  isCorrect: boolean;
  attemptedAt: string;
}
