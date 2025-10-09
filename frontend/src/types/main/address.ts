// types/address.ts
export interface Province {
  id: number;
  name: string;
  slug: string;
  code: string;
  region: string;
  type: string;
}

export interface Commune {
  id: number;
  name: string;
  slug: string;
  code: string;
  type: string;
  provinceName: string;
  provinceCode: string;
}

export interface TopProvince {
  tinhId: number;
  soLuongProperty: number;
  tenTinh: string;
}

// ✅ Updated interface cho property map marker với slug
export interface PropertyMapMarker {
  id: number;
  name: string;
  slug: string; // ✅ Thêm slug field
  latitude: number;
  longitude: number;
  primaryImage: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T;
  error?: string;
}