"use client";
import React, { use, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowLeft,
  Loader2,
  ClipboardList,
  Calendar,
  Users as UsersIcon,
  Lock,
  Globe,
  Paperclip,
  Send,
  Trash2,
  Eye,
  EyeOff,
  MessageSquare,
  X,
  AlertTriangle,
  GraduationCap,
  Download,
  ExternalLink,
  Sparkles,
  ClipboardCopy,
  LockKeyhole,
  UnlockKeyhole,
} from "lucide-react";
import {
  getAssignment,
  getAssignmentSubmissions,
  getSubmission,
  createSubmission,
  updateSubmission,
  deleteSubmission,
  addSubmissionComment,
  deleteSubmissionComment,
  deleteAssignment,
  closeAssignmentEarly,
  reopenAssignment,
  fetchSubmissionFileBlob,
  requestAiFeedback,
  getCachedAiFeedback,
  getAssignmentStats,
} from "@/lib/api/assignments";
import { getCourseTeams } from "@/lib/api/teams";
import { getCourseById } from "@/lib/api/courses";
import { useAuthStore } from "@/lib/store/useAuthStore";
import type {
  Submission,
  SubmissionInput,
  SubmissionVisibility,
  AiFeedbackResult,
  AssignmentStats,
} from "@/types/assignment";

export default function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ courseId: string; assignmentId: string }>;
}) {
  const resolvedParams = use(params);
  const courseId = Number(resolvedParams.courseId);
  const assignmentId = Number(resolvedParams.assignmentId);
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const { data: course } = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => getCourseById(courseId),
  });

  const { data: assignment, isLoading } = useQuery({
    queryKey: ["assignment", assignmentId],
    queryFn: () => getAssignment(assignmentId),
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ["submissions", assignmentId],
    queryFn: () => getAssignmentSubmissions(assignmentId),
  });

  const { data: teams = [] } = useQuery({
    queryKey: ["teams", courseId],
    queryFn: () => getCourseTeams(courseId),
    enabled: !!assignment?.allowTeamSubmission,
  });

  const isInstructor =
    user?.role === "INSTRUCTOR" && course?.instructor.id === Number(user.id);

  // 강사용 — 제출 통계 + 미제출자 명단
  const { data: stats } = useQuery({
    queryKey: ["assignmentStats", assignmentId],
    queryFn: () => getAssignmentStats(assignmentId),
    enabled: !!isInstructor,
  });

  // 내가 멤버인 팀만 (학생일 때 팀 선택용)
  const myTeams = useMemo(
    () => teams.filter((t) => t.members.some((m) => m.userId === Number(user?.id))),
    [teams, user]
  );

  // 내 제출물 (개인 + 팀)
  const mySubmission = useMemo(() => {
    if (!user) return null;
    const myTeamIds = new Set(myTeams.map((t) => t.id));
    return (
      submissions.find(
        (s) =>
          s.submitterId === Number(user.id) ||
          (s.teamId !== null && myTeamIds.has(s.teamId))
      ) ?? null
    );
  }, [submissions, user, myTeams]);

  const otherSubmissions = useMemo(
    () => submissions.filter((s) => !mySubmission || s.id !== mySubmission.id),
    [submissions, mySubmission]
  );

  const deleteAssignmentMutation = useMutation({
    mutationFn: () => deleteAssignment(assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments", courseId] });
      router.push(`/courses/${courseId}/assignments`);
    },
    onError: (err: any) => alert(err?.response?.data?.message || "삭제 실패"),
  });

  const closeMutation = useMutation({
    mutationFn: () => closeAssignmentEarly(assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignment", assignmentId] });
      queryClient.invalidateQueries({ queryKey: ["assignments", courseId] });
    },
    onError: (err: any) => alert(err?.response?.data?.message || "조기 마감 실패"),
  });

  const reopenMutation = useMutation({
    mutationFn: () => reopenAssignment(assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignment", assignmentId] });
      queryClient.invalidateQueries({ queryKey: ["assignments", courseId] });
    },
    onError: (err: any) => alert(err?.response?.data?.message || "마감 해제 실패"),
  });

  if (isLoading || !assignment) {
    return (
      <MainLayout>
        <div className="py-32 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  // 백엔드의 closed (closedEarly OR dueDate 지남) 를 우선 신뢰
  const overdue = assignment.closed;
  const dueOver = assignment.dueDate && new Date(assignment.dueDate).getTime() < Date.now();

  return (
    <MainLayout>
      <div className="w-full py-8 max-w-5xl mx-auto">
        <button
          type="button"
          onClick={() => router.push(`/courses/${courseId}/assignments`)}
          className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          과제 목록으로
        </button>

        {/* 과제 헤더 */}
        <div className="bg-card border border-border rounded-3xl p-7 shadow-sm mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <ClipboardList className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-emerald-600 truncate">
                  {assignment.courseTitle}
                </p>
                <h1 className="text-2xl font-black text-foreground truncate">{assignment.title}</h1>
              </div>
            </div>
            {isInstructor && (
              <div className="flex items-center gap-2 shrink-0">
                {assignment.closedEarly ? (
                  <button
                    type="button"
                    disabled={reopenMutation.isPending}
                    onClick={() => reopenMutation.mutate()}
                    className="px-4 h-10 bg-card border border-emerald-500/30 text-emerald-600 font-bold rounded-xl hover:bg-emerald-500/10 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {reopenMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UnlockKeyhole className="w-4 h-4" />
                    )}
                    마감 해제
                  </button>
                ) : (
                  !dueOver && (
                    <button
                      type="button"
                      disabled={closeMutation.isPending}
                      onClick={() => {
                        if (confirm("지금 즉시 마감 처리합니다. 학생은 더 이상 제출/수정할 수 없습니다. 계속하시겠습니까?")) {
                          closeMutation.mutate();
                        }
                      }}
                      className="px-4 h-10 bg-card border border-amber-500/30 text-amber-600 font-bold rounded-xl hover:bg-amber-500/10 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {closeMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <LockKeyhole className="w-4 h-4" />
                      )}
                      조기 마감
                    </button>
                  )
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("과제와 모든 제출물·댓글을 삭제합니다. 계속하시겠습니까?")) {
                      deleteAssignmentMutation.mutate();
                    }
                  }}
                  className="px-4 h-10 bg-card border border-rose-500/30 text-rose-500 font-bold rounded-xl hover:bg-rose-500/10 transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  삭제
                </button>
              </div>
            )}
          </div>

          <div className="markdown-body text-foreground mb-5">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{assignment.description}</ReactMarkdown>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-bold text-muted-foreground border-t border-border pt-4">
            <span className="flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5" />
              {assignment.instructorName}
            </span>
            {assignment.dueDate && (
              <span
                className={`flex items-center gap-1.5 ${
                  overdue ? "text-rose-500" : ""
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                마감 {formatDateTime(assignment.dueDate)}
                {overdue && " (마감됨)"}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <UsersIcon className="w-3.5 h-3.5" />
              제출 {assignment.submissionCount}건
            </span>
            {assignment.allowTeamSubmission && (
              <span className="text-violet-600">팀 단위 제출 허용</span>
            )}
          </div>
        </div>

        {/* 강사: 제출 통계 + 미제출자 패널 */}
        {isInstructor && stats && (
          <InstructorStatsPanel stats={stats} />
        )}

        {/* 학생: 내 제출물 영역 */}
        {!isInstructor && (
          <SubmissionEditor
            assignmentId={assignmentId}
            existing={mySubmission}
            allowTeam={assignment.allowTeamSubmission}
            myTeams={myTeams}
            overdue={!!overdue}
            closedEarly={assignment.closedEarly}
            dueDate={assignment.dueDate}
            onChange={() => {
              queryClient.invalidateQueries({ queryKey: ["submissions", assignmentId] });
              queryClient.invalidateQueries({ queryKey: ["assignment", assignmentId] });
            }}
          />
        )}

        {/* 학생: 내 제출물에 달린 강사 피드백 / 댓글 thread */}
        {!isInstructor && mySubmission && (
          <div className="mt-6">
            <h2 className="text-lg font-black text-foreground mb-4">내 제출물에 달린 피드백</h2>
            <SubmissionCard
              submission={mySubmission}
              isInstructor={false}
              isOwner={mySubmission.submitterId === Number(user?.id)}
              myTeamIds={new Set(myTeams.map((t) => t.id))}
              defaultOpen
            />
          </div>
        )}

        {/* 제출물 목록 */}
        <div className="mt-8">
          <h2 className="text-lg font-black text-foreground mb-4">
            {isInstructor
              ? `제출물 ${submissions.length}건`
              : `다른 학생의 공개 제출물 ${otherSubmissions.length}건`}
          </h2>
          {(isInstructor ? submissions : otherSubmissions).length === 0 ? (
            <p className="text-muted-foreground font-medium text-sm py-6">
              {isInstructor
                ? "아직 제출된 과제가 없습니다."
                : "아직 공개된 다른 제출물이 없습니다."}
            </p>
          ) : (
            <div className="space-y-4">
              {(isInstructor ? submissions : otherSubmissions).map((s) => (
                <SubmissionCard
                  key={s.id}
                  submission={s}
                  isInstructor={!!isInstructor}
                  isOwner={s.submitterId === Number(user?.id)}
                  myTeamIds={new Set(myTeams.map((t) => t.id))}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

// ─────────────────────────────────────────────────────────────────
// 제출물 작성 / 수정 (학생 본인용)
// ─────────────────────────────────────────────────────────────────
function SubmissionEditor({
  assignmentId,
  existing,
  allowTeam,
  myTeams,
  overdue,
  closedEarly,
  dueDate,
  onChange,
}: {
  assignmentId: number;
  existing: Submission | null;
  allowTeam: boolean;
  myTeams: { id: number; name: string }[];
  overdue: boolean;
  closedEarly: boolean;
  dueDate: string | null;
  onChange: () => void;
}) {
  const [content, setContent] = useState(existing?.content ?? "");
  const [visibility, setVisibility] = useState<SubmissionVisibility>(
    existing?.visibility ?? "PRIVATE"
  );
  const [teamId, setTeamId] = useState<number | null>(existing?.teamId ?? null);
  const [file, setFile] = useState<File | null>(null);
  const [removeAttachment, setRemoveAttachment] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditing = !!existing;
  const locked = overdue;

  // existing 이 비동기로 들어오면 form 동기화
  React.useEffect(() => {
    if (existing) {
      setContent(existing.content);
      setVisibility(existing.visibility);
      setTeamId(existing.teamId);
    }
  }, [existing]);

  const mutation = useMutation({
    mutationFn: () => {
      const input: SubmissionInput = {
        content: content.trim(),
        visibility,
        teamId: allowTeam ? teamId : null,
      };
      if (isEditing && existing) {
        return updateSubmission(existing.id, input, file, removeAttachment);
      }
      return createSubmission(assignmentId, input, file);
    },
    onSuccess: () => {
      setFile(null);
      setRemoveAttachment(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onChange();
    },
    onError: (err: any) => alert(err?.response?.data?.message || "제출 실패"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteSubmission(existing!.id),
    onSuccess: () => {
      setContent("");
      setVisibility("PRIVATE");
      setTeamId(null);
      onChange();
    },
    onError: (err: any) => alert(err?.response?.data?.message || "삭제 실패"),
  });

  return (
    <div
      className={`bg-card border rounded-3xl p-6 shadow-sm ${
        locked ? "border-border" : "border-emerald-500/20"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-black text-foreground">
          {locked
            ? isEditing
              ? "내 제출물 (마감됨 — 읽기 전용)"
              : "마감된 과제"
            : isEditing
            ? "내 제출물 수정"
            : "내 제출물 작성"}
        </h2>
        {isEditing && !locked && (
          <button
            type="button"
            onClick={() => {
              if (confirm("제출물을 삭제합니다. 계속하시겠습니까?")) deleteMutation.mutate();
            }}
            className="text-xs font-bold text-rose-500 hover:underline flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            제출물 삭제
          </button>
        )}
      </div>

      {/* 마감 안내 배너 */}
      {locked && (
        <div className="mb-4 flex items-start gap-3 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
          <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
          <div className="text-xs leading-relaxed">
            <p className="font-black text-rose-700 mb-0.5">
              {closedEarly
                ? "강사가 이 과제를 조기 마감했습니다"
                : dueDate
                ? `마감되었습니다 (${formatDateTime(dueDate)})`
                : "마감되었습니다"}
            </p>
            <p className="text-rose-600 font-medium">
              {isEditing
                ? "마감 이후에는 본문과 첨부를 수정할 수 없습니다. 강사 피드백은 아래에서 확인하세요."
                : "마감 이후에는 새로 제출할 수 없습니다."}
            </p>
          </div>
        </div>
      )}

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={8}
        placeholder="과제 내용을 작성해주세요. (markdown 지원)"
        readOnly={locked}
        disabled={locked}
        className={`w-full px-4 py-3 rounded-xl border font-medium resize-y mb-4 ${
          locked
            ? "border-border bg-muted text-muted-foreground cursor-not-allowed"
            : "border-border focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
        }`}
      />

      {/* 첨부 */}
      <div className="bg-muted rounded-xl p-3 mb-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <Paperclip className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium text-muted-foreground truncate">
            {file
              ? file.name
              : existing?.attachmentName && !removeAttachment
              ? existing.attachmentName
              : "첨부 파일 없음"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const selected = e.target.files?.[0] ?? null;
              setFile(selected);
              if (selected) setRemoveAttachment(false);
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={locked}
            className="text-xs font-bold text-emerald-600 hover:underline disabled:text-muted-foreground disabled:no-underline disabled:cursor-not-allowed"
          >
            파일 선택
          </button>
          {!locked && (file || (existing?.attachmentName && !removeAttachment)) && (
            <button
              type="button"
              onClick={() => {
                setFile(null);
                if (existing?.attachmentName) setRemoveAttachment(true);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="text-xs font-bold text-rose-500 hover:underline"
            >
              제거
            </button>
          )}
        </div>
      </div>

      {/* 옵션 */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <button
          type="button"
          disabled={locked}
          onClick={() => setVisibility(visibility === "PUBLIC" ? "PRIVATE" : "PUBLIC")}
          className={`h-10 px-4 rounded-xl border font-bold text-sm flex items-center gap-2 transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
            visibility === "PUBLIC"
              ? "bg-blue-500/10 border-blue-300 text-blue-700"
              : "bg-muted border-border text-muted-foreground"
          }`}
        >
          {visibility === "PUBLIC" ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          {visibility === "PUBLIC" ? "공개" : "비공개"}
        </button>

        {allowTeam && (
          <select
            value={teamId ?? ""}
            disabled={locked}
            onChange={(e) => setTeamId(e.target.value ? Number(e.target.value) : null)}
            className="h-10 px-4 rounded-xl border border-border font-bold text-sm text-foreground bg-card disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="">개인 제출</option>
            {myTeams.map((t) => (
              <option key={t.id} value={t.id}>
                팀: {t.name}
              </option>
            ))}
          </select>
        )}

        {!locked && (
          <button
            type="button"
            disabled={mutation.isPending || !content.trim()}
            onClick={() => mutation.mutate()}
            className="ml-auto h-10 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {mutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {isEditing ? "수정 제출" : "제출하기"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// 제출물 카드 (목록) — 클릭하면 상세 펼침 + 댓글 thread
// ─────────────────────────────────────────────────────────────────
function SubmissionCard({
  submission,
  isInstructor,
  isOwner,
  myTeamIds,
  defaultOpen = false,
}: {
  submission: Submission;
  isInstructor: boolean;
  isOwner: boolean;
  myTeamIds: Set<number>;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  // 펼쳤을 때만 상세 (댓글 포함) 조회
  const { data: detail } = useQuery({
    queryKey: ["submission", submission.id],
    queryFn: () => getSubmission(submission.id),
    enabled: open,
  });

  const isMyTeam = submission.teamId !== null && myTeamIds.has(submission.teamId);
  const canComment = isInstructor || isOwner || isMyTeam;

  const [commentText, setCommentText] = useState("");
  const [dismissedAiFeedback, setDismissedAiFeedback] = useState(false);

  // 강사일 때만 캐시된 AI 피드백을 가져온다.
  // status 가 PENDING 이면 2초 간격으로 polling, READY/FAILED 면 멈춤.
  const { data: aiFeedback } = useQuery({
    queryKey: ["aiFeedbackCache", submission.id],
    queryFn: () => getCachedAiFeedback(submission.id),
    enabled: open && isInstructor && !dismissedAiFeedback,
    refetchInterval: (query) => {
      const data = query.state.data as AiFeedbackResult | null;
      return data?.status === "PENDING" ? 2000 : false;
    },
  });

  const aiFeedbackMutation = useMutation({
    mutationFn: () => requestAiFeedback(submission.id),
    onSuccess: () => {
      setDismissedAiFeedback(false);
      // 즉시 PENDING 상태가 캐시에 반영되도록 polling 재시작
      queryClient.invalidateQueries({ queryKey: ["aiFeedbackCache", submission.id] });
    },
    onError: (err: any) => alert(err?.response?.data?.message || "AI 피드백 생성 실패"),
  });

  const commentMutation = useMutation({
    mutationFn: () => addSubmissionComment(submission.id, commentText.trim()),
    onSuccess: () => {
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: ["submission", submission.id] });
    },
    onError: (err: any) => alert(err?.response?.data?.message || "댓글 작성 실패"),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: number) => deleteSubmissionComment(commentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["submission", submission.id] }),
  });

  const visIcon = submission.visibility === "PUBLIC" ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />;
  const visClass =
    submission.visibility === "PUBLIC"
      ? "bg-blue-500/10 text-blue-700 ring-blue-500/30"
      : "bg-muted text-muted-foreground ring-border";

  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-5 py-4 flex items-center justify-between gap-4 hover:bg-muted/60 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-black shrink-0">
            {submission.submitterName.charAt(0)}
          </div>
          <div className="text-left min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-black text-foreground truncate">
                {submission.submitterName}
              </p>
              {submission.teamName && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-700 ring-1 ring-violet-500/30">
                  팀: {submission.teamName}
                </span>
              )}
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full ring-1 flex items-center gap-1 ${visClass}`}
              >
                {visIcon}
                {submission.visibility === "PUBLIC" ? "공개" : "비공개"}
              </span>
              {submission.hasAttachment && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/30 flex items-center gap-1">
                  <Paperclip className="w-3 h-3" />
                  첨부
                </span>
              )}
            </div>
            <p className="text-[11px] font-bold text-muted-foreground mt-0.5">
              {formatDateTime(submission.createdAt)}
            </p>
          </div>
        </div>
        <span className="text-xs font-bold text-muted-foreground shrink-0">
          {open ? "접기" : "자세히"}
        </span>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-border">
          <div className="markdown-body text-foreground mt-4 mb-4">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{submission.content}</ReactMarkdown>
          </div>

          {submission.hasAttachment && (
            <AttachmentActions
              submissionId={submission.id}
              fileName={submission.attachmentName ?? "attachment"}
            />
          )}

          {/* 댓글 thread */}
          <div className="mt-2">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              <h4 className="text-sm font-black text-foreground">
                피드백 {detail?.comments?.length ?? 0}
              </h4>
            </div>

            {detail?.comments && detail.comments.length > 0 ? (
              <ul className="space-y-3 mb-4">
                {detail.comments.map((c) => (
                  <li
                    key={c.id}
                    className={`p-4 rounded-2xl border ${
                      c.authorRole === "INSTRUCTOR"
                        ? "bg-blue-500/10 border-blue-500/20"
                        : "bg-muted border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-foreground">{c.authorName}</span>
                        {c.authorRole === "INSTRUCTOR" && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-700">
                            강사
                          </span>
                        )}
                        <span className="text-[11px] font-bold text-muted-foreground">
                          {formatDateTime(c.createdAt)}
                        </span>
                      </div>
                      {(c.authorId === Number(user?.id) || isInstructor) && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm("댓글을 삭제하시겠습니까?"))
                              deleteCommentMutation.mutate(c.id);
                          }}
                          className="text-muted-foreground/60 hover:text-rose-500"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="markdown-body text-sm text-foreground">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{c.content}</ReactMarkdown>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs font-medium text-muted-foreground mb-3">
                아직 피드백이 없습니다.
              </p>
            )}

            {/* 강사용 AI 피드백 패널 */}
            {isInstructor && (
              <AiFeedbackPanel
                feedback={aiFeedback ?? null}
                loading={aiFeedbackMutation.isPending || aiFeedback?.status === "PENDING"}
                onGenerate={() => aiFeedbackMutation.mutate()}
                onUseDraft={(text) => {
                  setCommentText(text);
                  // 결과는 그대로 두어 강사가 다시 확인할 수 있게 함
                }}
                onClear={() => setDismissedAiFeedback(true)}
              />
            )}

            {canComment ? (
              <div className="flex gap-2">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={2}
                  placeholder={
                    isInstructor
                      ? "학생에게 피드백을 남겨주세요..."
                      : "강사님께 답글을 작성해주세요..."
                  }
                  className="flex-1 px-4 py-2 rounded-xl border border-border focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 font-medium text-sm resize-none"
                />
                <button
                  type="button"
                  disabled={!commentText.trim() || commentMutation.isPending}
                  onClick={() => commentMutation.mutate()}
                  className="px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl disabled:opacity-50 flex items-center gap-1"
                >
                  {commentMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                다른 학생의 제출물에는 댓글을 작성할 수 없습니다.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function formatDateTime(s: string) {
  const d = new Date(s);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// ─────────────────────────────────────────────────────────────────
// 강사용 제출 통계 + 미제출자 패널
// ─────────────────────────────────────────────────────────────────
function InstructorStatsPanel({ stats }: { stats: AssignmentStats }) {
  const [showMissing, setShowMissing] = useState(false);
  const rate = stats.submissionRate;
  const rateColor =
    rate >= 80 ? "text-emerald-600" : rate >= 50 ? "text-blue-600" : "text-rose-600";
  const barColor =
    rate >= 80
      ? "bg-emerald-500"
      : rate >= 50
      ? "bg-blue-500"
      : "bg-rose-500";

  return (
    <div className="bg-card border border-border rounded-3xl p-6 shadow-sm mb-6">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0">
            <UsersIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-muted-foreground">제출 현황</p>
            <p className="text-sm font-black text-foreground">
              {stats.submittedStudents} / {stats.totalStudents}명 제출
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className={`text-3xl font-black leading-none ${rateColor}`}>{rate}%</p>
          <p className="text-[10px] font-bold text-muted-foreground mt-0.5">제출률</p>
        </div>
      </div>

      <div className="w-full bg-muted rounded-full h-2 overflow-hidden mb-4">
        <div
          className={`h-2 rounded-full ${barColor} transition-all duration-700`}
          style={{ width: `${rate}%` }}
        />
      </div>

      {stats.missing.length > 0 ? (
        <div>
          <button
            type="button"
            onClick={() => setShowMissing((v) => !v)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/10 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <span className="text-xs font-black text-rose-700">
                미제출 {stats.missing.length}명
              </span>
            </div>
            <span className="text-[11px] font-bold text-rose-600">
              {showMissing ? "숨기기" : "명단 보기"}
            </span>
          </button>
          {showMissing && (
            <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {stats.missing.map((m) => (
                <li
                  key={m.userId}
                  className="flex items-center gap-2 p-2 bg-muted rounded-xl"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-400 to-rose-500 flex items-center justify-center text-white text-xs font-black shrink-0">
                    {m.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{m.name}</p>
                    <p className="text-[10px] font-medium text-muted-foreground truncate">{m.email}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <p className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          모든 수강생이 제출했어요!
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// 강사용 AI 피드백 패널
// ─────────────────────────────────────────────────────────────────
const GRADE_STYLE: Record<string, { label: string; bg: string; text: string; ring: string }> = {
  EXCELLENT: { label: "훌륭", bg: "bg-emerald-500/10", text: "text-emerald-700", ring: "ring-emerald-500/30" },
  GOOD: { label: "양호", bg: "bg-blue-500/10", text: "text-blue-700", ring: "ring-blue-500/30" },
  AVERAGE: { label: "보통", bg: "bg-muted", text: "text-muted-foreground", ring: "ring-border" },
  NEEDS_WORK: { label: "보완필요", bg: "bg-amber-500/10", text: "text-amber-700", ring: "ring-amber-500/30" },
};

function AiFeedbackPanel({
  feedback,
  loading,
  onGenerate,
  onUseDraft,
  onClear,
}: {
  feedback: AiFeedbackResult | null;
  loading: boolean;
  onGenerate: () => void;
  onUseDraft: (text: string) => void;
  onClear: () => void;
}) {
  const status = feedback?.status;
  const isPending = loading || status === "PENDING";
  const isFailed = status === "FAILED";
  const hasResult = !!feedback && status !== "PENDING" && status !== "FAILED" && feedback.overallScore != null;

  if (!feedback && !loading) {
    return (
      <div className="mb-4">
        <button
          type="button"
          onClick={onGenerate}
          className="inline-flex items-center gap-2 px-4 h-10 rounded-xl bg-gradient-to-r from-violet-500 to-blue-500 text-white font-bold text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
        >
          <Sparkles className="w-4 h-4" />
          AI 피드백 생성
        </button>
        <p className="text-[11px] font-medium text-muted-foreground mt-1.5 leading-relaxed">
          제출 본문과 첨부 파일(PDF·텍스트)을 과제 주제와 비교해 AI 가 피드백 초안을 만들어드려요.
          백그라운드로 처리되니 패널을 닫고 다른 작업을 해도 결과가 캐시에 저장됩니다.
        </p>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="mb-4 bg-violet-500/10 border border-violet-500/20 rounded-2xl p-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-violet-500 animate-spin" />
          <p className="text-sm font-bold text-violet-700">
            AI 가 제출물을 읽는 중입니다... (PDF 는 10-30초 정도 걸려요)
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-muted-foreground hover:text-muted-foreground"
          title="패널 닫기 (작업은 백그라운드에서 계속됨)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (isFailed) {
    return (
      <div className="mb-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <p className="text-sm font-black text-rose-700">AI 피드백 생성에 실패했어요</p>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="text-muted-foreground hover:text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {feedback?.errorMessage && (
          <p className="text-xs font-medium text-rose-600 mb-3">{feedback.errorMessage}</p>
        )}
        <button
          type="button"
          onClick={onGenerate}
          className="inline-flex items-center gap-2 px-4 h-9 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs"
        >
          <Sparkles className="w-3.5 h-3.5" />
          다시 시도
        </button>
      </div>
    );
  }

  if (!hasResult) return null;

  // feedback 존재
  const meta = GRADE_STYLE[feedback!.grade] || GRADE_STYLE.AVERAGE;

  return (
    <div className="mb-4 bg-gradient-to-br from-violet-500/10 to-blue-500/10 border border-violet-500/20 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-card ring-1 ring-violet-500/30 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-violet-500" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black text-violet-600 mb-0.5">AI 피드백 초안</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-2xl font-black text-foreground">{feedback!.overallScore}점</span>
              <span
                className={`text-[11px] font-black px-2 py-0.5 rounded-full ${meta.bg} ${meta.text} ring-1 ${meta.ring}`}
              >
                {meta.label}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onGenerate}
            className="text-xs font-bold text-violet-600 hover:underline"
            title="새로 생성"
          >
            재생성
          </button>
          <button
            type="button"
            onClick={onClear}
            className="text-muted-foreground hover:text-muted-foreground"
            title="패널 닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {feedback!.summary && (
        <p className="text-sm text-foreground font-medium leading-relaxed mb-4 bg-card/60 rounded-xl px-4 py-3">
          {feedback!.summary}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {(feedback!.strengths?.length ?? 0) > 0 && (
          <FeedbackList title="잘한 점" items={feedback!.strengths!} dot="bg-emerald-400" />
        )}
        {(feedback!.improvements?.length ?? 0) > 0 && (
          <FeedbackList title="보완 포인트" items={feedback!.improvements!} dot="bg-amber-400" />
        )}
        {(feedback!.missingPoints?.length ?? 0) > 0 && (
          <FeedbackList title="빠뜨린 항목" items={feedback!.missingPoints!} dot="bg-rose-400" />
        )}
        {(feedback!.suggestions?.length ?? 0) > 0 && (
          <FeedbackList title="다음 단계 제안" items={feedback!.suggestions!} dot="bg-blue-400" />
        )}
      </div>

      {feedback!.instructorDraft && (
        <div className="bg-card border border-violet-500/20 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-black text-violet-600 uppercase tracking-wider">
              댓글 초안
            </p>
            <button
              type="button"
              onClick={() => onUseDraft(feedback!.instructorDraft!)}
              className="inline-flex items-center gap-1 text-xs font-bold text-violet-600 hover:text-violet-700"
            >
              <ClipboardCopy className="w-3.5 h-3.5" />
              이 초안 사용하기
            </button>
          </div>
          <p className="text-sm text-foreground font-medium whitespace-pre-wrap leading-relaxed">
            {feedback!.instructorDraft}
          </p>
        </div>
      )}

      <p className="text-[11px] font-medium text-muted-foreground mt-3 leading-relaxed">
        ※ AI 가 생성한 초안입니다. 강사가 검토·수정한 뒤 댓글로 게시하세요.
      </p>
    </div>
  );
}

function FeedbackList({
  title,
  items,
  dot,
}: {
  title: string;
  items: string[];
  dot: string;
}) {
  return (
    <div className="bg-card/60 rounded-xl p-3">
      <p className="text-[11px] font-black text-muted-foreground uppercase tracking-wider mb-1.5">
        {title}
      </p>
      <ul className="space-y-1">
        {items.map((it, i) => (
          <li
            key={i}
            className="text-xs text-foreground font-medium leading-relaxed pl-3 relative"
          >
            <span className={`absolute left-0 top-1.5 w-1 h-1 rounded-full ${dot}`} />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

function isUseful(mime: string): boolean {
  if (!mime) return false;
  if (mime === "application/octet-stream") return false;
  return true;
}

/** 파일명만 보고 브라우저가 새 탭에서 직접 렌더 가능한지 판단. */
function isBrowserPreviewable(name: string): boolean {
  const lower = (name || "").toLowerCase();
  return (
    lower.endsWith(".pdf") ||
    lower.endsWith(".png") ||
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".gif") ||
    lower.endsWith(".webp") ||
    lower.endsWith(".svg") ||
    lower.endsWith(".txt") ||
    lower.endsWith(".md") ||
    lower.endsWith(".csv") ||
    lower.endsWith(".html") ||
    lower.endsWith(".htm") ||
    lower.endsWith(".json")
  );
}

/** 사용자에게 보여줄 파일 종류 라벨. */
function fileKindLabel(name: string): string | null {
  const lower = (name || "").toLowerCase();
  if (lower.endsWith(".pdf")) return "PDF";
  if (/\.(png|jpe?g|gif|webp|svg)$/.test(lower)) return "이미지";
  if (/\.(txt|md|csv|html?|json)$/.test(lower)) return "텍스트";
  if (/\.(docx?|odt)$/.test(lower)) return "Word 문서";
  if (/\.(xlsx?|ods)$/.test(lower)) return "Excel 문서";
  if (/\.(pptx?|odp)$/.test(lower)) return "PowerPoint 문서";
  if (/\.zip$/.test(lower)) return "압축 파일";
  return null;
}

function guessMimeFromName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  if (lower.endsWith(".txt") || lower.endsWith(".md")) return "text/plain";
  if (lower.endsWith(".csv")) return "text/csv";
  if (lower.endsWith(".html") || lower.endsWith(".htm")) return "text/html";
  if (lower.endsWith(".json")) return "application/json";
  return "application/octet-stream";
}

// ─────────────────────────────────────────────────────────────────
// 첨부 파일 액션 — 인증된 axios 로 blob 을 받아 미리보기/다운로드
// 단순 <a href> 는 JWT 헤더가 안 붙어서 401 이 뜨는 문제를 해결.
// ─────────────────────────────────────────────────────────────────
function AttachmentActions({
  submissionId,
  fileName,
}: {
  submissionId: number;
  fileName: string;
}) {
  const [loading, setLoading] = React.useState<"preview" | "download" | null>(null);
  const previewable = isBrowserPreviewable(fileName);
  const kindLabel = fileKindLabel(fileName);

  const handle = async (mode: "preview" | "download") => {
    // 미리보기는 await 이후 window.open 을 부르면 사용자 제스처가 끊겨
    // 팝업 차단에 걸린다. 따라서 클릭 즉시 동기로 빈 창을 먼저 띄워두고,
    // blob 이 준비되면 그 창에 location 을 설정해 콘텐츠를 보여준다.
    let previewWindow: Window | null = null;
    if (mode === "preview") {
      previewWindow = window.open("about:blank", "_blank");
      if (!previewWindow) {
        alert("팝업이 차단되었습니다. 브라우저 주소창의 팝업 차단 아이콘을 눌러 허용해주세요.");
        return;
      }
      // 로딩 placeholder
      previewWindow.document.write(
        '<title>불러오는 중...</title><body style="font-family:sans-serif;color:#64748b;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">파일을 불러오는 중입니다...</body>'
      );
    }

    setLoading(mode);
    try {
      const { blob, mimeType } = await fetchSubmissionFileBlob(submissionId);
      // 백엔드가 octet-stream 으로 보낼 수 있으므로 파일명 확장자로 fallback 추론.
      // 새로 만든 Blob 의 type 이 곧 브라우저가 미리보기 여부를 판단하는 기준이 된다.
      const effectiveMime = isUseful(mimeType) ? mimeType : guessMimeFromName(fileName);
      const typedBlob = new Blob([blob], { type: effectiveMime });
      const url = URL.createObjectURL(typedBlob);

      if (mode === "preview") {
        const previewable =
          effectiveMime.startsWith("image/") ||
          effectiveMime === "application/pdf" ||
          effectiveMime.startsWith("text/");
        if (!previewable) {
          alert("이 파일 형식은 미리볼 수 없습니다. 다운로드해서 확인해주세요.");
          previewWindow?.close();
          URL.revokeObjectURL(url);
          return;
        }
        if (previewWindow && !previewWindow.closed) {
          previewWindow.location.href = url;
        } else {
          // 사용자가 placeholder 창을 이미 닫은 경우 마지막 시도
          window.open(url, "_blank", "noopener,noreferrer");
        }
        // 새 창이 닫힐 때 메모리 해제하기엔 추적이 어려워, 1분 후 일괄 해제
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      } else {
        // 강제 다운로드
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      previewWindow?.close();
      alert(err?.response?.data?.message || "파일을 불러오지 못했습니다.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <span className="inline-flex items-center gap-2 px-3 h-10 bg-muted text-foreground font-bold rounded-xl text-sm">
        <Paperclip className="w-4 h-4 text-muted-foreground" />
        {fileName}
        {kindLabel && (
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-card text-muted-foreground ring-1 ring-border">
            {kindLabel}
          </span>
        )}
      </span>
      <button
        type="button"
        onClick={() => handle("preview")}
        disabled={loading !== null || !previewable}
        title={
          previewable
            ? "새 탭에서 미리보기"
            : "이 파일 형식은 브라우저에서 미리볼 수 없어요. 다운로드해서 확인해주세요."
        }
        className="inline-flex items-center gap-1.5 px-3 h-10 bg-blue-500/10 text-blue-700 font-bold rounded-xl text-sm hover:bg-blue-500/15 transition-colors disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
      >
        {loading === "preview" ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <ExternalLink className="w-3.5 h-3.5" />
        )}
        미리보기
      </button>
      <button
        type="button"
        onClick={() => handle("download")}
        disabled={loading !== null}
        className="inline-flex items-center gap-1.5 px-3 h-10 bg-emerald-500/10 text-emerald-700 font-bold rounded-xl text-sm hover:bg-emerald-500/15 transition-colors disabled:opacity-50"
      >
        {loading === "download" ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Download className="w-3.5 h-3.5" />
        )}
        다운로드
      </button>
    </div>
  );
}
