// src/types/adminproperty.ts
export interface PropertyAdminFilter {
  name?: string;
  productTypeId?: number;
  provinceId?: number;
  hostId?: number;
  status?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  createdFrom?: string;
  createdTo?: string;
  priceFrom?: number;
  priceTo?: number;
  sortBy?: string;
  sortOrder?: string;
  page: number;
  pageSize: number;
}

export interface PropertyAdmin {
  id: number;
  name: string;
  slug: string;
  host: {
    id: number;
    name: string;
    email: string;
  };
  productType: string;
  province: string;
  status: string;
  isActive: boolean;
  isFeatured: boolean;
  priceFrom: number;
  currency: string;
  totalRoomTypes: number;
  createdAt: string;
  updatedAt: string;
  primaryImage: string;
  totalBookings: number;
  totalRevenue: number;
  totalReviews: number;
  averageRating?: number;
}

export interface PropertyDetailAdmin {
  property: {
    id: number;
    name: string;
    slug: string;
    host: {
      id: number;
      fullName: string;
      email: string;
      phone: string;
    };
    productType: {
      id: number;
      name: string;
    };
    description: string;
    shortDescription: string;
    addressDetail: string;
    province: string;
    commune: string;
    status: string;
    isActive: boolean;
    isFeatured: boolean;
    priceFrom: number;
    currency: string;
    starRating: number;
    totalRooms: number;
    createdAt: string;
    updatedAt: string;
    images: Array<{
      id: number;
      imageUrl: string;
      isPrimary: boolean;
      imageType: string;
    }>;
    amenities: Array<{
      id: number;
      name: string;
      isFree: boolean;
    }>;
    roomTypes: Array<{
      id: number;
      name: string;
      basePrice: number;
      totalRooms: number;
      isActive: boolean;
      images: string[];
    }>;
  };
  statistics: {
    totalBookings: number;
    bookingsByStatus: Array<{
      status: string;
      count: number;
      totalAmount: number;
    }>;
    totalRevenue: number;
    totalReviews: number;
    averageRating?: number;
    recentReviews: Array<{
      id: number;
      guestName: string;
      overallRating: number;
      reviewText: string;
      createdAt: string;
    }>;
  };
}

export interface PropertyStatistics {
  totalProperties: number;
  activeProperties: number;
  featuredProperties: number;
  byStatus: Array<{ status: string; count: number }>;
  byProductType: Array<{ type: string; count: number }>;
  topProvinces: Array<{ province: string; count: number }>;
  totalRevenue: number;
  totalBookings: number;
  averagePropertyPrice: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
}

export interface PaginationResponse<T> {
  properties: T[];
  pagination: {
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}