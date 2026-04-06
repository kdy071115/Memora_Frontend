import axios from "axios";
import { useAuthStore } from "./store/useAuthStore";

// 백엔드 API 호스트가 없을 경우 로컬(기본 8080)을 바라보게 합니다.
export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export const memoraApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // 쿠키 기반 세션/인증 사용 가능성 대비
});

// Request Interceptor: 요청마다 로컬 스토리지 등에 보관된 토큰을 가져와 헤더에 삽입
memoraApi.interceptors.request.use(
  (config) => {
    // Zustand persist에서 토큰 꺼내오기
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: 401 권한 없음 에러 시 자동 로그아웃 처리 등
memoraApi.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // 만약 401(Unauthorized) 에러가 발생했고, 토큰 갱신 시도를 아직 안 했다면
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // TODO: Refresh Token 갱신 로직 필요. 지금은 간단히 로그아웃 처리만 시연
      // useAuthStore.getState().logout();
      // window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);
