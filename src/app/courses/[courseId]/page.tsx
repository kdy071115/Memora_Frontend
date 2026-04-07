"use client";
import React, { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCourseById, enrollCourse } from "@/lib/api/courses";
import { getLectures, createLecture } from "@/lib/api/lectures";
import { getNotices, createNotice } from "@/lib/api/notices";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { BookOpen, Users, Key, AlertTriangle, Loader2, Plus, ArrowRight, Bell, Send } from "lucide-react";
import Link from "next/link";

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = Number(params.courseId);
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const [newLectureTitle, setNewLectureTitle] = useState("");

  const { data: course, isLoading: isCourseLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => getCourseById(courseId),
    enabled: !!courseId,
  });

  const { data: lectures = [], isLoading: isLecturesLoading } = useQuery({
    queryKey: ['lectures', courseId],
    queryFn: () => getLectures(courseId),
    enabled: !!courseId,
  });

  const { data: notices = [], isLoading: isNoticesLoading } = useQuery({
    queryKey: ['notices', courseId],
    queryFn: () => getNotices(courseId),
    enabled: !!courseId,
  });

  const enrollMutation = useMutation({
    mutationFn: enrollCourse,
    onSuccess: () => {
      alert("수강 신청이 완료되었습니다.");
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
    onError: () => {
      alert("수강 신청에 실패했습니다.");
    }
  });

  const createLectureMutation = useMutation({
    mutationFn: (data: { title: string; description: string }) => createLecture(courseId, data),
    onSuccess: (newLecture) => {
      queryClient.invalidateQueries({ queryKey: ['lectures', courseId] });
      setNewLectureTitle("");
      router.push(`/learn/${newLecture.id}`);
    },
    onError: () => {
      alert("차시 생성에 실패했습니다.");
    }
  });

  const [newNoticeTitle, setNewNoticeTitle] = useState("");
  const [newNoticeContent, setNewNoticeContent] = useState("");

  const createNoticeMutation = useMutation({
    mutationFn: (data: { title: string; content: string }) => createNotice(courseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices', courseId] });
      setNewNoticeTitle("");
      setNewNoticeContent("");
    },
    onError: () => {
      alert("공지사항 생성에 실패했습니다.");
    }
  });

  const handleEnroll = () => {
    if (confirm("이 강의를 수강하시겠습니까?")) {
      enrollMutation.mutate(courseId);
    }
  };

  const handleCreateLecture = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLectureTitle.trim()) return;
    createLectureMutation.mutate({ title: newLectureTitle, description: "" });
  };

  const handleCreateNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoticeTitle.trim() || !newNoticeContent.trim()) return;
    createNoticeMutation.mutate({ title: newNoticeTitle, content: newNoticeContent });
  };

  if (isCourseLoading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
          <p className="text-slate-500 font-medium">강의 정보를 불러오는 중입니다...</p>
        </div>
      </MainLayout>
    );
  }

  if (!course) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white rounded-3xl m-8 p-12">
          <AlertTriangle className="w-16 h-16 text-slate-300 mb-6" />
          <h2 className="text-2xl font-bold text-slate-700 mb-2">강의를 찾을 수 없습니다</h2>
          <Link href="/courses" className="text-primary font-medium hover:underline">
            목록으로 돌아가기
          </Link>
        </div>
      </MainLayout>
    );
  }

  const isInstructor = user?.role === "INSTRUCTOR" && course.instructor.id === Number(user.id);
  const isEnrolled = course.isEnrolled;

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto py-8 px-4 w-full text-slate-800">
        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 md:p-12 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
            <div>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-4 ${course.status === 'ACTIVE' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                {course.status === 'ACTIVE' ? '진행 중인 강의' : '보관된 강의'}
              </span>
              <h1 className="text-3xl md:text-4xl font-black text-slate-800 mb-4 tracking-tight">
                {course.title}
              </h1>
              <p className="text-lg text-slate-600 font-medium max-w-3xl leading-relaxed">
                {course.description || "강의 설명이 없습니다."}
              </p>
            </div>
            
            <div className="flex flex-col gap-3 shrink-0 w-full md:w-auto">
              {!isInstructor && !isEnrolled && (
                <button 
                  onClick={handleEnroll}
                  disabled={enrollMutation.isPending}
                  className="px-6 py-3 bg-gradient-to-r from-primary to-blue-600 text-white rounded-2xl font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center text-lg disabled:opacity-50"
                >
                  {enrollMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin md:mr-2" /> : <BookOpen className="w-5 h-5 mr-2" />}
                  수강 등록하기
                </button>
              )}
              {isEnrolled && (
                <div className="px-6 py-3 bg-green-50 text-green-700 rounded-2xl font-bold border border-green-200 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 mr-2" />
                  수강 중인 강의
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm text-slate-500 font-medium border-t border-slate-100 pt-6 mt-2">
            <div className="flex items-center">
              <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mr-2 text-lg">👨‍🏫</span>
              <span>담당교수: <strong className="text-slate-700">{course.instructor.name}</strong></span>
            </div>
            <div className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              <span>수강생 <strong className="text-slate-700">{course.studentCount}명</strong></span>
            </div>
          </div>
          
          {isInstructor && course.inviteCode && (
            <div className="mt-6 bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center text-slate-700 font-medium">
                <Key className="w-5 h-5 mr-2 text-primary" />
                <span className="mr-2">강의 초대 코드:</span>
                <span className="font-mono font-bold text-xl tracking-widest bg-white border border-slate-200 px-3 py-1 rounded inline-block">{course.inviteCode}</span>
              </div>
              <button className="text-sm font-bold text-primary hover:text-blue-700 transition-colors bg-white border border-primary/20 px-4 py-2 rounded-lg">
                코드 복사
              </button>
            </div>
          )}
        </div>

        {/* 차시 목록 영역 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-800">강의 목차</h2>
            <span className="text-slate-500 font-medium">총 {lectures.length}개 차시</span>
          </div>

          <div className="space-y-4">
            {isLecturesLoading ? (
              <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-300" /></div>
            ) : lectures.map((lecture, index) => (
              <div key={lecture.id} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-black text-lg shrink-0">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">{lecture.title}</h3>
                    <p className="text-sm text-slate-500 font-medium">{lecture.description || "자료가 준비되어 있습니다."}</p>
                  </div>
                </div>
                {(isEnrolled || isInstructor) ? (
                  <Link href={`/learn/${lecture.id}`} className="w-12 h-12 bg-slate-50 hover:bg-primary hover:text-white text-slate-400 rounded-full flex items-center justify-center transition-colors group-hover:scale-110">
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                ) : (
                  <div className="px-4 py-2 bg-slate-50 rounded-lg text-sm text-slate-400 font-medium whitespace-nowrap">
                    수강 전
                  </div>
                )}
              </div>
            ))}

            {lectures.length === 0 && !isLecturesLoading && (
              <div className="text-center py-12 bg-white border border-slate-100 rounded-2xl text-slate-500 font-medium">
                등록된 차시가 없습니다.
              </div>
            )}
          </div>
        </div>

         {isInstructor && (
          <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-8 mb-8">
            <h3 className="text-lg font-bold text-slate-800 mb-4">새로운 차시 추가</h3>
            <form onSubmit={handleCreateLecture} className="flex gap-4">
              <input
                type="text"
                placeholder="차시 제목을 입력하세요 (예: 1주차 인공지능 개요)"
                className="flex-1 h-12 px-5 rounded-xl border border-slate-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                value={newLectureTitle}
                onChange={(e) => setNewLectureTitle(e.target.value)}
                required
              />
              <button 
                type="submit"
                disabled={createLectureMutation.isPending}
                className="px-6 h-12 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl flex items-center transition-colors disabled:opacity-50 shrink-0"
              >
                {createLectureMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5 mr-2" />}
                차시 추가
              </button>
            </form>
          </div>
         )}

         {/* 공지사항 영역 */}
         <div className="mb-8">
           <div className="flex items-center justify-between mb-6">
             <h2 className="text-2xl font-bold text-slate-800 flex items-center">
               <Bell className="w-6 h-6 mr-2 text-orange-500" />
               공지사항
             </h2>
           </div>

           <div className="space-y-4 mb-6">
             {isNoticesLoading ? (
               <div className="py-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-300" /></div>
             ) : notices.length === 0 ? (
               <div className="text-center py-8 bg-orange-50/50 border border-orange-100 rounded-2xl text-orange-600/60 font-medium">
                 등록된 공지사항이 없습니다.
               </div>
             ) : notices.map((notice) => (
               <div key={notice.id} className="bg-white border border-orange-100 rounded-2xl p-6 shadow-sm">
                 <div className="flex items-center justify-between mb-2">
                   <h3 className="text-lg font-bold text-slate-800">{notice.title}</h3>
                   <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded">중요</span>
                 </div>
                 <p className="text-sm font-medium text-slate-600 whitespace-pre-wrap">{notice.content}</p>
                 <div className="text-xs text-slate-400 mt-4 text-right">
                   {new Date(notice.createdAt || Date.now()).toLocaleDateString()}
                 </div>
               </div>
             ))}
           </div>

           {isInstructor && (
             <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm">
               <h3 className="text-base font-bold text-slate-800 mb-4">새 공지사항 등록</h3>
               <form onSubmit={handleCreateNotice} className="space-y-4">
                 <input
                   type="text"
                   placeholder="공지사항 제목"
                   className="w-full h-12 px-5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-50 transition-all font-medium"
                   value={newNoticeTitle}
                   onChange={(e) => setNewNoticeTitle(e.target.value)}
                   required
                 />
                 <textarea
                   placeholder="공지사항 내용"
                   className="w-full h-32 p-5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-50 transition-all font-medium resize-none custom-scrollbar"
                   value={newNoticeContent}
                   onChange={(e) => setNewNoticeContent(e.target.value)}
                   required
                 />
                 <div className="flex justify-end">
                   <button 
                     type="submit"
                     disabled={createNoticeMutation.isPending}
                     className="px-6 h-12 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl flex items-center transition-colors disabled:opacity-50"
                   >
                     {createNoticeMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                     공지 등록
                   </button>
                 </div>
               </form>
             </div>
           )}
         </div>
      </div>
    </MainLayout>
  );
}
