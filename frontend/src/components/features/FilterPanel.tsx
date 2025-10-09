'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { DatePickerModal } from '@/components/ui/DatePickerModal'
import { 
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  StarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  PlusIcon,
  MinusIcon
} from '@heroicons/react/24/outline'
import { PropertyFilters, ProductType, AmenityCategoryResponse } from '@/types/main/property'
import { Province } from '@/types/main/address'
import { propertyService } from '@/services/main/property.service'
import { addressService } from '@/services/main/address.service'
import { searchHistoryService } from '@/services/main/searchhistory.service'
import { CreateSearchHistoryRequest } from '@/types/main/searchhistory'

interface FilterPanelProps {
  onFilterChange: (filters: PropertyFilters) => void
  isOpen: boolean
  onClose: () => void
  initialFilters?: PropertyFilters
}

export function FilterPanel({ onFilterChange, isOpen, onClose, initialFilters }: FilterPanelProps) {
  const [filters, setFilters] = useState<PropertyFilters>({
    priceRange: { min: 0, max: 5000 },
    propertyType: [],
    amenities: [],
    amenityIds: [],
    rating: 0,
    isInstantBook: false,
    sortBy: 'popular',
    provinceId: undefined,
    productTypeId: undefined,
    name: undefined,
    checkIn: undefined,
    checkOut: undefined,
    adults: 1,
    children: 0,
    ...initialFilters
  })

  const [productTypes, setProductTypes] = useState<ProductType[]>([])
  const [provinces, setProvinces] = useState<Province[]>([])
  const [amenityCategories, setAmenityCategories] = useState<AmenityCategoryResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [isProvinceDropdownOpen, setIsProvinceDropdownOpen] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Record<number, boolean>>({})
  
  // 🆕 Date picker states
  const [isCheckInPickerOpen, setIsCheckInPickerOpen] = useState(false)
  const [isCheckOutPickerOpen, setIsCheckOutPickerOpen] = useState(false)

  // Load filter options when panel opens
  useEffect(() => {
    const loadFilterOptions = async () => {
      if (!isOpen) return
      
      setLoading(true)
      try {
        const [productTypesData, provincesResponse, amenityCategoriesData] = await Promise.all([
          propertyService.getProductTypes(),
          addressService.getProvinces(),
          propertyService.getAmenityCategories()
        ])

        setProductTypes(productTypesData)
        setAmenityCategories(amenityCategoriesData)
        
        // Handle provinces response from AddressService
        if (provincesResponse.success && provincesResponse.data) {
          setProvinces(provincesResponse.data)
        } else {
          setProvinces([])
        }

        // Auto-expand popular amenity categories
        const defaultExpanded: Record<number, boolean> = {}
        amenityCategoriesData.forEach(category => {
          const hasPopularAmenities = category.amenities.some(amenity => amenity.isPopular)
          defaultExpanded[category.id] = hasPopularAmenities
        })
        setExpandedCategories(defaultExpanded)

      } catch (error) {
        console.error('Error loading filter options:', error)
      } finally {
        setLoading(false)
      }
    }

    loadFilterOptions()
  }, [isOpen])
 const saveSearchHistory = async () => {
  try {
    const searchHistoryData: CreateSearchHistoryRequest = {
      // ⭐ THÊM searchKeyword từ filters.name
      ...(filters.name && filters.name.trim() && { searchKeyword: filters.name.trim() }),
      ...(filters.provinceId && { provinceId: filters.provinceId }),
      ...(filters.productTypeId && { 
        propertyType: productTypes.find(t => t.id === filters.productTypeId)?.name 
      }),
      ...(filters.checkIn && { checkIn: filters.checkIn }),
      ...(filters.checkOut && { checkOut: filters.checkOut }),
      ...(filters.adults && { adults: filters.adults }),
      ...(filters.children && { children: filters.children }),
      ...(filters.priceRange?.min !== undefined && filters.priceRange.min > 0 && { 
        priceMin: filters.priceRange.min 
      }),
      ...(filters.priceRange?.max !== undefined && filters.priceRange.max < 5000 && { 
        priceMax: filters.priceRange.max 
      }),
      ...(filters.rating && filters.rating > 0 && { starRating: filters.rating }),
    }

    if (Object.keys(searchHistoryData).length === 0) {
      console.log('No filters selected, skip saving search history')
      return
    }

    console.log('Saving search history with data:', searchHistoryData)

    const response = await searchHistoryService.createSearchHistory(searchHistoryData)
    
    console.log('API Response:', response)
    
    if (response.success) {
      console.log('Search history saved successfully:', response.data)
    } else {
      console.error('Failed to save search history:', response.message || response.error)
    }
  } catch (error: any) {
    console.error('Error saving search history:', error)
    console.error('Error details:', error.message, error.response)
  }
}
  // Property type icons mapping
  const getPropertyTypeIcon = (typeName: string): string => {
    const name = typeName.toLowerCase()
    if (name.includes('căn hộ') || name.includes('apartment')) return '🏢'
    if (name.includes('biệt thự') || name.includes('villa')) return '🏡'
    if (name.includes('nhà') || name.includes('house')) return '🏠'
    if (name.includes('khách sạn') || name.includes('hotel')) return '🏨'
    if (name.includes('resort')) return '🏖️'
    if (name.includes('homestay')) return '🏘️'
    if (name.includes('condotel')) return '🏙️'
    if (name.includes('phòng') || name.includes('room')) return '🚪'
    return '🏠'
  }

  // Get amenity icon
  const getAmenityIcon = (amenity: any): string => {
    if (amenity.icon) {
      const iconMap: Record<string, string> = {
        'snowflake': '❄️', 'archive': '📦', 'tv': '📺', 'zap': '⚡', 'shirt': '👔',
        'lock': '🔒', 'chef-hat': '👨‍🍳', 'microwave': '🔥', 'coffee': '☕', 'thermometer': '🌡️',
        'utensils': '🍴', 'droplets': '💧', 'towel': '🏖️', 'bottle': '🧴', 'bathtub': '🛁',
        'tissue': '🧻', 'wifi': '📶', 'play': '▶️', 'speaker': '🔊', 'gamepad': '🎮',
        'laptop': '💻', 'balcony': '🏢', 'waves': '🌊', 'tree': '🌳', 'flame': '🔥',
        'chair': '🪑', 'washing-machine': '🧺', 'broom': '🧹', 'clock': '🕐', 'dumbbell': '🏋️'
      }
      return iconMap[amenity.icon] || '✨'
    }
    return '✨'
  }

  // Sort options
  const sortOptions = [
    { value: 'popular', label: 'Phổ biến nhất' },
    { value: 'price_low', label: 'Giá: Thấp đến cao' },
    { value: 'price_high', label: 'Giá: Cao đến thấp' },
    { value: 'rating', label: 'Đánh giá cao nhất' },
    { value: 'newest', label: 'Mới nhất' }
  ]

  // Date formatting helpers
  const formatDate = (dateString?: string): string => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getTodayString = (): string => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  const getTomorrowString = (): string => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }

  // Booking parameter handlers
  const handleCheckInSelect = (date: string) => {
    setFilters(prev => {
      const newFilters = { ...prev, checkIn: date }
      
      // Auto-adjust check-out if it's before or same as check-in
      if (prev.checkOut && prev.checkOut <= date) {
        const checkInDate = new Date(date)
        checkInDate.setDate(checkInDate.getDate() + 1)
        newFilters.checkOut = checkInDate.toISOString().split('T')[0]
      }
      
      return newFilters
    })
  }

  const handleCheckOutSelect = (date: string) => {
    setFilters(prev => ({ ...prev, checkOut: date }))
  }

  const handleGuestCountChange = (type: 'adults' | 'children', increment: boolean) => {
    setFilters(prev => {
      const currentValue = prev[type] || (type === 'adults' ? 1 : 0)
      let newValue = increment ? currentValue + 1 : currentValue - 1
      
      if (type === 'adults') {
        newValue = Math.max(1, Math.min(10, newValue))
      } else {
        newValue = Math.max(0, Math.min(8, newValue))
      }
      
      return { ...prev, [type]: newValue }
    })
  }

  // Other filter handlers
  const handlePropertyTypeChange = (typeId: number) => {
    setFilters(prev => ({
      ...prev,
      productTypeId: prev.productTypeId === typeId ? undefined : typeId
    }))
  }

  const handleAmenityChange = (amenityId: number, amenityName: string) => {
    setFilters(prev => {
      const currentAmenityIds = prev.amenityIds || []
      const currentAmenities = prev.amenities || []
      
      const isSelected = currentAmenityIds.includes(amenityId)
      
      if (isSelected) {
        return {
          ...prev,
          amenityIds: currentAmenityIds.filter(id => id !== amenityId),
          amenities: currentAmenities.filter(name => name !== amenityName)
        }
      } else {
        return {
          ...prev,
          amenityIds: [...currentAmenityIds, amenityId],
          amenities: [...currentAmenities, amenityName]
        }
      }
    })
  }

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }))
  }

  const handlePriceChange = (field: 'min' | 'max', value: number) => {
    setFilters(prev => ({
      ...prev,
      priceRange: { 
        min: prev.priceRange?.min || 0,
        max: prev.priceRange?.max || 5000,
        [field]: value 
      }
    }))
  }

  const handleProvinceChange = (provinceId: number) => {
    setFilters(prev => ({
      ...prev,
      provinceId: provinceId || undefined
    }))
    setIsProvinceDropdownOpen(false)
  }

  const handleRatingChange = (rating: number) => {
    setFilters(prev => ({ ...prev, rating }))
  }

  // Apply filters and close panel
 const applyFilters = async () => {
      await saveSearchHistory()
    onFilterChange(filters)
    onClose()
  }

  // Clear all filters
  const clearFilters = () => {
    const clearedFilters: PropertyFilters = {
      priceRange: { min: 0, max: 5000 },
      propertyType: [],
      amenities: [],
      amenityIds: [],
      rating: 0,
      isInstantBook: false,
      sortBy: 'popular',
      provinceId: undefined,
      productTypeId: undefined,
      name: undefined,
      checkIn: undefined,
      checkOut: undefined,
      adults: 1,
      children: 0
    }
    
    setFilters(clearedFilters)
    onFilterChange(clearedFilters)
  }

  const getSelectedProvinceName = () => {
    if (!filters.provinceId) return 'Tất cả tỉnh thành'
    const province = provinces.find(p => p.id === filters.provinceId)
    return province?.name || 'Tất cả tỉnh thành'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-pink-900/30 backdrop-blur-sm" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-gradient-to-b from-pink-50/95 via-purple-50/95 to-indigo-50/95 shadow-2xl overflow-y-auto backdrop-blur-md">
        <div className="p-4 sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-pink-200/50">
            <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent flex items-center">
              <AdjustmentsHorizontalIcon className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-pink-500" />
              Bộ lọc
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-pink-100/50 rounded-full transition-colors text-pink-500 hover:text-pink-600"
              aria-label="Đóng bộ lọc"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {loading && (
            <div className="flex justify-center py-4 mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500" />
            </div>
          )}

          {/* Booking Parameters Section */}
          <Card className="p-4 mb-4 bg-white/60 backdrop-blur-sm border border-pink-200/50 rounded-xl shadow-sm">
            <h3 className="font-semibold text-pink-700 mb-3 flex items-center text-sm sm:text-base">
              <span className="w-2 h-2 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full mr-2"></span>
              Thông tin đặt phòng
            </h3>
            
            {/* Check-in / Check-out Dates */}
            <div className="space-y-3 mb-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-pink-600 mb-1 font-medium">
                    Ngày nhận phòng
                  </label>
                  <button
                    onClick={() => setIsCheckInPickerOpen(true)}
                    className="w-full px-3 py-2 border border-pink-300/50 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent bg-white/80 text-pink-700 flex items-center justify-between text-sm hover:bg-pink-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <CalendarDaysIcon className="w-4 h-4" />
                      <span className="truncate">
                        {filters.checkIn ? formatDate(filters.checkIn) : 'Chọn ngày'}
                      </span>
                    </div>
                  </button>
                </div>
                
                <div>
                  <label className="block text-xs text-pink-600 mb-1 font-medium">
                    Ngày trả phòng
                  </label>
                  <button
                    onClick={() => setIsCheckOutPickerOpen(true)}
                    className="w-full px-3 py-2 border border-pink-300/50 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent bg-white/80 text-pink-700 flex items-center justify-between text-sm hover:bg-pink-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <CalendarDaysIcon className="w-4 h-4" />
                      <span className="truncate">
                        {filters.checkOut ? formatDate(filters.checkOut) : 'Chọn ngày'}
                      </span>
                    </div>
                  </button>
                </div>
              </div>
              
              {(filters.checkIn || filters.checkOut) && (
                <button
                  onClick={() => setFilters(prev => ({ ...prev, checkIn: undefined, checkOut: undefined }))}
                  className="text-xs text-pink-500 hover:text-pink-700 underline"
                >
                  Xóa ngày đã chọn
                </button>
              )}
            </div>
              <Card className="p-4 mb-4 bg-white/60 backdrop-blur-sm border border-pink-200/50 rounded-xl shadow-sm">
  <h3 className="font-semibold text-pink-700 mb-3 flex items-center text-sm sm:text-base">
    <span className="w-2 h-2 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full mr-2"></span>
    Tìm kiếm theo tên
  </h3>
  <input
    type="text"
    value={filters.name || ''}
    onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))}
    placeholder="Nhập tên chỗ ở..."
    className="w-full px-4 py-2 border border-pink-300/50 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent bg-white/80 text-pink-700 text-sm placeholder:text-pink-400"
  />
  {filters.name && (
    <button
      onClick={() => setFilters(prev => ({ ...prev, name: undefined }))}
      className="text-xs text-pink-500 hover:text-pink-700 underline mt-2"
    >
      Xóa tên tìm kiếm
    </button>
  )}
</Card>
            {/* Guest Count */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserGroupIcon className="w-4 h-4 text-pink-600" />
                  <span className="text-sm font-medium text-pink-700">Người lớn</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleGuestCountChange('adults', false)}
                    className="w-8 h-8 flex items-center justify-center rounded-full border border-pink-300 hover:bg-pink-50/50 transition-colors"
                    disabled={(filters.adults || 1) <= 1}
                  >
                    <MinusIcon className="w-4 h-4 text-pink-600" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold text-pink-700">
                    {filters.adults || 1}
                  </span>
                  <button
                    onClick={() => handleGuestCountChange('adults', true)}
                    className="w-8 h-8 flex items-center justify-center rounded-full border border-pink-300 hover:bg-pink-50/50 transition-colors"
                    disabled={(filters.adults || 1) >= 10}
                  >
                    <PlusIcon className="w-4 h-4 text-pink-600" />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserGroupIcon className="w-4 h-4 text-pink-600" />
                  <span className="text-sm font-medium text-pink-700">Trẻ em</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleGuestCountChange('children', false)}
                    className="w-8 h-8 flex items-center justify-center rounded-full border border-pink-300 hover:bg-pink-50/50 transition-colors"
                    disabled={(filters.children || 0) <= 0}
                  >
                    <MinusIcon className="w-4 h-4 text-pink-600" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold text-pink-700">
                    {filters.children || 0}
                  </span>
                  <button
                    onClick={() => handleGuestCountChange('children', true)}
                    className="w-8 h-8 flex items-center justify-center rounded-full border border-pink-300 hover:bg-pink-50/50 transition-colors"
                    disabled={(filters.children || 0) >= 8}
                  >
                    <PlusIcon className="w-4 h-4 text-pink-600" />
                  </button>
                </div>
              </div>
              
              <div className="text-center text-xs text-pink-600 bg-pink-100/50 py-2 rounded-lg">
                Tổng cộng: {(filters.adults || 1) + (filters.children || 0)} khách
              </div>
            </div>
          </Card>

          {/* Sort By */}
          <Card className="p-4 mb-4 bg-white/60 backdrop-blur-sm border border-pink-200/50 rounded-xl shadow-sm">
            <h3 className="font-semibold text-pink-700 mb-3 flex items-center text-sm sm:text-base">
              <span className="w-2 h-2 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full mr-2"></span>
              Sắp xếp theo
            </h3>
            <div className="space-y-2">
              {sortOptions.map(option => (
                <label key={option.value} className="flex items-center cursor-pointer p-2 rounded-lg hover:bg-pink-50/50 transition-colors">
                  <input
                    type="radio"
                    name="sortBy"
                    value={option.value}
                    checked={filters.sortBy === option.value}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      sortBy: e.target.value as PropertyFilters['sortBy']
                    }))}
                    className="mr-3 text-pink-500 focus:ring-pink-400"
                  />
                  <span className="text-pink-800 font-medium text-sm sm:text-base">{option.label}</span>
                </label>
              ))}
            </div>
          </Card>

          {/* Province Filter */}
          <div className="relative mb-4">
            <Card className="p-4 bg-white/60 backdrop-blur-sm border border-pink-200/50 rounded-xl shadow-sm">
              <h3 className="font-semibold text-pink-700 mb-3 flex items-center text-sm sm:text-base">
                <span className="w-2 h-2 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full mr-2"></span>
                Tỉnh/Thành phố
              </h3>
              
              <div className="relative">
                <button
                  onClick={() => setIsProvinceDropdownOpen(!isProvinceDropdownOpen)}
                  className="w-full px-3 py-2 border border-pink-300/50 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent bg-white/80 text-pink-700 flex items-center justify-between text-sm"
                  disabled={loading}
                >
                  <span className="truncate">{getSelectedProvinceName()}</span>
                  <ChevronDownIcon className={`w-5 h-5 transition-transform ${isProvinceDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {provinces.length === 0 && !loading && (
                <p className="text-sm text-pink-500 mt-2">Không thể tải danh sách tỉnh thành</p>
              )}
            </Card>

            {/* Dropdown menu */}
            {isProvinceDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsProvinceDropdownOpen(false)}
                />
                
                <div className="absolute top-full left-4 right-4 mt-2 bg-white/95 backdrop-blur-md border border-pink-200/50 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                  <button
                    onClick={() => handleProvinceChange(0)}
                    className={`w-full px-4 py-3 text-left hover:bg-pink-50/50 border-b border-pink-100 text-sm ${
                      !filters.provinceId ? 'bg-pink-100/50 text-pink-800 font-semibold' : 'text-pink-700'
                    }`}
                  >
                    Tất cả tỉnh thành
                  </button>
                  {provinces.map(province => (
                    <button
                      key={province.id}
                      onClick={() => handleProvinceChange(province.id)}
                      className={`w-full px-4 py-3 text-left hover:bg-pink-50/50 border-b border-pink-100 last:border-b-0 text-sm ${
                        filters.provinceId === province.id ? 'bg-pink-100/50 text-pink-800 font-semibold' : 'text-pink-700'
                      }`}
                    >
                      {province.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Property Type */}
          <Card className="p-4 mb-4 bg-white/60 backdrop-blur-sm border border-pink-200/50 rounded-xl shadow-sm">
            <h3 className="font-semibold text-pink-700 mb-3 flex items-center text-sm sm:text-base">
              <span className="w-2 h-2 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full mr-2"></span>
              Loại hình lưu trú
            </h3>
            
            {loading ? (
              <p className="text-sm text-pink-500 text-center py-4">Đang tải loại hình lưu trú...</p>
            ) : productTypes.length === 0 ? (
              <p className="text-sm text-pink-500 text-center py-4">Không có loại hình lưu trú nào</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {productTypes.map(type => (
                  <button
                    key={type.id}
                    onClick={() => handlePropertyTypeChange(type.id)}
                    className={`p-3 sm:p-4 rounded-lg border-2 transition-all duration-200 text-left flex items-center gap-2 ${
                      filters.productTypeId === type.id
                        ? 'border-pink-400 bg-gradient-to-r from-pink-400/20 to-purple-400/20 text-pink-800 shadow-lg'
                        : 'border-pink-200/50 bg-white/50 hover:border-pink-300 hover:bg-pink-50/30 text-pink-700'
                    }`}
                  >
                    <div className="text-lg sm:text-xl">{getPropertyTypeIcon(type.name)}</div>
                    <div className="text-xs sm:text-sm font-medium leading-tight">
                      {type.name}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>

          {/* Price Range */}
          <Card className="p-4 mb-4 bg-white/60 backdrop-blur-sm border border-pink-200/50 rounded-xl shadow-sm">
            <h3 className="font-semibold text-pink-700 mb-3 flex items-center text-sm sm:text-base">
              <span className="w-2 h-2 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full mr-2"></span>
              Khoảng giá (nghìn VND/đêm)
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-pink-600 mb-1 font-medium">Tối thiểu</label>
                  <input
                    type="number"
                    value={filters.priceRange?.min || 0}
                    onChange={(e) => handlePriceChange('min', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-pink-300/50 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent text-pink-700 text-sm bg-white/80"
                    min="0"
                    step="100"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-pink-600 mb-1 font-medium">Tối đa</label>
                  <input
                    type="number"
                    value={filters.priceRange?.max || 5000}
                    onChange={(e) => handlePriceChange('max', parseInt(e.target.value) || 5000)}
                    className="w-full px-3 py-2 border border-pink-300/50 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent text-pink-700 text-sm bg-white/80"
                    min="0"
                    step="100"
                  />
                </div>
              </div>
              <div className="text-center text-xs text-pink-600 bg-pink-100/50 py-2 rounded-lg font-medium">
                {(filters.priceRange?.min || 0).toLocaleString('vi-VN')} - {(filters.priceRange?.max || 5000).toLocaleString('vi-VN')} nghìn VND
              </div>
            </div>
          </Card>

          {/* Rating */}
          <Card className="p-4 mb-4 bg-white/60 backdrop-blur-sm border border-pink-200/50 rounded-xl shadow-sm">
            <h3 className="font-semibold text-pink-700 mb-3 flex items-center text-sm sm:text-base">
              <span className="w-2 h-2 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full mr-2"></span>
              Đánh giá tối thiểu
            </h3>
            <div className="flex gap-1 flex-wrap">
              {[0, 1, 2, 3, 4, 5].map(rating => (
                <button
                  key={rating}
                  onClick={() => handleRatingChange(rating)}
                  className={`flex-1 min-w-[50px] flex items-center justify-center px-2 py-2 rounded-lg border transition-all duration-200 ${
                    filters.rating === rating
                      ? 'border-pink-400 bg-gradient-to-r from-pink-400/20 to-purple-400/20 text-pink-800 shadow-lg'
                      : 'border-pink-200/50 bg-white/50 hover:border-pink-300 hover:bg-pink-50/30 text-pink-700'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <StarIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="text-xs font-medium">{rating === 0 ? 'Tất cả' : `${rating}+`}</span>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Amenities */}
          <Card className="p-4 mb-4 bg-white/60 backdrop-blur-sm border border-pink-200/50 rounded-xl shadow-sm">
            <h3 className="font-semibold text-pink-700 mb-3 flex items-center text-sm sm:text-base">
              <span className="w-2 h-2 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full mr-2"></span>
              Tiện ích ({(filters.amenityIds || []).length} đã chọn)
            </h3>
            
            {loading ? (
              <p className="text-sm text-pink-500 text-center py-4">Đang tải tiện ích...</p>
            ) : amenityCategories.length === 0 ? (
              <p className="text-sm text-pink-500 text-center py-4">Không có tiện ích nào</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {amenityCategories.map(category => (
                  <div key={category.id} className="border border-pink-100/50 rounded-lg bg-white/30">
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-pink-50/30 transition-colors rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{getAmenityIcon(category)}</span>
                        <span className="text-sm font-medium text-pink-700">{category.name}</span>
                        <span className="text-xs text-pink-500">({category.amenities.length})</span>
                      </div>
                      {expandedCategories[category.id] ? (
                        <ChevronUpIcon className="w-4 h-4 text-pink-500" />
                      ) : (
                        <ChevronDownIcon className="w-4 h-4 text-pink-500" />
                      )}
                    </button>
                    
                    {expandedCategories[category.id] && (
                      <div className="px-3 pb-2 space-y-1">
                        {category.amenities.map(amenity => (
                          <label key={amenity.id} className="flex items-center cursor-pointer p-2 rounded hover:bg-pink-50/20 transition-colors">
                            <input
                              type="checkbox"
                              checked={(filters.amenityIds || []).includes(amenity.id)}
                              onChange={() => handleAmenityChange(amenity.id, amenity.name)}
                              className="mr-2 rounded text-pink-500 focus:ring-pink-400 border-pink-300"
                            />
                            <span className="text-xs mr-2">{getAmenityIcon(amenity)}</span>
                            <span className="text-xs text-pink-700 font-medium flex-1">{amenity.name}</span>
                            {amenity.isPopular && (
                              <span className="text-xs bg-pink-100/50 text-pink-600 px-1 py-0.5 rounded">Phổ biến</span>
                            )}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Instant Book */}
          <Card className="p-4 mb-6 bg-white/60 backdrop-blur-sm border border-pink-200/50 rounded-xl shadow-sm">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={filters.isInstantBook || false}
                onChange={(e) => setFilters(prev => ({ ...prev, isInstantBook: e.target.checked }))}
                className="mr-3 rounded text-pink-500 focus:ring-pink-400 border-pink-300"
              />
              <div>
                <div className="font-medium text-pink-800 text-sm">Đặt ngay lập tức</div>
                <div className="text-xs text-pink-600">Đặt mà không cần chờ chủ nhà phê duyệt</div>
              </div>
            </label>
          </Card>

          {/* Action Buttons */}
          <div className="sticky bottom-0 bg-gradient-to-t from-pink-50/90 to-transparent pt-4 pb-2 space-y-3">
            <Button 
              onClick={applyFilters} 
              className="w-full bg-gradient-to-r from-pink-400 to-purple-500 hover:from-pink-500 hover:to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl py-3 font-bold text-sm"
              disabled={loading}
            >
              {loading ? 'Đang tải...' : 'Áp dụng bộ lọc'}
            </Button>
            <Button 
              onClick={clearFilters} 
              variant="outline" 
              className="w-full border-pink-300 text-pink-600 hover:bg-pink-50/50 hover:text-pink-700 hover:border-pink-400 transition-all duration-300 rounded-xl py-3 font-medium text-sm"
              disabled={loading}
            >
              Xóa tất cả
            </Button>
          </div>
        </div>
      </div>

      {/* Date Picker Modals */}
      <DatePickerModal
        isOpen={isCheckInPickerOpen}
        onClose={() => setIsCheckInPickerOpen(false)}
        selectedDate={filters.checkIn}
        onDateSelect={handleCheckInSelect}
        minDate={getTodayString()}
        title="Chọn ngày nhận phòng"
        type="checkin"
      />

      <DatePickerModal
        isOpen={isCheckOutPickerOpen}
        onClose={() => setIsCheckOutPickerOpen(false)}
        selectedDate={filters.checkOut}
        onDateSelect={handleCheckOutSelect}
        minDate={filters.checkIn || getTomorrowString()}
        title="Chọn ngày trả phòng"
        type="checkout"
      />
    </div>
  )
}