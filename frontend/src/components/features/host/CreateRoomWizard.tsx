'use client'

import React, { useState, useEffect } from 'react'
import { propertyService } from '@/services/main/hostproperty.service'
import { 
  AmenityCategoryResponse,
  HostRoomTypeDetailResponse
} from '@/types/main/hostproperty'
import StepIndicator from './components/StepIndicator'
import AmenitiesSelector from './components/AmenitiesSelector'
import ImageUploader from './components/ImageUploader'
import { roomService } from '@/services/main/room.service'
import { useToast } from '@/components/ui/Toast'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, AlertCircle, Home, Users, Bed, DollarSign, Percent, Check, Camera, CheckCircle } from 'lucide-react'

export interface ImagePreview {
  file: File
  preview: string
  type: string
  title: string
  description: string
  isPrimary: boolean
  sortOrder: number
}

export interface RoomForm {
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

export interface RoomImageUpload {
  roomTypeId: number
  roomTypeName: string
  images: ImagePreview[]
}

export interface WizardContextType {
  amenityCategories: AmenityCategoryResponse[]
  propertyId: number
  roomCount: number
  setRoomCount: React.Dispatch<React.SetStateAction<number>>
  roomForms: RoomForm[]
  setRoomForms: React.Dispatch<React.SetStateAction<RoomForm[]>>
  createdRoomTypes: HostRoomTypeDetailResponse[]
  roomImageUploads: RoomImageUpload[]
  setRoomImageUploads: React.Dispatch<React.SetStateAction<RoomImageUpload[]>>
  currentStep: number
  completedSteps: number[]
  loading: boolean
  nextStep: () => void
  prevStep: () => void
  updateCompletedSteps: (step: number) => void
}

export const WizardContext = React.createContext<WizardContextType | null>(null)

interface CreateRoomWizardProps {
  propertyId: number
}

export default function CreateRoomWizard({ propertyId }: CreateRoomWizardProps) {
  const [currentStep, setCurrentStep] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(`createRoomStep_${propertyId}`)
      return saved ? parseInt(saved) : 1
    }
    return 1
  })
  
  const [completedSteps, setCompletedSteps] = useState<number[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(`createRoomCompletedSteps_${propertyId}`)
      return saved ? JSON.parse(saved) : []
    }
    return []
  })
  
  const [loading, setLoading] = useState(false)
  const [amenityCategories, setAmenityCategories] = useState<AmenityCategoryResponse[]>([])
  const [roomCount, setRoomCount] = useState(() => {
    const saved = typeof window !== 'undefined' ? sessionStorage.getItem(`roomCount_${propertyId}`) : null
    return saved ? parseInt(saved) : 1
  })
  
  const [roomForms, setRoomForms] = useState<RoomForm[]>([])
  const [createdRoomTypes, setCreatedRoomTypes] = useState<HostRoomTypeDetailResponse[]>([])
  const [roomImageUploads, setRoomImageUploads] = useState<RoomImageUpload[]>([])

  useEffect(() => {
    sessionStorage.setItem(`createRoomStep_${propertyId}`, currentStep.toString())
    sessionStorage.setItem(`createRoomCompletedSteps_${propertyId}`, JSON.stringify(completedSteps))
  }, [currentStep, completedSteps, propertyId])

  useEffect(() => {
    sessionStorage.setItem(`roomCount_${propertyId}`, roomCount.toString())
  }, [roomCount, propertyId])

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true)
        const amenitiesRes = await propertyService.getAmenityCategories()
        setAmenityCategories(amenitiesRes)
      } catch (error) {
        console.error('Error loading initial data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadInitialData()
  }, [])

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

  const nextStep = () => {
    if (currentStep < 3) {
      setCompletedSteps(prev => [...prev, currentStep])
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const updateCompletedSteps = (step: number) => {
    setCompletedSteps(prev => [...prev, step])
  }

  const clearSavedData = () => {
    sessionStorage.removeItem(`createRoomStep_${propertyId}`)
    sessionStorage.removeItem(`createRoomCompletedSteps_${propertyId}`)
    sessionStorage.removeItem(`roomCount_${propertyId}`)
  }

  const contextValue: WizardContextType = {
    amenityCategories,
    propertyId,
    roomCount,
    setRoomCount,
    roomForms,
    setRoomForms,
    createdRoomTypes,
    roomImageUploads,
    setRoomImageUploads,
    currentStep,
    completedSteps,
    loading,
    nextStep,
    prevStep,
    updateCompletedSteps
  }

  const steps = [
    { number: 1, title: 'Số lượng phòng' },
    { number: 2, title: 'Thông tin phòng' },
    { number: 3, title: 'Ảnh phòng' }
  ]

  return (
    <WizardContext.Provider value={contextValue}>
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-cyan-300 via-teal-200 to-blue-300 bg-clip-text text-transparent drop-shadow-[0_2px_6px_rgba(0,0,0,0.3)] mb-2">
            Tạo Loại Phòng Mới
          </h1>
          <p className="text-gray-100 drop-shadow-[0_1px_3px_rgba(0,0,0,0.4)]">
            Hoàn thành các bước để tạo loại phòng cho property của bạn
          </p>
        </div>

        <div className="flex justify-between mb-8 bg-white rounded-xl shadow-lg border p-6 overflow-x-auto">
          <div className="flex space-x-8 mx-auto">
            {steps.map((step) => (
              <StepIndicator
                key={step.number}
                isActive={currentStep === step.number}
                isCompleted={completedSteps.includes(step.number)}
                stepNumber={step.number}
                title={step.title}
              />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border p-4 sm:p-4 md:p-8">
          {currentStep === 1 && <RoomCountStepContent />}
          {currentStep === 2 && <RoomInfoStepContent setLoading={setLoading} />}
          {currentStep === 3 && <RoomImagesStepContent setLoading={setLoading} onComplete={clearSavedData} />}
        </div>

        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 flex items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mr-4"></div>
              <span className="text-lg font-medium">Đang xử lý...</span>
            </div>
          </div>
        )}
      </div>
    </WizardContext.Provider>
  )
}

function RoomCountStepContent() {
  const context = React.useContext(WizardContext)
  if (!context) throw new Error('Must be used within WizardContext')
  const { roomCount, setRoomCount, nextStep } = context
  const router = useRouter()

  const handleRoomCountChange = (newCount: number) => {
    if (newCount >= 1 && newCount <= 10) {
      setRoomCount(newCount)
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Số lượng loại phòng
        </h2>
        <p className="text-gray-600">Bạn muốn tạo bao nhiêu loại phòng khác nhau?</p>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start">
          <AlertCircle className="w-6 h-6 text-blue-600 mr-3 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-3">Thông tin quan trọng</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p><strong>Loại phòng</strong> là các phòng có cùng đặc điểm như diện tích, tiện nghi, giá cả.</p>
              <p>Ví dụ: Phòng Deluxe, Phòng Superior, Phòng Suite... Mỗi loại có thể có nhiều phòng cùng loại.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-8">
        <div className="text-center max-w-md mx-auto">
          <div className="flex items-center justify-center mb-6">
            <Home className="w-8 h-8 text-pink-600 mr-3" />
            <h3 className="text-xl font-semibold text-gray-900">Chọn số lượng loại phòng</h3>
          </div>

          <div className="flex items-center justify-center space-x-4 mb-6">
            <button
              onClick={() => handleRoomCountChange(roomCount - 1)}
              disabled={roomCount <= 1}
              className="w-12 h-12 rounded-full bg-white border-2 border-pink-300 text-pink-600 hover:bg-pink-50 hover:border-pink-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center font-bold text-xl"
            >
              -
            </button>
            
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-1">{roomCount}</div>
              <div className="text-sm text-gray-500">loại phòng</div>
            </div>
            
            <button
              onClick={() => handleRoomCountChange(roomCount + 1)}
              disabled={roomCount >= 10}
              className="w-12 h-12 rounded-full bg-white border-2 border-pink-300 text-pink-600 hover:bg-pink-50 hover:border-pink-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center font-bold text-xl"
            >
              +
            </button>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map(num => (
              <button
                key={num}
                onClick={() => handleRoomCountChange(num)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  roomCount === num
                    ? 'bg-gradient-to-r from-pink-600 to-purple-600 border-pink-600 text-white'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-pink-300 hover:bg-pink-50'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <button
          onClick={() => router.push('/host/propertiesmanager')}
          className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center font-medium"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Quay lại
        </button>
        
        <button
          onClick={nextStep}
          className="px-8 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all flex items-center font-medium shadow-lg"
        >
          Tiếp tục
          <ChevronRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  )
}

function RoomInfoStepContent({ setLoading }: { setLoading: (loading: boolean) => void }) {
  const context = React.useContext(WizardContext)
  if (!context) throw new Error('Must be used within WizardContext')
  const { roomForms, setRoomForms, amenityCategories, propertyId, setRoomImageUploads, nextStep, prevStep } = context
  const [errors, setErrors] = useState<Record<string, Record<string, string>>>({})
  const [activeRoom, setActiveRoom] = useState(0)

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

  const validateAllRooms = () => {
    const allErrors: Record<string, Record<string, string>> = {}
    let hasErrors = false
    roomForms.forEach((room, index) => {
      const roomErrors: Record<string, string> = {}
      if (!room.name?.trim()) roomErrors.name = 'Vui lòng nhập tên phòng'
      if (room.maxAdults < 1) roomErrors.maxAdults = 'Số người lớn tối thiểu là 1'
      if (room.maxGuests < room.maxAdults) roomErrors.maxGuests = 'Tổng số khách phải lớn hơn hoặc bằng số người lớn'
      if (room.basePrice <= 0) roomErrors.basePrice = 'Giá cơ bản phải lớn hơn 0'
      if (room.totalRooms < 1) roomErrors.totalRooms = 'Số phòng cùng loại tối thiểu là 1'
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
    try {
      setLoading(true)
      const bulkRoomRequest = {
        propertyId: propertyId,
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

      {roomForms.map((room, index) => (
        <div key={index} className={`space-y-6 ${activeRoom === index ? 'block' : 'hidden'}`}>
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
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                  value={room.roomSize || ''}
                  onChange={(e) => updateRoomForm(index, 'roomSize', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="VD: 25"
                />
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
              </div>
            </div>
          </div>

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
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                  value={room.maxAdults}
                  onChange={(e) => updateRoomForm(index, 'maxAdults', parseInt(e.target.value) || 1)}
                />
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
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                  value={room.maxGuests}
                  onChange={(e) => updateRoomForm(index, 'maxGuests', parseInt(e.target.value) || 1)}
                />
              </div>
            </div>
          </div>

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
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                  value={room.weekendPrice || ''}
                  onChange={(e) => updateRoomForm(index, 'weekendPrice', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="600000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giá ngày lễ (VND/đêm)
                  <span className="text-xs text-gray-500 ml-1">(để trống = giá cơ bản)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                  value={room.holidayPrice || ''}
                  onChange={(e) => updateRoomForm(index, 'holidayPrice', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="800000"
                />
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
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors pr-10"
                    value={room.weeklyDiscountPercent}
                    onChange={(e) => updateRoomForm(index, 'weeklyDiscountPercent', parseInt(e.target.value) || 0)}
                  />
                  <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
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
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors pr-10"
                    value={room.monthlyDiscountPercent}
                    onChange={(e) => updateRoomForm(index, 'monthlyDiscountPercent', parseInt(e.target.value) || 0)}
                  />
                  <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>

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
        </div>
      ))}

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

function RoomImagesStepContent({ setLoading, onComplete }: { setLoading: (loading: boolean) => void, onComplete: () => void }) {
  const context = React.useContext(WizardContext)
  if (!context) throw new Error('Must be used within WizardContext')
  const { roomImageUploads, setRoomImageUploads, prevStep } = context
  const { showToast } = useToast()
  const router = useRouter()

  const getTotalImagesCount = () => {
    return roomImageUploads.reduce((total, upload) => total + upload.images.length, 0)
  }

  const uploadAllRoomImages = async () => {
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

      const totalImages = getTotalImagesCount()
      if (totalImages > 0) {
        showToast(
          `Tạo loại phòng thành công với ${uploadedCount} ảnh phòng!`,
          'success',
          5000
        )
      } else {
        showToast(
          'Tạo loại phòng thành công! Bạn có thể thêm ảnh phòng sau trong dashboard.',
          'success',
          5000
        )
      }

      onComplete()
      
      setTimeout(() => {
        router.push('/host/propertiesmanager')
      }, 1500)
      
    } catch (error) {
      console.error('Error uploading room images:', error)
      
      showToast(
        'Loại phòng đã được tạo nhưng có lỗi khi upload ảnh. Bạn có thể thêm ảnh sau trong dashboard.',
        'warning',
        6000
      )
      
      onComplete()
      setTimeout(() => {
        router.push('/host/propertiesmanager')
      }, 2000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8 px-4 sm:px-0">
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Upload ảnh các loại phòng
        </h2>
        <p className="text-gray-600 text-sm sm:text-base">Bước cuối cùng - Thêm ảnh để khách hàng có thể xem trước các loại phòng</p>
      </div>

      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
          <div className="flex items-center text-green-700">
            <Camera className="w-5 h-5 mr-2" />
            <span>Tổng ảnh đã upload: {getTotalImagesCount()}</span>
          </div>
          <div className="text-green-600 text-xs">
            {roomImageUploads.filter(upload => upload.images.length > 0).length}/{roomImageUploads.length} loại phòng có ảnh
          </div>
        </div>
      </div>

      <div className="space-y-6 sm:space-y-8">
        {roomImageUploads.map((roomUpload, roomIndex) => (
          <div key={roomUpload.roomTypeId} className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                  {roomIndex + 1}
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">{roomUpload.roomTypeName}</h3>
                {roomUpload.images.length > 0 && (
                  <CheckCircle className="w-5 h-5 text-green-600 ml-3" />
                )}
              </div>
              <div className="text-sm text-gray-600">
                {roomUpload.images.length} ảnh
              </div>
            </div>
            
            <ImageUploader
              images={roomUpload.images}
              setImages={(newImages) => {
                if (typeof newImages === 'function') {
                  setRoomImageUploads(prev => prev.map(upload => 
                    upload.roomTypeId === roomUpload.roomTypeId 
                      ? { ...upload, images: newImages(upload.images) }
                      : upload
                  ))
                } else {
                  setRoomImageUploads(prev => prev.map(upload => 
                    upload.roomTypeId === roomUpload.roomTypeId 
                      ? { ...upload, images: newImages }
                      : upload
                  ))
                }
              }}
              title={`Chọn ảnh cho ${roomUpload.roomTypeName}`}
              description="Kéo thả hoặc click để chọn ảnh phòng"
              multiple={true}
              maxImages={15}
              inputId={`room-images-${roomUpload.roomTypeId}`}
            />
            
            {roomUpload.images.length === 0 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  Chưa có ảnh cho loại phòng này. Bạn có thể thêm ảnh sau trong phần quản lý.
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4 sm:p-6">
        <div className="text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Sắp hoàn tất!</h3>
          <p className="text-gray-600 mb-4 text-sm sm:text-base">
            Các loại phòng của bạn đã được tạo thành công. Click "Hoàn tất" để kết thúc quá trình.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="font-medium text-gray-900">Loại phòng đã tạo</div>
              <div className="text-green-600">✓ {roomImageUploads.length} loại</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="font-medium text-gray-900">Ảnh đã upload</div>
              <div className="text-green-600">✓ {getTotalImagesCount()} ảnh</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6">
        <button
          onClick={prevStep}
          className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center justify-center font-medium text-sm sm:text-base"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Quay lại
        </button>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {getTotalImagesCount() === 0 && (
            <span className="text-sm text-gray-500 text-center">
              Bạn có thể hoàn tất mà không cần upload ảnh
            </span>
          )}
          <button
            onClick={uploadAllRoomImages}
            className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all flex items-center justify-center font-medium shadow-lg text-sm sm:text-base"
          >
            <Check className="w-5 h-5 mr-2" />
            {getTotalImagesCount() > 0 ? 'Upload ảnh & Hoàn tất' : 'Hoàn tất'}
          </button>
        </div>
      </div>
    </div>
  )
}