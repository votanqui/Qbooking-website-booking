'use client'

import React, { useContext, useState } from 'react'
import { ChevronLeft, ChevronRight, Image as ImageIcon, Upload, X, Star, Trash2, AlertCircle } from 'lucide-react'
import { EditWizardContext } from '../EditPropertyWizard'
import { propertyService } from '@/services/main/hostproperty.service'
import { PropertyImageForEdit } from '@/types/main/hostproperty'
import { useToast } from '@/components/ui/Toast'
interface EditPropertyImagesStepProps {
  setLoading: (loading: boolean) => void
}

interface NewImagePreview {
  file: File
  preview: string
  type: string
  title: string
  description: string
  isPrimary: boolean
  sortOrder: number
}

const EditPropertyImagesStep: React.FC<EditPropertyImagesStepProps> = ({ setLoading }) => {
  const context = useContext(EditWizardContext)
  if (!context) throw new Error('EditPropertyImagesStep must be used within EditWizardContext')
    const { showToast } = useToast()
  const {
    propertyId,
    existingImages,
    setExistingImages,
    prevStep,
    nextStep
  } = context

  const [newImages, setNewImages] = useState<NewImagePreview[]>([])
  const [draggedId, setDraggedId] = useState<string | null>(null)

  // Handle file upload for new images
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    Array.from(files).forEach((file, index) => {
      const reader = new FileReader()
      reader.onload = () => {
        const newImage: NewImagePreview = {
          file,
          preview: reader.result as string,
          type: 'main',
          title: file.name.split('.')[0],
          description: '',
          isPrimary: existingImages.length === 0 && newImages.length === 0 && index === 0,
          sortOrder: existingImages.length + newImages.length + index + 1
        }
        setNewImages(prev => [...prev, newImage])
      }
      reader.readAsDataURL(file)
    })

    // Reset input
    event.target.value = ''
  }

  // Remove new image before upload
  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index))
  }

  // Delete existing image
  const deleteExistingImage = async (imageId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa ảnh này?')) return

    try {
      setLoading(true)
      const response = await propertyService.deletePropertyImage(imageId)
      if (response.success) {
        setExistingImages(prev => prev.filter(img => img.id !== imageId))
       showToast('Xóa ảnh thành công!', 'success')
      } else {
        showToast(response.message || 'Lỗi khi xóa ảnh', 'error')
      }
    } catch (error) {
      console.error('Error deleting image:', error)
    showToast('Lỗi khi xóa ảnh', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Set primary image
  const setPrimaryImage = async (imageId: number) => {
    try {
      setLoading(true)
      const response = await propertyService.setPrimaryPropertyImage(imageId)
      if (response.success) {
        setExistingImages(prev => prev.map(img => ({
          ...img,
          isPrimary: img.id === imageId
        })))
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

  // Update new image info
  const updateNewImageInfo = (index: number, field: 'title' | 'description' | 'type', value: string) => {
    setNewImages(prev => prev.map((img, i) => i === index ? { ...img, [field]: value } : img))
  }

  // Set primary new image
  const setPrimaryNewImage = (index: number) => {
    setNewImages(prev => prev.map((img, i) => ({
      ...img,
      isPrimary: i === index
    })))
    // Also remove primary from existing images if setting a new image as primary
    setExistingImages(prev => prev.map(img => ({ ...img, isPrimary: false })))
  }

  // Upload new images
  const uploadNewImages = async () => {
    if (newImages.length === 0) {
      nextStep()
      return
    }

    try {
      setLoading(true)
      const formData = new FormData()
      
      newImages.forEach((img, index) => {
        formData.append('Files', img.file)
        formData.append('ImageTypes', img.type)
        formData.append('Titles', img.title)
        formData.append('Descriptions', img.description)
        formData.append('IsPrimaries', img.isPrimary.toString())
        formData.append('SortOrders', img.sortOrder.toString())
      })

      const response = await propertyService.uploadPropertyImages(propertyId, formData)
      if (response.success) {
        // Refresh existing images by calling the API to get updated list
        const propertyResponse = await propertyService.getPropertyForEdit(propertyId)
        if (propertyResponse.success && propertyResponse.data) {
          setExistingImages(propertyResponse.data.images)
        }
        setNewImages([]) // Clear new images after successful upload
         showToast(`Upload ${newImages.length} ảnh thành công!`, 'success')
        nextStep()
      } else {
         showToast(response.message || 'Lỗi khi upload ảnh', 'error')
      }
    } catch (error) {
      console.error('Error uploading images:', error)
        showToast('Lỗi khi upload ảnh property', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Get all images (existing + new) for display
  const getAllImages = () => {
    return [
      ...existingImages.map(img => ({ ...img, isExisting: true })),
      ...newImages.map((img, index) => ({ ...img, isExisting: false, tempIndex: index }))
    ]
  }

  const totalImages = existingImages.length + newImages.length
  const primaryImage = getAllImages().find(img => img.isPrimary)

  return (
    <div className="space-y-6 sm:space-y-8 px-4 sm:px-0">
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Quản lý ảnh property
        </h2>
        <p className="text-gray-600 text-sm sm:text-base">Chỉnh sửa, thêm mới hoặc xóa ảnh property của bạn</p>
      </div>

      {/* Current Images Status */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
          <div className="flex items-center text-blue-700">
            <ImageIcon className="w-5 h-5 mr-2" />
            <span>Tổng ảnh: {totalImages} (Hiện tại: {existingImages.length}, Mới: {newImages.length})</span>
          </div>
          <div className="text-blue-600">
            Ảnh chính: {primaryImage ? 
              (primaryImage.isExisting ? 'Ảnh hiện tại' : 'Ảnh mới') : 
              'Chưa có'
            }
          </div>
        </div>
      </div>

      {/* Upload New Images */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Upload className="w-5 h-5 mr-2 text-pink-600" />
          Thêm ảnh mới
        </h3>
        
        <div className="border-2 border-dashed border-pink-300 rounded-xl p-6 sm:p-8 text-center bg-gradient-to-br from-pink-50 to-purple-50 hover:from-pink-100 hover:to-purple-100 transition-all">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id="new-images-upload"
          />
          <label htmlFor="new-images-upload" className="cursor-pointer">
            <Upload className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-pink-500 mb-4" />
            <p className="text-base sm:text-lg font-medium text-gray-700 mb-2">Chọn ảnh để thêm</p>
            <p className="text-sm text-gray-500">Kéo thả hoặc click để chọn nhiều ảnh (JPG, PNG, WEBP)</p>
          </label>
        </div>
      </div>

      {/* All Images Display */}
      {totalImages > 0 && (
        <div className="bg-white rounded-xl p-4 sm:p-6 border shadow-sm">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-6">Tất cả ảnh property</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {getAllImages().map((image, index) => {
              const isExisting = 'id' in image
              const imageKey = isExisting ? `existing-${image.id}` : `new-${image.tempIndex}`
              
              return (
                <div key={imageKey} className="relative bg-gray-50 border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {/* Image */}
                  <div className="aspect-video relative">
                    <img 
                      src={isExisting ? 
                        `${process.env.NEXT_PUBLIC_API_BASE_URL}${image.imageUrl}` : 
                        image.preview
                      } 
                      alt={`${image.title || 'Property image'} ${index + 1}`} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Image load error:', e)
                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMiA4QzEzLjEgOCAxNCA4LjkgMTQgMTBDMTQgMTEuMSAxMy4xIDEyIDEyIDEyQzEwLjkgMTIgMTAgMTEuMSAxMCAxMEMxMCA4LjkgMTAuOSA4IDEyIDhaIiBmaWxsPSIjOUI5QjlCIi8+CjxwYXRoIGQ9Ik01IDE4TDE5IDE4TDE2IDE0TDEzIDE2TDEwIDE0TDUgMThaTTMgNFYyMEMzIDIxLjEgMy45IDIyIDUgMjJIMTlDMjAuMSAyMiAyMSAyMS4xIDIxIDIwVjRDMjEgMi45IDIwLjEgMiAxOSAySDVDMy45IDIgMyAyLjkgMyA0WiIgZmlsbD0iIzlCOUI5QiIvPgo8L3N2Zz4K'
                      }}
                    />
                    
                    {/* Status Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {image.isPrimary && (
                        <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
                          <Star className="w-3 h-3 mr-1 fill-current" />
                          Ảnh chính
                        </div>
                      )}
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isExisting 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {isExisting ? 'Hiện tại' : 'Mới'}
                      </div>
                    </div>
                    
                    {/* Actions Overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
                      <div className="flex space-x-2">
                        {!image.isPrimary && (
                          <button
                            onClick={() => {
                              if (isExisting) {
                                setPrimaryImage(image.id)
                              } else {
                                setPrimaryNewImage(image.tempIndex!)
                              }
                            }}
                            className="bg-white text-gray-700 p-2 rounded-full hover:bg-yellow-500 hover:text-white transition-colors"
                            title="Đặt làm ảnh chính"
                          >
                            <Star className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (isExisting) {
                              deleteExistingImage(image.id)
                            } else {
                              removeNewImage(image.tempIndex!)
                            }
                          }}
                          className="bg-white text-gray-700 p-2 rounded-full hover:bg-red-600 hover:text-white transition-colors"
                          title="Xóa ảnh"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Image Info */}
                  <div className="p-3 sm:p-4 space-y-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Tiêu đề ảnh</label>
                      {isExisting ? (
                        <p className="text-sm font-medium text-gray-900">{image.title || 'Chưa có tiêu đề'}</p>
                      ) : (
                        <input
                          type="text"
                          placeholder="Nhập tiêu đề cho ảnh..."
                          value={image.title}
                          onChange={(e) => updateNewImageInfo(image.tempIndex!, 'title', e.target.value)}
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        />
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Mô tả ảnh</label>
                      {isExisting ? (
                        <p className="text-sm text-gray-600">{image.description || 'Chưa có mô tả'}</p>
                      ) : (
                        <textarea
                          placeholder="Mô tả ngắn về ảnh..."
                          value={image.description}
                          onChange={(e) => updateNewImageInfo(image.tempIndex!, 'description', e.target.value)}
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 h-16 resize-none"
                          maxLength={200}
                        />
                      )}
                    </div>

                    {!isExisting && (
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Loại ảnh</label>
                        <select
                          value={image.type}
                          onChange={(e) => updateNewImageInfo(image.tempIndex!, 'type', e.target.value)}
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        >
                          <option value="main">Ảnh chính</option>
                          <option value="exterior">Ngoại thất</option>
                          <option value="interior">Nội thất</option>
                          <option value="amenity">Tiện ích</option>
                          <option value="view">Tầm nhìn</option>
                        </select>
                      </div>
                    )}

                    {/* File/Image Info */}
                    <div className="text-xs text-gray-400 border-t border-gray-100 pt-2">
                      {isExisting ? (
                        <div>ID: {image.id} • Thứ tự: {image.sortOrder}</div>
                      ) : (
                        <div>
                          <div>Kích thước: {(image.file.size / 1024 / 1024).toFixed(2)} MB</div>
                          <div>Loại: {image.file.type}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tips Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6">
        <div className="flex items-start">
          <AlertCircle className="w-6 h-6 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-900 mb-3">Hướng dẫn quản lý ảnh:</h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <h5 className="font-medium mb-2">Thao tác với ảnh:</h5>
                <ul className="space-y-1">
                  <li>• Hover vào ảnh để hiện các nút chức năng</li>
                  <li>• Click vào nút sao để đặt làm ảnh chính</li>
                  <li>• Click vào nút thùng rác để xóa ảnh</li>
                  <li>• Ảnh hiện tại: đã lưu trên server</li>
                  <li>• Ảnh mới: chưa upload, cần lưu để upload</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium mb-2">Lưu ý quan trọng:</h5>
                <ul className="space-y-1">
                  <li>• Phải có ít nhất 1 ảnh chính</li>
                  <li>• Xóa ảnh hiện tại sẽ xóa ngay khỏi server</li>
                  <li>• Ảnh mới cần click "Lưu & Tiếp tục" để upload</li>
                  <li>• Nên có 5-15 ảnh để thu hút khách hàng</li>
                  <li>• Chọn ảnh chất lượng cao, rõ nét</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Statistics */}
      {totalImages > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
            <div className="flex items-center text-green-700">
              <ImageIcon className="w-4 h-4 mr-2" />
              <span>Tổng ảnh: {totalImages}</span>
            </div>
            <div className="flex items-center text-green-700">
              <span>Ảnh chính: {primaryImage?.title || 'Chưa đặt'}</span>
            </div>
            <div className="text-green-600 text-xs">
              {newImages.length > 0 && (
                <>Ảnh mới: {Math.round(newImages.reduce((total, img) => total + img.file.size, 0) / 1024 / 1024 * 100) / 100} MB</>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Warning if no primary image */}
      {totalImages > 0 && !primaryImage && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
            <span className="text-yellow-800 font-medium">
              Cảnh báo: Chưa có ảnh chính! Vui lòng chọn một ảnh làm ảnh chính.
            </span>
          </div>
        </div>
      )}

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
          {newImages.length === 0 && (
            <span className="text-sm text-gray-500 text-center">
              Không có ảnh mới để upload
            </span>
          )}
          <button
            onClick={uploadNewImages}
            disabled={totalImages === 0}
            className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center font-medium shadow-lg text-sm sm:text-base"
          >
            {newImages.length > 0 ? (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload {newImages.length} ảnh & Tiếp tục
              </>
            ) : (
              <>
                Tiếp tục
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditPropertyImagesStep