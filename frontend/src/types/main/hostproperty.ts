// types/property.ts

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T;
  error?: string;
}

export interface PropertyHostFilterRequest {
  name?: string;
  productTypeId?: number;
  provinceId?: number;
  status?: string; // draft, pending, approved, rejected
  isActive?: boolean;
  isFeatured?: boolean;
  createdFrom?: string;
  createdTo?: string;
  priceFrom?: number;
  priceTo?: number;
  sortBy?: string; // name, created, price, views, bookings
  sortOrder?: string; // asc, desc
  page: number;
  pageSize: number;
}

export interface PropertyImage {
  id: number;
  imageUrl: string;
  imageType: string;
  isPrimary: boolean;
  title?: string;
  description?: string;
  sortOrder?: number;
}

export interface RoomType {
  id: number;
  name: string;
  slug: string;
  basePrice: number;
  totalRooms: number;
  isActive: boolean;
}

export interface PropertyStatistics {
  totalViews: number;
  totalBookings: number;
  totalReviews: number;
  averageRating: number;
  totalRevenue: number;
}

export interface Property {
  id: number;
  name: string;
  slug: string;
  type: string;
  description: string;
  shortDescription: string;
  addressDetail: string;
  province: string;
  commune: string;
  priceFrom: number;
  currency: string;
  status: string;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  totalImages: number;
  primaryImage: string;
  allImages: PropertyImage[];
  totalRoomTypes: number;
  activeRoomTypes: number;
  roomTypes: RoomType[];
  totalAmenities: number;
  amenities: string[];
  statistics: PropertyStatistics;
}

export interface PropertySummary {
  totalProperties: number;
  byStatus: { status: string; count: number }[];
  totalActive: number;
  totalFeatured: number;
  totalViews: number;
  totalBookings: number;
  totalRevenue: number;
}

export interface Pagination {
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AppliedFilters {
  name?: string;
  productTypeId?: number;
  provinceId?: number;
  status?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  createdFrom?: string;
  createdTo?: string;
  priceFrom?: number;
  priceTo?: number;
  sortBy?: string;
  sortOrder?: string;
}

export interface GetHostPropertiesResponse {
  properties: Property[];
  summary: PropertySummary;
  pagination: Pagination;
  appliedFilters: AppliedFilters;
}

// New types for property creation
export interface PropertyAmenityRequest {
  amenityId: number;
  isFree: boolean;
  additionalInfo?: string;
}

export interface CreatePropertyRequest {
  name: string;
  productTypeId: number;
  description: string;
  shortDescription: string;
  addressDetail: string;
  communeId: number;
  provinceId: number;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  starRating?: number;
  totalRooms: number;
  establishedYear?: number;
  checkInTime: string;
  checkOutTime: string;
  minStayNights: number;
  maxStayNights?: number;
  cancellationPolicy: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  priceFrom: number;
  currency: string;
  amenities?: PropertyAmenityRequest[];
}

export interface CreatePropertyResponse {
  id: number;
  name: string;
  status: string;
}

export interface UploadPropertyImagesRequest {
  files: File[];
  imageTypes: string[];
  titles: string[];
  descriptions: string[];
  isPrimaries: boolean[];
  sortOrders: number[];
}

export interface UploadResult {
  index: number;
  success: boolean;
  message: string;
  fileName?: string;
  imageUrl?: string;
  originalFileName?: string;
  imageType?: string;
  title?: string;
  description?: string;
  isPrimary?: boolean;
  sortOrder?: number;
  fileSize?: number;
  width?: number;
  height?: number;
  metadataCaptured?: boolean;
}

export interface UploadPropertyImagesResponse {
  totalFiles: number;
  successCount: number;
  failCount: number;
  metadataCapturedCount: number;
  results: UploadResult[];
  propertyImages: PropertyImage[];
}

// Amenity types
export interface Amenity {
  id: number;
  categoryId: number;
  name: string;
  slug: string;
  icon: string;
  description: string;
  isPopular: boolean;
  sortOrder: number;
  categoryName: string;
}

export interface AmenityCategoryResponse {
  id: number;
  name: string;
  slug: string;
  icon: string;
  description: string;
  sortOrder: number;
  amenities: Amenity[];
}

// Room Types
export interface RoomAmenityRequest {
  amenityId: number;
  quantity: number;
}

export interface CreateSingleRoomTypeRequest {
  propertyId: number;
  name: string;
  description?: string;
  shortDescription?: string;
  maxAdults: number;
  maxChildren: number;
  maxGuests: number;
  bedType?: string;
  roomSize?: number;
  basePrice: number;
  weekendPrice?: number;
  holidayPrice?: number;
  weeklyDiscountPercent: number;
  monthlyDiscountPercent: number;
  totalRooms: number;
  metaTitle?: string;
  metaDescription?: string;
  amenities?: RoomAmenityRequest[];
}

export interface RoomTypeData {
  name: string;
  description?: string;
  shortDescription?: string;
  maxAdults: number;
  maxChildren: number;
  maxGuests: number;
  bedType?: string;
  roomSize?: number;
  basePrice: number;
  weekendPrice?: number;
  holidayPrice?: number;
  weeklyDiscountPercent: number;
  monthlyDiscountPercent: number;
  totalRooms: number;
  metaTitle?: string;
  metaDescription?: string;
  amenities?: RoomAmenityRequest[];
}

export interface CreateMultipleRoomTypesRequest {
  propertyId: number;
  roomTypes: RoomTypeData[];
}

export interface RoomTypeResponse {
  id: number;
  name: string;
  slug: string;
  propertyId: number;
  amenitiesCount: number;
}

export interface HostRoomTypeDetailResponse {
  id: number;
  propertyId: number;
  propertyName: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  maxAdults: number;
  maxChildren: number;
  maxGuests: number;
  bedType?: string;
  roomSize?: number;
  basePrice: number;
  weekendPrice?: number;
  holidayPrice?: number;
  totalRooms: number;
  isActive: boolean;
  createdAt: string;
  images: string[];
  amenities: RoomAmenityDetailResponse[];
}

export interface RoomAmenityDetailResponse {
  id: number;
  name: string;
  slug: string;
  icon: string;
  description: string;
  isPopular: boolean;
  categoryName: string;
}

// Room Image Types
export interface UploadRoomImageRequest {
  files: File[];
  titles: string[];
  descriptions: string[];
  isPrimaries: boolean[];
  sortOrders: number[];
}

export interface RoomImage {
  id: number;
  imageUrl: string;
  title?: string;
  description?: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface UploadRoomImageResponse {
  totalFiles: number;
  successCount: number;
  failCount: number;
  results: UploadResult[];
  roomImages: RoomImage[];
  hasExistingPrimary: boolean;
  primaryImageUpdated: boolean;
}
export interface ProductType {
  id: number;
  name: string;
  code: string;
  description: string;
  icon: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  properties: any[];
}
export interface PropertyImageForEdit {
  id: number
  imageUrl: string
  imageType: string
  title: string
  description: string
  isPrimary: boolean
  sortOrder: number
}

export interface RoomImageForEdit {
  id: number
  imageUrl: string
  title: string
  description: string
  isPrimary: boolean
  sortOrder: number
}

export interface RoomAmenityForEdit {
  amenityId: number
  quantity: number
}

export interface RoomTypeForEdit {
  id: number
  name: string
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
  weeklyDiscountPercent: number
  monthlyDiscountPercent: number
  totalRooms: number
  metaTitle: string
  metaDescription: string
  images: RoomImageForEdit[]
  amenities: RoomAmenityForEdit[]
}

export interface PropertyAmenityForEdit {
  amenityId: number
  isFree: boolean
  additionalInfo: string
}

export interface PropertyForEditResponse {
  id: number
  name: string
  productTypeId: number
  description: string
  shortDescription: string
  addressDetail: string
  communeId: number
  provinceId: number
  postalCode: string
  latitude: number
  longitude: number
  starRating: number
  totalRooms: number
  establishedYear: number
  checkInTime: string
  checkOutTime: string
  minStayNights: number
  maxStayNights: number
  cancellationPolicy: string
  metaTitle: string
  metaDescription: string
  metaKeywords: string
  priceFrom: number
  currency: string
  images: PropertyImageForEdit[]
  amenities: PropertyAmenityForEdit[]
  roomTypes: RoomTypeForEdit[]
}

// Update Requests
export interface UpdatePropertyRequest {
  name: string
  productTypeId: number
  description: string
  shortDescription: string
  addressDetail: string
  communeId: number
  provinceId: number
  postalCode?: string
  latitude: number
  longitude: number
  starRating?: number
  totalRooms: number
  establishedYear?: number
  checkInTime: string
  checkOutTime: string
  minStayNights: number
  maxStayNights?: number
  cancellationPolicy: string
  metaTitle?: string
  metaDescription?: string
  metaKeywords?: string
  priceFrom: number
  currency: string
  amenities?: PropertyAmenityRequest[]
}

export interface UpdateRoomTypeRequest {
  name: string
  description?: string
  shortDescription?: string
  maxAdults: number
  maxChildren: number
  maxGuests: number
  bedType?: string
  roomSize?: number
  basePrice: number
  weekendPrice?: number
  holidayPrice?: number
  weeklyDiscountPercent: number
  monthlyDiscountPercent: number
  totalRooms: number
  metaTitle?: string
  metaDescription?: string
  amenities?: RoomAmenityRequest[]
}

export interface UpdatePropertyImageRequest {
  imageId: number
  title: string
  description: string
  imageType: string
  sortOrder: number
}
export interface SubmitPropertyForReviewResponse {
  id: number;
  name: string;
  status: string;
  submittedAt: string;
}