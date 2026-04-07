export interface User {
  id: number;
  email: string;
  name: string;
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
  createdAt: string;
}

export interface LoginRequest { email: string; password: string; }
export interface SignupRequest { email: string; password: string; name: string; role: string; }
export interface TokenResponse { accessToken: string; refreshToken: string; user: User; }
