'use client'

import { useState, useEffect } from 'react'
import { websiteSettingsService } from '@/services/admin/websitesettings.service'
import { WebsiteSetting, WebsiteSettingsDto } from '@/types/admin/websitesettings'
import { useToast } from '@/components/ui/Toast'

export default function WebsiteSettingsPage() {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<WebsiteSetting | null>(null)
  const [activeTab, setActiveTab] = useState<'general' | 'seo' | 'social' | 'banking'>('general')
  
  const [formData, setFormData] = useState<WebsiteSettingsDto>({
    siteName: '',
    siteDescription: '',
    supportEmail: '',
    supportPhone: '',
    address: '',
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    facebookUrl: '',
    twitterUrl: '',
    instagramUrl: '',
    youtubeUrl: '',
    tiktokUrl: '',
    bankName: '',
    bankAccountName: '',
    bankAccountNumber: '',
  })

  const [logoPreview, setLogoPreview] = useState<string>('')
  const [faviconPreview, setFaviconPreview] = useState<string>('')
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ''

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
  try {
    setLoading(true)
    const response = await websiteSettingsService.getSettings()
    
    if (response.success && response.data) {  // Kiểm tra success
      setSettings(response.data)
      setFormData({
        siteName: response.data.siteName || '',
        siteDescription: response.data.siteDescription || '',
        supportEmail: response.data.supportEmail || '',
        supportPhone: response.data.supportPhone || '',
        address: response.data.address || '',
        metaTitle: response.data.metaTitle || '',
        metaDescription: response.data.metaDescription || '',
        metaKeywords: response.data.metaKeywords || '',
        facebookUrl: response.data.facebookUrl || '',
        twitterUrl: response.data.twitterUrl || '',
        instagramUrl: response.data.instagramUrl || '',
        youtubeUrl: response.data.youtubeUrl || '',
        tiktokUrl: response.data.tiktokUrl || '',
        bankName: response.data.bankName || '',
        bankAccountName: response.data.bankAccountName || '',
        bankAccountNumber: response.data.bankAccountNumber || '',
      })
      setLogoPreview(response.data.logoUrl ? `${API_BASE_URL}${response.data.logoUrl}` : '')
      setFaviconPreview(response.data.faviconUrl ? `${API_BASE_URL}${response.data.faviconUrl}` : '')
    } else {
      showToast(response.message || 'Không thể tải cấu hình website', 'error')
    }
  } catch (error) {
    console.error('Fetch error:', error)
    showToast('Không thể tải cấu hình website', 'error')
  } finally {
    setLoading(false)
  }
}

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon') => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({ ...prev, [type]: file }))
      const reader = new FileReader()
      reader.onloadend = () => {
        if (type === 'logo') {
          setLogoPreview(reader.result as string)
        } else {
          setFaviconPreview(reader.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDeleteLogo = async () => {
    if (!confirm('Bạn có chắc muốn xóa logo?')) return
    
    try {
      const response = await websiteSettingsService.deleteLogo()
      showToast(response.message || 'Xóa logo thành công', 'success')
      setLogoPreview('')
      fetchSettings()
    } catch (error) {
      showToast('Không thể xóa logo', 'error')
    }
  }

  const handleDeleteFavicon = async () => {
    if (!confirm('Bạn có chắc muốn xóa favicon?')) return
    
    try {
      const response = await websiteSettingsService.deleteFavicon()
      showToast(response.message || 'Xóa favicon thành công', 'success')
      setFaviconPreview('')
      fetchSettings()
    } catch (error) {
      showToast('Không thể xóa favicon', 'error')
    }
  }

  const handleSubmit = async () => {
    if (!formData.siteName.trim()) {
      showToast('Vui lòng nhập tên website', 'warning')
      return
    }
    
    try {
      setSaving(true)
      const response = await websiteSettingsService.upsertSettings(formData)
      
      if (response.message) {
        showToast(response.message, 'success')
        fetchSettings()
      }
    } catch (error) {
      showToast('Không thể lưu cấu hình', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    )
  }

  const tabs = [
    { id: 'general', label: 'Thông tin chung', icon: '🏠' },
    { id: 'seo', label: 'SEO', icon: '🔍' },
    { id: 'social', label: 'Mạng xã hội', icon: '📱' },
    { id: 'banking', label: 'Ngân hàng', icon: '💳' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 p-4 pb-20">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 mb-6 shadow-xl">
          <h1 className="text-2xl font-bold text-white mb-2">⚙️ Cấu hình Website</h1>
          <p className="text-purple-100 text-sm">Quản lý thông tin và cài đặt website của bạn</p>
        </div>

        <div className="flex overflow-x-auto gap-2 mb-6 pb-2 scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105'
                  : 'bg-white text-gray-600 hover:bg-purple-50'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="text-sm">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h2 className="text-lg font-bold text-purple-900 mb-4">📝 Thông tin cơ bản</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tên website <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="siteName"
                      value={formData.siteName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition"
                      placeholder="Nhập tên website"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả website</label>
                    <textarea
                      name="siteDescription"
                      value={formData.siteDescription}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition resize-none"
                      placeholder="Mô tả ngắn về website"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h2 className="text-lg font-bold text-purple-900 mb-4">🖼️ Hình ảnh</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
                    {logoPreview && (
                      <div className="relative w-full h-32 mb-2 rounded-xl overflow-hidden border-2 border-purple-200">
                        <img src={logoPreview} alt="Logo" className="w-full h-full object-contain bg-gray-50 p-2" />
                        <button
                          type="button"
                          onClick={handleDeleteLogo}
                          className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition shadow-lg"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'logo')}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Favicon</label>
                    {faviconPreview && (
                      <div className="relative w-full h-32 mb-2 rounded-xl overflow-hidden border-2 border-purple-200">
                        <img src={faviconPreview} alt="Favicon" className="w-full h-full object-contain bg-gray-50 p-2" />
                        <button
                          type="button"
                          onClick={handleDeleteFavicon}
                          className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition shadow-lg"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'favicon')}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h2 className="text-lg font-bold text-purple-900 mb-4">📞 Thông tin liên hệ</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email hỗ trợ</label>
                    <input
                      type="email"
                      name="supportEmail"
                      value={formData.supportEmail}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition"
                      placeholder="support@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại</label>
                    <input
                      type="tel"
                      name="supportPhone"
                      value={formData.supportPhone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition"
                      placeholder="0123456789"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition resize-none"
                      placeholder="Địa chỉ công ty"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'seo' && (
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h2 className="text-lg font-bold text-purple-900 mb-4">🔍 Tối ưu SEO</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Meta Title</label>
                  <input
                    type="text"
                    name="metaTitle"
                    value={formData.metaTitle}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition"
                    placeholder="Tiêu đề hiển thị trên search engine"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Meta Description</label>
                  <textarea
                    name="metaDescription"
                    value={formData.metaDescription}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition resize-none"
                    placeholder="Mô tả ngắn gọn về website (150-160 ký tự)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Meta Keywords</label>
                  <input
                    type="text"
                    name="metaKeywords"
                    value={formData.metaKeywords}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition"
                    placeholder="Từ khóa, phân cách bằng dấu phẩy"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'social' && (
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h2 className="text-lg font-bold text-purple-900 mb-4">📱 Mạng xã hội</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">🔵 Facebook</label>
                  <input
                    type="url"
                    name="facebookUrl"
                    value={formData.facebookUrl}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition"
                    placeholder="https://facebook.com/..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">🐦 Twitter</label>
                  <input
                    type="url"
                    name="twitterUrl"
                    value={formData.twitterUrl}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition"
                    placeholder="https://twitter.com/..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">📷 Instagram</label>
                  <input
                    type="url"
                    name="instagramUrl"
                    value={formData.instagramUrl}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition"
                    placeholder="https://instagram.com/..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">▶️ YouTube</label>
                  <input
                    type="url"
                    name="youtubeUrl"
                    value={formData.youtubeUrl}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition"
                    placeholder="https://youtube.com/..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">🎵 TikTok</label>
                  <input
                    type="url"
                    name="tiktokUrl"
                    value={formData.tiktokUrl}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition"
                    placeholder="https://tiktok.com/@..."
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'banking' && (
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h2 className="text-lg font-bold text-purple-900 mb-4">💳 Thông tin ngân hàng</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tên ngân hàng</label>
                  <input
                    type="text"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition"
                    placeholder="VD: Vietcombank"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tên chủ tài khoản</label>
                  <input
                    type="text"
                    name="bankAccountName"
                    value={formData.bankAccountName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition"
                    placeholder="NGUYEN VAN A"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Số tài khoản</label>
                  <input
                    type="text"
                    name="bankAccountNumber"
                    value={formData.bankAccountNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition"
                    placeholder="1234567890"
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Đang lưu...
              </span>
            ) : (
              '💾 Lưu cấu hình'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}