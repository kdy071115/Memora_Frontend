import { memoraApi } from "../axios";
import type { ApiResponse } from "../../types/api";
import type {
  Assignment,
  AssignmentInput,
  Submission,
  SubmissionComment,
  SubmissionInput,
} from "../../types/assignment";

// ── Assignments ──────────────────────────────────────────

export const createAssignment = async (
  courseId: number,
  input: AssignmentInput
): Promise<Assignment> => {
  const { data } = await memoraApi.post<ApiResponse<Assignment>>(
    `/courses/${courseId}/assignments`,
    input
  );
  return data.data;
};

export const getCourseAssignments = async (
  courseId: number
): Promise<Assignment[]> => {
  const { data } = await memoraApi.get<ApiResponse<Assignment[]>>(
    `/courses/${courseId}/assignments`
  );
  return data.data ?? [];
};

export const getAssignment = async (assignmentId: number): Promise<Assignment> => {
  const { data } = await memoraApi.get<ApiResponse<Assignment>>(
    `/assignments/${assignmentId}`
  );
  return data.data;
};

export const updateAssignment = async (
  assignmentId: number,
  input: AssignmentInput
): Promise<Assignment> => {
  const { data } = await memoraApi.put<ApiResponse<Assignment>>(
    `/assignments/${assignmentId}`,
    input
  );
  return data.data;
};

export const deleteAssignment = async (assignmentId: number): Promise<void> => {
  await memoraApi.delete(`/assignments/${assignmentId}`);
};

// ── Submissions ──────────────────────────────────────────

function buildSubmissionFormData(input: SubmissionInput, file: File | null): FormData {
  const formData = new FormData();
  const requestBlob = new Blob([JSON.stringify(input)], { type: "application/json" });
  formData.append("request", requestBlob);
  if (file) formData.append("file", file);
  return formData;
}

export const createSubmission = async (
  assignmentId: number,
  input: SubmissionInput,
  file: File | null
): Promise<Submission> => {
  const { data } = await memoraApi.post<ApiResponse<Submission>>(
    `/assignments/${assignmentId}/submissions`,
    buildSubmissionFormData(input, file),
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data.data;
};

export const updateSubmission = async (
  submissionId: number,
  input: SubmissionInput,
  file: File | null,
  removeAttachment: boolean = false
): Promise<Submission> => {
  const { data } = await memoraApi.put<ApiResponse<Submission>>(
    `/submissions/${submissionId}?removeAttachment=${removeAttachment}`,
    buildSubmissionFormData(input, file),
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data.data;
};

export const getAssignmentSubmissions = async (
  assignmentId: number
): Promise<Submission[]> => {
  const { data } = await memoraApi.get<ApiResponse<Submission[]>>(
    `/assignments/${assignmentId}/submissions`
  );
  return data.data ?? [];
};

export const getSubmission = async (submissionId: number): Promise<Submission> => {
  const { data } = await memoraApi.get<ApiResponse<Submission>>(
    `/submissions/${submissionId}`
  );
  return data.data;
};

export const deleteSubmission = async (submissionId: number): Promise<void> => {
  await memoraApi.delete(`/submissions/${submissionId}`);
};

/**
 * 제출물 첨부 파일을 인증된 요청으로 받아 raw Blob 과 서버가 알려준 mime 을 반환.
 * 호출 측에서 필요하면 mime 을 교정한 새 Blob 으로 감싸 URL 을 만들고
 * 사용 후 URL.revokeObjectURL 로 해제한다.
 */
export const fetchSubmissionFileBlob = async (
  submissionId: number
): Promise<{ blob: Blob; mimeType: string }> => {
  const res = await memoraApi.get(`/submissions/${submissionId}/file`, {
    responseType: "blob",
  });
  const mimeType = res.headers["content-type"] || "application/octet-stream";
  return { blob: res.data as Blob, mimeType };
};

// ── Comments ──────────────────────────────────────────

export const addSubmissionComment = async (
  submissionId: number,
  content: string
): Promise<SubmissionComment> => {
  const { data } = await memoraApi.post<ApiResponse<SubmissionComment>>(
    `/submissions/${submissionId}/comments`,
    { content }
  );
  return data.data;
};

export const deleteSubmissionComment = async (commentId: number): Promise<void> => {
  await memoraApi.delete(`/submissions/comments/${commentId}`);
};
