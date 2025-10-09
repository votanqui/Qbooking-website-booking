'use client'

import React, { useContext, useState } from 'react'
import { ChevronLeft, Bed, Users, DollarSign, AlertCircle, Save, Upload, Star, Trash2, Plus, Edit3, Camera, CheckCircle, X } from 'lucide-react'
import { EditWizardContext } from '../EditPropertyWizard'
import { roomService } from '@/services/main/room.service'
import { propertyService } from '@/services/main/hostproperty.service'
import AmenitiesSelector from '../components/AmenitiesSelector'
import { RoomTypeForEdit, UpdateRoomTypeRequest } from '@/types/main/hostproperty'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'

interface EditRoomsStepProps {
  setLoading: (loading: boolean) => void
}

interface NewRoomImagePreview {
  file: File
  preview: string
  title: string
  description: string
  isPrimary: boolean
  sortOrder: number
}

const EditRoomsStep: React.FC<EditRoomsStepProps> = ({ setLoading }) => {
  const context = useContext(EditWizardContext)
  const router = useRouter()
    const { showToast } = useToast()
  if (!context) throw new Error('EditRoomsStep must be used within EditWizardContext')

  const {
    propertyId,
    amenityCategories,
    roomTypes,
    setRoomTypes,
    prevStep
  } = context

  const [activeRoom, setActiveRoom] = useState(0)
  const [errors, setErrors] = useState<Record<string, Record<string, string>>>({})
  const [newRoomImages, setNewRoomImages] = useState<Record<number, NewRoomImagePreview[]>>({})

  const bedTypeOptions = [
    { value: 'single', label: 'Giường đơn' },
    { value: 'double', label: 'Giường đôi' },
    { value: 'queen', label: 'Giường Queen' },
    { value: 'king', label: 'Giường King' },
    { value: 'twin', label: 'Hai giường đơn' },
    { value: 'bunk', label: 'Giường tầng' }
  ]

  // Update room data
  const updateRoomData = (index: number, field: string, value: any) => {
    const updatedRooms = [...roomTypes]
    updatedRooms[index] = { ...updatedRooms[index], [field]: value }
    setRoomTypes(updatedRooms)

    // Clear error for this field
    if (errors[index]?.[field]) {
      const newErrors = { ...errors }
      delete newErrors[index][field]
      setErrors(newErrors)
    }
  }

  // Validate room
  const validateRoom = (roomIndex: number) => {
    const room = roomTypes[roomIndex]
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

  // Update room info
  const handleUpdateRoom = async (roomIndex: number) => {
    const roomErrors = validateRoom(roomIndex)
    if (Object.keys(roomErrors).length > 0) {
      setErrors(prev => ({ ...prev, [roomIndex]: roomErrors }))
      return
    }

    const room = roomTypes[roomIndex]
    const updateData: UpdateRoomTypeRequest = {
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
    }

    try {
      setLoading(true)
      const response = await roomService.updateRoomType(room.id, updateData)
      if (response.success) {
       showToast(`Cập nhật ${room.name} thành công!`, 'success')
      } else {
     showToast(response.message || 'Lỗi khi cập nhật phòng', 'error')
      }
    } catch (error) {
      console.error('Error updating room:', error)
    showToast('Lỗi khi cập nhật phòng', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Handle room image upload
  const handleRoomImageUpload = (roomId: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    Array.from(files).forEach((file, index) => {
      const reader = new FileReader()
      reader.onload = () => {
        const newImage: NewRoomImagePreview = {
          file,
          preview: reader.result as string,
          title: file.name.split('.')[0],
          description: '',
          isPrimary: false,
          sortOrder: index + 1
        }

        setNewRoomImages(prev => ({
          ...prev,
          [roomId]: [...(prev[roomId] || []), newImage]
        }))
      }
      reader.readAsDataURL(file)
    })

    // Reset input
    event.target.value = ''
  }

  // Remove new room image
  const removeNewRoomImage = (roomId: number, imageIndex: number) => {
    setNewRoomImages(prev => ({
      ...prev,
      [roomId]: (prev[roomId] || []).filter((_, i) => i !== imageIndex)
    }))
  }

  // Upload room images
 // Upload room images
// Upload room images
  const uploadRoomImages = async (roomId: number) => {
    const images = newRoomImages[roomId]
    if (!images || images.length === 0) {
     showToast('Không có ảnh để upload', 'warning')
      return
    }

    try {
      setLoading(true)
      const formData = new FormData()
      
      images.forEach((img, index) => {
        formData.append('Files', img.file)
        formData.append('Titles', img.title)
        formData.append('Descriptions', img.description)
        formData.append('IsPrimaries', (index === 0).toString()) // First image is primary
        formData.append('SortOrders', (index + 1).toString())
      })

      const response = await roomService.uploadRoomImages(roomId, formData)
      console.log('Upload response:', response) // Debug log
      
      if (response.success) {
        // Fetch lại toàn bộ property data để có images mới nhất
        const propertyRes = await propertyService.getPropertyForEdit(propertyId)
        
        if (propertyRes.success && propertyRes.data) {
          // Cập nhật lại roomTypes với data mới từ property
          setRoomTypes(propertyRes.data.roomTypes)
        }
        
        // Clear uploaded images
        setNewRoomImages(prev => {
          const newState = { ...prev }
          delete newState[roomId]
          return newState
        })

        showToast(`Upload ${images.length} ảnh phòng thành công!`, 'success')
      } else {
         showToast(response.message || 'Lỗi khi upload ảnh', 'error')
      }
    } catch (error) {
      console.error('Error uploading room images:', error)
      showToast('Lỗi khi upload ảnh phòng', 'error')
    } finally {
      setLoading(false)
    }
  }
  // Delete existing room image
  const deleteRoomImage = async (imageId: number, roomIndex: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa ảnh này?')) return

    try {
      setLoading(true)
      const response = await roomService.deleteRoomImage(imageId)
      if (response.success) {
        // Remove image from local state
        const updatedRooms = [...roomTypes]
        updatedRooms[roomIndex] = {
          ...updatedRooms[roomIndex],
          images: updatedRooms[roomIndex].images.filter(img => img.id !== imageId)
        }
        setRoomTypes(updatedRooms)
      showToast('Xóa ảnh phòng thành công!', 'success')
      } else {
        showToast(response.message || 'Lỗi khi xóa ảnh', 'error')
      }
    } catch (error) {
      console.error('Error deleting room image:', error)
   showToast('Lỗi khi xóa ảnh phòng', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Set primary room image
  const setPrimaryRoomImage = async (imageId: number, roomIndex: number) => {
    try {
      setLoading(true)
      const response = await roomService.setPrimaryRoomImage(imageId)
      if (response.success) {
        // Update local state
        const updatedRooms = [...roomTypes]
        updatedRooms[roomIndex] = {
          ...updatedRooms[roomIndex],
          images: updatedRooms[roomIndex].images.map(img => ({
            ...img,
            isPrimary: img.id === imageId
          }))
        }
        setRoomTypes(updatedRooms)
        showToast('Đặt ảnh chính thành công!', 'success')
      } else {
       showToast(response.message || 'Lỗi khi đặt ảnh chính', 'error')
      }
    } catch (error) {
      console.error('Error setting primary image:', error)
     showToast('Lỗi khi đặt ảnh chính', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleFinish = () => {
    showToast('Cập nhật property thành công!', 'success', 3000)
    setTimeout(() => {
      router.push('/host/propertiesmanager')
    }, 1500)
  }

  if (roomTypes.length === 0) {
    return (
      <div className="text-center py-12">
        <Bed className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">Chưa có phòng nào</h3>
        <p className="text-gray-500 mb-6">Property này chưa có loại phòng nào được tạo.</p>
        <button
          onClick={() => router.push('/host/propertiesmanager')}
          className="px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all"
        >
          Quay về danh sách
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Quản lý phòng
        </h2>
        <p className="text-gray-600 text-sm sm:text-base">Chỉnh sửa thông tin và ảnh các loại phòng</p>
      </div>

      {/* Room Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <div className="flex">
          {roomTypes.map((room, index) => (
            <button
              key={room.id}
              onClick={() => setActiveRoom(index)}
              className={`flex-1 min-w-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeRoom === index
                  ? 'border-pink-500 text-pink-600 bg-pink-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center">
                <Bed className="w-4 h-4 mr-2" />
                <span className="truncate">{room.name || `Phòng ${index + 1}`}</span>
                {errors[index] && Object.keys(errors[index]).length > 0 && (
                  <AlertCircle className="w-3 h-3 ml-2 text-red-500" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Room Content */}
      {roomTypes.map((room, index) => (
        <div
          key={room.id}
          className={`space-y-6 ${activeRoom === index ? 'block' : 'hidden'}`}
        >
          {/* Basic Information */}
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
                <Bed className="w-5 h-5 mr-2 text-pink-600" />
                {room.name} - Thông tin cơ bản
              </h3>
              <button
                onClick={() => handleUpdateRoom(index)}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all flex items-center text-sm font-medium"
              >
                <Save className="w-4 h-4 mr-2" />
                Lưu thay đổi
              </button>
            </div>
            
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
                  onChange={(e) => updateRoomData(index, 'name', e.target.value)}
                  placeholder="VD: Phòng Deluxe, Phòng Standard..."
                />
                {errors[index]?.name && <p className="text-red-500 text-xs mt-1">{errors[index].name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Loại giường</label>
                <select
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                  value={room.bedType}
                  onChange={(e) => updateRoomData(index, 'bedType', e.target.value)}
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
                  onChange={(e) => updateRoomData(index, 'roomSize', e.target.value ? parseInt(e.target.value) : 0)}
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
                  onChange={(e) => updateRoomData(index, 'totalRooms', parseInt(e.target.value) || 1)}
                />
                {errors[index]?.totalRooms && <p className="text-red-500 text-xs mt-1">{errors[index].totalRooms}</p>}
              </div>
            </div>
          </div>

          {/* Capacity Information */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center">
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
                  onChange={(e) => updateRoomData(index, 'maxAdults', parseInt(e.target.value) || 1)}
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
                  onChange={(e) => updateRoomData(index, 'maxChildren', parseInt(e.target.value) || 0)}
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
                  onChange={(e) => updateRoomData(index, 'maxGuests', parseInt(e.target.value) || 1)}
                />
                {errors[index]?.maxGuests && <p className="text-red-500 text-xs mt-1">{errors[index].maxGuests}</p>}
              </div>
            </div>
          </div>

          {/* Pricing Information */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center">
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
                  onChange={(e) => updateRoomData(index, 'basePrice', parseInt(e.target.value) || 0)}
                  placeholder="500000"
                />
                {errors[index]?.basePrice && <p className="text-red-500 text-xs mt-1">{errors[index].basePrice}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giá cuối tuần (VND/đêm)
                </label>
                <input
                  type="number"
                  min="0"
                  className={`w-full p-3 border-2 rounded-lg focus:ring-2 focus:ring-pink-500 transition-colors ${
                    errors[index]?.weekendPrice ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-pink-500'
                  }`}
                  value={room.weekendPrice || ''}
                  onChange={(e) => updateRoomData(index, 'weekendPrice', e.target.value ? parseInt(e.target.value) : 0)}
                  placeholder="600000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giá ngày lễ (VND/đêm)
                </label>
                <input
                  type="number"
                  min="0"
                  className={`w-full p-3 border-2 rounded-lg focus:ring-2 focus:ring-pink-500 transition-colors ${
                    errors[index]?.holidayPrice ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-pink-500'
                  }`}
                  value={room.holidayPrice || ''}
                  onChange={(e) => updateRoomData(index, 'holidayPrice', e.target.value ? parseInt(e.target.value) : 0)}
                  placeholder="800000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giảm giá theo tuần (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className={`w-full p-3 border-2 rounded-lg focus:ring-2 focus:ring-pink-500 transition-colors ${
                    errors[index]?.weeklyDiscountPercent ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-pink-500'
                  }`}
                  value={room.weeklyDiscountPercent}
                  onChange={(e) => updateRoomData(index, 'weeklyDiscountPercent', parseInt(e.target.value) || 0)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giảm giá theo tháng (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className={`w-full p-3 border-2 rounded-lg focus:ring-2 focus:ring-pink-500 transition-colors ${
                    errors[index]?.monthlyDiscountPercent ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-pink-500'
                  }`}
                  value={room.monthlyDiscountPercent}
                  onChange={(e) => updateRoomData(index, 'monthlyDiscountPercent', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Mô tả phòng</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả ngắn</label>
                <textarea
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 h-20 resize-none transition-colors"
                  value={room.shortDescription}
                  onChange={(e) => updateRoomData(index, 'shortDescription', e.target.value)}
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
                  onChange={(e) => updateRoomData(index, 'description', e.target.value)}
                  placeholder="Mô tả chi tiết về phòng, view, tiện ích..."
                />
              </div>
            </div>
          </div>

          {/* SEO Information */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Tối ưu SEO</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Meta Title</label>
                <input
                  type="text"
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                  value={room.metaTitle}
                  onChange={(e) => updateRoomData(index, 'metaTitle', e.target.value)}
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
                  onChange={(e) => updateRoomData(index, 'metaDescription', e.target.value)}
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
            onChange={(amenities) => updateRoomData(index, 'amenities', 
              amenities.map(a => ({ amenityId: a.amenityId, quantity: 1 }))
            )}
            title={`Tiện nghi ${room.name}`}
            type="room"
          />

          {/* Room Images Management */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
                <Camera className="w-5 h-5 mr-2 text-orange-600" />
                Quản lý ảnh phòng - {room.name}
              </h3>
              {newRoomImages[room.id] && newRoomImages[room.id].length > 0 && (
                <button
                  onClick={() => uploadRoomImages(room.id)}
                  className="px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 transition-all flex items-center text-sm font-medium"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload {newRoomImages[room.id].length} ảnh
                </button>
              )}
            </div>

            {/* Upload New Images */}
            <div className="border-2 border-dashed border-orange-300 rounded-xl p-6 text-center bg-gradient-to-br from-orange-50 to-yellow-50 hover:from-orange-100 hover:to-yellow-100 transition-all mb-6">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleRoomImageUpload(room.id, e)}
                className="hidden"
                id={`room-images-${room.id}`}
              />
              <label htmlFor={`room-images-${room.id}`} className="cursor-pointer">
                <Upload className="w-10 h-10 mx-auto text-orange-500 mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">Thêm ảnh cho phòng</p>
                <p className="text-sm text-gray-500">Click để chọn nhiều ảnh phòng</p>
              </label>
            </div>

            {/* Current Images */}
            <div className="space-y-6">
              {room.images.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Ảnh hiện tại ({room.images.length})</h4>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {room.images.map((image) => (
                      <div key={image.id} className="relative bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                        <div className="aspect-video relative">
                          <img 
                            src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${image.imageUrl}`}
                            alt={image.title}
                            className="w-full h-full object-cover"
                          />
                          
                          {image.isPrimary && (
                            <div className="absolute top-2 left-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
                              <Star className="w-3 h-3 mr-1 fill-current" />
                              Chính
                            </div>
                          )}
                          
                          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
                            <div className="flex space-x-2">
                              {!image.isPrimary && (
                                <button
                                  onClick={() => setPrimaryRoomImage(image.id, index)}
                                  className="bg-white text-gray-700 p-2 rounded-full hover:bg-yellow-500 hover:text-white transition-colors"
                                  title="Đặt làm ảnh chính"
                                >
                                  <Star className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => deleteRoomImage(image.id, index)}
                                className="bg-white text-gray-700 p-2 rounded-full hover:bg-red-600 hover:text-white transition-colors"
                                title="Xóa ảnh"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-3">
                          <p className="text-sm font-medium text-gray-900 truncate">{image.title}</p>
                          <p className="text-xs text-gray-500 truncate">{image.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Images Preview */}
              {newRoomImages[room.id] && newRoomImages[room.id].length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Ảnh mới ({newRoomImages[room.id].length})</h4>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {newRoomImages[room.id].map((image, imgIndex) => (
                      <div key={imgIndex} className="relative bg-blue-50 border border-blue-200 rounded-lg overflow-hidden shadow-sm">
                        <div className="aspect-video relative">
                          <img 
                            src={image.preview}
                            alt={image.title}
                            className="w-full h-full object-cover"
                          />
                          
                          <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                            Mới
                          </div>
                          
                          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
                            <button
                              onClick={() => removeNewRoomImage(room.id, imgIndex)}
                              className="bg-white text-gray-700 p-2 rounded-full hover:bg-red-600 hover:text-white transition-colors"
                              title="Xóa ảnh"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="p-3 space-y-2">
                          <input
                            type="text"
                            placeholder="Tiêu đề ảnh..."
                            value={image.title}
                            onChange={(e) => {
                              const updatedImages = [...newRoomImages[room.id]]
                              updatedImages[imgIndex] = { ...updatedImages[imgIndex], title: e.target.value }
                              setNewRoomImages(prev => ({ ...prev, [room.id]: updatedImages }))
                            }}
                            className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:ring-1 focus:ring-pink-500"
                          />
                          <textarea
                            placeholder="Mô tả..."
                            value={image.description}
                            onChange={(e) => {
                              const updatedImages = [...newRoomImages[room.id]]
                              updatedImages[imgIndex] = { ...updatedImages[imgIndex], description: e.target.value }
                              setNewRoomImages(prev => ({ ...prev, [room.id]: updatedImages }))
                            }}
                            className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:ring-1 focus:ring-pink-500 h-12 resize-none"
                            maxLength={100}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Room Errors */}
          {errors[index] && Object.keys(errors[index]).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-900 mb-2">
                    Vui lòng kiểm tra lại thông tin {room.name}:
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

      {/* Summary */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 sm:p-6">
        <div className="text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Quản lý property hoàn tất!</h3>
          <p className="text-gray-600 mb-4">
            Bạn đã cập nhật thành công property với {roomTypes.length} loại phòng.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm mb-6">
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="font-medium text-gray-900">Tổng loại phòng</div>
              <div className="text-green-600 text-xl font-bold">{roomTypes.length}</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="font-medium text-gray-900">Tổng số phòng</div>
              <div className="text-green-600 text-xl font-bold">
                {roomTypes.reduce((total, room) => total + room.totalRooms, 0)}
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="font-medium text-gray-900">Ảnh phòng</div>
              <div className="text-green-600 text-xl font-bold">
                {roomTypes.reduce((total, room) => total + room.images.length, 0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6">
        <button
          onClick={prevStep}
          className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center justify-center font-medium text-sm sm:text-base"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Quay lại
        </button>
        
        <button
          onClick={handleFinish}
          className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all flex items-center justify-center font-medium shadow-lg text-sm sm:text-base"
        >
          <CheckCircle className="w-5 h-5 mr-2" />
          Hoàn tất chỉnh sửa
        </button>
      </div>
    </div>
  )
}

export default EditRoomsStep