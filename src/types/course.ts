export interface Course {
  id: number;
  title: string;
  description: string;
  instructor: { id: number; name: string };
  studentCount: number;
  lectureCount: number;
  status: 'ACTIVE' | 'ARCHIVED';
  isEnrolled: boolean;
  inviteCode?: string;
  createdAt: string;
}

export interface EnrollByCodeRequest { inviteCode: string; }

export interface Lecture {
  id: number;
  title: string;
  description: string;
  orderIndex: number;
  documentCount: number;
  hasCompletedDocuments: boolean;
}
