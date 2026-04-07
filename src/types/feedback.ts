export interface InstructorFeedback {
  id: number;
  courseId: number;
  courseTitle: string;
  instructorId: number;
  instructorName: string;
  studentId: number;
  studentName: string;
  content: string;
  readByStudent: boolean;
  createdAt: string;
}

export interface FeedbackRequest {
  content: string;
}
