import { memoraApi } from "../axios";
import type { InstructorFeedback, FeedbackRequest } from "../../types/feedback";
import type { ApiResponse } from "../../types/api";

// 내가 받은 피드백 조회 (학생) — GET /api/feedback/me
export const getStudentFeedback = async (): Promise<InstructorFeedback[]> => {
  const { data } = await memoraApi.get<ApiResponse<InstructorFeedback[]>>(`/feedback/me`);
  return data.data;
};

// 피드백 읽음 처리 (학생) — PATCH /api/feedback/{feedbackId}/read
export const markFeedbackRead = async (feedbackId: number): Promise<void> => {
  await memoraApi.patch(`/feedback/${feedbackId}/read`);
};

// 피드백 작성 (교강사) — POST /api/courses/{courseId}/students/{studentId}/feedback
export const createFeedback = async (
  courseId: number,
  studentId: number,
  request: FeedbackRequest
): Promise<InstructorFeedback> => {
  const { data } = await memoraApi.post<ApiResponse<InstructorFeedback>>(
    `/courses/${courseId}/students/${studentId}/feedback`,
    request
  );
  return data.data;
};

// 학생별 피드백 목록 조회 (교강사) — GET /api/courses/{courseId}/students/{studentId}/feedback
export const getStudentFeedbackByInstructor = async (
  courseId: number,
  studentId: number
): Promise<InstructorFeedback[]> => {
  const { data } = await memoraApi.get<ApiResponse<InstructorFeedback[]>>(
    `/courses/${courseId}/students/${studentId}/feedback`
  );
  return data.data;
};
