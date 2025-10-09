// components/forms/ResendVerificationForm.tsx
'use client'

import { useState } from 'react'
import { authService } from '@/services/main/auth.service'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'

interface ResendVerificationFormProps {
  email?: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function ResendVerificationForm({ 
  email: initialEmail = '', 
  onSuccess, 
  onCancel 
}: ResendVerificationFormProps) {
  const [email, setEmail] = useState(initialEmail)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { showToast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      showToast('Vui lòng nhập địa chỉ email', 'error')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      showToast('Vui lòng nhập email hợp lệ', 'error')
      return
    }

    setIsLoading(true)

    try {
      const response = await authService.resendVerificationEmail(email)
      
      if (response.success) {
        setIsSuccess(true)
        showToast('Email xác nhận đã được gửi lại', 'success')
        onSuccess?.()
      } else {
        showToast(response.message || 'Có lỗi xảy ra, vui lòng thử lại', 'error')
      }
    } catch (error) {
      showToast('Có lỗi xảy ra, vui lòng thử lại sau', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="text-center p-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Email đã được gửi!</h3>
        <p className="text-gray-600 text-sm mb-6">
          Email xác nhận đã được gửi đến <strong>{email}</strong>. 
          Vui lòng kiểm tra hộp thư của bạn.
        </p>
        <Button onClick={onCancel} variant="outline" className="w-full">
          Đóng
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Gửi lại email xác nhận</h3>
        <p className="text-gray-600 text-sm">
          Nhập email để nhận lại email xác nhận tài khoản
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="resend-email" className="block text-sm font-medium text-gray-700 mb-2">
            Địa chỉ email
          </label>
          <input
            id="resend-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            placeholder="you@example.com"
            required
          />
        </div>

        <div className="flex space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                Đang gửi...
              </div>
            ) : (
              'Gửi email'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}