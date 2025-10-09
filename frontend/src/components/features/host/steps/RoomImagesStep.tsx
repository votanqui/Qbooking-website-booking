//component/features/host/steps/RoomImagesStep.tsx
'use client'

import React, { useContext } from 'react'
import { ChevronLeft, Check, Image as ImageIcon, AlertCircle, Camera, CheckCircle } from 'lucide-react'
import { WizardContext } from '../CreatePropertyWizard'
import ImageUploader from '../components/ImageUploader'
import { roomService } from '@/services/main/room.service'
import { useToast } from '@/components/ui/Toast'
import { useRouter } from 'next/navigation'

interface RoomImagesStepProps {
  setLoading: (loading: boolean) => void
  onComplete: () => void
}

const RoomImagesStep: React.FC<RoomImagesStepProps> = ({ setLoading, onComplete }) => {
  const context = useContext(WizardContext)
  const { showToast } = useToast()
  const router = useRouter()
  
  if (!context) throw new Error('RoomImagesStep must be used within WizardContext')

  const {
    roomImageUploads,
    setRoomImageUploads,
    prevStep
  } = context

  const handleRoomImageUpload = (roomTypeId: number, files: FileList) => {
    Array.from(files).forEach((file, index) => {
      const reader = new FileReader()
      reader.onload = () => {
        const newImage = {
          file,
          preview: reader.result as string,
          type: 'interior',
          title: file.name.split('.')[0],
          description: '',
          isPrimary: false,
          sortOrder: index + 1
        }

        setRoomImageUploads(prev => prev.map(upload => 
          upload.roomTypeId === roomTypeId 
            ? { ...upload, images: [...upload.images, newImage] }
            : upload
        ))
      }
      reader.readAsDataURL(file)
    })
  }

  const uploadAllRoomImages = async () => {
    try {
      setLoading(true)
      
      // Upload images for each room type
      let uploadedCount = 0
      for (const roomUpload of roomImageUploads) {
        if (roomUpload.images.length > 0) {
          const formData = new FormData()
          
          roomUpload.images.forEach((img, index) => {
            formData.append('Files', img.file)
            formData.append('Titles', img.title)
            formData.append('Descriptions', img.description)
            formData.append('IsPrimaries', (index === 0).toString()) // First image is primary
            formData.append('SortOrders', (index + 1).toString())
          })

          await roomService.uploadRoomImages(roomUpload.roomTypeId, formData)
          uploadedCount += roomUpload.images.length
        }
      }

      // Show success message
      const totalImages = getTotalImagesCount()
      if (totalImages > 0) {
        showToast(
          `Tạo property thành công với ${uploadedCount} ảnh phòng!`,
          'success',
          5000
        )
      } else {
        showToast(
          'Tạo property thành công! Bạn có thể thêm ảnh phòng sau trong dashboard.',
          'success',
          5000
        )
      }

      // Clean up wizard data
      onComplete()
      
      // Navigate to properties manager after a short delay
      setTimeout(() => {
        router.push('/host/propertiesmanager')
      }, 1500)
      
    } catch (error) {
      console.error('Error uploading room images:', error)
      
      // Show error toast
      showToast(
        'Property đã được tạo nhưng có lỗi khi upload ảnh. Bạn có thể thêm ảnh sau trong dashboard.',
        'warning',
        6000
      )
      
      // Still clean up and navigate even if image upload fails
      onComplete()
      setTimeout(() => {
        router.push('/host/propertiesmanager')
      }, 2000)
    } finally {
      setLoading(false)
    }
  }

  const getTotalImagesCount = () => {
    return roomImageUploads.reduce((total, upload) => total + upload.images.length, 0)
  }

  const getRoomImagesCount = (roomTypeId: number) => {
    const upload = roomImageUploads.find(u => u.roomTypeId === roomTypeId)
    return upload ? upload.images.length : 0
  }

  return (
    <div className="space-y-6 sm:space-y-8 px-4 sm:px-0">
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Upload ảnh các loại phòng
        </h2>
        <p className="text-gray-600 text-sm sm:text-base">Bước cuối cùng - Thêm ảnh để khách hàng có thể xem trước các loại phòng</p>
      </div>

      {/* Progress Summary */}
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

      {/* Room Image Upload Sections */}
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

      {/* Tips Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6">
        <div className="flex items-start">
          <AlertCircle className="w-6 h-6 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-900 mb-3">Gợi ý cho ảnh phòng tốt:</h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <h5 className="font-medium mb-2">Các loại ảnh nên có:</h5>
                <ul className="space-y-1">
                  <li>• Ảnh tổng quan toàn bộ phòng</li>
                  <li>• Ảnh giường ngủ và khu vực nghỉ ngơi</li>
                  <li>• Ảnh phòng tắm/toilet</li>
                  <li>• Ảnh khu vực làm việc (nếu có)</li>
                  <li>• Ảnh ban công/view từ phòng (nếu có)</li>
                  <li>• Ảnh các tiện nghi đặc biệt</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium mb-2">Chất lượng ảnh:</h5>
                <ul className="space-y-1">
                  <li>• Ánh sáng tự nhiên, rõ ràng</li>
                  <li>• Góc chụp thể hiện không gian</li>
                  <li>• Phòng sạch sẽ, gọn gàng</li>
                  <li>• Không có đồ cá nhân</li>
                  <li>• Thể hiện đúng kích thước phòng</li>
                  <li>• Chụp từ nhiều góc độ</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-100 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Lưu ý:</strong> Bạn có thể bỏ qua bước này và hoàn tất việc tạo property. 
                Ảnh phòng có thể được thêm sau trong phần quản lý property.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Completion Summary */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4 sm:p-6">
        <div className="text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Sắp hoàn tất!</h3>
          <p className="text-gray-600 mb-4 text-sm sm:text-base">
            Property của bạn đã được tạo thành công. Click "Hoàn tất" để kết thúc quá trình.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="font-medium text-gray-900">Property đã tạo</div>
              <div className="text-green-600">✓ Hoàn tất</div>
            </div>
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

      {/* Navigation Buttons */}
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

export default RoomImagesStep