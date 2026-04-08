import { memoraApi } from "../axios";
import type { Course, EnrollByCodeRequest } from "../../types/course";
import type { PageResponse, ApiResponse } from "../../types/api";

export interface CourseMember {
  userId: number;
  name: string;
  email: string;
}

export const getCourseMembers = async (courseId: number): Promise<CourseMember[]> => {
  const { data } = await memoraApi.get<ApiResponse<CourseMember[]>>(
    `/courses/${courseId}/members`
  );
  return data.data ?? [];
};

/**
 * 백엔드 Lombok+Jackson 의 boolean is* 직렬화 이슈로
 * 응답 JSON 키가 "isEnrolled" 가 아닌 "enrolled" 로 올 수 있어서
 * 한 번 정규화해 주는 헬퍼.
 */
const normalizeCourse = (raw: any): Course => {
  if (!raw) return raw;
  const enrolled = raw.isEnrolled ?? raw.enrolled ?? false;
  return { ...raw, isEnrolled: enrolled, enrolled };
};

// 강의 목록 — GET /api/courses
export const getCourses = async (): Promise<Course[]> => {
  const { data } = await memoraApi.get("/courses");
  const pageResponse: PageResponse<Course> = data.data;
  return (pageResponse?.content ?? []).map(normalizeCourse);
};

// 강의 상세 — GET /api/courses/{courseId}
export const getCourseById = async (id: string | number): Promise<Course> => {
  const { data } = await memoraApi.get(`/courses/${id}`);
  return normalizeCourse(data.data);
};

// 강의 생성 (교강사) — POST /api/courses
export const createCourse = async (courseData: {
  title: string;
  description: string;
}): Promise<Course> => {
  const { data } = await memoraApi.post<ApiResponse<Course>>("/courses", courseData);
  return normalizeCourse(data.data);
};

// 강의 수정 (교강사) — PUT /api/courses/{courseId}
export const updateCourse = async (
  courseId: number,
  courseData: { title: string; description: string }
): Promise<Course> => {
  const { data } = await memoraApi.put<ApiResponse<Course>>(`/courses/${courseId}`, courseData);
  return normalizeCourse(data.data);
};

// 강의 삭제 (교강사) — DELETE /api/courses/{courseId}
export const deleteCourse = async (courseId: number): Promise<void> => {
  await memoraApi.delete(`/courses/${courseId}`);
};

// 수강 등록 (학생) — POST /api/courses/{courseId}/enroll
export const enrollCourse = async (courseId: number): Promise<void> => {
  await memoraApi.post(`/courses/${courseId}/enroll`);
};

// 초대 코드로 수강 등록 (학생) — POST /api/courses/enroll-by-code
export const enrollByCode = async (inviteCode: string): Promise<Course> => {
  const request: EnrollByCodeRequest = { inviteCode };
  const { data } = await memoraApi.post<ApiResponse<Course>>(
    "/courses/enroll-by-code",
    request
  );
  return normalizeCourse(data.data);
};

// 초대 코드 재발급 (교강사) — POST /api/courses/{courseId}/invite-code/regenerate
export const regenerateInviteCode = async (courseId: number): Promise<Course> => {
  const { data } = await memoraApi.post<ApiResponse<Course>>(
    `/courses/${courseId}/invite-code/regenerate`
  );
  return normalizeCourse(data.data);
};
