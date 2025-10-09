// ===== REQUEST TYPES =====

export interface CreateReviewRequest {
  bookingId: number;
  propertyId: number;
  overallRating: number;
  cleanlinessRating?: number;
  locationRating?: number;
  serviceRating?: number;
  valueRating?: number;
  amenitiesRating?: number;
  title?: string;
  reviewText?: string;
  pros?: string;
  cons?: string;
  travelType?: string;
  roomStayed?: string;
  isAnonymous?: boolean;
  images?: File[];
}

export interface UpdateReviewRequest {
  overallRating?: number;
  cleanlinessRating?: number;
  locationRating?: number;
  serviceRating?: number;
  valueRating?: number;
  amenitiesRating?: number;
  title?: string;
  reviewText?: string;
  pros?: string;
  cons?: string;
  travelType?: string;
  roomStayed?: string;
  isAnonymous?: boolean;
  newImages?: File[];
  deleteImageIds?: number[];
}

export interface HostReplyRequest {
  hostReply: string;
}

export interface ReviewFilterRequest {
  page?: number;
  pageSize?: number;
  propertyId?: number;
  minRating?: number;
  maxRating?: number;
  status?: string;
  hasHostReply?: boolean;
  sortBy?: string;
  sortOrder?: string;
}

// ===== RESPONSE TYPES =====

export interface ReviewResponse {
  id: number;
  bookingId: number;
  customerId: number;
  propertyId: number;
  overallRating: number;
  cleanlinessRating?: number;
  locationRating?: number;
  serviceRating?: number;
  valueRating?: number;
  amenitiesRating?: number;
  title?: string;
  reviewText?: string;
  pros?: string;
  cons?: string;
  travelType?: string;
  roomStayed?: string;
  isVerified?: boolean;
  isAnonymous?: boolean;
  status?: string;
  hostReply?: string;
  hostRepliedAt?: string;
  isFeatured?: boolean;
  helpfulCount?: number;
  createdAt?: string;
  updatedAt?: string;
  customer?: CustomerInfo;
  property?: PropertyInfo;
  images: ReviewImageResponse[];
}

export interface ReviewImageResponse {
  id: number;
  imageUrl: string;
  displayOrder?: number;
}

export interface CustomerInfo {
  id: number;
  fullName: string;
  avatar?: string;
}

export interface PropertyInfo {
  id: number;
  name: string;
  slug?: string;
}

export interface ReviewListResponse {
  reviews: ReviewResponse[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface HostPropertyReviewsResponse {
  propertyId: number;
  propertyName: string;
  totalReviews: number;
  reviewsWithReply: number;
  pendingReviews: number;
  averageRating: number;
}

// ===== API RESPONSE WRAPPER =====

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T;
  error?: string;
}