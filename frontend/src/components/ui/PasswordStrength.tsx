// components/ui/PasswordStrength.tsx
'use client'

import { useEffect, useState } from 'react'

interface PasswordStrength {
  score: number
  feedback: string[]
  color: string
  label: string
}

interface PasswordStrengthProps {
  password: string
  showFeedback?: boolean
  className?: string
}

export function PasswordStrength({ password, showFeedback = true, className = '' }: PasswordStrengthProps) {
  const [strength, setStrength] = useState<PasswordStrength>({
    score: 0,
    feedback: [],
    color: 'gray',
    label: ''
  })

  const calculatePasswordStrength = (pwd: string): PasswordStrength => {
    let score = 0
    const feedback: string[] = []

    // Length check
    if (pwd.length >= 8) {
      score += 1
    } else if (pwd.length >= 6) {
      score += 0.5
      feedback.push('Sử dụng ít nhất 8 ký tự để tăng độ mạnh')
    } else {
      feedback.push('Mật khẩu quá ngắn (tối thiểu 6 ký tự)')
    }

    // Mixed case check
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) {
      score += 1
    } else {
      feedback.push('Kết hợp chữ hoa và chữ thường')
    }

    // Number check
    if (/\d/.test(pwd)) {
      score += 1
    } else {
      feedback.push('Thêm ít nhất 1 số')
    }

    // Special character check
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) {
      score += 1
    } else {
      feedback.push('Thêm ký tự đặc biệt (!@#$%^&*)')
    }

    // Bonus points
    if (pwd.length >= 12) score += 0.5
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd) && pwd.length >= 10) score += 0.5

    // Determine color and label
    let color = 'red'
    let label = 'Rất yếu'

    if (score >= 4.5) {
      color = 'green'
      label = 'Rất mạnh'
    } else if (score >= 3.5) {
      color = 'green'
      label = 'Mạnh'
    } else if (score >= 2.5) {
      color = 'yellow'
      label = 'Trung bình'
    } else if (score >= 1.5) {
      color = 'orange'
      label = 'Yếu'
    }

    return { score: Math.min(score, 5), feedback, color, label }
  }

  useEffect(() => {
    if (password) {
      setStrength(calculatePasswordStrength(password))
    } else {
      setStrength({ score: 0, feedback: [], color: 'gray', label: '' })
    }
  }, [password])

  if (!password) return null

  const strengthPercentage = (strength.score / 5) * 100

  return (
    <div className={`mt-3 ${className}`}>
      {/* Strength Bar */}
      <div className="flex justify-between text-xs mb-2">
        <span className="text-gray-600">Độ mạnh mật khẩu</span>
        <span className={`font-medium transition-colors duration-200 ${
          strength.color === 'green' ? 'text-green-600' :
          strength.color === 'yellow' ? 'text-yellow-600' :
          strength.color === 'orange' ? 'text-orange-600' :
          strength.color === 'red' ? 'text-red-600' :
          'text-gray-400'
        }`}>
          {strength.label}
        </span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
        <div
          className={`h-2 rounded-full transition-all duration-500 ease-out ${
            strength.color === 'green' ? 'bg-gradient-to-r from-green-400 to-green-600' :
            strength.color === 'yellow' ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
            strength.color === 'orange' ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
            'bg-gradient-to-r from-red-400 to-red-600'
          }`}
          style={{ width: `${strengthPercentage}%` }}
        />
      </div>

      {/* Feedback */}
      {showFeedback && strength.feedback.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs font-medium text-gray-700 mb-2">Để tăng độ mạnh:</p>
          <ul className="text-xs text-gray-600 space-y-1">
            {strength.feedback.slice(0, 3).map((feedback, index) => (
              <li key={index} className="flex items-start">
                <svg className="w-3 h-3 text-gray-400 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{feedback}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Requirements Check */}
      <div className="mt-3 space-y-1">
        <div className={`text-xs flex items-center transition-colors duration-200 ${
          password.length >= 6 ? 'text-green-600' : 'text-gray-500'
        }`}>
          <svg className={`w-3 h-3 mr-2 ${
            password.length >= 6 ? 'text-green-600' : 'text-gray-400'
          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Ít nhất 6 ký tự
        </div>
        <div className={`text-xs flex items-center transition-colors duration-200 ${
          /[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-500'
        }`}>
          <svg className={`w-3 h-3 mr-2 ${
            /[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-400'
          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Có chữ hoa (khuyên nghị)
        </div>
        <div className={`text-xs flex items-center transition-colors duration-200 ${
          /\d/.test(password) ? 'text-green-600' : 'text-gray-500'
        }`}>
          <svg className={`w-3 h-3 mr-2 ${
            /\d/.test(password) ? 'text-green-600' : 'text-gray-400'
          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Có số (khuyên nghị)
        </div>
      </div>
    </div>
  )
}

// Hook để sử dụng password strength
export function usePasswordStrength(password: string) {
  const [strength, setStrength] = useState(0)
  const [isValid, setIsValid] = useState(false)
  const [isStrong, setIsStrong] = useState(false)

  useEffect(() => {
    let score = 0
    
    if (password.length >= 6) score += 1
    if (password.length >= 8) score += 1
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1
    if (/\d/.test(password)) score += 1
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1

    setStrength(score)
    setIsValid(password.length >= 6)
    setIsStrong(score >= 3)
  }, [password])

  return { strength, isValid, isStrong }
}