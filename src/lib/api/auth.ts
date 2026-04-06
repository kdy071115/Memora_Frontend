import { memoraApi } from "../axios";

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  role: "STUDENT" | "INSTRUCTOR" | "ADMIN";
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      name: string;
      email: string;
      role: "STUDENT" | "INSTRUCTOR" | "ADMIN";
    };
  };
}

export const signup = async (data: SignupRequest) => {
  const response = await memoraApi.post("/auth/signup", data);
  return response.data;
};

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await memoraApi.post<LoginResponse>("/auth/login", data);
  return response.data;
};

export const updateProfile = async (data: { name: string }): Promise<void> => {
  const response = await memoraApi.put("/auth/me", data);
  return response.data;
};
