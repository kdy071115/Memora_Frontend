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
  // 백엔드 연결 시: const { data } = await memoraApi.get('/courses'); return data;
  
  // 현재는 Mock 데이터를 반환합니다.
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: 1, title: "인공지능 개론", description: "신경망 구조 기초", progress: 45, category: "전공 필수" },
        { id: 2, title: "알고리즘", description: "기초 자료구조", progress: 80, category: "전공 필수" }
      ]);
    }, 500);
  });
};

// 특정 강의 상세 정보 가져오기 예제
export const getCourseById = async (id: string | number) => {
  // 백엔드 연결 시: const { data } = await memoraApi.get(`/courses/${id}`); return data;
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ id, title: "불러온 강의 정보", content: "강의 내용..." });
    }, 500);
  });
};
