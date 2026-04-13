import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { useAuthStore } from "./store/useAuthStore";

// 백엔드 API 호스트가 없을 경우 로컬(기본 8080)을 바라보게 합니다.
export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export const memoraApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
  withCredentials: false,
});

// Request Interceptor: 요청마다 로컬 스토리지 등에 보관된 토큰을 가져와 헤더에 삽입
memoraApi.interceptors.request.use(
  (config) => {
    // Zustand persist에서 토큰 꺼내오기
    const { accessToken, user } = useAuthStore.getState();
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    // 개발 환경 디버그 로그
    if (process.env.NODE_ENV === "development") {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, {
        role: user?.role,
        hasToken: !!accessToken,
      });
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ─────────────────────────────────────────────────────────────────
// Refresh 토큰 처리
//
// 주의 사항:
//  1. 백엔드는 인증 실패 시 401 을 반환 (RestAuthenticationEntryPoint).
//     그래도 Spring 의 다른 흐름으로 403 이 올 수 있어 둘 다 트리거.
//  2. 동시 요청 다수가 한꺼번에 만료되면 refresh 가 N번 호출되는 storm 을
//     막기 위해 단일 Promise 를 공유하고 대기 큐에 실려 보낸다.
//  3. /auth/refresh, /auth/login 같은 인증 엔드포인트 자체에서 발생한
//     401/403 은 refresh 를 시도하지 않고 그대로 로그아웃시킨다 (무한 루프 방지).
// ─────────────────────────────────────────────────────────────────

let refreshInflight: Promise<string | null> | null = null;
let isRedirectingToLogin = false;

const AUTH_PATHS = ["/auth/login", "/auth/signup", "/auth/refresh"];

function isAuthEndpoint(url?: string): boolean {
  if (!url) return false;
  return AUTH_PATHS.some((p) => url.includes(p));
}

function forceLogoutAndRedirect() {
  useAuthStore.getState().logout();
  if (typeof window !== "undefined" && !isRedirectingToLogin) {
    isRedirectingToLogin = true;
    // 현재 로그인/회원가입 페이지가 아닌 경우에만 이동 — 그 페이지에서의
    // 자체 401(잘못된 자격 증명 등)은 그대로 노출되어야 하기 때문.
    const onAuthPage = /\/(login|signup)/.test(window.location.pathname);
    if (!onAuthPage) {
      window.location.href = "/login?expired=1";
    } else {
      isRedirectingToLogin = false;
    }
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) return null;

  // 인터셉터를 타지 않는 별도 axios 인스턴스로 호출
  const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
  if (data?.success && data?.data?.accessToken && data?.data?.refreshToken) {
    useAuthStore.getState().updateTokens(data.data.accessToken, data.data.refreshToken);
    return data.data.accessToken;
  }
  return null;
}

interface RetryableConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

memoraApi.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableConfig | undefined;
    const status = error.response?.status;

    // 401/403 모두 인증 만료로 간주 (백엔드 설정에 따라 둘 중 하나가 올 수 있음)
    const isAuthError = status === 401 || status === 403;

    if (!isAuthError || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    // /auth/* 자체에서 발생한 인증 오류는 refresh 시도하지 않음
    if (isAuthEndpoint(originalRequest.url)) {
      // refresh 자체가 실패한 경우는 세션 종료 처리
      if (originalRequest.url?.includes("/auth/refresh")) {
        forceLogoutAndRedirect();
      }
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      // 동시 다중 요청에서 단일 refresh 만 수행
      if (!refreshInflight) {
        refreshInflight = refreshAccessToken().finally(() => {
          // 다음 만료 사이클을 위해 비움
          setTimeout(() => {
            refreshInflight = null;
          }, 0);
        });
      }

      const newToken = await refreshInflight;
      if (!newToken) {
        forceLogoutAndRedirect();
        return Promise.reject(error);
      }

      // 새 토큰으로 헤더 교체 후 재요청
      originalRequest.headers = {
        ...(originalRequest.headers || {}),
        Authorization: `Bearer ${newToken}`,
      };
      return memoraApi(originalRequest);
    } catch (refreshError) {
      forceLogoutAndRedirect();
      return Promise.reject(refreshError);
    }
  }
);
