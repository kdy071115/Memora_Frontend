export type SubmissionVisibility = "PUBLIC" | "PRIVATE";

export interface Assignment {
  id: number;
  courseId: number;
  courseTitle: string;
  instructorId: number;
  instructorName: string;
  title: string;
  description: string;
  dueDate: string | null;
  allowTeamSubmission: boolean;
  /** 강사가 dueDate 도래 전에 수동 조기 마감했는지 */
  closedEarly: boolean;
  /** dueDate 또는 closedEarly 가 발동되어 학생 제출이 막힌 상태 */
  closed: boolean;
  submissionCount: number;
  mySubmissionExists: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AssignmentInput {
  title: string;
  description: string;
  dueDate?: string | null;
  allowTeamSubmission?: boolean;
}

export interface SubmissionComment {
  id: number;
  authorId: number;
  authorName: string;
  authorRole: "STUDENT" | "INSTRUCTOR" | string;
  content: string;
  createdAt: string;
}

export interface Submission {
  id: number;
  assignmentId: number;
  assignmentTitle: string;
  submitterId: number;
  submitterName: string;
  teamId: number | null;
  teamName: string | null;
  content: string;
  attachmentName: string | null;
  attachmentSize: number | null;
  hasAttachment: boolean;
  visibility: SubmissionVisibility;
  createdAt: string;
  updatedAt: string;
  comments?: SubmissionComment[] | null;
}

export interface SubmissionInput {
  content: string;
  visibility: SubmissionVisibility;
  teamId?: number | null;
}

export interface UpcomingAssignment {
  id: number;
  title: string;
  courseId: number;
  courseTitle: string;
  dueDate: string;
  mySubmissionExists: boolean;
}

export interface AiFeedbackResult {
  /** 비동기 캐시 상태. PENDING / READY / FAILED. 없으면 READY 로 간주. */
  status?: "PENDING" | "READY" | "FAILED" | string;
  /** FAILED 일 때 에러 메시지 */
  errorMessage?: string;
  overallScore?: number;
  grade?: "EXCELLENT" | "GOOD" | "AVERAGE" | "NEEDS_WORK" | string;
  summary?: string;
  strengths?: string[];
  improvements?: string[];
  missingPoints?: string[];
  suggestions?: string[];
  instructorDraft?: string;
}

export interface AssignmentStats {
  totalStudents: number;
  submittedStudents: number;
  submissionRate: number;
  missing: { userId: number; name: string; email: string }[];
}
