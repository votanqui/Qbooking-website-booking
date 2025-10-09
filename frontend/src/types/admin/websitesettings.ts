export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
  error?: string;
}

// Type đầy đủ cho admin
export interface WebsiteSetting {
  id: number;
  
  // Thông tin chung
  siteName: string;
  siteDescription?: string;
  logoUrl?: string;
  faviconUrl?: string;
  supportEmail?: string;
  supportPhone?: string;
  address?: string;
  
  // SEO
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  
  // Mạng xã hội
  facebookUrl?: string;
  twitterUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  tiktokUrl?: string;
  
  // Banking / Thanh toán
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// Type public - không có banking info
export interface PublicWebsiteSetting {
  siteName: string;
  siteDescription?: string;
  logoUrl?: string;
  faviconUrl?: string;
  supportEmail?: string;
  supportPhone?: string;
  address?: string;
  
  // SEO
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  
  // Mạng xã hội
  facebookUrl?: string;
  twitterUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  tiktokUrl?: string;
}

// DTO để gửi lên server
export interface WebsiteSettingsDto {
  // Thông tin chung
  siteName: string;
  siteDescription?: string;
  logo?: File;
  favicon?: File;
  supportEmail?: string;
  supportPhone?: string;
  address?: string;
  
  // SEO
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  
  // Mạng xã hội
  facebookUrl?: string;
  twitterUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  tiktokUrl?: string;
  
  // Banking / Thanh toán
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
}