// types/favorite.ts

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
  amenities: AmenityDto[];
  createdAt: string;
}

export interface AddFavoriteRequest {
  propertyId: number;
}

export interface RemoveFavoriteRequest {
  propertyId: number;
}

export interface GetFavoritesRequest {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface GetFavoritesResponse {
  items: FavoriteDto[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T;
  error?: string;
}