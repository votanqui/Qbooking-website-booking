'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { DatePickerModal } from '@/components/ui/DatePickerModal'
import { GuestPickerModal } from '@/components/ui/GuestPickerModal'
import { 
  MagnifyingGlassIcon, 
  MapPinIcon, 
  CalendarDaysIcon, 
  UserGroupIcon 
} from '@heroicons/react/24/outline'
import { addressService } from '@/services/main/address.service'
import { TopProvince } from '@/types/main/address'

interface SearchFormData {
  location: string
  checkIn: string
  checkOut: string
  guests: number
}

type ModalType = 'checkin' | 'checkout' | 'guests' | null

export function SearchBar() {
  const router = useRouter()
  const [searchData, setSearchData] = useState<SearchFormData>({
    location: '',
    checkIn: '',
    checkOut: '',
    guests: 1
  })
  
  // State for modals
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  
  // State for top provinces
  const [topProvinces, setTopProvinces] = useState<TopProvince[]>([])
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(true)

  // Fetch top provinces on component mount
  useEffect(() => {
    const fetchTopProvinces = async () => {
      try {
        setIsLoadingProvinces(true)
        const response = await addressService.getTopProvincesWithMostProperties(6)
        
        if (response.success && response.data) {
          setTopProvinces(response.data)
        } else {
          console.error('Failed to fetch top provinces:', response.message)
          setTopProvinces([
            { tinhId: 1, soLuongProperty: 0, tenTinh: 'Ho Chi Minh City' },
            { tinhId: 2, soLuongProperty: 0, tenTinh: 'Hanoi' },
            { tinhId: 3, soLuongProperty: 0, tenTinh: 'Da Nang' },
            { tinhId: 4, soLuongProperty: 0, tenTinh: 'Nha Trang' },
            { tinhId: 5, soLuongProperty: 0, tenTinh: 'Hoi An' },
            { tinhId: 6, soLuongProperty: 0, tenTinh: 'Sapa' }
          ])
        }
      } catch (error) {
        console.error('Error fetching top provinces:', error)
        setTopProvinces([
          { tinhId: 1, soLuongProperty: 0, tenTinh: 'Ho Chi Minh City' },
          { tinhId: 2, soLuongProperty: 0, tenTinh: 'Hanoi' },
          { tinhId: 3, soLuongProperty: 0, tenTinh: 'Da Nang' },
          { tinhId: 4, soLuongProperty: 0, tenTinh: 'Nha Trang' },
          { tinhId: 5, soLuongProperty: 0, tenTinh: 'Hoi An' },
          { tinhId: 6, soLuongProperty: 0, tenTinh: 'Sapa' }
        ])
      } finally {
        setIsLoadingProvinces(false)
      }
    }

    fetchTopProvinces()
  }, [])

  const handleInputChange = (field: keyof SearchFormData, value: string | number) => {
    setSearchData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    
    const params = new URLSearchParams()
    if (searchData.location) params.set('location', searchData.location)
    if (searchData.checkIn) params.set('checkIn', searchData.checkIn)
    if (searchData.checkOut) params.set('checkOut', searchData.checkOut)
    if (searchData.guests > 1) params.set('guests', searchData.guests.toString())

    router.push(`/properties?${params.toString()}`)
  }

  const handleProvinceSelect = (provinceName: string) => {
    handleInputChange('location', provinceName)
  }

  const handleDateSelect = (type: 'checkin' | 'checkout', date: string) => {
    if (type === 'checkin') {
      handleInputChange('checkIn', date)
      // If checkout date is before checkin date, clear it
      if (searchData.checkOut && searchData.checkOut <= date) {
        handleInputChange('checkOut', '')
      }
    } else if (type === 'checkout') {
      handleInputChange('checkOut', date)
    }
  }

  const handleGuestSelect = (guests: number) => {
    handleInputChange('guests', guests)
  }

  const openModal = (type: ModalType) => {
    setActiveModal(type)
  }

  const closeModal = () => {
    setActiveModal(null)
  }

  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return ''
    // Parse date string manually to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number)
    const date = new Date(year, month - 1, day) // month is 0-indexed in Date constructor
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="w-full px-2 sm:px-4 max-w-full md:max-w-6xl mx-auto">
      <form onSubmit={handleSearch}>
        {/* Search Bar */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-2 flex flex-col md:flex-row gap-2 w-full border border-white/20">
          
          {/* Location Input */}
          <div className="flex-1 min-w-0">
            <div className="relative">
              <MapPinIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/80" />
              <input
                type="text"
                placeholder="Bạn muốn đi đâu?"
                value={searchData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="w-full pl-12 pr-4 py-4 text-white placeholder-white/70 bg-transparent border-0 focus:outline-none focus:ring-0 rounded-xl hover:bg-white/10 transition-colors"
              />
            </div>
          </div>

          {/* Divider for desktop */}
          <div className="hidden md:block w-px bg-white/30"></div>

          {/* Check-in Date */}
          <div className="flex-1 min-w-0">
            <div className="relative">
              <CalendarDaysIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/80" />
              <button
                type="button"
                onClick={() => openModal('checkin')}
                className="w-full pl-12 pr-4 py-4 text-left text-white placeholder-white/70 bg-transparent border-0 focus:outline-none focus:ring-0 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              >
                {searchData.checkIn ? (
                  <span className="text-white">
                    {formatDateForDisplay(searchData.checkIn)}
                  </span>
                ) : (
                  <span className="text-white/70">Ngày nhận phòng</span>
                )}
              </button>
            </div>
          </div>

          {/* Divider for desktop */}
          <div className="hidden md:block w-px bg-white/30"></div>

          {/* Check-out Date */}
          <div className="flex-1 min-w-0">
            <div className="relative">
              <CalendarDaysIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/80" />
              <button
                type="button"
                onClick={() => openModal('checkout')}
                className="w-full pl-12 pr-4 py-4 text-left text-white placeholder-white/70 bg-transparent border-0 focus:outline-none focus:ring-0 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              >
                {searchData.checkOut ? (
                  <span className="text-white">
                    {formatDateForDisplay(searchData.checkOut)}
                  </span>
                ) : (
                  <span className="text-white/70">Ngày trả phòng</span>
                )}
              </button>
            </div>
          </div>

          {/* Divider for desktop */}
          <div className="hidden md:block w-px bg-white/30"></div>

          {/* Guests */}
          <div className="flex-1 min-w-0">
            <div className="relative">
              <UserGroupIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/80" />
              <button
                type="button"
                onClick={() => openModal('guests')}
                className="w-full pl-12 pr-4 py-4 text-left text-white placeholder-white/70 bg-transparent border-0 focus:outline-none focus:ring-0 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              >
                <span className="text-white">
                  {searchData.guests} {searchData.guests === 1 ? 'Khách' : 'Khách'}
                </span>
              </button>
            </div>
          </div>

          {/* Search Button */}
          <div className="flex-shrink-0">
            <Button 
              type="submit"
              size="lg"
              className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 border border-white/30"
            >
              <MagnifyingGlassIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Tìm kiếm</span>
            </Button>
          </div>
        </div>
      </form>

      {/* Quick suggestions */}
      <div className="mt-4 md:mt-6 relative overflow-hidden" style={{width: '100%', maxWidth: '100vw'}}>
        <div className="relative h-12">
          {isLoadingProvinces ? (
            // Loading skeleton
            <div className="absolute top-0 left-0 flex gap-3 animate-marquee-infinite">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 px-4 py-2 bg-gradient-to-r from-purple-400/20 to-pink-400/20 animate-pulse rounded-full h-8 w-20 whitespace-nowrap"
                />
              ))}
            </div>
          ) : (
            // Double the array for seamless loop
            <div className="absolute top-0 left-0 flex animate-marquee-infinite">
              {[...topProvinces, ...topProvinces].map((province, index) => (
                <button
                  key={`${province.tinhId}-${index}`}
                  type="button"
                  onClick={() => handleProvinceSelect(province.tenTinh)}
                  className="flex-shrink-0 mx-1 px-3 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 
                             hover:from-purple-600/30 hover:to-pink-600/30 transition-all duration-300 flex items-center gap-1 
                             backdrop-blur-sm border border-purple-400/30 shadow-lg hover:shadow-purple-500/25
                             hover:scale-105 transform whitespace-nowrap rounded-full"
                  title={`${province.soLuongProperty} properties available`}
                >
                  <span className="font-bold bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent text-sm md:text-base">
                    {province.tenTinh}
                  </span>
                  {province.soLuongProperty > 0 && (
                    <span className="text-xs bg-gradient-to-r from-purple-400 to-pink-400 text-white px-2 py-0.5 rounded-full font-bold">
                      {province.soLuongProperty}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
          
          {/* Gradient overlay */}
          <div className="absolute left-0 top-0 w-8 md:w-16 h-full bg-gradient-to-r from-background to-transparent z-10 pointer-events-none"></div>
          <div className="absolute right-0 top-0 w-8 md:w-16 h-full bg-gradient-to-l from-background to-transparent z-10 pointer-events-none"></div>
        </div>
      </div>

      {/* Modals */}
      <DatePickerModal
        isOpen={activeModal === 'checkin'}
        onClose={closeModal}
        selectedDate={searchData.checkIn}
        onDateSelect={(date) => handleDateSelect('checkin', date)}
        minDate={today}
        title="Chọn ngày nhận phòng"
        type="checkin"
      />

      <DatePickerModal
        isOpen={activeModal === 'checkout'}
        onClose={closeModal}
        selectedDate={searchData.checkOut}
        onDateSelect={(date) => handleDateSelect('checkout', date)}
        minDate={searchData.checkIn || today}
        title="Chọn ngày trả phòng"
        type="checkout"
      />

      <GuestPickerModal
        isOpen={activeModal === 'guests'}
        onClose={closeModal}
        selectedGuests={searchData.guests}
        onGuestSelect={handleGuestSelect}
        maxGuests={16}
      />
    </div>
  )
}