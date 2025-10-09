// components/forms/AvatarUpload.tsx
'use client'

import { useState, useRef } from 'react'
import { userService } from '@/services/main/user.service'
import { useToast } from '@/components/ui/Toast'

interface AvatarUploadProps {
  currentAvatar?: string
  fullName: string
  onAvatarUpdate: (newAvatarUrl: string | null) => void
}

export function AvatarUpload({ currentAvatar, fullName, onAvatarUpdate }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { showToast } = useToast()

  const getAvatarUrl = (avatar: string | undefined) => {
    if (!avatar) return null
    return avatar.startsWith('http') ? avatar : `https://localhost:7257${avatar}`
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('Vui lòng chọn file ảnh hợp lệ', 'error')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      showToast('Kích thước file không được vượt quá 5MB', 'error')
      return
    }

    handleUpload(file)
  }

  const handleUpload = async (file: File) => {
    setIsUploading(true)
    try {
      const response = await userService.uploadAvatar(file)
      if (response.success && response.data) {
        // Call the callback with the new avatar URL
        onAvatarUpdate(response.data.avatarUrl)
        showToast('Cập nhật ảnh đại diện thành công!', 'success')
      } else {
        showToast(response.message || 'Upload ảnh thất bại', 'error')
      }
    } catch (error) {
      console.error('Upload avatar error:', error)
      showToast('Lỗi kết nối máy chủ', 'error')
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveAvatar = async () => {
    setIsRemoving(true)
    try {
      const response = await userService.removeAvatar()
      if (response.success) {
        // Call the callback with null to indicate avatar removed
        onAvatarUpdate(null)
        showToast('Xóa ảnh đại diện thành công!', 'success')
      } else {
        showToast(response.message || 'Xóa ảnh thất bại', 'error')
      }
    } catch (error) {
      showToast('Lỗi kết nối máy chủ', 'error')
    } finally {
      setIsRemoving(false)
    }
  }

  const openFileSelector = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="relative group">
      {/* Avatar Display */}
      <div className="relative w-32 h-32">
        <div className="w-full h-full rounded-full overflow-hidden border-4 border-white shadow-xl bg-gradient-to-r from-blue-500 to-purple-600 p-0.5">
          <div className="w-full h-full rounded-full overflow-hidden bg-white flex items-center justify-center">
            {getAvatarUrl(currentAvatar) ? (
              <img
                src={getAvatarUrl(currentAvatar)!}
                alt={fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-blue-600 text-2xl font-bold">
                {getInitials(fullName)}
              </span>
            )}
          </div>
        </div>

        {/* Upload/Loading Overlay */}
        {(isUploading || isRemoving) && (
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
            <div className="flex flex-col items-center space-y-2">
              <svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-white text-xs font-medium">
                {isUploading ? 'Đang tải...' : 'Đang xóa...'}
              </span>
            </div>
          </div>
        )}

        {/* Camera Icon - Show on hover or when no avatar */}
        <div className={`absolute inset-0 bg-black/30 rounded-full flex items-center justify-center transition-opacity duration-200 ${
          !getAvatarUrl(currentAvatar) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}>
          <button
            onClick={openFileSelector}
            disabled={isUploading || isRemoving}
            className="p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors duration-200 disabled:cursor-not-allowed"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        {/* Online Status Indicator */}
        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full shadow-lg"></div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        <button
          onClick={openFileSelector}
          disabled={isUploading || isRemoving}
          className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <span>{currentAvatar ? 'Thay đổi' : 'Tải lên'}</span>
        </button>

        {currentAvatar && (
          <button
            onClick={handleRemoveAvatar}
            disabled={isUploading || isRemoving}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-white border border-red-300/30 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Xóa</span>
          </button>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload Guidelines */}
      <div className="mt-3 text-center">
        <p className="text-xs text-white/80">
          Chấp nhận: JPG, PNG, GIF (tối đa 5MB)
        </p>
      </div>
    </div>
  )
}