import { memoraApi } from "../axios";
import type { ApiResponse } from "../../types/api";

// ── At-Risk (강사용) ──────────────────────────────────────────

export interface AtRiskStudent {
  userId: number;
  name: string;
  email: string;
  riskScore: number;
  riskLevel: "HIGH" | "MEDIUM" | "LOW" | string;
  reasons: string[];
  averageScore: number | null;
  correctRatePercent: number | null;
  totalStudyTimeSeconds: number | null;
  lastActiveAt: string | null;
  daysSinceLastActive: number | null;
  pendingAssignments: number;
  weakConcepts: string[];
}

export interface CareMessage {
  message: string;
  suggestedActions: string[];
}

export const getAtRiskStudents = async (
  courseId: number,
  limit = 10
): Promise<AtRiskStudent[]> => {
  const { data } = await memoraApi.get<ApiResponse<AtRiskStudent[]>>(
    `/courses/${courseId}/at-risk-students?limit=${limit}`
  );
  return data.data ?? [];
};

export const generateCareMessage = async (
  courseId: number,
  studentId: number
): Promise<CareMessage> => {
  const { data } = await memoraApi.post<ApiResponse<CareMessage>>(
    `/courses/${courseId}/at-risk-students/${studentId}/care-message`
  );
  return data.data;
};

// ── Daily Missions (학생용) ──────────────────────────────────────────

export type DailyMissionType = "READ" | "QUIZ" | "SELF_EXPLAIN" | "SUBMIT" | "REVIEW";

export interface DailyMission {
  type: DailyMissionType | string;
  title: string;
  description: string;
  estimatedMinutes: number;
  why: string;
}

export interface DailyMissionResult {
  summary: string;
  motivation: string;
  missions: DailyMission[];
}

export const getMyDailyMissions = async (): Promise<DailyMissionResult> => {
  const { data } = await memoraApi.get<ApiResponse<DailyMissionResult>>(
    `/me/daily-missions`
  );
  return data.data;
};

// ── Audio Note (강사 업로드 + 강사·수강생 조회) ──────────────────────────────────────────

export interface AudioNoteChapter {
  title: string;
  startSec: number;
  summary: string;
}

export interface AudioNote {
  id: number;
  lectureId: number;
  originalFileName: string;
  durationSec: number;
  transcript: string;
  summary: string;
  chapters: AudioNoteChapter[];
  createdAt: string;
}

export const uploadAudioNote = async (
  lectureId: number,
  file: File
): Promise<AudioNote> => {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await memoraApi.post<ApiResponse<AudioNote>>(
    `/lectures/${lectureId}/audio-note`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data.data;
};

export const getAudioNote = async (lectureId: number): Promise<AudioNote | null> => {
  const { data } = await memoraApi.get<ApiResponse<AudioNote | null>>(
    `/lectures/${lectureId}/audio-note`
  );
  return data.data ?? null;
};

export const deleteAudioNote = async (lectureId: number): Promise<void> => {
  await memoraApi.delete(`/lectures/${lectureId}/audio-note`);
};

// ── Concept Knowledge Graph ──────────────────────────────────────────

export interface ConceptNode {
  id: string;
  label: string;
  importance: number;
}

export interface ConceptEdge {
  source: string;
  target: string;
  label: string;
}

export interface ConceptGraph {
  nodes: ConceptNode[];
  edges: ConceptEdge[];
}

export const getConceptGraph = async (lectureId: number): Promise<ConceptGraph> => {
  const { data } = await memoraApi.get<ApiResponse<ConceptGraph>>(
    `/lectures/${lectureId}/concept-graph`
  );
  return data.data;
};
