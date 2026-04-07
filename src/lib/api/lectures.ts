import { memoraApi } from "../axios";
import type { Lecture } from "../../types/course";
import type { DocumentItem } from "../../types/document";
import type { ApiResponse } from "../../types/api";

// 차시 목록 조회
export const getLectures = async (courseId: number): Promise<Lecture[]> => {
  const { data } = await memoraApi.get<ApiResponse<Lecture[]>>(`/courses/${courseId}/lectures`);
  return data.data;
};

// 차시 생성 (교강사)
export const createLecture = async (courseId: number, lectureData: { title: string; description: string }): Promise<Lecture> => {
  const { data } = await memoraApi.post<ApiResponse<Lecture>>(`/courses/${courseId}/lectures`, lectureData);
  return data.data;
};

// 차시 수정 (교강사) — PUT /api/lectures/{lectureId}
export const updateLecture = async (
  lectureId: number,
  lectureData: { title: string; description: string }
): Promise<Lecture> => {
  const { data } = await memoraApi.put<ApiResponse<Lecture>>(`/lectures/${lectureId}`, lectureData);
  return data.data;
};

// 차시 삭제 (교강사) — DELETE /api/lectures/{lectureId}
export const deleteLecture = async (lectureId: number): Promise<void> => {
  await memoraApi.delete(`/lectures/${lectureId}`);
};

// 파일 업로드 (교강사)
export const uploadDocument = async (lectureId: number, file: File): Promise<DocumentItem> => {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await memoraApi.post<ApiResponse<DocumentItem>>(`/lectures/${lectureId}/documents`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data.data;
};

// 자료 목록 조회
export const getDocuments = async (lectureId: number): Promise<DocumentItem[]> => {
  const { data } = await memoraApi.get<ApiResponse<DocumentItem[]>>(`/lectures/${lectureId}/documents`);
  return data.data;
};

// 문서 요약 조회
export const getDocumentSummary = async (documentId: number): Promise<{ id: number; originalName: string; summary: string }> => {
  const { data } = await memoraApi.get<ApiResponse<{ id: number; originalName: string; summary: string }>>(`/documents/${documentId}/summary`);
  return data.data;
};
