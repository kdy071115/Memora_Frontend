"use client";
import React, { use, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCourseById, enrollCourse, updateCourse, deleteCourse } from "@/lib/api/courses";
import { getLectures, createLecture, updateLecture, deleteLecture, uploadDocument } from "@/lib/api/lectures";
import { getNotices, createNotice } from "@/lib/api/notices";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { BookOpen, Users, Key, AlertTriangle, Loader2, Plus, ArrowRight, Bell, Send, Pencil, Check, X, Copy, UploadCloud, FileText, Trash2, ClipboardList } from "lucide-react";
import Link from "next/link";

export default function CourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  const resolvedParams = use(params);
  const courseId = Number(resolvedParams.courseId);
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const [newLectureTitle, setNewLectureTitle] = useState("");
  const [newLectureFiles, setNewLectureFiles] = useState<File[]>([]);
  const [lectureCreateStep, setLectureCreateStep] = useState<"idle" | "creating" | "uploading">("idle");
  const [lectureUploadProgress, setLectureUploadProgress] = useState<{ current: number; total: number } | null>(null);

  // 강의 제목 인라인 편집
  const [isEditingCourseTitle, setIsEditingCourseTitle] = useState(false);
  const [editedCourseTitle, setEditedCourseTitle] = useState("");

  // 차시 제목 인라인 편집 (편집 중인 lectureId 와 임시 값)
  const [editingLectureId, setEditingLectureId] = useState<number | null>(null);
  const [editedLectureTitle, setEditedLectureTitle] = useState("");

  // 초대 코드 복사 피드백
  const [isCodeCopied, setIsCodeCopied] = useState(false);

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
    mutationFn: async ({ title, description, files }: { title: string; description: string; files: File[] }) => {
      setLectureCreateStep("creating");
      const lecture = await createLecture(courseId, { title, description });
      if (files.length > 0) {
        setLectureCreateStep("uploading");
        for (let i = 0; i < files.length; i++) {
          setLectureUploadProgress({ current: i + 1, total: files.length });
          await uploadDocument(lecture.id, files[i]);
        }
      }
      return lecture;
    },
    onSuccess: (newLecture) => {
      queryClient.invalidateQueries({ queryKey: ['lectures', courseId] });
      setNewLectureTitle("");
      setNewLectureFiles([]);
      setLectureCreateStep("idle");
      setLectureUploadProgress(null);
      router.push(`/learn/${newLecture.id}`);
    },
    onError: (error: any) => {
      setLectureCreateStep("idle");
      setLectureUploadProgress(null);
      const msg = error?.response?.data?.message;
      alert(msg ? `차시 생성 실패: ${msg}` : "차시 생성에 실패했습니다.");
    }
  });

  const updateCourseMutation = useMutation({
    mutationFn: (data: { title: string; description: string }) => updateCourse(courseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setIsEditingCourseTitle(false);
    },
    onError: () => {
      alert("강의 제목 수정에 실패했습니다.");
    },
  });

  const updateLectureMutation = useMutation({
    mutationFn: ({ lectureId, title, description }: { lectureId: number; title: string; description: string }) =>
      updateLecture(lectureId, { title, description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lectures', courseId] });
      setEditingLectureId(null);
      setEditedLectureTitle("");
    },
    onError: () => {
      alert("차시 제목 수정에 실패했습니다.");
    },
  });

  const deleteLectureMutation = useMutation({
    mutationFn: (lectureId: number) => deleteLecture(lectureId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lectures', courseId] });
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message;
      alert(msg ? `차시 삭제 실패: ${msg}` : "차시 삭제에 실패했습니다.");
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: () => deleteCourse(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.removeQueries({ queryKey: ['course', courseId] });
      queryClient.removeQueries({ queryKey: ['lectures', courseId] });
      queryClient.removeQueries({ queryKey: ['notices', courseId] });
      router.replace('/courses');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message;
      alert(msg ? `강의 삭제 실패: ${msg}` : "강의 삭제에 실패했습니다.");
    },
  });

  const handleDeleteCourse = () => {
    if (!course) return;
    const promptMsg = `정말 "${course.title}" 강의를 삭제하시겠습니까?\n\n` +
      `이 강의에 속한 모든 차시·자료·퀴즈·QA 기록·공지·수강 정보가 영구히 삭제됩니다.\n` +
      `이 작업은 되돌릴 수 없습니다.\n\n` +
      `계속하려면 강의 제목 "${course.title}"을(를) 정확히 입력하세요.`;
    const input = prompt(promptMsg);
    if (input === null) return;
    if (input.trim() !== course.title) {
      alert("입력한 제목이 일치하지 않습니다. 삭제가 취소되었습니다.");
      return;
    }
    deleteCourseMutation.mutate();
  };

  const handleDeleteLecture = (lectureId: number, title: string) => {
    if (!confirm(`"${title}" 차시를 삭제하시겠습니까?\n첨부된 자료와 분석 데이터도 함께 삭제됩니다.`)) return;
    deleteLectureMutation.mutate(lectureId);
  };

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
    const trimmedTitle = newLectureTitle.trim();
    const fallbackTitle = (() => {
      if (newLectureFiles.length === 0) return "";
      const nextOrder = lectures.length + 1;
      if (newLectureFiles.length === 1) {
        return `${nextOrder}차시: ${newLectureFiles[0].name.replace(/\.[^/.]+$/, "")}`;
      }
      return `${nextOrder}차시: 강의 자료 (${newLectureFiles.length}개)`;
    })();
    const finalTitle = trimmedTitle || fallbackTitle;
    if (!finalTitle) {
      alert("차시 제목을 입력하거나 파일을 선택해주세요.");
      return;
    }
    createLectureMutation.mutate({ title: finalTitle, description: "", files: newLectureFiles });
  };

  const handleCreateNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoticeTitle.trim() || !newNoticeContent.trim()) return;
    createNoticeMutation.mutate({ title: newNoticeTitle, content: newNoticeContent });
  };

  const startEditCourseTitle = () => {
    if (!course) return;
    setEditedCourseTitle(course.title);
    setIsEditingCourseTitle(true);
  };

  const submitCourseTitle = () => {
    if (!course) return;
    const next = editedCourseTitle.trim();
    if (!next || next === course.title) {
      setIsEditingCourseTitle(false);
      return;
    }
    updateCourseMutation.mutate({ title: next, description: course.description ?? "" });
  };

  const startEditLectureTitle = (lectureId: number, currentTitle: string) => {
    setEditingLectureId(lectureId);
    setEditedLectureTitle(currentTitle);
  };

  const submitLectureTitle = (lectureId: number, currentTitle: string, description: string) => {
    const next = editedLectureTitle.trim();
    if (!next || next === currentTitle) {
      setEditingLectureId(null);
      setEditedLectureTitle("");
      return;
    }
    updateLectureMutation.mutate({ lectureId, title: next, description: description ?? "" });
  };

  const handleCopyInviteCode = async () => {
    if (!course?.inviteCode) return;
    try {
      await navigator.clipboard.writeText(course.inviteCode);
      setIsCodeCopied(true);
      setTimeout(() => setIsCodeCopied(false), 1500);
    } catch {
      alert("클립보드 복사에 실패했습니다. 코드를 직접 선택해주세요.");
    }
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
              {isInstructor && isEditingCourseTitle ? (
                <div className="flex items-center gap-2 mb-4">
                  <input
                    autoFocus
                    type="text"
                    value={editedCourseTitle}
                    onChange={(e) => setEditedCourseTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submitCourseTitle();
                      if (e.key === "Escape") setIsEditingCourseTitle(false);
                    }}
                    className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight bg-slate-50 border border-primary/40 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 flex-1 min-w-0"
                  />
                  <button
                    type="button"
                    onClick={submitCourseTitle}
                    disabled={updateCourseMutation.isPending}
                    className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 shrink-0"
                    aria-label="저장"
                  >
                    {updateCourseMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingCourseTitle(false)}
                    className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 shrink-0"
                    aria-label="취소"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <h1 className="text-3xl md:text-4xl font-black text-slate-800 mb-4 tracking-tight flex items-center gap-3 group">
                  {course.title}
                  {isInstructor && (
                    <button
                      type="button"
                      onClick={startEditCourseTitle}
                      className="opacity-0 group-hover:opacity-100 transition-opacity w-9 h-9 rounded-xl bg-slate-100 hover:bg-primary/10 hover:text-primary text-slate-400 flex items-center justify-center"
                      aria-label="강의 제목 수정"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                </h1>
              )}
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
              {isInstructor && (
                <button
                  type="button"
                  onClick={handleDeleteCourse}
                  disabled={deleteCourseMutation.isPending}
                  className="px-6 py-3 bg-white text-red-500 border border-red-200 rounded-2xl font-bold hover:bg-red-50 hover:border-red-300 transition-all flex items-center justify-center disabled:opacity-50"
                >
                  {deleteCourseMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      삭제 중...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-5 h-5 mr-2" />
                      강의 삭제
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm text-slate-500 font-medium border-t border-slate-100 pt-6 mt-2">
            <div className="flex items-center">
              <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mr-2 text-lg">👨‍🏫</span>
              <span>담당교수: <strong className="text-slate-700">{course.instructor.name}</strong></span>
            </div>
            {isInstructor ? (
              <Link
                href={`/courses/${resolvedParams.courseId}/students`}
                className="flex items-center group hover:text-blue-600 transition-colors"
              >
                <Users className="w-5 h-5 mr-2" />
                <span>
                  수강생 <strong className="text-slate-700 group-hover:text-blue-600">{course.studentCount}명</strong>
                </span>
                <span className="ml-2 text-xs font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  관리 →
                </span>
              </Link>
            ) : (
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                <span>수강생 <strong className="text-slate-700">{course.studentCount}명</strong></span>
              </div>
            )}
          </div>
          
          {isInstructor && course.inviteCode && (
            <div className="mt-6 bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center text-slate-700 font-medium">
                <Key className="w-5 h-5 mr-2 text-primary" />
                <span className="mr-2">강의 초대 코드:</span>
                <span className="font-mono font-bold text-xl tracking-widest bg-white border border-slate-200 px-3 py-1 rounded inline-block">{course.inviteCode}</span>
              </div>
              <button
                type="button"
                onClick={handleCopyInviteCode}
                className={`text-sm font-bold transition-colors px-4 py-2 rounded-lg flex items-center gap-2 ${
                  isCodeCopied
                    ? "bg-green-500 text-white border border-green-500"
                    : "bg-white text-primary border border-primary/20 hover:text-blue-700"
                }`}
              >
                {isCodeCopied ? (
                  <>
                    <Check className="w-4 h-4" />
                    복사됨
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    코드 복사
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* 협업 / 과제 진입 카드 */}
        {(isEnrolled || isInstructor) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <Link
              href={`/courses/${resolvedParams.courseId}/assignments`}
              className="group bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                <ClipboardList className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-black text-slate-800">과제</p>
                <p className="text-xs font-bold text-slate-400 mt-0.5">
                  과제를 보고 제출하거나 피드백을 주고받으세요
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors shrink-0" />
            </Link>

            <Link
              href={`/courses/${resolvedParams.courseId}/teams`}
              className="group bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:border-violet-200 hover:shadow-md transition-all flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center shrink-0 group-hover:bg-violet-500/20 transition-colors">
                <Users className="w-6 h-6 text-violet-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-black text-slate-800">팀</p>
                <p className="text-xs font-bold text-slate-400 mt-0.5">
                  팀을 만들고 같은 강의 수강생을 초대하세요
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-violet-500 transition-colors shrink-0" />
            </Link>
          </div>
        )}

        {/* 차시 목록 영역 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-800">강의 목차</h2>
            <span className="text-slate-500 font-medium">총 {lectures.length}개 차시</span>
          </div>

          <div className="space-y-4">
            {isLecturesLoading ? (
              <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-300" /></div>
            ) : lectures.map((lecture, index) => {
              const isEditingThisLecture = editingLectureId === lecture.id;
              return (
                <div key={lecture.id} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group gap-4">
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-black text-lg shrink-0">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      {isInstructor && isEditingThisLecture ? (
                        <div className="flex items-center gap-2 mb-1">
                          <input
                            autoFocus
                            type="text"
                            value={editedLectureTitle}
                            onChange={(e) => setEditedLectureTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") submitLectureTitle(lecture.id, lecture.title, lecture.description);
                              if (e.key === "Escape") {
                                setEditingLectureId(null);
                                setEditedLectureTitle("");
                              }
                            }}
                            className="text-lg font-bold text-slate-800 bg-slate-50 border border-primary/40 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30 flex-1 min-w-0"
                          />
                          <button
                            type="button"
                            onClick={() => submitLectureTitle(lecture.id, lecture.title, lecture.description)}
                            disabled={updateLectureMutation.isPending}
                            className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 shrink-0"
                            aria-label="저장"
                          >
                            {updateLectureMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingLectureId(null);
                              setEditedLectureTitle("");
                            }}
                            className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 shrink-0"
                            aria-label="취소"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <h3 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
                          <span className="truncate">{lecture.title}</span>
                          {isInstructor && (
                            <button
                              type="button"
                              onClick={() => startEditLectureTitle(lecture.id, lecture.title)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-lg bg-slate-100 hover:bg-primary/10 hover:text-primary text-slate-400 flex items-center justify-center shrink-0"
                              aria-label="차시 제목 수정"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </h3>
                      )}
                      <p className="text-sm text-slate-500 font-medium">{lecture.description || "자료가 준비되어 있습니다."}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isInstructor && (
                      <button
                        type="button"
                        onClick={() => handleDeleteLecture(lecture.id, lecture.title)}
                        disabled={deleteLectureMutation.isPending}
                        className="w-10 h-10 bg-slate-50 hover:bg-red-50 hover:text-red-500 text-slate-400 rounded-full flex items-center justify-center transition-colors disabled:opacity-50"
                        aria-label="차시 삭제"
                        title="차시 삭제"
                      >
                        {deleteLectureMutation.isPending && deleteLectureMutation.variables === lecture.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    )}
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
                </div>
              );
            })}

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
            <form onSubmit={handleCreateLecture} className="space-y-4">
              <input
                type="text"
                placeholder="차시 제목을 입력하세요 (비워두면 파일명으로 자동 지정)"
                className="w-full h-12 px-5 rounded-xl border border-slate-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium bg-white"
                value={newLectureTitle}
                onChange={(e) => setNewLectureTitle(e.target.value)}
                disabled={createLectureMutation.isPending}
              />

              {/* 파일 업로드 영역 (다중 선택) */}
              <div
                className={`block border-2 border-dashed rounded-2xl bg-white p-6 transition-all ${
                  newLectureFiles.length > 0
                    ? "border-primary/40 bg-primary/5"
                    : "border-slate-200 hover:border-primary/40 hover:bg-slate-50"
                } ${createLectureMutation.isPending ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {newLectureFiles.length === 0 ? (
                  <label className="flex items-center justify-center gap-3 text-slate-500 cursor-pointer">
                    <input
                      type="file"
                      accept=".pdf,.txt"
                      multiple
                      className="hidden"
                      disabled={createLectureMutation.isPending}
                      onChange={(e) => setNewLectureFiles(Array.from(e.target.files ?? []))}
                    />
                    <UploadCloud className="w-6 h-6" />
                    <span className="font-bold text-sm">PDF 또는 텍스트 파일 첨부 (여러 개 가능, 최대 50MB)</span>
                  </label>
                ) : (
                  <div className="space-y-2">
                    {newLectureFiles.map((file, idx) => (
                      <div key={`${file.name}-${idx}`} className="flex items-center justify-between gap-4 bg-white border border-slate-100 rounded-xl px-3 py-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 truncate text-sm">{file.name}</p>
                            <p className="text-xs text-slate-500 font-medium">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNewLectureFiles((prev) => prev.filter((_, i) => i !== idx))}
                          disabled={createLectureMutation.isPending}
                          className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-red-100 hover:text-red-500 text-slate-500 flex items-center justify-center shrink-0 transition-colors"
                          aria-label="파일 제거"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-2">
                      <p className="text-xs font-bold text-slate-500">
                        총 {newLectureFiles.length}개 파일 · {(newLectureFiles.reduce((s, f) => s + f.size, 0) / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <label className="text-xs font-bold text-primary hover:underline cursor-pointer">
                        <input
                          type="file"
                          accept=".pdf,.txt"
                          multiple
                          className="hidden"
                          disabled={createLectureMutation.isPending}
                          onChange={(e) => {
                            const more = Array.from(e.target.files ?? []);
                            if (more.length > 0) setNewLectureFiles((prev) => [...prev, ...more]);
                            e.target.value = "";
                          }}
                        />
                        + 파일 추가
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={createLectureMutation.isPending}
                  className="px-6 h-12 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl flex items-center transition-colors disabled:opacity-50 shrink-0"
                >
                  {createLectureMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      {lectureCreateStep === "uploading"
                        ? lectureUploadProgress
                          ? `자료 업로드 중 (${lectureUploadProgress.current}/${lectureUploadProgress.total})...`
                          : "AI 분석 시작 중..."
                        : "차시 생성 중..."}
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5 mr-2" />
                      차시 추가
                    </>
                  )}
                </button>
              </div>
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
