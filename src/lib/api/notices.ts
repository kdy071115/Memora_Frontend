import { memoraApi } from "../axios";
import type { Notice, NoticeRequest } from "../../types/notice";
import type { ApiResponse } from "../../types/api";

// 공지사항 목록 조회 — GET /api/courses/{courseId}/notices
export const getNotices = async (courseId: number): Promise<Notice[]> => {
  const { data } = await memoraApi.get<ApiResponse<Notice[]>>(`/courses/${courseId}/notices`);
  return data.data;
};

// 공지사항 작성 (교강사) — POST /api/courses/{courseId}/notices
export const createNotice = async (courseId: number, request: NoticeRequest): Promise<Notice> => {
  const { data } = await memoraApi.post<ApiResponse<Notice>>(
    `/courses/${courseId}/notices`,
    request
  );
  return data.data;
};

// 공지사항 수정 (교강사) — PUT /api/notices/{noticeId}
export const updateNotice = async (noticeId: number, request: NoticeRequest): Promise<Notice> => {
  const { data } = await memoraApi.put<ApiResponse<Notice>>(`/notices/${noticeId}`, request);
  return data.data;
};

// 공지사항 삭제 (교강사) — DELETE /api/notices/{noticeId}
export const deleteNotice = async (noticeId: number): Promise<void> => {
  await memoraApi.delete(`/notices/${noticeId}`);
};
