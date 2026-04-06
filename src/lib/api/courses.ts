import { memoraApi } from "../axios";

export interface Course {
  id: number;
  title: string;
  description: string;
  progress: number;
  category: string;
  status: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

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

