'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { propertyService } from '@/services/main/hostproperty.service'
import { roomService } from '@/services/main/room.service'
import { 
  AmenityCategoryResponse,
  HostRoomTypeDetailResponse
} from '@/types/main/hostproperty'
import { ChevronLeft, Check, AlertCircle } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

// Import components (you'll need to create these or reuse from wizard)
import StepIndicator from '@/components/host/steps/StepIndicator'
import AmenitiesSelector from '@/components/host/steps/AmenitiesSelector'
import ImageUploader from '@/components/host/steps/ImageUploader'

// Types
interface ImagePreview {
  file: File
  preview: string
  type: string
  title: string
  description: string
  isPrimary: boolean
  sortOrder: number
}

interface RoomForm {
  name: string
  description: string
  shortDescription: string
  maxAdults: number
  maxChildren: number
  maxGuests: number
  bedType: string
  roomSize: number | null
  basePrice: number
  weekendPrice: number | null
  holidayPrice: number | null
  weeklyDiscountPercent: number
  monthlyDiscountPercent: number
  totalRooms: number
  metaTitle: string
  metaDescription: string
  amenities: Array<{ amenityId: number, quantity: number }>
}

interface RoomImageUpload {
  roomTypeId: number
  roomTypeName: string
  images: ImagePreview[]
}

export default function CreateRoomWizard() {
  const router = useRouter()
  const params = useParams()
  const propertyId = parseInt(params?.id as string)
  const { showToast } = useToast()

  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  
  // Data
  const [amenityCategories, setAmenityCategories] = useState<AmenityCategoryResponse[]>([])
  const [roomCount, setRoomCount] = useState(1)
  const [roomForms, setRoomForms] = useState<RoomForm[]>([])
  const [createdRoomTypes, setCreatedRoomTypes] = useState<HostRoomTypeDetailResponse[]>([])
  const [roomImageUploads, setRoomImageUploads] = useState<RoomImageUpload[]>([])
  const [errors, setErrors] = useState<Record<string, Record<string, string>>>({})
  const [activeRoom, setActiveRoom] = useState(0)

  // Load amenities
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const amenitiesRes = await propertyService.getAmenityCategories()
        setAmenityCategories(amenitiesRes)
      } catch (error) {
        console.error('Error loading data:', error)
        showToast('Lỗi khi tải dữ liệu', 'error')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Initialize room forms when count changes
  useEffect(() => {
    if (roomCount > 0) {
      const newRoomForms: RoomForm[] = Array.from({ length: roomCount }, (_, index) => ({
        name: `Loại phòng ${index + 1}`,
        description: '',
        shortDescription: '',
        maxAdults: 2,
        maxChildren: 1,
        maxGuests: 3,
        bedType: 'double',
        roomSize: null,
        basePrice: 500000,
        weekendPrice: null,
        holidayPrice: null,
        weeklyDiscountPercent: 0,
        monthlyDiscountPercent: 0,
        totalRooms: 1,
        metaTitle: '',
        metaDescription: '',
        amenities: []
      }))
      setRoomForms(newRoomForms)
    }
  }, [roomCount])

  const steps = [
    { number: 1, title: 'Số lượng phòng' },
    { number: 2, title: 'Thông tin phòng' },
    { number: 3, title: 'Ảnh phòng' }
  ]

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const updateRoomForm = (index: number, field: string, value: any) => {
    const newRooms = [...roomForms]
    newRooms[index] = { ...newRooms[index], [field]: value }
    setRoomForms(newRooms)
    if (errors[index]?.[field]) {
      const newErrors = { ...errors }
      delete newErrors[index][field]
      setErrors(newErrors)
    }
  }

  const validateRoom = (roomIndex: number) => {
    const room = roomForms[roomIndex]
    const roomErrors: Record<string, string> = {}

    if (!room.name?.trim()) roomErrors.name = 'Vui lòng nhập tên phòng'
    if (room.maxAdults < 1) roomErrors.maxAdults = 'Số người lớn tối thiểu là 1'
    if (room.maxGuests < room.maxAdults) roomErrors.maxGuests = 'Tổng số khách phải lớn hơn hoặc bằng số người lớn'
    if (room.basePrice <= 0) roomErrors.basePrice = 'Giá cơ bản phải lớn hơn 0'
    if (room.totalRooms < 1) roomErrors.totalRooms = 'Số phòng cùng loại tối thiểu là 1'

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

  const handleCreateRooms = async () => {
    if (!validateAllRooms()) {
      showToast('Vui lòng kiểm tra lại thông tin các phòng', 'error')
      return
    }

    try {
      setLoading(true)
      const bulkRoomRequest = {
        propertyId,
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
        const roomTypesRes = await roomService.getRoomTypesByProperty(propertyId)
        if (roomTypesRes.success && roomTypesRes.data) {
          setCreatedRoomTypes(roomTypesRes.data.roomTypes)
          const imageUploads = roomTypesRes.data.roomTypes
            .slice(-roomCount)
            .map(room => ({
              roomTypeId: room.id,
              roomTypeName: room.name,
              images: []
            }))
          setRoomImageUploads(imageUploads)
        }
        nextStep()
      } else {
        showToast('Lỗi khi tạo phòng: ' + response.message, 'error')
      }
    } catch (error) {
      console.error('Error creating rooms:', error)
      showToast('Lỗi khi tạo phòng', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleUploadImages = async () => {
    try {
      setLoading(true)
      let uploadedCount = 0
      
      for (const roomUpload of roomImageUploads) {
        if (roomUpload.images.length > 0) {
          const formData = new FormData()
          roomUpload.images.forEach((img, index) => {
            formData.append('Files', img.file)
            formData.append('Titles', img.title)
            formData.append('Descriptions', img.description)
            formData.append('IsPrimaries', (index === 0).toString())
            formData.append('SortOrders', (index + 1).toString())
          })
          await roomService.uploadRoomImages(roomUpload.roomTypeId, formData)
          uploadedCount += roomUpload.images.length
        }
      }

      showToast(
        uploadedCount > 0 
          ? `Tạo ${roomCount} loại phòng thành công với ${uploadedCount} ảnh!`
          : `Tạo ${roomCount} loại phòng thành công!`,
        'success',
        5000
      )
      
      setTimeout(() => router.push('/host/propertiesmanager'), 1500)
    } catch (error) {
      console.error('Error uploading images:', error)
      showToast('Phòng đã được tạo nhưng có lỗi khi upload ảnh', 'warning', 6000)
      setTimeout(() => router.push('/host/propertiesmanager'), 2000)
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
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-cyan-300 via-teal-200 to-blue-300 bg-clip-text text-transparent drop-shadow-[0_2px_6px_rgba(0,0,0,0.3)] mb-2">
          Tạo Phòng Mới
        </h1>
        <p className="text-gray-600">Thêm loại phòng mới cho property của bạn</p>
      </div>

      {/* Steps */}
      <div className="flex justify-between mb-8 bg-white rounded-xl shadow-lg border p-6">
        <div className="flex space-x-8 mx-auto">
          {steps.map(step => (
            <StepIndicator
              key={step.number}
              isActive={currentStep === step.number}
              isCompleted={currentStep > step.number}
              stepNumber={step.number}
              title={step.title}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-lg border p-8">
        {/* Step 1: Room Count */}
        {currentStep === 1 && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Số lượng loại phòng
              </h2>
              <p className="text-gray-600">Bạn muốn tạo bao nhiêu loại phòng?</p>
            </div>

            <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-8">
              <div className="text-center max-w-md mx-auto">
                <div className="flex items-center justify-center space-x-4 mb-6">
                  <button
                    onClick={() => setRoomCount(Math.max(1, roomCount - 1))}
                    className="w-12 h-12 rounded-full bg-white border-2 border-pink-300 text-pink-600 hover:bg-pink-50"
                  >
                    -
                  </button>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900">{roomCount}</div>
                    <div className="text-sm text-gray-500">loại phòng</div>
                  </div>
                  <button
                    onClick={() => setRoomCount(Math.min(10, roomCount + 1))}
                    className="w-12 h-12 rounded-full bg-white border-2 border-pink-300 text-pink-600 hover:bg-pink-50"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => router.back()}
                className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4 inline mr-2" />
                Hủy
              </button>
              <button
                onClick={nextStep}
                className="px-8 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg"
              >
                Tiếp tục
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Room Info */}
        {currentStep === 2 && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Thông tin các loại phòng
              </h2>
            </div>

            {/* Room Tabs */}
            <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
              <div className="flex">
                {roomForms.map((room, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveRoom(index)}
                    className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 ${
                      activeRoom === index
                        ? 'border-pink-500 text-pink-600 bg-pink-50'
                        : 'border-transparent text-gray-600'
                    }`}
                  >
                    {room.name || `Loại ${index + 1}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Room Forms */}
            {roomForms.map((room, index) => (
              <div key={index} className={activeRoom === index ? 'block space-y-6' : 'hidden'}>
                {/* Basic Info */}
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Thông tin cơ bản</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Tên loại phòng *</label>
                      <input
                        type="text"
                        className="w-full p-3 border-2 rounded-lg"
                        value={room.name}
                        onChange={(e) => updateRoomForm(index, 'name', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Loại giường</label>
                      <select
                        className="w-full p-3 border-2 rounded-lg"
                        value={room.bedType}
                        onChange={(e) => updateRoomForm(index, 'bedType', e.target.value)}
                      >
                        {bedTypeOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Giá cơ bản (VND) *</label>
                      <input
                        type="number"
                        className="w-full p-3 border-2 rounded-lg"
                        value={room.basePrice}
                        onChange={(e) => updateRoomForm(index, 'basePrice', parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Số phòng cùng loại *</label>
                      <input
                        type="number"
                        className="w-full p-3 border-2 rounded-lg"
                        value={room.totalRooms}
                        onChange={(e) => updateRoomForm(index, 'totalRooms', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </div>

                {/* Amenities */}
                <AmenitiesSelector
                  amenityCategories={amenityCategories}
                  selectedAmenities={room.amenities.map(a => ({ 
                    amenityId: a.amenityId, 
                    isFree: true, 
                    additionalInfo: '' 
                  }))}
                  onChange={(amenities) => updateRoomForm(index, 'amenities', 
                    amenities.map(a => ({ amenityId: a.amenityId, quantity: 1 }))
                  )}
                  title={`Tiện nghi ${room.name}`}
                  type="room"
                />
              </div>
            ))}

            <div className="flex justify-between">
              <button onClick={prevStep} className="px-6 py-3 border-2 rounded-lg">
                <ChevronLeft className="w-4 h-4 inline mr-2" />
                Quay lại
              </button>
              <button
                onClick={handleCreateRooms}
                className="px-8 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg"
              >
                Tạo phòng
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Images */}
        {currentStep === 3 && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Upload ảnh các loại phòng
              </h2>
            </div>

            {roomImageUploads.map((upload, index) => (
              <div key={upload.roomTypeId} className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">{upload.roomTypeName}</h3>
                <ImageUploader
                  images={upload.images}
                  setImages={(newImages) => {
                    setRoomImageUploads(prev => prev.map(u => 
                      u.roomTypeId === upload.roomTypeId 
                        ? { ...u, images: typeof newImages === 'function' ? newImages(u.images) : newImages }
                        : u
                    ))
                  }}
                  title={`Ảnh ${upload.roomTypeName}`}
                  description="Chọn ảnh phòng"
                  multiple={true}
                  maxImages={15}
                  inputId={`room-${upload.roomTypeId}`}
                />
              </div>
            ))}

            <div className="flex justify-between">
              <button onClick={prevStep} className="px-6 py-3 border-2 rounded-lg">
                <ChevronLeft className="w-4 h-4 inline mr-2" />
                Quay lại
              </button>
              <button
                onClick={handleUploadImages}
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg"
              >
                <Check className="w-4 h-4 inline mr-2" />
                Hoàn tất
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mr-4"></div>
            <span>Đang xử lý...</span>
          </div>
        </div>
      )}
    </div>
  )
}