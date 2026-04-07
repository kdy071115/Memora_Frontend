import { memoraApi } from "../axios";

/**
 * 학습 활동 heartbeat 전송
 * POST /api/lectures/{lectureId}/learning-logs
 *
 * @param lectureId 차시 ID
 * @param duration 이번 호출이 누적한 활동 시간(초). 한 번에 최대 600초.
 * @param activityType "LEARN" | "QUIZ" | "QA"
 */
export const recordLearningHeartbeat = async (
  lectureId: number,
  duration: number,
  activityType: "LEARN" | "QUIZ" | "QA" = "LEARN"
): Promise<void> => {
  await memoraApi.post(`/lectures/${lectureId}/learning-logs`, {
    duration,
    activityType,
  });
};
