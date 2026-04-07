import { memoraApi } from "../axios";
import type { LoginRequest, SignupRequest, TokenResponse } from "../../types/auth";
import type { ApiResponse } from "../../types/api";

export const signup = async (data: SignupRequest): Promise<TokenResponse['user']> => {
  const response = await memoraApi.post<ApiResponse<TokenResponse['user']>>("/auth/signup", data);
  return response.data.data;
};

export const login = async (data: LoginRequest): Promise<TokenResponse> => {
  const response = await memoraApi.post<ApiResponse<TokenResponse>>("/auth/login", data);
  return response.data.data;
};

export const updateProfile = async (data: { name: string }): Promise<void> => {
  const response = await memoraApi.put("/auth/me", data);
  return response.data;
};
