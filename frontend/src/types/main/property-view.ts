// types/property-view.ts

export interface PropertyViewRequest {
  propertyId: number;
}

export interface PropertyViewResponse {
  id: number;
  propertyId: number;
  userId?: number;
  viewedAt: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  statusCode?: number;
}