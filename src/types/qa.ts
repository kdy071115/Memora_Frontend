export interface QaSession {
  id: number;
  lectureId: number;
  lectureTitle?: string;
  title: string;
  lastMessage?: string;
  messageCount: number;
  messages?: QaMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface QaMessage {
  id: number;
  role: 'USER' | 'ASSISTANT';
  content: string;
  sources: Source[] | null;
  createdAt: string;
}

export interface Source {
  documentId: number;
  documentName: string;
  pageNumber: number;
  preview: string;
}

export interface AskRequest {
  content: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
}
