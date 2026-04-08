"use client";
import MainLayout from "@/components/layout/MainLayout";
import Link from "next/link";
import { useMemo, useState } from "react";
import { BookOpen, Search, Plus, Loader2, GraduationCap, Users, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCourses, enrollByCode } from "@/lib/api/courses";
import { useAuthStore } from "@/lib/store/useAuthStore";

export default function CoursesPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const isInstructor = user?.role === "INSTRUCTOR";
  const [search, setSearch] = useState("");

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["courses"],
    queryFn: getCourses,
  });

  const filteredCourses = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter((c: any) => {
      const title = (c.title ?? "").toLowerCase();
      const desc = (c.description ?? "").toLowerCase();
      const instructor = (c.instructor?.name ?? "").toLowerCase();
      return title.includes(q) || desc.includes(q) || instructor.includes(q);
    });
  }, [courses, search]);

  const enrollMutation = useMutation({
    mutationFn: enrollByCode,
    onSuccess: () => {
      alert("수강 등록이 완료되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
    onError: () => {
      alert("올바르지 않은 초대 코드이거나 이미 수강 중인 강의입니다.");
    },
  });

  const handleEnrollByCode = () => {
    const code = prompt("8자리 강의 초대 코드를 입력하세요:");
    if (code && code.trim() !== "") {
      enrollMutation.mutate(code.trim());
    }
  };

  const gradients = [
    { grad: "from-blue-50 to-indigo-50", text: "text-blue-600", lightBg: "bg-blue-100", bg: "bg-blue-500" },
    { grad: "from-purple-50 to-pink-50", text: "text-purple-600", lightBg: "bg-purple-100", bg: "bg-purple-500" },
    { grad: "from-emerald-50 to-teal-50", text: "text-emerald-600", lightBg: "bg-emerald-100", bg: "bg-emerald-500" },
    { grad: "from-orange-50 to-amber-50", text: "text-orange-600", lightBg: "bg-orange-100", bg: "bg-orange-500" },
  ];

  return (
    <MainLayout>
      <div className="flex flex-col w-full py-8 text-slate-800">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">
              {isInstructor ? "내가 개설한 강의 🎓" : "나의 학습 코스 📚"}
            </h1>
            <p className="text-slate-500 font-medium text-lg">
              {isInstructor
                ? "개설한 모든 강의를 관리하고 학생들의 현황을 확인하세요."
                : "지금까지 학습한 모든 강의와 자료들을 관리하세요."}
            </p>
          </div>
          {isInstructor ? (
            <Link
              href="/courses/create"
              className="h-14 px-6 bg-gradient-to-r from-blue-600 to-primary text-white rounded-[2rem] font-bold shadow-lg shadow-primary/20 hover:-translate-y-1 hover:shadow-xl transition-all flex items-center group"
            >
              <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
              새 강의 개설하기
            </Link>
          ) : (
            <button
              onClick={handleEnrollByCode}
              className="h-14 px-6 bg-gradient-to-r from-purple-600 to-primary text-white rounded-[2rem] font-bold shadow-lg shadow-primary/20 hover:-translate-y-1 hover:shadow-xl transition-all flex items-center group"
            >
              <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
              초대 코드로 수강 등록
            </button>
          )}
        </div>

        {/* Search Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="강의명, 설명, 교강사명으로 검색"
              className="w-full h-14 pl-12 pr-12 bg-white border border-slate-200 rounded-[2rem] shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-slate-700 font-medium placeholder:text-slate-400"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label="검색어 지우기"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="w-full py-20 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p className="text-slate-500 font-medium">강의 데이터를 불러오는 중입니다...</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="w-full py-20 flex flex-col items-center justify-center bg-white border border-slate-100 rounded-[2rem] shadow-sm">
            {isInstructor ? (
              <GraduationCap className="w-16 h-16 text-slate-200 mb-4" />
            ) : (
              <BookOpen className="w-16 h-16 text-slate-200 mb-4" />
            )}
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              {search
                ? "검색 결과가 없습니다"
                : isInstructor
                ? "아직 개설한 강의가 없습니다"
                : "아직 수강 중인 강의가 없습니다"}
            </h3>
            <p className="text-slate-500 font-medium mb-6">
              {isInstructor
                ? "첫 번째 강의를 개설하여 학생들과 함께 시작해보세요."
                : "초대 코드로 강의에 등록하거나 새 강의를 추가해보세요."}
            </p>
            {isInstructor ? (
              <Link
                href="/courses/create"
                className="h-12 px-6 bg-gradient-to-r from-blue-600 to-primary text-white rounded-full font-bold transition-colors flex items-center shadow-md"
              >
                <Plus className="w-4 h-4 mr-2" /> 첫 강의 개설하기
              </Link>
            ) : (
              <button
                onClick={handleEnrollByCode}
                className="h-12 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full font-bold transition-colors flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" /> 초대 코드로 수강 등록
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCourses.map((course: any, idx: number) => {
              const colors = gradients[idx % gradients.length];
              return (
                <Link
                  key={course.id}
                  href={`/courses/${course.id}`}
                  className="group bg-white border border-slate-100 rounded-[2rem] overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col"
                >
                  <div className={`h-40 bg-gradient-to-br ${colors.grad} flex items-center justify-center p-6 relative overflow-hidden shrink-0`}>
                    <div className="w-32 h-32 absolute -right-4 -bottom-4 bg-white/40 rounded-full blur-xl mix-blend-overlay" />
                    <BookOpen className={`w-16 h-16 ${colors.text} opacity-20 group-hover:scale-110 transition-transform duration-500`} />
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <span className={`text-xs font-bold ${colors.lightBg} ${colors.text} px-3 py-1 rounded-full inline-block`}>
                        {course.status === "ACTIVE" ? "진행 중" : "보관됨"}
                      </span>
                      <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {course.studentCount}명
                      </span>
                    </div>
                    <h3 className="font-bold text-xl mb-1 truncate text-slate-800">{course.title}</h3>
                    <p className="text-sm text-slate-500 mb-2 line-clamp-2 font-medium flex-1">
                      {course.description || "강의 설명이 없습니다."}
                    </p>

                    <div className="text-xs text-slate-400 mb-4 flex gap-3">
                      <span>👨‍🏫 {course.instructor?.name || "미상"}</span>
                      <span>📑 {course.lectureCount}차시</span>
                    </div>

                    {/* 학생에게만 진도율 표시 */}
                    {!isInstructor ? (
                      <div className="space-y-2 mt-auto">
                        <div className="flex justify-between text-sm font-bold">
                          <span className="text-slate-700">진도율</span>
                          <span className={colors.text}>
                            {course.isEnrolled ? `${course.progress ?? 0}%` : "미수강"}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`${colors.bg} h-2.5 rounded-full transition-all duration-1000`}
                            style={{ width: `${course.isEnrolled ? (course.progress ?? 0) : 0}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      /* 교강사에게는 강의 관리 버튼 표시 */
                      <div className="mt-auto pt-2">
                        <div className={`text-center text-xs font-bold ${colors.text} ${colors.lightBg} px-4 py-2 rounded-xl`}>
                          강의 관리하기 →
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
