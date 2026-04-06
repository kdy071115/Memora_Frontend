import { memoraApi } from "../axios";

export interface Course {
  id: number;
  title: string;
  description: string;
  progress: number;
  category: string;
}

// 강의 목록 가져오기 예제
export const getCourses = async (): Promise<Course[]> => {
  const { data } = await memoraApi.get("/courses");
  // 백엔드 구조가 { success: true, data: [...] } 라면 return data.data; 로 접근
  return data.data || data; 
};

// 특정 강의 상세 정보 가져오기 예제
export const getCourseById = async (id: string | number) => {
  const { data } = await memoraApi.get(`/courses/${id}`);
  return data.data || data;
};
