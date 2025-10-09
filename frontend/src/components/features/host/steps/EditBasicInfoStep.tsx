'use client'

import React, { useContext, useState } from 'react'
import { ChevronRight, MapPin, AlertCircle, Save } from 'lucide-react'
import { EditWizardContext } from '../EditPropertyWizard'
import MapModal from '../components/MapModal'
import AmenitiesSelector from '../components/AmenitiesSelector'
import { propertyService } from '@/services/main/hostproperty.service'
import { useToast } from '@/components/ui/Toast'
interface EditBasicInfoStepProps {
  setLoading: (loading: boolean) => void
}

const EditBasicInfoStep: React.FC<EditBasicInfoStepProps> = ({ setLoading }) => {
  const context = useContext(EditWizardContext)
   const { showToast } = useToast()
  if (!context) throw new Error('EditBasicInfoStep must be used within EditWizardContext')

  const {
    propertyId,
    provinces,
    communes,
    amenityCategories,
    productTypes,
    propertyData,
    setPropertyData,
    nextStep
  } = context

  const [showMap, setShowMap] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Helper functions for safe number handling
  const getLatitude = (): number => {
    return typeof propertyData.latitude === 'number' && propertyData.latitude !== 0 
      ? propertyData.latitude 
      : 10.8231 // Default HCM latitude
  }

  const getLongitude = (): number => {
    return typeof propertyData.longitude === 'number' && propertyData.longitude !== 0 
      ? propertyData.longitude 
      : 106.6297 // Default HCM longitude
  }

  const hasValidLocation = (): boolean => {
    return typeof propertyData.latitude === 'number' && 
           typeof propertyData.longitude === 'number' &&
           propertyData.latitude !== 0 && 
           propertyData.longitude !== 0
  }

  // Number input handlers
  const handleNumberInput = (
    field: string, 
    value: string, 
    min: number = 0, 
    max?: number,
    isInteger: boolean = true
  ) => {
    if (value === '') {
      setPropertyData(prev => ({ ...prev, [field]: '' as any }))
      return
    }

    let numValue = isInteger ? parseInt(value) : parseFloat(value)
    
    if (!isNaN(numValue)) {
      if (numValue < min) numValue = min
      if (max !== undefined && numValue > max) numValue = max
      
      setPropertyData(prev => ({ ...prev, [field]: numValue }))
    }

    // Clear error if field has one
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!propertyData.name?.trim()) {
      newErrors.name = 'Vui lòng nhập tên property'
    }

    if (propertyData.productTypeId === 0) {
      newErrors.productTypeId = 'Vui lòng chọn loại hình kinh doanh'
    }

    if (propertyData.provinceId === 0) {
      newErrors.provinceId = 'Vui lòng chọn tỉnh/thành phố'
    }

    if (propertyData.communeId === 0) {
      newErrors.communeId = 'Vui lòng chọn quận/huyện'
    }

    if (!propertyData.addressDetail?.trim()) {
      newErrors.addressDetail = 'Vui lòng nhập địa chỉ chi tiết'
    }

    if (!hasValidLocation()) {
      newErrors.location = 'Vui lòng chọn vị trí trên bản đồ'
    }

    // Check for empty or invalid numeric fields
    const numericFields = [
      { field: 'priceFrom', message: 'Vui lòng nhập giá' },
      { field: 'totalRooms', message: 'Vui lòng nhập số phòng' },
      { field: 'minStayNights', message: 'Vui lòng nhập số đêm tối thiểu' },
      { field: 'maxStayNights', message: 'Vui lòng nhập số đêm tối đa' },
      { field: 'establishedYear', message: 'Vui lòng nhập năm thành lập' }
    ]

    numericFields.forEach(({ field, message }) => {
      const value = propertyData[field as keyof typeof propertyData]
      if (value === '' || value === undefined || value === null || 
          (typeof value === 'number' && (isNaN(value) || value <= 0))) {
        newErrors[field] = message
      }
    })

    // Specific validations
    if (propertyData.priceFrom && propertyData.priceFrom < 0) {
      newErrors.priceFrom = 'Giá không được âm'
    }

    if (propertyData.totalRooms && propertyData.totalRooms < 1) {
      newErrors.totalRooms = 'Số phòng phải ít nhất là 1'
    }

    if (propertyData.minStayNights && propertyData.minStayNights < 1) {
      newErrors.minStayNights = 'Số đêm tối thiểu phải ít nhất là 1'
    }

    if (propertyData.maxStayNights && propertyData.minStayNights && 
        propertyData.maxStayNights < propertyData.minStayNights) {
      newErrors.maxStayNights = 'Số đêm tối đa phải lớn hơn số đêm tối thiểu'
    }

    const currentYear = new Date().getFullYear()
    const establishedYear = propertyData.establishedYear
    if (establishedYear && (establishedYear < 1900 || establishedYear > currentYear)) {
      newErrors.establishedYear = 'Năm thành lập không hợp lệ'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLocationSelect = (lat: number, lng: number, address?: string) => {
    setPropertyData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng
    }))
    
    // Clear location error if exists
    if (errors.location) {
      setErrors(prev => ({ ...prev, location: '' }))
    }
  }

  const handleSaveAndContinue = async () => {
    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)
      const response = await propertyService.updateProperty(propertyId, propertyData)
      if (response.success) {
       showToast('Cập nhật thông tin property thành công!', 'success')
        nextStep()
      } else {
      showToast(response.message || 'Lỗi khi cập nhật property', 'error')
      }
    } catch (error) {
      console.error('Error updating property:', error)
       showToast('Lỗi khi cập nhật property', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveOnly = async () => {
    if (!validateForm()) {
         showToast('Vui lòng kiểm tra lại thông tin', 'error')
      return
    }

    try {
      setLoading(true)
      const response = await propertyService.updateProperty(propertyId, propertyData)
      if (response.success) {
        showToast('Lưu thông tin property thành công!', 'success')
      } else {
     showToast(response.message || 'Lỗi khi lưu property', 'error')
      }
    } catch (error) {
      console.error('Error saving property:', error)
       showToast('Lỗi khi lưu property', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Chỉnh sửa thông tin cơ bản
        </h2>
        <p className="text-gray-600 text-sm sm:text-base">Cập nhật thông tin cơ bản về property của bạn</p>
      </div>

      {/* Basic Information */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Thông tin chung</h3>
        <div className="space-y-4 sm:grid sm:grid-cols-2 sm:gap-6 sm:space-y-0">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên property <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className={`w-full p-3 border-2 rounded-lg focus:ring-2 focus:ring-pink-500 transition-colors text-sm sm:text-base ${
                errors.name ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-pink-500'
              }`}
              value={propertyData.name || ''}
              onChange={(e) => {
                setPropertyData(prev => ({ ...prev, name: e.target.value }))
                if (errors.name) setErrors(prev => ({ ...prev, name: '' }))
              }}
              placeholder="VD: Khách sạn ABC, Villa XYZ..."
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loại hình kinh doanh <span className="text-red-500">*</span>
            </label>
            <select
              className={`w-full p-3 border-2 rounded-lg focus:ring-2 focus:ring-pink-500 transition-colors text-sm sm:text-base ${
                errors.productTypeId ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-pink-500'
              }`}
              value={propertyData.productTypeId || 0}
              onChange={(e) => {
                setPropertyData(prev => ({ ...prev, productTypeId: parseInt(e.target.value) }))
                if (errors.productTypeId) setErrors(prev => ({ ...prev, productTypeId: '' }))
              }}
            >
              <option value={0}>Chọn loại hình</option>
              {productTypes.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
            {errors.productTypeId && <p className="text-red-500 text-xs mt-1">{errors.productTypeId}</p>}
          </div>
        </div>
      </div>

      {/* Location Information */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Thông tin địa chỉ</h3>
        <div className="space-y-4 sm:grid sm:grid-cols-2 sm:gap-6 sm:space-y-0">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tỉnh/Thành phố <span className="text-red-500">*</span>
            </label>
            <select
              className={`w-full p-3 border-2 rounded-lg focus:ring-2 focus:ring-pink-500 transition-colors text-sm sm:text-base ${
                errors.provinceId ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-pink-500'
              }`}
              value={propertyData.provinceId || 0}
              onChange={(e) => {
                setPropertyData(prev => ({ 
                  ...prev, 
                  provinceId: parseInt(e.target.value),
                  communeId: 0 // Reset commune when province changes
                }))
                if (errors.provinceId) setErrors(prev => ({ ...prev, provinceId: '', communeId: '' }))
              }}
            >
              <option value={0}>Chọn tỉnh/thành phố</option>
              {provinces.map(province => (
                <option key={province.id} value={province.id}>{province.name}</option>
              ))}
            </select>
            {errors.provinceId && <p className="text-red-500 text-xs mt-1">{errors.provinceId}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quận/Huyện <span className="text-red-500">*</span>
            </label>
            <select
              className={`w-full p-3 border-2 rounded-lg focus:ring-2 focus:ring-pink-500 transition-colors text-sm sm:text-base ${
                errors.communeId ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-pink-500'
              }`}
              value={propertyData.communeId || 0}
              onChange={(e) => {
                setPropertyData(prev => ({ ...prev, communeId: parseInt(e.target.value) }))
                if (errors.communeId) setErrors(prev => ({ ...prev, communeId: '' }))
              }}
              disabled={!propertyData.provinceId}
            >
              <option value={0}>Chọn quận/huyện</option>
              {communes.map(commune => (
                <option key={commune.id} value={commune.id}>{commune.name}</option>
              ))}
            </select>
            {errors.communeId && <p className="text-red-500 text-xs mt-1">{errors.communeId}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Địa chỉ chi tiết <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className={`w-full p-3 border-2 rounded-lg focus:ring-2 focus:ring-pink-500 transition-colors text-sm sm:text-base ${
                errors.addressDetail ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-pink-500'
              }`}
              value={propertyData.addressDetail || ''}
              onChange={(e) => {
                setPropertyData(prev => ({ ...prev, addressDetail: e.target.value }))
                if (errors.addressDetail) setErrors(prev => ({ ...prev, addressDetail: '' }))
              }}
              placeholder="Số nhà, tên đường..."
            />
            {errors.addressDetail && <p className="text-red-500 text-xs mt-1">{errors.addressDetail}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mã bưu chính</label>
            <input
              type="text"
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors text-sm sm:text-base"
              value={propertyData.postalCode || ''}
              onChange={(e) => setPropertyData(prev => ({ ...prev, postalCode: e.target.value }))}
              placeholder="Mã bưu chính"
            />
          </div>

          {/* Location Selection - Mobile Optimized */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vị trí trên bản đồ <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <input
                    type="number"
                    step="any"
                    inputMode="decimal"
                    className={`w-full p-3 border-2 rounded-lg focus:ring-2 focus:ring-pink-500 transition-colors text-sm sm:text-base ${
                      errors.location ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-pink-500'
                    }`}
                    value={propertyData.latitude || ''}
                    onChange={(e) => handleNumberInput('latitude', e.target.value, -90, 90, false)}
                    placeholder="Vĩ độ (Latitude)"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="number"
                    step="any"
                    inputMode="decimal"
                    className={`w-full p-3 border-2 rounded-lg focus:ring-2 focus:ring-pink-500 transition-colors text-sm sm:text-base ${
                      errors.location ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-pink-500'
                    }`}
                    value={propertyData.longitude || ''}
                    onChange={(e) => handleNumberInput('longitude', e.target.value, -180, 180, false)}
                    placeholder="Kinh độ (Longitude)"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowMap(true)}
                  className="px-4 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all flex items-center justify-center text-sm font-medium"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Chọn vị trí
                </button>
              </div>
              {hasValidLocation() && (
                <p className="text-green-600 text-sm flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  Đã chọn vị trí: {propertyData.latitude!.toFixed(6)}, {propertyData.longitude!.toFixed(6)}
                </p>
              )}
              {errors.location && <p className="text-red-500 text-xs">{errors.location}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Property Details */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Chi tiết property</h3>
        <div className="space-y-4 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-6 sm:space-y-0">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số phòng <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              inputMode="numeric"
              className={`w-full p-3 border-2 rounded-lg focus:ring-2 focus:ring-pink-500 transition-colors text-sm sm:text-base ${
                errors.totalRooms ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-pink-500'
              }`}
              value={propertyData.totalRooms || ''}
              onChange={(e) => handleNumberInput('totalRooms', e.target.value, 1)}
              placeholder="1"
            />
            {errors.totalRooms && <p className="text-red-500 text-xs mt-1">{errors.totalRooms}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Đánh giá sao</label>
            <select
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors text-sm sm:text-base"
              value={propertyData.starRating || 0}
              onChange={(e) => setPropertyData(prev => ({ ...prev, starRating: parseInt(e.target.value) }))}
            >
              <option value={0}>Chưa có</option>
              {[1, 2, 3, 4, 5].map(star => (
                <option key={star} value={star}>{star} sao</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Năm thành lập <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1900"
              max={new Date().getFullYear()}
              inputMode="numeric"
              className={`w-full p-3 border-2 rounded-lg focus:ring-2 focus:ring-pink-500 transition-colors text-sm sm:text-base ${
                errors.establishedYear ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-pink-500'
              }`}
              value={propertyData.establishedYear || ''}
              onChange={(e) => handleNumberInput('establishedYear', e.target.value, 1900, new Date().getFullYear())}
              placeholder={new Date().getFullYear().toString()}
            />
            {errors.establishedYear && <p className="text-red-500 text-xs mt-1">{errors.establishedYear}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Giờ check-in</label>
            <input
              type="time"
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors text-sm sm:text-base"
              value={propertyData.checkInTime || ''}
              onChange={(e) => setPropertyData(prev => ({ ...prev, checkInTime: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Giờ check-out</label>
            <input
              type="time"
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors text-sm sm:text-base"
              value={propertyData.checkOutTime || ''}
              onChange={(e) => setPropertyData(prev => ({ ...prev, checkOutTime: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Giá từ (VND) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              inputMode="numeric"
              className={`w-full p-3 border-2 rounded-lg focus:ring-2 focus:ring-pink-500 transition-colors text-sm sm:text-base ${
                errors.priceFrom ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-pink-500'
              }`}
              value={propertyData.priceFrom || ''}
              onChange={(e) => handleNumberInput('priceFrom', e.target.value, 0)}
              placeholder="500000"
            />
            {errors.priceFrom && <p className="text-red-500 text-xs mt-1">{errors.priceFrom}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số đêm tối thiểu <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              inputMode="numeric"
              className={`w-full p-3 border-2 rounded-lg focus:ring-2 focus:ring-pink-500 transition-colors text-sm sm:text-base ${
                errors.minStayNights ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-pink-500'
              }`}
              value={propertyData.minStayNights || ''}
              onChange={(e) => handleNumberInput('minStayNights', e.target.value, 1)}
              placeholder="1"
            />
            {errors.minStayNights && <p className="text-red-500 text-xs mt-1">{errors.minStayNights}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số đêm tối đa <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              inputMode="numeric"
              className={`w-full p-3 border-2 rounded-lg focus:ring-2 focus:ring-pink-500 transition-colors text-sm sm:text-base ${
                errors.maxStayNights ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-pink-500'
              }`}
              value={propertyData.maxStayNights || ''}
              onChange={(e) => handleNumberInput('maxStayNights', e.target.value, 1)}
              placeholder="30"
            />
            {errors.maxStayNights && <p className="text-red-500 text-xs mt-1">{errors.maxStayNights}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Chính sách hủy</label>
            <select
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors text-sm sm:text-base"
              value={propertyData.cancellationPolicy || 'flexible'}
              onChange={(e) => setPropertyData(prev => ({ ...prev, cancellationPolicy: e.target.value }))}
            >
              <option value="flexible">Linh hoạt</option>
              <option value="moderate">Vừa phải</option>
              <option value="strict">Nghiêm ngặt</option>
            </select>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Mô tả property</h3>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả ngắn</label>
            <textarea
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 h-20 sm:h-24 resize-none transition-colors text-sm sm:text-base"
              value={propertyData.shortDescription || ''}
              onChange={(e) => setPropertyData(prev => ({ ...prev, shortDescription: e.target.value }))}
              placeholder="Mô tả ngắn gọn về property của bạn..."
              maxLength={200}
            />
            <p className="text-xs text-gray-500 mt-1">
              {(propertyData.shortDescription || '').length}/200 ký tự
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả chi tiết</label>
            <textarea
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 h-24 sm:h-32 resize-none transition-colors text-sm sm:text-base"
              value={propertyData.description || ''}
              onChange={(e) => setPropertyData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Mô tả chi tiết về vị trí, tiện ích, dịch vụ của property..."
            />
          </div>
        </div>
      </div>

      {/* SEO Information */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Tối ưu SEO</h3>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Meta Title</label>
            <input
              type="text"
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors text-sm sm:text-base"
              value={propertyData.metaTitle || ''}
              onChange={(e) => setPropertyData(prev => ({ ...prev, metaTitle: e.target.value }))}
              placeholder="Tiêu đề SEO cho property"
              maxLength={60}
            />
            <p className="text-xs text-gray-500 mt-1">
              {(propertyData.metaTitle || '').length}/60 ký tự (tối ưu cho Google)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Meta Description</label>
            <textarea
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 h-16 sm:h-20 resize-none transition-colors text-sm sm:text-base"
              value={propertyData.metaDescription || ''}
              onChange={(e) => setPropertyData(prev => ({ ...prev, metaDescription: e.target.value }))}
              placeholder="Mô tả SEO cho property"
              maxLength={160}
            />
            <p className="text-xs text-gray-500 mt-1">
              {(propertyData.metaDescription || '').length}/160 ký tự (tối ưu cho Google)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Meta Keywords</label>
            <input
              type="text"
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors text-sm sm:text-base"
              value={propertyData.metaKeywords || ''}
              onChange={(e) => setPropertyData(prev => ({ ...prev, metaKeywords: e.target.value }))}
              placeholder="từ khóa 1, từ khóa 2, từ khóa 3..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Phân cách các từ khóa bằng dấu phẩy
            </p>
          </div>
        </div>
      </div>

      {/* Amenities Selection */}
      <AmenitiesSelector
        amenityCategories={amenityCategories}
        selectedAmenities={propertyData.amenities || []}
        onChange={(amenities) => setPropertyData(prev => ({ ...prev, amenities }))}
        title="Tiện nghi property"
        type="property"
      />

      {/* Error Summary */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-red-900 mb-2">Vui lòng kiểm tra lại:</h4>
              <ul className="text-sm text-red-800 space-y-1">
                {Object.values(errors).map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6">
        <button
          onClick={handleSaveOnly}
          className="px-6 py-3 border-2 border-pink-300 text-pink-700 rounded-lg hover:bg-pink-50 hover:border-pink-400 transition-all flex items-center justify-center font-medium text-sm sm:text-base"
        >
          <Save className="w-4 h-4 mr-2" />
          Chỉ lưu
        </button>
        
        <button
          onClick={handleSaveAndContinue}
          className="px-6 sm:px-8 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all flex items-center justify-center font-medium shadow-lg text-sm sm:text-base"
        >
          Lưu & Tiếp tục
          <ChevronRight className="w-5 h-5 ml-2" />
        </button>
      </div>

      {/* Map Modal */}
      <MapModal
        isOpen={showMap}
        onClose={() => setShowMap(false)}
        initialLat={getLatitude()}
        initialLng={getLongitude()}
        onLocationSelect={handleLocationSelect}
      />
    </div>
  )
}

export default EditBasicInfoStep