import { memoraApi } from "../axios";
import type { QaSession, QaMessage, AskRequest } from "../../types/qa";
import type { ApiResponse } from "../../types/api";

// QA 세션 생성 — POST /api/lectures/{lectureId}/qa/sessions
export const createSession = async (lectureId: number): Promise<QaSession> => {
  const { data } = await memoraApi.post<ApiResponse<QaSession>>(
    `/lectures/${lectureId}/qa/sessions`
  );
  return data.data;
};

// 내 QA 세션 목록 조회 — GET /api/qa/sessions?lectureId={lectureId}
export const getSessions = async (lectureId?: number): Promise<QaSession[]> => {
  const params = lectureId ? { lectureId } : undefined;
  const { data } = await memoraApi.get<ApiResponse<QaSession[]>>(`/qa/sessions`, { params });
  return data.data;
};

// 특정 QA 세션 상세 조회 (메시지 포함) — GET /api/qa/sessions/{sessionId}
export const getSession = async (sessionId: number): Promise<QaSession> => {
  const { data } = await memoraApi.get<ApiResponse<QaSession>>(`/qa/sessions/${sessionId}`);
  return data.data;
};

// 세션에 메시지 전송 및 AI 응답 받기 — POST /api/qa/sessions/{sessionId}/messages
export const sendMessage = async (sessionId: number, request: AskRequest): Promise<QaMessage> => {
  const { data } = await memoraApi.post<ApiResponse<QaMessage>>(
    `/qa/sessions/${sessionId}/messages`,
    request
  );
  return data.data;
};
