import { memoraApi } from "../axios";
import type { InstructorFeedback, FeedbackRequest } from "../../types/feedback";
import type { ApiResponse } from "../../types/api";

export const getStudentFeedback = async (): Promise<InstructorFeedback[]> => {
  const { data } = await memoraApi.get<ApiResponse<InstructorFeedback[]>>(`/feedback/me`);
  return data.data;
};

export const createFeedback = async (courseId: number, studentId: number, request: FeedbackRequest): Promise<InstructorFeedback> => {
  const { data } = await memoraApi.post<ApiResponse<InstructorFeedback>>(`/courses/${courseId}/students/${studentId}/feedback`, request);
  return data.data;
};
