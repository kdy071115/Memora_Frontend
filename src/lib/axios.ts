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

// Response Interceptor: 401 권한 없음 에러 시 자동 로그아웃 처리 및 리프레시 토큰 처리
memoraApi.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // 만약 401(Unauthorized) 에러가 발생했고, 토큰 갱신 시도를 아직 안 했다면
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        try {
          // 원래의 axios를 사용해서 auth/refresh 호출 (인터셉터를 타지 않도록 처리)
          const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
          
          if (data.success && data.data) {
            const newAccessToken = data.data.accessToken;
            const newRefreshToken = data.data.refreshToken;
            
            // 토큰 업데이트
            useAuthStore.getState().updateTokens(newAccessToken, newRefreshToken);
            
            // 원래 요청의 헤더 토큰 수정 후 재요청
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return memoraApi(originalRequest);
          }
        } catch (refreshError) {
          // 리프레시 토큰 요청도 실패한 경우 완전 로그아웃
          useAuthStore.getState().logout();
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
          return Promise.reject(refreshError);
        }
      } else {
        // 리프레시 토큰조차 없는 경우 로그아웃
        useAuthStore.getState().logout();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);
