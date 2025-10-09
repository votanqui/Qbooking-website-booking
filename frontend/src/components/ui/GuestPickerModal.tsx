'use client'

import { useState, useEffect } from 'react'
import { 
  XMarkIcon, 
  UserGroupIcon,
  MinusIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/Button'

interface GuestPickerModalProps {
  isOpen: boolean
  onClose: () => void
  selectedGuests: number
  onGuestSelect: (guests: number) => void
  maxGuests?: number
}

export function GuestPickerModal({
  isOpen,
  onClose,
  selectedGuests,
  onGuestSelect,
  maxGuests = 16
}: GuestPickerModalProps) {
  const [guests, setGuests] = useState(selectedGuests)

  useEffect(() => {
    if (isOpen) {
      setGuests(selectedGuests)
    }
  }, [isOpen, selectedGuests])

  const handleGuestChange = (increment: boolean) => {
    setGuests(prev => {
      if (increment) {
        return prev < maxGuests ? prev + 1 : prev
      } else {
        return prev > 1 ? prev - 1 : prev
      }
    })
  }

  const handleConfirm = () => {
    onGuestSelect(guests)
    onClose()
  }

  const quickSelectOptions = [1, 2, 4, 6, 8, 12]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pt-20 md:pt-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm md:max-w-md w-full max-h-[85vh] md:max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
          <div className="flex items-center gap-2 md:gap-3">
            <UserGroupIcon className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
            <h2 className="text-lg md:text-xl font-semibold text-gray-800">
              Select Guests
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6">
          {/* Main Counter */}
          <div className="text-center mb-6 md:mb-8">
            <div className="text-4xl md:text-6xl font-bold text-gray-800 mb-2">
              {guests}
            </div>
            <div className="text-sm md:text-base text-gray-600">
              {guests === 1 ? 'Guest' : 'Guests'}
            </div>
          </div>

          {/* Counter Controls */}
          <div className="flex items-center justify-center gap-4 md:gap-6 mb-6 md:mb-8">
            <button
              onClick={() => handleGuestChange(false)}
              disabled={guests <= 1}
              className={`
                p-3 md:p-4 rounded-full border-2 transition-all
                ${guests <= 1 
                  ? 'border-gray-200 text-gray-300 cursor-not-allowed' 
                  : 'border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300'
                }
              `}
            >
              <MinusIcon className="w-5 h-5 md:w-6 md:h-6" />
            </button>

            <div className="flex-1 max-w-xs">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full h-2">
                <div 
                  className="bg-white rounded-full h-2 transition-all duration-300"
                  style={{ width: `${Math.min((guests / maxGuests) * 100, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1</span>
                <span>{maxGuests}+</span>
              </div>
            </div>

            <button
              onClick={() => handleGuestChange(true)}
              disabled={guests >= maxGuests}
              className={`
                p-3 md:p-4 rounded-full border-2 transition-all
                ${guests >= maxGuests 
                  ? 'border-gray-200 text-gray-300 cursor-not-allowed' 
                  : 'border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300'
                }
              `}
            >
              <PlusIcon className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>

          {/* Quick Select Options */}
          <div className="mb-6 md:mb-8">
            <div className="text-sm font-medium text-gray-700 mb-3">
              Quick select:
            </div>
            <div className="grid grid-cols-3 gap-2">
              {quickSelectOptions.map(option => (
                <button
                  key={option}
                  onClick={() => setGuests(option)}
                  className={`
                    py-2 px-4 rounded-lg text-sm font-medium transition-all border
                    ${guests === option
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-500 shadow-md'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:text-purple-600'
                    }
                  `}
                >
                  {option} {option === 1 ? 'Guest' : 'Guests'}
                </button>
              ))}
            </div>
          </div>

          {/* Info Text */}
          <div className="text-center text-xs md:text-sm text-gray-500 mb-4 md:mb-6">
            Most properties can accommodate up to {maxGuests} guests
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