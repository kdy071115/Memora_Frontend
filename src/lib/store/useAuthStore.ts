import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "INSTRUCTOR" | "ADMIN";
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  
  // Actions
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (newData: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      login: (user, token) => {
        // middleware에서 읽을 수 있도록 세션 쿠키 발급
        document.cookie = `memora_session=true; path=/; max-age=604800;`; // 7일 유지
        set({ user, accessToken: token, isAuthenticated: true });
      },
      logout: () => {
        // 로그아웃 시 쿠키 삭제
        document.cookie = `memora_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
        set({ user: null, accessToken: null, isAuthenticated: false });
      },
      updateUser: (newData) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...newData } : null,
        }));
      },
    }),
    {
      name: "memora-auth-storage", // localStorage 키 이름
    }
  )
);
