"use client";
import React, { use } from "react";
import AiSidebar from "@/components/domain/learn/AiSidebar";
import Link from "next/link";
import { ArrowLeft, BookOpen, CheckCircle, Loader2, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getDocuments, getDocumentSummary } from "@/lib/api/lectures";
import ReactMarkdown from "react-markdown";
import type { DocumentItem } from "@/types/document";

const DocumentSummaryView = ({ document }: { document: DocumentItem }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['documentSummary', document.id],
    queryFn: () => getDocumentSummary(document.id),
  });

  if (isLoading) return <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-300" /></div>;
  if (!data) return <div className="py-4 text-center text-slate-500">요약을 불러올 수 없습니다.</div>;

  return (
    <div className="prose prose-slate max-w-none prose-h1:text-3xl prose-h1:font-black prose-h2:text-2xl prose-h2:font-bold prose-p:text-lg prose-p:leading-relaxed prose-p:font-medium prose-p:text-slate-600 prose-ul:text-slate-600 prose-ul:font-medium prose-li:my-1">
      <ReactMarkdown>{data.summary || "문서 내용이 비어있습니다."}</ReactMarkdown>
    </div>
  );
};

export default function LearnPage({ params }: { params: Promise<{ lectureId: string }> }) {
  const resolvedParams = use(params);
  const lectureId = Number(resolvedParams.lectureId);

  const { data: documents = [], isLoading: docLoading } = useQuery({
    queryKey: ['documents', lectureId],
    queryFn: () => getDocuments(lectureId),
    refetchInterval: (query: any) => {
      const data = query.state?.data as DocumentItem[] | undefined;
      return data?.some(d => d.processingStatus === 'PENDING' || d.processingStatus === 'PROCESSING') ? 3000 : false;
    }
  });

  return (
    <div className="h-screen flex flex-col bg-background font-sans">
      <header className="h-14 border-b border-slate-200 bg-white px-4 flex items-center justify-between shrink-0 shadow-sm z-20">
         <div className="flex items-center space-x-4">
            <Link href={`/courses`} className="w-8 h-8 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-500 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center space-x-2">
               <span className="text-xs font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-md">학습 집중 모드</span>
               <h1 className="font-bold text-slate-800">강의 상세 및 요약</h1>
            </div>
         </div>
         <div className="flex items-center space-x-4">
            <Link href={`/learn/${resolvedParams.lectureId}/quiz`} className="px-5 h-9 bg-slate-800 text-white text-sm font-bold rounded-full hover:bg-slate-700 transition-all shadow-sm flex items-center">
               <CheckCircle className="w-4 h-4 mr-2" />
               복습 퀴즈 풀기
            </Link>
         </div>
      </header>

      <div className="flex-1 overflow-hidden flex w-full">
         <div className="w-[60%] h-full bg-slate-100 overflow-y-auto p-4 md:p-8 flex flex-col items-center custom-scrollbar">
            
            {docLoading ? (
               <div className="flex flex-col items-center justify-center py-20">
                 <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                 <p className="text-slate-500 font-medium">강의 자료를 불러오는 중입니다...</p>
               </div>
            ) : documents.length === 0 ? (
               <div className="w-full max-w-[800px] bg-white border border-slate-200 rounded-[2rem] shadow-sm p-10 flex flex-col items-center justify-center py-24 text-center">
                  <BookOpen className="w-16 h-16 text-slate-200 mb-4" />
                  <h2 className="text-xl font-bold text-slate-700 mb-2">등록된 학습 자료가 없습니다</h2>
                  <p className="text-slate-500">교강사가 아직 자료를 업로드하지 않았습니다.</p>
               </div>
            ) : (
               documents.map(doc => (
                 <div key={doc.id} className="w-full max-w-[800px] bg-white border border-slate-200 rounded-[2rem] shadow-sm p-10 md:p-16 mb-8 min-h-[400px]">
                   <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 pb-4 border-b border-slate-100 gap-4">
                     <div className="flex items-center space-x-3">
                       <FileText className="w-6 h-6 text-primary" />
                       <h2 className="text-2xl font-black text-slate-800">{doc.originalName}</h2>
                     </div>
                     <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                       doc.processingStatus === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                       doc.processingStatus === 'FAILED' ? 'bg-red-100 text-red-700' :
                       'bg-blue-100 text-blue-700 animate-pulse'
                     }`}>
                       {doc.processingStatus === 'COMPLETED' ? '분석 완료' :
                        doc.processingStatus === 'FAILED' ? '분석 실패' :
                        'AI 분석 중...'}
                     </span>
                   </div>
                   
                   {doc.processingStatus === 'PENDING' || doc.processingStatus === 'PROCESSING' ? (
                     <div className="flex flex-col items-center justify-center py-20 text-center">
                       <div className="relative mb-6">
                         <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                         <div className="border-4 border-primary rounded-full w-16 h-16 border-t-transparent animate-spin"></div>
                       </div>
                       <h3 className="text-xl font-bold text-slate-800 mb-2">AI가 문서를 분석 중입니다</h3>
                       <p className="text-slate-500">자동으로 요약본이 생성됩니다. 잠시만 기다려주세요.</p>
                     </div>
                   ) : doc.processingStatus === 'FAILED' ? (
                     <div className="py-20 text-center text-red-500 font-bold">문서 분석에 실패했습니다.</div>
                   ) : (
                     <DocumentSummaryView document={doc} />
                   )}
                 </div>
               ))
            )}

            <div className="h-32" />
         </div>

         <div className="w-[40%] h-full shrink-0 border-l border-slate-200 bg-white">
            <AiSidebar lectureId={lectureId} />
         </div>
      </div>
    </div>
  );
}
