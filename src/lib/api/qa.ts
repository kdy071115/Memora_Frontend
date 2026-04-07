import { memoraApi } from "../axios";
import type { QaSession, QaMessage, AskRequest } from "../../types/qa";
import type { ApiResponse } from "../../types/api";

// 새로운 QA 세션 생성
export const createSession = async (lectureId: number, title: string): Promise<QaSession> => {
  const { data } = await memoraApi.post<ApiResponse<QaSession>>(`/qa/sessions`, { lectureId, title });
  return data.data;
};

// 학생의 QA 세션 목록 조회
export const getSessions = async (): Promise<QaSession[]> => {
  const { data } = await memoraApi.get<ApiResponse<QaSession[]>>(`/qa/sessions`);
  return data.data;
};

// 특정 QA 세션 상세 조회 (메시지 포함)
export const getSession = async (sessionId: number): Promise<QaSession> => {
  const { data } = await memoraApi.get<ApiResponse<QaSession>>(`/qa/sessions/${sessionId}`);
  return data.data;
};

// 특정 세션에 메시지 전송 및 AI 응답 받기
export const sendMessage = async (sessionId: number, request: AskRequest): Promise<QaMessage> => {
  const { data } = await memoraApi.post<ApiResponse<QaMessage>>(`/qa/sessions/${sessionId}/messages`, request);
  return data.data;
};
