//component/features/host/components/AmenitiesSelector.tsx
'use client'

import React, { useState } from 'react'
import { 
  Check, 
  DollarSign, 
  Gift, 
  ChevronDown, 
  ChevronUp,
  Home,
  UtensilsCrossed,
  Bath,
  Tv,
  Trees,
  Settings,
  Shield,
  Car
} from 'lucide-react'
import { AmenityCategoryResponse, PropertyAmenityRequest } from '@/types/main/hostproperty'

interface AmenitiesSelectorProps {
  amenityCategories: AmenityCategoryResponse[]
  selectedAmenities: PropertyAmenityRequest[]
  onChange: (amenities: PropertyAmenityRequest[]) => void
  title?: string
  type?: 'property' | 'room'
}

const AmenitiesSelector: React.FC<AmenitiesSelectorProps> = ({
  amenityCategories,
  selectedAmenities = [],
  onChange,
  title = "Tiện nghi",
  type = 'property'
}) => {
  const [expandedCategories, setExpandedCategories] = useState<number[]>([])

  // Map icon names to actual Lucide icons
  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: React.ComponentType<any> } = {
      'home': Home,
      'utensils': UtensilsCrossed,
      'bath': Bath,
      'tv': Tv,
      'tree': Trees,
      'service': Settings,
      'shield': Shield,
      'car': Car,
    }
    
    const IconComponent = iconMap[iconName?.toLowerCase()] || Home
    return <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" />
  }

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const isAmenitySelected = (amenityId: number) => {
    return selectedAmenities.some(a => a.amenityId === amenityId)
  }

  const getAmenityInfo = (amenityId: number) => {
    return selectedAmenities.find(a => a.amenityId === amenityId)
  }

  const toggleAmenity = (amenityId: number) => {
    if (isAmenitySelected(amenityId)) {
      onChange(selectedAmenities.filter(a => a.amenityId !== amenityId))
    } else {
      const newAmenity: PropertyAmenityRequest = {
        amenityId,
        isFree: true,
        additionalInfo: ''
      }
      onChange([...selectedAmenities, newAmenity])
    }
  }

  const updateAmenityInfo = (amenityId: number, updates: Partial<PropertyAmenityRequest>) => {
    onChange(selectedAmenities.map(amenity => 
      amenity.amenityId === amenityId 
        ? { ...amenity, ...updates }
        : amenity
    ))
  }

  const getSelectedCount = (categoryId: number) => {
    const category = amenityCategories.find(cat => cat.id === categoryId)
    if (!category) return 0
    return category.amenities.filter(a => isAmenitySelected(a.id)).length
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h3 className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
          {title}
        </h3>
        {selectedAmenities.length > 0 && (
          <div className="flex items-center px-3 py-1.5 bg-gradient-to-r from-pink-100 to-purple-100 text-pink-700 rounded-full text-sm font-semibold border border-pink-200 shadow-sm">
            <Check className="w-4 h-4 mr-1" />
            Đã chọn: {selectedAmenities.length}
          </div>
        )}
      </div>

      {/* Categories */}
      <div className="space-y-3 sm:space-y-4">
        {amenityCategories.map(category => {
          const isExpanded = expandedCategories.includes(category.id)
          const selectedCount = getSelectedCount(category.id)
          
          return (
            <div key={category.id} className="bg-white border border-gray-200 rounded-lg sm:rounded-xl shadow-sm overflow-hidden">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-pink-50 via-purple-50 to-pink-50 hover:from-pink-100 hover:via-purple-100 hover:to-pink-100 border-l-4 border-pink-400 transition-all text-left flex items-center justify-between group"
              >
                <div className="flex items-center min-w-0 flex-1">
                  <div className="text-pink-600 mr-2 sm:mr-3 flex-shrink-0 group-hover:text-purple-600 transition-colors">
                    {getIconComponent(category.icon)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                      {category.name}
                    </h4>
                    <div className="flex items-center mt-1 text-xs sm:text-sm text-gray-600">
                      <span>
                        {selectedCount > 0 ? `${selectedCount} đã chọn` : 'Chưa chọn'} 
                        <span className="mx-1 text-pink-400">•</span>
                        {category.amenities.length} tiện nghi
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="ml-2 flex-shrink-0 flex items-center">
                  {selectedCount > 0 && (
                    <div className="w-6 h-6 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 shadow-sm">
                      {selectedCount}
                    </div>
                  )}
                  <div className="text-pink-400 group-hover:text-purple-500 transition-colors">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </div>
                </div>
              </button>

              {/* Category Content */}
              {isExpanded && (
                <div className="px-4 sm:px-6 py-4 border-t border-pink-100 bg-gradient-to-br from-white via-pink-25 to-purple-25">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                    {category.amenities.map(amenity => {
                      const isSelected = isAmenitySelected(amenity.id)
                      const amenityInfo = getAmenityInfo(amenity.id)
                      
                      return (
                        <div key={amenity.id} className={`border-2 rounded-lg transition-all shadow-sm hover:shadow-md ${
                          isSelected 
                            ? 'border-pink-300 bg-gradient-to-br from-pink-50 to-purple-50 shadow-pink-100' 
                            : 'border-gray-200 hover:border-pink-200 bg-white hover:bg-pink-25'
                        }`}>
                          {/* Amenity Checkbox */}
                          <label className="flex items-start p-3 cursor-pointer">
                            <div className="relative mt-0.5 flex-shrink-0">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleAmenity(amenity.id)}
                                className="sr-only"
                              />
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                isSelected 
                                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 border-transparent shadow-sm' 
                                  : 'border-gray-300 bg-white hover:border-pink-300'
                              }`}>
                                {isSelected && <Check className="w-3 h-3 text-white font-bold" />}
                              </div>
                            </div>
                            
                            <div className="ml-3 flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="min-w-0 flex-1">
                                  <span className="text-sm font-medium text-gray-900 block">
                                    {amenity.name}
                                  </span>
                                  {amenity.description && (
                                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                      {amenity.description}
                                    </p>
                                  )}
                                </div>
                                
                                {isSelected && (
                                  <div className="ml-2 flex-shrink-0">
                                    {amenityInfo?.isFree ? (
                                      <div className="flex items-center text-green-700 bg-gradient-to-r from-green-50 to-green-100 px-2 py-1 rounded-full text-xs font-medium shadow-sm">
                                        <Gift className="w-3 h-3 mr-1" />
                                        Miễn phí
                                      </div>
                                    ) : (
                                      <div className="flex items-center text-orange-700 bg-gradient-to-r from-orange-50 to-orange-100 px-2 py-1 rounded-full text-xs font-medium shadow-sm">
                                        <DollarSign className="w-3 h-3 mr-1" />
                                        Có phí
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </label>

                          {/* Amenity Details (shown when selected) */}
                          {isSelected && (
                            <div className="border-t border-pink-200 p-3 bg-gradient-to-r from-pink-25 to-purple-25 space-y-3">
                              {/* Free/Paid Toggle */}
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-2">
                                  💰 Tính phí cho khách
                                </label>
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <label className="flex items-center flex-1 p-2 rounded-lg bg-white border border-gray-200 hover:border-pink-300 transition-colors cursor-pointer">
                                    <input
                                      type="radio"
                                      name={`amenity-${amenity.id}-fee`}
                                      checked={amenityInfo?.isFree === true}
                                      onChange={() => updateAmenityInfo(amenity.id, { isFree: true })}
                                      className="text-pink-600 focus:ring-pink-500 w-4 h-4"
                                    />
                                    <span className="ml-2 text-xs font-medium text-gray-700 flex items-center">
                                      <Gift className="w-3 h-3 mr-1 text-green-600" />
                                      Miễn phí sử dụng
                                    </span>
                                  </label>
                                  <label className="flex items-center flex-1 p-2 rounded-lg bg-white border border-gray-200 hover:border-pink-300 transition-colors cursor-pointer">
                                    <input
                                      type="radio"
                                      name={`amenity-${amenity.id}-fee`}
                                      checked={amenityInfo?.isFree === false}
                                      onChange={() => updateAmenityInfo(amenity.id, { isFree: false })}
                                      className="text-pink-600 focus:ring-pink-500 w-4 h-4"
                                    />
                                    <span className="ml-2 text-xs font-medium text-gray-700 flex items-center">
                                      <DollarSign className="w-3 h-3 mr-1 text-orange-600" />
                                      Tính phí thêm
                                    </span>
                                  </label>
                                </div>
                              </div>

                              {/* Additional Info */}
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                  📝 Chi tiết {amenityInfo?.isFree ? '& cách sử dụng' : '& mức phí'}
                                </label>
                                <textarea
                                  value={amenityInfo?.additionalInfo || ''}
                                  onChange={(e) => updateAmenityInfo(amenity.id, { additionalInfo: e.target.value })}
                                  placeholder={amenityInfo?.isFree 
                                    ? "VD: Có sẵn tại lobby, phòng gym mở từ 6:00-22:00..." 
                                    : "VD: 50.000 VND/lần, liên hệ lễ tân để thuê..."
                                  }
                                  className="w-full text-xs border border-pink-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-400 focus:border-pink-400 resize-none bg-white shadow-sm"
                                  rows={2}
                                  maxLength={200}
                                />
                                <div className="flex justify-between items-center mt-1">
                                  <p className="text-xs text-gray-500">
                                    Thông tin này sẽ hiển thị cho khách hàng
                                  </p>
                                  <span className="text-xs text-pink-600 font-medium">
                                    {amenityInfo?.additionalInfo?.length || 0}/200
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Instructions */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 shadow-sm">
        <h4 className="font-semibold text-blue-900 mb-3 text-sm flex items-center">
          <span className="text-lg mr-2">💡</span>
          Hướng dẫn chọn tiện nghi:
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-blue-800">
          <div className="flex items-center">
            <span className="w-2 h-2 bg-pink-400 rounded-full mr-2 flex-shrink-0"></span>
            <span><strong>Click danh mục</strong> để xem tiện nghi</span>
          </div>
          <div className="flex items-center">
            <span className="w-2 h-2 bg-purple-400 rounded-full mr-2 flex-shrink-0"></span>
            <span><strong>Tích chọn</strong> tiện nghi có sẵn</span>
          </div>
          <div className="flex items-center">
            <span className="w-2 h-2 bg-green-400 rounded-full mr-2 flex-shrink-0"></span>
            <span><strong>Miễn phí:</strong> khách dùng free</span>
          </div>
          <div className="flex items-center">
            <span className="w-2 h-2 bg-orange-400 rounded-full mr-2 flex-shrink-0"></span>
            <span><strong>Có phí:</strong> ghi rõ giá cả</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AmenitiesSelector