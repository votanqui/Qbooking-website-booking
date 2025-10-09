'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { websiteSettingsService } from '@/services/admin/websitesettings.service'
import { PublicWebsiteSetting } from '@/types/admin/websitesettings'

export function Footer() {
  const [settings, setSettings] = useState<PublicWebsiteSetting | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await websiteSettingsService.getPublicSettings()
        if (response.success && response.data) {
          setSettings(response.data)
        }
      } catch (error) {
        console.error('Error fetching website settings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  const currentYear = new Date().getFullYear()
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL

  return (
    <footer className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Company Info */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              {settings?.logoUrl ? (
                <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-pink-500 to-purple-600 p-0.5">
                  <div className="w-full h-full bg-white rounded-xl flex items-center justify-center p-1">
                    <img 
                      src={`${apiBaseUrl}${settings.logoUrl}`}
                      alt={settings.siteName || 'Logo'}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/50">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
              )}
              <span className="text-2xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
                {loading ? 'Loading...' : settings?.siteName || 'QBooking'}
              </span>
            </div>
            
            <p className="text-gray-300 text-sm leading-relaxed">
              {settings?.siteDescription || 'Nền tảng đặt phòng khách sạn, homestay, resort, villa và căn hộ. Hàng ngàn ưu đãi mỗi ngày.'}
            </p>

            {/* Contact Info */}
            {(settings?.supportEmail || settings?.supportPhone || settings?.address) && (
              <div className="space-y-3 pt-2">
                {settings?.supportEmail && (
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <a href={`mailto:${settings.supportEmail}`} className="text-gray-300 hover:text-pink-400 transition-colors">
                      {settings.supportEmail}
                    </a>
                  </div>
                )}
                
                {settings?.supportPhone && (
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <a href={`tel:${settings.supportPhone}`} className="text-gray-300 hover:text-purple-400 transition-colors">
                      {settings.supportPhone}
                    </a>
                  </div>
                )}
                
                {settings?.address && (
                  <div className="flex items-start space-x-3 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <span className="text-gray-300 leading-relaxed">
                      {settings.address}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Social Media */}
            <div className="flex flex-wrap gap-3 pt-2">
              {settings?.facebookUrl && (
                <a 
                  href={settings.facebookUrl} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30 flex items-center justify-center transition-all duration-300 group border border-pink-500/20 hover:border-pink-500/40"
                >
                  <svg className="w-5 h-5 text-pink-300 group-hover:text-pink-400 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
              )}
              
              {settings?.twitterUrl && (
                <a 
                  href={settings.twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30 flex items-center justify-center transition-all duration-300 group border border-pink-500/20 hover:border-pink-500/40"
                >
                  <svg className="w-5 h-5 text-pink-300 group-hover:text-pink-400 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              )}
              
              {settings?.instagramUrl && (
                <a 
                  href={settings.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30 flex items-center justify-center transition-all duration-300 group border border-pink-500/20 hover:border-pink-500/40"
                >
                  <svg className="w-5 h-5 text-pink-300 group-hover:text-pink-400 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              )}
              
              {settings?.youtubeUrl && (
                <a 
                  href={settings.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30 flex items-center justify-center transition-all duration-300 group border border-pink-500/20 hover:border-pink-500/40"
                >
                  <svg className="w-5 h-5 text-pink-300 group-hover:text-pink-400 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              )}
              
              {settings?.tiktokUrl && (
                <a 
                  href={settings.tiktokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30 flex items-center justify-center transition-all duration-300 group border border-pink-500/20 hover:border-pink-500/40"
                >
                  <svg className="w-5 h-5 text-pink-300 group-hover:text-pink-400 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-6 bg-gradient-to-r from-pink-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
              Liên kết nhanh
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/properties" className="text-gray-300 hover:text-pink-400 transition-colors text-sm flex items-center group">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-500/50 mr-3 group-hover:bg-pink-400 transition-colors"></span>
                  Tất cả khách sạn
                </Link>
              </li>
              <li>
                <Link href="/bookings" className="text-gray-300 hover:text-pink-400 transition-colors text-sm flex items-center group">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-500/50 mr-3 group-hover:bg-pink-400 transition-colors"></span>
                  Đặt phòng của tôi
                </Link>
              </li>
              <li>
                <Link href="/become-host" className="text-gray-300 hover:text-pink-400 transition-colors text-sm flex items-center group">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-500/50 mr-3 group-hover:bg-pink-400 transition-colors"></span>
                  Trở thành đối tác
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-gray-300 hover:text-pink-400 transition-colors text-sm flex items-center group">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-500/50 mr-3 group-hover:bg-pink-400 transition-colors"></span>
                  Trung tâm hỗ trợ
                </Link>
              </li>
            </ul>
          </div>

          {/* Destinations */}
          <div>
            <h3 className="text-lg font-semibold mb-6 bg-gradient-to-r from-pink-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
              Điểm đến phổ biến
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/properties?location=ho-chi-minh-city" className="text-gray-300 hover:text-purple-400 transition-colors text-sm flex items-center group">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500/50 mr-3 group-hover:bg-purple-400 transition-colors"></span>
                  TP. Hồ Chí Minh
                </Link>
              </li>
              <li>
                <Link href="/properties?location=hanoi" className="text-gray-300 hover:text-purple-400 transition-colors text-sm flex items-center group">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500/50 mr-3 group-hover:bg-purple-400 transition-colors"></span>
                  Hà Nội
                </Link>
              </li>
              <li>
                <Link href="/properties?location=da-nang" className="text-gray-300 hover:text-purple-400 transition-colors text-sm flex items-center group">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500/50 mr-3 group-hover:bg-purple-400 transition-colors"></span>
                  Đà Nẵng
                </Link>
              </li>
              <li>
                <Link href="/properties?location=nha-trang" className="text-gray-300 hover:text-purple-400 transition-colors text-sm flex items-center group">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500/50 mr-3 group-hover:bg-purple-400 transition-colors"></span>
                  Nha Trang
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-6 bg-gradient-to-r from-pink-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
              Hỗ trợ
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-pink-400 transition-colors text-sm flex items-center group">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-500/50 mr-3 group-hover:bg-pink-400 transition-colors"></span>
                  Liên hệ
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-300 hover:text-pink-400 transition-colors text-sm flex items-center group">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-500/50 mr-3 group-hover:bg-pink-400 transition-colors"></span>
                  Điều khoản dịch vụ
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-300 hover:text-pink-400 transition-colors text-sm flex items-center group">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-500/50 mr-3 group-hover:bg-pink-400 transition-colors"></span>
                  Chính sách bảo mật
                </Link>
              </li>
              <li>
                <Link href="/cancellation" className="text-gray-300 hover:text-pink-400 transition-colors text-sm flex items-center group">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-500/50 mr-3 group-hover:bg-pink-400 transition-colors"></span>
                  Chính sách hủy phòng
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-700/50 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-gray-400 text-sm">
            © {currentYear} {settings?.siteName || 'QBooking'}. All rights reserved.
          </p>
          
          <div className="flex items-center space-x-6">
            <span className="text-gray-400 text-sm">Ngôn ngữ:</span>
            <div className="flex space-x-2">
              <button className="px-3 py-1.5 rounded-lg text-sm bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-300 border border-pink-500/30 hover:from-pink-500/30 hover:to-purple-500/30 hover:text-pink-200 transition-all">
                Tiếng Việt
              </button>
              <button className="px-3 py-1.5 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-all">
                English
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}