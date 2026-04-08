export interface Course {
  id: number;
  title: string;
  description: string;
  instructor: { id: number; name: string };
  studentCount: number;
  lectureCount: number;
  status: 'ACTIVE' | 'ARCHIVED';
  // 백엔드 Lombok+Jackson 의 boolean 직렬화 이슈로 두 형태가 모두 들어올 수 있음
  isEnrolled?: boolean;
  enrolled?: boolean;
  inviteCode?: string;
  createdAt: string;
  /** 0~100. 학생일 때만 채워짐. 학습 50% + 퀴즈 30% + 과제 20% 가중. null/undefined 가능. */
  progress?: number | null;
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
