//component/features/host/steps/RoomInfoStep.tsx
'use client'

import React, { useContext, useState } from 'react'
import { ChevronLeft, ChevronRight, Bed, Users, DollarSign, AlertCircle, Percent } from 'lucide-react'
import { WizardContext } from '../CreatePropertyWizard'
import AmenitiesSelector from '../components/AmenitiesSelector'
import { roomService } from '@/services/main/room.service'
import { HostRoomTypeDetailResponse } from '@/types/main/hostproperty'

interface RoomInfoStepProps {
  setLoading: (loading: boolean) => void
  setCreatedRoomTypes: (rooms: HostRoomTypeDetailResponse[]) => void
}

const RoomInfoStep: React.FC<RoomInfoStepProps> = ({ setLoading, setCreatedRoomTypes }) => {
  const context = useContext(WizardContext)
  if (!context) throw new Error('RoomInfoStep must be used within WizardContext')

  const {
    roomForms,
    setRoomForms,
    amenityCategories,
    createdPropertyId,
    setRoomImageUploads,
    nextStep,
    prevStep
  } = context

  const [errors, setErrors] = useState<Record<string, Record<string, string>>>({})
  const [activeRoom, setActiveRoom] = useState(0)

  const updateRoomForm = (index: number, field: string, value: any) => {
    const newRooms = [...roomForms]
    newRooms[index] = { ...newRooms[index], [field]: value }
    setRoomForms(newRooms)

    // Clear error for this field
    if (errors[index]?.[field]) {
      const newErrors = { ...errors }
      delete newErrors[index][field]
      setErrors(newErrors)
    }
  }

  const validateRoom = (roomIndex: number) => {
    const room = roomForms[roomIndex]
    const roomErrors: Record<string, string> = {}

    if (!room.name?.trim()) {
      roomErrors.name = 'Vui lòng nhập tên phòng'
    }

    if (room.maxAdults < 1) {
      roomErrors.maxAdults = 'Số người lớn tối thiểu là 1'
    }

    if (room.maxGuests < room.maxAdults) {
      roomErrors.maxGuests = 'Tổng số khách phải lớn hơn hoặc bằng số người lớn'
    }

    if (room.basePrice <= 0) {
      roomErrors.basePrice = 'Giá cơ bản phải lớn hơn 0'
    }

    if (room.weekendPrice && room.weekendPrice < 0) {
      roomErrors.weekendPrice = 'Giá cuối tuần không được âm'
    }

    if (room.holidayPrice && room.holidayPrice < 0) {
      roomErrors.holidayPrice = 'Giá ngày lễ không được âm'
    }

    if (room.roomSize && room.roomSize <= 0) {
      roomErrors.roomSize = 'Diện tích phòng phải lớn hơn 0'
    }

    if (room.totalRooms < 1) {
      roomErrors.totalRooms = 'Số phòng cùng loại tối thiểu là 1'
    }

    if (room.weeklyDiscountPercent < 0 || room.weeklyDiscountPercent > 100) {
      roomErrors.weeklyDiscountPercent = 'Giảm giá tuần từ 0-100%'
    }

    if (room.monthlyDiscountPercent < 0 || room.monthlyDiscountPercent > 100) {
      roomErrors.monthlyDiscountPercent = 'Giảm giá tháng từ 0-100%'
    }

    return roomErrors
  }

  const validateAllRooms = () => {
    const allErrors: Record<string, Record<string, string>> = {}
    let hasErrors = false

    roomForms.forEach((_, index) => {
      const roomErrors = validateRoom(index)
      if (Object.keys(roomErrors).length > 0) {
        allErrors[index] = roomErrors
        hasErrors = true
      }
    })

    setErrors(allErrors)
    return !hasErrors
  }

  const handleSubmit = async () => {
    if (!validateAllRooms()) {
      alert('Vui lòng kiểm tra lại thông tin các phòng')
      return
    }

    if (!createdPropertyId) {
      alert('Lỗi: Không tìm thấy property ID')
      return
    }

    try {
      setLoading(true)

      // Create bulk room request
      const bulkRoomRequest = {
        propertyId: createdPropertyId,
        roomTypes: roomForms.map(room => ({
          name: room.name,
          description: room.description,
          shortDescription: room.shortDescription,
          maxAdults: room.maxAdults,
          maxChildren: room.maxChildren,
          maxGuests: room.maxGuests,
          bedType: room.bedType,
          roomSize: room.roomSize || 0,
          basePrice: room.basePrice,
          weekendPrice: room.weekendPrice || 0,
          holidayPrice: room.holidayPrice || 0,
          weeklyDiscountPercent: room.weeklyDiscountPercent,
          monthlyDiscountPercent: room.monthlyDiscountPercent,
          totalRooms: room.totalRooms,
          metaTitle: room.metaTitle,
          metaDescription: room.metaDescription,
          amenities: room.amenities
        }))
      }

      const response = await roomService.createMultipleRoomTypes(bulkRoomRequest)

      if (response.success) {
        // Get created room types
        const roomTypesRes = await roomService.getRoomTypesByProperty(createdPropertyId)
        if (roomTypesRes.success && roomTypesRes.data) {
          setCreatedRoomTypes(roomTypesRes.data.roomTypes)

          // Initialize room image uploads
          const imageUploads = roomTypesRes.data.roomTypes.map(room => ({
            roomTypeId: room.id,
            roomTypeName: room.name,
            images: []
          }))
          setRoomImageUploads(imageUploads)
        }
        nextStep()
      } else {
        alert('Lỗi khi tạo phòng: ' + (response.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error creating rooms:', error)
      alert('Lỗi khi tạo phòng')
    } finally {
      setLoading(false)
    }
  }

  const bedTypeOptions = [
    { value: 'single', label: 'Giường đơn' },
    { value: 'double', label: 'Giường đôi' },
    { value: 'queen', label: 'Giường Queen' },
    { value: 'king', label: 'Giường King' },
    { value: 'twin', label: 'Hai giường đơn' },
    { value: 'bunk', label: 'Giường tầng' }
  ]

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Thông tin các loại phòng
        </h2>
        <p className="text-gray-600">Cấu hình chi tiết cho từng loại phòng của bạn</p>
      </div>

      {/* Room Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <div className="flex">
          {roomForms.map((room, index) => (
            <button
              key={index}
              onClick={() => setActiveRoom(index)}
              className={`flex-1 min-w-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeRoom === index
                  ? 'border-pink-500 text-pink-600 bg-pink-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center">
                <Bed className="w-4 h-4 mr-2" />
                <span className="truncate">{room.name || `Loại phòng ${index + 1}`}</span>
                {errors[index] && Object.keys(errors[index]).length > 0 && (
                  <AlertCircle className="w-3 h-3 ml-2 text-red-500" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Room Form */}
      {roomForms.map((room, index) => (
        <div
          key={index}
          className={`space-y-6 ${activeRoom === index ? 'block' : 'hidden'}`}
        >
          {/* Basic Information */}
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Bed className="w-5 h-5 mr-2 text-pink-600" />
              Thông tin cơ bản - {room.name || `Loại phòng ${index + 1}`}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên loại phòng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className={`w-full p-3 border-2 rounded-lg focus:ring-2 focus:ring-pink-500 transition-colors ${
                    errors[index]?.name ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-pink-500'
                  }`}
                  value={room.name}
                  onChange={(e) => updateRoomForm(index, 'name', e.target.value)}
                  placeholder="VD: Phòng Deluxe, Phòng Standard..."
                />
                {errors[index]?.name && <p className="text-red-500 text-xs mt-1">{errors[index].name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Loại giường</label>
                <select
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                  value={room.bedType}
                  onChange={(e) => updateRoomForm(index, 'bedType', e.target.value)}
                >
                  {bedTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Diện tích phòng (m²)</label>
                <input
                  type="number"
                  min="1"
                  className={`w-full p-3 border-2 rounded-lg focus:ring-2 focus:ring-pink-500 transition-colors ${
                    errors[index]?.roomSize ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-pink-500'
                  }`}
                  value={room.roomSize || ''}
                  onChange={(e) => updateRoomForm(index, 'roomSize', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="VD: 25"
                />
                {errors[index]?.roomSize && <p className="text-red-500 text-xs mt-1">{errors[index].roomSize}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số phòng cùng loại <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  className={`w-full p-3 border-2 rounded-lg focus:ring-2 focus:ring-pink-500 transition-colors ${
                    errors[index]?.totalRooms ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-pink-500'
                  }`}
                  value={room.totalRooms}
                  onChange={(e) => updateRoomForm(index, 'totalRooms', parseInt(e.target.value) || 1)}
                />
                {errors[index]?.totalRooms && <p className="text-red-500 text-xs mt-1">{errors[index].totalRooms}</p>}
              </div>
            </div>
          </div>

          {/* Capacity Information */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-purple-600" />
              Sức chứa phòng
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số người lớn tối đa <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  className={`w-full p-3 border-2 rounded-lg focus:ring-2 focus:ring-pink-500 transition-colors ${
                    errors[index]?.maxAdults ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-pink-500'
                  }`}
                  value={room.maxAdults}
                  onChange={(e) => updateRoomForm(index, 'maxAdults', parseInt(e.target.value) || 1)}
                />
                {errors[index]?.maxAdults && <p className="text-red-500 text-xs mt-1">{errors[index].maxAdults}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Số trẻ em tối đa</label>
                <input
                  type="number"
                  min="0"
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                  value={room.maxChildren}
                  onChange={(e) => updateRoomForm(index, 'maxChildren', parseInt(e.target.value) || 0)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tổng số khách tối đa <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  className={`w-full p-3 border-2 rounded-lg focus:ring-2 focus:ring-pink-500 transition-colors ${
                    errors[index]?.maxGuests ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-pink-500'
                  }`}
                  value={room.maxGuests}
                  onChange={(e) => updateRoomForm(index, 'maxGuests', parseInt(e.target.value) || 1)}
                />
                {errors[index]?.maxGuests && <p className="text-red-500 text-xs mt-1">{errors[index].maxGuests}</p>}
              </div>
            </div>
          </div>

          {/* Pricing Information */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-green-600" />
              Thông tin giá cả
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giá cơ bản (VND/đêm) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  className={`w-full p-3 border-2 rounded-lg focus:ring-2 focus:ring-pink-500 transition-colors ${
                    errors[index]?.basePrice ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-pink-500'
                  }`}
                  value={room.basePrice}
                  onChange={(e) => updateRoomForm(index, 'basePrice', parseInt(e.target.value) || 0)}
                  placeholder="500000"
                />
                {errors[index]?.basePrice && <p className="text-red-500 text-xs mt-1">{errors[index].basePrice}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giá cuối tuần (VND/đêm)
                  <span className="text-xs text-gray-500 ml-1">(để trống = giá cơ bản)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  className={`w-full p-3 border-2 rounded-lg focus:ring-2 focus:ring-pink-500 transition-colors ${
                    errors[index]?.weekendPrice ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-pink-500'
                  }`}
                  value={room.weekendPrice || ''}
                  onChange={(e) => updateRoomForm(index, 'weekendPrice', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="600000"
                />
                {errors[index]?.weekendPrice && <p className="text-red-500 text-xs mt-1">{errors[index].weekendPrice}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giá ngày lễ (VND/đêm)
                  <span className="text-xs text-gray-500 ml-1">(để trống = giá cơ bản)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  className={`w-full p-3 border-2 rounded-lg focus:ring-2 focus:ring-pink-500 transition-colors ${
                    errors[index]?.holidayPrice ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-pink-500'
                  }`}
                  value={room.holidayPrice || ''}
                  onChange={(e) => updateRoomForm(index, 'holidayPrice', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="800000"
                />
                {errors[index]?.holidayPrice && <p className="text-red-500 text-xs mt-1">{errors[index].holidayPrice}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giảm giá theo tuần (%)
                  <span className="text-xs text-gray-500 ml-1">(từ 7 đêm)</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className={`w-full p-3 border-2 rounded-lg focus:ring-2 focus:ring-pink-500 transition-colors pr-10 ${
                      errors[index]?.weeklyDiscountPercent ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-pink-500'
                    }`}
                    value={room.weeklyDiscountPercent}
                    onChange={(e) => updateRoomForm(index, 'weeklyDiscountPercent', parseInt(e.target.value) || 0)}
                  />
                  <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                {errors[index]?.weeklyDiscountPercent && <p className="text-red-500 text-xs mt-1">{errors[index].weeklyDiscountPercent}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giảm giá theo tháng (%)
                  <span className="text-xs text-gray-500 ml-1">(từ 30 đêm)</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className={`w-full p-3 border-2 rounded-lg focus:ring-2 focus:ring-pink-500 transition-colors pr-10 ${
                      errors[index]?.monthlyDiscountPercent ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-pink-500'
                    }`}
                    value={room.monthlyDiscountPercent}
                    onChange={(e) => updateRoomForm(index, 'monthlyDiscountPercent', parseInt(e.target.value) || 0)}
                  />
                  <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                {errors[index]?.monthlyDiscountPercent && <p className="text-red-500 text-xs mt-1">{errors[index].monthlyDiscountPercent}</p>}
              </div>
            </div>

            {/* Price Preview */}
            <div className="mt-4 p-3 bg-white rounded-lg border border-green-200">
              <h4 className="text-sm font-medium text-green-900 mb-2">Xem trước giá:</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-gray-600">Ngày thường:</span>
                  <div className="font-medium">{room.basePrice.toLocaleString('vi-VN')} VND</div>
                </div>
                <div>
                  <span className="text-gray-600">Cuối tuần:</span>
                  <div className="font-medium">
                    {(room.weekendPrice || room.basePrice).toLocaleString('vi-VN')} VND
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Ngày lễ:</span>
                  <div className="font-medium">
                    {(room.holidayPrice || room.basePrice).toLocaleString('vi-VN')} VND
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Giảm giá tháng:</span>
                  <div className="font-medium text-green-600">
                    {Math.round(room.basePrice * (100 - room.monthlyDiscountPercent) / 100).toLocaleString('vi-VN')} VND
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Mô tả phòng</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả ngắn</label>
                <textarea
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 h-20 resize-none transition-colors"
                  value={room.shortDescription}
                  onChange={(e) => updateRoomForm(index, 'shortDescription', e.target.value)}
                  placeholder="Mô tả ngắn gọn về phòng này..."
                  maxLength={200}
                />
                <p className="text-xs text-gray-500 mt-1">{room.shortDescription.length}/200 ký tự</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả chi tiết</label>
                <textarea
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 h-24 resize-none transition-colors"
                  value={room.description}
                  onChange={(e) => updateRoomForm(index, 'description', e.target.value)}
                  placeholder="Mô tả chi tiết về phòng, view, tiện ích..."
                />
              </div>
            </div>
          </div>

          {/* SEO Information */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tối ưu SEO</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Meta Title</label>
                <input
                  type="text"
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                  value={room.metaTitle}
                  onChange={(e) => updateRoomForm(index, 'metaTitle', e.target.value)}
                  placeholder="Tiêu đề SEO cho loại phòng này"
                  maxLength={60}
                />
                <p className="text-xs text-gray-500 mt-1">{room.metaTitle.length}/60 ký tự</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Meta Description</label>
                <textarea
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 h-16 resize-none transition-colors"
                  value={room.metaDescription}
                  onChange={(e) => updateRoomForm(index, 'metaDescription', e.target.value)}
                  placeholder="Mô tả SEO cho loại phòng này"
                  maxLength={160}
                />
                <p className="text-xs text-gray-500 mt-1">{room.metaDescription.length}/160 ký tự</p>
              </div>
            </div>
          </div>

          {/* Room Amenities */}
          <AmenitiesSelector
            amenityCategories={amenityCategories}
            selectedAmenities={room.amenities.map(a => ({ 
              amenityId: a.amenityId, 
              isFree: true, 
              additionalInfo: `Số lượng: ${a.quantity}` 
            }))}
            onChange={(amenities) => updateRoomForm(index, 'amenities', 
              amenities.map(a => ({ amenityId: a.amenityId, quantity: 1 }))
            )}
            title={`Tiện nghi ${room.name || `Loại phòng ${index + 1}`}`}
            type="room"
          />

          {/* Room Errors */}
          {errors[index] && Object.keys(errors[index]).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-900 mb-2">
                    Vui lòng kiểm tra lại thông tin {room.name || `Loại phòng ${index + 1}`}:
                  </h4>
                  <ul className="text-sm text-red-800 space-y-1">
                    {Object.values(errors[index]).map((error, errorIndex) => (
                      <li key={errorIndex}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6">
        <button
          onClick={prevStep}
          className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center font-medium"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Quay lại
        </button>
        
        <button
          onClick={handleSubmit}
          className="px-8 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all flex items-center font-medium shadow-lg"
        >
          Tạo các loại phòng
          <ChevronRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  )
}

export default RoomInfoStep