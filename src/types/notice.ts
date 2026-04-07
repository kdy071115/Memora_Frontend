export interface Notice {
  id: number;
  courseId: number;
  title: string;
  content: string;
  pinned: boolean;
  authorId: number;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface NoticeRequest {
  title: string;
  content: string;
  pinned?: boolean;
}
