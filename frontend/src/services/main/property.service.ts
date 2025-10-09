import { 
  ApiResponse, 
  PropertyApiResponse, 
  PaginatedPropertyResponse, 
  PropertyFilterRequest,
  Property,
  ProductType,
  Province,
  AmenityCategoryResponse,
  PropertyForBooking
} from '@/types/main/property'
import { PropertyDetailApiResponse, PropertyDetail } from '@/types/main/property-detail'
const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api`;

class PropertyService {
  
  /**
   * Get approved properties with filters and sorting (UPDATED API with new booking parameters)
   * This is the main method for the properties page
   */
  async getApprovedProperties(filter: Partial<PropertyFilterRequest> = {}): Promise<ApiResponse<PaginatedPropertyResponse>> {
    try {
      const defaultFilter: PropertyFilterRequest = {
        page: 1,
        pageSize: 12,
        ...filter
      }

      const queryParams = new URLSearchParams()
      
      if (defaultFilter.name) queryParams.append('name', defaultFilter.name)
      if (defaultFilter.productTypeId) queryParams.append('productTypeId', defaultFilter.productTypeId.toString())
      if (defaultFilter.provinceId) queryParams.append('provinceId', defaultFilter.provinceId.toString())
      if (defaultFilter.minRating) queryParams.append('minRating', defaultFilter.minRating.toString())
      
      // 🆕 Handle new booking parameters
      if (defaultFilter.checkIn) queryParams.append('checkIn', defaultFilter.checkIn)
      if (defaultFilter.checkOut) queryParams.append('checkOut', defaultFilter.checkOut)
      if (defaultFilter.adults) queryParams.append('adults', defaultFilter.adults.toString())
      if (defaultFilter.children) queryParams.append('children', defaultFilter.children.toString())
      
      // Handle amenity IDs array
      if (defaultFilter.amenityIds && defaultFilter.amenityIds.length > 0) {
        defaultFilter.amenityIds.forEach(id => {
          queryParams.append('amenityIds', id.toString())
        })
      }
      
      queryParams.append('page', defaultFilter.page.toString())
      queryParams.append('pageSize', defaultFilter.pageSize.toString())

      const response = await fetch(`${API_BASE_URL}/Property/approved?${queryParams}`, {
        credentials: 'include'
      })
     
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching approved properties:', error)
      return {
        success: false,
        message: 'Lỗi khi tải danh sách property đã duyệt',
        statusCode: 500,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get featured properties from API (with new booking parameters)
   */
  async getFeaturedProperties(filter: Partial<PropertyFilterRequest> = {}): Promise<ApiResponse<PaginatedPropertyResponse>> {
    try {
      const defaultFilter: PropertyFilterRequest = {
        page: 1,
        pageSize: 10,
        ...filter
      }

      const queryParams = new URLSearchParams()
      
      if (defaultFilter.name) queryParams.append('name', defaultFilter.name)
      if (defaultFilter.productTypeId) queryParams.append('productTypeId', defaultFilter.productTypeId.toString())
      if (defaultFilter.provinceId) queryParams.append('provinceId', defaultFilter.provinceId.toString())
      if (defaultFilter.minRating) queryParams.append('minRating', defaultFilter.minRating.toString())
      
      // 🆕 Handle new booking parameters
      if (defaultFilter.checkIn) queryParams.append('checkIn', defaultFilter.checkIn)
      if (defaultFilter.checkOut) queryParams.append('checkOut', defaultFilter.checkOut)
      if (defaultFilter.adults) queryParams.append('adults', defaultFilter.adults.toString())
      if (defaultFilter.children) queryParams.append('children', defaultFilter.children.toString())
      
      // Handle amenity IDs array
      if (defaultFilter.amenityIds && defaultFilter.amenityIds.length > 0) {
        defaultFilter.amenityIds.forEach(id => {
          queryParams.append('amenityIds', id.toString())
        })
      }
      
      queryParams.append('page', defaultFilter.page.toString())
      queryParams.append('pageSize', defaultFilter.pageSize.toString())

      const response = await fetch(`${API_BASE_URL}/Property/featured?${queryParams}`, {
        credentials: 'include'
      })
   
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error fetching featured properties:', error)
      return {
        success: false,
        message: 'Lỗi khi tải danh sách property nổi bật',
        statusCode: 500,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
async getPropertyBySlug(slug: string): Promise<PropertyDetailApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/Property/slug/${slug}`, {           
        credentials: 'include'
      })
 
      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: false,
            message: 'Không tìm thấy property với slug này',
            statusCode: 404,
            data: {} as PropertyDetail
          }
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error fetching property by slug:', error)
      return {
        success: false,
        message: 'Lỗi khi tải thông tin property',
        statusCode: 500,
        data: {} as PropertyDetail
      }
    }
  }
  /**
   * Get all properties with filters (with new booking parameters)
   */
  async getProperties(filter: Partial<PropertyFilterRequest> = {}): Promise<ApiResponse<PaginatedPropertyResponse>> {
    try {
      const defaultFilter: PropertyFilterRequest = {
        page: 1,
        pageSize: 12,
        ...filter
      }

      const queryParams = new URLSearchParams()
      
      if (defaultFilter.name) queryParams.append('name', defaultFilter.name)
        console.log('Filter name:', defaultFilter.name)
      if (defaultFilter.productTypeId) queryParams.append('productTypeId', defaultFilter.productTypeId.toString())
      if (defaultFilter.provinceId) queryParams.append('provinceId', defaultFilter.provinceId.toString())
      if (defaultFilter.minRating) queryParams.append('minRating', defaultFilter.minRating.toString())
      
      // 🆕 Handle new booking parameters
      if (defaultFilter.checkIn) queryParams.append('checkIn', defaultFilter.checkIn)
      if (defaultFilter.checkOut) queryParams.append('checkOut', defaultFilter.checkOut)
      if (defaultFilter.adults) queryParams.append('adults', defaultFilter.adults.toString())
      if (defaultFilter.children) queryParams.append('children', defaultFilter.children.toString())
      
      // Handle amenity IDs array
      if (defaultFilter.amenityIds && defaultFilter.amenityIds.length > 0) {
        defaultFilter.amenityIds.forEach(id => {
          queryParams.append('amenityIds', id.toString())
        })
      }
      
      queryParams.append('page', defaultFilter.page.toString())
      queryParams.append('pageSize', defaultFilter.pageSize.toString())
console.log('Query Params:', queryParams.toString())
      const response = await fetch(`${API_BASE_URL}/Property?${queryParams}`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
 
      return await response.json()
      
    } catch (error) {
      console.error('Error fetching properties:', error)
      return {
        success: false,
        message: 'Lỗi khi tải danh sách property',
        statusCode: 500,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get property by ID
   */
  async getPropertyById(id: number): Promise<ApiResponse<PropertyApiResponse>> {
    try {
      const response = await fetch(`${API_BASE_URL}/Property/${id}`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error fetching property:', error)
      return {
        success: false,
        message: 'Lỗi khi tải thông tin property',
        statusCode: 500,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
async getPropertyByIdForBooking(id: number): Promise<ApiResponse<PropertyForBooking>> {
    try {
      const response = await fetch(`${API_BASE_URL}/Property/${id}/booking`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      // API trả về data trực tiếp, không có wrapper property
      return {
        success: result.success,
        message: result.message,
        statusCode: result.statusCode,
        data: result.data // data chính là PropertyForBooking
      }
    } catch (error) {
      console.error('Error fetching property for booking:', error)
      return {
        success: false,
        message: 'Lỗi khi tải thông tin khách sạn',
        statusCode: 500
      }
    }
  }

  /**
   * Get product types for filtering
   */
  async getProductTypes(): Promise<ProductType[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/Property/product-types`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()

      // Fix the response handling based on actual API structure
      if (result.success && result.data) {
        return result.data
      } else if (Array.isArray(result)) {
        // If the API directly returns an array
        return result
      } else if (result.data && Array.isArray(result.data)) {
        // If the data is nested differently
        return result.data
      }

      return []
    } catch (error) {
      console.error('Error fetching product types:', error)
      return []
    }
  }

  /**
   * Get provinces for filtering
   */
  async getProvinces(): Promise<Province[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/Province`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      return result.success ? result.data : []
    } catch (error) {
      console.error('Error fetching provinces:', error)
      return []
    }
  }

  /**
   * Get amenity categories and amenities for filtering
   */
  async getAmenityCategories(): Promise<AmenityCategoryResponse[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/Amenity/categories`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success && result.data) {
        return result.data
      } else if (Array.isArray(result)) {
        return result
      }
      
      return []
    } catch (error) {
      console.error('Error fetching amenity categories:', error)
      return []
    }
  }

  /**
   * Convert API response to UI Property format
   */
  convertApiResponseToProperty(apiProperty: PropertyApiResponse): Property {
    // Determine property type based on the Vietnamese type
    let propertyType: Property['propertyType'] = 'hotel'
    const typeMap: Record<string, Property['propertyType']> = {
      'khách sạn': 'hotel',
      'hotel': 'hotel',
      'căn hộ': 'apartment',
      'apartment': 'apartment',
      'biệt thự': 'villa',
      'villa': 'villa',
      'nhà': 'house',
      'house': 'house',
      'resort': 'resort',
      'homestay': 'homestay'
    }
    
    propertyType = typeMap[apiProperty.type.toLowerCase()] || 'hotel'

    // Format price - convert from VND to thousands for display
    const priceAmount = Math.round(apiProperty.priceFrom / 1000)
    
    return {
      id: apiProperty.id.toString(),
      title: apiProperty.name,
      slug: apiProperty.slug,
      description: apiProperty.description,
      location: {
        address: apiProperty.addressDetail,
        city: apiProperty.province,
        district: apiProperty.commune
      },
      price: {
        amount: priceAmount,
        currency: apiProperty.currency,
        period: 'night'
      },
      images: apiProperty.images.map(img => {
        return img.startsWith('/') ? `${API_BASE_URL.replace('/api', '')}${img}` : img
      }),
      thumbnail: apiProperty.images.length > 0 ? 
        (apiProperty.images[0].startsWith('/') ? 
          `${API_BASE_URL.replace('/api', '')}${apiProperty.images[0]}` : 
          apiProperty.images[0]) : 
        '/images/placeholder-property.jpg',
      rating: apiProperty.averageRating || 0,
      reviewCount: apiProperty.totalReviews,
      propertyType,
      roomType: 'entire_place',
      capacity: {
        guests: 2,
        bedrooms: 1,
        bathrooms: 1,
        beds: 1
      },
      amenities: apiProperty.amenities,
      features: [],
      rules: [],
      host: {
        id: '1',
        name: 'Host Name',
        avatar: '/images/default-avatar.jpg',
        isVerified: true,
        responseTime: 'Trong vòng 1 giờ',
        languages: ['Vietnamese', 'English']
      },
      availability: {
        isInstantBook: true,
        minStay: 1,
        checkIn: '15:00',
        checkOut: '12:00'
      },
      location_details: {
        neighborhood: apiProperty.commune,
        transportation: [],
        nearby: []
      },
      cancellationPolicy: 'flexible',
      isVerified: true,
      isSuperhost: apiProperty.isFeatured,
      createdAt: apiProperty.createdAt,
      updatedAt: apiProperty.createdAt,
      totalViews: apiProperty.totalViews
    }
  }

  /**
   * Get approved properties and convert to UI format (Main method for properties page)
   */
  async getApprovedPropertiesForUI(filter: Partial<PropertyFilterRequest> = {}): Promise<{
    properties: Property[]
    totalCount: number
    page: number
    pageSize: number
    totalPages: number
  }> {
    try {
      const response = await this.getApprovedProperties(filter)
      
      if (response.success && response.data) {
        const properties = response.data.properties.map(property => 
          this.convertApiResponseToProperty(property)
        )
        
        return {
          properties,
          totalCount: response.data.totalCount,
          page: response.data.page,
          pageSize: response.data.pageSize,
          totalPages: response.data.totalPages
        }
      }
      
      return {
        properties: [],
        totalCount: 0,
        page: 1,
        pageSize: 12,
        totalPages: 0
      }
    } catch (error) {
      console.error('Error getting approved properties for UI:', error)
      return {
        properties: [],
        totalCount: 0,
        page: 1,
        pageSize: 12,
        totalPages: 0
      }
    }
  }

  /**
   * Get featured properties and convert to UI format
   */
  async getFeaturedPropertiesForUI(filter: Partial<PropertyFilterRequest> = {}): Promise<Property[]> {
    try {
      const response = await this.getFeaturedProperties(filter)
      
      if (response.success && response.data) {
        return response.data.properties.map(property => this.convertApiResponseToProperty(property))
      }
      
      return []
    } catch (error) {
      console.error('Error getting featured properties for UI:', error)
      return []
    }
  }

  /**
   * Search properties by name/location (with new booking parameters)
   */
  async searchProperties(
    query: string, 
    page: number = 1, 
    pageSize: number = 12,
    bookingParams?: {
      checkIn?: string
      checkOut?: string
      adults?: number
      children?: number
    }
  ): Promise<{
    properties: Property[]
    totalCount: number
    page: number
    pageSize: number
    totalPages: number
  }> {
    return this.getApprovedPropertiesForUI({
      name: query,
      page,
      pageSize,
      ...bookingParams
    })
  }

  /**
   * Helper method to validate booking dates
   */
  validateBookingDates(checkIn?: string, checkOut?: string): { isValid: boolean, error?: string } {
    if (!checkIn || !checkOut) {
      return { isValid: true } // Both dates are optional
    }

    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (checkInDate < today) {
      return { isValid: false, error: 'Ngày nhận phòng không thể trước ngày hôm nay' }
    }

    if (checkOutDate <= checkInDate) {
      return { isValid: false, error: 'Ngày trả phòng phải sau ngày nhận phòng' }
    }

    return { isValid: true }
  }

  /**
   * Helper method to calculate total guests
   */
  calculateTotalGuests(adults?: number, children?: number): number {
    return (adults || 1) + (children || 0)
  }
  async getSimilarProperties(propertyId: number, limit: number = 10): Promise<ApiResponse<{ properties: PropertyApiResponse[] }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/Property/${propertyId}/similar?limit=${limit}`, {
      credentials: 'include'
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: false,
          message: 'Không tìm thấy property hoặc không có tọa độ',
          statusCode: 404
        }
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching similar properties:', error)
    return {
      success: false,
      message: 'Lỗi khi tải danh sách property tương tự',
      statusCode: 500,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get most viewed properties
 */
async getMostViewedProperties(limit: number = 10): Promise<ApiResponse<{ properties: PropertyApiResponse[] }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/Property/most-viewed?limit=${limit}`, {
      credentials: 'include'
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching most viewed properties:', error)
    return {
      success: false,
      message: 'Lỗi khi tải danh sách property xem nhiều nhất',
      statusCode: 500,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get most booked properties
 */
async getMostBookedProperties(limit: number = 10): Promise<ApiResponse<{ properties: PropertyApiResponse[] }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/Property/most-booked?limit=${limit}`, {
      credentials: 'include'
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching most booked properties:', error)
    return {
      success: false,
      message: 'Lỗi khi tải danh sách property được đặt nhiều nhất',
      statusCode: 500,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

}

export const propertyService = new PropertyService()