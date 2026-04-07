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
