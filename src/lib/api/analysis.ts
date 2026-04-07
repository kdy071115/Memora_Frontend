import { memoraApi } from "../axios";
import type { MyAnalysis, CourseOverview } from "../../types/analysis";

// 프론트엔드 임시 확장을 위한 타입
export type AnalysisData = MyAnalysis & {
  competencies?: {
    [key: string]: number;
  };
  maxGrowthIndicator?: string;
};

export const getAnalysis = async (): Promise<AnalysisData> => {
  const { data } = await memoraApi.get("/analysis/me");
  return data.data || data;
};

export const getCourseOverview = async (courseId: number): Promise<CourseOverview> => {
  const { data } = await memoraApi.get(`/analysis/courses/${courseId}/overview`);
  return data.data;
};
