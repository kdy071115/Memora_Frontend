export interface MyAnalysis {
  overallScore: number;
  totalStudyTime: number;
  totalQuizAttempts: number;
  overallCorrectRate: number;
  enrolledCourses: number;
  weakConcepts: WeakConcept[];
  recommendations: string[];
  weeklyProgress: WeeklyProgress[];
}

export interface WeakConcept {
  concept: string;
  correctRate: number;
  attemptCount: number;
}

export interface WeeklyProgress {
  week: string;
  studyTime: number;
  quizScore: number | null;
}

export interface CourseOverview {
  courseId: number;
  courseTitle: string;
  totalStudents: number;
  activeStudents: number;
  averageScore: number;
  averageCorrectRate: number;
  averageStudyTime: number;
  totalQuizAttempts: number;
  topWeakConcepts: WeakConcept[];
  competencies: Record<string, number>;
  weeklyProgress: WeeklyProgress[];
  studentDistribution: {
    excellent: number;
    good: number;
    average: number;
    needsHelp: number;
  };
}

export type StudentStatus = 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'NEEDS_HELP';

export interface CourseStudentSummary {
  userId: number;
  name: string;
  email: string;
  averageScore: number;
  correctRate: number;
  totalQuizAttempts: number;
  totalStudyTime: number;
  lastActiveAt: string | null;
  status: StudentStatus;
}

export interface CourseStudentDetail {
  userId: number;
  userName: string;
  userEmail: string;
  courseId: number;
  courseTitle: string;
  overallScore: number;
  totalStudyTime: number;
  totalQuizAttempts: number;
  overallCorrectRate: number;
  lastActiveAt: string | null;
  status: StudentStatus;
  weakConcepts: WeakConcept[];
  weeklyProgress: WeeklyProgress[];
  competencies: Record<string, number>;
}
