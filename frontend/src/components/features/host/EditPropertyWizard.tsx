'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { propertyService } from '@/services/main/hostproperty.service'
import { addressService } from '@/services/main/address.service'
import { 
  PropertyForEditResponse,
  UpdatePropertyRequest,
  AmenityCategoryResponse,
  PropertyImageForEdit,
  RoomTypeForEdit,
  PropertyAmenityForEdit
} from '@/types/main/hostproperty'
import { Province, Commune } from '@/types/main/address'

// Import step components - same as create
import StepIndicator from './components/StepIndicator'
import EditBasicInfoStep from './steps/EditBasicInfoStep'
import EditPropertyImagesStep from './steps/EditPropertyImagesStep'
import EditRoomsStep from './steps/EditRoomsStep'

// Types for wizard state
export interface EditWizardContextType {
  // Property ID
  propertyId: number
  
  // Data states
  provinces: Province[]
  communes: Commune[]
  amenityCategories: AmenityCategoryResponse[]
  productTypes: any[]
  
  // Original property data
  originalPropertyData: PropertyForEditResponse | null
  
  // Property data being edited
  propertyData: UpdatePropertyRequest
  setPropertyData: React.Dispatch<React.SetStateAction<UpdatePropertyRequest>>
  
  // Property images
  existingImages: PropertyImageForEdit[]
  setExistingImages: React.Dispatch<React.SetStateAction<PropertyImageForEdit[]>>
  
  // Room types
  roomTypes: RoomTypeForEdit[]
  setRoomTypes: React.Dispatch<React.SetStateAction<RoomTypeForEdit[]>>
  
  // Navigation
  currentStep: number
  loading: boolean
  
  // Functions
  nextStep: () => void
  prevStep: () => void
  goToStep: (step: number) => void
}

export const EditWizardContext = React.createContext<EditWizardContextType | null>(null)

interface EditPropertyWizardProps {
  propertyId: number
}

export default function EditPropertyWizard({ propertyId }: EditPropertyWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  
  // Data states
  const [provinces, setProvinces] = useState<Province[]>([])
  const [communes, setCommunes] = useState<Commune[]>([])
  const [amenityCategories, setAmenityCategories] = useState<AmenityCategoryResponse[]>([])
  const [productTypes, setProductTypes] = useState<any[]>([])
  
  // Original property data from API
  const [originalPropertyData, setOriginalPropertyData] = useState<PropertyForEditResponse | null>(null)
  
  // Property data being edited
  const [propertyData, setPropertyData] = useState<UpdatePropertyRequest>({
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
  })
  
  const [existingImages, setExistingImages] = useState<PropertyImageForEdit[]>([])
  const [roomTypes, setRoomTypes] = useState<RoomTypeForEdit[]>([])

  // Load initial data
  useEffect(() => {
    loadPropertyData()
  }, [propertyId])

  const loadPropertyData = async () => {
    try {
      setInitialLoading(true)
      
      // Load property data and reference data in parallel
      const [propertyRes, provincesRes, amenitiesRes, productTypesRes] = await Promise.all([
        propertyService.getPropertyForEdit(propertyId),
        addressService.getProvinces(),
        propertyService.getAmenityCategories(),
        propertyService.getProductTypes()
      ])

      // Set reference data
      if (provincesRes.success && provincesRes.data) {
        setProvinces(provincesRes.data)
      }
      setAmenityCategories(amenitiesRes)
      if (productTypesRes.success && productTypesRes.data) {
        setProductTypes(productTypesRes.data)
      }

      // Handle property data
      if (!propertyRes.success || !propertyRes.data) {
        alert(propertyRes.message || 'Không thể tải thông tin property')
        router.push('/host/propertiesmanager')
        return
      }

      const data = propertyRes.data
      setOriginalPropertyData(data)

      // Populate edit form
      setPropertyData({
        name: data.name,
        productTypeId: data.productTypeId,
        description: data.description,
        shortDescription: data.shortDescription,
        addressDetail: data.addressDetail,
        communeId: data.communeId,
        provinceId: data.provinceId,
        postalCode: data.postalCode,
        latitude: data.latitude,
        longitude: data.longitude,
        starRating: data.starRating,
        totalRooms: data.totalRooms,
        establishedYear: data.establishedYear,
        checkInTime: data.checkInTime,
        checkOutTime: data.checkOutTime,
        minStayNights: data.minStayNights,
        maxStayNights: data.maxStayNights,
        cancellationPolicy: data.cancellationPolicy,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        metaKeywords: data.metaKeywords,
        priceFrom: data.priceFrom,
        currency: data.currency,
        amenities: data.amenities
      })

      setExistingImages(data.images)
      setRoomTypes(data.roomTypes)

      // Load communes for selected province
      if (data.provinceId && provincesRes.data) {
        const province = provincesRes.data.find((p: Province) => p.id === data.provinceId)
        if (province) {
          const communesRes = await addressService.getCommunesByProvince(province.code)
          if (communesRes.success && communesRes.data) {
            setCommunes(communesRes.data.items)
          }
        }
      }

    } catch (error) {
      console.error('Error loading property data:', error)
      alert('Lỗi khi tải dữ liệu property')
      router.push('/host/propertiesmanager')
    } finally {
      setInitialLoading(false)
    }
  }

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
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const goToStep = (step: number) => {
    if (step >= 1 && step <= 3) {
      setCurrentStep(step)
    }
  }

  const contextValue: EditWizardContextType = {
    propertyId,
    provinces,
    communes,
    amenityCategories,
    productTypes,
    originalPropertyData,
    propertyData,
    setPropertyData,
    existingImages,
    setExistingImages,
    roomTypes,
    setRoomTypes,
    currentStep,
    loading,
    nextStep,
    prevStep,
    goToStep
  }

  const steps = [
    { number: 1, title: 'Thông tin cơ bản' },
    { number: 2, title: 'Ảnh Property' },
    { number: 3, title: 'Quản lý phòng' }
  ]

  if (initialLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải thông tin property...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <EditWizardContext.Provider value={contextValue}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-cyan-300 via-teal-200 to-blue-300 bg-clip-text text-transparent drop-shadow-[0_2px_6px_rgba(0,0,0,0.3)] mb-2">
            Chỉnh Sửa Property
          </h1>
          <p className="text-gray-100 drop-shadow-[0_1px_3px_rgba(0,0,0,0.4)]">
            {originalPropertyData?.name || 'Đang tải...'}
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex justify-between mb-8 bg-white rounded-xl shadow-lg border p-6 overflow-x-auto">
          <div className="flex space-x-8 mx-auto">
            {steps.map((step) => (
              <button
                key={step.number}
                onClick={() => goToStep(step.number)}
                disabled={loading}
              >
                <StepIndicator
                  isActive={currentStep === step.number}
                  isCompleted={currentStep > step.number}
                  stepNumber={step.number}
                  title={step.title}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-lg border p-4 sm:p-4 md:p-8">
          {currentStep === 1 && (
            <EditBasicInfoStep setLoading={setLoading} />
          )}
          {currentStep === 2 && (
            <EditPropertyImagesStep setLoading={setLoading} />
          )}
          {currentStep === 3 && (
            <EditRoomsStep setLoading={setLoading} />
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
    </EditWizardContext.Provider>
  )
}