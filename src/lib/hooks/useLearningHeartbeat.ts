"use client";
import { useEffect, useRef } from "react";
import { recordLearningHeartbeat } from "@/lib/api/learningLog";
import { useAuthStore } from "@/lib/store/useAuthStore";

const HEARTBEAT_INTERVAL_MS = 30_000; // 30초마다 활동 누적
const IDLE_TIMEOUT_MS = 60_000;       // 마지막 사용자 입력 이후 60초가 지나면 idle

type ActivityType = "LEARN" | "QUIZ" | "QA";

/**
 * 학습 페이지·QA·퀴즈 화면이 활성화되어 있는 동안 학습 시간을 누적해 백엔드에 전송합니다.
 *
 * 동작:
 * - 30초 간격으로 active 시간이 30초 이상이면 백엔드에 POST
 * - 탭이 숨겨져 있거나 마지막 입력 이후 60초가 지난 사용자는 idle 로 간주, 카운트 정지
 * - 컴포넌트 unmount 또는 페이지 이탈 시 남은 시간을 sendBeacon 으로 마지막 전송
 *
 * 학생 계정에서만 동작합니다 (강사는 학습 시간을 측정하지 않음).
 */
export function useLearningHeartbeat(lectureId: number | null, activityType: ActivityType = "LEARN") {
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isStudent = user?.role === "STUDENT";

  // 누적 active 시간 (ms). flush 되면 0 으로 리셋.
  const accumulatedRef = useRef(0);
  // 마지막 tick 시각 (active 일 때만 전진)
  const lastTickRef = useRef<number>(Date.now());
  // 마지막 사용자 입력 시각
  const lastInteractionRef = useRef<number>(Date.now());
  // 현재 active 인지
  const isActiveRef = useRef<boolean>(true);

  useEffect(() => {
    if (!lectureId || !isStudent) return;

    const markInteraction = () => {
      lastInteractionRef.current = Date.now();
    };

    const updateActive = () => {
      const now = Date.now();
      const visible = typeof document !== "undefined" && !document.hidden;
      const recentlyInteracted = now - lastInteractionRef.current < IDLE_TIMEOUT_MS;
      const wasActive = isActiveRef.current;
      const nowActive = visible && recentlyInteracted;

      if (wasActive && nowActive) {
        // 계속 active → 경과한 만큼 누적
        accumulatedRef.current += now - lastTickRef.current;
      }
      // (wasActive && !nowActive): 방금 idle 로 빠짐 → 더 이상 누적 안 함
      // (!wasActive && nowActive): 다시 active → 이번 tick 부터 누적 시작
      // (!wasActive && !nowActive): 계속 idle → 무시

      lastTickRef.current = now;
      isActiveRef.current = nowActive;
    };

    const flush = async () => {
      const seconds = Math.floor(accumulatedRef.current / 1000);
      if (seconds < 1) return;
      const toSend = Math.min(seconds, 600); // 백엔드가 한 번에 최대 600초까지 받음
      accumulatedRef.current -= toSend * 1000;
      try {
        await recordLearningHeartbeat(lectureId, toSend, activityType);
      } catch (e) {
        // 실패해도 사용자 경험에 영향 없도록 조용히 무시 (다음 tick 에 재시도)
        accumulatedRef.current += toSend * 1000;
      }
    };

    const interval = setInterval(() => {
      updateActive();
      flush();
    }, HEARTBEAT_INTERVAL_MS);

    // 사용자 입력 / 가시성 / 페이지 이탈 핸들러 등록
    const interactionEvents: (keyof DocumentEventMap)[] = [
      "mousemove", "mousedown", "keydown", "scroll", "touchstart",
    ];
    interactionEvents.forEach((ev) => document.addEventListener(ev, markInteraction, { passive: true }));

    const onVisibilityChange = () => {
      updateActive();
      if (document.hidden) {
        // 탭이 숨겨질 때 즉시 flush
        flush();
      } else {
        // 다시 돌아왔을 때 lastTick 을 현재로 맞춰 idle 시간이 계산되지 않게
        lastTickRef.current = Date.now();
        lastInteractionRef.current = Date.now();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    // unload 시 sendBeacon 으로 마지막 전송 (네트워크 신뢰성)
    const onPageHide = () => {
      updateActive();
      const seconds = Math.floor(accumulatedRef.current / 1000);
      if (seconds < 1) return;
      const toSend = Math.min(seconds, 600);
      try {
        const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"}/lectures/${lectureId}/learning-logs`;
        const blob = new Blob(
          [JSON.stringify({ duration: toSend, activityType })],
          { type: "application/json" }
        );
        // sendBeacon 은 헤더 추가가 안 되므로 토큰 인증이 필수면 작동 안 할 수 있음.
        // fallback 으로 keepalive fetch 도 시도.
        if (navigator.sendBeacon) {
          navigator.sendBeacon(url, blob);
        }
        if (accessToken) {
          fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ duration: toSend, activityType }),
            keepalive: true,
          }).catch(() => {});
        }
      } catch {
        /* noop */
      }
    };
    window.addEventListener("pagehide", onPageHide);

    // cleanup
    return () => {
      clearInterval(interval);
      interactionEvents.forEach((ev) => document.removeEventListener(ev, markInteraction));
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
      // 컴포넌트 unmount 시 남은 시간 한 번 더 전송
      onPageHide();
    };
    // lectureId / activityType 변경 시에만 effect 재구성
  }, [lectureId, activityType, isStudent, accessToken]);
}
