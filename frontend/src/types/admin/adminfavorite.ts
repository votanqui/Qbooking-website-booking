export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T;
  error?: string;
}

export interface AdminFavoriteDto {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  propertyId: number;
  propertyName: string;
  propertySlug: string;
  propertyImage: string;
  provinceName: string;
  createdAt: string;
}

export interface FavoriteStatisticsDto {
  totalFavorites: number;
  totalUsersWithFavorites: number;
  totalPropertiesFavorited: number;
  favoritesLast30Days: number;
  favoritesLast7Days: number;
  favoritesToday: number;
  averageFavoritesPerUser: number;
}

export interface TopFavoritePropertyDto {
  propertyId: number;
  propertyName: string;
  propertySlug: string;
  propertyImage: string;
  provinceName: string;
  productTypeName: string;
  favoriteCount: number;
}

export interface TopFavoriteUserDto {
  userId: number;
  userName: string;
  userEmail: string;
  favoriteCount: number;
  lastFavoriteDate: string;
}

export interface FavoriteTimelineDto {
  period: string;
  count: number;
  date: string;
}

export interface AmenityDto {
  id: number;
  name: string;
  isFree: boolean;
  additionalInfo?: string;
}

export interface FavoriteDto {
  id: number;
  propertyId: number;
  propertyName: string;
  slug: string;
  propertyImage: string;
  provinceName: string;
  communeName: string;
  productTypeName: string;
  amenities?: AmenityDto[];
  createdAt: string;
}

export interface GetAllFavoritesRequest {
  page?: number;
  pageSize?: number;
}

export interface GetAllFavoritesResponse {
  favorites: AdminFavoriteDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface GetTopPropertiesRequest {
  limit?: number;
}

export interface GetTopUsersRequest {
  limit?: number;
}

export interface GetTimelineRequest {
  startDate?: string;
  endDate?: string;
  groupBy?: 'day' | 'week' | 'month';
}