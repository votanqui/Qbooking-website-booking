export interface CouponApplication {
  id: number;
  applicableType: string; // property, propertyType, location
  applicableId: number;
  applicableName?: string; // Tên của property/propertyType/location
}

export interface PublicCouponResponse {
  id: number;
  code: string;
  name: string;
  description: string;
  discountType: string; // percentage, fixedAmount, freeNight
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderAmount: number;
  minNights: number;
  endDate: string;
  isFeatured: boolean;
  applicableTo: string; // all, property, propertyType, location
  applications: CouponApplication[];
}

export interface DiscountDisplayItem {
  id: number;
  code: string;
  description: string;
  discount: string; // Formatted discount text (e.g., "100K", "20%", "1 đêm")
  type: string; // special, fixed, percentage, freenight
  validUntil?: string;
  applicableLocations?: string[]; // Danh sách tên locations áp dụng
  applicableProperties?: string[]; // Danh sách tên properties áp dụng
  applicableTypes?: string[]; // Danh sách tên property types áp dụng
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T;
  error?: string;
}