import { memoraApi } from "../axios";
import type { ApiResponse } from "../../types/api";

export type SelfExplainGrade = "EXCELLENT" | "GOOD" | "NEEDS_WORK";

export interface SelfExplainResult {
  overallScore: number;
  grade: SelfExplainGrade;
  strengths: string[];
  missingConcepts: string[];
  misconceptions: string[];
  feedback: string;
  suggestedNextSteps: string[];
}

/**
 * 학생이 본인 말로 작성한 설명을 AI 코치가 평가합니다.
 * POST /api/lectures/{lectureId}/self-explain
 */
export const submitSelfExplanation = async (
  lectureId: number,
  explanation: string,
  focusTopic?: string
): Promise<SelfExplainResult> => {
  const { data } = await memoraApi.post<ApiResponse<SelfExplainResult>>(
    `/lectures/${lectureId}/self-explain`,
    { explanation, focusTopic }
  );
  return data.data;
};

export interface SelfExplainHistoryItem {
  id: number;
  lectureId: number;
  lectureTitle: string;
  courseId: number | null;
  courseTitle: string | null;
  overallScore: number | null;
  grade: SelfExplainGrade | null;
  focusTopic: string | null;
  explanation: string | null;
  strengths: string[];
  missingConcepts: string[];
  misconceptions: string[];
  createdAt: string;
}

/** 특정 강의의 자기 설명 기록 (최신순) */
export const getLectureSelfExplainHistory = async (
  lectureId: number
): Promise<SelfExplainHistoryItem[]> => {
  const { data } = await memoraApi.get<ApiResponse<SelfExplainHistoryItem[]>>(
    `/lectures/${lectureId}/self-explain/history`
  );
  return data.data ?? [];
};

/** 내가 작성한 모든 자기 설명 기록 (회고 페이지용) */
export const getMySelfExplainHistory = async (): Promise<SelfExplainHistoryItem[]> => {
  const { data } = await memoraApi.get<ApiResponse<SelfExplainHistoryItem[]>>(
    `/me/self-explain/history`
  );
  return data.data ?? [];
};
