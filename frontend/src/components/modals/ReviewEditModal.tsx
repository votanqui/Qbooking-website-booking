'use client'

import { useState, useEffect } from 'react'
import { reviewService } from '@/services/main/review.service'
import { ReviewResponse } from '@/types/main/review'
import { useToast } from '@/components/ui/Toast'
import { 
  Star, 
  X, 
  Upload,
  Trash2,
  Loader2
} from 'lucide-react'

interface ReviewEditModalProps {
  isOpen: boolean
  onClose: () => void
  reviewId: number | null
  onSuccess?: () => void
}

export function ReviewEditModal({ 
  isOpen, 
  onClose, 
  reviewId,
  onSuccess
}: ReviewEditModalProps) {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [review, setReview] = useState<ReviewResponse | null>(null)

  const [overallRating, setOverallRating] = useState(0)
  const [cleanlinessRating, setCleanlinessRating] = useState(0)
  const [locationRating, setLocationRating] = useState(0)
  const [serviceRating, setServiceRating] = useState(0)
  const [valueRating, setValueRating] = useState(0)
  const [amenitiesRating, setAmenitiesRating] = useState(0)
  const [title, setTitle] = useState('')
  const [reviewText, setReviewText] = useState('')
  const [pros, setPros] = useState('')
  const [cons, setCons] = useState('')
  const [travelType, setTravelType] = useState('')
  const [roomStayed, setRoomStayed] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [newImages, setNewImages] = useState<File[]>([])
  const [deleteImageIds, setDeleteImageIds] = useState<number[]>([])
  const [existingImages, setExistingImages] = useState<Array<{id: number, url: string}>>([])

  useEffect(() => {
    if (isOpen && reviewId) {
      fetchReviewDetail()
    } else {
      resetForm()
    }
  }, [isOpen, reviewId])

  const fetchReviewDetail = async () => {
    if (!reviewId) return
    setLoading(true)
    try {
      const response = await reviewService.getMyReviewById(reviewId)
      if (response.success && response.data) {
        const data = response.data
        setReview(data)
        setOverallRating(data.overallRating)
        setCleanlinessRating(data.cleanlinessRating || 0)
        setLocationRating(data.locationRating || 0)
        setServiceRating(data.serviceRating || 0)
        setValueRating(data.valueRating || 0)
        setAmenitiesRating(data.amenitiesRating || 0)
        setTitle(data.title || '')
        setReviewText(data.reviewText || '')
        setPros(data.pros || '')
        setCons(data.cons || '')
        setTravelType(data.travelType || '')
        setRoomStayed(data.roomStayed || '')
        setIsAnonymous(data.isAnonymous || false)
        setExistingImages(data.images?.map(img => ({
          id: img.id,
          url: img.imageUrl.startsWith('/') 
            ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${img.imageUrl}` 
            : img.imageUrl
        })) || [])
      } else {
        showToast(response.message || 'Không thể tải thông tin đánh giá', 'error')
        onClose()
      }
    } catch (err) {
      showToast('Lỗi khi tải thông tin đánh giá', 'error')
      console.error('Error fetching review:', err)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setReview(null)
    setOverallRating(0)
    setCleanlinessRating(0)
    setLocationRating(0)
    setServiceRating(0)
    setValueRating(0)
    setAmenitiesRating(0)
    setTitle('')
    setReviewText('')
    setPros('')
    setCons('')
    setTravelType('')
    setRoomStayed('')
    setIsAnonymous(false)
    setNewImages([])
    setDeleteImageIds([])
    setExistingImages([])
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      const totalImages = existingImages.length + newImages.length + files.length
      
      if (totalImages > 10) {
        showToast('Chỉ được tải lên tối đa 10 ảnh', 'error')
        return
      }
      
      setNewImages(prev => [...prev, ...files])
    }
  }

  const handleRemoveNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleRemoveExistingImage = (imageId: number) => {
    setDeleteImageIds(prev => [...prev, imageId])
    setExistingImages(prev => prev.filter(img => img.id !== imageId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!reviewId) return

    if (overallRating === 0) {
      showToast('Vui lòng chọn đánh giá tổng thể', 'error')
      return
    }

    setSaving(true)
    try {
      const response = await reviewService.updateReview(reviewId, {
        overallRating,
        cleanlinessRating: cleanlinessRating || undefined,
        locationRating: locationRating || undefined,
        serviceRating: serviceRating || undefined,
        valueRating: valueRating || undefined,
        amenitiesRating: amenitiesRating || undefined,
        title: title || undefined,
        reviewText: reviewText || undefined,
        pros: pros || undefined,
        cons: cons || undefined,
        travelType: travelType || undefined,
        roomStayed: roomStayed || undefined,
        isAnonymous,
        newImages: newImages.length > 0 ? newImages : undefined,
        deleteImageIds: deleteImageIds.length > 0 ? deleteImageIds : undefined
      })

      if (response.success) {
        showToast('Cập nhật đánh giá thành công!', 'success')
        onSuccess?.()
        onClose()
      } else {
        showToast(response.message || 'Không thể cập nhật đánh giá', 'error')
      }
    } catch (err) {
      showToast('Lỗi khi cập nhật đánh giá', 'error')
      console.error('Error updating review:', err)
    } finally {
      setSaving(false)
    }
  }

  const StarRating = ({ 
    value, 
    onChange, 
    label 
  }: { 
    value: number; 
    onChange: (rating: number) => void; 
    label: string;
  }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <Star
              className={`w-8 h-8 ${
                star <= value
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-pink-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 p-6 text-white rounded-t-3xl sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Chỉnh sửa đánh giá</h2>
              {review?.property && (
                <p className="text-pink-100">{review.property.name}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
              disabled={saving}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Body */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Overall Rating - Required */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-2xl">
              <StarRating
                value={overallRating}
                onChange={setOverallRating}
                label="Đánh giá tổng thể *"
              />
            </div>

            {/* Detailed Ratings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <StarRating
                value={cleanlinessRating}
                onChange={setCleanlinessRating}
                label="Độ sạch sẽ"
              />
              <StarRating
                value={locationRating}
                onChange={setLocationRating}
                label="Vị trí"
              />
              <StarRating
                value={serviceRating}
                onChange={setServiceRating}
                label="Dịch vụ"
              />
              <StarRating
                value={valueRating}
                onChange={setValueRating}
                label="Giá trị"
              />
              <StarRating
                value={amenitiesRating}
                onChange={setAmenitiesRating}
                label="Tiện nghi"
              />
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tiêu đề đánh giá
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                className="w-full p-3 border-2 border-purple-100 rounded-xl focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
                placeholder="Tóm tắt trải nghiệm của bạn..."
              />
            </div>

            {/* Review Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nội dung đánh giá
              </label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                maxLength={2000}
                rows={4}
                className="w-full p-3 border-2 border-purple-100 rounded-xl focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
                placeholder="Chia sẻ chi tiết về trải nghiệm của bạn..."
              />
            </div>

            {/* Pros & Cons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Điểm tốt
                </label>
                <textarea
                  value={pros}
                  onChange={(e) => setPros(e.target.value)}
                  maxLength={1000}
                  rows={3}
                  className="w-full p-3 border-2 border-green-100 rounded-xl focus:border-green-400 focus:ring-4 focus:ring-green-100"
                  placeholder="Những gì bạn thích..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Điểm cần cải thiện
                </label>
                <textarea
                  value={cons}
                  onChange={(e) => setCons(e.target.value)}
                  maxLength={1000}
                  rows={3}
                  className="w-full p-3 border-2 border-red-100 rounded-xl focus:border-red-400 focus:ring-4 focus:ring-red-100"
                  placeholder="Những gì cần cải thiện..."
                />
              </div>
            </div>

            {/* Additional Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại hình du lịch
                </label>
                <select
                  value={travelType}
                  onChange={(e) => setTravelType(e.target.value)}
                  className="w-full p-3 border-2 border-purple-100 rounded-xl focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
                >
                  <option value="">Chọn loại hình</option>
                  <option value="solo">Du lịch một mình</option>
                  <option value="couple">Du lịch cặp đôi</option>
                  <option value="family">Du lịch gia đình</option>
                  <option value="friends">Du lịch bạn bè</option>
                  <option value="business">Công tác</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phòng đã ở
                </label>
                <input
                  type="text"
                  value={roomStayed}
                  onChange={(e) => setRoomStayed(e.target.value)}
                  maxLength={100}
                  className="w-full p-3 border-2 border-purple-100 rounded-xl focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
                  placeholder="VD: Phòng Deluxe 302"
                />
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ảnh (Tối đa 10 ảnh)
              </label>
              <div className="border-2 border-dashed border-purple-200 rounded-xl p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                  disabled={existingImages.length + newImages.length >= 10}
                />
                <label
                  htmlFor="image-upload"
                  className={`cursor-pointer flex flex-col items-center ${
                    existingImages.length + newImages.length >= 10 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Upload className="w-12 h-12 text-purple-400 mb-2" />
                  <span className="text-sm text-gray-600">
                    Nhấp để tải ảnh lên ({existingImages.length + newImages.length}/10)
                  </span>
                </label>
              </div>

              {/* Image Previews */}
              {(existingImages.length > 0 || newImages.length > 0) && (
                <div className="grid grid-cols-5 gap-2 mt-4">
                  {existingImages.map((img) => (
                    <div key={img.id} className="relative group">
                      <img
                        src={img.url}
                        alt="Review"
                        className="w-full h-20 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingImage(img.id)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {newImages.map((file, index) => (
                    <div key={`new-${index}`} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt="New"
                        className="w-full h-20 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveNewImage(index)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Anonymous Option */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="anonymous"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <label htmlFor="anonymous" className="text-sm text-gray-700">
                Đánh giá ẩn danh
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                disabled={saving}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving || overallRating === 0}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  'Lưu thay đổi'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}