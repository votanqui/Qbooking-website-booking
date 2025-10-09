// ===== Common Types =====

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

// ===== Review Related Types =====

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

export interface ReviewListResponse {
  reviews: ReviewResponse[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// ===== Request Types =====

export interface AdminReviewFilterRequest {
  page: number;
  pageSize: number;
  customerId?: number;
  propertyId?: number;
  minRating?: number;
  maxRating?: number;
  status?: string;
  hasHostReply?: boolean;
  isFeatured?: boolean;
  isVerified?: boolean;
  fromDate?: Date;
  toDate?: Date;
  searchText?: string;
  sortBy?: string;
  sortOrder?: string;
}

export interface UpdateReviewStatusRequest {
  status: 'published' | 'hidden';
}

export interface StatisticsFilterRequest {
  fromDate?: Date;
  toDate?: Date;
  propertyId?: number;
}

export interface TrendsFilterRequest {
  fromDate?: Date;
  toDate?: Date;
  propertyId?: number;
  groupBy?: 'day' | 'week' | 'month';
}

export interface TopPropertiesFilterRequest {
  fromDate?: Date;
  toDate?: Date;
  minReviewCount?: number;
  limit: number;
}

// ===== Statistics Response Types =====

export interface ReviewStatisticsResponse {
  totalReviews: number;
  publishedReviews: number;
  hiddenReviews: number;
  featuredReviews: number;
  reviewsWithReply: number;
  reviewsWithoutReply: number;
  verifiedReviews: number;
  averageOverallRating: number;
  averageCleanlinessRating: number;
  averageLocationRating: number;
  averageServiceRating: number;
  averageValueRating: number;
  averageAmenitiesRating: number;
  totalHelpfulCount: number;
  reviewsWithImages: number;
  hostReplyRate: number;
}

export interface ReviewTrendResponse {
  period: string;
  totalReviews: number;
  averageRating: number;
  reviewsWithReply: number;
}

export interface TopPropertyResponse {
  propertyId: number;
  propertyName: string;
  totalReviews: number;
  averageRating: number;
  featuredReviewsCount: number;
  hostReplyRate: number;
}

export interface RatingDistributionResponse {
  fiveStars: number;
  fourStars: number;
  threeStars: number;
  twoStars: number;
  oneStar: number;
  totalReviews: number;
  fiveStarsPercentage: number;
  fourStarsPercentage: number;
  threeStarsPercentage: number;
  twoStarsPercentage: number;
  oneStarPercentage: number;
}

export interface HostResponseInfo {
  hostId: number;
  hostName: string;
  totalReviews: number;
  repliedReviews: number;
  replyRate: number;
}

export interface HostResponseStatisticsResponse {
  totalReviews: number;
  reviewsWithReply: number;
  reviewsWithoutReply: number;
  overallReplyRate: number;
  averageResponseTimeHours: number;
  responseWithin24Hours: number;
  responseWithin48Hours: number;
  responseWithin7Days: number;
  responseMoreThan7Days: number;
  topRespondingHosts: HostResponseInfo[];
}