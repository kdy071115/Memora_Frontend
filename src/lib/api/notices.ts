import { memoraApi } from "../axios";
import type { Notice, NoticeRequest } from "../../types/notice";
import type { ApiResponse } from "../../types/api";

export const getNotices = async (courseId: number): Promise<Notice[]> => {
  const { data } = await memoraApi.get<ApiResponse<Notice[]>>(`/courses/${courseId}/notices`);
  return data.data;
};

export const createNotice = async (courseId: number, request: NoticeRequest): Promise<Notice> => {
  const { data } = await memoraApi.post<ApiResponse<Notice>>(`/courses/${courseId}/notices`, request);
  return data.data;
};
