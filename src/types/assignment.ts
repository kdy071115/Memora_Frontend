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
