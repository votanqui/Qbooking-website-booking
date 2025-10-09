// app/properties/manage/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  PropertyHostFilterRequest, 
  GetHostPropertiesResponse, 
  Property,
  PropertySummary
} from '@/types/main/hostproperty';
import { propertyService } from '@/services/main/hostproperty.service';
import PropertyCard from '@/components/features/HostPropertyCard';
import FilterPanel from '@/components/features/HostFilterPanel';
import { useToast } from '@/components/ui/Toast';

const PropertiesManagerPage = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [summary, setSummary] = useState<PropertySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);
const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [filters, setFilters] = useState<PropertyHostFilterRequest>({
    page: 1,
    pageSize: 12,
    sortBy: 'created',
    sortOrder: 'desc',
  });
const handleSubmitForReview = async (propertyId: number) => {
  try {
    setSubmittingId(propertyId);
    
    const response = await propertyService.submitPropertyForReview(propertyId);
    
    if (response.success) {
      fetchProperties();
      showToast('Gửi duyệt bất động sản thành công!', 'success');
    } else {
      showToast(response.message || 'Không thể gửi duyệt bất động sản', 'error');
    }
  } catch (err) {
    console.error('Lỗi khi gửi duyệt bất động sản:', err);
    showToast('Đã xảy ra lỗi khi gửi duyệt bất động sản', 'error');
  } finally {
    setSubmittingId(null);
  }
};
  // Tải danh sách bất động sản
  const fetchProperties = async (newFilters?: PropertyHostFilterRequest) => {
    try {
      setLoading(true);
      setError(null);
      
      const filtersToUse = newFilters || filters;
      const response = await propertyService.getHostProperties(filtersToUse);
      
      if (response.success && response.data) {
        setProperties(response.data.properties);
        setSummary(response.data.summary);
        setCurrentPage(response.data.pagination.page);
        setTotalPages(response.data.pagination.totalPages);
        setTotalCount(response.data.pagination.totalCount);
      } else {
        setError(response.message || 'Không thể tải danh sách bất động sản');
        showToast(response.message || 'Không thể tải danh sách bất động sản', 'error');
      }
    } catch (err) {
      console.error('Lỗi khi tải bất động sản:', err);
      const errorMessage = 'Đã xảy ra lỗi khi tải danh sách bất động sản';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Tải lần đầu
  useEffect(() => {
    fetchProperties();
  }, []);

  // Xử lý thay đổi bộ lọc
  const handleFiltersChange = (newFilters: PropertyHostFilterRequest) => {
    const updatedFilters = { ...newFilters, page: 1 };
    setFilters(updatedFilters);
    fetchProperties(updatedFilters);
  };

  // Đặt lại bộ lọc
  const handleResetFilters = () => {
    const defaultFilters: PropertyHostFilterRequest = {
      page: 1,
      pageSize: 12,
      sortBy: 'created',
      sortOrder: 'desc',
    };
    setFilters(defaultFilters);
    fetchProperties(defaultFilters);
    showToast('Đã đặt lại bộ lọc', 'success');
  };

  // Chuyển trang
  const handlePageChange = (page: number) => {
    const newFilters = { ...filters, page };
    setFilters(newFilters);
    fetchProperties(newFilters);
  };

  // Cập nhật bất động sản
  const handleUpdate = (propertyId: number) => {
    router.push(`/host/edit/${propertyId}`);
  };

  // Thêm phòng
  const handleAddRoom = (propertyId: number) => {
   router.push(`/host/room/${propertyId}/create`);
  };

  // Mở modal xác nhận xóa
  const handleDeleteClick = (property: Property) => {
    setPropertyToDelete(property);
    setShowDeleteModal(true);
  };

  // Đóng modal
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setPropertyToDelete(null);
  };

  // Xác nhận xóa
  const confirmDelete = async () => {
    if (!propertyToDelete) return;

    try {
      setDeletingId(propertyToDelete.id);
      setShowDeleteModal(false);
      
      const response = await propertyService.deleteProperty(propertyToDelete.id);
      
      if (response.success) {
        fetchProperties();
        showToast('Xóa bất động sản thành công!', 'success');
      } else {
        showToast(response.message || 'Không thể xóa bất động sản', 'error');
      }
    } catch (err) {
      console.error('Lỗi khi xóa bất động sản:', err);
      showToast('Đã xảy ra lỗi khi xóa bất động sản', 'error');
    } finally {
      setDeletingId(null);
      setPropertyToDelete(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  if (loading && properties.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin w-12 h-12 border-4 border-pink-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Đang tải danh sách bất động sản...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        {/* Tiêu đề */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Quản lý bất động sản
              </h1>
              <p className="text-gray-600">Quản lý danh sách và theo dõi hiệu suất của bất động sản</p>
            </div>
            <button
              onClick={() => router.push('/host/create')}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 font-semibold"
            >
              <span className="text-xl">+</span>
              <span>Thêm bất động sản</span>
            </button>
          </div>

          {/* Thẻ tóm tắt */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-pink-200 hover:shadow-xl transition-all hover:border-pink-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1 font-medium">Tổng số bất động sản</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">{summary.totalProperties}</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-100 to-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-purple-200 hover:shadow-xl transition-all hover:border-purple-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1 font-medium">Lượt xem</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{summary.totalViews.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-pink-200 hover:shadow-xl transition-all hover:border-pink-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1 font-medium">Lượt đặt</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">{summary.totalBookings}</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-100 to-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-purple-200 hover:shadow-xl transition-all hover:border-purple-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1 font-medium">Tổng doanh thu</p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{formatCurrency(summary.totalRevenue)}</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Phân loại theo trạng thái */}
          {summary && summary.byStatus.length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-pink-200">
              <h3 className="text-lg font-semibold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Phân loại theo trạng thái
              </h3>
              <div className="flex flex-wrap gap-4">
                {summary.byStatus.map((status) => (
                  <div key={status.status} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-200">
                    <div className={`w-3 h-3 rounded-full ${
                      status.status.toLowerCase() === 'approved' ? 'bg-green-500' :
                      status.status.toLowerCase() === 'pending' ? 'bg-yellow-500' :
                      status.status.toLowerCase() === 'draft' ? 'bg-gray-400' :
                      'bg-red-500'
                    }`}></div>
                    <span className="font-medium text-gray-700">
                      {status.status === 'approved' ? 'Đã duyệt' :
                       status.status === 'pending' ? 'Chờ duyệt' :
                       status.status === 'draft' ? 'Bản nháp' : 'Từ chối'}:
                    </span>
                    <span className="font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">{status.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bộ lọc */}
        <FilterPanel
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onReset={handleResetFilters}
        />

        {/* Thông báo lỗi */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Danh sách bất động sản */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg animate-pulse overflow-hidden border-2 border-pink-200">
                <div className="h-48 bg-gradient-to-br from-pink-200 to-purple-200"></div>
                <div className="p-4">
                  <div className="h-4 bg-gradient-to-r from-pink-200 to-purple-200 rounded mb-2"></div>
                  <div className="h-3 bg-gradient-to-r from-pink-200 to-purple-200 rounded mb-2"></div>
                  <div className="h-3 bg-gradient-to-r from-pink-200 to-purple-200 rounded mb-4"></div>
                  <div className="h-6 bg-gradient-to-r from-pink-200 to-purple-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : properties.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {properties.map((property) => (
         <PropertyCard 
  key={property.id}
  property={property}
  onAddRoom={handleAddRoom}
  onEdit={handleUpdate}
  onDelete={() => handleDeleteClick(property)}
  onSubmitForReview={handleSubmitForReview}
  isDeleting={deletingId === property.id}
  isSubmitting={submittingId === property.id}
/>
              ))}
            </div>

            {/* Phân trang */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mb-4">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 border-2 border-pink-200 shadow-md hover:shadow-lg'
                  }`}
                >
                  ← Trước
                </button>

                <div className="flex gap-1">
                  {[...Array(Math.min(5, totalPages))].map((_, index) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = index + 1;
                    } else if (currentPage <= 3) {
                      pageNum = index + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + index;
                    } else {
                      pageNum = currentPage - 2 + index;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                          currentPage === pageNum
                            ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
                            : 'bg-white text-gray-700 hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 border-2 border-pink-200 shadow-md hover:shadow-lg'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 border-2 border-pink-200 shadow-md hover:shadow-lg'
                  }`}
                >
                  Sau →
                </button>
              </div>
            )}

            {/* Thông tin kết quả */}
            <div className="text-center text-sm text-gray-600 font-medium">
              Hiển thị {((currentPage - 1) * filters.pageSize) + 1} đến {Math.min(currentPage * filters.pageSize, totalCount)} trong tổng số {totalCount} bất động sản
            </div>
          </>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl shadow-lg border-2 border-pink-200">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">Không tìm thấy bất động sản</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {Object.keys(filters).some(key => key !== 'page' && key !== 'pageSize' && key !== 'sortBy' && key !== 'sortOrder' && (filters as any)[key])
                ? "Không có bất động sản nào phù hợp với bộ lọc hiện tại. Thử điều chỉnh tiêu chí tìm kiếm."
                : "Bạn chưa tạo bất động sản nào. Bắt đầu bằng cách thêm bất động sản đầu tiên."
              }
            </p>
            <button
              onClick={() => router.push('/host/create')}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl font-semibold inline-flex items-center gap-2"
            >
              <span className="text-xl">+</span>
              <span>Tạo bất động sản đầu tiên</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal xác nhận xóa */}
      {showDeleteModal && propertyToDelete && (
        <div className="fixed inset-0 bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-indigo-500/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border-4 border-pink-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">Xác nhận xóa</h3>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-6">
              <p className="text-gray-700 mb-4 text-base">
                Bạn có chắc chắn muốn xóa bất động sản này không?
              </p>
              
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-4 border-2 border-pink-200">
                <div className="flex items-start gap-3">
                  {propertyToDelete.primaryImage ? (
                    <img 
                      src={
                        propertyToDelete.primaryImage.startsWith('/')
                          ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${propertyToDelete.primaryImage}`
                          : propertyToDelete.primaryImage
                      }
                      alt={propertyToDelete.name}
                      className="w-16 h-16 rounded-lg object-cover border-2 border-pink-300 flex-shrink-0"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`w-16 h-16 bg-gradient-to-br from-pink-200 to-purple-200 rounded-lg flex items-center justify-center flex-shrink-0 ${propertyToDelete.primaryImage ? 'hidden' : ''}`}>
                    <svg className="w-8 h-8 text-pink-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 mb-1 truncate">{propertyToDelete.name}</h4>
                    <p className="text-sm text-gray-600 truncate">
                      📍 {propertyToDelete.addressDetail}, {propertyToDelete.commune}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-red-50 border-2 border-red-200 rounded-lg">
                <p className="text-sm text-red-700 font-medium flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Hành động này không thể hoàn tác!
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gradient-to-r from-pink-50 to-purple-50 flex gap-3">
              <button
                onClick={closeDeleteModal}
                className="flex-1 px-4 py-2.5 bg-white text-gray-700 rounded-lg hover:bg-gray-100 transition-all font-semibold border-2 border-gray-300 shadow-md hover:shadow-lg"
              >
                Hủy
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 transition-all font-semibold shadow-lg hover:shadow-xl"
              >
                Xóa ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertiesManagerPage;