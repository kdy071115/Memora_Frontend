import { memoraApi } from "../axios";
import type { LoginRequest, SignupRequest, TokenResponse } from "../../types/auth";
import type { ApiResponse } from "../../types/api";

// 회원가입 — POST /api/auth/signup
export const signup = async (data: SignupRequest): Promise<TokenResponse["user"]> => {
  const response = await memoraApi.post<ApiResponse<TokenResponse["user"]>>(
    "/auth/signup",
    data
  );
  return response.data.data;
};

// 로그인 — POST /api/auth/login
export const login = async (data: LoginRequest): Promise<TokenResponse> => {
  const response = await memoraApi.post<ApiResponse<TokenResponse>>("/auth/login", data);
  return response.data.data;
};

// 내 정보 조회 — GET /api/auth/me
export const getMe = async (): Promise<TokenResponse["user"]> => {
  const response = await memoraApi.get<ApiResponse<TokenResponse["user"]>>("/auth/me");
  return response.data.data;
};

// 프로필 수정 — PUT /api/auth/me
export const updateProfile = async (data: { name: string }): Promise<void> => {
  await memoraApi.put("/auth/me", data);
};
