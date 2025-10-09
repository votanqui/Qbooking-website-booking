'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Loading } from '@/components/ui/Loading'
import { Filter, Users, Bed, Home, ChevronLeft, ChevronRight } from 'lucide-react'
import { RoomFilterPanel } from '@/components/features/RoomFilterPanel'
import { roomService } from '@/services/main/room.service'
import { RoomListItem, RoomFilterParams } from '@/types/main/room'

const RoomsListPage = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [rooms, setRooms] = useState<RoomListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(12)
  
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<RoomFilterParams>({
    Page: 1,
    PageSize: 12,
    Adults: 1,
    Children: 0
  })

  // Parse URL params on mount
  useEffect(() => {
    const initialFilters: RoomFilterParams = {
      Page: parseInt(searchParams.get('page') || '1'),
      PageSize: pageSize,
      Adults: parseInt(searchParams.get('adults') || '1'),
      Children: parseInt(searchParams.get('children') || '0')
    }
    
    if (searchParams.get('name')) initialFilters.Name = searchParams.get('name') || undefined
    if (searchParams.get('bedType')) initialFilters.BedType = searchParams.get('bedType') || undefined
    if (searchParams.get('minPrice')) initialFilters.MinPrice = parseFloat(searchParams.get('minPrice') || '0')
    if (searchParams.get('maxPrice')) initialFilters.MaxPrice = parseFloat(searchParams.get('maxPrice') || '0')
    if (searchParams.get('provinceId')) initialFilters.ProvinceId = parseInt(searchParams.get('provinceId') || '0')
    if (searchParams.get('checkIn')) initialFilters.CheckIn = searchParams.get('checkIn') || undefined
    if (searchParams.get('checkOut')) initialFilters.CheckOut = searchParams.get('checkOut') || undefined
    if (searchParams.get('amenityIds')) {
      initialFilters.AmenityIds = searchParams.get('amenityIds')?.split(',').map(id => parseInt(id))
    }
    
    setFilters(initialFilters)
    setCurrentPage(initialFilters.Page || 1)
  }, [searchParams, pageSize])

  useEffect(() => {
    fetchRooms()
  }, [filters])

  const fetchRooms = async () => {
    try {
      setLoading(true)
      const response = await roomService.getRoomList(filters)
      
      if (response.success && response.data) {
        setRooms(response.data.roomTypes)
        setTotalCount(response.data.totalCount)
        setTotalPages(response.data.totalPages)
        setCurrentPage(response.data.page)
      }
    } catch (error) {
      console.error('Error fetching rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (newFilters: RoomFilterParams) => {
    const updatedFilters = { ...newFilters, Page: 1, PageSize: pageSize }
    setFilters(updatedFilters)
    updateURLParams(updatedFilters)
  }

  const updateURLParams = (newFilters: RoomFilterParams) => {
    const params = new URLSearchParams()
    
    if (newFilters.Name) params.set('name', newFilters.Name)
    if (newFilters.BedType) params.set('bedType', newFilters.BedType)
    if (newFilters.Adults) params.set('adults', newFilters.Adults.toString())
    if (newFilters.Children) params.set('children', newFilters.Children.toString())
    if (newFilters.MinPrice) params.set('minPrice', newFilters.MinPrice.toString())
    if (newFilters.MaxPrice) params.set('maxPrice', newFilters.MaxPrice.toString())
    if (newFilters.ProvinceId) params.set('provinceId', newFilters.ProvinceId.toString())
    if (newFilters.CheckIn) params.set('checkIn', newFilters.CheckIn)
    if (newFilters.CheckOut) params.set('checkOut', newFilters.CheckOut)
    if (newFilters.AmenityIds && newFilters.AmenityIds.length > 0) {
      params.set('amenityIds', newFilters.AmenityIds.join(','))
    }
    if (newFilters.Page) params.set('page', newFilters.Page.toString())
    
    router.push(`/rooms?${params.toString()}`)
  }

  const handlePageChange = (page: number) => {
    const newFilters = { ...filters, Page: page }
    setFilters(newFilters)
    updateURLParams(newFilters)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  const getImageUrl = (imageUrl: string) => {
    if (imageUrl.startsWith('/')) {
      return `${process.env.NEXT_PUBLIC_API_BASE_URL}${imageUrl}`
    }
    return imageUrl
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.Name) count++
    if (filters.BedType) count++
    if (filters.MinPrice || filters.MaxPrice) count++
    if (filters.ProvinceId) count++
    if (filters.CheckIn || filters.CheckOut) count++
    if (filters.AmenityIds && filters.AmenityIds.length > 0) count++
    return count
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-pink-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                Danh sách phòng
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Tìm thấy {totalCount} phòng
                {filters.Adults || filters.Children ? (
                  <span className="ml-2">
                    • {filters.Adults || 1} người lớn
                    {filters.Children ? `, ${filters.Children} trẻ em` : ''}
                  </span>
                ) : ''}
              </p>
            </div>
            
            <Button
              onClick={() => setShowFilters(true)}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 relative"
            >
              <Filter className="w-4 h-4 mr-2" />
              Bộ lọc
              {getActiveFiltersCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {getActiveFiltersCount()}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      <RoomFilterPanel
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        onFilterChange={handleFilterChange}
        initialFilters={filters}
      />

      {/* Room List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <Loading />
              <p className="mt-4 text-purple-600 font-medium">Đang tải danh sách phòng...</p>
            </div>
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏨</div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">Không tìm thấy phòng nào</h3>
            <p className="text-gray-500 mb-4">Hãy thử điều chỉnh bộ lọc của bạn</p>
            <Button
              onClick={() => handleFilterChange({ Page: 1, PageSize: 12, Adults: 1, Children: 0 })}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
            >
              Xóa bộ lọc
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  onClick={() => router.push(`/rooms/${room.slug}`)}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden shadow-sm border border-pink-100 hover:shadow-xl hover:border-pink-300 transition-all duration-300 cursor-pointer group"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={room.images.length > 0 ? getImageUrl(room.images[0]) : '/placeholder-room.jpg'}
                      alt={room.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                      <span className="text-sm font-semibold text-pink-600">
                        {formatPrice(room.basePrice)}
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1">
                      {room.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-1">
                      {room.propertyName}
                    </p>
                    
                    <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                      {room.shortDescription}
                    </p>

                    <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 mb-3">
                      <div className="flex items-center">
                        <Users className="w-3 h-3 mr-1 text-pink-500" />
                        <span>{room.maxGuests} khách</span>
                      </div>
                      <div className="flex items-center">
                        <Bed className="w-3 h-3 mr-1 text-pink-500" />
                        <span>{room.bedType}</span>
                      </div>
                      <div className="flex items-center">
                        <Home className="w-3 h-3 mr-1 text-pink-500" />
                        <span>{room.totalRooms} phòng</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <span className="text-xs text-gray-500">
                        {room.amenityCount} tiện nghi
                      </span>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                      >
                        Xem chi tiết
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <Button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                  className="border-pink-200"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                {[...Array(totalPages)].map((_, index) => {
                  const page = index + 1
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <Button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="sm"
                        className={currentPage === page 
                          ? 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white'
                          : 'border-pink-200 hover:bg-pink-50'
                        }
                      >
                        {page}
                      </Button>
                    )
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return <span key={page} className="px-2">...</span>
                  }
                  return null
                })}

                <Button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  size="sm"
                  className="border-pink-200"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default RoomsListPage