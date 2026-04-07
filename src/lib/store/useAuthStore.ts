import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types/auth";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  
  // Actions
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (newData: Partial<User>) => void;
  updateTokens: (accessToken: string, refreshToken: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      login: (user, accessToken, refreshToken) => {
        // middleware에서 읽을 수 있도록 세션 쿠키 발급
        document.cookie = `memora_session=true; path=/; max-age=604800;`; // 7일 유지
        set({ user, accessToken, refreshToken, isAuthenticated: true });
      },
      logout: () => {
        // 로그아웃 시 쿠키 삭제
        document.cookie = `memora_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },
      updateUser: (newData) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...newData } : null,
        }));
      },
      updateTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken });
      }
    }),
    {
      name: "memora-auth-storage", // localStorage 키 이름
    }
  )
);
