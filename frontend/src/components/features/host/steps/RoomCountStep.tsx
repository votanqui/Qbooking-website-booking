//component/features/host/steps/RoomCountStep.tsx
'use client'

import React, { useContext, useEffect } from 'react'
import { ChevronLeft, ChevronRight, AlertCircle, Home, Users, Bed } from 'lucide-react'
import { WizardContext, RoomForm } from '../CreatePropertyWizard'

const RoomCountStep: React.FC = () => {
  const context = useContext(WizardContext)
  if (!context) throw new Error('RoomCountStep must be used within WizardContext')

  const {
    roomCount,
    setRoomCount,
    roomForms,
    setRoomForms,
    nextStep,
    prevStep
  } = context

  // Initialize room forms when room count changes
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
  }, [roomCount, setRoomForms])

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

      {/* Information Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start">
          <AlertCircle className="w-6 h-6 text-blue-600 mr-3 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-3">Thông tin quan trọng</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p>
                <strong>Loại phòng</strong> là các phòng có cùng đặc điểm như diện tích, tiện nghi, giá cả.
              </p>
              <p>
                Ví dụ: Phòng Deluxe, Phòng Superior, Phòng Suite... Mỗi loại có thể có nhiều phòng cùng loại.
              </p>
              <div className="bg-blue-100 rounded-lg p-3 mt-3">
                <p className="font-medium mb-2">Ví dụ cụ thể:</p>
                <ul className="space-y-1 text-xs">
                  <li>• <strong>Loại 1:</strong> Phòng Standard (có 5 phòng cùng loại)</li>
                  <li>• <strong>Loại 2:</strong> Phòng Deluxe (có 3 phòng cùng loại)</li>
                  <li>• <strong>Loại 3:</strong> Phòng Suite (có 2 phòng cùng loại)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Room Count Selection */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-8">
        <div className="text-center max-w-md mx-auto">
          <div className="flex items-center justify-center mb-6">
            <Home className="w-8 h-8 text-pink-600 mr-3" />
            <h3 className="text-xl font-semibold text-gray-900">Chọn số lượng loại phòng</h3>
          </div>

          {/* Number Input with Buttons */}
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

          {/* Direct Input */}
          <div className="mb-6">
            <input
              type="number"
              min="1"
              max="10"
              value={roomCount}
              onChange={(e) => handleRoomCountChange(parseInt(e.target.value) || 1)}
              className="w-32 p-3 text-center text-lg font-semibold border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
            />
            <p className="text-xs text-gray-500 mt-2">Nhập trực tiếp (1-10)</p>
          </div>

          {/* Quick Selection Buttons */}
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
          <p className="text-xs text-gray-500 mt-2">Chọn nhanh</p>
        </div>
      </div>

      {/* Preview Section */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Bed className="w-5 h-5 mr-2 text-purple-600" />
          Xem trước các loại phòng sẽ tạo
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: roomCount }, (_, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
            >
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                <span className="ml-3 font-medium text-gray-900">
                  Loại phòng {index + 1}
                </span>
              </div>
              
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2 text-gray-400" />
                  <span>Sẽ cấu hình ở bước tiếp theo</span>
                </div>
                <div className="text-xs text-gray-500">
                  • Tên phòng và mô tả
                </div>
                <div className="text-xs text-gray-500">
                  • Số khách, loại giường
                </div>
                <div className="text-xs text-gray-500">
                  • Giá cả và chính sách
                </div>
                <div className="text-xs text-gray-500">
                  • Tiện nghi phòng
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {roomCount > 6 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Và {roomCount - 6} loại phòng khác...
            </p>
          </div>
        )}
      </div>

      {/* Guidelines */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <h4 className="font-medium mb-2">Gợi ý chọn số lượng loại phòng:</h4>
            <ul className="space-y-1">
              <li><strong>1-2 loại:</strong> Phù hợp với homestay, villa nhỏ</li>
              <li><strong>3-4 loại:</strong> Phù hợp với khách sạn boutique</li>
              <li><strong>5+ loại:</strong> Phù hợp với khách sạn lớn, resort</li>
            </ul>
            <p className="mt-2 text-xs">
              <strong>Lưu ý:</strong> Bạn có thể thêm/sửa/xóa loại phòng sau khi tạo property.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6">
        <button
          onClick={prevStep}
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

export default RoomCountStep