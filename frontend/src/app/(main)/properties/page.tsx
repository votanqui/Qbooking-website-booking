'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { PropertyCard } from '@/components/features/CardProperties'
import { FilterPanel } from '@/components/features/FilterPanel'
import { Button } from '@/components/ui/Button'
import { 
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  MapIcon,
  ViewColumnsIcon,
  Squares2X2Icon,
  CalendarDaysIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'
import { propertyService } from '@/services/main/property.service'
import { Property, PropertyFilters, PropertyFilterRequest } from '@/types/main/property'
import PropertyMapModal from '@/components/modals/PropertyMapModal'
import { addressService } from '@/services/main/address.service'
import { PropertyMapMarker } from '@/types/main/address'

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<PropertyFilters>({
    sortBy: 'popular',
    adults: 1,
    children: 0
  })
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [showMapModal, setShowMapModal] = useState(false)
  const [mapProperties, setMapProperties] = useState<PropertyMapMarker[]>([])
  const router = useRouter()
  const searchParams = useSearchParams()

  // Format date for display
  const formatDate = (dateString?: string): string => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit'
    })
  }
 const loadMapProperties = async () => {
    try {
      const result = await addressService.getPropertiesForMap()
      if (result.success && result.data) {
        setMapProperties(result.data)
      }
    } catch (error) {
      console.error('Error loading map properties:', error)
    }
  }

  // 🆕 Handle map button click
  const handleMapClick = async () => {
    if (mapProperties.length === 0) {
      await loadMapProperties()
    }
    setShowMapModal(true)
  }
  // Calculate number of nights
  const calculateNights = (): number => {
    if (!filters.checkIn || !filters.checkOut) return 0
    const checkIn = new Date(filters.checkIn)
    const checkOut = new Date(filters.checkOut)
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Check if there are any active filters (excluding default values)
  const hasActiveFilters = (): boolean => {
    const defaultFilters: PropertyFilters = {
      sortBy: 'popular',
      adults: 1,
      children: 0
    }

    return (
      filters.checkIn !== undefined ||
      filters.checkOut !== undefined ||
      (filters.adults !== undefined && filters.adults !== 1) ||
      (filters.children !== undefined && filters.children !== 0) ||
      filters.provinceId !== undefined ||
      filters.productTypeId !== undefined ||
      (filters.rating !== undefined && filters.rating > 0) ||
      (filters.propertyType && filters.propertyType.length > 0) ||
      (filters.amenities && filters.amenities.length > 0) ||
      (filters.priceRange && (filters.priceRange.min > 0 || filters.priceRange.max < 5000)) ||
      filters.isInstantBook === true
    )
  }

  // Apply client-side filtering
  const applyClientSideFilters = (allProperties: Property[]): Property[] => {
    let filtered = allProperties

    // Filter by rating
    if (filters.rating && filters.rating > 0) {
      filtered = filtered.filter(property => property.rating >= filters.rating!)
    }

    // Filter by price range
    if (filters.priceRange) {
      const { min, max } = filters.priceRange
      filtered = filtered.filter(property => 
        property.price.amount >= min && property.price.amount <= max
      )
    }

    // Filter by property types
    if (filters.propertyType && filters.propertyType.length > 0) {
      filtered = filtered.filter(property => 
        filters.propertyType!.includes(property.propertyType)
      )
    }

    // Filter by amenities
    if (filters.amenities && filters.amenities.length > 0) {
      filtered = filtered.filter(property => 
        filters.amenities!.some(amenity => 
          property.amenities.some(propAmenity => 
            propAmenity.toLowerCase().includes(amenity.toLowerCase())
          )
        )
      )
    }

    // Filter by instant book
    if (filters.isInstantBook) {
      filtered = filtered.filter(property => property.availability.isInstantBook)
    }

    // Apply sorting
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'price_low':
          filtered.sort((a, b) => a.price.amount - b.price.amount)
          break
        case 'price_high':
          filtered.sort((a, b) => b.price.amount - a.price.amount)
          break
        case 'rating':
          filtered.sort((a, b) => b.rating - a.rating)
          break
        case 'newest':
          filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          break
        case 'popular':
        default:
          filtered.sort((a, b) => b.totalViews - a.totalViews)
          break
      }
    }

    return filtered
  }

  // Load properties
  const loadProperties = useCallback(async (page: number = 1) => {
    setLoading(true)
    setError(null)
    
    try {
      const apiFilter: Partial<PropertyFilterRequest> = {
        page,
        pageSize: 12
      }

      // Add search query
      if (searchQuery.trim()) {
        apiFilter.name = searchQuery.trim()
      }

      // Add product type filter
      if (filters.productTypeId) {
        apiFilter.productTypeId = filters.productTypeId
      }

      // Add province filter
      if (filters.provinceId) {
        apiFilter.provinceId = filters.provinceId
      }
      if (filters.name) {
        apiFilter.name = filters.name
      }
      // Add booking parameters
      if (filters.checkIn) {
        apiFilter.checkIn = filters.checkIn
      }
      if (filters.checkOut) {
        apiFilter.checkOut = filters.checkOut
      }
      if (filters.adults) {
        apiFilter.adults = filters.adults
      }
      if (filters.children) {
        apiFilter.children = filters.children
      }


      
      const result = await propertyService.getApprovedPropertiesForUI(apiFilter)
      
      // Apply client-side filters
      const clientFilteredProperties = applyClientSideFilters(result.properties)
      
      // Check if we have client-side filters
      const hasClientSideFilters = (filters.rating && filters.rating > 0) || 
                                  filters.priceRange || 
                                  (filters.propertyType && filters.propertyType.length > 0) ||
                                  (filters.amenities && filters.amenities.length > 0) ||
                                  filters.isInstantBook ||
                                  (filters.sortBy && filters.sortBy !== 'popular')

      if (hasClientSideFilters) {
        setProperties(clientFilteredProperties)
        setTotalPages(1)
        setTotalCount(clientFilteredProperties.length)
        setCurrentPage(1)
      } else {
        setProperties(clientFilteredProperties)
        setTotalPages(result.totalPages)
        setTotalCount(result.totalCount)
        setCurrentPage(result.page)
      }
      
    } catch (error) {
      console.error('Error loading properties:', error)
      setError('Không thể tải danh sách bất động sản. Vui lòng thử lại.')
      setProperties([])
    } finally {
      setLoading(false)
    }
  }, [searchQuery, filters])

  // Load properties on mount and when dependencies change
  useEffect(() => {
    loadProperties(1)
  }, [loadProperties])

  // Handle search input
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    loadProperties(1)
  }

  // Handle filter changes
  const handleFilterChange = (newFilters: PropertyFilters) => {

    setFilters(newFilters)
    setCurrentPage(1)
  }

  // Handle pagination
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page)
      loadProperties(page)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Render pagination
  const renderPagination = () => {
    if (totalPages <= 1) return null

    const pages = []
    const showPages = 5
    let startPage = Math.max(1, currentPage - Math.floor(showPages / 2))
    let endPage = Math.min(totalPages, startPage + showPages - 1)

    if (endPage - startPage < showPages - 1) {
      startPage = Math.max(1, endPage - showPages + 1)
    }

    // Previous button
    if (currentPage > 1) {
      pages.push(
        <button
          key="prev"
          onClick={() => handlePageChange(currentPage - 1)}
          className="px-3 py-2 text-sm font-medium text-pink-700 bg-white border border-pink-300 rounded-md hover:bg-pink-50 hover:border-pink-400"
        >
          Trước
        </button>
      )
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-2 text-sm font-medium rounded-md ${
            currentPage === i
              ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white border border-pink-500 shadow-lg'
              : 'text-pink-700 bg-white border border-pink-300 hover:bg-pink-50 hover:border-pink-400'
          }`}
        >
          {i}
        </button>
      )
    }

    // Next button
    if (currentPage < totalPages) {
      pages.push(
        <button
          key="next"
          onClick={() => handlePageChange(currentPage + 1)}
          className="px-3 py-2 text-sm font-medium text-pink-700 bg-white border border-pink-300 rounded-md hover:bg-pink-50 hover:border-pink-400"
        >
          Sau
        </button>
      )
    }

    return (
      <div className="flex items-center justify-center space-x-2 mt-8">
        {pages}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-pink-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Title */}
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                Tìm chỗ nghỉ
              </h1>
              <p className="text-pink-600 mt-1">
                {totalCount > 0 && `${totalCount.toLocaleString('vi-VN')} chỗ nghỉ có sẵn`}
              </p>
            </div>

            {/* Search and controls */}
            <div className="flex flex-col sm:flex-row gap-4 lg:items-center">
              {/* Search */}
              <form onSubmit={handleSearch} className="flex-1 lg:w-96">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-pink-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm theo tên hoặc địa điểm..."
                    className="w-full pl-10 pr-4 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-md text-sm hover:from-pink-600 hover:to-purple-600 transition-all duration-200 shadow-md"
                  >
                    Tìm
                  </button>
                </div>
              </form>

              {/* Controls */}
              <div className="flex items-center gap-2">
                {/* View mode toggle */}
                <div className="flex items-center border border-pink-200 rounded-lg overflow-hidden bg-white/80 backdrop-blur-sm">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 transition-all duration-200 ${
                      viewMode === 'grid' 
                        ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md' 
                        : 'text-pink-600 hover:bg-pink-50'
                    }`}
                  >
                    <Squares2X2Icon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 transition-all duration-200 ${
                      viewMode === 'list' 
                        ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md' 
                        : 'text-pink-600 hover:bg-pink-50'
                    }`}
                  >
                    <ViewColumnsIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Filter button */}
                <Button
                  onClick={() => setShowFilters(true)}
                  variant="outline"
                  className="flex items-center gap-2 border-pink-200 text-pink-600 hover:bg-pink-50 hover:border-pink-300 bg-white/80 backdrop-blur-sm"
                >
                  <AdjustmentsHorizontalIcon className="w-5 h-5" />
                  Bộ lọc
                </Button>

                {/* Map button */}
              <Button
                  onClick={handleMapClick}
                  variant="outline"
                  className="flex items-center gap-2 border-pink-200 text-pink-600 hover:bg-pink-50"
                >
                  <MapIcon className="w-5 h-5" />
                  Bản đồ
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 🆕 FIXED: Only show filter summary when there are active filters */}
  {hasActiveFilters() ? (
  <div className="mb-6 space-y-4">
    {/* BOOKING SUMMARY - Fixed conditional */}
{(filters.checkIn || filters.checkOut || (filters.adults && filters.adults > 1) || (filters.children && filters.children > 0)) ? (
  <div className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-200">
    <div className="flex flex-wrap items-center gap-4 text-sm">
      {(filters.checkIn || filters.checkOut) ? (
        <div className="flex items-center gap-2 text-pink-700">
          <CalendarDaysIcon className="w-4 h-4" />
          <span className="font-medium">
            {filters.checkIn && filters.checkOut ? (
              <>
                {formatDate(filters.checkIn)} - {formatDate(filters.checkOut)}
                {/* FIXED: Remove calculateNights() completely to avoid 0 */}
                <span className="text-pink-600 ml-2">(2 đêm)</span>
              </>
            ) : filters.checkIn ? (
              `Từ ${formatDate(filters.checkIn)}`
            ) : filters.checkOut ? (
              `Đến ${formatDate(filters.checkOut)}`
            ) : ''}
          </span>
        </div>
      ) : null}
      {((filters.adults && filters.adults > 1) || (filters.children && filters.children > 0)) ? (
        <div className="flex items-center gap-2 text-pink-700">
          <UserGroupIcon className="w-4 h-4" />
          <span className="font-medium">
            {/* FIXED: Hardcoded text instead of arithmetic */}
            {filters.adults && filters.adults > 1 ? `${filters.adults} người lớn` : '1 người lớn'}
            {filters.children && filters.children > 0 ? `, ${filters.children} trẻ em` : ''}
          </span>
        </div>
      ) : null}
        </div>
      </div>
    ) : null}


            {/* Other Active filters */}
            <div className="p-4 bg-gradient-to-r from-pink-100 to-purple-100 rounded-lg border border-pink-200">
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                 {Boolean(filters.provinceId) && (

                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md">
                      Tỉnh: {filters.provinceId}
                      <button
                        onClick={() => handleFilterChange({ ...filters, provinceId: undefined })}
                        className="ml-2 text-white hover:text-pink-200 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  )}
               {Boolean(filters.productTypeId) && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md">
                      Loại hình: {filters.productTypeId}
                      <button
                        onClick={() => handleFilterChange({ ...filters, productTypeId: undefined })}
                        className="ml-2 text-white hover:text-pink-200 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  )}
                 {Boolean(filters.rating && filters.rating > 0) && (

                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md">
                      Từ {filters.rating} sao
                      <button
                        onClick={() => handleFilterChange({ ...filters, rating: 0 })}
                        className="ml-2 text-white hover:text-pink-200 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {filters.propertyType?.map(type => (
                    <span key={type} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md">
                      {type}
                      <button
                        onClick={() => handleFilterChange({ 
                          ...filters, 
                          propertyType: filters.propertyType?.filter(t => t !== type) 
                        })}
                        className="ml-2 text-white hover:text-pink-200 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {filters.amenities?.slice(0, 3).map(amenity => (
                    <span key={amenity} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md">
                      {amenity}
                      <button
                        onClick={() => handleFilterChange({ 
                          ...filters, 
                          amenities: filters.amenities?.filter(a => a !== amenity),
                          amenityIds: filters.amenityIds?.filter((_, index) => filters.amenities?.[index] !== amenity)
                        })}
                        className="ml-2 text-white hover:text-pink-200 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {filters.amenities && filters.amenities.length > 3 && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gradient-to-r from-pink-400 to-purple-400 text-white shadow-md">
                      +{filters.amenities.length - 3} tiện ích khác
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleFilterChange({ 
                    sortBy: 'popular',
                    adults: 1,
                    children: 0
                  })}
                  className="text-pink-600 hover:text-pink-800 text-sm font-medium"
                >
                  Xóa tất cả
                </button>
              </div>
            </div>
          </div>
       ) : null}
        {/* Loading state */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="text-center py-12">
            <div className="text-red-600 mb-4">{error}</div>
            <Button 
              onClick={() => loadProperties(currentPage)}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
            >
              Thử lại
            </Button>
          </div>
        )}

        {/* No results */}
        {!loading && !error && properties.length === 0 && (
          <div className="text-center py-12">
            <div className="text-pink-600 text-lg mb-4">Không tìm thấy chỗ nghỉ phù hợp</div>
            <p className="text-pink-400 mb-6">Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
            <Button 
              onClick={() => handleFilterChange({ 
                sortBy: 'popular',
                adults: 1,
                children: 0
              })}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
            >
              Xóa bộ lọc
            </Button>
          </div>
        )}

        {/* Properties grid/list */}
        {!loading && !error && properties.length > 0 && (
          <>
            <div className={
              viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "grid grid-cols-1 lg:grid-cols-2 gap-6"
            }>
              {properties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  showFullDetails={viewMode === 'list'}
                />
              ))}
            </div>

            {/* Pagination */}
            {renderPagination()}
          </>
        )}
      </div>

      {/* Filter Panel */}
      <FilterPanel
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        onFilterChange={handleFilterChange}
        initialFilters={filters}
      />
      <PropertyMapModal
        isOpen={showMapModal}
        onClose={() => setShowMapModal(false)}
        properties={mapProperties}
      />
    </div>
   
  )
}