'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { DatePickerModal } from '@/components/ui/DatePickerModal'
import { 
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  PlusIcon,
  MinusIcon
} from '@heroicons/react/24/outline'
import { RoomFilterParams } from '@/types/main/room'
import { Province } from '@/types/main/address'
import { AmenityCategoryResponse } from '@/types/main/property'
import { addressService } from '@/services/main/address.service'
import { propertyService } from '@/services/main/property.service'
import { searchHistoryService } from '@/services/main/searchhistory.service'
import { CreateSearchHistoryRequest } from '@/types/main/searchhistory'

interface RoomFilterPanelProps {
  onFilterChange: (filters: RoomFilterParams) => void
  isOpen: boolean
  onClose: () => void
  initialFilters?: RoomFilterParams
}

export function RoomFilterPanel({ 
  onFilterChange, 
  isOpen, 
  onClose, 
  initialFilters 
}: RoomFilterPanelProps) {
  const [filters, setFilters] = useState<RoomFilterParams>({
    Page: 1,
    PageSize: 12,
    Adults: 1,
    Children: 0,
    ...initialFilters
  })

  const [provinces, setProvinces] = useState<Province[]>([])
  const [amenityCategories, setAmenityCategories] = useState<AmenityCategoryResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [isProvinceDropdownOpen, setIsProvinceDropdownOpen] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Record<number, boolean>>({})
  
  // Date picker states
  const [isCheckInPickerOpen, setIsCheckInPickerOpen] = useState(false)
  const [isCheckOutPickerOpen, setIsCheckOutPickerOpen] = useState(false)

  // Bed types options
  const bedTypes = ['Single', 'Double', 'Queen', 'King', 'Twin', 'Double Double']

  // Load filter options when panel opens
  useEffect(() => {
    const loadFilterOptions = async () => {
      if (!isOpen) return
      
      setLoading(true)
      try {
        const [provincesResponse, amenityCategoriesData] = await Promise.all([
          addressService.getProvinces(),
          propertyService.getAmenityCategories()
        ])

        // Handle provinces
        if (provincesResponse.success && provincesResponse.data) {
          setProvinces(provincesResponse.data)
        }

        // Handle amenities
        setAmenityCategories(amenityCategoriesData)
        
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
    // Chuẩn bị data để lưu vào search history
    const searchHistoryData: CreateSearchHistoryRequest = {
      // Chỉ gửi các field có giá trị, không gửi undefined
      ...(filters.Name && filters.Name.trim() && { searchKeyword: filters.Name.trim() }),
      ...(filters.ProvinceId && { provinceId: filters.ProvinceId }),
      ...(filters.CheckIn && { checkIn: filters.CheckIn }),
      ...(filters.CheckOut && { checkOut: filters.CheckOut }),
      ...(filters.Adults && { adults: filters.Adults }),
      ...(filters.Children && { children: filters.Children }),
      ...(filters.MinPrice !== undefined && filters.MinPrice > 0 && { 
        priceMin: filters.MinPrice 
      }),
      ...(filters.MaxPrice !== undefined && filters.MaxPrice > 0 && { 
        priceMax: filters.MaxPrice 
      }),
    }
    // Chỉ gọi API nếu có ít nhất 1 filter được chọn
    if (Object.keys(searchHistoryData).length === 0) {
      console.log('No filters selected, skip saving search history')
      return
    }

    console.log('Saving search history with data:', searchHistoryData)

    // Gọi API để lưu search history
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
    // Không throw error để không ảnh hưởng đến flow chính
  }
}

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

  // Date handlers
  const handleCheckInSelect = (date: string) => {
    setFilters(prev => {
      const newFilters = { ...prev, CheckIn: date }
      
      // Auto-adjust check-out if it's before or same as check-in
      if (prev.CheckOut && prev.CheckOut <= date) {
        const checkInDate = new Date(date)
        checkInDate.setDate(checkInDate.getDate() + 1)
        newFilters.CheckOut = checkInDate.toISOString().split('T')[0]
      }
      
      return newFilters
    })
  }

  const handleCheckOutSelect = (date: string) => {
    setFilters(prev => ({ ...prev, CheckOut: date }))
  }

  // Guest count handlers
  const handleGuestCountChange = (type: 'Adults' | 'Children', increment: boolean) => {
    setFilters(prev => {
      const currentValue = prev[type] || (type === 'Adults' ? 1 : 0)
      let newValue = increment ? currentValue + 1 : currentValue - 1
      
      if (type === 'Adults') {
        newValue = Math.max(1, Math.min(10, newValue))
      } else {
        newValue = Math.max(0, Math.min(8, newValue))
      }
      
      return { ...prev, [type]: newValue }
    })
  }

  // Province handler
  const handleProvinceChange = (provinceId: number) => {
    setFilters(prev => ({
      ...prev,
      ProvinceId: provinceId || undefined
    }))
    setIsProvinceDropdownOpen(false)
  }

  const getSelectedProvinceName = () => {
    if (!filters.ProvinceId) return 'Tất cả tỉnh thành'
    const province = provinces.find(p => p.id === filters.ProvinceId)
    return province?.name || 'Tất cả tỉnh thành'
  }

  // Amenity handler
  const handleAmenityChange = (amenityId: number) => {
    setFilters(prev => {
      const currentAmenityIds = prev.AmenityIds || []
      const isSelected = currentAmenityIds.includes(amenityId)
      
      if (isSelected) {
        return {
          ...prev,
          AmenityIds: currentAmenityIds.filter(id => id !== amenityId)
        }
      } else {
        return {
          ...prev,
          AmenityIds: [...currentAmenityIds, amenityId]
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

  // Price handlers
  const handlePriceChange = (field: 'MinPrice' | 'MaxPrice', value: number) => {
    setFilters(prev => ({
      ...prev,
      [field]: value || undefined
    }))
  }

  // Apply filters
 const applyFilters = async () => {
    await saveSearchHistory()
    onFilterChange(filters)
    onClose()
  }

  // Clear filters
  const clearFilters = () => {
    const clearedFilters: RoomFilterParams = {
      Page: 1,
      PageSize: 12,
      Adults: 1,
      Children: 0
    }
    
    setFilters(clearedFilters)
    onFilterChange(clearedFilters)
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
              Bộ lọc phòng
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
                        {filters.CheckIn ? formatDate(filters.CheckIn) : 'Chọn ngày'}
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
                        {filters.CheckOut ? formatDate(filters.CheckOut) : 'Chọn ngày'}
                      </span>
                    </div>
                  </button>
                </div>
              </div>
              
              {(filters.CheckIn || filters.CheckOut) && (
                <button
                  onClick={() => setFilters(prev => ({ ...prev, CheckIn: undefined, CheckOut: undefined }))}
                  className="text-xs text-pink-500 hover:text-pink-700 underline"
                >
                  Xóa ngày đã chọn
                </button>
              )}
            </div>

            {/* Guest Count */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserGroupIcon className="w-4 h-4 text-pink-600" />
                  <span className="text-sm font-medium text-pink-700">Người lớn</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleGuestCountChange('Adults', false)}
                    className="w-8 h-8 flex items-center justify-center rounded-full border border-pink-300 hover:bg-pink-50/50 transition-colors"
                    disabled={(filters.Adults || 1) <= 1}
                  >
                    <MinusIcon className="w-4 h-4 text-pink-600" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold text-pink-700">
                    {filters.Adults || 1}
                  </span>
                  <button
                    onClick={() => handleGuestCountChange('Adults', true)}
                    className="w-8 h-8 flex items-center justify-center rounded-full border border-pink-300 hover:bg-pink-50/50 transition-colors"
                    disabled={(filters.Adults || 1) >= 10}
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
                    onClick={() => handleGuestCountChange('Children', false)}
                    className="w-8 h-8 flex items-center justify-center rounded-full border border-pink-300 hover:bg-pink-50/50 transition-colors"
                    disabled={(filters.Children || 0) <= 0}
                  >
                    <MinusIcon className="w-4 h-4 text-pink-600" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold text-pink-700">
                    {filters.Children || 0}
                  </span>
                  <button
                    onClick={() => handleGuestCountChange('Children', true)}
                    className="w-8 h-8 flex items-center justify-center rounded-full border border-pink-300 hover:bg-pink-50/50 transition-colors"
                    disabled={(filters.Children || 0) >= 8}
                  >
                    <PlusIcon className="w-4 h-4 text-pink-600" />
                  </button>
                </div>
              </div>
              
              <div className="text-center text-xs text-pink-600 bg-pink-100/50 py-2 rounded-lg">
                Tổng cộng: {(filters.Adults || 1) + (filters.Children || 0)} khách
              </div>
            </div>
          </Card>

          {/* Search Name */}
          <Card className="p-4 mb-4 bg-white/60 backdrop-blur-sm border border-pink-200/50 rounded-xl shadow-sm">
            <h3 className="font-semibold text-pink-700 mb-3 flex items-center text-sm sm:text-base">
              <span className="w-2 h-2 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full mr-2"></span>
              Tên phòng
            </h3>
            <input
              type="text"
              value={filters.Name || ''}
              onChange={(e) => setFilters({ ...filters, Name: e.target.value })}
              placeholder="Tìm kiếm theo tên phòng..."
              className="w-full px-4 py-2 border border-pink-300/50 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent bg-white/80 text-pink-700 text-sm"
            />
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
                      !filters.ProvinceId ? 'bg-pink-100/50 text-pink-800 font-semibold' : 'text-pink-700'
                    }`}
                  >
                    Tất cả tỉnh thành
                  </button>
                  {provinces.map(province => (
                    <button
                      key={province.id}
                      onClick={() => handleProvinceChange(province.id)}
                      className={`w-full px-4 py-3 text-left hover:bg-pink-50/50 border-b border-pink-100 last:border-b-0 text-sm ${
                        filters.ProvinceId === province.id ? 'bg-pink-100/50 text-pink-800 font-semibold' : 'text-pink-700'
                      }`}
                    >
                      {province.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Bed Type */}
          <Card className="p-4 mb-4 bg-white/60 backdrop-blur-sm border border-pink-200/50 rounded-xl shadow-sm">
            <h3 className="font-semibold text-pink-700 mb-3 flex items-center text-sm sm:text-base">
              <span className="w-2 h-2 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full mr-2"></span>
              Loại giường
            </h3>
            <select
              value={filters.BedType || ''}
              onChange={(e) => setFilters({ ...filters, BedType: e.target.value || undefined })}
              className="w-full px-4 py-2 border border-pink-300/50 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent bg-white/80 text-pink-700 text-sm"
            >
              <option value="">Tất cả</option>
              {bedTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </Card>

          {/* Price Range */}
          <Card className="p-4 mb-4 bg-white/60 backdrop-blur-sm border border-pink-200/50 rounded-xl shadow-sm">
            <h3 className="font-semibold text-pink-700 mb-3 flex items-center text-sm sm:text-base">
              <span className="w-2 h-2 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full mr-2"></span>
              Khoảng giá (VND/đêm)
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-pink-600 mb-1 font-medium">Tối thiểu</label>
                  <input
                    type="number"
                    value={filters.MinPrice || ''}
                    onChange={(e) => handlePriceChange('MinPrice', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-pink-300/50 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent text-pink-700 text-sm bg-white/80"
                    min="0"
                    step="100000"
                    placeholder="0"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-pink-600 mb-1 font-medium">Tối đa</label>
                  <input
                    type="number"
                    value={filters.MaxPrice || ''}
                    onChange={(e) => handlePriceChange('MaxPrice', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-pink-300/50 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent text-pink-700 text-sm bg-white/80"
                    min="0"
                    step="100000"
                    placeholder="10,000,000"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Amenities */}
          <Card className="p-4 mb-6 bg-white/60 backdrop-blur-sm border border-pink-200/50 rounded-xl shadow-sm">
            <h3 className="font-semibold text-pink-700 mb-3 flex items-center text-sm sm:text-base">
              <span className="w-2 h-2 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full mr-2"></span>
              Tiện nghi ({(filters.AmenityIds || []).length} đã chọn)
            </h3>
            
            {loading ? (
              <p className="text-sm text-pink-500 text-center py-4">Đang tải tiện nghi...</p>
            ) : amenityCategories.length === 0 ? (
              <p className="text-sm text-pink-500 text-center py-4">Không có tiện nghi nào</p>
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
                              checked={(filters.AmenityIds || []).includes(amenity.id)}
                              onChange={() => handleAmenityChange(amenity.id)}
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
        selectedDate={filters.CheckIn}
        onDateSelect={handleCheckInSelect}
        minDate={getTodayString()}
        title="Chọn ngày nhận phòng"
        type="checkin"
      />

      <DatePickerModal
        isOpen={isCheckOutPickerOpen}
        onClose={() => setIsCheckOutPickerOpen(false)}
        selectedDate={filters.CheckOut}
        onDateSelect={handleCheckOutSelect}
        minDate={filters.CheckIn || getTomorrowString()}
        title="Chọn ngày trả phòng"
        type="checkout"
      />
    </div>
  )
}