import { X, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Loading } from '@/components/ui/Loading'
import { DayInfo } from '@/types/main/booking'

interface AvailableDatesModalProps {
  isOpen: boolean
  onClose: () => void
  calendar: DayInfo[] | null
  summary: {
    totalDays: number
    availableDays: number
    unavailableDays: number
    availabilityRate: number
  } | null
  roomTypeName: string
  year: number
  month: number
  monthName: string
  roomsCount: number
  totalRooms: number
  loading: boolean
  onMonthChange: (year: number, month: number) => void
}

export const AvailableDatesModal = ({
  isOpen,
  onClose,
  calendar,
  summary,
  roomTypeName,
  year,
  month,
  monthName,
  roomsCount,
  totalRooms,
  loading,
  onMonthChange
}: AvailableDatesModalProps) => {
  if (!isOpen) return null

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  const handlePrevMonth = () => {
    if (month === 1) {
      onMonthChange(year - 1, 12)
    } else {
      onMonthChange(year, month - 1)
    }
  }

  const handleNextMonth = () => {
    if (month === 12) {
      onMonthChange(year + 1, 1)
    } else {
      onMonthChange(year, month + 1)
    }
  }

  const getDayColor = (day: DayInfo) => {
    if (day.isPast) return 'bg-gray-100 text-gray-400 cursor-not-allowed'
    if (!day.isAvailable) return 'bg-red-50 text-red-400 cursor-not-allowed'
    if (day.isToday) return 'bg-blue-100 text-blue-700 border-2 border-blue-500'
    if (day.isHoliday) return 'bg-purple-100 text-purple-700 hover:bg-purple-200'
    if (day.isWeekend) return 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
    return 'bg-green-50 text-green-700 hover:bg-green-100'
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-indigo-500/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-200 rounded-t-3xl z-10">
          <div className="flex justify-between items-center p-6">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                Lịch phòng trống
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {roomTypeName} - {roomsCount} phòng
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-pink-50 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loading />
            </div>
          ) : (
            <>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={handlePrevMonth}
                    className="p-2 hover:bg-pink-50 rounded-full transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-pink-600" />
                  </button>
                  <h3 className="text-xl font-bold text-gray-900">
                    {monthName} {year}
                  </h3>
                  <button
                    onClick={handleNextMonth}
                    className="p-2 hover:bg-pink-50 rounded-full transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-pink-600" />
                  </button>
                </div>

                {summary && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                      <p className="text-xs text-blue-600 mb-1">Tổng số ngày</p>
                      <p className="text-2xl font-bold text-blue-700">{summary.totalDays}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                      <p className="text-xs text-green-600 mb-1">Ngày trống</p>
                      <p className="text-2xl font-bold text-green-700">{summary.availableDays}</p>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border border-red-200">
                      <p className="text-xs text-red-600 mb-1">Ngày đã đặt</p>
                      <p className="text-2xl font-bold text-red-700">{summary.unavailableDays}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                      <p className="text-xs text-purple-600 mb-1">Tỷ lệ trống</p>
                      <p className="text-2xl font-bold text-purple-700">{summary.availabilityRate}%</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-7 gap-2 mb-2">
                  {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day) => (
                    <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {calendar && (() => {
                    // Tính số ngày trống cần thêm vào đầu (để căn đúng cột)
                    const firstDayOfWeek = new Date(calendar[0].date).getDay()
                    const emptyDays = Array(firstDayOfWeek).fill(null)
                    
                    return [...emptyDays, ...calendar].map((day, index) => {
                      if (!day) {
                        return <div key={`empty-${index}`} className="p-3"></div>
                      }
                      
                      return (
                        <div key={day.date}>
                          <div
                            className={`
                              ${getDayColor(day)}
                              p-3 rounded-xl text-center transition-all duration-200
                              ${!day.isPast && day.isAvailable ? 'cursor-pointer' : ''}
                            `}
                            title={`${day.date} - ${day.isAvailable ? `${day.availableRooms} phòng trống` : 'Hết phòng'}`}
                          >
                            <div className="text-sm font-semibold mb-1">{day.day}</div>
                            <div className="text-xs">
                              {day.isAvailable ? (
                                <>
                                  <div>{day.availableRooms}/{totalRooms}</div>
                                  <div className="font-medium mt-1">
                                    {formatPrice(day.pricePerRoom)}
                                  </div>
                                </>
                              ) : (
                                <div className="text-xs">Hết phòng</div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  })()}
                </div>
              </div>

              <div className="mt-6 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-200">
                <h4 className="font-semibold text-gray-900 mb-3">Chú thích:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-50 border border-green-200 rounded mr-2"></div>
                    <span>Ngày thường trống</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-yellow-50 border border-yellow-200 rounded mr-2"></div>
                    <span>Cuối tuần trống</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-purple-100 border border-purple-200 rounded mr-2"></div>
                    <span>Ngày lễ trống</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-blue-100 border-2 border-blue-500 rounded mr-2"></div>
                    <span>Hôm nay</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-red-50 border border-red-200 rounded mr-2"></div>
                    <span>Hết phòng</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded mr-2"></div>
                    <span>Đã qua</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}