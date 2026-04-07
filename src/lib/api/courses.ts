import { memoraApi } from "../axios";
import type { Course, EnrollByCodeRequest } from "../../types/course";
import type { PageResponse, ApiResponse } from "../../types/api";

// 강의 목록 가져오기
// 백엔드 응답: { success: true, data: { content: [...], totalElements: N, ... } }
export const getCourses = async (): Promise<Course[]> => {
  const { data } = await memoraApi.get("/courses");
  const pageResponse: PageResponse<Course> = data.data;
  return pageResponse?.content ?? [];
};

// 특정 강의 상세 정보 가져오기
export const getCourseById = async (id: string | number): Promise<Course> => {
  const { data } = await memoraApi.get(`/courses/${id}`);
  return data.data;
};

// 강의 생성 (교강사)
export const createCourse = async (courseData: { title: string; description: string }): Promise<Course> => {
  const { data } = await memoraApi.post<ApiResponse<Course>>("/courses", courseData);
  return data.data;
};

// 수강 등록 (학생)
export const enrollCourse = async (courseId: number): Promise<void> => {
  await memoraApi.post(`/courses/${courseId}/enroll`);
};

// 초대 코드로 수강 등록 (학생)
export const enrollByCode = async (inviteCode: string): Promise<Course> => {
  const request: EnrollByCodeRequest = { inviteCode };
  const { data } = await memoraApi.post<ApiResponse<Course>>("/courses/enroll-by-code", request);
  return data.data;
};

