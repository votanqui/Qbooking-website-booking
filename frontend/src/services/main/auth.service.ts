import { LoginRequest, RegisterRequest, LoginResponse, ApiResponse, UserProfile } from '@/types/main/auth';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api`;

class AuthService {

  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await fetch(`${API_BASE_URL}/Auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(credentials),
    });

    return await response.json();
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/Auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(userData),
    });

    return await response.json();
  }

  async getProfile(): Promise<ApiResponse<UserProfile>> {
    const response = await fetch(`${API_BASE_URL}/User/profile`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    return await response.json();
  }

  async logout(): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/Auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  async forgotPassword(email: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/Auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email }),
    });

    return await response.json();
  }

  async resetPassword(token: string, newPassword: string, confirmPassword: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/Auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ 
        token, 
        newPassword,
        confirmPassword 
      }),
    });

    return await response.json();
  }

  async resendVerificationEmail(email: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/Auth/resend-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email }),
    });

    return await response.json();
  }

  async refreshToken(): Promise<ApiResponse<LoginResponse>> {
    const response = await fetch(`${API_BASE_URL}/Auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  async resendVerification(email: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/Auth/resend-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email }),
    });
    
    return await response.json();
  }

  async verifyEmail(token: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/Auth/verify-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ token }),
    });
    
    return await response.json();
  }
}

export const authService = new AuthService();