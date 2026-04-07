import { memoraApi } from "../axios";
import type { MyAnalysis, CourseOverview } from "../../types/analysis";
import type { ApiResponse } from "../../types/api";

export type AnalysisData = MyAnalysis & {
  competencies?: { [key: string]: number };
  maxGrowthIndicator?: string;
};

// 내 종합 분석 (학생) — GET /api/analysis/me
export const getAnalysis = async (): Promise<AnalysisData> => {
  const { data } = await memoraApi.get("/analysis/me");
  return data.data || data;
};

// 강의별 개인 분석 (학생) — GET /api/analysis/me/courses/{courseId}
export const getCourseAnalysis = async (courseId: number): Promise<any> => {
  const { data } = await memoraApi.get<ApiResponse<any>>(`/analysis/me/courses/${courseId}`);
  return data.data;
};

// 강의 통계 대시보드 (교강사) — GET /api/analysis/courses/{courseId}/overview
export const getCourseOverview = async (courseId: number): Promise<CourseOverview> => {
  const { data } = await memoraApi.get(`/analysis/courses/${courseId}/overview`);
  return data.data;
};

// 강의 수강생 목록 (교강사) — GET /api/analysis/courses/{courseId}/students
export const getCourseStudents = async (courseId: number): Promise<any[]> => {
  const { data } = await memoraApi.get<ApiResponse<any[]>>(
    `/analysis/courses/${courseId}/students`
  );
  return data.data;
};

// 수강생 개별 드릴다운 (교강사) — GET /api/analysis/courses/{courseId}/students/{userId}
export const getStudentDetail = async (courseId: number, userId: number): Promise<any> => {
  const { data } = await memoraApi.get<ApiResponse<any>>(
    `/analysis/courses/${courseId}/students/${userId}`
  );
  return data.data;
};
