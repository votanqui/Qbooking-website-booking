'use client'

import { useState, useEffect } from 'react'
import { 
  XMarkIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  CalendarDaysIcon 
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/Button'

interface DatePickerModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDate?: string
  onDateSelect: (date: string) => void
  minDate?: string
  title?: string
  type?: 'checkin' | 'checkout'
}

interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isSelected: boolean
  isDisabled: boolean
  isToday: boolean
}

export function DatePickerModal({
  isOpen,
  onClose,
  selectedDate,
  onDateSelect,
  minDate,
  title = "Select Date",
  type = 'checkin'
}: DatePickerModalProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDateObj, setSelectedDateObj] = useState<Date | null>(
    selectedDate ? new Date(selectedDate) : null
  )

  // Reset to current month when modal opens
  useEffect(() => {
    if (isOpen) {
      if (selectedDate) {
        setCurrentMonth(new Date(selectedDate))
        setSelectedDateObj(new Date(selectedDate))
      } else {
        setCurrentMonth(new Date())
        setSelectedDateObj(null)
      }
    }
  }, [isOpen, selectedDate])

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const generateCalendarDays = (): CalendarDay[] => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const firstDayWeekday = firstDay.getDay()
    const daysInMonth = lastDay.getDate()
    
    const days: CalendarDay[] = []
    const today = new Date()
    const minDateObj = minDate ? new Date(minDate) : new Date()
    
    // Previous month's trailing days
    const prevMonth = new Date(year, month - 1, 0)
    for (let i = firstDayWeekday - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonth.getDate() - i)
      days.push({
        date,
        isCurrentMonth: false,
        isSelected: false,
        isDisabled: true,
        isToday: false
      })
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const isDisabled = date < minDateObj
      const isSelected = selectedDateObj !== null && 
        date.getTime() === selectedDateObj.getTime()
      const isToday = date.toDateString() === today.toDateString()
      
      days.push({
        date,
        isCurrentMonth: true,
        isSelected,
        isDisabled,
        isToday
      })
    }
    
    // Next month's leading days
    const remainingDays = 42 - days.length // 6 weeks * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day)
      days.push({
        date,
        isCurrentMonth: false,
        isSelected: false,
        isDisabled: true,
        isToday: false
      })
    }
    
    return days
  }

  const handleDateClick = (day: CalendarDay) => {
    if (day.isDisabled || !day.isCurrentMonth) return
    
    setSelectedDateObj(day.date)
  }

  const handleConfirm = () => {
    if (selectedDateObj) {
      // Format date manually to avoid timezone issues
      const year = selectedDateObj.getFullYear()
      const month = String(selectedDateObj.getMonth() + 1).padStart(2, '0')
      const day = String(selectedDateObj.getDate()).padStart(2, '0')
      const dateString = `${year}-${month}-${day}`
      onDateSelect(dateString)
      onClose()
    }
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev)
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1)
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1)
      }
      return newMonth
    })
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentMonth(today)
    setSelectedDateObj(today)
  }

  if (!isOpen) return null

  const calendarDays = generateCalendarDays()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <CalendarDaysIcon className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-800">
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Calendar Content */}
        <div className="p-6">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
            </button>
            
            <h3 className="text-lg font-semibold text-gray-800">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronRightIcon className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Week Days Header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map(day => (
              <div 
                key={day}
                className="h-10 flex items-center justify-center text-sm font-medium text-gray-500"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-6">
            {calendarDays.map((day, index) => (
              <button
                key={index}
                onClick={() => handleDateClick(day)}
                disabled={day.isDisabled}
                className={`
                  h-10 w-10 flex items-center justify-center text-sm rounded-lg transition-all
                  ${day.isCurrentMonth 
                    ? day.isDisabled
                      ? 'text-gray-300 cursor-not-allowed'
                      : day.isSelected
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                        : day.isToday
                          ? 'bg-purple-100 text-purple-600 font-semibold'
                          : 'text-gray-700 hover:bg-purple-50 hover:text-purple-600'
                    : 'text-gray-300 cursor-default'
                  }
                `}
              >
                {day.date.getDate()}
              </button>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={goToToday}
              className="text-purple-600 hover:text-purple-700 font-medium text-sm transition-colors"
            >
             Chọn Hôm Nay
            </button>
            
            {selectedDateObj && (
              <div className="text-sm text-gray-600">
                Selected: {selectedDateObj.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!selectedDateObj}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              Confirm
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}