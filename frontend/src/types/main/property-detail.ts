export interface PropertyImage {
  id: number
  imageUrl: string
  imageType: string
  title: string
  description: string
  isPrimary: boolean
  sortOrder: number
}

export interface ProductType {
  id: number
  name: string
  code: string
  description: string
  icon: string
}

export interface PropertyAmenity {
  id: number
  name: string
  isFree: boolean
  additionalInfo: string
}

export interface RoomImage {
  imageUrl: string
  isPrimary: boolean
}

export interface RoomType {
  id: number
  name: string
  slug: string
  maxAdults: number
  maxChildren: number
  maxGuests: number
  bedType: string
  roomSize: number
  basePrice: number
  totalRooms: number
  images: RoomImage[]
}

export interface PropertyDetail {
  id: number
  name: string
  slug: string
  type: string
  productType: ProductType
  description: string
  shortDescription: string
  addressDetail: string
  province: string
  commune: string
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
  priceFrom: number
  currency: string
  status: string
  isActive: boolean
  metaTitle?: string
  metaDescription?: string
  metaKeywords?: string
  createdAt: string
  host: Host
  images: PropertyImage[]
  amenities: PropertyAmenity[]
  roomTypes: RoomType[]
  
}
export interface Host {
  id: number
  fullName: string
  email: string
  phone: string
  avatar: string
}
export interface PropertyDetailApiResponse {
  success: boolean
  message: string
  statusCode: number
  data: PropertyDetail
}