// contexts/AuthContext.tsx
'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authService } from '@/services/main/auth.service'
import { LoginRequest, LoginResponse, UserProfile, ApiResponse } from '@/types/main/auth'

interface AuthContextType {
  user: UserProfile | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginRequest) => Promise<ApiResponse<LoginResponse>>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
  updateUserAvatar: (avatarUrl: string | null) => void
  updateUserRole: (role: string) => void
  updateUserProfile: (updatedData: Partial<UserProfile>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      // Try to get profile using cookies - if cookies exist and are valid, this will succeed
      const response = await authService.getProfile()
      if (response.success && response.data) {
        setUser(response.data)
      } else {
        // If profile fetch fails, user is not authenticated
        setUser(null)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    const response = await authService.login(credentials)
    if (response.success) {
      // Fetch user profile after successful login
      await refreshProfile()
    }
    return response
  }

  const logout = async () => {
    try {
      await authService.logout()
    } catch (error) {
      console.error('Logout error:', error)
      // Even if logout API fails, clear local state
    } finally {
      setUser(null)
    }
  }

  const refreshProfile = async () => {
    try {
      const response = await authService.getProfile()
      if (response.success && response.data) {
        setUser(response.data)
      } else {
        // If profile refresh fails, user might be logged out
        setUser(null)
      }
    } catch (error) {
      console.error('Failed to refresh profile:', error)
      setUser(null)
    }
  }

  // Hàm cập nhật avatar trực tiếp trong state mà không cần gọi API
  const updateUserAvatar = (avatarUrl: string | null) => {
    if (user) {
      setUser({
        ...user,
        avatar: avatarUrl || undefined
      })
    }
  }

  // Hàm cập nhật role trực tiếp trong state
  const updateUserRole = (role: string) => {
    if (user) {
      setUser({
        ...user,
        role: role
      })
    }
  }

  // Hàm cập nhật thông tin user khác
  const updateUserProfile = (updatedData: Partial<UserProfile>) => {
    if (user) {
      setUser({
        ...user,
        ...updatedData
      })
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshProfile,
    updateUserAvatar,
    updateUserRole,
    updateUserProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}