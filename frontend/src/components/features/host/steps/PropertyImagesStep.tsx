//component/features/host/steps/PropertyImagesStep.tsx
'use client'

import React, { useContext } from 'react'
import { ChevronLeft, ChevronRight, Image as ImageIcon, AlertCircle } from 'lucide-react'
import { WizardContext } from '../CreatePropertyWizard'
import ImageUploader from '../components/ImageUploader'
import { propertyService } from '@/services/main/hostproperty.service'

interface PropertyImagesStepProps {
  setLoading: (loading: boolean) => void
}

const PropertyImagesStep: React.FC<PropertyImagesStepProps> = ({ setLoading }) => {
  const context = useContext(WizardContext)
  if (!context) throw new Error('PropertyImagesStep must be used within WizardContext')

  const {
    propertyImages,
    setPropertyImages,
    createdPropertyId,
    nextStep,
    prevStep
  } = context

  const uploadPropertyImages = async () => {
    if (!createdPropertyId) {
      alert('Lỗi: Không tìm thấy ID property')
      return
    }

    // Allow proceeding even without images
    if (propertyImages.length === 0) {
      nextStep()
      return
    }

    try {
      setLoading(true)
      const formData = new FormData()
      
      propertyImages.forEach((img, index) => {
        formData.append('Files', img.file)
        formData.append('ImageTypes', img.type)
        formData.append('Titles', img.title)
        formData.append('Descriptions', img.description)
        formData.append('IsPrimaries', img.isPrimary.toString())
        formData.append('SortOrders', img.sortOrder.toString())
      })

      const response = await propertyService.uploadPropertyImages(createdPropertyId, formData)
      if (response.success) {
        nextStep()
      } else {
        alert('Lỗi khi upload ảnh: ' + (response.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error uploading images:', error)
      alert('Lỗi khi upload ảnh property')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Upload ảnh property
        </h2>
        <p className="text-gray-600">Thêm ảnh để khách hàng có thể xem trước property của bạn</p>
      </div>

      {/* Image Upload Section */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-6">
        <div className="flex items-center mb-6">
          <ImageIcon className="w-6 h-6 text-pink-600 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900">Ảnh property</h3>
        </div>
        
        <ImageUploader
          images={propertyImages}
          setImages={setPropertyImages}
          title="Chọn ảnh property"
          description="Kéo thả hoặc click để chọn nhiều ảnh (JPG, PNG, WEBP)"
          multiple={true}
          maxImages={20}
          inputId="property-images"
        />
      </div>

      {/* Tips Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start">
          <AlertCircle className="w-6 h-6 text-blue-600 mr-3 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-3">Gợi ý cho ảnh property tốt:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <h5 className="font-medium mb-2">Các loại ảnh nên có:</h5>
                <ul className="space-y-1">
                  <li>• Ảnh mặt tiền/bên ngoài property</li>
                  <li>• Ảnh sảnh/khu vực tiếp khách</li>
                  <li>• Ảnh nhà hàng/quán cà phê (nếu có)</li>
                  <li>• Ảnh hồ bơi/spa/gym (nếu có)</li>
                  <li>• Ảnh khu vực chung</li>
                  <li>• Ảnh từ trên cao/toàn cảnh</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium mb-2">Chất lượng ảnh:</h5>
                <ul className="space-y-1">
                  <li>• Độ phân giải cao (tối thiểu 1920x1080)</li>
                  <li>• Ánh sáng tự nhiên, rõ ràng</li>
                  <li>• Góc chụp đẹp, thể hiện không gian</li>
                  <li>• Không có người trong ảnh</li>
                  <li>• Tránh ảnh mờ, tối, hoặc nghiêng</li>
                  <li>• Thể hiện đúng thực tế property</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-100 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Lưu ý:</strong> Bạn có thể bỏ qua bước này và thêm ảnh sau. 
                Tuy nhiên, property có ảnh sẽ thu hút khách hàng nhiều hơn.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Image Statistics */}
      {propertyImages.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-green-700">
              <ImageIcon className="w-4 h-4 mr-2" />
              <span>Đã upload: {propertyImages.length} ảnh</span>
            </div>
            <div className="flex items-center text-green-700">
              <span>Ảnh chính: {propertyImages.find(img => img.isPrimary)?.title || 'Chưa chọn'}</span>
            </div>
            <div className="text-green-600 text-xs">
              Tổng dung lượng: {Math.round(propertyImages.reduce((total, img) => total + img.file.size, 0) / 1024 / 1024 * 100) / 100} MB
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6">
        <button
          onClick={prevStep}
          className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center font-medium"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Quay lại
        </button>
        
        <div className="flex items-center space-x-4">
          {propertyImages.length === 0 && (
            <span className="text-sm text-gray-500">
              Bạn có thể bỏ qua và thêm ảnh sau
            </span>
          )}
          <button
            onClick={uploadPropertyImages}
            className="px-8 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all flex items-center font-medium shadow-lg"
          >
            {propertyImages.length > 0 ? 'Upload & Tiếp tục' : 'Bỏ qua'}
            <ChevronRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default PropertyImagesStep