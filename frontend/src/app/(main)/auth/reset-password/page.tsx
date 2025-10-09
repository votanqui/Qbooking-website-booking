// app/auth/reset-password/page.tsx (Fixed version)
'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { authService } from '@/services/main/auth.service'
import { Button } from '@/components/ui/Button'
import { PasswordStrength, usePasswordStrength } from '@/components/ui/PasswordStrength'
import { useToast } from '@/components/ui/Toast'

function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  const { isValid: isPasswordValid, isStrong } = usePasswordStrength(password)

  // Memoize showToast để tránh re-render không cần thiết
  const memoizedShowToast = useCallback(showToast, [showToast])

  useEffect(() => {
    const tokenFromUrl = searchParams?.get('token')
    if (!tokenFromUrl) {
      setIsTokenValid(false)
      // Không gọi showToast trong useEffect để tránh loop
      // Sẽ hiển thị UI lỗi thay vì toast
      return
    }
    setToken(tokenFromUrl)
    setIsTokenValid(true) // Assume valid, will validate on submit
  }, [searchParams]) // Bỏ showToast khỏi dependency array

  // Hiển thị toast sau khi component đã render và token không hợp lệ
  useEffect(() => {
    if (isTokenValid === false) {
      const timer = setTimeout(() => {
        memoizedShowToast('Token không hợp lệ hoặc đã hết hạn', 'error')
      }, 100) // Delay nhỏ để tránh race condition
      
      return () => clearTimeout(timer)
    }
  }, [isTokenValid, memoizedShowToast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!token || isTokenValid === false) {
      showToast('Token không hợp lệ', 'error')
      return
    }

    if (!isPasswordValid) {
      showToast('Mật khẩu phải có ít nhất 6 ký tự', 'error')
      return
    }

    if (password !== confirmPassword) {
      showToast('Mật khẩu xác nhận không khớp', 'error')
      return
    }

    setIsLoading(true)

    try {
      const response = await authService.resetPassword(token, password, confirmPassword)
      
      if (response.success) {
        setIsSuccess(true)
        showToast('Đặt lại mật khẩu thành công!', 'success')
      } else {
        showToast(response.message || 'Có lỗi xảy ra, vui lòng thử lại', 'error')
        
        // Handle token expiration
        if (response.message?.includes('hết hạn') || response.message?.includes('expired') || response.message?.includes('không hợp lệ')) {
          setIsTokenValid(false)
          setTimeout(() => {
            router.push('/auth/forgot-password')
          }, 2000)
        }
      }
    } catch (error) {
      console.error('Reset password error:', error)
      showToast('Có lỗi xảy ra, vui lòng thử lại sau', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  // Token invalid state
  if (isTokenValid === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Liên kết không hợp lệ</h1>
            <p className="text-gray-600 text-sm leading-relaxed">
              Liên kết đặt lại mật khẩu đã hết hạn hoặc không hợp lệ. 
              Liên kết chỉ có hiệu lực trong 1 giờ kể từ khi được tạo.
            </p>
          </div>

          <div className="space-y-3">
            <Link href="/auth/forgot-password">
              <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Yêu cầu đặt lại mật khẩu mới
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Thành công!</h1>
            <p className="text-gray-600 text-sm leading-relaxed">
              Mật khẩu đã được đặt lại thành công. Bạn có thể đăng nhập với mật khẩu mới ngay bây giờ.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <svg className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-blue-900 mb-1">Hoàn tất bảo mật:</h3>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>✓ Mật khẩu đã được mã hóa an toàn</li>
                  <li>✓ Đăng xuất khỏi tất cả thiết bị khác</li>
                  <li>✓ Vô hiệu hóa các token cũ</li>
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

  const isFormValid = password && confirmPassword && password === confirmPassword && isPasswordValid

  // Main form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Đặt lại mật khẩu</h1>
          <p className="text-gray-600 text-sm">
            Tạo mật khẩu mới mạnh và an toàn cho tài khoản của bạn
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* New Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Mật khẩu mới
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                placeholder="Nhập mật khẩu mới"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Password Strength Component */}
            <PasswordStrength password={password} />
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Xác nhận mật khẩu
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 transition-all duration-200 bg-gray-50 focus:bg-white ${
                  confirmPassword && password !== confirmPassword 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : confirmPassword && password === confirmPassword
                    ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
                }`}
                placeholder="Nhập lại mật khẩu mới"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showConfirmPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Password Match Indicator */}
            {confirmPassword && (
              <div className={`text-xs flex items-center mt-2 transition-all duration-200 ${
                password === confirmPassword ? 'text-green-600' : 'text-red-600'
              }`}>
                {password === confirmPassword ? (
                  <>
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Mật khẩu khớp
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Mật khẩu không khớp
                  </>
                )}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading || !isFormValid}
            className={`w-full py-3 transition-all duration-200 ${
              isFormValid
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                Đang xử lý...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Đặt lại mật khẩu
              </div>
            )}
          </Button>
        </form>

        {/* Security Notice */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-yellow-800 mb-1">Thông tin quan trọng</h3>
              <ul className="text-xs text-yellow-700 space-y-1">
                <li>• Sau khi đổi mật khẩu, bạn sẽ được đăng xuất khỏi tất cả thiết bị</li>
                <li>• Token đặt lại mật khẩu sẽ bị vô hiệu hóa</li>
                <li>• Hãy ghi nhớ mật khẩu mới hoặc lưu vào trình quản lý mật khẩu</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-6 flex items-center justify-between text-sm">
          <Link
            href="/auth/login"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Đăng nhập
          </Link>
          <Link
            href="/support"
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            Cần hỗ trợ?
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="animate-pulse">
            {/* Header skeleton */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
            {/* Form skeleton */}
            <div className="space-y-6">
              <div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
              </div>
              <div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
              </div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}