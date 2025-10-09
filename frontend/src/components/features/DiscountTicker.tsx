'use client'

import { useEffect, useState } from 'react'
import { discountService } from '@/services/main/discount.service'
import { DiscountDisplayItem } from '@/types/main/discount'

export function DiscountTicker() {
  const [discounts, setDiscounts] = useState<DiscountDisplayItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDiscounts = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await discountService.getPublicDiscountCodes(undefined, 10)
      
      if (response.success && response.data) {
        const transformedData = discountService.transformToDisplayFormat(response.data)
        setDiscounts(transformedData)
      } else {
        setError(response.message || 'Không thể tải mã giảm giá')
      }
    } catch (err) {
      setError('Lỗi kết nối mạng')
      console.error('Error fetching discounts:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDiscounts()
  }, [])

  const getDiscountColor = (type: string) => {
    switch (type) {
      case 'special':
        return 'from-red-500 to-pink-500'
      case 'fixed':
        return 'from-green-500 to-emerald-500'
      case 'percentage':
        return 'from-purple-500 to-indigo-500'
      case 'freenight':
        return 'from-orange-500 to-red-500'
      default:
        return 'from-blue-500 to-purple-500'
    }
  }

  const getIconForType = (type: string) => {
    switch (type) {
      case 'special':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        )
      case 'fixed':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        )
      case 'percentage':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 0v6m0-6l-6 6m-2 5a9 9 0 110-18 9 9 0 010 18z" />
          </svg>
        )
      case 'freenight':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        )
    }
  }

  const parseDescription = (description: string) => {
    // Tách description thành phần chính và phần áp dụng
    const parts = description.split(' • ')
    const mainDescription = parts[0] || ''
    const applicableInfo = parts.slice(1).join(' • ')
    
    return { mainDescription, applicableInfo }
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 text-white py-2 h-12 flex items-center overflow-hidden">
        <div className="flex items-center justify-center w-full">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          <span className="text-sm">Đang tải mã giảm giá...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gradient-to-r from-gray-400 to-gray-500 text-white py-2 h-12 flex items-center overflow-hidden">
        <div className="flex items-center justify-center w-full">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.99-.833-2.662 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span className="text-sm mr-2">{error}</span>
          <button 
            onClick={fetchDiscounts}
            className="px-2 py-1 bg-white/20 rounded text-xs hover:bg-white/30 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    )
  }

  if (discounts.length === 0) {
    return (
      <div className="bg-gradient-to-r from-gray-400 to-gray-500 text-white py-2 h-12 flex items-center overflow-hidden">
        <div className="text-center w-full">
          <span className="text-sm">Hiện tại không có mã giảm giá nào</span>
        </div>
      </div>
    )
  }

  // Create duplicated array for seamless loop
  const displayDiscounts = [...discounts, ...discounts, ...discounts] // Triple for smoother loop

  return (
    <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-gray-100 overflow-hidden h-16 md:h-20 w-full">
      {/* Moving Content */}
      <div className="relative h-full w-full">
        <div className="animate-marquee flex items-center space-x-4 md:space-x-6 h-full will-change-transform">
          {displayDiscounts.map((discount, index) => {
            const { mainDescription, applicableInfo } = parseDescription(discount.description)
            
            return (
              <div
                key={`${discount.id}-${index}`}
                className="flex items-center space-x-2 md:space-x-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 md:px-4 py-2 md:py-3 border border-gray-200/50 shadow-sm hover:shadow-md transition-shadow min-w-max h-12 md:h-14 flex-shrink-0"
              >
                {/* Icon */}
                <div className={`p-1.5 md:p-2 rounded-lg bg-gradient-to-r ${getDiscountColor(discount.type)} text-white shadow-sm flex items-center justify-center flex-shrink-0`}>
                  {getIconForType(discount.type)}
                </div>
                
                {/* Main Content */}
                <div className="flex items-center space-x-2 md:space-x-3 min-w-0">
                  {/* Code */}
                  <div className="flex items-center flex-shrink-0">
                    <span className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-white px-2 md:px-3 py-1 rounded-full text-xs md:text-sm whitespace-nowrap">
                      {discount.code}
                    </span>
                  </div>
                  
                  {/* Discount Value - Separated */}
                  <div className="flex items-center flex-shrink-0">
                    <span className="font-bold text-green-600 text-sm md:text-lg whitespace-nowrap">
                      -{discount.discount}
                    </span>
                  </div>
                  
                  {/* Description - Mobile: Only main, Desktop: Both */}
                  <div className="text-xs md:text-sm min-w-0 max-w-xs md:max-w-md">
                    <div className="font-medium text-gray-800 truncate">
                      {mainDescription}
                    </div>
                    
                    {/* Applicable info - Only show on desktop */}
                    {applicableInfo && (
                      <div className="hidden md:block text-gray-500 text-xs truncate mt-0.5">
                        {applicableInfo}
                      </div>
                    )}
                    
                    {/* Valid until */}
                    {discount.validUntil && (
                      <div className="text-gray-500 text-xs flex items-center mt-0.5">
                        <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="hidden sm:inline">HSD: </span>
                        <span className="whitespace-nowrap">{discount.validUntil}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Special Badge for Featured */}
                {discount.type === 'special' && (
                  <div className="bg-red-500 text-white text-xs font-bold px-1.5 md:px-2 py-0.5 md:py-1 rounded-full flex-shrink-0">
                    HOT
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* CSS Animation styles */}
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-100%);
          }
        }

        .animate-marquee {
          animation: marquee 20s linear infinite;
          width: fit-content;
          white-space: nowrap;
        }

        .animate-marquee:hover {
          animation-play-state: paused;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .animate-marquee {
            animation-duration: 20s;
          }
        }
        
        @media (max-width: 480px) {
          .animate-marquee {
            animation-duration: 15s;
          }
        }
      `}</style>
    </div>
  )
}