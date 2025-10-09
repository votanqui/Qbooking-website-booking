//component/features/host/CreatePropertyWizard.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { propertyService } from '@/services/main/hostproperty.service'
import { addressService } from '@/services/main/address.service'
import { 
  CreatePropertyRequest,
  AmenityCategoryResponse,
  HostRoomTypeDetailResponse
} from '@/types/main/hostproperty'
import { Province, Commune } from '@/types/main/address'

// Import step components
import StepIndicator from './components/StepIndicator'
import BasicInfoStep from './steps/BasicInfoStep'
import PropertyImagesStep from './steps/PropertyImagesStep'
import RoomCountStep from './steps/RoomCountStep'
import RoomInfoStep from './steps/RoomInfoStep'
import RoomImagesStep from './steps/RoomImagesStep'

// Types for wizard state
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

// Context for wizard state
export interface WizardContextType {
  // Data states
  provinces: Province[]
  communes: Commune[]
  amenityCategories: AmenityCategoryResponse[]
  productTypes: any[]
  
  // Property data
  propertyData: CreatePropertyRequest
  setPropertyData: React.Dispatch<React.SetStateAction<CreatePropertyRequest>>
  propertyImages: ImagePreview[]
  setPropertyImages: React.Dispatch<React.SetStateAction<ImagePreview[]>>
  
  // Room data
  roomCount: number
  setRoomCount: React.Dispatch<React.SetStateAction<number>>
  roomForms: RoomForm[]
  setRoomForms: React.Dispatch<React.SetStateAction<RoomForm[]>>
  createdRoomTypes: HostRoomTypeDetailResponse[]
  roomImageUploads: RoomImageUpload[]
  setRoomImageUploads: React.Dispatch<React.SetStateAction<RoomImageUpload[]>>
  
  // Navigation
  currentStep: number
  completedSteps: number[]
  loading: boolean
  createdPropertyId: number | null
  
  // Functions
  nextStep: () => void
  prevStep: () => void
  updateCompletedSteps: (step: number) => void
}

export const WizardContext = React.createContext<WizardContextType | null>(null)

export default function CreatePropertyWizard() {
  const [currentStep, setCurrentStep] = useState(() => {
    // Get saved step from sessionStorage to prevent reload issues
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('createPropertyStep')
      return saved ? parseInt(saved) : 1
    }
    return 1
  })
  
  const [completedSteps, setCompletedSteps] = useState<number[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('createPropertyCompletedSteps')
      return saved ? JSON.parse(saved) : []
    }
    return []
  })
  
  const [loading, setLoading] = useState(false)
  
  // Data states
  const [provinces, setProvinces] = useState<Province[]>([])
  const [communes, setCommunes] = useState<Commune[]>([])
  const [amenityCategories, setAmenityCategories] = useState<AmenityCategoryResponse[]>([])
  const [productTypes, setProductTypes] = useState<any[]>([])
  
  // Property data
  const [propertyData, setPropertyData] = useState<CreatePropertyRequest>(() => {
    const saved = typeof window !== 'undefined' ? sessionStorage.getItem('createPropertyData') : null
    return saved ? JSON.parse(saved) : {
      name: '',
      productTypeId: 0,
      description: '',
      shortDescription: '',
      addressDetail: '',
      communeId: 0,
      provinceId: 0,
      postalCode: '',
      latitude: 0,
      longitude: 0,
      starRating: 0,
      totalRooms: 1,
      establishedYear: new Date().getFullYear(),
      checkInTime: '14:00',
      checkOutTime: '11:00',
      minStayNights: 1,
      maxStayNights: 30,
      cancellationPolicy: 'flexible',
      metaTitle: '',
      metaDescription: '',
      metaKeywords: '',
      priceFrom: 0,
      currency: 'VND',
      amenities: []
    }
  })
  
  const [propertyImages, setPropertyImages] = useState<ImagePreview[]>([])
  const [createdPropertyId, setCreatedPropertyId] = useState<number | null>(() => {
    const saved = typeof window !== 'undefined' ? sessionStorage.getItem('createdPropertyId') : null
    return saved ? parseInt(saved) : null
  })
  
  // Room data
  const [roomCount, setRoomCount] = useState(() => {
    const saved = typeof window !== 'undefined' ? sessionStorage.getItem('roomCount') : null
    return saved ? parseInt(saved) : 1
  })
  
  const [roomForms, setRoomForms] = useState<RoomForm[]>([])
  const [createdRoomTypes, setCreatedRoomTypes] = useState<HostRoomTypeDetailResponse[]>([])
  const [roomImageUploads, setRoomImageUploads] = useState<RoomImageUpload[]>([])

  // Save state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('createPropertyStep', currentStep.toString())
    sessionStorage.setItem('createPropertyCompletedSteps', JSON.stringify(completedSteps))
  }, [currentStep, completedSteps])

  useEffect(() => {
    sessionStorage.setItem('createPropertyData', JSON.stringify(propertyData))
  }, [propertyData])

  useEffect(() => {
    sessionStorage.setItem('roomCount', roomCount.toString())
  }, [roomCount])

  useEffect(() => {
    if (createdPropertyId) {
      sessionStorage.setItem('createdPropertyId', createdPropertyId.toString())
    }
  }, [createdPropertyId])

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true)
        const [provincesRes, amenitiesRes, productTypesRes] = await Promise.all([
          addressService.getProvinces(),
          propertyService.getAmenityCategories(),
          propertyService.getProductTypes()
        ])
        
        if (provincesRes.success && provincesRes.data) {
          setProvinces(provincesRes.data)
        }
        setAmenityCategories(amenitiesRes)
        if (productTypesRes.success && productTypesRes.data) {
          setProductTypes(productTypesRes.data)
        }
      } catch (error) {
        console.error('Error loading initial data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadInitialData()
  }, [])

  // Load communes when province changes
  useEffect(() => {
    const loadCommunes = async () => {
      if (propertyData.provinceId) {
        const province = provinces.find(p => p.id === propertyData.provinceId)
        if (province) {
          const communesRes = await addressService.getCommunesByProvince(province.code)
          if (communesRes.success && communesRes.data) {
            setCommunes(communesRes.data.items)
          }
        }
      }
    }
    
    loadCommunes()
  }, [propertyData.provinceId, provinces])

  const nextStep = () => {
    if (currentStep < 5) {
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

  // Clear all saved data when wizard completes
  const clearSavedData = () => {
    sessionStorage.removeItem('createPropertyStep')
    sessionStorage.removeItem('createPropertyCompletedSteps')
    sessionStorage.removeItem('createPropertyData')
    sessionStorage.removeItem('roomCount')
    sessionStorage.removeItem('createdPropertyId')
  }

  const contextValue: WizardContextType = {
    // Data states
    provinces,
    communes,
    amenityCategories,
    productTypes,
    
    // Property data
    propertyData,
    setPropertyData,
    propertyImages,
    setPropertyImages,
    
    // Room data
    roomCount,
    setRoomCount,
    roomForms,
    setRoomForms,
    createdRoomTypes,
    roomImageUploads,
    setRoomImageUploads,
    
    // Navigation
    currentStep,
    completedSteps,
    loading,
    createdPropertyId,
    
    // Functions
    nextStep,
    prevStep,
    updateCompletedSteps
  }

  const steps = [
    { number: 1, title: 'Thông tin cơ bản' },
    { number: 2, title: 'Ảnh Property' },
    { number: 3, title: 'Số lượng phòng' },
    { number: 4, title: 'Thông tin phòng' },
    { number: 5, title: 'Ảnh phòng' }
  ]

  return (
    <WizardContext.Provider value={contextValue}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
  <h1
    className="text-3xl font-extrabold bg-gradient-to-r from-cyan-300 via-teal-200 to-blue-300
               bg-clip-text text-transparent drop-shadow-[0_2px_6px_rgba(0,0,0,0.3)] mb-2">
    Tạo Property Mới
  </h1>
  <p className="text-gray-100 drop-shadow-[0_1px_3px_rgba(0,0,0,0.4)]">
    Hoàn thành các bước để tạo property của bạn
  </p>
</div>

        {/* Step Indicator */}
        <div className="flex justify-between mb-8 bg-white rounded-xl shadow-lg border p-6 overflow-x-auto">
          <div className="flex space-x-8 mx-auto">
            {steps.map((step, index) => (
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

        {/* Step Content */}
       <div className="bg-white rounded-xl shadow-lg border p-4 sm:p-4 md:p-8">
          {currentStep === 1 && (
            <BasicInfoStep 
              setLoading={setLoading}
              setCreatedPropertyId={setCreatedPropertyId}
            />
          )}
          {currentStep === 2 && (
            <PropertyImagesStep
              setLoading={setLoading}
            />
          )}
          {currentStep === 3 && <RoomCountStep />}
          {currentStep === 4 && (
            <RoomInfoStep
              setLoading={setLoading}
              setCreatedRoomTypes={setCreatedRoomTypes}
            />
          )}
          {currentStep === 5 && (
            <RoomImagesStep
              setLoading={setLoading}
              onComplete={clearSavedData}
            />
          )}
        </div>

        {/* Loading Overlay */}
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