// app/profile/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AvatarUpload } from '@/components/forms/AvatarUpload'
import { StatisticsDashboard } from '@/components/features/StatisticsDashboard'
import { ChangePasswordModal } from '@/components/forms/ChangePasswordModal'
import { LoginHistoryModal } from '@/components/forms/LoginHistoryModal'
import { userService } from '@/services/main/user.service'
import { addressService } from '@/services/main/address.service'
import { UserProfile, UpdateProfileRequest } from '@/types/main/user'
import { Province, Commune } from '@/types/main/auth'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/contexts/AuthContext'

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [showLoginHistory, setShowLoginHistory] = useState(false)
  const [editData, setEditData] = useState<UpdateProfileRequest>({})
  
  // Address data
  const [provinces, setProvinces] = useState<Province[]>([])
  const [communes, setCommunes] = useState<Commune[]>([])
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null)
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false)
  const [isLoadingCommunes, setIsLoadingCommunes] = useState(false)
  
  const { showToast } = useToast()
  const { user, updateUserAvatar, updateUserProfile, updateUserRole } = useAuth()

  useEffect(() => {
    fetchProfile()
  }, [])

  // Load provinces when editing starts
  useEffect(() => {
    if (isEditing && provinces.length === 0) {
      loadProvinces()
    }
  }, [isEditing])

  const fetchProfile = async () => {
    try {
      const response = await userService.getProfile()
      if (response.success && response.data) {
        setProfile(response.data)
        // Initialize edit data
        setEditData({
          fullName: response.data.fullName,
          phone: response.data.phone,
          dateOfBirth: response.data.dateOfBirth ? new Date(response.data.dateOfBirth) : undefined,
          gender: response.data.gender,
          addressDetail: response.data.addressDetail,
          provinceId: response.data.provinceId,
          communeId: response.data.communeId,
        })
      } else {
        showToast('Không thể tải thông tin profile', 'error')
      }
    } catch (error) {
      showToast('Lỗi kết nối máy chủ', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const loadProvinces = async () => {
    setIsLoadingProvinces(true)
    try {
      const response = await addressService.getProvinces()
      if (response.success && response.data) {
        setProvinces(response.data)
        
        // If user has a province, load communes for that province
        if (profile?.provinceId) {
          const userProvince = response.data.find(p => p.id === profile.provinceId)
          if (userProvince) {
            setSelectedProvince(userProvince)
            loadCommunes(userProvince.code)
          }
        }
      } else {
        showToast('Không thể tải danh sách tỉnh/thành phố', 'error')
      }
    } catch (error) {
      showToast('Lỗi khi tải danh sách tỉnh/thành phố', 'error')
    } finally {
      setIsLoadingProvinces(false)
    }
  }

  const loadCommunes = async (provinceCode: string) => {
    setIsLoadingCommunes(true)
    try {
      const response = await addressService.getCommunesByProvince(provinceCode)
      if (response.success && response.data && response.data.items) {
        setCommunes(response.data.items)
      } else {
        setCommunes([])
        showToast('Không thể tải danh sách xã/phường', 'error')
      }
    } catch (error) {
      setCommunes([])
      showToast('Lỗi khi tải danh sách xã/phường', 'error')
    } finally {
      setIsLoadingCommunes(false)
    }
  }

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedProvinceId = parseInt(e.target.value)
    const province = provinces.find(p => p.id === selectedProvinceId)
    
    if (province) {
      setSelectedProvince(province)
      setEditData(prev => ({ 
        ...prev, 
        provinceId: province.id,
        communeId: undefined // Reset commune when province changes
      }))
      setCommunes([])
      loadCommunes(province.code)
    } else {
      setSelectedProvince(null)
      setEditData(prev => ({ 
        ...prev, 
        provinceId: undefined,
        communeId: undefined
      }))
      setCommunes([])
    }
  }

  const handleCommuneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCommuneId = parseInt(e.target.value)
    const commune = communes.find(c => c.id === selectedCommuneId)
    
    if (commune) {
      setEditData(prev => ({ ...prev, communeId: commune.id }))
    } else {
      setEditData(prev => ({ ...prev, communeId: undefined }))
    }
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      const response = await userService.updateProfile(editData)
      if (response.success) {
        // Fetch updated profile data
        await fetchProfile()
        
        // Cập nhật thông tin trong AuthContext để header được cập nhật
        if (profile) {
          const updatedProfile = {
            ...profile,
            fullName: editData.fullName || profile.fullName,
            phone: editData.phone || profile.phone,
            dateOfBirth: editData.dateOfBirth || profile.dateOfBirth,
            gender: editData.gender || profile.gender,
            addressDetail: editData.addressDetail || profile.addressDetail,
            provinceId: editData.provinceId || profile.provinceId,
            communeId: editData.communeId || profile.communeId,
          }
          
          // Cập nhật context
          updateUserProfile(updatedProfile)
        }
        
        setIsEditing(false)
        showToast('Cập nhật thông tin thành công!', 'success')
      } else {
        showToast(response.message || 'Cập nhật thất bại', 'error')
      }
    } catch (error) {
      showToast('Lỗi kết nối máy chủ', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpgradeToHost = async () => {
    setIsUpgrading(true)
    try {
      const response = await userService.upgradeToHost()
      if (response.success) {
        // Fetch updated profile
        await fetchProfile()
        
        // Cập nhật role trong AuthContext để header được cập nhật
        updateUserRole('host')
        
        showToast('Nâng cấp lên Host thành công!', 'success')
      } else {
        showToast(response.message || 'Nâng cấp thất bại', 'error')
      }
    } catch (error) {
      showToast('Lỗi kết nối máy chủ', 'error')
    } finally {
      setIsUpgrading(false)
    }
  }

  const handleAvatarUpdate = async (newAvatarUrl: string | null) => {
    if (profile) {
      setProfile({ ...profile, avatar: newAvatarUrl || undefined })
      // Cập nhật cả context auth để header nhận được thay đổi
      updateUserAvatar(newAvatarUrl)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    // Reset edit data to original profile data
    setEditData({
      fullName: profile?.fullName,
      phone: profile?.phone,
      dateOfBirth: profile?.dateOfBirth ? new Date(profile.dateOfBirth) : undefined,
      gender: profile?.gender,
      addressDetail: profile?.addressDetail,
      provinceId: profile?.provinceId,
      communeId: profile?.communeId,
    })
    // Reset address selection
    setSelectedProvince(null)
    setCommunes([])
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            {/* Header Skeleton */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-300 to-gray-400 px-8 py-16">
                <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-8">
                  <div className="w-32 h-32 bg-white/20 rounded-full mx-auto lg:mx-0"></div>
                  <div className="flex-1 mt-6 lg:mt-0 space-y-4">
                    <div className="h-8 bg-white/20 rounded w-1/3 mx-auto lg:mx-0"></div>
                    <div className="h-4 bg-white/20 rounded w-1/2 mx-auto lg:mx-0"></div>
                    <div className="h-4 bg-white/20 rounded w-1/4 mx-auto lg:mx-0"></div>
                  </div>
                </div>
              </div>
            </div>
            {/* Content Skeletons */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-8">
                <div className="mx-auto lg:mx-0">
                  <AvatarUpload
                    currentAvatar={profile.avatar}
                    fullName={profile.fullName}
                    onAvatarUpdate={handleAvatarUpdate}
                  />
                </div>
                <div className="mt-6 lg:mt-0 text-center lg:text-left">
                  <h1 className="text-3xl font-bold text-white mb-2">{profile.fullName}</h1>
                  <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-4 space-y-2 lg:space-y-0">
                    <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 text-white backdrop-blur-sm">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {profile.role === 'host' ? 'Host' : profile.role === 'customer' ? 'Khách hàng' : profile.role}
                    </span>
                    <span className="text-blue-100 text-sm">
                      Tham gia từ {formatDate(profile.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 lg:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                {profile.role !== 'host' && (
                  <Button
                    onClick={handleUpgradeToHost}
                    disabled={isUpgrading}
                    className="bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm transition-all duration-200"
                  >
                    {isUpgrading ? (
                      <div className="flex items-center space-x-2">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Đang nâng cấp...</span>
                      </div>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Trở thành Host
                      </>
                    )}
                  </Button>
                )}
                
                <Button
                  onClick={() => setIsEditing(!isEditing)}
                  className="bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm transition-all duration-200"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  {isEditing ? 'Hủy chỉnh sửa' : 'Chỉnh sửa thông tin'}
                </Button>
              </div>
            </div>
          </div>

          {/* Account Status */}
          <div className="px-8 py-4 bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${profile.isEmailVerified ? 'bg-green-500 shadow-green-500/50 shadow-sm' : 'bg-red-500 shadow-red-500/50 shadow-sm'}`}></div>
                <span className="text-sm font-medium text-gray-700">
                  Email {profile.isEmailVerified ? 'đã xác thực' : 'chưa xác thực'}
                </span>
                {profile.isEmailVerified && (
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${profile.isActive ? 'bg-green-500 shadow-green-500/50 shadow-sm' : 'bg-red-500 shadow-red-500/50 shadow-sm'}`}></div>
                <span className="text-sm font-medium text-gray-700">
                  Tài khoản {profile.isActive ? 'hoạt động' : 'bị tạm khóa'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Dashboard - Only for hosts */}
        <StatisticsDashboard userRole={profile.role} />

        {/* Profile Information */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Thông tin cá nhân</h2>
              <p className="text-gray-600 mt-1">Quản lý thông tin tài khoản của bạn</p>
            </div>
            {isEditing && (
              <div className="flex space-x-3">
                <Button
                  onClick={handleCancelEdit}
                  variant="outline"
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  {isSaving ? (
                    <div className="flex items-center space-x-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Đang lưu...</span>
                    </div>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Lưu thay đổi
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              {isEditing ? (
                <Input
                  value={editData.fullName || ''}
                  onChange={(e) => setEditData({ ...editData, fullName: e.target.value })}
                  placeholder="Nhập họ và tên"
                  className="w-full"
                />
              ) : (
                <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
                  <p className="text-gray-900 font-medium">{profile.fullName}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <p className="text-gray-700">{profile.email}</p>
                  {profile.isEmailVerified && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Đã xác thực
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500">Email không thể thay đổi</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Số điện thoại</label>
              {isEditing ? (
                <Input
                  value={editData.phone || ''}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  placeholder="Nhập số điện thoại"
                  className="w-full"
                />
              ) : (
                <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
                  <p className="text-gray-900">{profile.phone || 'Chưa cập nhật'}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Ngày sinh</label>
              {isEditing ? (
                <Input
                  type="date"
                  value={editData.dateOfBirth ? editData.dateOfBirth.toISOString().split('T')[0] : ''}
                  onChange={(e) => setEditData({ ...editData, dateOfBirth: e.target.value ? new Date(e.target.value) : undefined })}
                  className="w-full"
                />
              ) : (
                <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
                  <p className="text-gray-900">
                    {profile.dateOfBirth ? formatDate(profile.dateOfBirth) : 'Chưa cập nhật'}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Giới tính</label>
              {isEditing ? (
                <select
                  value={editData.gender || ''}
                  onChange={(e) => setEditData({ ...editData, gender: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">Chọn giới tính</option>
                  <option value="Male">Nam</option>
                  <option value="Female">Nữ</option>
                  <option value="Other">Khác</option>
                </select>
              ) : (
                <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
                  <p className="text-gray-900">
                    {profile.gender === 'Male' ? 'Nam' : 
                     profile.gender === 'Female' ? 'Nữ' : 
                     profile.gender === 'Other' ? 'Khác' : 'Chưa cập nhật'}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Vai trò</label>
              <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <p className="text-gray-900 font-medium">
                    {profile.role === 'host' ? 'Host' : 
                     profile.role === 'customer' ? 'Khách hàng' : 
                     profile.role === 'admin' ? 'Quản trị viên' : profile.role}
                  </p>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    profile.role === 'host' ? 'bg-purple-100 text-purple-800' :
                    profile.role === 'admin' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {profile.role === 'host' ? 'HOST' : 
                     profile.role === 'admin' ? 'ADMIN' : 
                     'CUSTOMER'}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500">Vai trò hệ thống, không thể thay đổi trực tiếp</p>
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="block text-sm font-medium text-gray-700">Địa chỉ chi tiết</label>
              {isEditing ? (
                <textarea
                  value={editData.addressDetail || ''}
                  onChange={(e) => setEditData({ ...editData, addressDetail: e.target.value })}
                  placeholder="Nhập địa chỉ chi tiết"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200"
                />
              ) : (
                <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200 min-h-[80px]">
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {profile.addressDetail || 'Chưa cập nhật địa chỉ chi tiết'}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Tỉnh/Thành phố</label>
              {isEditing ? (
                <select
                  value={editData.provinceId || ''}
                  onChange={handleProvinceChange}
                  disabled={isLoadingProvinces}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">Chọn tỉnh/thành phố</option>
                  {provinces.map(province => (
                    <option key={province.id} value={province.id}>
                      {province.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
                  <p className="text-gray-900">{profile.province || 'Chưa cập nhật'}</p>
                </div>
              )}
              {isEditing && isLoadingProvinces && (
                <p className="text-xs text-gray-500">Đang tải danh sách tỉnh/thành phố...</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Quận/Huyện</label>
              {isEditing ? (
                <select
                  value={editData.communeId || ''}
                  onChange={handleCommuneChange}
                  disabled={!selectedProvince || isLoadingCommunes}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Chọn quận/huyện</option>
                  {communes.map(commune => (
                    <option key={commune.id} value={commune.id}>
                      {commune.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
                  <p className="text-gray-900">{profile.commune || 'Chưa cập nhật'}</p>
                </div>
              )}
              {isEditing && isLoadingCommunes && (
                <p className="text-xs text-gray-500">Đang tải danh sách quận/huyện...</p>
              )}
              {isEditing && !selectedProvince && (
                <p className="text-xs text-gray-500">Vui lòng chọn tỉnh/thành phố trước</p>
              )}
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900">Bảo mật tài khoản</h2>
            <p className="text-gray-600 mt-1">Quản lý bảo mật và quyền riêng tư</p>
          </div>
          
          <div className="space-y-4">
            <div className="group hover:bg-gray-50 transition-colors duration-200 rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Đổi mật khẩu</h3>
                    <p className="text-sm text-gray-600">Cập nhật mật khẩu để bảo vệ tài khoản của bạn</p>
                  </div>
                </div>
                <Button 
                  onClick={() => setShowChangePassword(true)}
                  variant="outline"
                  className="group-hover:border-blue-300 group-hover:text-blue-600 transition-colors duration-200"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Thay đổi
                </Button>
              </div>
            </div>

            <div className="group hover:bg-gray-50 transition-colors duration-200 rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Xác thực 2 bước</h3>
                    <p className="text-sm text-gray-600">Tăng cường bảo mật với xác thực hai bước</p>
                  </div>
                </div>
                <Button 
                  variant="outline"
                  className="group-hover:border-green-300 group-hover:text-green-600 transition-colors duration-200"
                  disabled
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  </svg>
                  Thiết lập (Sắp có)
                </Button>
              </div>
            </div>

            <div className="group hover:bg-gray-50 transition-colors duration-200 rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Lịch sử đăng nhập</h3>
                    <p className="text-sm text-gray-600">Xem các lần đăng nhập gần đây</p>
                  </div>
                </div>
                <Button 
                  onClick={() => setShowLoginHistory(true)}
                  variant="outline"
                  className="group-hover:border-orange-300 group-hover:text-orange-600 transition-colors duration-200"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Xem lịch sử
                </Button>
              </div>
            </div>
          </div>

          {/* Security Tips */}
          <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">Mẹo bảo mật</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Sử dụng mật khẩu mạnh có ít nhất 8 ký tự</li>
                  <li>• Không chia sẻ mật khẩu với bất kỳ ai</li>
                  <li>• Đăng xuất khỏi các thiết bị công cộng</li>
                  <li>• Cập nhật thông tin liên hệ để khôi phục tài khoản</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900">Cài đặt tài khoản</h2>
            <p className="text-gray-600 mt-1">Quản lý tùy chọn và cài đặt tài khoản</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="group hover:bg-red-50 transition-colors duration-200 rounded-xl p-6 border border-red-200">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Xóa tài khoản</h3>
                  <p className="text-sm text-gray-600">Xóa vĩnh viễn tài khoản và dữ liệu của bạn</p>
                </div>
              </div>
              <Button 
                variant="destructive"
                className="w-full"
                disabled
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Xóa tài khoản (Sắp có)
              </Button>
              <p className="text-xs text-red-600 mt-2">
                Hành động này không thể hoàn tác
              </p>
            </div>

            <div className="group hover:bg-gray-50 transition-colors duration-200 rounded-xl p-6 border border-gray-200">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Xuất dữ liệu</h3>
                  <p className="text-sm text-gray-600">Tải xuống bản sao dữ liệu của bạn</p>
                </div>
              </div>
              <Button 
                variant="outline"
                className="w-full"
                disabled
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Xuất dữ liệu (Sắp có)
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
      <LoginHistoryModal
        isOpen={showLoginHistory}
        onClose={() => setShowLoginHistory(false)}
      />
    </div>
  )
}