// Types cho Image Statistics
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
  error?: string;
}
export interface ImageOverview {
  summary: {
    totalImages: number;
    propertyImages: number;
    roomImages: number;
    reviewImages: number;
    userAvatars: number;
  };
  storage: {
    totalSizeBytes: number;
    totalSizeMB: number;
    propertyImagesSizeMB: number;
    avatarsFolderSizeMB: number;
    imagesFolderSizeMB: number;
    reviewFolderSizeMB: number;
  };
}

export interface PropertyImageStats {
  statistics: Array<{
    propertyId: number;
    propertyName: string;
    imageCount: number;
    totalSize: number;
    hasPrimary: boolean;
    imageTypes: Array<{
      type: string;
      count: number;
    }>;
  }>;
  propertiesWithoutImages: Array<{
    id: number;
    name: string;
  }>;
  totalProperties: number;
  propertiesWithImages: number;
  averageImagesPerProperty: number;
}

export interface RoomImageStats {
  statistics: Array<{
    roomTypeId: number;
    roomTypeName: string;
    propertyName: string;
    imageCount: number;
    hasPrimary: boolean;
  }>;
  roomTypesWithoutImages: Array<{
    id: number;
    name: string;
    propertyName: string;
  }>;
  totalRoomTypes: number;
  roomTypesWithImages: number;
  averageImagesPerRoomType: number;
}

export interface ReviewImageStats {
  statistics: Array<{
    reviewId: number;
    userName: string;
    propertyName: string;
    imageCount: number;
    createdAt: string;
  }>;
  summary: {
    totalReviews: number;
    reviewsWithImages: number;
    reviewsWithoutImages: number;
    percentageWithImages: number;
  };
  imagesByMonth: Array<{
    year: number;
    month: number;
    count: number;
  }>;
}

export interface AvatarStats {
  summary: {
    totalUsers: number;
    usersWithAvatar: number;
    usersWithoutAvatar: number;
    percentageWithAvatar: number;
  };
  usersByRole: Array<{
    role: string;
    count: number;
  }>;
  recentUploads: Array<{
    id: string;
    fullName: string;
    email: string;
    avatar: string;
    uploadedAt: string;
  }>;
}

export interface OrphanedImage {
  type: string;
  id: number | string;
  url: string;
  propertyId?: number;
  roomTypeId?: number;
  reviewId?: number;
  userName?: string;
}

export interface OrphanedImagesResponse {
  count: number;
  orphanedImages: OrphanedImage[];
}

export interface LargestImage {
  type: string;
  id: number;
  imageUrl: string;
  propertyName: string;
  fileSizeBytes: number;
  fileSizeMB: number;
  width: number;
  height: number;
}