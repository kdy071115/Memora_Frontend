import MainLayout from "@/components/layout/MainLayout";
import Link from "next/link";
import { BookOpen, Search, Plus, Filter } from "lucide-react";

export default function CoursesPage() {
  const courses = [
    { id: 1, title: "인공지능 개론", desc: "신경망 구조와 딥러닝의 이해", progress: 45, color: "blue", tag: "전공 필수" },
    { id: 2, title: "알고리즘 및 자료구조", desc: "그래프 탐색과 시간 복잡도 분석", progress: 80, color: "pink", tag: "교양 필수" },
    { id: 3, title: "운영체제 이해", desc: "프로세스 관리와 메모리 할당 기법", progress: 12, color: "indigo", tag: "전공 필수" },
    { id: 4, title: "오픈소스 기여 전략", desc: "GithHub 생태계 이해 및 기여 방법론", progress: 100, color: "green", tag: "특강" },
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case "blue": return { bg: "bg-blue-500", lightBg: "bg-blue-100", text: "text-blue-600", grad: "from-blue-50 to-indigo-50" };
      case "pink": return { bg: "bg-pink-500", lightBg: "bg-purple-100", text: "text-purple-600", grad: "from-purple-50 to-pink-50" };
      case "indigo": return { bg: "bg-indigo-500", lightBg: "bg-indigo-100", text: "text-indigo-600", grad: "from-blue-50 to-purple-50" };
      case "green": return { bg: "bg-emerald-500", lightBg: "bg-emerald-100", text: "text-emerald-600", grad: "from-emerald-50 to-teal-50" };
      default: return { bg: "bg-primary", lightBg: "bg-primary/20", text: "text-primary", grad: "from-blue-50 to-indigo-50" };
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col w-full py-8 text-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
             <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">나의 학습 코스 📚</h1>
             <p className="text-slate-500 font-medium text-lg">지금까지 학습한 모든 강의와 자료들을 관리하세요.</p>
          </div>
          <Link href="/courses/create" className="h-14 px-6 bg-gradient-to-r from-blue-600 to-primary text-white rounded-[2rem] font-bold shadow-lg shadow-primary/20 hover:-translate-y-1 hover:shadow-xl transition-all flex items-center group">
            <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
            새 강의 추가하기
          </Link>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
           <div className="relative flex-1">
             <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
             <input 
               type="text" 
               placeholder="강의명이나 키워드를 검색해보세요" 
               className="w-full h-14 pl-12 pr-4 bg-white border border-slate-200 rounded-[2rem] shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-slate-700 font-medium placeholder:text-slate-400"
             />
           </div>
           <button className="h-14 px-6 bg-white border border-slate-200 rounded-[2rem] font-bold text-slate-600 shadow-sm hover:bg-slate-50 transition-all flex items-center">
             <Filter className="w-5 h-5 mr-2 text-slate-400" />
             필터
           </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {courses.map((course) => {
            const colors = getColorClasses(course.color);
            return (
              <Link key={course.id} href={`/learn/${course.id}`} className="group bg-white border border-slate-100 rounded-[2rem] overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col">
                <div className={`h-40 bg-gradient-to-br ${colors.grad} flex items-center justify-center p-6 relative overflow-hidden shrink-0`}>
                  <div className="w-32 h-32 absolute -right-4 -bottom-4 bg-white/40 rounded-full blur-xl mix-blend-overlay" />
                  <BookOpen className={`w-16 h-16 ${colors.text} opacity-20 group-hover:scale-110 transition-transform duration-500`} />
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <span className={`text-xs font-bold ${colors.lightBg} ${colors.text} px-3 py-1 rounded-full mb-3 inline-block w-max`}>
                    {course.tag}
                  </span>
                  <h3 className="font-bold text-xl mb-1 truncate text-slate-800">{course.title}</h3>
                  <p className="text-sm text-slate-500 mb-6 line-clamp-2 font-medium flex-1">{course.desc}</p>
                  
                  <div className="space-y-2 mt-auto">
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-slate-700">진도율</span>
                      <span className={colors.text}>{course.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div className={`${colors.bg} h-2.5 rounded-full transition-all duration-1000`} style={{ width: `${course.progress}%` }} />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
}
