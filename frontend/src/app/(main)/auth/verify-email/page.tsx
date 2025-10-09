// app/auth/verify-email/page.tsx
'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { authService } from '@/services/main/auth.service'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'

function VerifyEmailForm() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isError, setIsError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [token, setToken] = useState<string | null>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()

  const memoizedShowToast = useCallback(showToast, [showToast])

  useEffect(() => {
    const tokenFromUrl = searchParams?.get('token')
    if (!tokenFromUrl) {
      setIsError(true)
      setErrorMessage('Token xác thực không hợp lệ')
      setIsLoading(false)
      return
    }
    setToken(tokenFromUrl)
    verifyEmail(tokenFromUrl)
  }, [searchParams])

  const verifyEmail = async (verificationToken: string) => {
    setIsLoading(true)
    
    try {
      const response = await authService.verifyEmail(verificationToken)
      
      if (response.success) {
        setIsSuccess(true)
        memoizedShowToast(response.message || 'Email đã được xác thực thành công!', 'success')
      } else {
        setIsError(true)
        let errorMsg = response.message || 'Xác thực email thất bại'
        
        // Handle specific error cases based on backend response
        if (response.message?.includes('không hợp lệ') || response.message?.includes('đã được sử dụng')) {
          errorMsg = 'Token xác minh không hợp lệ hoặc đã được sử dụng'
        } else if (response.message?.includes('hết hạn')) {
          errorMsg = 'Token xác minh đã hết hạn'
        } else if (response.message?.includes('bắt buộc')) {
          errorMsg = 'Token xác minh không được tìm thấy'
        }
        
        setErrorMessage(errorMsg)
        memoizedShowToast(errorMsg, 'error')
      }
    } catch (error) {
      console.error('Verify email error:', error)
      setIsError(true)
      const errorMsg = 'Có lỗi xảy ra khi xác thực email'
      setErrorMessage(errorMsg)
      memoizedShowToast(errorMsg, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Đang xác thực email</h1>
            <p className="text-gray-600 text-sm">
              Vui lòng đợi trong khi chúng tôi xác thực email của bạn...
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Xác thực thất bại</h1>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              {errorMessage}
            </p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <svg className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-red-800 mb-1">Nguyên nhân có thể:</h3>
                <ul className="text-xs text-red-700 space-y-1">
                  <li>• Token đã hết hạn (quá thời gian cho phép)</li>
                  <li>• Token đã được sử dụng để xác thực trước đó</li>
                  <li>• Liên kết không hợp lệ hoặc bị hỏng</li>
                  <li>• Email có thể đã được xác thực rồi</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Link href="/auth/resend-verification">
              <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Gửi lại email xác thực
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" className="w-full">
                Quay lại đăng nhập
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 relative">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Xác thực thành công!</h1>
            <p className="text-gray-600 text-sm leading-relaxed">
              Email của bạn đã được xác thực thành công. Tài khoản đã sẵn sàng sử dụng và bạn có thể đăng nhập bình thường.
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <svg className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-green-900 mb-1">Tài khoản đã sẵn sàng:</h3>
                <ul className="text-xs text-green-800 space-y-1">
                  <li>✓ Email đã được xác thực</li>
                  <li>✓ Có thể đăng nhập bình thường</li>
                  <li>✓ Truy cập đầy đủ các tính năng</li>
                  <li>✓ Nhận thông báo qua email</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Link href="/auth/login">
              <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Đăng nhập ngay
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full">
                Về trang chủ
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="animate-pulse">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    }>
      <VerifyEmailForm />
    </Suspense>
  )
}