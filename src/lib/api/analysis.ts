import { memoraApi } from "../axios";

export interface WeeklyProgress {
  week: string; // e.g. "2026-W14" or "1주차"
  studyTime: number;
  quizScore: number;
}

export interface AnalysisData {
  overallScore: number;
  totalStudyTime: number; // in seconds
  quizStats: {
    totalAttempts: number;
    correctRate: number;
  };
  weakConcepts: Array<{
    concept: string;
    correctRate: number;
  }>;
  recommendations: string[];
  weeklyProgress: WeeklyProgress[];
  
  // Custom Frontend Extensions
  competencies?: {
    [key: string]: number; // e.g. "개념 이해력": 120
  };
  maxGrowthIndicator?: string;
}

export const getAnalysis = async (): Promise<AnalysisData> => {
  const { data } = await memoraApi.get("/analysis/me");
  return data.data || data;
};
