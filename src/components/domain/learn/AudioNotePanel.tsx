"use client";
import React, { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Mic,
  Upload,
  Loader2,
  Trash2,
  ChevronDown,
  Sparkles,
  AlertCircle,
  Square,
} from "lucide-react";
import {
  getAudioNote,
  uploadAudioNote,
  deleteAudioNote,
  type AudioNote,
} from "@/lib/api/aiCoach";

interface Props {
  lectureId: number;
  isInstructor: boolean;
}

/**
 * 차시의 강의 음성 노트 패널.
 * - 강사: 음성 파일 업로드 → faster-whisper 트랜스크립션 → AI 요약 + 챕터
 * - 학생: 결과만 조회 (트랜스크립트 + 요약 + 챕터)
 */
export default function AudioNotePanel({ lectureId, isInstructor }: Props) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showTranscript, setShowTranscript] = useState(false);

  // 브라우저 녹음 상태
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<BlobPart[]>([]);
  const recordingStartRef = useRef<number>(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const { data: note, isLoading } = useQuery({
    queryKey: ["audioNote", lectureId],
    queryFn: () => getAudioNote(lectureId),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadAudioNote(lectureId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audioNote", lectureId] });
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: (err: any) =>
      alert(err?.response?.data?.message || "음성 트랜스크립션 실패"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteAudioNote(lectureId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["audioNote", lectureId] }),
  });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) {
      alert("파일이 너무 큽니다. 100MB 이하로 업로드해주세요.");
      return;
    }
    uploadMutation.mutate(file);
  };

  // 컴포넌트 unmount 시 진행 중 녹음/타이머 정리
  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      const rec = mediaRecorderRef.current;
      if (rec && rec.state !== "inactive") {
        try {
          rec.stop();
        } catch {}
      }
      rec?.stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const startRecording = async () => {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      alert("이 브라우저는 마이크 녹음을 지원하지 않아요.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // 브라우저별 호환되는 mimeType 자동 선택
      const candidates = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/ogg;codecs=opus",
      ];
      let mimeType = "";
      for (const c of candidates) {
        if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c)) {
          mimeType = c;
          break;
        }
      }

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recordedChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        // 마이크 권한 해제
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(recordedChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        const ext = (recorder.mimeType || "audio/webm").includes("mp4") ? "m4a" : "webm";
        const file = new File([blob], `recording-${Date.now()}.${ext}`, {
          type: blob.type,
        });
        uploadMutation.mutate(file);
      };

      mediaRecorderRef.current = recorder;
      recordedChunksRef.current = [];
      recordingStartRef.current = Date.now();
      setElapsed(0);
      recorder.start();
      setIsRecording(true);

      tickRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - recordingStartRef.current) / 1000));
      }, 500);
    } catch (e: any) {
      alert(
        e?.name === "NotAllowedError"
          ? "마이크 권한이 거부되었어요. 브라우저 설정에서 허용해주세요."
          : "마이크를 시작할 수 없어요: " + (e?.message ?? "")
      );
    }
  };

  const stopRecording = () => {
    const rec = mediaRecorderRef.current;
    if (!rec) return;
    if (rec.state !== "inactive") rec.stop();
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    setIsRecording(false);
  };

  // 학생인데 노트가 없으면 아예 렌더 X
  if (!isInstructor && !isLoading && !note) return null;

  return (
    <div className="bg-gradient-to-br from-violet-500/10 to-blue-500/10 border border-violet-500/20 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-violet-500/15 flex items-center justify-center shrink-0">
            <Mic className="w-5 h-5 text-violet-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-violet-600 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              AI 음성 노트
            </p>
            <p className="text-base font-black text-foreground">
              {note ? "강의 음성 자동 노트" : "강의 음성 → 자동 노트화"}
            </p>
          </div>
        </div>
        {isInstructor && (
          <div className="flex items-center gap-2 shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,video/mp4,video/quicktime,video/webm"
              className="hidden"
              onChange={handleFile}
            />

            {isRecording ? (
              <button
                type="button"
                onClick={stopRecording}
                className="inline-flex items-center gap-2 px-4 h-10 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors animate-pulse"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                정지 · {formatElapsed(elapsed)}
              </button>
            ) : (
              <button
                type="button"
                disabled={uploadMutation.isPending}
                onClick={startRecording}
                className="inline-flex items-center gap-1.5 px-4 h-10 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
                title="브라우저에서 직접 녹음"
              >
                <Mic className="w-3.5 h-3.5" />
                녹음 시작
              </button>
            )}

            <button
              type="button"
              disabled={uploadMutation.isPending || isRecording}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-4 h-10 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
            >
              {uploadMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              파일 업로드
            </button>
            {note && !isRecording && (
              <button
                type="button"
                onClick={() => {
                  if (confirm("이 차시의 음성 노트를 삭제할까요?")) deleteMutation.mutate();
                }}
                className="inline-flex items-center justify-center w-10 h-10 bg-card border border-rose-500/30 text-rose-500 rounded-xl hover:bg-rose-500/10"
                title="삭제"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* 녹음 중 인디케이터 */}
      {isRecording && (
        <div className="mb-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center gap-3">
          <span className="relative flex h-3 w-3 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
          </span>
          <p className="text-sm font-bold text-rose-700">
            녹음 중 — {formatElapsed(elapsed)}
          </p>
          <p className="text-xs font-medium text-rose-600 ml-auto">
            정지를 누르면 자동으로 업로드돼요
          </p>
        </div>
      )}

      {/* 본문 */}
      {uploadMutation.isPending ? (
        <PendingState />
      ) : isLoading ? (
        <div className="py-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
        </div>
      ) : !note ? (
        <EmptyState isInstructor={isInstructor} />
      ) : (
        <NoteView
          note={note}
          showTranscript={showTranscript}
          onToggleTranscript={() => setShowTranscript((v) => !v)}
        />
      )}
    </div>
  );
}

function PendingState() {
  return (
    <div className="bg-card/60 border border-violet-500/20 rounded-2xl p-6 flex items-center gap-4">
      <Loader2 className="w-6 h-6 text-violet-500 animate-spin shrink-0" />
      <div className="min-w-0">
        <p className="text-sm font-black text-foreground">
          AI 가 강의 음성을 분석하는 중입니다...
        </p>
        <p className="text-xs font-medium text-muted-foreground mt-1">
          faster-whisper 가 트랜스크립트를 만들고, Claude 가 요약·챕터를 정리하고 있어요.
          음성 길이에 따라 30초 ~ 몇 분이 걸릴 수 있어요.
        </p>
      </div>
    </div>
  );
}

function EmptyState({ isInstructor }: { isInstructor: boolean }) {
  return (
    <div className="bg-card/60 border border-violet-500/20 rounded-2xl p-6 flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-violet-500 mt-0.5 shrink-0" />
      <div className="text-xs font-medium text-muted-foreground leading-relaxed">
        {isInstructor
          ? "오프라인 수업 녹음을 업로드하면 AI 가 자동으로 트랜스크립트를 만들고, 핵심 요약 + 챕터로 정리해줍니다. 학생들도 차시 페이지에서 바로 복습할 수 있어요."
          : "아직 음성 노트가 없어요."}
      </div>
    </div>
  );
}

function NoteView({
  note,
  showTranscript,
  onToggleTranscript,
}: {
  note: AudioNote;
  showTranscript: boolean;
  onToggleTranscript: () => void;
}) {
  const minutes = Math.floor(note.durationSec / 60);
  const seconds = Math.round(note.durationSec % 60);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-[11px] font-bold text-muted-foreground">
        <span>📁 {note.originalFileName}</span>
        <span>·</span>
        <span>⏱ {minutes}분 {seconds}초</span>
      </div>

      {/* 요약 */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <p className="text-[11px] font-black text-violet-600 uppercase tracking-wider mb-2">
          AI 요약
        </p>
        <div className="markdown-body text-sm text-foreground">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{note.summary}</ReactMarkdown>
        </div>
      </div>

      {/* 챕터 */}
      {note.chapters.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-[11px] font-black text-violet-600 uppercase tracking-wider mb-3">
            챕터 {note.chapters.length}개
          </p>
          <ul className="space-y-2">
            {note.chapters.map((c, i) => (
              <li
                key={i}
                className="flex items-start gap-3 p-3 bg-muted rounded-xl"
              >
                <span className="text-[11px] font-black text-violet-600 shrink-0 min-w-[40px]">
                  {formatTimecode(c.startSec)}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-black text-foreground mb-0.5">{c.title}</p>
                  <p className="text-xs text-muted-foreground font-medium">{c.summary}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 트랜스크립트 */}
      <div className="bg-card border border-border rounded-2xl">
        <button
          type="button"
          onClick={onToggleTranscript}
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors rounded-2xl"
        >
          <p className="text-[11px] font-black text-violet-600 uppercase tracking-wider">
            전체 트랜스크립트
          </p>
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground transition-transform ${
              showTranscript ? "rotate-180" : ""
            }`}
          />
        </button>
        {showTranscript && (
          <div className="px-5 pb-5">
            <p className="text-xs text-muted-foreground font-medium leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
              {note.transcript}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function formatTimecode(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatElapsed(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
