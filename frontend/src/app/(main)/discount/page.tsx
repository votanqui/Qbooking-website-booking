'use client'

import { useState, useEffect } from 'react'
import { Search, Copy, Check, Tag, Clock, MapPin, Home, Sparkles } from 'lucide-react'
import { discountService } from '@/services/main/discount.service'
import { PublicCouponResponse } from '@/types/main/discount'
import { useToast } from '@/components/ui/Toast'

export default function DiscountPage() {
  const [featuredCoupons, setFeaturedCoupons] = useState<PublicCouponResponse[]>([])
  const [allCoupons, setAllCoupons] = useState<PublicCouponResponse[]>([])
  const [searchKeyword, setSearchKeyword] = useState('')
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const { showToast } = useToast()

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      const [featuredRes, allRes] = await Promise.all([
        discountService.getFeaturedDiscountCodes(10),
        discountService.getPublicDiscountCodes('', 20)
      ])

      if (featuredRes.success && featuredRes.data) {
        setFeaturedCoupons(featuredRes.data)
      } else {
        showToast(featuredRes.message || 'Không thể tải mã nổi bật', 'error')
      }

      if (allRes.success && allRes.data) {
        setAllCoupons(allRes.data)
      } else {
        showToast(allRes.message || 'Không thể tải mã giảm giá', 'error')
      }
    } catch (error) {
      showToast('Đã xảy ra lỗi khi tải dữ liệu', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      loadInitialData()
      return
    }

    setLoading(true)
    try {
      const res = await discountService.getPublicDiscountCodes(searchKeyword, 20)
      if (res.success && res.data) {
        setAllCoupons(res.data)
        if (res.data.length === 0) {
          showToast('Không tìm thấy mã giảm giá phù hợp', 'info')
        }
      } else {
        showToast(res.message || 'Không thể tìm kiếm', 'error')
      }
    } catch (error) {
      showToast('Đã xảy ra lỗi khi tìm kiếm', 'error')
    } finally {
      setLoading(false)
    }
  }

  const copyCode = (code: string, id: number) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    showToast('Đã sao chép mã giảm giá!', 'success')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const formatDiscount = (coupon: PublicCouponResponse): string => {
    if (coupon.discountType === 'percentage') {
      return `${coupon.discountValue}%`
    } else if (coupon.discountType === 'fixedAmount') {
      return `${(coupon.discountValue / 1000).toFixed(0)}K`
    } else if (coupon.discountType === 'freeNight') {
      return `${coupon.discountValue} đêm`
    }
    return String(coupon.discountValue)
  }

  const getApplicableInfo = (coupon: PublicCouponResponse) => {
  const locations = coupon.applications
    ?.filter(app => app.applicableType === 'location')
    .map(app => app.applicableName)
    .filter((name): name is string => name !== undefined && name !== null && name !== '') || []
  
  const properties = coupon.applications
    ?.filter(app => app.applicableType === 'property')
    .map(app => app.applicableName)
    .filter((name): name is string => name !== undefined && name !== null && name !== '') || []
  
  const types = coupon.applications
    ?.filter(app => app.applicableType === 'propertyType')
    .map(app => app.applicableName)
    .filter((name): name is string => name !== undefined && name !== null && name !== '') || []
  
  return { locations, properties, types }
}

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-pink-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4 backdrop-blur-sm">
              <Tag className="w-8 h-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Mã Giảm Giá</h1>
            <p className="text-lg md:text-xl text-pink-100 max-w-2xl mx-auto">
              Khám phá hàng trăm mã giảm giá hấp dẫn cho chuyến du lịch của bạn
            </p>
          </div>

          {/* Search Bar */}
          <div className="mt-8 max-w-2xl mx-auto">
            <div className="relative">
             <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Tìm kiếm mã giảm giá..."
                className="w-full px-6 py-4 rounded-full text-gray-800 text-lg font-semibold placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-pink-300 shadow-xl"
              />
              <button
                onClick={handleSearch}
                disabled={loading}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-pink-500 to-purple-500 text-white p-3 rounded-full hover:shadow-lg transition-all disabled:opacity-50"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Featured Coupons */}
        {!loading && featuredCoupons.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-6 h-6 text-purple-600" />
              <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                Mã Nổi Bật
              </h2>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCoupons.map((coupon) => {
                const { locations, properties, types } = getApplicableInfo(coupon)
                return (
                  <CouponCard
                    key={coupon.id}
                    coupon={coupon}
                    formatDiscount={formatDiscount}
                    copyCode={copyCode}
                    copiedId={copiedId}
                    locations={locations}
                    properties={properties}
                    types={types}
                    featured
                  />
                )
              })}
            </div>
          </section>
        )}

        {/* All Coupons */}
        <section>
          <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            Tất Cả Mã Giảm Giá
          </h2>
          
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-12 h-12 border-4 border-pink-300 border-t-purple-600 rounded-full animate-spin"></div>
            </div>
          ) : allCoupons.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allCoupons.map((coupon) => {
                const { locations, properties, types } = getApplicableInfo(coupon)
                return (
                  <CouponCard
                    key={coupon.id}
                    coupon={coupon}
                    formatDiscount={formatDiscount}
                    copyCode={copyCode}
                    copiedId={copiedId}
                    locations={locations}
                    properties={properties}
                    types={types}
                  />
                )
              })}
            </div>
          ) : (
            <div className="text-center py-20">
              <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Không tìm thấy mã giảm giá</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

interface CouponCardProps {
  coupon: PublicCouponResponse
  formatDiscount: (coupon: PublicCouponResponse) => string
  copyCode: (code: string, id: number) => void
  copiedId: number | null
  locations: string[]
  properties: string[]
  types: string[]
  featured?: boolean
}

function CouponCard({ 
  coupon, 
  formatDiscount, 
  copyCode, 
  copiedId, 
  locations, 
  properties, 
  types, 
  featured 
}: CouponCardProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden ${
      featured ? 'ring-2 ring-purple-400' : ''
    }`}>
      {featured && (
        <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white text-center py-2 text-sm font-semibold">
          ⭐ NỔI BẬT
        </div>
      )}
      
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="font-bold text-xl text-gray-800 mb-2">{coupon.name}</h3>
            <p className="text-gray-600 text-sm line-clamp-2">{coupon.description}</p>
          </div>
          <div className="ml-4 text-right">
            <div className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              {formatDiscount(coupon)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {coupon.discountType === 'percentage' ? 'Giảm giá' :
               coupon.discountType === 'fixedAmount' ? 'Giảm tiền' : 'Tặng đêm'}
            </div>
          </div>
        </div>

        {/* Applicable Info */}
        <div className="space-y-2 mb-4 text-sm">
          {coupon.applicableTo === 'all' ? (
            <div className="flex items-center gap-2 text-purple-600 font-semibold">
              <Sparkles className="w-4 h-4" />
              <span>Áp dụng cho tất cả</span>
            </div>
          ) : (
            <>
              {locations.length > 0 && (
                <div className="flex items-start gap-2 text-gray-600">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-purple-500" />
                  <span className="line-clamp-1">{locations.join(', ')}</span>
                </div>
              )}
              {properties.length > 0 && (
                <div className="flex items-start gap-2 text-gray-600">
                  <Home className="w-4 h-4 mt-0.5 flex-shrink-0 text-pink-500" />
                  <span className="line-clamp-1">{properties.join(', ')}</span>
                </div>
              )}
              {types.length > 0 && (
                <div className="flex items-start gap-2 text-gray-600">
                  <Tag className="w-4 h-4 mt-0.5 flex-shrink-0 text-purple-500" />
                  <span className="line-clamp-1">Loại: {types.join(', ')}</span>
                </div>
              )}
            </>
          )}
          {coupon.minOrderAmount > 0 && (
            <div className="text-gray-600">
              Đơn tối thiểu: <span className="font-semibold">{(coupon.minOrderAmount / 1000).toFixed(0)}K</span>
            </div>
          )}
          {coupon.minNights > 0 && (
            <div className="text-gray-600">
              Tối thiểu: <span className="font-semibold">{coupon.minNights} đêm</span>
            </div>
          )}
          {coupon.maxDiscountAmount && coupon.maxDiscountAmount > 0 && (
            <div className="text-gray-600">
              Giảm tối đa: <span className="font-semibold">{(coupon.maxDiscountAmount / 1000).toFixed(0)}K</span>
            </div>
          )}
        </div>

        {/* Expiry Date */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Clock className="w-4 h-4" />
          <span>HSD: {new Date(coupon.endDate).toLocaleDateString('vi-VN')}</span>
        </div>

        {/* Copy Button */}
        <button
          onClick={() => copyCode(coupon.code, coupon.id)}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 group"
        >
          {copiedId === coupon.id ? (
            <>
              <Check className="w-5 h-5" />
              Đã sao chép!
            </>
          ) : (
            <>
              <Copy className="w-5 h-5 group-hover:scale-110 transition-transform" />
              {coupon.code}
            </>
          )}
        </button>
      </div>
    </div>
  )
}