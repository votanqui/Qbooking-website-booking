'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, Image, Home, Bed, MessageSquare, User, HardDrive, AlertCircle, TrendingUp, Download, RefreshCw } from 'lucide-react';
import { imageService } from '@/services/admin/image.service';
import type { 
  ImageOverview, 
  PropertyImageStats, 
  RoomImageStats, 
  ReviewImageStats, 
  AvatarStats, 
  OrphanedImagesResponse, 
  LargestImage 
} from '@/types/admin/image';

export default function ImageStatisticsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [overview, setOverview] = useState<ImageOverview | null>(null);
  const [propertyStats, setPropertyStats] = useState<PropertyImageStats | null>(null);
  const [roomStats, setRoomStats] = useState<RoomImageStats | null>(null);
  const [reviewStats, setReviewStats] = useState<ReviewImageStats | null>(null);
  const [avatarStats, setAvatarStats] = useState<AvatarStats | null>(null);
  const [orphanedImages, setOrphanedImages] = useState<OrphanedImagesResponse | null>(null);
  const [largestImages, setLargestImages] = useState<LargestImage[] | null>(null);
  const [largestLimit, setLargestLimit] = useState(20);

  // Hàm xử lý URL ảnh
  const getImageUrl = (url: string) => {
    if (!url) return '/images/placeholder.jpg';
    
    // Nếu URL đã là full URL thì giữ nguyên
    if (url.startsWith('http')) {
      return url;
    }
    
    // Nếu URL là đường dẫn tương đối, thêm base URL
    if (url.startsWith('/')) {
      return `${process.env.NEXT_PUBLIC_API_BASE_URL || ''}${url}`;
    }
    
    // Trường hợp khác, trả về URL gốc
    return url;
  };

  useEffect(() => {
    loadData(activeTab);
  }, [activeTab]);

  const loadData = async (tab: string) => {
    setLoading(true);
    setError(null);
    
    try {
      switch(tab) {
        case 'overview':
          if (!overview) {
            const res = await imageService.getOverview();
            if (res.success) setOverview(res.data);
            else setError(res.message);
          }
          break;
        case 'property':
          if (!propertyStats) {
            const res = await imageService.getPropertyImageStats();
            if (res.success) setPropertyStats(res.data);
            else setError(res.message);
          }
          break;
        case 'room':
          if (!roomStats) {
            const res = await imageService.getRoomImageStats();
            if (res.success) setRoomStats(res.data);
            else setError(res.message);
          }
          break;
        case 'review':
          if (!reviewStats) {
            const res = await imageService.getReviewImageStats();
            if (res.success) setReviewStats(res.data);
            else setError(res.message);
          }
          break;
        case 'avatar':
          if (!avatarStats) {
            const res = await imageService.getAvatarStats();
            if (res.success) setAvatarStats(res.data);
            else setError(res.message);
          }
          break;
        case 'orphaned':
          if (!orphanedImages) {
            const res = await imageService.getOrphanedImages();
            if (res.success) setOrphanedImages(res.data);
            else setError(res.message);
          }
          break;
        case 'largest':
          const res = await imageService.getLargestImages(largestLimit);
          if (res.success) setLargestImages(res.data);
          else setError(res.message);
          break;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    switch(activeTab) {
      case 'overview': setOverview(null); break;
      case 'property': setPropertyStats(null); break;
      case 'room': setRoomStats(null); break;
      case 'review': setReviewStats(null); break;
      case 'avatar': setAvatarStats(null); break;
      case 'orphaned': setOrphanedImages(null); break;
      case 'largest': setLargestImages(null); break;
    }
    loadData(activeTab);
  };

  const formatBytes = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const tabs = [
    { id: 'overview', label: 'Tổng quan', icon: BarChart3 },
    { id: 'property', label: 'Khách sạn', icon: Home },
    { id: 'room', label: 'Phòng', icon: Bed },
    { id: 'review', label: 'Đánh giá', icon: MessageSquare },
    { id: 'avatar', label: 'Avatar', icon: User },
    { id: 'orphaned', label: 'Orphaned', icon: AlertCircle },
    { id: 'largest', label: 'Lớn nhất', icon: TrendingUp }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 to-purple-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Image className="w-8 h-8" />
                Thống kê Hình ảnh
              </h1>
              <p className="text-pink-100 mt-2">Quản lý và theo dõi hình ảnh hệ thống</p>
            </div>
            <button 
              onClick={refreshData}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6 -mt-4">
        <div className="bg-white rounded-xl shadow-lg p-2 flex gap-2 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md'
                    : 'text-gray-600 hover:bg-pink-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-pink-200 border-t-pink-600"></div>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && overview && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <StatCard 
                    title="Tổng hình ảnh"
                    value={formatNumber(overview.summary.totalImages)}
                    icon={Image}
                    color="pink"
                  />
                  <StatCard 
                    title="Ảnh khách sạn"
                    value={formatNumber(overview.summary.propertyImages)}
                    icon={Home}
                    color="purple"
                  />
                  <StatCard 
                    title="Ảnh phòng"
                    value={formatNumber(overview.summary.roomImages)}
                    icon={Bed}
                    color="pink"
                  />
                  <StatCard 
                    title="Ảnh đánh giá"
                    value={formatNumber(overview.summary.reviewImages)}
                    icon={MessageSquare}
                    color="purple"
                  />
                  <StatCard 
                    title="Avatar người dùng"
                    value={formatNumber(overview.summary.userAvatars)}
                    icon={User}
                    color="pink"
                  />
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <HardDrive className="w-6 h-6 text-purple-600" />
                    Dung lượng lưu trữ
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <StorageBar 
                      label="Tổng dung lượng"
                      size={overview.storage.totalSizeMB}
                      total={overview.storage.totalSizeMB}
                      color="purple"
                    />
                    <StorageBar 
                      label="Ảnh khách sạn"
                      size={overview.storage.propertyImagesSizeMB}
                      total={overview.storage.totalSizeMB}
                      color="pink"
                    />
                    <StorageBar 
                      label="Thư mục Images"
                      size={overview.storage.imagesFolderSizeMB}
                      total={overview.storage.totalSizeMB}
                      color="purple"
                    />
                    <StorageBar 
                      label="Thư mục Review"
                      size={overview.storage.reviewFolderSizeMB}
                      total={overview.storage.totalSizeMB}
                      color="pink"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Property Tab */}
            {activeTab === 'property' && propertyStats && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatCard 
                    title="Tổng khách sạn"
                    value={formatNumber(propertyStats.totalProperties)}
                    icon={Home}
                    color="pink"
                  />
                  <StatCard 
                    title="Có hình ảnh"
                    value={formatNumber(propertyStats.propertiesWithImages)}
                    icon={Image}
                    color="purple"
                  />
                  <StatCard 
                    title="TB ảnh/khách sạn"
                    value={propertyStats.averageImagesPerProperty.toFixed(1)}
                    icon={BarChart3}
                    color="pink"
                  />
                </div>

                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-xl font-bold text-gray-800">Chi tiết khách sạn</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-pink-50 to-purple-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Tên khách sạn</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Số ảnh</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Dung lượng</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Ảnh chính</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {propertyStats.statistics.map((prop) => (
                          <tr key={prop.propertyId} className="hover:bg-pink-50 transition-colors">
                            <td className="px-6 py-4 text-sm text-gray-900">{prop.propertyId}</td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{prop.propertyName}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{formatNumber(prop.imageCount)}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{formatBytes(prop.totalSize)}</td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                prop.hasPrimary 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {prop.hasPrimary ? 'Có' : 'Không'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {propertyStats.propertiesWithoutImages.length > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-orange-800 mb-4">
                      Khách sạn chưa có hình ảnh ({propertyStats.propertiesWithoutImages.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {propertyStats.propertiesWithoutImages.map((prop) => (
                        <div key={prop.id} className="bg-white rounded-lg p-3 border border-orange-200">
                          <span className="text-sm font-medium text-gray-700">{prop.name}</span>
                          <span className="text-xs text-gray-500 ml-2">ID: {prop.id}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Room Tab */}
            {activeTab === 'room' && roomStats && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatCard 
                    title="Tổng loại phòng"
                    value={formatNumber(roomStats.totalRoomTypes)}
                    icon={Bed}
                    color="purple"
                  />
                  <StatCard 
                    title="Có hình ảnh"
                    value={formatNumber(roomStats.roomTypesWithImages)}
                    icon={Image}
                    color="pink"
                  />
                  <StatCard 
                    title="TB ảnh/loại phòng"
                    value={roomStats.averageImagesPerRoomType.toFixed(1)}
                    icon={BarChart3}
                    color="purple"
                  />
                </div>

                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-xl font-bold text-gray-800">Chi tiết loại phòng</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-pink-50 to-purple-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Loại phòng</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Khách sạn</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Số ảnh</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Ảnh chính</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {roomStats.statistics.map((room) => (
                          <tr key={room.roomTypeId} className="hover:bg-purple-50 transition-colors">
                            <td className="px-6 py-4 text-sm text-gray-900">{room.roomTypeId}</td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{room.roomTypeName}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{room.propertyName}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{formatNumber(room.imageCount)}</td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                room.hasPrimary 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {room.hasPrimary ? 'Có' : 'Không'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {roomStats.roomTypesWithoutImages.length > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-orange-800 mb-4">
                      Loại phòng chưa có hình ảnh ({roomStats.roomTypesWithoutImages.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {roomStats.roomTypesWithoutImages.map((room) => (
                        <div key={room.id} className="bg-white rounded-lg p-3 border border-orange-200">
                          <div className="font-medium text-gray-700">{room.name}</div>
                          <div className="text-sm text-gray-500">{room.propertyName}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Review Tab */}
            {activeTab === 'review' && reviewStats && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <StatCard 
                    title="Tổng đánh giá"
                    value={formatNumber(reviewStats.summary.totalReviews)}
                    icon={MessageSquare}
                    color="pink"
                  />
                  <StatCard 
                    title="Có hình ảnh"
                    value={formatNumber(reviewStats.summary.reviewsWithImages)}
                    icon={Image}
                    color="purple"
                  />
                  <StatCard 
                    title="Không có ảnh"
                    value={formatNumber(reviewStats.summary.reviewsWithoutImages)}
                    icon={AlertCircle}
                    color="pink"
                  />
                  <StatCard 
                    title="Tỷ lệ có ảnh"
                    value={reviewStats.summary.percentageWithImages.toFixed(1) + '%'}
                    icon={BarChart3}
                    color="purple"
                  />
                </div>

                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-xl font-bold text-gray-800">Đánh giá có hình ảnh</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-pink-50 to-purple-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Người dùng</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Khách sạn</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Số ảnh</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Ngày tạo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {reviewStats.statistics.map((review) => (
                          <tr key={review.reviewId} className="hover:bg-pink-50 transition-colors">
                            <td className="px-6 py-4 text-sm text-gray-900">{review.reviewId}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{review.userName}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{review.propertyName}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{formatNumber(review.imageCount)}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Avatar Tab */}
            {activeTab === 'avatar' && avatarStats && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <StatCard 
                    title="Tổng người dùng"
                    value={formatNumber(avatarStats.summary.totalUsers)}
                    icon={User}
                    color="purple"
                  />
                  <StatCard 
                    title="Có avatar"
                    value={formatNumber(avatarStats.summary.usersWithAvatar)}
                    icon={Image}
                    color="pink"
                  />
                  <StatCard 
                    title="Chưa có avatar"
                    value={formatNumber(avatarStats.summary.usersWithoutAvatar)}
                    icon={AlertCircle}
                    color="purple"
                  />
                  <StatCard 
                    title="Tỷ lệ có avatar"
                    value={avatarStats.summary.percentageWithAvatar.toFixed(1) + '%'}
                    icon={BarChart3}
                    color="pink"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Người dùng theo vai trò</h3>
                    <div className="space-y-3">
                      {avatarStats.usersByRole.map((role) => (
                        <div key={role.role} className="flex items-center justify-between p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg">
                          <span className="font-medium text-gray-700">{role.role}</span>
                          <span className="text-purple-600 font-bold">{formatNumber(role.count)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Upload gần đây</h3>
                    <div className="space-y-3">
                      {avatarStats.recentUploads.map((user) => (
                        <div key={user.id} className="flex items-center gap-3 p-3 hover:bg-pink-50 rounded-lg transition-colors">
                          <img 
                            src={getImageUrl(user.avatar)} 
                            alt={user.fullName}
                            className="w-12 h-12 rounded-full object-cover border-2 border-purple-200"
                            onError={(e) => {
                              // Fallback nếu ảnh lỗi
                              e.currentTarget.src = '/images/avatar-placeholder.png';
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">{user.fullName}</div>
                            <div className="text-sm text-gray-500 truncate">{user.email}</div>
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(user.uploadedAt).toLocaleDateString('vi-VN')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Orphaned Tab */}
            {activeTab === 'orphaned' && orphanedImages && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-800">
                      Hình ảnh orphaned ({formatNumber(orphanedImages.count)})
                    </h3>
                  </div>
                  
                  {orphanedImages.count === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-green-600 text-6xl mb-4">✓</div>
                      <p className="text-gray-600 text-lg">Không có hình ảnh orphaned</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {orphanedImages.orphanedImages.map((img, idx) => (
                        <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
                          <img 
                            src={getImageUrl(img.url)} 
                            alt={`Orphaned ${img.type}`}
                            className="w-full h-48 object-cover rounded-lg mb-3"
                            onError={(e) => {
                              e.currentTarget.src = '/images/image-placeholder.png';
                            }}
                          />
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                                {img.type}
                              </span>
                              <span className="text-sm text-gray-500">ID: {img.id}</span>
                            </div>
                            {img.propertyId && (
                              <p className="text-sm text-gray-600">Property: {img.propertyId}</p>
                            )}
                            {img.userName && (
                              <p className="text-sm text-gray-600">User: {img.userName}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Largest Tab */}
            {activeTab === 'largest' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-800">Hình ảnh lớn nhất</h3>
                    <div className="flex items-center gap-3">
                      <label className="text-sm text-gray-600">Hiển thị:</label>
                      <select 
                        value={largestLimit}
                        onChange={(e) => {
                          setLargestLimit(Number(e.target.value));
                          setLargestImages(null);
                          setTimeout(() => loadData('largest'), 100);
                        }}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                  </div>
                  
                  {largestImages && largestImages.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gradient-to-r from-pink-50 to-purple-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Hình ảnh</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Loại</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Khách sạn</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Kích thước</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Dung lượng</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {largestImages.map((img) => (
                            <tr key={img.id} className="hover:bg-pink-50 transition-colors">
                              <td className="px-6 py-4">
                                <img 
                                  src={getImageUrl(img.imageUrl)} 
                                  alt={img.propertyName}
                                  className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                                  onError={(e) => {
                                    e.currentTarget.src = '/images/image-placeholder.png';
                                  }}
                                />
                              </td>
                              <td className="px-6 py-4">
                                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                                  {img.type}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">{img.propertyName}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">
                                {img.width} × {img.height}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-gray-900">{img.fileSizeMB.toFixed(2)} MB</span>
                                  <span className="text-xs text-gray-500">{formatNumber(img.fileSizeBytes)} bytes</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      Không có dữ liệu
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Component StatCard
function StatCard({ title, value, icon: Icon, color }: { title: string; value: string; icon: any; color: 'pink' | 'purple' }) {
  const colorClasses = {
    pink: 'from-pink-500 to-pink-600 shadow-pink-200',
    purple: 'from-purple-500 to-purple-600 shadow-purple-200'
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-3 rounded-lg bg-gradient-to-br ${colorClasses[color]}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <p className="text-gray-600 text-sm mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

// Component StorageBar
function StorageBar({ label, size, total, color }: { label: string; size: number; total: number; color: 'pink' | 'purple' }) {
  const percentage = (size / total) * 100;
  const barColor = color === 'pink' ? 'bg-pink-500' : 'bg-purple-500';
  const bgColor = color === 'pink' ? 'bg-pink-100' : 'bg-purple-100';

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm text-gray-600">{size.toFixed(2)} MB</span>
      </div>
      <div className={`w-full h-3 ${bgColor} rounded-full overflow-hidden`}>
        <div 
          className={`h-full ${barColor} transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <div className="text-xs text-gray-500 mt-1">
        {percentage.toFixed(1)}% của tổng dung lượng
      </div>
    </div>
  );
}