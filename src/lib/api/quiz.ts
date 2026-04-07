import { memoraApi } from "../axios";
import type { Quiz, QuizGenerateRequest, QuizSubmitRequest, QuizResult } from "../../types/quiz";
import type { ApiResponse } from "../../types/api";

// 퀴즈 자동 생성
export const generateQuiz = async (lectureId: number, request: QuizGenerateRequest): Promise<Quiz[]> => {
  const { data } = await memoraApi.post<ApiResponse<Quiz[]>>(`/lectures/${lectureId}/quizzes/generate`, request);
  return data.data;
};

// 퀴즈 제출 및 채점
export const submitQuiz = async (quizId: number, request: QuizSubmitRequest): Promise<QuizResult> => {
  const { data } = await memoraApi.post<ApiResponse<QuizResult>>(`/quizzes/${quizId}/submit`, request);
  return data.data;
};

// 특정 강의의 퀴즈 목록 조회
export const getQuizzes = async (lectureId: number): Promise<Quiz[]> => {
  const { data } = await memoraApi.get<ApiResponse<Quiz[]>>(`/lectures/${lectureId}/quizzes`);
  return data.data;
};
