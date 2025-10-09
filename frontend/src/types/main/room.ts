// types/room.ts

export interface RoomImage {
  id: number;
  imageUrl: string;
  title?: string;
  description?: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface RoomAmenity {
  id: number;
  name: string;
  quantity?: number;
}

export interface RoomDetailResponse {
  id: number;
  propertyId: number;
  propertyName: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  maxAdults: number;
  maxChildren: number;
  maxGuests: number;
  bedType: string;
  roomSize: number;
  basePrice: number;
  weekendPrice: number;
  holidayPrice: number;
  weeklyDiscountPercent: number;
  monthlyDiscountPercent: number;
  totalRooms: number;
  metaTitle: string;
  metaDescription: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  images: RoomImage[];
  amenities: RoomAmenity[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T;
  error?: string;
}
export interface RoomFilterParams {
  Page?: number
  PageSize?: number
  
  // Basic filters
  Name?: string
  BedType?: string
  
  // Guest filters
  Adults?: number
  Children?: number
  
  // Price filters
  MinPrice?: number
  MaxPrice?: number
  
  // Location filter
  ProvinceId?: number
  
  // Date filters (for availability)
  CheckIn?: string
  CheckOut?: string
  
  // Amenity filters
  AmenityIds?: number[]
  
  // Legacy fields (keeping for backward compatibility)
  PropertyId?: number
  MaxAdults?: number
  MaxGuests?: number
  IsActive?: boolean
}

export interface RoomListItem {
  id: number
  propertyId: number
  propertyName: string
  propertySlug: string
  province: string
  commune?: string
  name: string
  slug: string
  description: string
  shortDescription: string
  maxAdults: number
  maxChildren: number
  maxGuests: number
  bedType: string
  roomSize: number
  basePrice: number
  weekendPrice: number
  holidayPrice: number
  totalRooms: number
  isActive: boolean
  createdAt: string
  images: string[]
  amenities: string[]
  amenityCount: number
  totalBookings: number
}

export interface RoomListResponse {
  roomTypes: RoomListItem[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}