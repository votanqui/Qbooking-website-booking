// types/property.ts

// Base API response structure
export interface ApiResponse<T = any> {
  success: boolean
  message: string
  statusCode: number
  data?: T
  error?: string
}

// Property response from API (matches your C# PropertyResponse)
export interface PropertyApiResponse {
  id: number
  name: string
  slug: string
  type: string
  description: string
  addressDetail: string
  province: string
  commune: string
  priceFrom: number
  currency: string
  status: string
  isFeatured: boolean
  isActive: boolean
  createdAt: string
  totalViews: number
  totalReviews: number
  averageRating: number | null
  images: string[]
  amenities: string[]
}

// Paginated response structure
export interface PaginatedPropertyResponse {
  properties: PropertyApiResponse[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

// Updated filter request structure (matches your updated C# PropertyApprovedFilterRequest)
export interface PropertyFilterRequest {
  name?: string
  productTypeId?: number
  provinceId?: number
  amenityIds?: number[]
  minRating?: number
  // 🆕 New booking parameters
  checkIn?: string              // ISO date string (YYYY-MM-DD)
  checkOut?: string             // ISO date string (YYYY-MM-DD)
  adults?: number               // Number of adult guests
  children?: number             // Number of child guests
  page: number
  pageSize: number
}

// Product Type for filtering
export interface ProductType {
  id: number;
  name: string;
}

// Province for filtering
export interface Province {
  id: number
  name: string
  code?: string
}

// Amenity response structure
export interface AmenityResponse {
  id: number
  categoryId: number
  name: string
  slug: string
  icon: string
  description: string
  isPopular: boolean
  sortOrder: number
  categoryName: string
}

// Amenity category response structure
export interface AmenityCategoryResponse {
  id: number
  name: string
  slug: string
  icon: string
  description: string
  sortOrder: number
  amenities: AmenityResponse[]
}

// Converted Property for UI components
export interface Property {
  id: string
  title: string
  slug: string
  description: string
  location: {
    address: string
    city: string
    district?: string
    coordinates?: {
      lat: number
      lng: number
    }
  }
  price: {
    amount: number
    currency: string
    period: 'night' | 'month' | 'week'
  }
  images: string[]
  thumbnail: string
  rating: number
  reviewCount: number
  propertyType: 'apartment' | 'villa' | 'house' | 'hotel' | 'resort' | 'homestay'
  roomType: 'entire_place' | 'private_room' | 'shared_room'
  capacity: {
    guests: number
    bedrooms: number
    bathrooms: number
    beds: number
  }
  amenities: string[]
  features: string[]
  rules: string[]
  host: {
    id: string
    name: string
    avatar: string
    isVerified: boolean
    responseTime: string
    languages: string[]
  }
  availability: {
    isInstantBook: boolean
    minStay: number
    maxStay?: number
    checkIn: string
    checkOut: string
  }
  location_details: {
    neighborhood: string
    transportation: string[]
    nearby: string[]
  }
  cancellationPolicy: 'flexible' | 'moderate' | 'strict'
  isVerified: boolean
  isSuperhost: boolean
  createdAt: string
  updatedAt: string
  totalViews: number
}

// Updated property filters for UI filtering
export interface PropertyFilters {
  location?: string
  // 🆕 Updated booking parameters
  checkIn?: string              // ISO date string (YYYY-MM-DD)
  checkOut?: string             // ISO date string (YYYY-MM-DD)
  adults?: number               // Number of adult guests (default: 1)
  children?: number             // Number of child guests (default: 0)
  priceRange?: {
    min: number
    max: number
  }
  name?: string
  propertyType?: string[]
  roomType?: string[]
  amenities?: string[]           // Keep string array for backward compatibility
  amenityIds?: number[]          // New field for amenity IDs
  rating?: number                // This will map to minRating in API
  isInstantBook?: boolean
  sortBy?: 'price_low' | 'price_high' | 'rating' | 'newest' | 'popular'
  provinceId?: number
  productTypeId?: number
}

// Search parameters
export interface PropertySearchParams {
  query?: string
  page?: number
  limit?: number
  filters?: PropertyFilters
}


export interface PropertyForBooking {
  id: number
  name: string
  addressDetail: string
  province: string
  commune: string
  checkInTime: string
  checkOutTime: string
  starRating: number
  mainImage: string
  roomTypes: RoomTypeForBooking[]
}

export interface RoomTypeForBooking {
  id: number
  name: string
  maxAdults: number
  maxChildren: number
  maxGuests: number
  bedType: string
  basePrice: number
  roomImage: string
}