//component/features/host/components/ImageUploader.tsx
'use client'

import React from 'react'
import { Upload, X, Star, Edit2 } from 'lucide-react'
import { ImagePreview } from '../CreatePropertyWizard'

interface ImageUploaderProps {
  images: ImagePreview[]
  setImages: React.Dispatch<React.SetStateAction<ImagePreview[]>>
  title?: string
  description?: string
  multiple?: boolean
  maxImages?: number
  inputId?: string
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  images,
  setImages,
  title = "Chọn ảnh",
  description = "Kéo thả hoặc click để chọn ảnh",
  multiple = true,
  maxImages,
  inputId = "image-upload"
}) => {
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const filesToProcess = Array.from(files)
      let processedCount = 0
      
      filesToProcess.forEach((file, index) => {
        if (maxImages && images.length + processedCount >= maxImages) {
          return
        }
        
        const reader = new FileReader()
        reader.onload = () => {
          const newImage: ImagePreview = {
            file,
            preview: reader.result as string,
            type: 'interior',
            title: file.name.split('.')[0],
            description: '',
            isPrimary: images.length === 0 && processedCount === 0,
            sortOrder: images.length + processedCount + 1
          }
          
          setImages(prev => [...prev, newImage])
          processedCount++
        }
        reader.readAsDataURL(file)
      })
    }
    // Reset input value to allow selecting the same files again
    event.target.value = ''
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const setPrimaryImage = (index: number) => {
    setImages(prev => prev.map((img, i) => ({
      ...img,
      isPrimary: i === index
    })))
  }

  const updateImageInfo = (index: number, field: 'title' | 'description', value: string) => {
    setImages(prev => prev.map((img, i) => i === index ? { ...img, [field]: value } : img))
  }

  const moveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= images.length) return
    
    setImages(prev => {
      const newImages = [...prev]
      const [moved] = newImages.splice(fromIndex, 1)
      newImages.splice(toIndex, 0, moved)
      
      // Update sort order
      return newImages.map((img, index) => ({ ...img, sortOrder: index + 1 }))
    })
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div className="border-2 border-dashed border-pink-300 rounded-xl p-8 text-center bg-gradient-to-br from-pink-50 to-purple-50 hover:from-pink-100 hover:to-purple-100 transition-all">
        <input
          type="file"
          multiple={multiple}
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
          id={inputId}
        />
        <label htmlFor={inputId} className="cursor-pointer">
          <Upload className="w-12 h-12 mx-auto text-pink-500 mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-2">{title}</p>
          <p className="text-sm text-gray-500">{description}</p>
          {maxImages && (
            <p className="text-xs text-gray-400 mt-2">
              Tối đa {maxImages} ảnh ({images.length}/{maxImages})
            </p>
          )}
        </label>
      </div>

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((image, index) => (
            <div key={`${index}-${image.file.name}-${image.file.size}`} className="relative bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              {/* Image */}
              <div className="aspect-video relative">
                <img 
                  src={image.preview} 
                  alt={`Preview ${index + 1}`} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error('Image load error:', e)
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMiA4QzEzLjEgOCAxNCA4LjkgMTQgMTBDMTQgMTEuMSAxMy4xIDEyIDEyIDEyQzEwLjkgMTIgMTAgMTEuMSAxMCAxMEMxMCA4LjkgMTAuOSA4IDEyIDhaIiBmaWxsPSIjOUI5QjlCIi8+CjxwYXRoIGQ9Ik01IDE4TDE5IDE4TDE2IDE0TDEzIDE2TDEwIDE0TDUgMThaTTMgNFYyMEMzIDIxLjEgMy45IDIyIDUgMjJIMTlDMjAuMSAyMiAyMSAyMS4xIDIxIDIwVjRDMjEgMi45IDIwLjEgMiAxOSAySDVDMy45IDIgMyAyLjkgMyA0WiIgZmlsbD0iIzlCOUI5QiIvPgo8L3N2Zz4K'
                  }}
                />
                
                {/* Primary Badge */}
                {image.isPrimary && (
                  <div className="absolute top-2 left-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
                    <Star className="w-3 h-3 mr-1 fill-current" />
                    Ảnh chính
                  </div>
                )}
                
                {/* Actions Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
                  <div className="flex space-x-2">
                    {!image.isPrimary && (
                      <button
                        onClick={() => setPrimaryImage(index)}
                        className="bg-white text-gray-700 p-2 rounded-full hover:bg-pink-600 hover:text-white transition-colors"
                        title="Đặt làm ảnh chính"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => removeImage(index)}
                      className="bg-white text-gray-700 p-2 rounded-full hover:bg-red-600 hover:text-white transition-colors"
                      title="Xóa ảnh"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Image Info */}
              <div className="p-4 space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Tiêu đề ảnh</label>
                  <input
                    type="text"
                    placeholder="Nhập tiêu đề cho ảnh..."
                    value={image.title}
                    onChange={(e) => updateImageInfo(index, 'title', e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Mô tả ảnh</label>
                  <textarea
                    placeholder="Mô tả ngắn về ảnh..."
                    value={image.description}
                    onChange={(e) => updateImageInfo(index, 'description', e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 h-16 resize-none"
                    maxLength={200}
                  />
                  <p className="text-xs text-gray-400 mt-1">{image.description.length}/200 ký tự</p>
                </div>

                {/* Move buttons */}
                {images.length > 1 && (
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <span className="text-xs text-gray-400">Vị trí: {index + 1}</span>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => moveImage(index, index - 1)}
                        disabled={index === 0}
                        className="text-xs px-2 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Di chuyển lên"
                      >
                        ←
                      </button>
                      <button
                        onClick={() => moveImage(index, index + 1)}
                        disabled={index === images.length - 1}
                        className="text-xs px-2 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Di chuyển xuống"
                      >
                        →
                      </button>
                    </div>
                  </div>
                )}

                {/* File Info */}
                <div className="text-xs text-gray-400 border-t border-gray-100 pt-2">
                  <div>Kích thước: {(image.file.size / 1024 / 1024).toFixed(2)} MB</div>
                  <div>Loại: {image.file.type}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      {images.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <Edit2 className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Lưu ý về ảnh:</p>
              <ul className="space-y-1 text-xs">
                <li>• Ảnh đầu tiên sẽ được đặt làm ảnh chính mặc định</li>
                <li>• Click vào biểu tượng sao để chọn ảnh chính khác</li>
                <li>• Sử dụng mũi tên để thay đổi thứ tự ảnh</li>
                <li>• Nhập tiêu đề và mô tả để tối ưu SEO</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ImageUploader