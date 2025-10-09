'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { authService } from '@/services/main/auth.service'
import { addressService } from '@/services/main/address.service'
import { useToast } from '@/components/ui/Toast'
import { Province, Commune } from '@/types/main/auth'

export function RegisterForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    addressDetail: '',
    provinceId: 0,
    communeId: 0
  })
  
  const [provinces, setProvinces] = useState<Province[]>([])
  const [communes, setCommunes] = useState<Commune[]>([])
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const router = useRouter()
  const { showToast } = useToast()

  useEffect(() => {
    loadProvinces()
  }, [])

  const loadProvinces = async () => {
    try {
      const response = await addressService.getProvinces()
      if (response.success && response.data) {
        setProvinces(response.data)
      } else {
        setProvinces([])
        if (!response.success) {
          showToast(response.message || 'Không thể tải danh sách tỉnh/thành phố', 'error')
        }
      }
    } catch (error) {
      setProvinces([])
      showToast('Không thể tải danh sách tỉnh/thành phố', 'error')
    }
  }

  const loadCommunes = async (provinceCode: string) => {
    try {
      const response = await addressService.getCommunesByProvince(provinceCode)
      if (response.success && response.data && response.data.items) {
        setCommunes(response.data.items)
      } else {
        setCommunes([])
        if (!response.success) {
          showToast(response.message || 'Không thể tải danh sách xã/phường', 'error')
        }
      }
    } catch (error) {
      setCommunes([])
      showToast('Không thể tải danh sách xã/phường', 'error')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedProvinceCode = e.target.value
    const province = provinces.find(p => p.code === selectedProvinceCode)
    
    if (province) {
      setSelectedProvince(province)
      setFormData(prev => ({ 
        ...prev, 
        provinceId: province.id,
        communeId: 0 
      }))
      setCommunes([])
      loadCommunes(province.code)
    }
  }

  const handleCommuneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCommuneCode = e.target.value
    const commune = communes.find(c => c.code === selectedCommuneCode)
    
    if (commune) {
      setFormData(prev => ({ ...prev, communeId: commune.id }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email) {
      newErrors.email = 'Email là bắt buộc'
    } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ'
    }

    if (!formData.password) {
      newErrors.password = 'Mật khẩu là bắt buộc'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Xác nhận mật khẩu là bắt buộc'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp'
    }

    if (!formData.fullName) {
      newErrors.fullName = 'Họ tên là bắt buộc'
    }

    if (formData.phone && !/^(0\d{9}|(\+84)\d{9})$/.test(formData.phone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ'
    }

    if (!formData.provinceId) {
      newErrors.provinceId = 'Vui lòng chọn tỉnh/thành phố'
    }

    if (!formData.communeId) {
      newErrors.communeId = 'Vui lòng chọn xã/phường'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)

    try {
      const registerData = {
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        phone: formData.phone || undefined,
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth) : undefined,
        gender: formData.gender as 'Male' | 'Female' | 'Other' | undefined,
        addressDetail: formData.addressDetail || undefined,
        communeId: formData.communeId,
        provinceId: formData.provinceId
      }

      const response = await authService.register(registerData)
      
      if (response.success) {
        showToast('Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.', 'success')
        router.push('/auth/login')
      } else {
        showToast(response.message || 'Đăng ký thất bại', 'error')
      }
    } catch (error) {
      showToast('Lỗi kết nối máy chủ', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Đăng ký</h2>
          <p className="text-gray-600">Tạo tài khoản mới để bắt đầu với StayVN</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email và Password */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Nhập email của bạn"
                className={`w-full ${errors.email ? 'border-red-500' : ''}`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                Họ tên *
              </label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Nhập họ tên đầy đủ"
                className={`w-full ${errors.fullName ? 'border-red-500' : ''}`}
              />
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu *
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Nhập mật khẩu"
                className={`w-full ${errors.password ? 'border-red-500' : ''}`}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Xác nhận mật khẩu *
              </label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Nhập lại mật khẩu"
                className={`w-full ${errors.confirmPassword ? 'border-red-500' : ''}`}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          {/* Thông tin cá nhân */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Số điện thoại
              </label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Nhập số điện thoại"
                className={`w-full ${errors.phone ? 'border-red-500' : ''}`}
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            <div>
              <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
                Ngày sinh
              </label>
              <Input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="w-full"
              />
            </div>
          </div>

          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
              Giới tính
            </label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Chọn giới tính</option>
              <option value="Male">Nam</option>
              <option value="Female">Nữ</option>
              <option value="Other">Khác</option>
            </select>
          </div>

          {/* Địa chỉ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-2">
                Tỉnh/Thành phố *
              </label>
              <select
                id="province"
                onChange={handleProvinceChange}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.provinceId ? 'border-red-500' : ''}`}
              >
                <option value="">Chọn tỉnh/thành phố</option>
                {provinces && provinces.length > 0 ? (
                  provinces.map(province => (
                    <option key={province.id} value={province.code}>
                      {province.name}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>Đang tải...</option>
                )}
              </select>
              {errors.provinceId && (
                <p className="mt-1 text-sm text-red-600">{errors.provinceId}</p>
              )}
            </div>

            <div>
              <label htmlFor="commune" className="block text-sm font-medium text-gray-700 mb-2">
                Xã/Phường *
              </label>
              <select
                id="commune"
                onChange={handleCommuneChange}
                disabled={!selectedProvince}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.communeId ? 'border-red-500' : ''} ${!selectedProvince ? 'bg-gray-100' : ''}`}
              >
                <option value="">Chọn xã/phường</option>
                {communes && communes.length > 0 ? (
                  communes.map(commune => (
                    <option key={commune.id} value={commune.code}>
                      {commune.name}
                    </option>
                  ))
                ) : (
                  selectedProvince && (
                    <option value="" disabled>Đang tải...</option>
                  )
                )}
              </select>
              {errors.communeId && (
                <p className="mt-1 text-sm text-red-600">{errors.communeId}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="addressDetail" className="block text-sm font-medium text-gray-700 mb-2">
              Địa chỉ chi tiết
            </label>
            <Input
              id="addressDetail"
              name="addressDetail"
              type="text"
              value={formData.addressDetail}
              onChange={handleChange}
              placeholder="Nhập địa chỉ chi tiết (số nhà, đường...)"
              className="w-full"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-xl font-medium transition-all duration-200"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Đang đăng ký...</span>
              </div>
            ) : (
              'Đăng ký'
            )}
          </Button>

          <div className="text-center pt-4">
            <p className="text-gray-600">
              Đã có tài khoản?{' '}
              <Link
                href="/auth/login"
                className="text-blue-600 hover:text-blue-500 font-medium transition-colors"
              >
                Đăng nhập ngay
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}