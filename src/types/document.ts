export interface DocumentItem {
  id: number;
  originalName: string;
  fileType: string;
  fileSize: number;
  processingStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  chunkCount: number;
  createdAt: string;
}

export interface DocumentSummary {
  id: number;
  originalName: string;
  summary: string;
}
