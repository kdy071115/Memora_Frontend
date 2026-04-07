import { memoraApi } from "../axios";
import type { Quiz, QuizGenerateRequest, QuizSubmitRequest, QuizResult } from "../../types/quiz";
import type { ApiResponse } from "../../types/api";

// 퀴즈 자동 생성 (수강생)
export const generateQuiz = async (lectureId: number, request: QuizGenerateRequest): Promise<Quiz[]> => {
  const { data } = await memoraApi.post<ApiResponse<Quiz[]>>(
    `/lectures/${lectureId}/quizzes/generate`,
    request
  );
  return data.data;
};

// 특정 강의의 퀴즈 목록 조회
export const getQuizzes = async (lectureId: number): Promise<Quiz[]> => {
  const { data } = await memoraApi.get<ApiResponse<Quiz[]>>(`/lectures/${lectureId}/quizzes`);
  return data.data;
};

// 답안 제출 + 채점
export const submitQuiz = async (quizId: number, request: QuizSubmitRequest): Promise<QuizResult> => {
  const { data } = await memoraApi.post<ApiResponse<QuizResult>>(
    `/quizzes/${quizId}/submit`,
    request
  );
  return data.data;
};

// 내 풀이 기록 조회
export const getQuizAttempts = async (lectureId: number): Promise<QuizResult[]> => {
  const { data } = await memoraApi.get<ApiResponse<QuizResult[]>>(
    `/lectures/${lectureId}/quizzes/attempts`
  );
  return data.data;
};

// 문제 수동 생성 (교강사)
export const createQuiz = async (lectureId: number, request: Omit<Quiz, "id">): Promise<Quiz> => {
  const { data } = await memoraApi.post<ApiResponse<Quiz>>(
    `/lectures/${lectureId}/quizzes`,
    request
  );
  return data.data;
};

// 문제 수정 (교강사)
export const updateQuiz = async (quizId: number, request: Partial<Quiz>): Promise<Quiz> => {
  const { data } = await memoraApi.put<ApiResponse<Quiz>>(`/quizzes/${quizId}`, request);
  return data.data;
};

// 문제 삭제 (교강사)
export const deleteQuiz = async (quizId: number): Promise<void> => {
  await memoraApi.delete(`/quizzes/${quizId}`);
};
