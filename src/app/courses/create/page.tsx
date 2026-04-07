"use client";
import React, { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import Link from "next/link";
import { UploadCloud, FileText, ArrowLeft, Loader2 } from "lucide-react";

import { useRouter } from "next/navigation";
import { createCourse } from "@/lib/api/courses";
import { createLecture, uploadDocument } from "@/lib/api/lectures";

export default function CreateCoursePage() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [title, setTitle] = useState("");

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const courseTitle = title.trim() || "새로운 강의";
      const course = await createCourse({ title: courseTitle, description: "사용자가 업로드한 자료로 생성된 강의입니다." });
      const lecture = await createLecture(course.id, { title: `1차시: ${file.name.replace(/\.[^/.]+$/, "")}`, description: "" });
      await uploadDocument(lecture.id, file);

      router.push(`/learn/${lecture.id}`);
    } catch (error) {
      console.error(error);
      alert("업로드 중 오류가 발생했습니다.");
      setIsUploading(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col w-full py-8 text-slate-800 max-w-4xl mx-auto">
        <Link href="/courses" className="inline-flex items-center text-slate-500 font-bold hover:text-primary mb-6 transition-colors w-max">
           <ArrowLeft className="w-4 h-4 mr-2" />
           코스 목록으로 돌아가기
        </Link>
        
        <div className="mb-10">
          <span className="inline-flex px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-sm font-bold text-primary mb-2">
            새로운 지식화
          </span>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">학습 자료 업로드</h1>
          <p className="text-slate-500 font-medium text-lg">수업에서 다루는 PDF나 텍스트를 첨부하면 AI가 목차를 분석하고 전용 튜터를 생성합니다.</p>
        </div>

        <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm">
            <div className="mb-8">
              <label className="block font-bold text-slate-700 mb-2">코스 제목 (선택)</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: 2026년 1학기 인공지능 개론 중간고사" 
                className="w-full h-14 px-5 bg-slate-50 border border-slate-200 rounded-2xl shadow-inner focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-slate-800 font-medium"
              />
           </div>

           <div>
              <label className="block font-bold text-slate-700 mb-2">PDF 또는 텍스트 문서 업로드</label>
              <div className="border-3 border-dashed border-slate-200 rounded-[2rem] bg-slate-50 p-12 flex flex-col items-center justify-center text-center transition-all hover:bg-slate-100 hover:border-primary/50 relative">
                 <input type="file" accept=".pdf,.txt" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleUpload} />
                 
                 <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6 text-primary">
                    <UploadCloud className="w-10 h-10" />
                 </div>
                 <h3 className="text-xl font-black text-slate-700 mb-2">파일을 이곳으로 드래그 앤 드롭하세요</h3>
                 <p className="text-slate-500 font-medium mb-6">또는 클릭하여 파일을 선택하세요 (최대 50MB, PDF 지원)</p>
                 
                 <div className="h-12 px-8 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm text-slate-600 font-bold pointer-events-none">
                    찾아보기
                 </div>
              </div>
           </div>
        </div>

        {/* Upload Overlay */}
        {isUploading && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center">
             <div className="bg-white rounded-[3rem] p-12 max-w-sm w-full flex flex-col items-center shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-slate-100">
                  <div className="h-full bg-primary animate-pulse w-full" />
                </div>
                <div className="w-24 h-24 bg-gradient-to-tr from-primary/20 to-blue-500/20 rounded-full flex items-center justify-center mb-6">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2">AI 지식화 진행중</h3>
                <p className="text-slate-500 font-medium text-center">문서의 핵심 개념을 추출하고 있습니다.<br/>잠시만 기다려주세요...</p>
             </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
