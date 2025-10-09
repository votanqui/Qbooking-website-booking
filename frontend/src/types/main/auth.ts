// types/auth.ts
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: 'Male' | 'Female' | 'Other';
  addressDetail?: string;
  communeId: number;
  provinceId: number;
}

export interface LoginResponse {
  token: string;
  email: string;
  role: string;
  fullName: string;
  id: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T;
  error?: string;
}

export interface Province {
  id: number;
  name: string;
  slug: string;
  code: string;
  region: string;
  type: string;
}

export interface Commune {
  id: number;
  name: string;
  slug: string;
  code: string;
  type: string;
  provinceName: string;
  provinceCode: string;
}

export interface UserProfile {
  id: number;
  email: string;
  fullName: string;
  phone?: string;
  role: string;
  avatar?: string;
  dateOfBirth?: Date;
  gender?: string;
  addressDetail?: string;
  province?: string;
  commune?: string;
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: Date;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResendVerificationRequest {
  email: string;
}
export interface VerifyEmailRequest {
  token: string;
}