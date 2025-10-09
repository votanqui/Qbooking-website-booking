//host/create/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import CreatePropertyWizard from '@/components/features/host/CreatePropertyWizard'
import { userService } from '@/services/main/user.service'
import { UserProfile } from '@/types/main/user'

export default function CreatePropertyPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkHostPermission()
  }, [])

  const checkHostPermission = async () => {
    try {
      setIsLoading(true)
      
      // Lấy thông tin profile của user
      const response = await userService.getProfile()
      
      if (response.success && response.data) {
        setUserProfile(response.data)
        setIsLoggedIn(true)
        
        // Kiểm tra role có phải là host không
        if (response.data.role && response.data.role.toLowerCase() === 'host') {
          setIsAuthorized(true)
        } else {
          setIsAuthorized(false)
        }
      } else {
        // Nếu không lấy được profile, có thể chưa đăng nhập
        setIsLoggedIn(false)
        setIsAuthorized(false)
      }
    } catch (error) {
      console.error('Error checking host permission:', error)
      setIsLoggedIn(false)
      setIsAuthorized(false)
    } finally {
      setIsLoading(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center relative overflow-hidden">
        {/* Soft mystical background effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-pink-100/50 via-purple-100/50 to-indigo-100/50 animate-pulse"></div>
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-pink-600/20 rounded-full blur-xl animate-bounce"></div>
        <div className="absolute top-1/3 right-1/3 w-48 h-48 bg-purple-600/15 rounded-full blur-2xl animate-pulse delay-300"></div>
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-indigo-600/20 rounded-full blur-xl animate-bounce delay-700"></div>
        
        <div className="text-center relative z-10">
          <div className="relative mb-8">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent bg-gradient-to-r from-pink-600 to-purple-600 mx-auto mb-4 relative">
              <div className="absolute inset-2 bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 rounded-full"></div>
            </div>
            <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-2 border-pink-600/50 mx-auto"></div>
          </div>
          <p className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 text-lg font-medium animate-pulse">
            Đang kiểm tra quyền truy cập...
          </p>
          <div className="mt-4 flex justify-center space-x-1">
            <div className="w-2 h-2 bg-pink-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce delay-100"></div>
            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce delay-200"></div>
          </div>
        </div>
      </div>
    )
  }

  // Unauthorized state - show different content based on login status
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center relative overflow-hidden">
        {/* Soft mystical background effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-pink-100/30 via-purple-100/30 to-indigo-100/30 animate-pulse"></div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-pink-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-700"></div>
        <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-indigo-600/10 rounded-full blur-2xl animate-pulse delay-300"></div>
        
        <div className="text-center relative z-10 backdrop-blur-sm bg-white/80 p-12 rounded-3xl border border-pink-600/20 shadow-2xl max-w-md mx-4">
          <div className="relative mb-8">
            <div className="text-8xl mb-4 animate-pulse">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600">
                {isLoggedIn ? '🔮' : '🚪'}
              </span>
            </div>
            <div className="absolute inset-0 animate-ping opacity-30">
              <span className="text-8xl text-pink-600/50">
                {isLoggedIn ? '🔮' : '🚪'}
              </span>
            </div>
          </div>
          
          <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600">
            {isLoggedIn ? 'Vùng Cấm Địa' : 'Cổng Bí Mật'}
          </h2>
          
          <p className="text-gray-600 mb-8 leading-relaxed">
            {isLoggedIn ? (
              <>
                Chỉ những <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600 font-semibold">Chủ Nhà Huyền Thuật</span> mới có thể bước vào vùng đất thiêng liêng này...
              </>
            ) : (
              <>
                Hãy <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600 font-semibold">đăng nhập</span> để khám phá thế giới kỳ diệu của những chủ nhà...
              </>
            )}
          </p>
          
          {isLoggedIn ? (
            <button
              onClick={() => router.push('/profile?tab=upgrade')}
              className="group relative px-8 py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-full hover:from-pink-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-purple-500/25"
            >
              <span className="relative z-10 font-semibold">✨ Thăng Cấp Thành Host ✨</span>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-600/50 via-purple-600/50 to-indigo-600/50 opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-300"></div>
            </button>
          ) : (
            <button
              onClick={() => router.push('/auth/login')}    
              className="group relative px-8 py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-full hover:from-pink-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-purple-500/25"
            >
              <span className="relative z-10 font-semibold">🔑 Đăng Nhập Ngay 🔑</span>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-600/50 via-purple-600/50 to-indigo-600/50 opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-300"></div>
            </button>
          )}
          
          <div className="mt-6 flex justify-center space-x-2">
            <div className="w-2 h-2 bg-pink-600 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse delay-200"></div>
            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse delay-400"></div>
          </div>
          
          {isLoggedIn && userProfile && (
            <div className="mt-6 text-sm text-gray-500">
              Xin chào <span className="font-semibold text-pink-600">{userProfile.fullName || userProfile.email}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Authorized - show the main content
  return (
   <div className="min-h-screen bg-gradient-to-r from-pink-600 to-purple-600 relative overflow-hidden">

      {/* Soft ambient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-pink-100/20 via-purple-100/20 to-indigo-100/20"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-600/5 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-600/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/3 rounded-full blur-3xl animate-pulse delay-500"></div>
      
      {/* Content */}
      <div className="relative z-10">
        <CreatePropertyWizard />
      </div>
      
      {/* Floating soft particles */}
      <div className="absolute top-1/4 left-1/3 w-1 h-1 bg-pink-600 rounded-full animate-ping opacity-40"></div>
      <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-purple-600 rounded-full animate-ping opacity-30 delay-300"></div>
      <div className="absolute bottom-1/3 left-1/4 w-1 h-1 bg-indigo-600 rounded-full animate-ping opacity-20 delay-700"></div>
    </div>
  )
}